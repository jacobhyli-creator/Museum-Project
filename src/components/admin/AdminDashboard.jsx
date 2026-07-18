import { useState } from 'react'
import { signOut } from '../../lib/adminAuth.js'
import { ErrorBoundary } from '../ui.jsx'
import ArtworkList from './ArtworkList.jsx'
import ArtworkEditor from './ArtworkEditor.jsx'
import ImageReview from './ImageReview.jsx'
import ImageAudit from './ImageAudit.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import MLDashboard from './MLDashboard.jsx'
import LearningDashboard from './LearningDashboard.jsx'
import AudioNarration from './AudioNarration.jsx'
import ExplanationImport from './ExplanationImport.jsx'
import LookCloserAdmin from './LookCloserAdmin.jsx'

// Admin shell: top bar (signed-in email + sign out), a section nav, and the
// active section's content. Artworks, Images, Analytics, and ML are live; Rooms
// and Rules remain disabled "Coming soon" chips so the roadmap stays visible.
//
// Internal sub-navigation for the Artworks section is a simple list <-> editor
// toggle held in local state (no router library).
const SECTIONS = [
  { key: 'artworks', label: 'Artworks', enabled: true },
  { key: 'images', label: 'Images', enabled: true },
  { key: 'audit', label: 'Image Audit', enabled: true },
  { key: 'audio', label: 'Audio', enabled: true },
  { key: 'lookCloser', label: 'Look Closer', enabled: true },
  { key: 'import', label: 'Import', enabled: true },
  { key: 'rooms', label: 'Rooms', enabled: false },
  { key: 'rules', label: 'Rules', enabled: false },
  { key: 'analytics', label: 'Analytics', enabled: true },
  { key: 'ml', label: 'ML', enabled: true },
  { key: 'learning', label: 'Learning & Personalization', enabled: true },
]

export default function AdminDashboard({ email }) {
  const [section, setSection] = useState('artworks')
  const [editingId, setEditingId] = useState(null) // null = list view

  return (
    <div className="app-frame">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-line px-6 pb-4 pt-6">
        <div className="min-w-0">
          <p className="eyebrow">Admin</p>
          <p className="truncate text-[13px] text-stone">{email}</p>
        </div>
        <button className="btn-ghost shrink-0" onClick={() => signOut()}>
          Sign out
        </button>
      </header>

      {/* Section nav */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-6 py-3">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            disabled={!s.enabled}
            onClick={() => {
              if (!s.enabled) return
              setSection(s.key)
              setEditingId(null)
            }}
            className={`chip shrink-0 ${section === s.key ? 'chip-active' : ''} ${
              s.enabled ? '' : 'opacity-40'
            }`}
            title={s.enabled ? undefined : 'Coming soon'}
          >
            {s.label}
            {!s.enabled && <span className="ml-1 text-[10px]">soon</span>}
          </button>
        ))}
      </div>

      {/* Active section */}
      <ErrorBoundary key={`${section}-${editingId || 'list'}`}>
        {section === 'artworks' &&
          (editingId ? (
            <ArtworkEditor artworkId={editingId} onBack={() => setEditingId(null)} />
          ) : (
            <ArtworkList onOpen={(id) => setEditingId(id)} />
          ))}
        {section === 'images' && <ImageReview />}
        {section === 'audit' && <ImageAudit />}
        {section === 'audio' && <AudioNarration />}
        {section === 'lookCloser' && <LookCloserAdmin />}
        {section === 'import' && <ExplanationImport />}
        {section === 'analytics' && <AnalyticsDashboard />}
        {section === 'ml' && <MLDashboard />}
        {section === 'learning' && <LearningDashboard />}
      </ErrorBoundary>
    </div>
  )
}
