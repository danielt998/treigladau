import { useState, useRef, useEffect } from 'react'
import { MUTATION_TYPES } from './data/words'
import words from './data/words.json'
import sentences from './data/sentences.json'
import { PREPOSITION_SETS, PREPOSITION_ITEMS } from './data/prepositions'
import { GENDER_OPTIONS, NOUNS, PLURAL_PATTERNS } from './data/nouns'
import './App.css'

const STORAGE_KEY = 'treigladau-progress-v1'
const SPECIAL_TOPIC_META = {
  none: {
    key: 'none',
    label: 'Dim Treiglad',
    english: 'No Mutation',
  },
  preposition: {
    key: 'preposition',
    label: 'Arddodiad',
    english: 'Preposition',
  },
  gender: {
    key: 'gender',
    label: 'Rhyw',
    english: 'Gender',
  },
  plural: {
    key: 'plural',
    label: 'Lluosog',
    english: 'Plural',
  },
}
const MODE_META = {
  quiz: 'Mutation',
  context: 'Context',
  preposition: 'Preposition',
  gender: 'Gender',
  plural: 'Plural',
}

// Accept answers that differ only in Welsh diacritics (ŵ→w, ŷ→y, etc.)
function normalizeWelsh(str) {
  return str
    .toLowerCase()
    .replace(/[âàáä]/g, 'a')
    .replace(/[êèéë]/g, 'e')
    .replace(/[îìíï]/g, 'i')
    .replace(/[ôòóö]/g, 'o')
    .replace(/[ûùúü]/g, 'u')
    .replace(/ŵ/g, 'w')
    .replace(/ŷ/g, 'y')
}

function createEmptyProgress() {
  return {
    version: 1,
    total: { correct: 0, total: 0 },
    byMutationType: {},
    byTrigger: {},
    items: {},
    recent: [],
  }
}

function loadProgress() {
  if (typeof window === 'undefined') return createEmptyProgress()

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) return createEmptyProgress()

  try {
    const parsed = JSON.parse(saved)
    if (!parsed || parsed.version !== 1) return createEmptyProgress()

    return {
      version: 1,
      total: parsed.total ?? { correct: 0, total: 0 },
      byMutationType: parsed.byMutationType ?? {},
      byTrigger: parsed.byTrigger ?? {},
      items: parsed.items ?? {},
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
    }
  } catch (error) {
    console.error('Unable to load saved progress.', error)
    return createEmptyProgress()
  }
}

function saveProgress(progress) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Unable to save progress.', error)
  }
}

function nextStats(stats, correct) {
  return {
    correct: (stats?.correct ?? 0) + (correct ? 1 : 0),
    total: (stats?.total ?? 0) + 1,
  }
}

function toPercent(stats) {
  return stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null
}

function mutationKey(type) {
  return type ?? 'none'
}

function getMutationMeta(type) {
  if (!type || SPECIAL_TOPIC_META[type]) {
    return SPECIAL_TOPIC_META[type ?? 'none']
  }

  return {
    key: type,
    ...MUTATION_TYPES[type],
  }
}

function sentencePrompt(parts) {
  return `${parts[0]}____${parts[1]}`
}

function getModeLabel(mode) {
  return MODE_META[mode] ?? 'Practice'
}

function normalizeAnswer(str) {
  return normalizeWelsh(str).replace(/\s+/g, ' ').trim()
}

function matchesAnswer(input, answers) {
  const normalizedInput = normalizeAnswer(input)
  return answers.some(answer => normalizeAnswer(answer) === normalizedInput)
}

function pickPreposition(prev = null, filter = 'all') {
  const pool = PREPOSITION_ITEMS.filter(item => filter === 'all' || item.familyKey === filter)
  const available = prev
    ? pool.filter(item => item.id !== prev.id)
    : pool
  const source = available.length ? available : pool
  return source[Math.floor(Math.random() * source.length)]
}

function pickNoun(prev = null, filter = 'all', mode = 'gender') {
  const pool = NOUNS.filter(noun => {
    if (filter === 'all') return true
    return mode === 'gender'
      ? noun.gender === filter
      : noun.pluralPatternKey === filter
  })
  const available = prev
    ? pool.filter(noun => noun.id !== prev.id)
    : pool
  const source = available.length ? available : pool
  return source[Math.floor(Math.random() * source.length)]
}

