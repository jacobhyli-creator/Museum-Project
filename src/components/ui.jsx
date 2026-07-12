// Small shared UI primitives kept together to avoid a sprawl of tiny files.

import { Component } from 'react'

// Catches render/runtime errors in a subtree so a single failing component shows
// a readable message instead of blanking the whole page (there's no other error
// boundary in the app). Used to wrap admin sections.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    // Surface to the console for the full stack while the UI shows a summary.
    console.error('[ErrorBoundary]', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="app-frame">
          <div className="px-6 pt-6">
            <p className="eyebrow mb-2 text-bronze">Something broke</p>
            <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[13px] text-bronze">
              {this.state.error?.message || String(this.state.error)}
            </p>
            {this.state.error?.stack && (
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-white/60 px-3 py-2 text-[11px] text-stone">
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function ScreenHeader({ eyebrow, title, subtitle, onBack }) {
  return (
    <header className="animate-fadeUp px-6 pt-6">
      {onBack && (
        <button onClick={onBack} className="btn-ghost mb-4 flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      )}
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="font-serif text-[32px] leading-[1.1] text-charcoal">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-stone">{subtitle}</p>}
    </header>
  )
}

export function Chip({ active, disabled, children, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`chip ${active ? 'chip-active' : ''} ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      {children}
    </button>
  )
}

export function ThemeTags({ themes = [], max = 4 }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {themes.slice(0, max).map((t) => (
        <span key={t} className="theme-tag">
          {t}
        </span>
      ))}
    </div>
  )
}

export function DifficultyBadge({ level }) {
  const tone =
    level === 'Beginner'
      ? 'text-green-800 bg-green-800/10'
      : level === 'Advanced'
      ? 'text-bronze bg-bronze/10'
      : 'text-stone bg-stone/10'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide ${tone}`}
    >
      {level}
    </span>
  )
}

// Sticky footer action area that respects mobile safe areas.
export function ActionBar({ children }) {
  return (
    <div className="sticky bottom-0 mt-auto border-t border-line bg-canvas/90 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
      {children}
    </div>
  )
}

export function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? 'w-6 bg-charcoal' : i < current ? 'w-1.5 bg-gold' : 'w-1.5 bg-line'
          }`}
        />
      ))}
    </div>
  )
}
