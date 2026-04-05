#!/usr/bin/env python3
"""
Generate Welsh mutation data for Treigladau using the OpenAI API.

Usage:
    python scripts/generate_data.py words     --count 20
    python scripts/generate_data.py sentences --count 15
    python scripts/generate_data.py sentences --count 10 --dry-run

Requires:
    OPENAI_API_KEY environment variable (or a .env file)
    pip install openai
"""

import argparse
import json
import os
import re
import sys
import threading
import time
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    sys.exit("openai package not found. Run: pip install openai")

ROOT = Path(__file__).parent.parent
WORDS_FILE = ROOT / "src" / "data" / "words.json"
SENTENCES_FILE = ROOT / "src" / "data" / "sentences.json"

# ── Prompts ───────────────────────────────────────────────────────────────────

WORDS_SYSTEM = """\
You are an expert Welsh language teacher generating data for a Welsh mutation
practice app. You have deep knowledge of Welsh grammar, including all three
mutation types and their edge cases.

Welsh mutation rules:
  Soft (Treiglad Meddal):     p→b, t→d, c→g, b→f, d→dd, g→∅, m→f, ll→l, rh→r
  Aspirate (Treiglad Llaes):  p→ph, t→th, c→ch
  Nasal (Treiglad Trwynol):   p→mh, t→nh, c→ngh, b→m, d→n, g→ng

Important notes:
- Only include mutations that genuinely apply to that initial consonant.
- Vowel-initial words and words starting with other consonants have no mutation.
- "g" under soft mutation disappears entirely (e.g. gardd → ardd).
- Each word object must only have keys for mutations that actually apply.
- Use common, everyday Welsh words a learner would encounter.
- Avoid words already in the existing list (provided below).
"""

WORDS_USER = """\
Generate {count} Welsh words for mutation practice. Avoid these words already
in the dataset: {existing}.

Return ONLY a JSON array with no extra text, matching this schema exactly:
[
  {{
    "word": "string (Welsh base form)",
    "meaning": "string (English meaning)",
    "mutations": {{
      "soft": "string",      // only if initial consonant has soft mutation
      "aspirate": "string",  // only if initial consonant has aspirate mutation
      "nasal": "string"      // only if initial consonant has nasal mutation
    }}
  }}
]

Include a good mix of initial consonants (b, c, d, g, ll, m, p, rh, t).
"""

SENTENCES_SYSTEM = """\
You are an expert Welsh language teacher generating data for a Welsh mutation
practice app. You have deep knowledge of Welsh grammar, including all three
mutation types, their triggers, and when mutation does NOT occur.

Welsh mutation triggers include:
  Soft:     predicative "yn", prepositions (i, o, am, ar, at, dan, dros, drwy,
            heb, tan, wrth), "ei" (his), "dau/dwy" (two), "dy" (your-informal),
            adjectives after feminine singular nouns
  Aspirate: "ei" (her), "â/ag" (with/as), "a" (and) for c/p/t, "tua" (towards)
  Nasal:    "yn/ym/yng" (in), "fy" (my)
  None:     subject of sentence, "y/yr" (the) + masculine noun, consonants
            with no mutation form (e.g. "m" after "fy")

Important: "yn" (in) assimilates before mutations — use "ym" before m/mh,
"yng" before ng/ngh, "yn" before n/nh.
"""

SENTENCES_USER = """\
Generate {count} Welsh fill-in-the-blank sentences for mutation practice.

Include a mix of:
- soft mutation (various triggers)
- aspirate mutation
- nasal mutation
- NO mutation (at least 3 — subject position, masculine noun after "y/yr",
  consonants with no mutation form like "m" after "fy")

Return ONLY a JSON array with no extra text, matching this schema exactly:
[
  {{
    "parts": ["string before blank", "string after blank"],
    "baseWord": "string (Welsh base form shown to learner)",
    "meaning": "string (English meaning of baseWord)",
    "answer": "string (correct mutated form, OR same as baseWord if no mutation)",
    "mutationType": "soft" | "aspirate" | "nasal" | null,
    "trigger": "short label e.g. \\"yn (predicative)\\" or \\"subject (no mutation)\\"",
    "triggerNote": "one sentence explaining why this mutation occurs or doesn't",
    "translation": "English translation of the full sentence"
  }}
]

Use simple, natural Welsh sentences. Avoid repeating base words already used
in these existing sentences: {existing}.
"""

# ── Validation ────────────────────────────────────────────────────────────────

VALID_MUTATION_TYPES = {"soft", "aspirate", "nasal", None}

PLACEHOLDER_RE = re.compile(r'_{2,}|\[.*?\]|___+|\{[^}]+\}')

def fix_parts(obj):
    """If GPT returned parts as a single string with a placeholder, split it."""
    parts = obj.get("parts")
    if isinstance(parts, list) and len(parts) == 2:
        return obj
    if isinstance(parts, str):
        m = PLACEHOLDER_RE.search(parts)
        if m:
            obj["parts"] = [parts[:m.start()], parts[m.end():]]
            return obj
    return obj

def validate_word(obj):
    if not isinstance(obj, dict):
        raise ValueError(f"expected dict, got {type(obj).__name__}")
    if not isinstance(obj.get("word"), str) or not obj["word"]:
        raise ValueError("missing word")
    if not isinstance(obj.get("meaning"), str) or not obj["meaning"]:
        raise ValueError("missing meaning")
    if not isinstance(obj.get("mutations"), dict) or not obj["mutations"]:
        raise ValueError("missing mutations")
    for k in obj["mutations"]:
        if k not in ("soft", "aspirate", "nasal"):
            raise ValueError(f"unknown mutation key: {k}")

