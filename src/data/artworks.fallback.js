// ---------------------------------------------------------------------------
// Built-in artwork dataset for the SFMOMA "Ways of Seeing: Fourteen Artists"
// exhibition. This is prototype sample data.
//
// SWAP-OUT NOTE:
// This array is the single source of truth for artworks. To move to real data,
// replace `artworks` below with the result of fetching an external source that
// returns the same object shape, e.g.:
//     const artworks = await fetch('/artworks.json').then(r => r.json())
// or a Google Sheets export / Supabase table / approved museum API.
// Nothing else in the app needs to change.
//
// This is a noncommercial educational prototype. It is NOT an official SFMOMA
// product. Image credits below must remain visible with each image.
// ---------------------------------------------------------------------------

const SOURCE = 'https://www.sfmoma.org/exhibition/ways-of-seeing-fourteen-artists/'

export const fallbackArtworks = [
  {
    id: 'lichtenstein-figures-with-sunset',
    title: 'Figures with Sunset',
    artist: 'Roy Lichtenstein',
    year: '1978',
    movement: 'Pop Art / Contemporary Art',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 1',
    galleryOrder: 1,
    themes: ['color', 'figuration', 'geometry', 'popular culture', 'modern art'],
    difficultyLevel: 'Medium',
    importanceScore: 8,
    shortSummary:
      'A route entry based on SFMOMA\u2019s Ways of Seeing exhibition preview, using the work to introduce color, figuration, and popular visual language.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2018/08/03012313/Lichtenstein_FiguresWithSunset_forweb-1024x663.jpg',
    imageCredit: 'Estate of Roy Lichtenstein; photo: Katherine Du Tiel',
    sourceUrl: SOURCE,
    imageCitation:
      'Roy Lichtenstein, Figures with Sunset, 1978. Image credit: Estate of Roy Lichtenstein; photo: Katherine Du Tiel. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'This work shows how a modern artist can use bold visual language to make an image feel graphic, artificial, and memorable. Start by noticing the strong color, simplified shapes, and the way the image feels both familiar and strange.',
      apArtHistory:
        'This route entry can be used to discuss figuration, flatness, popular imagery, color, and the relationship between painting and mass visual culture. It asks viewers to consider how modern art absorbs and transforms the visual language of everyday media.',
      philosophical:
        'This work raises a simple but powerful question: do we see naturally, or do we see through visual systems we have already learned? Its graphic style makes perception feel constructed rather than neutral.',
      historicalContext:
        'This work connects to postwar art\u2019s interest in popular culture, mass media, and the breakdown of boundaries between high art and everyday imagery.',
      storytelling:
        'Imagine encountering an image that feels like it came from somewhere familiar, but has been pulled into the quiet space of a museum. The result is both playful and unsettling.',
      musicConnected:
        'The strong shapes and colors feel almost rhythmic, like a bright repeated motif. The image does not unfold like a melody; it hits like a visual chord.',
      humorous:
        'This is the kind of artwork that seems to know it looks like it escaped from another visual world\u2014and that confidence is part of the point.',
    },
  },
  {
    id: 'chamberlain-fenollosas-column',
    title: 'Fenollosa\u2019s Column',
    artist: 'John Chamberlain',
    year: '1983',
    movement: 'Abstract Sculpture / Contemporary Art',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 2',
    galleryOrder: 2,
    themes: ['materials', 'abstraction', 'sculpture', 'gesture', 'form'],
    difficultyLevel: 'Advanced',
    importanceScore: 7,
    shortSummary:
      'A sculptural route entry using industrial material and crushed form to explore abstraction, gesture, and the physical presence of the object.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2026/01/06134020/FC.740_01_H02-Artsy-JPEG_4000-pixels-long-769x1024.jpg',
    imageCredit: 'John Chamberlain / Artists Rights Society (ARS), New York; photo: Katherine Du Tiel',
    sourceUrl: SOURCE,
    imageCitation:
      'John Chamberlain, Fenollosa\u2019s Column, 1983. Image credit: John Chamberlain / Artists Rights Society (ARS), New York; photo: Katherine Du Tiel. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'Look at how everyday industrial material becomes something expressive. The folds and colors were once ordinary metal, now arranged into a shape that feels alive and gestural.',
      apArtHistory:
        'Use this work to discuss the move from painterly gesture to sculptural gesture, and how postwar sculpture absorbed the energy of Abstract Expressionism into three-dimensional form and found material.',
      philosophical:
        'If a material carries a past life before it becomes art, what are we really looking at\u2014the object now, or the history compressed inside it?',
      historicalContext:
        'This piece reflects a postwar interest in industrial materials and the American landscape of manufacturing, reworked into the language of abstraction.',
      storytelling:
        'Picture a piece of the built world\u2014metal that once had a purpose\u2014caught mid-motion, frozen in a gesture it was never designed to make.',
      musicConnected:
        'The twisting forms feel like a burst of improvised jazz: sudden, physical, and full of movement that resolves into an unexpected shape.',
      humorous:
        'It is, technically, a very sophisticated way of crushing metal\u2014and somehow it works beautifully.',
    },
  },
  {
    id: 'polke-springbrunnen',
    title: 'Springbrunnen (Fountain)',
    artist: 'Sigmar Polke',
    year: '1966',
    movement: 'Capitalist Realism / Contemporary Art',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 3',
    galleryOrder: 3,
    themes: ['popular culture', 'image-making', 'history', 'irony', 'modern art'],
    difficultyLevel: 'Advanced',
    importanceScore: 8,
    shortSummary:
      'A route entry exploring how printed dots and everyday imagery question what a picture is, using irony to examine mass image-making.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2026/01/02154209/FC.312_10T_POLKE_312R3-PowerPoint-or-email-JPEG_1024-pixels-long-690x1024.jpg',
    imageCredit:
      'Estate of Sigmar Polke / Artists Rights Society (ARS), New York / VG Bild-Kunst, Bonn, Germany',
    sourceUrl: SOURCE,
    imageCitation:
      'Sigmar Polke, Springbrunnen (Fountain), 1966. Image credit: Estate of Sigmar Polke / Artists Rights Society (ARS), New York / VG Bild-Kunst, Bonn, Germany. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'Notice the pattern of dots. The artist copied the look of cheap printing to ask why some images feel important and others feel disposable.',
      apArtHistory:
        'This work supports discussion of mechanical reproduction, the printed dot as subject matter, and a European response to Pop that leans toward irony and critique.',
      philosophical:
        'When an image is made of the same dots as an advertisement, where does meaning live\u2014in the picture, or in how we agree to read it?',
      historicalContext:
        'Made in 1960s Germany, the work reflects a postwar culture flooded with printed media and a generation questioning inherited images and authority.',
      storytelling:
        'From a distance you see a picture; up close it dissolves into dots\u2014as if the image is quietly admitting it was never solid to begin with.',
      musicConnected:
        'Think of a sampled loop: familiar fragments repeated until the repetition itself becomes the message.',
      humorous:
        'It is a painting that basically shrugs and says, \u201cyes, I am just dots\u201d\u2014and dares you to take it seriously anyway.',
    },
  },
  {
    id: 'warhol-nine-multicolored-marilyns',
    title: 'Nine Multicolored Marilyns [Reversal Series]',
    artist: 'Andy Warhol',
    year: '1979/1986',
    movement: 'Pop Art',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 4',
    galleryOrder: 4,
    themes: ['color', 'popular culture', 'identity', 'repetition', 'celebrity'],
    difficultyLevel: 'Medium',
    importanceScore: 9,
    shortSummary:
      'A route entry using repetition and celebrity imagery to explore identity, color, and the mechanics of fame.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2026/01/06113515/FC.229_01_P02-PowerPoint-or-email-JPEG_1024-pixels-long-790x1024.jpg',
    imageCredit:
      'The Andy Warhol Foundation for the Visual Arts / Artists Rights Society (ARS), New York; photo: Ian Reeves',
    sourceUrl: SOURCE,
    imageCitation:
      'Andy Warhol, Nine Multicolored Marilyns [Reversal Series], 1979/1986. Image credit: The Andy Warhol Foundation for the Visual Arts / Artists Rights Society (ARS), New York; photo: Ian Reeves. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'The same face repeats in different colors. Notice how repetition can make a famous person feel both everywhere and strangely empty.',
      apArtHistory:
        'A key work for discussing serial imagery, silkscreen process, celebrity as subject, and the flattening of identity into a reproducible sign.',
      philosophical:
        'If we see a face nine times, do we know it better\u2014or does repetition drain it of the person and leave only the image?',
      historicalContext:
        'Rooted in a media-saturated American culture, the work treats fame itself as a product that can be manufactured and multiplied.',
      storytelling:
        'A famous smile, printed again and again, until it feels less like a person and more like a rumor everyone has already heard.',
      musicConnected:
        'It works like a chorus repeated in different keys\u2014catchy, hypnotic, and slightly haunting by the ninth time around.',
      humorous:
        'Nine Marilyns for the price of one\u2014Warhol understood the assignment of modern celebrity perfectly.',
    },
  },
  {
    id: 'mitchell-bracket',
    title: 'Bracket',
    artist: 'Joan Mitchell',
    year: '1989',
    movement: 'Abstract Expressionism',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 5',
    galleryOrder: 5,
    themes: ['abstraction', 'gesture', 'color', 'emotion', 'nature'],
    difficultyLevel: 'Medium',
    importanceScore: 8,
    shortSummary:
      'A gestural abstraction route entry where color and brushwork translate memory, landscape, and feeling into paint.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2021/06/17110650/FC.838_01_H02-Large-JPEG_5x7-1024x583.jpg',
    imageCredit: 'Estate of Joan Mitchell',
    sourceUrl: SOURCE,
    imageCitation:
      'Joan Mitchell, Bracket, 1989. Image credit: Estate of Joan Mitchell. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'There is no object to find here\u2014just color and movement. Let your eyes follow the brushstrokes and notice the mood they create.',
      apArtHistory:
        'A strong example for discussing second-generation Abstract Expressionism, gestural mark-making, and abstraction rooted in remembered landscape and emotion.',
      philosophical:
        'Can a feeling exist outside of words? This painting argues that gesture and color can hold an emotion that language cannot quite reach.',
      historicalContext:
        'Made late in the artist\u2019s life in France, the work continues a postwar tradition of abstraction while drawing on personal memory of nature.',
      storytelling:
        'It feels like standing in a garden at the edge of memory\u2014colors half-remembered, light shifting, everything felt rather than named.',
      musicConnected:
        'Read it like a symphonic passage: layered, swelling, with bright notes of color breaking across a darker ground.',
      humorous:
        'If someone says \u201cmy kid could paint that,\u201d invite them to try holding this much feeling on a single canvas.',
    },
  },
  {
    id: 'murray-my-manhattan-january',
    title: 'My Manhattan, January',
    artist: 'Elizabeth Murray',
    year: '1987',
    movement: 'Neo-Expressionism / Contemporary Art',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 6',
    galleryOrder: 6,
    themes: ['abstraction', 'geometry', 'city life', 'color', 'form'],
    difficultyLevel: 'Advanced',
    importanceScore: 7,
    shortSummary:
      'A shaped-canvas route entry where geometry buckles into energetic, cartoon-like forms shaped by the rhythm of city life.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2026/04/16092025/MyManhattanJanuary_500_FisherCountdown.jpg',
    imageCredit: 'Estate of Elizabeth Murray / Artists Rights Society (ARS), New York; photo: Katherine Du Tiel',
    sourceUrl: SOURCE,
    imageCitation:
      'Elizabeth Murray, My Manhattan, January, 1987. Image credit: Estate of Elizabeth Murray / Artists Rights Society (ARS), New York; photo: Katherine Du Tiel. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'Notice how the shapes seem to push and bend, like the painting can barely hold still. It turns flat geometry into something restless and alive.',
      apArtHistory:
        'Useful for discussing the shaped canvas, the blurring of painting and sculpture, and a personal, energetic reinvention of geometric abstraction.',
      philosophical:
        'When straight lines start to bend and buckle, is the painting depicting a city\u2014or the feeling of trying to live inside one?',
      historicalContext:
        'Reflecting 1980s New York, the work channels the density and momentum of urban life into an unstable, expressive geometry.',
      storytelling:
        'It is a January in Manhattan compressed onto a wall: cold, crowded, jittery, and somehow full of color.',
      musicConnected:
        'Syncopated and punchy, like a drum pattern that keeps almost falling apart but never quite does.',
      humorous:
        'This is geometry after a very strong cup of city coffee\u2014no shape is willing to sit still.',
    },
  },
  {
    id: 'hanson-man-with-ladder',
    title: 'Man with Ladder',
    artist: 'Duane Hanson',
    year: '1994',
    movement: 'Hyperrealism',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 7',
    galleryOrder: 7,
    themes: ['figuration', 'realism', 'labor', 'everyday life', 'identity'],
    difficultyLevel: 'Beginner',
    importanceScore: 7,
    shortSummary:
      'A hyperrealist route entry that treats an ordinary working figure with the seriousness usually reserved for monuments.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2026/04/16092023/ManWithLadder_500_FisherCountdown.jpg',
    imageCredit: 'Estate of Duane Hanson / Licensed by VAGA at ARS, New York, NY; photo: Katherine Du Tiel',
    sourceUrl: SOURCE,
    imageCitation:
      'Duane Hanson, Man with Ladder, 1994. Image credit: Estate of Duane Hanson / Licensed by VAGA at ARS, New York, NY; photo: Katherine Du Tiel. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'This looks like a real person because it almost is\u2014cast and painted with astonishing detail. It asks you to really see someone you might normally walk past.',
      apArtHistory:
        'A clear example of hyperrealism and the dignifying of the everyday laborer, raising questions about realism, empathy, and who gets represented in a museum.',
      philosophical:
        'If we stop to truly look at an ordinary worker, does the act of attention itself confer a kind of value we usually withhold?',
      historicalContext:
        'Part of a late-century American realism that turned its gaze on ordinary people and the invisible labor that keeps daily life running.',
      storytelling:
        'You round a corner and someone is standing there mid-task\u2014and for a second you are unsure whether to say hello.',
      musicConnected:
        'Quiet and steady, like a single sustained note that asks you to stop and simply pay attention.',
      humorous:
        'The most convincing coworker in the building, and he never once checks his phone.',
    },
  },

  // -------------------------------------------------------------------------
  // Artist-only SAMPLE ROUTE ENTRIES (for route variety).
  // These use elegant placeholders (no invented titles/years/credits/images),
  // per the requirement to only assert verified details from the source page.
  // -------------------------------------------------------------------------
  {
    id: 'richter-abstraktes-bild',
    title: 'Abstraktes Bild (Abstract Picture)',
    artist: 'Gerhard Richter',
    year: '1992',
    movement: 'Contemporary Art',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 8',
    galleryOrder: 8,
    themes: ['abstraction', 'figuration', 'image-making', 'history', 'philosophy'],
    difficultyLevel: 'Advanced',
    importanceScore: 8,
    shortSummary:
      'A route entry using a squeegee-built abstraction to explore image-making, chance, and how clearly we can ever really see.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2022/05/21023004/FC.509_01_H02-Artsy-JPEG_4000-pixels-long.jpg',
    imageCredit:
      'The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 Gerhard Richter',
    sourceUrl: 'https://www.sfmoma.org/artwork/FC.509/',
    imageCitation:
      'Gerhard Richter, Abstraktes Bild (Abstract Picture), 1992. Image credit: The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 Gerhard Richter. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'This artist is known for sliding between sharp realism and pure blur. Notice how the surface refuses to settle, asking how clearly we can ever really see.',
      apArtHistory:
        'Useful for discussing the photo-based image, the squeegee-dragged surface, and the tension between painting, chance, and photography.',
      philosophical:
        'A meditation on doubt itself: what does it mean to make an image that refuses to fully resolve?',
      historicalContext:
        'Situated in postwar European art\u2019s reckoning with memory, photography, and history.',
      storytelling:
        'Imagine a photograph left out in the rain of memory until its edges soften into paint.',
      musicConnected:
        'Like a chord held under heavy reverb\u2014clear at its core, dissolving at the edges.',
      humorous:
        'From an artist who can paint something perfectly and then, on purpose, gently smear it.',
    },
  },
  {
    id: 'serra-carnegie',
    title: 'Carnegie',
    artist: 'Richard Serra',
    year: '1984',
    movement: 'Minimalism / Process Art',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 9',
    galleryOrder: 9,
    themes: ['materials', 'sculpture', 'space', 'geometry', 'physical experience'],
    difficultyLevel: 'Advanced',
    importanceScore: 8,
    shortSummary:
      'A route entry using weight, scale, and material to make the space around the work\u2014and your body in it\u2014part of the experience.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/23025204/FC.199-web.jpg',
    imageCredit:
      'The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 Richard Serra / Artists Rights Society (ARS), New York',
    sourceUrl: 'https://www.sfmoma.org/artwork/FC.199/',
    imageCitation:
      'Richard Serra, Carnegie, 1984. Image credit: The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 Richard Serra / Artists Rights Society (ARS), New York. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'You experience this work with your whole body\u2014weight, scale, and the space around you become the subject.',
      apArtHistory:
        'Useful for discussing minimalism, material honesty, and sculpture that activates the viewer\u2019s movement through space.',
      philosophical:
        'A question of presence: can pure mass and material, with no image at all, still make you feel something?',
      historicalContext:
        'Rooted in postwar sculpture\u2019s shift from depicting objects to shaping experience.',
      storytelling:
        'Imagine standing near something so heavy and deliberate that your own sense of scale quietly rearranges itself.',
      musicConnected:
        'Like a single low bass tone you feel in your chest more than you hear.',
      humorous:
        'The artwork is, essentially, stronger than you\u2014and it knows it.',
    },
  },
  {
    id: 'martin-untitled-9',
    title: 'Untitled #9',
    artist: 'Agnes Martin',
    year: '1995',
    movement: 'Minimalism / Abstract',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 10',
    galleryOrder: 10,
    themes: ['abstraction', 'geometry', 'silence', 'philosophy', 'emotion'],
    difficultyLevel: 'Medium',
    importanceScore: 8,
    shortSummary:
      'A route entry of quiet bands and soft lines that rewards calm, patient looking and a slower kind of attention.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08225559/FC.549_5064.10R_MARTIN_549R9_FINAL-web.jpg',
    imageCredit:
      'The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 Estate of Agnes Martin / Artists Rights Society (ARS), New York',
    sourceUrl: 'https://www.sfmoma.org/artwork/FC.549/',
    imageCitation:
      'Agnes Martin, Untitled #9, 1995. Image credit: The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 Estate of Agnes Martin / Artists Rights Society (ARS), New York. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'Quiet bands and soft lines. Slow down\u2014this work rewards calm, patient looking.',
      apArtHistory:
        'Useful for discussing the grid, restraint, and abstraction pursued as a path toward serenity rather than drama.',
      philosophical:
        'A meditation on stillness: can near-emptiness be full? These faint lines suggest that quiet can carry meaning.',
      historicalContext:
        'Linked to minimalism and a lifelong search for calm, order, and inner clarity.',
      storytelling:
        'Imagine a surface of faint lines that seems to breathe, asking only that you stay a little longer.',
      musicConnected:
        'Like the silence between notes\u2014where the real feeling quietly lives.',
      humorous:
        'It gently teaches the impatient museum-goer how to actually stand still.',
    },
  },
  {
    id: 'guston-processional',
    title: 'Processional',
    artist: 'Philip Guston',
    year: '1957',
    movement: 'Abstract Expressionism / Figuration',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 11',
    galleryOrder: 11,
    themes: ['figuration', 'history', 'social context', 'emotion', 'painting'],
    difficultyLevel: 'Advanced',
    importanceScore: 8,
    shortSummary:
      'A route entry where dense, brooding strokes gather into a charged mass, showing painting\u2019s power to hold weight and unease.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2022/05/20093007/10BB_Guston_749R2-Artsy-JPEG_4000-pixels-long.jpg',
    imageCredit:
      'The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 The Estate of Philip Guston',
    sourceUrl: 'https://www.sfmoma.org/artwork/FC.749/',
    imageCitation:
      'Philip Guston, Processional, 1957. Image credit: The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 The Estate of Philip Guston. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'Dense, brooding strokes gather toward the center. Notice how abstract marks can still carry real weight and unease.',
      apArtHistory:
        'Useful for discussing gestural abstraction and, in Guston\u2019s wider arc, painting\u2019s power to confront social and moral questions.',
      philosophical:
        'A question of honesty: what happens when an artist pushes past beauty to reach something uncomfortable and true?',
      historicalContext:
        'Tied to a turbulent era and an artist who would later trade abstract refinement for raw figuration.',
      storytelling:
        'Imagine a slow crowd of marks moving together\u2014until you feel the dread sitting quietly underneath them.',
      musicConnected:
        'Like a blues riff played on a single string: rough, direct, and unexpectedly moving.',
      humorous:
        'Proof that a smoky cluster of brushstrokes can, somehow, feel genuinely ominous.',
    },
  },
  {
    id: 'flavin-diagonal-1963',
    title: 'the diagonal of May 25, 1963',
    artist: 'Dan Flavin',
    year: '1963',
    movement: 'Minimalism',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 12',
    galleryOrder: 12,
    themes: ['light', 'space', 'minimalism', 'geometry', 'perception'],
    difficultyLevel: 'Medium',
    importanceScore: 8,
    shortSummary:
      'A route entry made from a single fluorescent tube, letting light itself spill across the wall and reshape the room.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2022/05/20151006/2007.5_01_artsy_cordless_ie02-Artsy-JPEG_4000-pixels-long.jpg',
    imageCredit:
      'Collection SFMOMA; \u00a9 Stephen Flavin / Artists Rights Society (ARS), New York',
    sourceUrl: 'https://www.sfmoma.org/artwork/2007.5/',
    imageCitation:
      'Dan Flavin, the diagonal of May 25, 1963, 1963. Image credit: Collection SFMOMA; \u00a9 Stephen Flavin / Artists Rights Society (ARS), New York. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'This is made from a fluorescent tube. Notice how the color spills onto the wall and quietly changes the whole space.',
      apArtHistory:
        'Useful for discussing minimalism, industrial materials, and light itself treated as sculptural medium and space.',
      philosophical:
        'A question of perception: if the light changes the room, is the artwork the tube\u2014or the space you are standing in?',
      historicalContext:
        'Rooted in 1960s minimalism\u2019s embrace of everyday industrial objects as art.',
      storytelling:
        'Imagine a plain diagonal of light glowing a color that seems to have no source you can point to.',
      musicConnected:
        'Like a pure sustained tone filling a room until the air itself feels colored.',
      humorous:
        'Turns out the hardware store is, apparently, also an art supply store.',
    },
  },
  {
    id: 'twombly-bacchus-1st-version-iv',
    title: 'Untitled (Bacchus 1st Version IV)',
    artist: 'Cy Twombly',
    year: '2004',
    movement: 'Abstract Expressionism',
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: 'Floor 4 \u00b7 Gallery 13',
    galleryOrder: 13,
    themes: ['gesture', 'history', 'writing', 'abstraction', 'emotion'],
    difficultyLevel: 'Advanced',
    importanceScore: 8,
    shortSummary:
      'A route entry of looping, blood-red gestures that read like handwriting from a dream\u2014felt more than deciphered.',
    imageUrl:
      'https://d1hhug17qm51in.cloudfront.net/www-media/2022/05/02103820/FC.836_01_D03-Artsy-JPEG_4000-pixels-long.jpg',
    imageCredit:
      'The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 Cy Twombly Foundation',
    sourceUrl: 'https://www.sfmoma.org/artwork/FC.836/',
    imageCitation:
      'Cy Twombly, Untitled (Bacchus 1st Version IV), 2004. Image credit: The Doris and Donald Fisher Collection at the San Francisco Museum of Modern Art; \u00a9 Cy Twombly Foundation. Source: SFMOMA.',
    imagePlaceholderFallback: false,
    explanations: {
      beginnerFriendly:
        'These looping marks look like handwriting from a dream. Read them as feeling, not as words.',
      apArtHistory:
        'Useful for discussing gesture, mark-making, and abstraction that borrows from writing, poetry, and classical history.',
      philosophical:
        'A question at the edge of language: when does a mark stop being writing and become pure feeling?',
      historicalContext:
        'Linked to postwar abstraction and a lifelong dialogue with myth and Mediterranean history\u2014here, the god Bacchus.',
      storytelling:
        'Imagine the urgent, half-legible loops of someone chasing a single overwhelming thought.',
      musicConnected:
        'Like an improvised solo that trails off, loops back, and never fully lands\u2014on purpose.',
      humorous:
        'Reassurance for everyone whose handwriting was ever called messy.',
    },
  },
]

// This is the legacy hand-authored fallback dataset. It is only used if the
// generated dataset (from the spreadsheet) fails to load. See artworks.js.
