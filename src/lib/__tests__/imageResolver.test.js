import { describe, it, expect } from 'vitest'
import {
  resolveArtworkImage,
  localFallbackImage,
  hasVerifiedLocalPhoto,
  buildImageReviewQueue,
} from '../imageResolver.js'

// A work whose museum image is good, plus the bulk-assigned local photo that
// every catalogued work carries.
const withVerifiedImage = {
  id: 'A001',
  title: 'Wheat',
  artist: 'Agnes Martin',
  preferredImageUrl: 'https://cdn.example/FC.787-web.jpg',
  preferredImageSourceType: 'Official Museum',
  imageMatchConfidence: 100,
  imageUrl: '/artworks/A001.jpg',
}

describe('resolveArtworkImage', () => {
  it('prefers the verified museum image', () => {
    const r = resolveArtworkImage(withVerifiedImage)
    expect(r.url).toBe('https://cdn.example/FC.787-web.jpg')
    expect(r.needsReview).toBe(false)
  })

  it('trusts an admin-published image that carries no numeric confidence', () => {
    const r = resolveArtworkImage({
      ...withVerifiedImage,
      imageMatchConfidence: null,
      humanImageReviewed: true,
    })
    expect(r.url).toBe('https://cdn.example/FC.787-web.jpg')
    expect(r.needsReview).toBe(false)
  })

  // The core guarantee: the local photo library was assigned by position, not
  // matched per artwork, so showing one unverified means showing a different
  // artist's painting under this artwork's label.
  it('does NOT fall back to an unverified local photo', () => {
    const r = resolveArtworkImage({ ...withVerifiedImage, preferredImageUrl: null })
    expect(r.url).toBeNull()
    expect(r.sourceType).toBe('Placeholder')
    expect(r.needsReview).toBe(true)
  })

  it('uses the local photo once it is verified to depict the work', () => {
    const r = resolveArtworkImage({
      ...withVerifiedImage,
      preferredImageUrl: null,
      localPhotoVerified: true,
    })
    expect(r.url).toBe('/artworks/A001.jpg')
    expect(r.sourceType).toBe('Local Reference Photo')
  })

  it('rejects a low-confidence auto-match that no human approved', () => {
    const r = resolveArtworkImage({ ...withVerifiedImage, imageMatchConfidence: 40 })
    expect(r.url).not.toBe('https://cdn.example/FC.787-web.jpg')
  })
})

describe('localFallbackImage', () => {
  // Runtime path: the museum URL 403s after the CDN moves the file. The
  // component asks for a fallback; it must not be handed the wrong painting.
  it('returns null for an unverified local photo', () => {
    expect(localFallbackImage(withVerifiedImage)).toBeNull()
  })

  it('returns the path once verified', () => {
    expect(localFallbackImage({ ...withVerifiedImage, localPhotoVerified: true }))
      .toContain('/artworks/A001.jpg')
  })

  it('is safe on missing/empty input', () => {
    expect(localFallbackImage(null)).toBeNull()
    expect(localFallbackImage({})).toBeNull()
    expect(hasVerifiedLocalPhoto(null)).toBe(false)
  })
})

describe('buildImageReviewQueue', () => {
  it('surfaces works that lost their image so a curator can fix them', () => {
    const queue = buildImageReviewQueue([
      withVerifiedImage,
      { ...withVerifiedImage, id: 'A002', preferredImageUrl: null },
    ])
    expect(queue.map((q) => q.id)).toEqual(['A002'])
  })
})
