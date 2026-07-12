import { useState } from 'react'
import { ScreenHeader, ActionBar } from './ui.jsx'

const RATING_QUESTIONS = [
  { id: 'clear', label: 'Was the route clear?' },
  { id: 'helpful', label: 'Were the explanations helpful?' },
  { id: 'enjoyable', label: 'Did the tour make the museum more enjoyable?' },
]

export default function FeedbackForm({ completedArtworks, onSubmit, onBack, onNewTour }) {
  const [ratings, setRatings] = useState({})
  const [text, setText] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const titles = completedArtworks.map((a) => a.title)

  const setRating = (id, v) => setRatings((r) => ({ ...r, [id]: v }))
  const setField = (id, v) => setText((t) => ({ ...t, [id]: v }))

  const handleSubmit = () => {
    // No backend: store in temporary state only, then show thank-you.
    onSubmit?.({ ratings, ...text })
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <div className="app-frame">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="animate-scaleIn mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 bg-gold/5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 13l4 4L19 7" stroke="#B08A4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="animate-fadeUp font-serif text-[30px] leading-tight text-charcoal">
            Thank you for your feedback
          </h1>
          <p className="animate-fadeUp mt-2 text-[15px] text-stone">
            It helps make every tour better.
          </p>
        </div>
        <ActionBar>
          <button className="btn-primary" onClick={onNewTour}>
            Start new tour
          </button>
        </ActionBar>
      </div>
    )
  }

  return (
    <div className="app-frame">
      <ScreenHeader
        eyebrow="One last thing"
        title="How was your tour?"
        onBack={onBack}
      />

      <div className="flex-1 space-y-7 px-6 pb-6 pt-7">
        {/* Rating questions */}
        <div className="space-y-5">
          {RATING_QUESTIONS.map((q) => (
            <div key={q.id}>
              <p className="mb-2.5 text-[15px] font-medium text-ink">{q.label}</p>
              <StarRow value={ratings[q.id] || 0} onChange={(v) => setRating(q.id, v)} />
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* Selection: favorite / memorable / skipped */}
        <SelectField
          label="Favorite artwork"
          options={titles}
          value={text.favorite}
          onChange={(v) => setField('favorite', v)}
        />
        <SelectField
          label="Most memorable artwork"
          options={titles}
          value={text.memorable}
          onChange={(v) => setField('memorable', v)}
        />
        <SelectField
          label="Which artwork did you skip?"
          options={titles}
          value={text.skipped}
          onChange={(v) => setField('skipped', v)}
        />

        <TextField
          label="What was confusing?"
          placeholder="Optional"
          value={text.confusing || ''}
          onChange={(v) => setField('confusing', v)}
        />
        <TextField
          label="Any other comments?"
          placeholder="Optional"
          value={text.comments || ''}
          onChange={(v) => setField('comments', v)}
        />
      </div>

      <ActionBar>
        <button className="btn-primary" onClick={handleSubmit}>
          Submit feedback
        </button>
      </ActionBar>
    </div>
  )
}

function StarRow({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className="transition-transform active:scale-90"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill={n <= value ? '#B08A4F' : 'none'}>
            <path
              d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5z"
              stroke={n <= value ? '#B08A4F' : '#D9CFBE'}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

function SelectField({ label, options, value, onChange }) {
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-line bg-white/70 px-4 py-3.5 text-[15px] text-charcoal shadow-card focus:border-charcoal focus:outline-none"
        >
          <option value="">Select an artwork</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mist"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

function TextField({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      <textarea
        rows={2}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-line bg-white/70 px-4 py-3 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
      />
    </div>
  )
}
