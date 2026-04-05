// Each sentence is split at the blank: parts[0] + [input] + parts[1]
// answer: the correct form to type (same as baseWord if no mutation needed)
// mutationType: 'soft' | 'aspirate' | 'nasal' | null (no mutation)
export const sentences = [
  // ── Soft mutation: after "yn" (predicative particle) ─────────────────────
  {
    parts: ["Mae hi'n ", "."],
    baseWord: "mam", meaning: "mother",
    answer: "fam", mutationType: "soft",
    trigger: "yn (predicative)",
    triggerNote: 'The predicative particle "yn" (shortened to "\'n") triggers soft mutation on the following noun or adjective.',
    translation: "She is a mother.",
  },
  {
    parts: ["Mae e'n ", " mawr."],
    baseWord: "ci", meaning: "dog",
    answer: "gi", mutationType: "soft",
    trigger: "yn (predicative)",
    triggerNote: 'After the predicative "yn", nouns take soft mutation.',
    translation: "He is a big dog.",
  },
  {
    parts: ["Mae'r cae yn ", "."],
    baseWord: "mawr", meaning: "big",
    answer: "fawr", mutationType: "soft",
    trigger: "yn (predicative)",
    triggerNote: 'Adjectives following the predicative "yn" take soft mutation.',
    translation: "The field is big.",
  },
  {
    parts: ["Mae'r dŵr yn ", "."],
    baseWord: "da", meaning: "good",
    answer: "dda", mutationType: "soft",
    trigger: "yn (predicative)",
    triggerNote: 'Adjectives following the predicative "yn" take soft mutation.',
    translation: "The water is good.",
  },

  // ── Soft mutation: after prepositions ─────────────────────────────────────
  {
    parts: ["Aethon ni i ", "."],
    baseWord: "tref", meaning: "town",
    answer: "dref", mutationType: "soft",
    trigger: "i (preposition)",
    triggerNote: 'The preposition "i" (to) triggers soft mutation on the following word.',
    translation: "We went to town.",
  },
  {
    parts: ["Mae e'n dod o ", "."],
    baseWord: "Bangor", meaning: "Bangor",
    answer: "Fangor", mutationType: "soft",
    trigger: "o (preposition)",
    triggerNote: 'The preposition "o" (from) triggers soft mutation.',
    translation: "He comes from Bangor.",
  },
  {
    parts: ["Mae'r llyfr ar y ", "."],
    baseWord: "bwrdd", meaning: "table",
    answer: "fwrdd", mutationType: "soft",
    trigger: "ar (preposition)",
    triggerNote: 'The preposition "ar" (on) triggers soft mutation.',
    translation: "The book is on the table.",
  },
  {
    parts: ["Siaradoch chi am y ", "?"],
    baseWord: "taith", meaning: "journey",
    answer: "daith", mutationType: "soft",
    trigger: "am (preposition)",
    triggerNote: 'The preposition "am" (about) triggers soft mutation.',
    translation: "Did you talk about the journey?",
  },

  // ── Soft mutation: after "ei" (his) ───────────────────────────────────────
  {
    parts: ["Dyma ei ", " e."],
    baseWord: "car", meaning: "car",
    answer: "gar", mutationType: "soft",
    trigger: "ei (his)",
    triggerNote: '"Ei" (his) triggers soft mutation on the following noun.',
    translation: "Here is his car.",
  },
  {
    parts: ["Mae ei ", " yn dda."],
    baseWord: "tad", meaning: "father",
    answer: "dad", mutationType: "soft",
    trigger: "ei (his)",
    triggerNote: '"Ei" (his) triggers soft mutation.',
    translation: "His father is good.",
  },

  // ── Soft mutation: after "dau / dwy" (two) ────────────────────────────────
  {
    parts: ["Mae dau ", " yn y parc."],
    baseWord: "ci", meaning: "dog",
    answer: "gi", mutationType: "soft",
    trigger: "dau (two, masculine)",
    triggerNote: '"Dau" (two, masculine) triggers soft mutation on the following noun.',
    translation: "There are two dogs in the park.",
  },
  {
    parts: ["Mae dwy ", " yn y cae."],
    baseWord: "dafad", meaning: "sheep",
    answer: "ddafad", mutationType: "soft",
    trigger: "dwy (two, feminine)",
    triggerNote: '"Dwy" (two, feminine) triggers soft mutation.',
    translation: "There are two sheep in the field.",
  },

  // ── Aspirate mutation: after "ei" (her) ───────────────────────────────────
  {
    parts: ["Dyma ei ", " hi."],
    baseWord: "car", meaning: "car",
    answer: "char", mutationType: "aspirate",
    trigger: "ei (her)",
    triggerNote: '"Ei" (her) triggers aspirate mutation on words beginning with c, p, or t. Compare: "ei gar e" (his car) vs "ei char hi" (her car).',
    translation: "Here is her car.",
  },
  {
    parts: ["Mae ei ", " hi yn garedig."],
    baseWord: "tad", meaning: "father",
    answer: "thad", mutationType: "aspirate",
    trigger: "ei (her)",
    triggerNote: '"Ei" (her) triggers aspirate mutation. Compare: "ei dad e" (his father) vs "ei thad hi" (her father).',
    translation: "Her father is kind.",
  },

  // ── Aspirate mutation: after "a" (and) ────────────────────────────────────
  {
    parts: ["Bara a ", "."],
    baseWord: "caws", meaning: "cheese",
    answer: "chaws", mutationType: "aspirate",
    trigger: "a (and)",
    triggerNote: 'The conjunction "a" (and) triggers aspirate mutation on words beginning with c, p, or t.',
    translation: "Bread and cheese.",
  },
  {
    parts: ["Te a ", "."],
    baseWord: "coffi", meaning: "coffee",
    answer: "choffi", mutationType: "aspirate",
    trigger: "a (and)",
    triggerNote: 'The conjunction "a" (and) triggers aspirate mutation on words beginning with c, p, or t.',
    translation: "Tea and coffee.",
  },

  // ── Aspirate mutation: after "â" (as / with) ──────────────────────────────
  {
    parts: ["Mae e mor dal â ", "."],
    baseWord: "tŷ", meaning: "house",
    answer: "thŷ", mutationType: "aspirate",
    trigger: "â (as / with)",
    triggerNote: 'The preposition "â" (as/with) triggers aspirate mutation.',
    translation: "He is as tall as a house.",
  },

  // ── Nasal mutation: after "yn" (in, preposition) ──────────────────────────
  {
    parts: ["Dw i'n byw yng ", "."],
    baseWord: "Cymru", meaning: "Wales",
    answer: "Nghymru", mutationType: "nasal",
    trigger: "yn / yng (in)",
    triggerNote: 'The preposition "yn" (in) triggers nasal mutation. Before "ngh", "yn" assimilates to "yng" — so "yn + Cymru" → "yng Nghymru".',
    translation: "I live in Wales.",
  },
  {
    parts: ["Mae e'n gweithio yng ", "."],
    baseWord: "Caerdydd", meaning: "Cardiff",
    answer: "Nghaerdydd", mutationType: "nasal",
    trigger: "yn / yng (in)",
    triggerNote: 'The preposition "yn" (in) triggers nasal mutation. Before "ngh", "yn" assimilates to "yng" — so "yn + Caerdydd" → "yng Nghaerdydd".',
    translation: "He works in Cardiff.",
  },

  // ── Nasal mutation: after "fy" (my) ───────────────────────────────────────
  {
    parts: ["Dyma fy ", "."],
    baseWord: "tad", meaning: "father",
    answer: "nhad", mutationType: "nasal",
    trigger: "fy (my)",
    triggerNote: '"Fy" (my) triggers nasal mutation on the following noun.',
    translation: "This is my father.",
  },
  {
    parts: ["Dw i'n hoffi fy ", "."],
    baseWord: "car", meaning: "car",
    answer: "nghar", mutationType: "nasal",
    trigger: "fy (my)",
    triggerNote: '"Fy" (my) triggers nasal mutation on words beginning with c, g, b, d, p, or t.',
    translation: "I like my car.",
  },

  // ── No mutation ───────────────────────────────────────────────────────────
  {
    parts: ["Mae ", " yn y parc."],
    baseWord: "ci", meaning: "dog",
    answer: "ci", mutationType: null,
    trigger: "subject (no mutation)",
    triggerNote: "The subject of a Welsh sentence does not mutate.",
    translation: "There is a dog in the park.",
  },
  {
    parts: ["Mae ", " ar y bwrdd."],
    baseWord: "llyfr", meaning: "book",
    answer: "llyfr", mutationType: null,
    trigger: "subject (no mutation)",
    triggerNote: "The subject of a Welsh sentence does not mutate.",
    translation: "There is a book on the table.",
  },
  {
    parts: ["Fy ", " sy'n dda."],
    baseWord: "mam", meaning: "mother",
    answer: "mam", mutationType: null,
    trigger: "fy + m (no change)",
    triggerNote: '"Fy" triggers nasal mutation, but "m-" has no nasal mutation form — so "mam" stays unchanged.',
    translation: "My mother is good.",
  },
  {
    parts: ["Dyma'r ", " newydd."],
    baseWord: "car", meaning: "car",
    answer: "car", mutationType: null,
    trigger: "definite article, masculine noun (no mutation)",
    triggerNote: 'After "y/yr" (the), masculine nouns do not mutate. Only feminine singular nouns mutate after the definite article.',
    translation: "Here is the new car.",
  },
]
