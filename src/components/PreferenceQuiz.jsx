import { useState } from 'react'
import {
  timeOptions,
  interestOptions,
  explanationStyles,
  moodOptions,
  knowledgeLevels,
  routeTypeOptions,
} from '../data/quizOptions.js'
import { getMuseum, getExhibition } from '../data/museums.js'
import { Chip, ActionBar, ProgressDots } from './ui.jsx'

// The quiz is split into short steps so it never feels like a long form.
const STEPS = ['time', 'interests', 'routeType', 'style', 'mood', 'knowledge']

export default function PreferenceQuiz({
  museumId,
  exhibitionId,
  prefs,
  setPrefs,
  onGenerate,
  onBack,
  onChangeExhibition,
}) {
  const [step, setStep] = useState(0)
  const [showMore, setShowMore] = useState(false) // interests: "More interests" expander
  const museum = getMuseum(museumId)
  const exhibition = getExhibition(exhibitionId)
  const key = STEPS[step]

  // Popular interests are always visible; the rest live behind an expander.
  // Selections are keyed on `value` in parent state, so collapsing never clears them.
  const popularInterests = interestOptions.filter((o) => o.tier === 'popular')
  const moreInterests = interestOptions.filter((o) => o.tier !== 'popular')

  const toggleInterest = (value) => {
    setPrefs((p) => {
      const has = p.interests.includes(value)
      return {
        ...p,
        interests: has
          ? p.interests.filter((x) => x !== value)
          : [...p.interests, value],
      }
    })
  }

  // Each step requires a valid selection before continuing (interests +
  // route type are optional — the engine falls back to neutral fits).
  const canAdvance = {
    time: !!prefs.time,
    interests: true,
    routeType: true,
    style: !!prefs.style,
    mood: !!prefs.mood,
    knowledge: !!prefs.knowledge,
  }[key]

  const isLast = step === STEPS.length - 1
  const next = () => (isLast ? onGenerate() : setStep((s) => s + 1))
  const back = () => (step === 0 ? onBack() : setStep((s) => s - 1))

  return (
    <div className="app-frame">
      {/* Context bar */}
      <div className="animate-fadeIn px-6 pt-6">
        <button onClick={back} className="btn-ghost mb-4 flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-charcoal">{museum?.name}</p>
            <p className="text-[13px] text-stone">{exhibition?.title}</p>
          </div>
          <button onClick={onChangeExhibition} className="btn-ghost text-bronze">
            Change exhibition
          </button>
        </div>
        <div className="mt-5">
          <ProgressDots total={STEPS.length} current={step} />
        </div>
      </div>

      <div key={key} className="flex-1 animate-fadeUp px-6 pt-7">
        {key === 'time' && (
          <QuizStep
            title="How much time do you have today?"
            hint="We'll size your route to fit."
          >
            <div className="grid grid-cols-1 gap-3">
              {timeOptions.map((o) => (
                <SelectTile
                  key={o.value}
                  active={prefs.time === o.value}
                  onClick={() => setPrefs((p) => ({ ...p, time: o.value }))}
                  label={o.label}
                  meta={`${o.artworks} artworks`}
                />
              ))}
            </div>
          </QuizStep>
        )}

        {key === 'interests' && (
          <QuizStep
            title="What kind of art would you most like to see today?"
            hint="Pick 3–5 interests. You can choose both visual styles and ideas."
          >
            <div className="flex flex-wrap gap-2.5">
              {popularInterests.map((o) => (
                <Chip
                  key={o.value}
                  active={prefs.interests.includes(o.value)}
                  onClick={() => toggleInterest(o.value)}
                  title={o.hint}
                >
                  {o.label}
                </Chip>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
              className="btn-ghost mt-4 flex items-center gap-1.5 text-bronze"
            >
              {showMore ? 'Fewer interests' : 'More interests'}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className={`transition-transform ${showMore ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showMore && (
              <div className="mt-4 flex animate-fadeUp flex-wrap gap-2.5">
                {moreInterests.map((o) => (
                  <Chip
                    key={o.value}
                    active={prefs.interests.includes(o.value)}
                    onClick={() => toggleInterest(o.value)}
                    title={o.hint}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            )}
          </QuizStep>
        )}

        {key === 'routeType' && (
          <QuizStep
            title="What kind of route do you want?"
            hint="Optional — pick a focus, or skip to let us balance it."
          >
            <div className="grid grid-cols-1 gap-3">
              {routeTypeOptions.map((o) => (
                <SelectTile
                  key={o.value}
                  active={prefs.routeType === o.value}
                  onClick={() =>
                    setPrefs((p) => ({
                      ...p,
                      routeType: p.routeType === o.value ? null : o.value,
                    }))
                  }
                  label={o.label}
                  meta={o.description}
                  stacked
                />
              ))}
            </div>
          </QuizStep>
        )}

        {key === 'style' && (
          <QuizStep
            title="How would you like the artworks explained?"
            hint="Pick one style."
          >
            <div className="flex flex-wrap gap-2.5">
              {explanationStyles.map((o) => (
                <Chip
                  key={o.value}
                  active={prefs.style === o.value}
                  onClick={() => setPrefs((p) => ({ ...p, style: o.value }))}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </QuizStep>
        )}

        {key === 'mood' && (
          <QuizStep title="What is your current museum mood?">
            <div className="grid grid-cols-1 gap-3">
              {moodOptions.map((o) => (
                <SelectTile
                  key={o.value}
                  active={prefs.mood === o.value}
                  onClick={() => setPrefs((p) => ({ ...p, mood: o.value }))}
                  label={o.label}
                />
              ))}
            </div>
          </QuizStep>
        )}

        {key === 'knowledge' && (
          <QuizStep title="How familiar are you with art?">
            <div className="grid grid-cols-1 gap-3">
              {knowledgeLevels.map((o) => (
                <SelectTile
                  key={o.value}
                  active={prefs.knowledge === o.value}
                  onClick={() => setPrefs((p) => ({ ...p, knowledge: o.value }))}
                  label={o.label}
                />
              ))}
            </div>
          </QuizStep>
        )}
      </div>

      <ActionBar>
        <button className="btn-primary" disabled={!canAdvance} onClick={next}>
          {isLast ? 'Generate Route' : 'Continue'}
        </button>
      </ActionBar>
    </div>
  )
}

function QuizStep({ title, hint, children }) {
  return (
    <div>
      <h2 className="font-serif text-[27px] leading-tight text-charcoal">{title}</h2>
      {hint && <p className="mt-2 text-[14px] text-stone">{hint}</p>}
      <div className="mt-6">{children}</div>
    </div>
  )
}

function SelectTile({ active, onClick, label, meta, stacked }) {
  const check = (
    <span
      className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors ${
        active ? 'border-charcoal bg-charcoal' : 'border-line'
      }`}
    >
      {active && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 13l4 4L19 7" stroke="#F7F3EC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )

  // Stacked variant: label on top, description wrapping below (for route types).
  if (stacked) {
    return (
      <button
        onClick={onClick}
        className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition-all duration-200 active:scale-[0.99]
          ${active ? 'border-charcoal bg-white shadow-lift' : 'border-line bg-white/60 shadow-card'}`}
      >
        <span className="min-w-0">
          <span className="block text-[16px] font-medium text-charcoal">{label}</span>
          {meta && <span className="mt-0.5 block text-[13px] leading-snug text-stone">{meta}</span>}
        </span>
        {check}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-200 active:scale-[0.99]
        ${active ? 'border-charcoal bg-white shadow-lift' : 'border-line bg-white/60 shadow-card'}`}
    >
      <span className="text-[16px] font-medium text-charcoal">{label}</span>
      <span className="flex items-center gap-3">
        {meta && <span className="text-[12px] text-mist">{meta}</span>}
        {check}
      </span>
    </button>
  )
}