function recordProgress(progress, attempt) {
  const item = progress.items[attempt.id] ?? {
    id: attempt.id,
    mode: attempt.mode,
    label: attempt.label,
    prompt: attempt.prompt,
    answer: attempt.answer,
    mutationType: attempt.mutationType,
    trigger: attempt.trigger,
    hint: attempt.hint,
    correct: 0,
    total: 0,
  }

  const updatedItem = {
    ...item,
    label: attempt.label,
    prompt: attempt.prompt,
    answer: attempt.answer,
    mutationType: attempt.mutationType,
    trigger: attempt.trigger,
    hint: attempt.hint,
    lastInput: attempt.input,
    lastResult: attempt.correct ? 'correct' : 'incorrect',
    lastSeenAt: attempt.seenAt,
    correct: item.correct + (attempt.correct ? 1 : 0),
    total: item.total + 1,
  }

  return {
    ...progress,
    total: nextStats(progress.total, attempt.correct),
    byMutationType: {
      ...progress.byMutationType,
      [attempt.mutationType]: nextStats(progress.byMutationType[attempt.mutationType], attempt.correct),
    },
    byTrigger: attempt.trigger
      ? {
          ...progress.byTrigger,
          [attempt.trigger]: nextStats(progress.byTrigger[attempt.trigger], attempt.correct),
        }
      : progress.byTrigger,
    items: {
      ...progress.items,
      [attempt.id]: updatedItem,
    },
    recent: [
      {
        id: attempt.id,
        mode: attempt.mode,
        label: attempt.label,
        prompt: attempt.prompt,
        answer: attempt.answer,
        input: attempt.input,
        correct: attempt.correct,
        mutationType: attempt.mutationType,
        trigger: attempt.trigger,
        seenAt: attempt.seenAt,
      },
      ...progress.recent,
    ].slice(0, 30),
  }
}

function useProgressTracker() {
  const [progress, setProgress] = useState(loadProgress)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  return {
    progress,
    recordAttempt: attempt => setProgress(current => recordProgress(current, attempt)),
    resetProgress: () => setProgress(createEmptyProgress()),
  }
}

function pickQuestion(prev = null, filter = 'all') {
  const pool = []
  words.forEach((w, wordIndex) => {
    Object.keys(w.mutations).forEach(mutationType => {
      if (filter === 'all' || filter === mutationType) {
        pool.push({ wordIndex, mutationType })
      }
    })
  })
  const available = prev
    ? pool.filter(q => !(q.wordIndex === prev.wordIndex && q.mutationType === prev.mutationType))
    : pool
  const source = available.length ? available : pool
  return source[Math.floor(Math.random() * source.length)]
}

function CurrentRecord({ label, stats }) {
  if (!stats?.total) return null

  return (
    <p className="record-note">
      {label}: <strong>{stats.correct}/{stats.total}</strong> · {toPercent(stats)}%
    </p>
  )
}

