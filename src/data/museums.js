// ---------------------------------------------------------------------------
// Museums + Exhibitions (front-end sample data)
//
// This file is intentionally kept separate from artworks so that the museum /
// exhibition catalog can later be sourced from a real API, JSON file, Google
// Sheets export, or Supabase table without touching the UI components.
// ---------------------------------------------------------------------------

export const museums = [
  {
    id: 'sfmoma',
    name: 'SFMOMA',
    location: 'San Francisco',
    descriptor: 'Modern and contemporary art',
    available: true,
  },
  {
    id: 'de-young',
    name: 'de Young Museum',
    location: 'San Francisco',
    descriptor: 'Fine arts, American art, textiles, and global collections',
    available: false,
  },
  {
    id: 'asian-art',
    name: 'Asian Art Museum',
    location: 'San Francisco',
    descriptor: 'Asian art, ritual, history, and material culture',
    available: false,
  },
]

export const exhibitions = [
  {
    id: 'ways-of-seeing',
    museumId: 'sfmoma',
    title: 'Ways of Seeing: Fourteen Artists',
    location: 'Floor 4',
    type: 'Ongoing exhibition',
    status: 'available',
    available: true,
    descriptor: 'Abstraction, figuration, gesture, geometry, and the Fisher Collection',
    // Preview image reuses the Lichtenstein work from the official page.
    previewImage:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2018/08/03012313/Lichtenstein_FiguresWithSunset_forweb-1024x663.jpg',
    previewCitation:
      'Roy Lichtenstein, Figures with Sunset, 1978. Image credit: Estate of Roy Lichtenstein; photo: Katherine Du Tiel. Source: SFMOMA.',
    sourceUrl: 'https://www.sfmoma.org/exhibition/ways-of-seeing-fourteen-artists/',
  },
  {
    id: 'matisse-femme-au-chapeau',
    museumId: 'sfmoma',
    title: 'Matisse\u2019s Femme au chapeau: A Modern Scandal',
    location: 'Floor 4',
    type: 'Sample route later',
    status: 'coming-soon',
    available: false,
    descriptor: 'Matisse, Fauvism, color, scandal, and modern portraiture',
    previewImage: null,
    sourceUrl: 'https://www.sfmoma.org/',
  },
  {
    id: 'sfmoma-highlights',
    museumId: 'sfmoma',
    title: 'General SFMOMA Highlights',
    location: 'Multiple floors',
    type: 'Coming soon',
    status: 'coming-soon',
    available: false,
    descriptor: 'A future route across major works in the museum',
    previewImage: null,
    sourceUrl: 'https://www.sfmoma.org/',
  },
]

export const getMuseum = (id) => museums.find((m) => m.id === id)
export const getExhibition = (id) => exhibitions.find((e) => e.id === id)
export const exhibitionsForMuseum = (museumId) =>
  exhibitions.filter((e) => e.museumId === museumId)