def validate_sentence(obj):
    if not isinstance(obj, dict):
        raise ValueError(f"expected dict, got {type(obj).__name__}")
    obj = fix_parts(obj)
    if not (isinstance(obj.get("parts"), list) and len(obj["parts"]) == 2):
        raise ValueError(f"parts must be [before, after], got: {obj.get('parts')!r}")
    if not isinstance(obj.get("baseWord"), str):
        raise ValueError("missing baseWord")
    if not isinstance(obj.get("meaning"), str):
        raise ValueError("missing meaning")
    if not isinstance(obj.get("answer"), str):
        raise ValueError("missing answer")
    if obj.get("mutationType") not in VALID_MUTATION_TYPES:
        raise ValueError(f"invalid mutationType: {obj.get('mutationType')!r}")
    if not isinstance(obj.get("trigger"), str):
        raise ValueError("missing trigger")
    if not isinstance(obj.get("triggerNote"), str):
        raise ValueError("missing triggerNote")
    if not isinstance(obj.get("translation"), str):
        raise ValueError("missing translation")

# ── Spinner ───────────────────────────────────────────────────────────────────

class Spinner:
    FRAMES = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"

    def __init__(self, message):
        self.message = message
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._spin, daemon=True)

    def _spin(self):
        i = 0
        while not self._stop.is_set():
            print(f"\r{self.FRAMES[i % len(self.FRAMES)]}  {self.message}", end="", flush=True)
            i += 1
            time.sleep(0.08)

    def __enter__(self):
        self._thread.start()
        return self

    def __exit__(self, *_):
        self._stop.set()
        self._thread.join()
        print("\r", end="", flush=True)  # clear the spinner line


# ── Generation ────────────────────────────────────────────────────────────────

def generate(client, mode, count, existing_data):
    if mode == "words":
        existing_words = [w["word"] for w in existing_data]
        user_prompt = WORDS_USER.format(count=count, existing=", ".join(existing_words))
        system_prompt = WORDS_SYSTEM
        validator = validate_word
    else:
        existing_words = [s["baseWord"] for s in existing_data]
        user_prompt = SENTENCES_USER.format(count=count, existing=", ".join(existing_words))
        system_prompt = SENTENCES_SYSTEM
        validator = validate_sentence

    model = "gpt-4o-mini"
    print(f"Requesting {count} {mode} from {model}…")
    with Spinner("Waiting for API response"):
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.7,
        )

    raw = response.choices[0].message.content
    print(f"✓ Response received ({len(raw)} chars). Parsing…")

    # Extract the JSON array from the response (handles markdown code fences too)
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if not match:
        sys.exit(f"No JSON array found in response:\n{raw}")
    try:
        parsed = json.loads(match.group())
    except json.JSONDecodeError as e:
        sys.exit(f"Failed to parse JSON: {e}\n\nRaw response:\n{raw}")

    print(f"  {len(parsed)} item(s) found. Validating…")
    valid, errors = [], []
    for i, obj in enumerate(parsed):
        label = obj.get("word") or obj.get("baseWord") or f"item {i}"
        try:
            validator(obj)
            valid.append(obj)
            print(f"  [{i+1:>2}/{len(parsed)}] ✓  {label}")
        except Exception as e:
            errors.append(f"  item {i} ({label}): {e}")
            print(f"  [{i+1:>2}/{len(parsed)}] ✗  {label} — {e}")

    print(f"\n✓ {len(valid)} valid, {len(errors)} skipped.")
    return valid


def deduplicate(existing, new_items, key):
    existing_keys = {item[key] for item in existing}
    added = [item for item in new_items if item[key] not in existing_keys]
    skipped = len(new_items) - len(added)
    if skipped:
        print(f"  Skipped {skipped} duplicate(s).")
    return added


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Welsh mutation data")
    parser.add_argument("mode", choices=["words", "sentences"])
    parser.add_argument("--count", type=int, default=15, help="Items to generate (default: 15)")
    parser.add_argument("--dry-run", action="store_true", help="Print output without writing")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # Try loading from .env in project root
        env_file = ROOT / ".env"
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith("OPENAI_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"')
    if not api_key:
        sys.exit("Set OPENAI_API_KEY as an environment variable or in a .env file.")

    client = OpenAI(api_key=api_key)

    target_file = WORDS_FILE if args.mode == "words" else SENTENCES_FILE
    existing = json.loads(target_file.read_text())

    new_items = generate(client, args.mode, args.count, existing)
    print(f"✓ {len(new_items)} valid item(s) generated.")

    dedup_key = "word" if args.mode == "words" else "baseWord"
    to_add = deduplicate(existing, new_items, dedup_key)

    print(f"\n{'─'*50}")
    print(json.dumps(to_add, ensure_ascii=False, indent=2))
    print(f"{'─'*50}\n")

    if not to_add:
        print("Nothing new to add.")
        return

    if args.dry_run:
        print(f"Dry run — would add {len(to_add)} item(s) to {target_file.name}.")
        return

    answer = input(f"Add {len(to_add)} item(s) to {target_file.name}? [y/N] ").strip().lower()
    if answer != "y":
        print("Aborted.")
        return

    merged = existing + to_add
    target_file.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n")
    print(f"✓ {target_file.name} updated ({len(existing)} → {len(merged)} items).")


if __name__ == "__main__":
    main()