// ── Reference card ────────────────────────────────────────────────────────────
function Reference() {
  const tables = [
    {
      type: 'soft',
      rules: [
        ['p', 'b'], ['t', 'd'], ['c', 'g'],
        ['b', 'f'], ['d', 'dd'], ['g', '∅'],
        ['m', 'f'], ['ll', 'l'], ['rh', 'r'],
      ],
    },
    {
      type: 'aspirate',
      rules: [['p', 'ph'], ['t', 'th'], ['c', 'ch']],
    },
    {
      type: 'nasal',
      rules: [
        ['p', 'mh'], ['t', 'nh'], ['c', 'ngh'],
        ['b', 'm'], ['d', 'n'], ['g', 'ng'],
      ],
    },
  ]

  const triggers = [
    {
      type: 'soft',
      items: [
        { trigger: 'yn', note: 'predicative particle — mae hi\'n dda' },
        { trigger: 'i, o, am, ar, at, dan, dros, drwy, heb, tan, wrth', note: 'common prepositions' },
        { trigger: 'ei … (e/o)', note: 'his (3rd person masc. possessive)' },
        { trigger: 'dy', note: 'your (informal 2nd person possessive)' },
        { trigger: 'dau / dwy', note: 'two (masc. / fem.)' },
        { trigger: 'feminine singular noun', note: 'adjective following a feminine singular noun' },
        { trigger: 'y / yr', note: 'definite article before a feminine singular noun' },
      ],
    },
    {
      type: 'aspirate',
      items: [
        { trigger: 'ei … (hi)', note: 'her (3rd person fem. possessive)' },
        { trigger: 'â / ag', note: 'with / as' },
        { trigger: 'a', note: 'and — only before c, p, t' },
        { trigger: 'tua', note: 'towards, about (approximation)' },
        { trigger: 'gyda / â', note: 'â causes aspirate; gyda does not trigger mutation' },
      ],
    },
    {
      type: 'nasal',
      items: [
        { trigger: 'yn / ym / yng', note: 'in — assimilates: ym before m/mh, yng before ng/ngh' },
        { trigger: 'fy', note: 'my (1st person possessive)' },
      ],
    },
  ]

  return (
    <div className="reference">
      <h2>Rheolau Treiglo · Mutation Rules</h2>
      <div className="ref-tables">
        {tables.map(({ type, rules }) => (
          <section key={type}>
            <span className={`badge ${type}`}>
              {MUTATION_TYPES[type].label} · {MUTATION_TYPES[type].english}
            </span>
            <table>
              <thead>
                <tr>
                  <th>Cychwynnol / Initial</th>
                  <th>Ar ôl treiglad / Mutated</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(([from, to]) => (
                  <tr key={from}>
                    <td><code>{from}–</code></td>
                    <td><code>{to === '∅' ? '∅ (disappears)' : `${to}–`}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <h2 className="ref-subtitle">Pryd i Dreiglo · When to Mutate</h2>
      <div className="ref-tables">
        {triggers.map(({ type, items }) => (
          <section key={type}>
            <span className={`badge ${type}`}>
              {MUTATION_TYPES[type].label} · {MUTATION_TYPES[type].english}
            </span>
            <table>
              <thead>
                <tr>
                  <th>Sbardun / Trigger</th>
                  <th>Nodyn / Note</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ trigger, note }) => (
                  <tr key={trigger}>
                    <td><code>{trigger}</code></td>
                    <td>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <h2 className="ref-subtitle">Arddodiaid â Rhagenwau · Prepositions with Pronouns</h2>
      <div className="ref-tables">
        {PREPOSITION_SETS.map(({ key, label, meaning, note, forms }) => (
          <section key={key}>
            <span className="badge preposition">
              {label} · {meaning}
            </span>
            <table>
              <thead>
                <tr>
                  <th>Meaning</th>
                  <th>Welsh form</th>
                </tr>
              </thead>
              <tbody>
                {forms.map(form => (
                  <tr key={form.personKey}>
                    <td>{form.englishPrompt}</td>
                    <td><code>{form.answer}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ref-note">{note}</p>
          </section>
        ))}
      </div>

      <h2 className="ref-subtitle">Rhyw Enwau · Noun Gender</h2>
      <div className="ref-tables">
        <section>
          <table>
            <thead>
              <tr>
                <th>Noun</th>
                <th>Meaning</th>
                <th>Gender</th>
              </tr>
            </thead>
            <tbody>
              {NOUNS.map(noun => (
                <tr key={noun.id}>
                  <td><code>{noun.word}</code></td>
                  <td>{noun.meaning}</td>
                  <td>{GENDER_OPTIONS[noun.gender].english}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <h2 className="ref-subtitle">Lluosogion · Plurals</h2>
      <div className="ref-tables">
        <section>
          <table>
            <thead>
              <tr>
                <th>Singular</th>
                <th>Plural</th>
                <th>Pattern</th>
              </tr>
            </thead>
            <tbody>
              {NOUNS.map(noun => (
                <tr key={`${noun.id}:plural`}>
                  <td><code>{noun.word}</code></td>
                  <td><code>{noun.plural}</code></td>
                  <td>{noun.pluralPatternLabel.replace('Plural pattern: ', '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
function Quiz({ progress, recordAttempt }) {
  const [filter, setFilter] = useState('all')
  const [question, setQuestion] = useState(() => pickQuestion(null, 'all'))
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'incorrect'
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const inputRef = useRef(null)
  const buttonRef = useRef(null)

  const wordObj = words[question.wordIndex]
  const correctAnswer = wordObj.mutations[question.mutationType]
  const mutInfo = MUTATION_TYPES[question.mutationType]
  const itemId = `quiz:${question.mutationType}:${wordObj.word}`
  const itemRecord = progress.items[itemId]

  useEffect(() => {
    if (feedback) buttonRef.current?.focus()
    else inputRef.current?.focus()
  }, [feedback, question])

  const next = () => {
    setQuestion(pickQuestion(question, filter))
    setInput('')
    setFeedback(null)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (feedback) { next(); return }

    const trimmedInput = input.trim()
    const correct = matchesAnswer(trimmedInput, [correctAnswer])

    setFeedback(correct ? 'correct' : 'incorrect')
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setStreak(s => correct ? s + 1 : 0)
    recordAttempt({
      id: itemId,
      mode: 'quiz',
      label: `${wordObj.word} · ${mutInfo.english}`,
      prompt: wordObj.word,
      answer: correctAnswer,
      input: trimmedInput,
      correct,
      mutationType: mutationKey(question.mutationType),
      trigger: null,
      hint: wordObj.meaning,
      seenAt: new Date().toISOString(),
    })
  }

  const applyFilter = f => {
    setFilter(f)
    setQuestion(pickQuestion(null, f))
    setInput('')
    setFeedback(null)
    setScore({ correct: 0, total: 0 })
    setStreak(0)
  }

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null

  return (
    <div className="quiz">
      <div className="filter-bar">
        {['all', 'soft', 'aspirate', 'nasal'].map(f => (
          <button
            key={f}
            className={`filter-btn ${f}${filter === f ? ' active' : ''}`}
            onClick={() => applyFilter(f)}
          >
            {f === 'all'      ? 'Pob un · All'
           : f === 'soft'     ? 'Meddal · Soft'
           : f === 'aspirate' ? 'Llaes · Aspirate'
           :                    'Trwynol · Nasal'}
          </button>
        ))}
      </div>

      <div className="score-bar">
        {score.total > 0 && (
          <>
            <span className="score">{score.correct}/{score.total}</span>
            <span className="pct">{pct}%</span>
          </>
        )}
        {streak >= 3 && <span className="streak">🔥 {streak}</span>}
      </div>

      <div className={`q-card${feedback ? ` ${feedback}` : ''}`}>
        <span className={`badge ${question.mutationType}`}>
          {mutInfo.label} · {mutInfo.english}
        </span>

        <div className="word-block">
          <span className="welsh-word">{wordObj.word}</span>
          <span className="meaning">{wordObj.meaning}</span>
        </div>

        <CurrentRecord label="Record for this word + mutation" stats={itemRecord} />

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Teipiwch y treiglad…"
            disabled={!!feedback}
            className={feedback || ''}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button ref={buttonRef} type="submit" className={feedback ? 'next' : ''}>
            {feedback ? 'Nesaf →' : 'Gwirio ✓'}
          </button>
        </form>

        {feedback === 'correct' && (
          <p className="feedback correct">✓ Cywir! — <strong>{correctAnswer}</strong></p>
        )}
        {feedback === 'incorrect' && (
          <p className="feedback incorrect">
            ✗ Anghywir — yr ateb yw <strong>{correctAnswer}</strong>
          </p>
        )}
      </div>
    </div>
  )
}

// ── Context Quiz ──────────────────────────────────────────────────────────────
function ContextQuiz({ progress, recordAttempt }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * sentences.length))
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const inputRef = useRef(null)
  const buttonRef = useRef(null)

  const sentence = sentences[idx]
  const mutationType = mutationKey(sentence.mutationType)
  const trigger = sentence.trigger ?? 'Dim Treiglad · No Trigger'
  const itemId = `context:${sentence.baseWord}:${sentencePrompt(sentence.parts)}`
  const itemRecord = progress.items[itemId]
  const triggerRecord = progress.byTrigger[trigger]

  useEffect(() => {
    if (feedback) buttonRef.current?.focus()
    else inputRef.current?.focus()
  }, [feedback, idx])

  const next = () => {
    setIdx(i => {
      const options = sentences.map((_, j) => j).filter(j => j !== i)
      return options[Math.floor(Math.random() * options.length)]
    })
    setInput('')
    setFeedback(null)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (feedback) { next(); return }

    const trimmedInput = input.trim()
    const correct = matchesAnswer(trimmedInput, [sentence.answer])

    setFeedback(correct ? 'correct' : 'incorrect')
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setStreak(s => correct ? s + 1 : 0)
    recordAttempt({
      id: itemId,
      mode: 'context',
      label: `${sentence.baseWord} · ${trigger}`,
      prompt: sentencePrompt(sentence.parts),
      answer: sentence.answer,
      input: trimmedInput,
      correct,
      mutationType,
      trigger,
      hint: sentence.translation,
      seenAt: new Date().toISOString(),
    })
  }

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null
  const mutInfo = sentence.mutationType ? MUTATION_TYPES[sentence.mutationType] : null

  return (
    <div className="quiz">
      <div className="score-bar">
        {score.total > 0 && (
          <>
            <span className="score">{score.correct}/{score.total}</span>
            <span className="pct">{pct}%</span>
          </>
        )}
        {streak >= 3 && <span className="streak">🔥 {streak}</span>}
      </div>

      <div className={`q-card${feedback ? ` ${feedback}` : ''}`}>
        <CurrentRecord label="Sentence record" stats={itemRecord} />
        <CurrentRecord label="Rule record" stats={triggerRecord} />

        <form onSubmit={handleSubmit} className="ctx-form">
          <p className="ctx-sentence">
            <span>{sentence.parts[0]}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!!feedback}
              className={`ctx-input${feedback ? ` ${feedback}` : ''}`}
              style={{ width: `${Math.max(sentence.answer.length * 1.1 + 1, 6)}ch` }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              aria-label="Type your answer"
            />
            <span>{sentence.parts[1]}</span>
          </p>

          <p className="ctx-translation">{sentence.translation}</p>

          <p className="ctx-hint">
            Ffurf sylfaenol / Base form: <strong>{sentence.baseWord}</strong>{' '}
            <span className="meaning">({sentence.meaning})</span>
          </p>

          <button ref={buttonRef} type="submit" className={feedback ? 'next' : ''}>
            {feedback ? 'Nesaf →' : 'Gwirio ✓'}
          </button>
        </form>

        {feedback && (
          <div className={`feedback ${feedback}`}>
            <p>
              {feedback === 'correct'
                ? <>✓ Cywir! — <strong>{sentence.answer}</strong></>
                : <>✗ Anghywir — yr ateb yw <strong>{sentence.answer}</strong></>}
            </p>
            <div className="trigger-block">
              {mutInfo
                ? <span className={`badge ${sentence.mutationType}`}>{mutInfo.label} · {mutInfo.english}</span>
                : <span className="badge no-mut">Dim Treiglad · No Mutation</span>}
              <p className="trigger-note">{sentence.triggerNote}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PrepositionPractice({ progress, recordAttempt }) {
  const [filter, setFilter] = useState('all')
  const [question, setQuestion] = useState(() => pickPreposition(null, 'all'))
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const inputRef = useRef(null)
  const buttonRef = useRef(null)

  const itemId = `preposition:${question.id}`
  const itemRecord = progress.items[itemId]
  const familyRecord = progress.byTrigger[question.familyLabel]

  useEffect(() => {
    if (feedback) buttonRef.current?.focus()
    else inputRef.current?.focus()
  }, [feedback, question])

  const next = () => {
    setQuestion(pickPreposition(question, filter))
    setInput('')
    setFeedback(null)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (feedback) { next(); return }

    const trimmedInput = input.trim()
    const correct = matchesAnswer(trimmedInput, question.acceptedAnswers)

    setFeedback(correct ? 'correct' : 'incorrect')
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setStreak(s => correct ? s + 1 : 0)
    recordAttempt({
      id: itemId,
      mode: 'preposition',
      label: `${question.preposition} · ${question.personLabel}`,
      prompt: question.englishPrompt,
      answer: question.answer,
      input: trimmedInput,
      correct,
      mutationType: 'preposition',
      trigger: question.familyLabel,
      hint: question.personLabel,
      seenAt: new Date().toISOString(),
    })
  }

  const applyFilter = nextFilter => {
    setFilter(nextFilter)
    setQuestion(pickPreposition(null, nextFilter))
    setInput('')
    setFeedback(null)
    setScore({ correct: 0, total: 0 })
    setStreak(0)
  }

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null

  return (
    <div className="quiz">
      <div className="filter-bar">
        <button
          className={`filter-btn all${filter === 'all' ? ' active' : ''}`}
          onClick={() => applyFilter('all')}
        >
          Pob un · All
        </button>
        {PREPOSITION_SETS.map(set => (
          <button
            key={set.key}
            className={`filter-btn preposition${filter === set.key ? ' active' : ''}`}
            onClick={() => applyFilter(set.key)}
          >
            {set.label} · {set.meaning}
          </button>
        ))}
      </div>

      <div className="score-bar">
        {score.total > 0 && (
          <>
            <span className="score">{score.correct}/{score.total}</span>
            <span className="pct">{pct}%</span>
          </>
        )}
        {streak >= 3 && <span className="streak">🔥 {streak}</span>}
      </div>

      <div className={`q-card${feedback ? ` ${feedback}` : ''}`}>
        <span className="badge preposition">
          Arddodiaid · Prepositions
        </span>

        <div className="prep-prompt">
          <span className="welsh-word">{question.englishPrompt}</span>
          <span className="meaning">{question.personLabel}</span>
          <span className="prep-meta">
            {question.preposition} · {question.meaning}
          </span>
        </div>

        <CurrentRecord label="Record for this phrase" stats={itemRecord} />
        <CurrentRecord label="Preposition family" stats={familyRecord} />

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Teipiwch y ffurf Gymraeg…"
            disabled={!!feedback}
            className={feedback || ''}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button ref={buttonRef} type="submit" className={feedback ? 'next' : ''}>
            {feedback ? 'Nesaf →' : 'Gwirio ✓'}
          </button>
        </form>

        {feedback && (
          <div className={`feedback ${feedback}`}>
            <p>
              {feedback === 'correct'
                ? <>✓ Cywir! — <strong>{question.answer}</strong></>
                : <>✗ Anghywir — yr ateb yw <strong>{question.answer}</strong></>}
            </p>
            <div className="trigger-block">
              <span className="badge preposition">{question.preposition} · {question.meaning}</span>
              <p className="trigger-note">{question.note}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function GenderPractice({ progress, recordAttempt }) {
  const [filter, setFilter] = useState('all')
  const [question, setQuestion] = useState(() => pickNoun(null, 'all', 'gender'))
  const [feedback, setFeedback] = useState(null)
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const firstChoiceRef = useRef(null)
  const buttonRef = useRef(null)

  const itemId = `gender:${question.id}`
  const itemRecord = progress.items[itemId]
  const familyRecord = progress.byTrigger[`Gender: ${GENDER_OPTIONS[question.gender].english}`]

  useEffect(() => {
    if (feedback) buttonRef.current?.focus()
    else firstChoiceRef.current?.focus()
  }, [feedback, question])

  const next = () => {
    setQuestion(pickNoun(question, filter, 'gender'))
    setFeedback(null)
    setSelected('')
  }

  const handleChoice = choice => {
    if (feedback) return

    const correct = choice === question.gender
    const choiceLabel = `${GENDER_OPTIONS[choice].label} · ${GENDER_OPTIONS[choice].english}`
    const answerLabel = `${GENDER_OPTIONS[question.gender].label} · ${GENDER_OPTIONS[question.gender].english}`

    setSelected(choice)
    setFeedback(correct ? 'correct' : 'incorrect')
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setStreak(s => correct ? s + 1 : 0)
    recordAttempt({
      id: itemId,
      mode: 'gender',
      label: `${question.word} · ${question.meaning}`,
      prompt: question.word,
      answer: answerLabel,
      input: choiceLabel,
      correct,
      mutationType: 'gender',
      trigger: `Gender: ${GENDER_OPTIONS[question.gender].english}`,
      hint: question.meaning,
      seenAt: new Date().toISOString(),
    })
  }

  const applyFilter = nextFilter => {
    setFilter(nextFilter)
    setQuestion(pickNoun(null, nextFilter, 'gender'))
    setFeedback(null)
    setSelected('')
    setScore({ correct: 0, total: 0 })
    setStreak(0)
  }

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null

  return (
    <div className="quiz">
      <div className="filter-bar">
        <button
          className={`filter-btn all${filter === 'all' ? ' active' : ''}`}
          onClick={() => applyFilter('all')}
        >
          Pob un · All
        </button>
        {Object.values(GENDER_OPTIONS).map(option => (
          <button
            key={option.key}
            className={`filter-btn gender${filter === option.key ? ' active' : ''}`}
            onClick={() => applyFilter(option.key)}
          >
            {option.label} · {option.english}
          </button>
        ))}
      </div>

      <div className="score-bar">
        {score.total > 0 && (
          <>
            <span className="score">{score.correct}/{score.total}</span>
            <span className="pct">{pct}%</span>
          </>
        )}
        {streak >= 3 && <span className="streak">🔥 {streak}</span>}
      </div>

      <div className={`q-card${feedback ? ` ${feedback}` : ''}`}>
        <span className="badge gender">
          Rhyw · Gender
        </span>

        <div className="prep-prompt">
          <span className="welsh-word">{question.word}</span>
          <span className="meaning">{question.meaning}</span>
          <span className="prep-meta">
            Lluosog / Plural: <strong>{question.plural}</strong>
          </span>
        </div>

        <CurrentRecord label="Record for this noun" stats={itemRecord} />
        <CurrentRecord label="Gender category" stats={familyRecord} />

        <div className="choice-block">
          <p className="choice-prompt">Ai gwrywaidd neu fenywaidd? · Is it masculine or feminine?</p>
          <div className="choice-grid">
            {Object.values(GENDER_OPTIONS).map((option, index) => {
              const isCorrect = feedback && option.key === question.gender
              const isWrongPick = feedback === 'incorrect' && option.key === selected

              return (
                <button
                  key={option.key}
                  ref={index === 0 ? firstChoiceRef : undefined}
                  type="button"
                  className={`choice-btn${isCorrect ? ' correct' : ''}${isWrongPick ? ' incorrect' : ''}`}
                  disabled={!!feedback}
                  onClick={() => handleChoice(option.key)}
                >
                  {option.label} · {option.english}
                </button>
              )
            })}
          </div>
        </div>

        {feedback && (
          <>
            <p className={`feedback ${feedback}`}>
              {feedback === 'correct'
                ? <>✓ Cywir! — <strong>{GENDER_OPTIONS[question.gender].label} · {GENDER_OPTIONS[question.gender].english}</strong></>
                : <>✗ Anghywir — yr ateb yw <strong>{GENDER_OPTIONS[question.gender].label} · {GENDER_OPTIONS[question.gender].english}</strong></>}
            </p>
            <div className="trigger-block">
              <span className="badge gender">{GENDER_OPTIONS[question.gender].label} · {GENDER_OPTIONS[question.gender].english}</span>
              <p className="trigger-note">{question.genderNote}</p>
              <button ref={buttonRef} type="button" className="inline-next-btn" onClick={next}>
                Nesaf →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PluralPractice({ progress, recordAttempt }) {
  const [filter, setFilter] = useState('all')
  const [question, setQuestion] = useState(() => pickNoun(null, 'all', 'plural'))
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const inputRef = useRef(null)
  const buttonRef = useRef(null)

  const itemId = `plural:${question.id}`
  const itemRecord = progress.items[itemId]
  const familyRecord = progress.byTrigger[question.pluralPatternLabel]

  useEffect(() => {
    if (feedback) buttonRef.current?.focus()
    else inputRef.current?.focus()
  }, [feedback, question])

  const next = () => {
    setQuestion(pickNoun(question, filter, 'plural'))
    setInput('')
    setFeedback(null)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (feedback) { next(); return }

    const trimmedInput = input.trim()
    const correct = matchesAnswer(trimmedInput, question.acceptedPlurals)

    setFeedback(correct ? 'correct' : 'incorrect')
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setStreak(s => correct ? s + 1 : 0)
    recordAttempt({
      id: itemId,
      mode: 'plural',
      label: `${question.word} · ${question.meaning}`,
      prompt: question.word,
      answer: question.plural,
      input: trimmedInput,
      correct,
      mutationType: 'plural',
      trigger: question.pluralPatternLabel,
      hint: question.meaning,
      seenAt: new Date().toISOString(),
    })
  }

  const applyFilter = nextFilter => {
    setFilter(nextFilter)
    setQuestion(pickNoun(null, nextFilter, 'plural'))
    setInput('')
    setFeedback(null)
    setScore({ correct: 0, total: 0 })
    setStreak(0)
  }

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null

  return (
    <div className="quiz">
      <div className="filter-bar">
        <button
          className={`filter-btn all${filter === 'all' ? ' active' : ''}`}
          onClick={() => applyFilter('all')}
        >
          Pob un · All
        </button>
        {PLURAL_PATTERNS.map(pattern => (
          <button
            key={pattern.key}
            className={`filter-btn plural${filter === pattern.key ? ' active' : ''}`}
            onClick={() => applyFilter(pattern.key)}
          >
            {pattern.label.replace('Plural pattern: ', '')}
          </button>
        ))}
      </div>

      <div className="score-bar">
        {score.total > 0 && (
          <>
            <span className="score">{score.correct}/{score.total}</span>
            <span className="pct">{pct}%</span>
          </>
        )}
        {streak >= 3 && <span className="streak">🔥 {streak}</span>}
      </div>

      <div className={`q-card${feedback ? ` ${feedback}` : ''}`}>
        <span className="badge plural">
          Lluosogion · Plurals
        </span>

        <div className="prep-prompt">
          <span className="welsh-word">{question.word}</span>
          <span className="meaning">{question.meaning}</span>
          <span className="prep-meta">
            Rhyw / Gender: <strong>{GENDER_OPTIONS[question.gender].english}</strong>
          </span>
        </div>

        <CurrentRecord label="Record for this noun" stats={itemRecord} />
        <CurrentRecord label="Plural pattern" stats={familyRecord} />

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Teipiwch y lluosog…"
            disabled={!!feedback}
            className={feedback || ''}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button ref={buttonRef} type="submit" className={feedback ? 'next' : ''}>
            {feedback ? 'Nesaf →' : 'Gwirio ✓'}
          </button>
        </form>

        {feedback && (
          <div className={`feedback ${feedback}`}>
            <p>
              {feedback === 'correct'
                ? <>✓ Cywir! — <strong>{question.plural}</strong></>
                : <>✗ Anghywir — yr ateb yw <strong>{question.plural}</strong></>}
            </p>
            <div className="trigger-block">
              <span className="badge plural">{question.pluralPatternLabel.replace('Plural pattern: ', '')}</span>
              <p className="trigger-note">{question.pluralNote}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressView({ progress, onReset }) {
  const mutationRows = Object.entries(progress.byMutationType)
    .sort(([, a], [, b]) => (b.total - a.total) || (a.correct / a.total) - (b.correct / b.total))
  const triggerRows = Object.entries(progress.byTrigger)
    .sort(([, a], [, b]) => (b.total - a.total) || (a.correct / a.total) - (b.correct / b.total))
  const practiceItems = Object.values(progress.items)
    .filter(item => item.total > item.correct)
    .sort((a, b) => ((b.total - b.correct) - (a.total - a.correct)) || (a.correct / a.total) - (b.correct / b.total))
    .slice(0, 8)
  const recent = progress.recent.slice(0, 8)
  const totalItems = Object.keys(progress.items).length
  const overallPct = toPercent(progress.total)

  return (
    <div className="progress-view">
      <section className="reference progress-card">
        <div className="progress-header">
          <div>
            <h2>Cofnod Dysgu · Learning Record</h2>
            <p className="progress-copy">
              This is saved in your browser, so mutation cards, sentence prompts, preposition patterns, and noun drills build up over time.
            </p>
          </div>
          {progress.total.total > 0 && (
            <button type="button" className="secondary-btn" onClick={onReset}>
              Clirio'r Cofnod · Reset
            </button>
          )}
        </div>

        {progress.total.total === 0 ? (
          <p className="empty-state">Dim byd eto — answer a few questions and your record will appear here.</p>
        ) : (
          <>
            <div className="progress-overview">
              <div className="metric-card">
                <span className="metric-label">Overall</span>
                <strong>{progress.total.correct}/{progress.total.total}</strong>
                <span>{overallPct}% correct</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Tracked items</span>
                <strong>{totalItems}</strong>
                <span>practice cards</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Tracked patterns</span>
                <strong>{triggerRows.length}</strong>
                <span>rules and preposition families</span>
              </div>
            </div>

            <div className="progress-grid">
              <section className="progress-section">
                <h3>By topic</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutationRows.map(([type, stats]) => {
                      const meta = getMutationMeta(type)

                      return (
                        <tr key={type}>
                          <td>
                            <span className={`badge ${meta.key === 'none' ? 'no-mut' : meta.key}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td>{stats.correct}/{stats.total}</td>
                          <td>{toPercent(stats)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </section>

              <section className="progress-section">
                <h3>By rule / pattern</h3>
                {triggerRows.length === 0 ? (
                  <p className="empty-mini">No rule or pattern data yet.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Score</th>
                        <th>Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {triggerRows.map(([trigger, stats]) => (
                        <tr key={trigger}>
                          <td>{trigger}</td>
                          <td>{stats.correct}/{stats.total}</td>
                          <td>{toPercent(stats)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="progress-section">
                <h3>Needs more practice</h3>
                {practiceItems.length === 0 ? (
                  <p className="empty-mini">No misses recorded yet.</p>
                ) : (
                  <div className="practice-list">
                    {practiceItems.map(item => {
                      const meta = getMutationMeta(item.mutationType)
                      const modeLabel = getModeLabel(item.mode)

                      return (
                        <article key={item.id} className="practice-item">
                          <div className="practice-head">
                            <strong>{item.prompt}</strong>
                            <div className="practice-badges">
                              <span className="mini-badge">{modeLabel}</span>
                              <span className={`badge ${meta.key === 'none' ? 'no-mut' : meta.key}`}>
                                {meta.english}
                              </span>
                            </div>
                          </div>
                          <p>{item.label}</p>
                          <p>
                            {item.correct}/{item.total} correct · {toPercent(item)}% · answer: <strong>{item.answer}</strong>
                          </p>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="progress-section">
                <h3>Recent attempts</h3>
                <div className="recent-list">
                  {recent.map(entry => {
                    const modeLabel = getModeLabel(entry.mode)

                    return (
                      <article key={`${entry.id}:${entry.seenAt}`} className={`recent-item ${entry.correct ? 'correct' : 'incorrect'}`}>
                        <div className="recent-result">{entry.correct ? '✓' : '✗'}</div>
                        <div className="recent-body">
                          <div className="practice-head">
                            <strong>{entry.prompt}</strong>
                            <span className="mini-badge">{modeLabel}</span>
                          </div>
                          <p>
                            You typed <code>{entry.input || '—'}</code> · answer <code>{entry.answer}</code>
                          </p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('quiz')
  const { progress, recordAttempt, resetProgress } = useProgressTracker()

  return (
    <div className="app">
      <header>
        <span className="dragon" aria-hidden="true">🐉</span>
        <div>
          <h1>Treigladau</h1>
          <p>Ymarfer Cymraeg · Welsh Mutation Practice</p>
        </div>
      </header>

      <nav>
        <button className={tab === 'quiz' ? 'active' : ''} onClick={() => setTab('quiz')}>
          Cwis · Quiz
        </button>
        <button className={tab === 'context' ? 'active' : ''} onClick={() => setTab('context')}>
          Cyd-destun · Context
        </button>
        <button className={tab === 'prepositions' ? 'active' : ''} onClick={() => setTab('prepositions')}>
          Arddodiaid · Prepositions
        </button>
        <button className={tab === 'gender' ? 'active' : ''} onClick={() => setTab('gender')}>
          Rhyw · Gender
        </button>
        <button className={tab === 'plurals' ? 'active' : ''} onClick={() => setTab('plurals')}>
          Lluosogion · Plurals
        </button>
        <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}>
          Cofnod · Progress
        </button>
        <button className={tab === 'reference' ? 'active' : ''} onClick={() => setTab('reference')}>
          Cyfeiriad · Reference
        </button>
      </nav>

      <main>
        {tab === 'quiz'      && <Quiz progress={progress} recordAttempt={recordAttempt} />}
        {tab === 'context'   && <ContextQuiz progress={progress} recordAttempt={recordAttempt} />}
        {tab === 'prepositions' && <PrepositionPractice progress={progress} recordAttempt={recordAttempt} />}
        {tab === 'gender'    && <GenderPractice progress={progress} recordAttempt={recordAttempt} />}
        {tab === 'plurals'   && <PluralPractice progress={progress} recordAttempt={recordAttempt} />}
        {tab === 'progress'  && <ProgressView progress={progress} onReset={resetProgress} />}
        {tab === 'reference' && <Reference />}
      </main>
    </div>
  )
}
