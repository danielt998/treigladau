import { useState, useRef, useEffect } from 'react'
import { words, MUTATION_TYPES } from './data/words'
import { sentences } from './data/sentences'
import './App.css'

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
    </div>
  )
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
function Quiz() {
  const [filter, setFilter] = useState('all')
  const [question, setQuestion] = useState(() => pickQuestion(null, 'all'))
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'incorrect'
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const inputRef = useRef(null)

  const wordObj = words[question.wordIndex]
  const correctAnswer = wordObj.mutations[question.mutationType]
  const mutInfo = MUTATION_TYPES[question.mutationType]

  useEffect(() => {
    if (!feedback) inputRef.current?.focus()
  }, [feedback, question])

  const next = () => {
    setQuestion(pickQuestion(question, filter))
    setInput('')
    setFeedback(null)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (feedback) { next(); return }

    const correct = normalizeWelsh(input.trim()) === normalizeWelsh(correctAnswer)
    setFeedback(correct ? 'correct' : 'incorrect')
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setStreak(s => correct ? s + 1 : 0)
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
      {/* Filter buttons */}
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

      {/* Score row */}
      <div className="score-bar">
        {score.total > 0 && (
          <>
            <span className="score">{score.correct}/{score.total}</span>
            <span className="pct">{pct}%</span>
          </>
        )}
        {streak >= 3 && <span className="streak">🔥 {streak}</span>}
      </div>

      {/* Question card */}
      <div className={`q-card${feedback ? ` ${feedback}` : ''}`}>
        <span className={`badge ${question.mutationType}`}>
          {mutInfo.label} · {mutInfo.english}
        </span>

        <div className="word-block">
          <span className="welsh-word">{wordObj.word}</span>
          <span className="meaning">{wordObj.meaning}</span>
        </div>

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
          <button type="submit" className={feedback ? 'next' : ''}>
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
function ContextQuiz() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * sentences.length))
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const inputRef = useRef(null)

  const sentence = sentences[idx]

  useEffect(() => {
    if (!feedback) inputRef.current?.focus()
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

    const correct = normalizeWelsh(input.trim()) === normalizeWelsh(sentence.answer)
    setFeedback(correct ? 'correct' : 'incorrect')
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }))
    setStreak(s => correct ? s + 1 : 0)
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
        <form onSubmit={handleSubmit}>
          {/* Sentence with inline input */}
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

          {/* Translation */}
          <p className="ctx-translation">{sentence.translation}</p>

          {/* Base word hint */}
          <p className="ctx-hint">
            Ffurf sylfaenol / Base form: <strong>{sentence.baseWord}</strong>{' '}
            <span className="meaning">({sentence.meaning})</span>
          </p>

          <button type="submit" className={feedback ? 'next' : ''}>
            {feedback ? 'Nesaf →' : 'Gwirio ✓'}
          </button>
        </form>

        {/* Feedback + trigger explanation */}
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


export default function App() {
  const [tab, setTab] = useState('quiz')

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
        <button className={tab === 'reference' ? 'active' : ''} onClick={() => setTab('reference')}>
          Cyfeiriad · Reference
        </button>
      </nav>

      <main>
        {tab === 'quiz'      && <Quiz />}
        {tab === 'context'   && <ContextQuiz />}
        {tab === 'reference' && <Reference />}
      </main>
    </div>
  )
}
