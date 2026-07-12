// ===========================================================================
// verifiedImageFixes.js
// A small, human-curated table of KNOWN-GOOD replacement images for artworks
// whose stored image was broken (e.g. a stale SFMOMA CDN URL that started
// returning HTTP 403). Each entry was found on the artwork's official SFMOMA
// object page and its direct image URL was confirmed to return 200 image/jpeg.
//
// This is NOT an auto-approver. The Image Audit tool offers these as a
// ONE-CLICK PREFILL for the candidate reviewer: the admin still sees the
// preview + metadata assertions + verdict and must click "Approve & Publish".
// The write then goes through the admin's authenticated session (RLS enforced).
//
// Keyed by artwork CODE ("A011"). To add a fix: open the SFMOMA object page,
// copy the current image URL, confirm it loads, and record the source page +
// which metadata fields the page confirms (artist/title/year/museum/accession).
// ===========================================================================

export const VERIFIED_IMAGE_FIXES = {
  // Andy Warhol, Telephone [1], 1961 — accession FC.499. Old CDN URL 403'd; this
  // is the current image URL from the SFMOMA object page (confirmed 200).
  A011: {
    url: 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/08202849/FC.499_01_P02-web.jpg',
    sourcePage: 'https://www.sfmoma.org/artwork/FC.499/',
    credit: 'Collection SFMOMA. © The Andy Warhol Foundation for the Visual Arts, Inc.',
    // Fields the SFMOMA object page confirms for this exact work.
    matches: { artist: 'yes', title: 'yes', year: 'yes', museum: 'yes', accession: 'yes' },
    note: 'Replaces a stale SFMOMA CDN URL that began returning HTTP 403.',
  },

  // Roy Lichtenstein, Tire, 1962 — accession FC.705. Old CDN URL 403'd; current
  // image URL from the SFMOMA object page (confirmed 200).
  A059: {
    url: 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/08213715/FC.705_01_P02-web.jpg',
    sourcePage: 'https://www.sfmoma.org/artwork/FC.705/',
    credit: 'Collection SFMOMA. © Estate of Roy Lichtenstein.',
    matches: { artist: 'yes', title: 'yes', year: 'yes', museum: 'yes', accession: 'yes' },
    note: 'Replaces a stale SFMOMA CDN URL that began returning HTTP 403.',
  },

  // Gerhard Richter, Abstraktes Bild (Abstract Picture), 1990 — SFMOMA object
  // #459842. Direct render URL confirmed 200 image/jpeg at 1078×1200. Source is
  // SFMOMA's own customprints.sfmoma.org (an official SFMOMA host).
  A035: {
    url: 'https://customprints.sfmoma.org/vitruvius/render/1500/459842.jpg',
    sourcePage: 'https://customprints.sfmoma.org/detail/459842/richter-abstraktes-bild-abstract-picture-1990',
    credit: 'Collection SFMOMA. © Gerhard Richter.',
    matches: { artist: 'yes', title: 'yes', year: 'yes', museum: 'yes', accession: 'yes' },
    note: 'Verified SFMOMA reproduction (object #459842) for the missing/broken image.',
  },
}

// Look up a verified fix for an artwork code, or null if none exists.
export function getVerifiedFix(code) {
  return (code && VERIFIED_IMAGE_FIXES[code]) || null
}
