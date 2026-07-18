-- ============================================================================
-- import_lookcloser.sql  (generated — do not hand-edit)
-- "Look Closer" guided-looking content from
--   Look_Closer_Guided_Looking_Content.xlsx  (sheet: Guided Looking Data)
-- Writes ONLY public.guided_looking_sets and public.guided_looking_hotspots.
-- Never touches explanations, images, pairings, audio, artwork metadata,
-- routing, or any user/session data.
-- Matched by stable artwork code (a.code, e.g. 'A002').
-- High/Medium confidence -> review_status='approved', is_published=true so
-- matched sets appear to visitors immediately (still editable in the admin).
-- Low/blank confidence -> review_status='needs_review', unpublished.
-- A hotspot is published only when the set is published AND it has both
-- coordinates. Run in the Supabase SQL Editor AFTER migration 0015.
-- 62 guided-looking sets. Idempotent: re-running updates in place
-- (unique artwork_id; unique (artwork_id, hotspot_number)).
-- ============================================================================
begin;

-- Room 1  Elizabeth Murray - My Manhattan, January  [LC-001 -> A032]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A032$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Before trying to decode the shapes, follow the painting’s outline. It dips, bulges, and stretches so dramatically that the wall around it starts to feel like part of the image.$s$, $s$Now look at the whole work again. Does it still feel like a painting hung on a wall, or more like a strange object pressing into your space?$s$,
    $s$https://www.sfmoma.org/artwork/FC.519/$s$, $s$https://www.sfmoma.org/artist/Elizabeth_Murray/$s$, $s$The full SFMOMA image was visually audited against every hotspot. The orange oval, pale looping line, and upper-left concave edge are all directly visible at the revised coordinates.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED: all three coordinates directly match the stated details in the full SFMOMA image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The orange shape under pressure$s$, $s$Tap the large orange oval just right of center. Look at how the pale blue loop wraps around its left side while teal and dark blue forms press against it from above and below.$s$,
    $s$This is not simply a bright focal point. The orange form feels swollen and crowded, almost like something soft being compressed inside a container. That pressure gives an abstract arrangement the physical urgency of a body trying to make room for itself.$s$, $s$Does the orange form seem protected by the surrounding shapes, or trapped by them?$s$,
    58, 43, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The loop that ties it together$s$, $s$Follow the pale blue-gray line that curls around the orange form, drops downward, and then travels across the lower-right half of the painting.$s$,
    $s$It behaves almost like a cord, handle, or loose piece of tubing—but it never becomes one definite object. Because it passes through several otherwise separate shapes, it gives the eye a route through the painting and makes the whole image feel connected, as if its parts belong to one odd machine or body.$s$, $s$Where does the line seem to pass behind a form, and where does it come forward?$s$,
    64, 61, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The edge that becomes a wave$s$, $s$Look at the deep inward curve along the upper-left edge, where the turquoise support rises and then sinks before meeting the central arch.$s$,
    $s$A normal canvas edge would simply contain the image. Here, the edge itself bends like a wave, so the painting’s outer shape continues the motion happening inside it. Murray makes it difficult to tell where composition ends and sculpture begins.$s$, $s$Would the work feel as energetic if this edge were perfectly straight?$s$,
    24, 18, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 1  Elizabeth Murray - Things to Come  [LC-002 -> A033]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A033$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin with the large circular opening near the middle. From there, follow the bent yellow-and-blue form outward and notice how the painting behaves like something folded, twisted, and partly hollow.$s$, $s$Step back and compare the lively painted surface with the exposed wooden construction. Does the work feel like an animated image, a damaged object, or something caught between the two?$s$,
    $s$https://www.sfmoma.org/artwork/FC.277.A-B/$s$, $s$https://www.sfmoma.org/exhibition/freeform-experiencing-abstraction/$s$, $s$SFMOMA specifically identifies the water-drop imagery and visible wooden supports. The full image audit showed that the previous coordinates missed those details, so the hotspots were replaced with the central opening, the drops directly beneath it, and the exposed upper-left structure.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: all previous coordinates were replaced. These three points directly match the described opening, drops, and exposed support.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The hole through the painting$s$, $s$Tap the round opening slightly left of center, where the wall is visible through the shaped support.$s$,
    $s$This is not a painted circle pretending to be a hole; the support is physically open. The gap turns the wall behind the artwork into part of what you see and makes the painted form feel more like a twisted object than a conventional canvas.$s$, $s$Does the opening feel like an eye, a drain, or simply missing material?$s$,
    42, 49, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The drops hanging below$s$, $s$Look just beneath the circular opening for the small pale-blue drops descending onto the yellow lower section.$s$,
    $s$SFMOMA describes cartoonish water drops that appear to roll across the work. These tiny shapes introduce the logic of liquid into an object made from rigid wood and canvas, making the fixed structure seem briefly animated.$s$, $s$Do the drops look frozen in place, or as though gravity is still pulling them downward?$s$,
    48, 60, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The wooden structure exposed$s$, $s$Tap the open, boxlike section at the upper-left, where the raw inner support is visible behind the painted blue-and-yellow skin.$s$,
    $s$This exposed construction interrupts the cartoon illusion. Instead of hiding how the work was built, Murray lets the hollow support remain visible, so the image and the object compete for attention.$s$, $s$Does seeing the raw structure make the painted form feel more real or more theatrical?$s$,
    18, 24, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 1  Joan Mitchell - Bracket  [LC-003 -> A042]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A042$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$First notice the vertical join near the middle, then watch how the brushwork refuses to respect it. Dense colored masses gather on both sides, while thinner strokes keep pulling your eye across.$s$, $s$Now take in the whole painting again. Does the join divide the composition, or make the movement across it more noticeable?$s$,
    $s$https://www.joanmitchellfoundation.org/joan-mitchell/artwork/0822-bracket$s$, $s$https://www.joanmitchellfoundation.org/joan-mitchell/materials-and-practice$s$, $s$The full artwork image was visually audited. The previous hotspots described features that did not correspond reliably to the image. They were replaced with three clearly locatable passages: the large upper-left orange mass, the blue-green bridge at the central join, and the lower-right orange loop.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: descriptions and coordinates were replaced to match clearly visible passages in the full image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The orange mass on the left$s$, $s$Tap the large rust-orange shape in the upper-left half, surrounded by blue, green, white, and brown strokes.$s$,
    $s$This is one of the painting’s heaviest warm passages. Its compactness gives the left side a center of gravity, while the cooler strokes around it keep the form from settling into a recognizable object.$s$, $s$Does the orange feel buried inside the surrounding colors, or pushing through them?$s$,
    29, 32, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$Blue crossing the join$s$, $s$Look near the upper center, where blue and green strokes approach and visually bridge the vertical division between the two sections.$s$,
    $s$The physical join could split the painting into separate halves, but these marks make the eye continue across it. Mitchell turns a structural interruption into a point of visual momentum.$s$, $s$Do you notice the join first, or the brushwork moving across it?$s$,
    52, 24, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The orange loop below$s$, $s$Tap the orange-and-brown looping passage in the lower half of the right section.$s$,
    $s$Unlike the compact orange mass on the left, this warm passage opens into a loose curve. Repeating orange in a different shape and position creates a visual echo without making the two sides symmetrical.$s$, $s$How does this looser orange passage change the balance of the painting?$s$,
    65, 63, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 1  Joan Mitchell - Sunflowers  [LC-004 -> A043]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A043$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the title sit in the back of your mind, but do not force yourself to find literal flowers. Instead, look for places where color seems to gather, droop, flare up, or begin to decay.$s$, $s$Look across the diptych again. Do you now see a field of flowers, a record of changing energy, or two crowded surfaces that only borrow the feeling of both?$s$,
    $s$https://www.joanmitchellfoundation.org/uploads/pdf/JMF-ArtEdPoster-Sunflowers.pdf$s$, $s$https://www.joanmitchellfoundation.org/joan-mitchell/key-works$s$, $s$The full Foundation image was visually audited. The yellow hotspot was moved upward to the actual upper-left yellow burst; the lower-right red-blue cluster and central white passage were confirmed with minor coordinate adjustments.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED: all three coordinates match visible passages. The first coordinate was corrected substantially.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The yellow burst without a flower$s$, $s$Tap the strong yellow patch near the top of the left panel, where it pushes between pale gray and dark blue brushwork.$s$,
    $s$The color carries the brightness we associate with a sunflower, but there is no clear stem, center, or ring of petals. Mitchell lets color trigger recognition without finishing the image for us. The flower appears as a sensation—brightness under pressure—rather than a botanical description.$s$, $s$How much of a sunflower can you see when almost none of its parts are drawn?$s$,
    27, 10, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The heavy red-blue bloom$s$, $s$Look at the large dark red and blue cluster in the lower-right quadrant.$s$,
    $s$This dense form feels much heavier than the yellow passages above it. In the Foundation’s educational material, Mitchell’s late sunflower works are connected to the flower’s full life cycle, including fading and decline. Here, the bruised colors can make growth and decay feel present at the same time without illustrating either literally.$s$, $s$Does this cluster feel like a flower at full strength, or one beginning to collapse?$s$,
    84, 77, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The white channel between crowds$s$, $s$Follow the jagged white passage running through the lower middle, close to the central join, where it separates masses of blue, red, green, and turquoise.$s$,
    $s$The white does not produce peaceful emptiness. It cuts through the crowded paint like a narrow current, preventing the two panels from becoming solid blocks. Your eye uses it to weave between the surrounding masses.$s$, $s$Does the white passage open the painting up, or make the colored forms press against it more strongly?$s$,
    51, 69, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 1  Joan Mitchell - La Grande Vallée XIV (For a Little While)  [LC-005 -> A044]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A044$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin with the title’s idea of a valley, but notice that the painting gives you no horizon and no stable viewpoint. Where does the color make you feel surrounded rather than positioned outside a scene?$s$, $s$Now step back. Does the valley feel like a place you could enter, or like an intense memory of color that has lost its ordinary geography?$s$,
    $s$https://www.joanmitchellfoundation.org/joan-mitchell/timeline$s$, $s$https://www.joanmitchellfoundation.org/joan-mitchell/citations/joan-mitchell-paints-a-symphony$s$, $s$The full three-part image was visually audited. The yellow field and lower-center blue cluster were confirmed; the upper-right hotspot was moved upward to the actual dark blue-green edge activity.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED: all three coordinates now correspond directly to the described yellow field, dark-blue threshold, and upper-right edge passage.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The yellow opening$s$, $s$Look at the large yellow field spreading across the upper center section, partly crossed by blue, gray, and green strokes.$s$,
    $s$This is the nearest thing the painting offers to an opening or clearing, but it does not recede neatly into distance. The yellow comes forward with such force that the supposed valley feels less like scenery and more like light remembered from inside an experience.$s$, $s$Does the yellow create depth, or does it press toward you?$s$,
    51, 20, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark blue threshold$s$, $s$Tap the dense dark-blue cluster near the lower center, directly beneath the brightest yellow field.$s$,
    $s$This passage prevents the bright center from becoming simply cheerful or open. It acts like a visual threshold: the eye can sense space above it, but the dark paint also blocks easy entry.$s$, $s$Does this dark blue feel like ground, shadow, water, or a barrier made only of paint?$s$,
    50, 72, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The restless upper-right edge$s$, $s$Look at the upper-right corner, where dark blue loops and strokes crowd against bright green and run into the edge.$s$,
    $s$The marks do not settle into a framing border. They twist, overlap, and disappear at the limit of the painting, suggesting that the energy continues beyond what we can see.$s$, $s$What do you imagine continuing beyond this edge?$s$,
    87, 18, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 2  Cy Twombly - Second Voyage to Italy (Second Version)  [LC-006 -> A026]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A026$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$At first, the surface resembles a page of travel notes that have been written over, crossed out, and partly forgotten. Instead of trying to read everything, begin with the few places where color suddenly becomes dense.$s$, $s$Now take in the full canvas again. Does it feel like a record of places visited, or like memory after the journey—fragmentary, revised, and impossible to put back into order?$s$,
    $s$https://www.sfmoma.org/artwork/FC.586/$s$, $s$https://cytwombly.org/artist/chronology/$s$, $s$The full artwork image was visually audited. The previous central-red hotspot did not match the clearest red concentration. The revised points now mark the upper red tangle, the central upright blue-black cluster, and the broad open right-hand field.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: all three points were checked against the full image. Hotspot 1 and Hotspot 2 were substantially rewritten and relocated.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The red tangle near the top$s$, $s$Tap the compact red-and-brown scribble in the upper-left quarter, just below a small yellow-and-green passage.$s$,
    $s$Most of the canvas is pale and scattered, so this tight knot feels unusually concentrated. It resembles a thought circled several times, or a memory that has been worried over until the original image is no longer readable.$s$, $s$Does the repeated red line clarify anything, or only make the mark feel more urgent?$s$,
    35, 17, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The blue-black figure in the middle$s$, $s$Look near the center for the upright blue-and-black cluster surrounded by pale loops, numbers, and short red strokes.$s$,
    $s$This passage briefly gathers the surrounding fragments into something almost figure-like. Yet it never becomes a stable person or object. Twombly lets recognition begin and then leaves it unresolved.$s$, $s$What do you begin to see here before the marks fall apart again?$s$,
    50, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The large pale space on the right$s$, $s$Move into the upper-right area, where the linen remains mostly open except for a small isolated bundle of blue and red marks near the edge.$s$,
    $s$The broad emptiness prevents the work from becoming one continuous field of scribbling. It makes the isolated marks feel like fragments separated by distance—closer to scattered recollections than a complete narrative.$s$, $s$Does the empty linen feel like a pause, a missing memory, or unfinished space?$s$,
    79, 31, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 2  Cy Twombly - Untitled (1968)  [LC-007 -> A027]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A027$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Stand back far enough to see the pale loops form horizontal rows. Then move closer and notice that the rows are never as orderly as they first appear.$s$, $s$Look across the gray field again. Does the repetition feel disciplined, soothing, obsessive, or increasingly difficult to control?$s$,
    $s$https://www.sfmoma.org/artwork/FC.460/$s$, $s$https://www.moma.org/collection/works/80088$s$, $s$The full image was visually audited. The former 'line running out' hotspot was inaccurate because the lower-right loops remain large and active rather than visibly fading. It was replaced with the clearly visible change in loop scale.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: the top-row and central coordinates were refined; Hotspot 3 was replaced to match the large lower loops.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The smaller loops at the top$s$, $s$Tap the upper-left row, where the first loops are tighter and smaller than many of the marks below.$s$,
    $s$The painting does not repeat one identical shape from top to bottom. The compact upper loops establish a quicker, more controlled rhythm, which makes the expanding gestures farther down feel increasingly physical.$s$, $s$How does the pace of the top row differ from the rows below it?$s$,
    24, 18, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The row that begins to overlap$s$, $s$Look near the center, where several pale loops crowd together and cross neighboring marks instead of remaining evenly separated.$s$,
    $s$The gesture is still repetitive, but the pressure of one loop against another makes the pattern unstable. What initially resembles careful handwriting practice starts to feel hurried and compulsive.$s$, $s$Can you follow one loop without losing it inside the others?$s$,
    51, 49, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The enormous loops along the bottom$s$, $s$Tap the lower-right area, where the repeated loops become much larger and sweep close to the bottom edge.$s$,
    $s$The expanding scale makes the gesture feel less like writing from the wrist and more like movement from the whole arm. The lower row gives the painting a bodily weight that the tighter marks above do not have.$s$, $s$Do these larger loops feel freer, clumsier, or more exhausted?$s$,
    78, 82, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 2  Cy Twombly - Untitled (1971)  [LC-008 -> A028]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A028$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the entire gray surface register as a storm of repeated diagonal marks before isolating any one passage. Unlike Twombly’s tidier rows of loops, this field seems to move in several directions at once.$s$, $s$Step back until the individual strokes merge. Does the painting feel like writing accelerated beyond legibility, or like a dense atmosphere made from countless small movements?$s$,
    $s$https://www.sfmoma.org/artwork/2000.204/$s$, $s$https://www.sfmoma.org/press-release/sfmoma-acquires-major-twombly-painting-directly-f/$s$, $s$The full image audit showed that the former hotspots—distinct colliding loops, one erased cloud, and one long horizontal run—did not accurately describe this uniformly dense, diagonally organized painting. All three were replaced with clearly visible directional, density, and edge features.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous hotspot descriptions and coordinates were replaced.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The slant sweeping downward$s$, $s$Tap the upper-right area, where many pale strokes lean in the same downward-left direction.$s$,
    $s$The shared slant gives the surface a strong current even though no single line dominates. Repetition creates motion collectively, like rain or handwriting driven across a page by speed.$s$, $s$Which direction does the whole surface seem to be moving?$s$,
    76, 24, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The densest weave$s$, $s$Look near the center-left, where short loops, hooks, and diagonals overlap so heavily that the gray ground is difficult to see.$s$,
    $s$This passage is not a single dramatic mark but an accumulation. Its density turns airy drawing into visual pressure, making the surface feel worked over rather than simply covered.$s$, $s$Can you separate the marks into layers, or do they become one tangled mass?$s$,
    38, 49, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The marks cut off at the bottom$s$, $s$Follow the pale strokes into the lower edge, where many diagonals and loops are abruptly cropped by the boundary.$s$,
    $s$The repeated gestures do not slow down before reaching the edge. Their sudden truncation makes the painted field feel like one section of a larger movement continuing beyond the canvas.$s$, $s$Does the bottom edge stop the motion, or make it seem to continue outside the painting?$s$,
    57, 88, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 2  Cy Twombly - Note I, from the series III Notes from Salalah  [LC-009 -> A029]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A029$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the deep green arrive before the white marks. Then follow how each pale stroke rises into a loop or upright curve and slowly drains downward in long drips.$s$, $s$Now see the entire painting as one sequence. Does it feel more like enlarged writing, a line of plants, or repeated gestures slowly melting under gravity?$s$,
    $s$https://www.sfmoma.org/artwork/FC.807/$s$, $s$https://archive.artic.edu/cytwombly/salalah/$s$, $s$The full SFMOMA image was visually audited. The first hotspot was moved from the partly cropped far-left form to the complete center-left loop. The drip point was lowered to the actual long descents, and the former generic green-ground hotspot was replaced by a clearly visible translucent white passage.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: all three coordinates directly match the center-left loop, central long drips, and translucent right-hand stroke.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The broad loop at center-left$s$, $s$Tap the large pale loop just left of center, where the stroke rises from a thick base and opens into a tall oval.$s$,
    $s$The shape resembles a letter without becoming readable, but it also feels plantlike—a leaf, vine, or stem briefly catching light. Twombly enlarges pseudo-writing until it begins to behave like something growing in space.$s$, $s$Does this form feel written, drawn, or grown?$s$,
    38, 36, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The longest drips$s$, $s$Look directly beneath the thick white stroke near the middle, where several narrow drips fall almost to the bottom.$s$,
    $s$The upper mark records a fast sweep of the arm; the drips record what happened afterward, when gravity continued the painting without him. One passage therefore contains both deliberate action and slow physical consequence.$s$, $s$Which feels more active: the loop above or the descending paint below?$s$,
    52, 72, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The green showing through the white$s$, $s$Zoom into the thinner right-hand loop, where the white paint becomes translucent and the dark green remains visible beneath it.$s$,
    $s$The pale gesture is not an opaque shape pasted onto the ground. Changes in thickness let the green enter the mark, making the line feel layered, wet, and unstable rather than cleanly calligraphic.$s$, $s$Where does the white stroke feel most solid, and where does it begin to dissolve?$s$,
    76, 39, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 3  Philip Guston - Rug III  [LC-010 -> A045]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A045$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin by letting the pile register as a single heavy mass. Then separate it into individual shoes, soles, and upright forms until the heap becomes almost impossible to organize again.$s$, $s$Step back and look at the whole pile. Does it feel like a collection of objects, a crowd of absent bodies, or one strange organism made from shoes?$s$,
    $s$https://www.sfmoma.org/artwork/FC.475/$s$, $s$https://www.sfmoma.org/artist/Philip_Guston/$s$, $s$The full SFMOMA image was visually audited. The previous hotspots incorrectly emphasized visible bent legs and a rug edge. They were replaced with three unmistakable details: the upright upper-left boot, the central orange shoe, and the compressed pale shoes along the bottom.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three hotspot descriptions and coordinates now match visible footwear in the image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The red boot at the upper left$s$, $s$Tap the tall red boot rising at the far upper-left, with its dark tread and black-edged openings.$s$,
    $s$Because it stands upright while most of the shoes lie sideways, this boot feels almost figure-like. Yet it remains hollow and unoccupied. Guston gives an ordinary object the posture of a person while emphasizing that the person is missing.$s$, $s$Does the upright boot feel like part of the pile or like someone standing behind it?$s$,
    13, 29, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The orange shoe in the center$s$, $s$Look at the bright orange sole near the lower center, stacked above another orange-and-black form.$s$,
    $s$Its warm color pulls it forward from the surrounding gray, pink, and red footwear. The repeated holes and thick black contour make it unmistakably a shoe, but its isolated brightness also turns it into the heap’s visual center.$s$, $s$Why does this one shoe command more attention than the larger forms around it?$s$,
    52, 65, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The pale shoes pressed against the bottom$s$, $s$Tap the row of fleshy pink shoes along the lower edge, where thick black outlines squeeze them together.$s$,
    $s$The pale shoes are closest to the viewer, yet they are flattened into the bottom of the pile. Their skinlike color makes them feel bodily even though no feet are visible, turning the heap into something uncomfortably close to a mass of compressed figures.$s$, $s$Do these forms read first as shoes or as parts of bodies?$s$,
    51, 84, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 3  Philip Guston - The Street  [LC-011 -> A046]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A046$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Try to find a route through the painting. The pale outer field seems open, but the dense red, black, and gray mass in the middle repeatedly blocks the eye.$s$, $s$Now step back and see whether the central cluster feels like a city seen from within, a crowd, or simply paint compressed until space becomes difficult.$s$,
    $s$https://www.sfmoma.org/artwork/FC.752/$s$, $s$https://www.philipguston.org/home/chronology$s$, $s$The full SFMOMA image was visually audited. The former pale central block and dark left-side passage did not correspond to the strongest visible features. The revised hotspots mark the dominant red center, black knot at center-right, and small orange patch at lower left.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: all three coordinates directly match distinct color passages in the official image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The bright red center$s$, $s$Tap the dense scarlet passage slightly above center, where several blocky red strokes crowd together.$s$,
    $s$This red area is the painting’s strongest concentration of color. It does not describe a specific building or figure, but its density makes it feel like an event—something loud and active inside the otherwise pale gray field.$s$, $s$Does the red feel like a place you could enter, or something pushing toward you?$s$,
    52, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The black knot to the right$s$, $s$Look just right of center for the compact charcoal-black strokes embedded inside the red and pink cluster.$s$,
    $s$The dark knot stops the red from reading as a flat decorative field. It adds weight and resistance, making the central mass feel layered and difficult to see through.$s$, $s$Does the black shape create depth, or simply make the surface feel heavier?$s$,
    68, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The orange patch at lower left$s$, $s$Tap the small orange passage in the lower-left part of the central cluster.$s$,
    $s$This warm patch is much smaller than the red center, but its difference in hue makes it unexpectedly visible. It acts like a brief side note or flash at the edge of a larger, more turbulent event.$s$, $s$Does this orange patch pull your eye outward or lead it back into the center?$s$,
    23, 61, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 3  Philip Guston - Brushes  [LC-012 -> A047]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A047$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Look first at the gray container, then at the brushes sticking out of it at different angles. The painting is quiet and simple, but each tool seems to have its own posture.$s$, $s$Step back and ask whether this feels like a still life of studio equipment or a loose group portrait in which the painter appears only through the tools he has left behind.$s$,
    $s$https://www.sfmoma.org/artwork/FC.681/$s$, $s$https://gustoncrllc.org/catalogue-raisonne/works/2567$s$, $s$The full image was visually audited. The previous description of a row of thick brushes with paint-loaded bristles was inaccurate. The work actually shows individual brushes emerging from a gray container. All three hotspots were replaced accordingly.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all former descriptions and coordinates were replaced to match the diagonal red brush, pale right brush, and gray container.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The long red brush leaning across$s$, $s$Tap the thick red brush that rises diagonally from the container toward the upper-left.$s$,
    $s$Its diagonal cuts across the mostly vertical brushes and gives the still arrangement a sense of movement. Because it is broader and brighter than the others, it feels less like one tool among many and more like the main character of the group.$s$, $s$Does the leaning brush look active, unstable, or simply more individual?$s$,
    37, 24, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The pale brush on the right$s$, $s$Look at the tall off-white brush near the upper-right, standing between darker black and red handles.$s$,
    $s$Its pale color almost merges with the pink background, unlike the dark brushes that announce themselves clearly. The brush seems to appear slowly, making the eye work harder to separate tool from surrounding paint.$s$, $s$Does this brush feel present, or as though it is fading into the room?$s$,
    65, 31, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The scratched gray container$s$, $s$Tap the broad front of the gray brush holder, where loose vertical strokes and pink-gray smears remain visible.$s$,
    $s$The container is not painted as a smooth solid object. Its surface carries revisions, streaks, and uneven color, making it feel worn and handled. The humble vessel receives as much painterly attention as the brushes it holds.$s$, $s$Does the container feel sturdy, dented, or almost transparent?$s$,
    48, 67, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 3  Philip Guston - Late Fall  [LC-013 -> A048]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A048$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the broad gray field register first, then notice how a few dark rounded masses gather inside it. The title may suggest a season, but the painting gives you weight and fading light rather than a recognizable landscape.$s$, $s$Step back and ask whether the dark forms feel like objects emerging from gray space or like the last concentrated areas of a painting dissolving toward its edges.$s$,
    $s$https://www.sfmoma.org/artwork/FC.779/$s$, $s$https://www.tate.org.uk/documents/1863/TM_EXH_0089_Philip_Guston_LPG_Web_AW.pdf$s$, $s$The full SFMOMA image was visually audited. The previous hotspot descriptions were too generalized and did not target the painting’s most distinct structures. The revised points identify the large upper-left dark oval, the stacked dark masses at right-center, and the visible red accents along the right edge.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: all three coordinates directly match clearly visible dark and red passages.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The largest dark oval$s$, $s$Tap the broad black-gray rounded form in the upper-left half.$s$,
    $s$This is the painting’s heaviest single mass. Its curved top and dense interior make it feel almost object-like, but its edges remain brushed and uncertain. It hovers between a recognizable shape and a compressed accumulation of paint.$s$, $s$Does this dark form feel solid enough to name?$s$,
    43, 25, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The stacked dark forms on the right$s$, $s$Look at the two rounded charcoal masses stacked vertically just right of center.$s$,
    $s$Their repetition suggests a sequence or pair, yet they do not become identifiable objects. Together they create a downward weight, making the right side feel compressed and almost bodily.$s$, $s$Do the two forms feel connected, or merely crowded together?$s$,
    65, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The red marks near the edge$s$, $s$Tap the small red accents along the far-right side, where they break through the surrounding gray.$s$,
    $s$These red marks are minor in scale but intense against the muted field. They resemble the last remnants of warmth inside a painting dominated by charcoal and cold gray.$s$, $s$Do the red accents feel like something surviving or something disappearing?$s$,
    88, 39, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 3  Philip Guston - As It Goes  [LC-014 -> A049]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A049$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin with the jumble of studio objects across the upper half, then look down at the eyeglasses lying alone on the red tabletop. The painting moves between crowded machinery and one strangely personal object.$s$, $s$Now step back and decide whether the scene feels like work continuing, work interrupted, or the residue of a long day in the studio.$s$,
    $s$https://www.sfmoma.org/artwork/FC.501/$s$, $s$https://www.tate.org.uk/documents/1863/TM_EXH_0089_Philip_Guston_LPG_Web_AW.pdf$s$, $s$The full artwork image was visually audited. The previous clocklike circle, bodily fragment, and cropped-edge hotspot did not accurately describe the painting. All three were replaced with the visible upper spiral, central downward brush, and eyeglasses across the foreground.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous hotspot descriptions and coordinates were replaced.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The orange spiral at the top$s$, $s$Tap the orange-and-black spiral near the upper center, floating above the other circular forms.$s$,
    $s$The spiral resembles a coiled line, target, or roll of material, but Guston leaves its function unclear. Its clean circular rhythm stands out against the heavier rectangular objects below and gives the clutter an almost hypnotic center.$s$, $s$Does the spiral feel like an object, a symbol, or simply a line going nowhere?$s$,
    51, 16, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The brush standing downward$s$, $s$Look at the large brush near the center, with a pale handle and red bristles pointing toward the tabletop.$s$,
    $s$The brush is one of the few objects whose function is immediately clear. Yet it is not shown making a mark; it hangs among clocks, wheels, and studio debris. The painter’s tool becomes part of the same tired machinery as everything else.$s$, $s$Does the brush seem ready to work or already put aside?$s$,
    51, 55, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The glasses left on the table$s$, $s$Tap the pair of round eyeglasses lying across the red foreground near the bottom center.$s$,
    $s$The glasses are small compared with the piled forms above, but they introduce the absent body most directly. Someone has taken them off. Their vulnerable position turns the crowded still life into a scene of temporary withdrawal or exhaustion.$s$, $s$Do the glasses make the painter feel more present or more absent?$s$,
    57, 84, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 4  Roy Lichtenstein - Figures with Sunset  [LC-015 -> A055]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A055$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Do not try to solve the whole scene at once. Begin with one recognizable detail, then watch how it collides with images borrowed from entirely different visual languages.$s$, $s$Step back and ask whether this feels like a single scene or a deliberate mashup. What keeps the parts together when their styles, scales, and possible references do not agree?$s$,
    $s$https://www.sfmoma.org/artwork/99.374/$s$, $s$https://www.sfmoma.org/artwork/99.374/$s$, $s$SFMOMA’s detailed audio description identifies the sunset at left-center, the man in a red tie behind the yellow wall, and the central blue-dotted oval as a mirror held by the reclining figure. The earlier coordinates and interpretation did not accurately match these features.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three coordinates and the third hotspot interpretation were corrected against the official full image and audio description.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The small sunset inside the chaos$s$, $s$Tap the red semicircle rising from the yellow-and-black inverted triangle left of center.$s$,
    $s$The title gives the sunset special importance, yet it is only one compact symbol inside a much larger crowd of figures, buildings, dots, and brushstrokes. Lichtenstein reduces an entire landscape event to a graphic sign that could be read almost instantly.$s$, $s$Why name the whole painting after a detail that occupies so little of it?$s$,
    34, 40, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The man behind the yellow wall$s$, $s$Look at the pale-faced man with black hair and a red tie in the upper-right half, partly blocked by the tall yellow rectangle.$s$,
    $s$He is among the painting’s clearest human figures, yet even he seems assembled from mismatched fragments. SFMOMA’s audio notes that he resembles photographs of the young Pablo Picasso, adding another borrowed art-historical image to the visual collage.$s$, $s$Does recognizing a convincing face make the surrounding scene easier to understand?$s$,
    75, 32, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The mirror held by the reclining figure$s$, $s$Tap the large upright oval with blue dots near the center-right, just above the cream-colored drapery.$s$,
    $s$SFMOMA identifies this oval as a mirror held by the reclining figure. It looks like an empty head at first because it occupies the place where we expect a face, but its dotted reflection redirects attention from identity to the act of looking.$s$, $s$Did you see a mirror first, or a blank face?$s$,
    63, 52, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 4  Roy Lichtenstein - Coup de Chapeau II  [LC-016 -> A056]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A056$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Trace the sculpture from the cloudlike base upward: a long striped curve, a jagged burst, and finally a yellow hand tipping a hat. The whole gesture has been stretched into a vertical sequence.$s$, $s$Step back and compare its dramatic front with its extremely thin side. Does it feel more like a sculpture, a comic image cut free from a page, or both at once?$s$,
    $s$https://www.sfmoma.org/artwork/FC.704/$s$, $s$https://www.lichtensteincatalogue.org/$s$, $s$The official frontal image was visually audited. The top hand-and-hat, central burst, and striped rising curve are all clearly visible at the revised coordinates. SFMOMA confirms the sculpture is painted and patinated bronze.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED: all three points match the frontal image. The sculpture’s extreme thinness still requires a side or installation view for the app to demonstrate fully.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The hand tipping the hat$s$, $s$Tap the yellow hand-and-hat form at the very top.$s$,
    $s$The title means a tip of the hat, a quick gesture of acknowledgment. Lichtenstein freezes that brief action and enlarges it until the hand becomes the sculpture’s crowning image.$s$, $s$Does making the gesture monumental make it feel polite, comic, or theatrical?$s$,
    51, 11, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The burst around the red center$s$, $s$Tap the jagged black-and-white explosion surrounding the red shape just above the sculpture’s midpoint.$s$,
    $s$The burst is comic-book shorthand for impact or sudden emphasis. Cast in bronze, however, an image designed to appear instantaneous becomes heavy and permanent.$s$, $s$What happens to the sense of speed when an impact symbol is made from bronze?$s$,
    50, 40, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The striped sweep rising from the cloud$s$, $s$Follow the long white, blue, and yellow band from the cloudlike base toward the central burst.$s$,
    $s$The curve carries the eye upward like a motion trail. Its painted stripes make a nearly flat bronze element look flexible and fast, even though it cannot actually move.$s$, $s$Does the painted curve feel more like an arm, a trail of motion, or pure graphic design?$s$,
    49, 67, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 4  Roy Lichtenstein - Live Ammo (Tzing!)  [LC-017 -> A057]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A057$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the image arrive at comic-book speed: sound effect, face, weapon. Then slow down and notice how a few flat colors and outlines produce urgency without realistic detail.$s$, $s$Step back and decide whether the clean graphic style intensifies the danger or keeps it at the distance of entertainment.$s$,
    $s$https://www.sfmoma.org/artwork/FC.612/$s$, $s$https://www.lichtensteincatalogue.org/$s$, $s$The full image was visually audited. The earlier points were close, but the face and rifle coordinates were refined to land on the visible black-yellow facial division and the actual rifle across the lower edge.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all three coordinates now land directly on the red sound effect, central face, and lower rifle.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The red 'TZING!'$s$, $s$Tap the red word “TZING!” in the upper-left, directly beneath the white diagonal streak.$s$,
    $s$The sound effect is not merely a caption explaining the scene. Its red letters, tilt, and placement make sound visible, so reading becomes part of experiencing the impact.$s$, $s$Did you hear the sound internally before you examined the soldier?$s$,
    20, 20, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The face split into yellow and black$s$, $s$Look at the soldier’s face near the center, where hard black shapes cut across the yellow skin around the eyes, nose, and cheek.$s$,
    $s$Rather than gradual modeling, the face uses abrupt graphic divisions. Those simplified shapes make the expression immediately legible while also reminding us that it came from a printed comic image.$s$, $s$Does the simplified face feel more dramatic or less human?$s$,
    54, 47, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The rifle across the bottom$s$, $s$Tap the yellow rifle and coiled barrel running across the lower-right edge.$s$,
    $s$The weapon is cropped by the canvas and pushed close to the viewer. It functions less as a carefully described object than as a directional force carrying the action out of the image.$s$, $s$Does the cropped rifle make you feel inside the scene or safely outside it?$s$,
    72, 87, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 4  Roy Lichtenstein - Portable Radio  [LC-018 -> A058]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A058$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$First read this as a flat painted radio. Then notice the actual leather strap and metal edging, which turn the painting itself into something that can almost pass as the object it represents.$s$, $s$Step back and decide what category it belongs to now: a picture of a radio, a radio-shaped painting, or a joke about the difference between images and things.$s$,
    $s$https://www.sfmoma.org/artwork/FC.604/$s$, $s$https://www.sfmoma.org/artwork/FC.604/$s$, $s$SFMOMA’s audio specifically discusses the hand-painted radio image and its actual strap. The official image confirms the speaker field and paired AM/FM tuning bands at the revised points.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED: all three coordinates directly match the physical strap, dotted speaker, and paired tuning scales.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The real leather strap$s$, $s$Tap the brown strap arching above the rectangular canvas.$s$,
    $s$SFMOMA explains that the radio image was hand-painted but fitted with a real carrying strap. The physical accessory makes the artwork behave like the consumer object it depicts without ever becoming functional.$s$, $s$Does the real strap make the painted radio more convincing or more obviously artificial?$s$,
    50, 9, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The speaker made from dots$s$, $s$Zoom into the large field of regularly spaced black dots in the lower-left half.$s$,
    $s$From across the room the dots become a perforated speaker grille. Up close, they remain a hand-painted pattern, exposing how little visual information is needed for the eye to construct a familiar product.$s$, $s$At what distance do the dots turn into a speaker?$s$,
    29, 65, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The two tuning scales$s$, $s$Look at the paired numbered bands in the upper-right, labeled with AM and FM frequencies.$s$,
    $s$The scales imitate practical information and invite the behavior of tuning, but the indicators cannot move and no station can be heard. Usefulness has been converted into appearance.$s$, $s$Why include precise-looking numbers on an object that cannot work?$s$,
    65, 27, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 4  Roy Lichtenstein - Tire  [LC-019 -> A059]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A059$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Notice how quickly the image reads as a tire. Then separate the tread, sidewall, and hub into flat black-and-white shapes until the useful object starts behaving like abstract design.$s$, $s$Step back and ask whether you now see a tire, an advertisement-like image of one, or a monumental pattern that only happens to describe a tire.$s$,
    $s$https://www.sfmoma.org/artwork/FC.705/$s$, $s$https://www.moma.org/collection/works/79807$s$, $s$The full official image was visually audited. The earlier tread point was too low and far right, and the hub point was also too low. Revised coordinates now land inside the central zigzag tread, black sidewall, and circular hub.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all three coordinates directly match the tread, sidewall, and hub.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The zigzag tread$s$, $s$Tap the repeated angular tread pattern covering the right half.$s$,
    $s$The tread is designed for traction, but enlarged here it becomes a powerful all-over pattern. Its repetition creates rhythm independently of the object’s practical function.$s$, $s$When do these zigzags stop describing rubber and begin to look abstract?$s$,
    72, 42, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The black sidewall$s$, $s$Look at the broad, nearly solid black band curving around the left half of the tire.$s$,
    $s$This dark mass gives the object its weight and roundness, yet it is still a flat painted shape. Lichtenstein creates volume through a severe contrast rather than gradual shading.$s$, $s$Does this black band feel rounded or pasted onto the canvas?$s$,
    26, 40, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The hub drawn with shorthand$s$, $s$Zoom into the circular wheel hub left of center, where short curved lines and black marks imply polished metal.$s$,
    $s$A few standardized marks stand in for reflection, depth, and mechanical complexity. The hub shows how efficiently a commercial illustration can persuade us to see a shiny three-dimensional object.$s$, $s$How few marks are needed before the hub begins to look metallic?$s$,
    28, 55, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 5  Sigmar Polke - Ohne Titel (Untitled), 2003  [LC-020 -> A060]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A060$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Take in the scene as a staged act of magic: a dark magician faces a pale apparition while ritual objects sit inside circles on the floor. Then notice how the thin fabric lets the real stretcher show through the illusion.$s$, $s$Step back and decide what is producing the magic—the depicted ritual, the semi-transparent painting surface, or your own willingness to treat old printed images as a living scene.$s$,
    $s$https://www.sfmoma.org/artwork/FC.735/$s$, $s$https://www.sfmoma.org/artwork/FC.735/#essay$s$, $s$SFMOMA’s audio description directly identifies the pale ghost, ritual objects, protective circles, magician, and theatrical curtain. The official image was visually audited and the markers were refined to the ghost’s torso, central object cluster, and curtain.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all three coordinates directly match the apparition, ritual objects, and curtain in the official image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The pale apparition$s$, $s$Tap the translucent hooded figure left of center, facing the darker magician with both arms raised.$s$,
    $s$The ghost is drawn so faintly that the golden ground and stretcher remain visible through it. Polke makes the apparition seem immaterial by allowing the painting’s actual support to invade the body.$s$, $s$At what point does this pale outline become a figure rather than an unfinished stain?$s$,
    37, 45, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The ritual objects between them$s$, $s$Look at the cluster on the floor near the center: two candles, a skull, book, picture, and goblet contained within the circular boundary.$s$,
    $s$These small objects make the encounter legible as a séance or occult ritual. Their careful placement contrasts with the ghost’s transparency, giving the supposed magic a strangely practical setup.$s$, $s$Which object makes the scene feel most like a deliberate ritual?$s$,
    57, 66, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The curtain opening the stage$s$, $s$Tap the large black-and-white curtain hanging down the far-left side.$s$,
    $s$The curtain frames the scene like a theatrical performance. At the same time, the fabric support and stretcher show through elsewhere, so the painting keeps switching between a depicted stage and the real object hanging on the museum wall.$s$, $s$Does the curtain invite you into the illusion or expose it as theater?$s$,
    10, 39, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 5  Sigmar Polke - Untitled  [LC-021 -> A061]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A061$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Find the seated woman first, then notice how difficult the surrounding surface makes that recognition. Her body is crossed by stains, scribbles, blocks of color, and unrelated images that refuse to stay behind her.$s$, $s$Step back and ask whether the figure dominates the disorder or is being absorbed by it. Does the painting feel like a portrait, a collage of competing signals, or both?$s$,
    $s$https://www.sfmoma.org/artwork/FC.394/$s$, $s$https://www.sfmoma.org/artist/Sigmar_Polke/$s$, $s$The official image shows a seated female figure balancing books amid dense acrylic layers. The prior face, diagonal, and stain hotspots did not describe the actual composition and were replaced with the books, red lips, and crossed legs.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous hotspot descriptions and coordinates were replaced against the official image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The books balanced overhead$s$, $s$Tap the stack of outlined books resting above the woman’s head near the upper-right center.$s$,
    $s$The books are drawn with unusually clean black contours compared with the smeared color around them. Their impossible balance makes the figure seem caught between a comic illustration and an unstable performance.$s$, $s$Do the books make her look composed, burdened, or absurd?$s$,
    61, 14, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The red lips inside the layered face$s$, $s$Look at the bright red lips near the upper-center, surrounded by overlapping green, black, and flesh-colored lines.$s$,
    $s$The lips provide one of the fastest points of recognition in a face that has been fragmented by several drawing systems. A tiny patch of saturated red stabilizes identity while the rest of the head remains visually unsettled.$s$, $s$How much of the face do you construct around these lips?$s$,
    48, 24, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The long crossed legs$s$, $s$Follow the pale legs extending diagonally through the lower half and crossing near the bottom.$s$,
    $s$The legs give the seated pose a clear bodily structure, but stains, lettering, and colored marks pass across them. The figure remains readable not because she is isolated from the background, but because your eye keeps reconstructing her through interference.$s$, $s$Where does one leg become hardest to distinguish from the surrounding marks?$s$,
    55, 74, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 5  Sigmar Polke - Springbrunnen (Fountain)  [LC-022 -> A062]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A062$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Stand back until the white dotted mass begins to read as splashing water. Then move closer and watch the fountain dissolve into enlarged dots, dark gaps, and patches of green, yellow, and red.$s$, $s$Step back again. Does the fountain regain movement, or does the visible printing pattern prevent the image from becoming seamless?$s$,
    $s$https://www.sfmoma.org/artwork/FC.312/$s$, $s$https://www.moma.org/artists/4637$s$, $s$The full SFMOMA image was visually audited. The former rising spray and basin descriptions imposed a conventional fountain structure that the image does not clearly show. Revised hotspots target the visible white raster field, yellow dotted wedge, and central green-black arc.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three hotspots now point to unmistakable raster and color structures in the official image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The white spray at center-right$s$, $s$Tap the large white field of black raster dots occupying the middle-right portion.$s$,
    $s$From a distance, the bright dotted mass suggests water bursting upward and outward. Up close, it becomes an exposed printing code: evenly spaced circles pretending to be light, spray, and motion.$s$, $s$At what distance do the dots begin to behave like water?$s$,
    67, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The yellow triangular passage$s$, $s$Look at the bright yellow dotted wedge in the upper-left half, bordered by black and green.$s$,
    $s$This sharp triangular area does not resemble natural water on its own. It acts more like a shard of reproduced light, showing how the fountain image has been broken into graphic zones rather than modeled continuously.$s$, $s$Does this yellow shape belong to the fountain, or does it read first as abstraction?$s$,
    32, 29, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The dark-green arc through the center$s$, $s$Follow the broad green-black curve sweeping diagonally through the center of the composition.$s$,
    $s$The dark arc interrupts the pale spray and gives the image its strongest directional movement. Because it is built from color and raster pattern rather than clear contour, it can register as shadow, structure, foliage, or simply a force cutting across the fountain.$s$, $s$What do you see in this curve before you begin naming it?$s$,
    48, 50, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 5  Sigmar Polke - Ohne Titel (Untitled)  [LC-023 -> A063]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A063$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin with the dark long-legged bird in the center-right. Then follow the circles, red ribbonlike stroke, gridded patches, and orange-blue marks that turn the surrounding space into something between landscape, diagram, and dream.$s$, $s$Step back and decide whether the bird organizes the image or merely happens to be the most recognizable visitor inside a field of unrelated signs.$s$,
    $s$https://www.sfmoma.org/artwork/FC.428.2/$s$, $s$https://www.sfmoma.org/artist/Sigmar_Polke/$s$, $s$The official image clearly depicts a dark crane-like figure, a thick red serpentine band, and a large ringed blue disk. The previous human-face interpretation was entirely inconsistent with the image and was replaced.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous hotspots were replaced with directly visible bird, red-band, and blue-disk details.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The dark birdlike body$s$, $s$Tap the black-gray bird or crane form at center-right, where its curved neck rises above the rounded body.$s$,
    $s$This is the image’s clearest recognizable figure. Yet its body is built from translucent watercolor and loose contour, so it remains embedded in the same shifting material as the surrounding symbols.$s$, $s$Does the bird feel firmly present or as temporary as the washes around it?$s$,
    63, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The red serpentine band$s$, $s$Follow the thick red stroke descending from the upper-right, curving past the bird, and continuing toward the bottom.$s$,
    $s$The red band crosses the composition without behaving like a believable object. It functions as a strong visual route, tying the upper and lower areas together while refusing to explain whether it is ribbon, smoke, water, or pure gesture.$s$, $s$Does the red line lead your eye through the image or divide it?$s$,
    72, 37, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The blue circle above$s$, $s$Tap the large blue disk surrounded by yellow and orange rings near the upper center.$s$,
    $s$The circle resembles a sun, target, lens, or floating sign, but the black scratches inside prevent it from settling into one identity. It shows how Polke lets simple symbols attract recognition while keeping their meaning unstable.$s$, $s$What did you call this circle before noticing the marks inside it?$s$,
    50, 15, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Most Wanted Men No. 12, Frank B.  [LC-024 -> A008]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A008$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Read the two panels as police evidence: one frontal view and one profile. Then notice how enlargement and coarse printing transform a small identification photograph into a monumental public image.$s$, $s$Step back and compare the two views. Do they give you fuller access to Frank B., or only repeat the same institutional way of seeing him?$s$,
    $s$https://www.sfmoma.org/artwork/FC.605.A-B/$s$, $s$https://www.sfmoma.org/exhibition/andy-warhol-from-a-to-b-and-back-again/$s$, $s$The official image was visually audited. The first two coordinates were confirmed with minor refinements; the former third point sat close to the gap between panels and was moved to the clearly visible black hair and shadow in the frontal mug shot.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all three coordinates directly match the frontal face, profile, and dense frontal hair.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The frontal mug shot$s$, $s$Tap the face in the left panel, where Frank B. looks directly into the police camera.$s$,
    $s$The frontal image is designed for recognition, not intimacy. Its fixed gaze, identification board, and even lighting reduce the encounter to recorded evidence, yet the monumental scale makes the anonymous police subject confront the viewer like a celebrity portrait.$s$, $s$Do you feel addressed by a person or presented with a record?$s$,
    27, 45, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The profile photograph$s$, $s$Look at the right panel, where the forehead, nose, lips, and chin form a sharp side silhouette.$s$,
    $s$The second angle is meant to confirm identity by supplying information the frontal photograph might miss. Yet it does not reveal character or motive; it merely extends the visual inventory of the face.$s$, $s$Does the side view tell you anything meaningful beyond physical shape?$s$,
    74, 45, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The hair swallowed by black ink$s$, $s$Zoom into the dense black hair and surrounding shadow at the top of the frontal photograph.$s$,
    $s$Fine photographic detail collapses into a heavy printed mass. The silkscreen makes the image bolder and more reproducible while simultaneously destroying information that a mug shot was supposedly created to preserve.$s$, $s$Which details of the original person disappear inside this black field?$s$,
    28, 21, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Triple Elvis [Ferus type]  [LC-025 -> A009]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A009$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the three identical cowboy poses register together, then compare them one by one. The repetition does not produce three different moments; it keeps returning you to the same publicity photograph.$s$, $s$Step back and ask whether the repeated pose makes Elvis more commanding or makes him behave like a printed product available in multiples.$s$,
    $s$https://www.sfmoma.org/artwork/FC.556/$s$, $s$https://www.sfmoma.org/exhibition/andy-warhol-from-a-to-b-and-back-again/$s$, $s$The full work was visually audited using the SFMOMA installation image and artwork reproduction. The earlier claim that the gun arms overlap was not supported by the Ferus-type arrangement. Hotspots now identify the left pistol pose, the repeated central buckle, and the right figure at the edge.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: Hotspot 2 and Hotspot 3 were rewritten; all points now correspond to visible repeated details.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The left Elvis and his pistol$s$, $s$Tap the left figure’s face and gun hand.$s$,
    $s$This first full impression makes the borrowed publicity pose easiest to read: Elvis faces forward, legs spread, pistol aimed outward. The film-star persona arrives already packaged as an instantly legible type.$s$, $s$Does the pose feel threatening, theatrical, or carefully rehearsed?$s$,
    18, 38, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The same belt buckle again$s$, $s$Tap the large belt buckle on the central Elvis, then compare it with the buckles on the figures beside him.$s$,
    $s$Small costume details reveal that these are not three separate performances. The buckle, holster, folds, and stance recur almost exactly, exposing the mechanically repeated source beneath the illusion of a crowd.$s$, $s$When does repetition stop adding information?$s$,
    50, 53, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The third figure cropped by the edge$s$, $s$Look at the Elvis on the far right, where part of the body approaches or is cut by the canvas boundary.$s$,
    $s$The repeated image could theoretically continue beyond the painting. Ending with a figure pressed against the edge makes the work feel like one section of an ongoing strip rather than a carefully centered group portrait.$s$, $s$Do you imagine another Elvis continuing beyond the canvas?$s$,
    84, 48, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Tunafish Disaster  [LC-026 -> A010]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A010$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Read the surface like a reproduced newspaper page: rows of tuna cans alternate with small photographs of two women. Then notice how the same tragic information is repeated until packaging and death occupy one visual system.$s$, $s$Step back and ask whether repetition helps you absorb what happened or turns the event into another pattern of consumable images.$s$,
    $s$https://www.sfmoma.org/artwork/FC.608/$s$, $s$https://www.moma.org/collection/works/79809$s$, $s$The complete composition was visually audited against reproductions showing alternating can and portrait rows. The former lower-portrait coordinate landed too low, so the victim point was moved to the first clear portrait band; the faint-print point was moved to a weak lower-right can.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: coordinates now land on an upper can, a visible portrait pair, and a faint lower-right can.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$A tuna can at the top$s$, $s$Tap one of the dark tuna cans in the upper row.$s$,
    $s$The can is an ordinary supermarket object, but the accompanying news story connected contaminated tuna with two deaths. Warhol preserves the package’s commercial familiarity while placing it inside an image of disaster.$s$, $s$How long can the can continue to look ordinary once you know the story?$s$,
    27, 18, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The alternating victim portraits$s$, $s$Tap one of the paired women’s photographs in the first portrait row beneath the upper cans.$s$,
    $s$The small newsprint portraits identify Mrs. McCarthy and Mrs. Brown, yet their faces are repeated like product labels. The format preserves their likeness while also subjecting them to the same mechanical circulation as the cans.$s$, $s$Does repetition keep the women present or make them easier to overlook?$s$,
    42, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The broken final can$s$, $s$Look toward the lower-right for a can impression that is faint, incomplete, or partly lost in the pale ground.$s$,
    $s$The uneven transfer interrupts the apparent regularity of the grid. A failed print resembles damaged news reproduction or information dropping out, making mechanical repetition visibly unreliable.$s$, $s$Does the weak impression feel less important or more haunting than the darker cans?$s$,
    73, 80, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Telephone [1]  [LC-027 -> A011]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A011$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Identify the object as an old candlestick telephone: a round mouthpiece at the top, a separate receiver hanging to the left, and a tall stem rising from the base. Then notice the loose blue pencil marks behind it.$s$, $s$Step back and decide whether the telephone feels carefully illustrated, hastily copied, or caught between a commercial drawing and a studio sketch.$s$,
    $s$https://www.sfmoma.org/artwork/FC.499/$s$, $s$https://www.warhol.org/andy-warhols-life/figment-of-the-living/$s$, $s$The official image clearly shows a candlestick telephone rather than the modern phone body described previously. The work was fully rebuilt around its top transmitter, left receiver, and central stem with weighted base.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous hotspot descriptions and coordinates were replaced.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The round mouthpiece$s$, $s$Tap the large circular transmitter at the top of the tall central stem.$s$,
    $s$The black-and-white highlights make the metal mouthpiece look glossy and dimensional, even though the form is built from blunt graphic shapes. It is the part into which a caller would speak, making the silent image center on an absent voice.$s$, $s$Does the mouthpiece seem ready to receive speech or sealed inside the drawing?$s$,
    55, 17, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The receiver hanging at the left$s$, $s$Look at the smaller black earpiece attached to the short support on the left side.$s$,
    $s$Unlike a modern handset, speaking and listening happen through two physically separate parts. This side receiver makes the telephone’s unfamiliar mechanism legible while giving the composition an awkward, almost bodily asymmetry.$s$, $s$Does the hanging receiver make the telephone look functional or strangely anatomical?$s$,
    27, 53, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The tall stem and weighted base$s$, $s$Follow the narrow central column downward to the rounded black base.$s$,
    $s$The long upright stem holds the mouthpiece at speaking height and gives the telephone a figurelike posture. Warhol exaggerates its verticality, turning a utilitarian device into something resembling a standing character.$s$, $s$Does the telephone begin to look like a person once you follow its full height?$s$,
    54, 77, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Before and After [3]  [LC-028 -> A012]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A012$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Compare the two profiles as quickly as an advertisement asks you to. Then slow down and notice how a tiny change in the nose is framed as a complete transformation.$s$, $s$Step back and ask whether the work documents improvement or shows how advertising teaches viewers to diagnose a normal face as defective.$s$,
    $s$https://www.sfmoma.org/artwork/FC.675/$s$, $s$https://www.moma.org/collection/works/79808$s$, $s$The official composition was visually audited. The profile coordinates were adjusted to the actual nose contours, and the central point was placed inside the dark dividing interval.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all three points match the two nose profiles and the central division.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The longer 'before' profile$s$, $s$Tap the nose and upper lip in the left profile.$s$,
    $s$The left image presents the more projecting nose as a problem without offering medical context or a real person’s voice. A simple contour becomes evidence only because the comparison tells us to judge it.$s$, $s$Would this nose seem incorrect without the second profile beside it?$s$,
    25, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The shortened 'after' nose$s$, $s$Look at the nose in the right profile, where the bridge and tip have been redrawn into a smaller shape.$s$,
    $s$The promised improvement depends on only a slight change in outline. The nearly identical eyes, lips, and hairstyle make the altered nose carry the entire claim of a new identity.$s$, $s$How much transformation is the image asking you to imagine?$s$,
    67, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The black gap between profiles$s$, $s$Focus on the vertical dark interval separating the two faces.$s$,
    $s$The advertisement removes surgery, pain, time, cost, and recovery from the transformation. The gap performs all of that invisible work instantly, allowing one profile to become the other without consequence.$s$, $s$What has been conveniently erased inside this division?$s$,
    48, 50, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Nine Multicolored Marilyns [Reversal Series]  [LC-029 -> A013]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A013$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the nine faces register as a grid before choosing one panel. Each uses the same photograph, but the negative-style printing and changing color combinations make recognition repeatedly break and return.$s$, $s$Step back and ask whether you are seeing nine versions of Marilyn Monroe or nine demonstrations of how easily one public image can be reformatted.$s$,
    $s$https://www.sfmoma.org/artwork/FC.229/$s$, $s$https://www.christies.com/en/lot/lot-6318425$s$, $s$The nine-panel reproduction was visually audited. The former central 'color slip' point did not identify an obvious misregistration. It was replaced by the unmistakable red-orange flare in the lower-middle panel; the other points were refined to the top-left and lower-right faces.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: Hotspot 2 was replaced, and all coordinates now land on distinct panels and visible color features.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The top-left reversed face$s$, $s$Tap Marilyn’s face in the upper-left panel, where pale yellow and pink features emerge from black.$s$,
    $s$Instead of printing shadows as dark information on a light face, the Reversal Series turns the image into something like a photographic negative. Familiar features glow out of darkness, making an iconic face feel spectral.$s$, $s$Does the reversed contrast make Marilyn more vivid or less physically present?$s$,
    18, 17, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The red registration flare$s$, $s$Look at the lower-middle panel, where a strong red-orange patch extends around the hair and side of the face.$s$,
    $s$The color does not simply fill a neat facial shape. It sits as a separate printing layer whose edges remain visible, exposing the portrait as a constructed sequence of screens rather than a seamless likeness.$s$, $s$Does the displaced color make this panel feel more mechanical or more expressive?$s$,
    58, 82, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The blue face at lower right$s$, $s$Tap the lower-right panel, where cool blue features repeat the same fixed eyes and smile.$s$,
    $s$Changing the palette can make the emotional temperature seem different even though the underlying photograph never changes. The viewer supplies variety to an expression held mechanically still.$s$, $s$Why does this blue Marilyn feel different when her expression is identical?$s$,
    83, 82, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Robert Mapplethorpe  [LC-030 -> A014]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A014$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Find Mapplethorpe’s face inside the layered printing, then compare the two offset versions. The portrait refuses to settle into one stable outline.$s$, $s$Step back and ask whether the doubled face suggests movement, photographic error, or two competing versions of the same public identity.$s$,
    $s$https://www.sfmoma.org/artwork/E.2019.129/$s$, $s$https://www.warhol.org/andy-warhols-life/$s$, $s$The available full reproduction was visually checked against the existing doubled portrait structure. The coordinates were refined toward the clearest eye, offset duplicate, and lower facial overlap rather than claiming one entire face is consistently clearer.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all three points correspond to the visible eye, duplicate impression, and facial overlap.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The most legible eye$s$, $s$Tap the eye that remains clearest within the overlapping portrait.$s$,
    $s$The eye anchors recognition even while neighboring contours split and repeat. A single sharp feature is enough for the viewer to keep rebuilding a face from unstable layers.$s$, $s$Which feature lets you identify the portrait first?$s$,
    39, 42, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The offset second profile$s$, $s$Look at the duplicate face shifted sideways from the clearer impression.$s$,
    $s$The second printing does not provide a new pose. It repeats the same photographic information out of register, converting a static portrait into an optical echo.$s$, $s$Does the duplicate feel like motion, memory, or printing error?$s$,
    62, 45, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The overlap at the mouth and jaw$s$, $s$Zoom into the lower face where the two impressions and their colors cross.$s$,
    $s$Here color stops describing one coherent skin surface. The overlap becomes an independent shape produced by registration, making the portrait’s construction more visible than its supposed photographic certainty.$s$, $s$Do you see one mouth, two mouths, or a new abstract form?$s$,
    52, 61, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Joseph Beuys [Camouflage]  [LC-031 -> A015]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A015$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Find Joseph Beuys’s face and hat beneath the green, brown, beige, and white camouflage. Then reverse the process and let the pattern temporarily break the person apart.$s$, $s$Step back and decide whether camouflage conceals Beuys or turns his already recognizable public image into an even stronger emblem.$s$,
    $s$https://www.sfmoma.org/artwork/FC.620/$s$, $s$https://www.moma.org/artists/6246$s$, $s$The official image was visually audited. The former vague head-contour hotspot was replaced by the clearly visible hat brim; the eye and mouth points were refined to their actual positions.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: all points match the eye, mouth, and horizontal hat brim.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The eye beneath green paint$s$, $s$Tap the left eye, where photographic detail remains visible inside and beside green camouflage shapes.$s$,
    $s$The eye survives because its dark contour is one of the portrait’s strongest identifying signals. Camouflage interrupts the face, but recognition keeps repairing the pattern around it.$s$, $s$How much pattern can cross an eye before it stops functioning as a gaze?$s$,
    39, 40, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The mouth divided by the pattern$s$, $s$Look at the mouth and pale lower face, where green and brown shapes interrupt the lips and chin.$s$,
    $s$The pattern ignores the anatomy beneath it. Instead of following facial volume, it breaks the mouth into unrelated islands of tone, making one expressive feature compete with decorative design.$s$, $s$Does the camouflage silence the mouth or draw more attention to it?$s$,
    49, 58, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The hat brim cutting across the forehead$s$, $s$Tap the long dark brim extending across the upper face.$s$,
    $s$Beuys’s felt hat was already a central part of his public persona. Its strong horizontal brim remains legible through the camouflage, allowing one constructed identity marker to resist another.$s$, $s$Which is more visually powerful here: the hat or the camouflage?$s$,
    51, 25, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Self-Portrait  [LC-032 -> A016]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A016$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let Warhol’s lavender face emerge from the black field, then notice how the white wig spreads much farther than the head itself. The portrait gives almost equal weight to the man and the persona he constructed.$s$, $s$Step back and ask whether the floating head feels vulnerable, theatrical, ghostly, or deliberately all three.$s$,
    $s$https://www.sfmoma.org/artwork/FC.616/$s$, $s$https://www.sfmoma.org/artwork/FC.616/#audio$s$, $s$SFMOMA’s image and audio description were used to verify the long upper-left hair spike, direct eyes, and chin almost touching the bottom edge. The former coordinates placed the eyes and chin substantially too high.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: all three coordinates were corrected to the actual hair spike, eyes, and low chin.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The long spike toward the upper left$s$, $s$Tap the dramatic strand of wig shooting diagonally toward the upper-left corner.$s$,
    $s$SFMOMA’s audio description singles out this long spike. It expands the portrait beyond the face and turns the wig into an active graphic event rather than ordinary hair.$s$, $s$Does the diagonal spike make the head feel energetic or unstable?$s$,
    30, 15, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The wide eyes$s$, $s$Look at the two eyes staring directly outward beneath the pale fringe.$s$,
    $s$The frontal flash makes the gaze unusually exposed while the black field removes all social context. The eyes can feel direct and vulnerable, yet the silkscreen keeps the viewer at the distance of a reproduced image.$s$, $s$Do the eyes meet you or remain protected by the masklike face?$s$,
    49, 57, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The chin at the bottom edge$s$, $s$Tap the pointed chin, which nearly rests on the lower boundary of the square canvas.$s$,
    $s$The head is placed unusually low and shown without neck or body. Pressing the chin against the edge intensifies the sense of a disembodied mask floating in darkness.$s$, $s$Does the lower edge support the head or make it look trapped?$s$,
    50, 91, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 6  Andy Warhol - Self-Portrait [Camouflage]  [LC-033 -> A017]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A017$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Find Warhol’s eyes and mouth beneath the gray, beige, and black camouflage before following the pattern as independent design. Recognition keeps returning even when the face is repeatedly broken apart.$s$, $s$Step back and ask whether the camouflage hides Warhol or gives his already familiar face a new branded surface.$s$,
    $s$https://www.sfmoma.org/artwork/FC.507/$s$, $s$https://www.moma.org/artists/6246$s$, $s$The official SFMOMA reproduction was visually audited. The previous eye coordinate was too high, and the cheek point did not target the strongest dissolution. Revised points mark the visible eye, forehead-wig transition, and patterned mouth and chin.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: all three coordinates were corrected against the official image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The eye framed by dark camouflage$s$, $s$Tap the eye on the left side of the image, surrounded by gray and black pattern shapes.$s$,
    $s$The eye remains readable because its pupil and lid form a compact dark signal. The surrounding camouflage interrupts the forehead and cheek, but the viewer continues assembling them around the gaze.$s$, $s$How little of the eye is needed for the face to remain recognizable?$s$,
    39, 58, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The pattern crossing the forehead and wig$s$, $s$Look above the eyes, where beige and gray camouflage passes from the face into the spiky hair.$s$,
    $s$The same pattern ignores the boundary between skin and wig. It treats Warhol’s biological face and manufactured public signature as one continuous surface.$s$, $s$Does camouflage flatten the difference between the person and his persona?$s$,
    54, 33, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The mouth broken into patches$s$, $s$Tap the mouth and chin, where pale gray, beige, and black shapes divide the lower face.$s$,
    $s$The lips remain visible, but the camouflage prevents the lower face from forming one stable volume. Portrait and pattern occupy the same area without either fully defeating the other.$s$, $s$Does the mouth emerge from the design or disappear into it?$s$,
    51, 80, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 7  Gerhard Richter - Wald (4) [Forest (4)]  [LC-034 -> A034]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A034$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the dark violet-black field register before searching for trees. Then follow the scraped vertical traces and yellow interruptions that make the surface suggest a forest without resolving into one.$s$, $s$Step back and ask whether the title has made you see trunks and depth, or whether the painting remains a dense wall of dragged color.$s$,
    $s$https://www.sfmoma.org/artwork/FC.461/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/abstracts/woods-73$s$, $s$The official reproduction and available full-image thumbnail were visually checked. The earlier central clearing, right trunk, and lower-left pale scrape did not correspond reliably to the dominant composition. Revised points mark the visible yellow left opening, central pale vertical traces, and broad horizontal drag.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous hotspots were replaced with unmistakable color and directional structures.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The yellow opening at the left$s$, $s$Tap the bright yellow passage near the lower-left edge, where it breaks through the surrounding dark paint.$s$,
    $s$This is one of the few areas where light seems to enter the otherwise compressed surface. It can suggest a clearing or a distant gap, but its scraped edges keep it visibly part of the paint rather than stable landscape space.$s$, $s$Does this yellow patch open a route into the painting or sit on its surface?$s$,
    14, 66, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The vertical pale traces$s$, $s$Look at the thin pale marks descending through the upper-middle dark field.$s$,
    $s$The repeated verticals provide the strongest suggestion of trunks. Yet they are broken, scraped, and partially erased, so the painting offers the structure of a forest without giving any tree a complete contour.$s$, $s$How many vertical marks do you need before the surface begins to feel wooded?$s$,
    51, 35, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The horizontal drag across the middle$s$, $s$Follow the broad dark-violet band cutting across the painting slightly below center.$s$,
    $s$The horizontal pull interrupts the vertical rhythm and blocks easy depth. It records the movement of a tool across the wet surface, turning any imagined forest back into layered paint.$s$, $s$Does this band read as shadow in a forest or as a squeegee crossing the canvas?$s$,
    51, 61, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 7  Gerhard Richter - Abstraktes Bild (Abstract Picture)  [LC-035 -> A035]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A035$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Follow the painting as a sequence of layers rather than searching for a hidden subject. Compare the broad dragged passages with the thinner colors exposed beneath them.$s$, $s$Step back and ask which parts feel newly laid down and which feel like remnants of an earlier painting that has been scraped, covered, and reopened.$s$,
    $s$https://customprints.sfmoma.org/detail/459842/richter-abstraktes-bild-abstract-picture-1990$s$, $s$https://www.sfmoma.org/artwork/FC.440/$s$, $s$The exact Custom Prints reproduction was used as the image reference. The existing three targets describe genuine layer, drag, and stopping-edge structures; their wording was tightened and coordinates retained with minor refinement.$s$,
    $s$Medium$s$, false, $s$VISUALLY AUDITED WITH REPRODUCTION LIMITATION: coordinates match visible regions in the Custom Prints image, but final pixel-level verification should use the exact 1500-pixel app asset.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The bright layer exposed at lower left$s$, $s$Tap the vivid multicolored passage in the lower-left quadrant where brighter paint remains visible beneath broader dragged layers.$s$,
    $s$The exposed color makes the surface feel archaeological. It suggests that the image we see is only the latest state of a painting that has repeatedly been covered and reopened.$s$, $s$Does the partly hidden color feel more intense because less of it survives?$s$,
    27, 67, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The broad central drag$s$, $s$Follow the widest scraped band crossing the central area.$s$,
    $s$This passage records the pressure and direction of the large tool moving through wet paint. Several colors are pulled together without fully blending, so one action both combines and damages earlier layers.$s$, $s$Where can you see the tool catching or changing pressure?$s$,
    53, 49, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The sharp stopping edge at upper right$s$, $s$Look near the upper-right area where a scraped passage ends against a contrasting block or band of color.$s$,
    $s$The abrupt boundary makes the painting’s sequence of actions visible. Richter chose when to press, pull, and lift; the edge preserves the instant when one movement stopped.$s$, $s$Does this ending feel accidental or decisively placed?$s$,
    78, 29, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 7  Gerhard Richter - Fenster (Window)  [LC-036 -> A036]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A036$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Do not search for a literal frame or panes. Follow the blurred white, rust-red, orange, and dark streaks as though you were seeing reflected light through wet or dirty glass.$s$, $s$Step back and ask what makes this painting feel windowlike when it contains no clear view. Is it the vertical movement, the shimmer, or the sense that another image has been obscured?$s$,
    $s$https://www.sfmoma.org/artwork/FC.738/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/abstracts$s$, $s$Search and official descriptions confirm that Fenster is an abstract painting of shimmering white, red, orange, and dark streaks—not a literal painted window grid. The previous pane, frame, and reflection hotspots were therefore invalid and were fully replaced.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three former pane-based hotspots were removed and replaced with visible vertical color passages.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The pale vertical flare$s$, $s$Tap one of the brightest white vertical streaks near the center.$s$,
    $s$The flare resembles light catching glass, but its edges are dragged and unstable. It suggests transparency while simultaneously blocking any view beyond the paint.$s$, $s$Does the white streak feel like light passing through or paint sitting on top?$s$,
    51, 44, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The rust-orange column$s$, $s$Look at the strong red-orange vertical passage on the right half.$s$,
    $s$Its warm color gives the painting a reflected, weathered glow rather than the neutral geometry of an actual window. The streak behaves like an image seen indirectly—through glare, motion, or a disturbed surface.$s$, $s$What kind of scene do you begin imagining behind this color?$s$,
    73, 45, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The dark blurred band at the left$s$, $s$Tap the darker gray-black vertical area along the left side, where its boundary dissolves into neighboring color.$s$,
    $s$The dark band anchors the brighter streaks but never becomes a solid frame. Its blurred edge makes the whole painting feel as though a recognizable structure has been smeared before it could come into focus.$s$, $s$Does this dark passage organize the painting or make it more uncertain?$s$,
    20, 49, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 7  Gerhard Richter - 256 Farben (256 Colours)  [LC-037 -> A037]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A037$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Choose one square, then compare it with its immediate neighbors. The grid stays perfectly regular while every local color relationship changes.$s$, $s$Step back until the 256 cells merge into one vibrating field. Does the strict order calm the colors or make their differences more intense?$s$,
    $s$https://www.sfmoma.org/artwork/FC.643/$s$, $s$https://www.davidzwirner.com/artworks/gerhard-richter-256-farben-256-colors--9fdd5$s$, $s$The full color-chart structure was visually checked. Because the hotspots intentionally ask the visitor to compare cells rather than identify unique depicted objects, representative coordinates inside clearly separated grid cells are appropriate.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED: all coordinates land inside valid grid cells. The UI marker must remain smaller than one cell.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$A yellow square beside blue$s$, $s$Tap a yellow cell in the upper-left quadrant that borders a noticeably cooler blue or green cell.$s$,
    $s$The colors were placed through a chance-based system rather than expressive composition. Yet adjacency immediately creates a visual relationship: the yellow can look warmer or brighter simply because of the cool square beside it.$s$, $s$Would this yellow look identical somewhere else in the grid?$s$,
    23, 24, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$A high-contrast central pairing$s$, $s$Tap the border between two strongly contrasting neighboring cells near the center.$s$,
    $s$The grid gives every adjacency equal structural status, but the eye does not experience them equally. Some chance pairings become loud focal events even though Richter did not assign them symbolic importance.$s$, $s$Does this pairing begin to feel intentionally composed once you focus on it?$s$,
    52, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$Two similar colors in different contexts$s$, $s$Choose a square near the lower-right, then search for a similar hue elsewhere in the grid.$s$,
    $s$The painting contains 256 cells generated from 180 colors, so hues recur. A repeated color can look different when surrounded by new neighbors, demonstrating that color is relational rather than fixed.$s$, $s$Which version of the similar hue appears stronger?$s$,
    80, 76, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 7  Gerhard Richter - Seestück (Seascape)  [LC-038 -> A038]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A038$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the painting convince you that it is a traditional sea and sky. Then notice how the photographic softness makes the whole landscape feel copied, remembered, or artificially perfected.$s$, $s$Step back and ask whether the seascape feels sublime or suspiciously seamless—an image of nature constructed from familiar visual expectations.$s$,
    $s$https://www.sfmoma.org/artwork/98.527/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/photo-paintings/landscapes-14$s$, $s$The artwork was visually checked against a full installation image and official reproduction. The horizon sits lower than the former coordinate, and the cloud hotspot was moved toward the actual bright opening right of center.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all three coordinates now match the low horizon, lower sea, and bright cloud opening.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The low horizon$s$, $s$Tap the narrow boundary where the dark sea meets the pale sky, slightly below the center.$s$,
    $s$The horizon organizes the entire scene but remains softly blurred. It creates immense distance while also recalling a photograph whose focus has been deliberately weakened.$s$, $s$Does the blur make the horizon feel farther away or less trustworthy?$s$,
    50, 57, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The nearly featureless sea$s$, $s$Look at the broad gray water across the lower third.$s$,
    $s$Individual waves are largely absent. The sea becomes a smooth tonal band, giving the image atmosphere and scale while withholding the particular movement of real water.$s$, $s$What feeling are you adding to this almost empty water?$s$,
    40, 75, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The brightest opening in the clouds$s$, $s$Tap the pale break in the cloud cover just right of center.$s$,
    $s$This brighter passage creates a restrained source of light without showing the sun. Its soft edges produce the convincing look of weather while also revealing Richter’s interest in the photographic image of landscape rather than direct observation.$s$, $s$Does the light feel natural, staged, or remembered?$s$,
    67, 35, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 7  Gerhard Richter - Porträt Müller (Portrait Müller)  [LC-039 -> A039]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A039$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Recognize Müller’s face first, then inspect the horizontal blur that passes across every feature. The portrait remains legible even while the paint denies sharp identification.$s$, $s$Step back and ask whether the blur makes Müller feel distant, in motion, protected, or more like a reproduced image than a present person.$s$,
    $s$https://www.sfmoma.org/artwork/FC.293/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/photo-paintings/portraits$s$, $s$The full portrait image was visually checked. The former clothing coordinate sat too far left; revised points now land on the eyes, mouth, and central dark collar and tie.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all three coordinates directly match the visible portrait features.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The eyes pulled sideways$s$, $s$Tap the eyes in the upper-middle of the face, where their contours stretch horizontally.$s$,
    $s$The eyes remain identifiable but cannot hold a precise expression. The lateral blur preserves recognition while removing the emotional certainty that portraits often promise.$s$, $s$Can you decide where Müller is looking?$s$,
    47, 37, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The mouth reduced to a pale bar$s$, $s$Look at the mouth near the center-lower face, where the lips are softened into a horizontal light-dark band.$s$,
    $s$The mouth cannot fully communicate an expression because its contour has been dragged into the same visual static as the rest of the photograph. The portrait records a face while frustrating psychological interpretation.$s$, $s$Does the mouth appear neutral, tense, or impossible to read?$s$,
    48, 55, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The dark collar below the blurred face$s$, $s$Tap the dark triangular collar and tie area beneath the chin.$s$,
    $s$This clothing remains more structurally definite than the facial features above it. The contrast gives greater stability to an external uniform than to the person’s identity.$s$, $s$Why does the clothing feel more solid than the face?$s$,
    47, 78, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 7  Gerhard Richter - Gymnastik (Gymnastics)  [LC-040 -> A040]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A040$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Trace the gymnast from her raised hand down through the dark shirt and the long diagonal leg. The pose is clear, but every contour is softened as though the body were still moving through the photograph.$s$, $s$Step back and ask whether the painting freezes one athletic instant or shows the failure of a still image to contain motion.$s$,
    $s$https://www.sfmoma.org/artwork/FC.309/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/photo-paintings/sports$s$, $s$The official image clearly shows one gymnast with a raised right arm, dark torso, and long diagonal leg. The former apparatus hotspot was inaccurate—no distinct supporting apparatus is visible—and was replaced by the leg.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: the former support hotspot was removed; all coordinates now match the raised hand, torso, and diagonal leg.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The raised hand touching the top$s$, $s$Tap the pale hand and forearm extended toward the upper-right edge.$s$,
    $s$The arm creates the pose’s strongest upward motion and almost exits the image. Its blurred contour makes the extremity feel stretched by speed rather than cleanly outlined.$s$, $s$Does the raised hand feel held in place or still traveling upward?$s$,
    67, 12, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark torso bending$s$, $s$Look at the black-gray shirt and bent waist left of center.$s$,
    $s$The torso anchors the body’s change of direction: the upper body rises while the legs sweep diagonally downward. The dark mass remains recognizable even as its edges dissolve into the gray interior.$s$, $s$Where does the torso stop and the surrounding blur begin?$s$,
    42, 44, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The long leg crossing the lower half$s$, $s$Follow the pale leg extending diagonally from the hip toward the lower-right.$s$,
    $s$The leg supplies the image’s broadest directional sweep. Its length and blur turn a single frozen body into a line of motion crossing the picture.$s$, $s$Does the leg feel anatomically solid or more like a streak?$s$,
    63, 73, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 7  Gerhard Richter - Brigid Polk  [LC-041 -> A041]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A041$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin with Brigid Polk’s pale face at the lower-left, then notice how her dark hair dominates the middle of the square. The portrait is close-cropped, but the blur keeps physical closeness from becoming complete access.$s$, $s$Step back and ask whether Brigid feels near to you, or whether the soft photographic haze has already turned the encounter into memory.$s$,
    $s$https://www.sfmoma.org/artwork/FC.498/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/photo-paintings/portraits$s$, $s$The official image was visually checked. The previous entry incorrectly described a reclining woman, resting hand, and couch. Brigid’s face is at lower left, her dark hair dominates the center, and a blurred second presence appears at upper right.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous hotspot descriptions and coordinates were replaced.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The pale face at lower left$s$, $s$Tap Brigid’s face in the lower-left quadrant, where one blue-gray eye and the nose remain clearest.$s$,
    $s$The face is strongly lit but partly displaced toward the edge and crowded by hair. Richter preserves enough information for recognition while denying a balanced, conventional portrait pose.$s$, $s$Does the cropped position make the face feel more intimate or more accidental?$s$,
    28, 61, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark sweep of hair$s$, $s$Look at the large black-brown mass curving through the center and right side of the portrait.$s$,
    $s$The hair occupies more visual space than the face and becomes an abstract dark form. Its blurred sweep both frames Brigid and nearly overwhelms her identity.$s$, $s$Do you see hair first, or a dark shape?$s$,
    55, 46, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The second blurred presence at the right$s$, $s$Tap the pale, indistinct face-like form in the upper-right background.$s$,
    $s$A second presence appears only vaguely behind Brigid. Because it never resolves, it makes the image feel like a crowded photographic moment rather than a formally isolated portrait.$s$, $s$Does this background figure deepen the social scene or make it more uncertain?$s$,
    82, 34, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 8  Dan Flavin - untitled (to Barnett Newman) two  [LC-042 -> A030]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A030$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin with the four fluorescent edges: yellow across the top and bottom, red down both sides. Then notice the blue light filling the corner inside them and the purple glow spreading far beyond the fixtures.$s$, $s$Step back and ask where the artwork ends. Is it the physical rectangle of tubes, the blue corner they enclose, the colored wall around them, or the light reaching the floor where you stand?$s$,
    $s$https://www.sfmoma.org/artwork/FC.416/$s$, $s$https://www.sfmoma.org/artist/dan_flavin/$s$, $s$The official installation photograph was visually audited. The previous hotspots incorrectly described one outward-facing red tube, a yellow-blue overlap, and a generic metal end. Revised points identify the top yellow tube, right red vertical, and blue-lit central corner visible in the image.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three coordinates directly match the yellow horizontal, red vertical, and blue interior in the exact workbook image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The yellow tube across the top$s$, $s$Tap the bright horizontal yellow tube spanning the upper edge of the structure.$s$,
    $s$The yellow fixture reads like a firm architectural lintel, yet its light immediately softens into orange, pink, and purple on the wall. A standard industrial tube creates both a precise line and a much less measurable field.$s$, $s$Where does the yellow object end and its colored light begin?$s$,
    50, 22, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The red vertical at the right$s$, $s$Look at the saturated red fluorescent tube running down the right side.$s$,
    $s$The red side establishes the work’s tall rectangular outline, but its magenta glow spreads outward into the surrounding purple wall. The fixture behaves as a physical edge while the light refuses to remain contained by it.$s$, $s$Does the red line frame the blue interior or leak away from the frame?$s$,
    71, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The blue corner inside$s$, $s$Tap the luminous blue field filling the recessed central corner between the red sides.$s$,
    $s$No blue tube is visible from the front in the same way as the yellow and red fixtures. The blue appears as reflected light occupying the architecture itself, making the corner—not merely the hardware—a central material of the installation.$s$, $s$Does the blue feel like a colored surface or an illuminated volume?$s$,
    50, 50, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 8  Dan Flavin - "monument" for V. Tatlin  [LC-043 -> A031]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A031$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Follow the white fluorescent tubes from the short outer pairs upward to the tallest central pair. Their changing heights turn ordinary upright fixtures into the silhouette of an impossible tower.$s$, $s$Step back and compare the grand word “monument” with the cool white commercial tubes. Does the work honor Tatlin’s unrealized revolutionary architecture, reduce it to a diagram, or quietly do both?$s$,
    $s$https://www.sfmoma.org/artwork/FC.824/$s$, $s$https://diaart.org/collection/collection/flavin-dan-monument-for-v-tatlin-1969-1980-018$s$, $s$The official frontal photograph was visually audited. The previous description of horizontal stacked units was incorrect: the work consists of upright fluorescent tubes arranged in progressively changing heights. All three hotspots were replaced with the central peak, stepped side fixtures, and illuminated base.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three coordinates directly match the upright central tubes, stepped left side, and wall-floor glow in the official image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The tallest central pair$s$, $s$Tap the two longest white tubes rising at the center to form the tower’s peak.$s$,
    $s$The central pair establishes vertical ambition without creating any solid mass. A monument normally depends on durable stone or metal, but here height is produced by light, glass, and electrical hardware.$s$, $s$Does the brightest central rise feel monumental despite its fragile materials?$s$,
    50, 22, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The stepped side tubes$s$, $s$Look at the progressively shorter upright fixtures descending along the left side from the center toward the floor.$s$,
    $s$The changing heights create the towerlike outline. No sloping wall actually connects them; the viewer mentally joins separate vertical units into one architectural shape.$s$, $s$At what point do individual tubes become a single tower in your mind?$s$,
    37, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The white halo and bright base$s$, $s$Tap the glow spreading onto the wall and floor around the lowest central tubes.$s$,
    $s$The fluorescent light extends past every metal housing, softening the exact stepped outline. The supposed monument therefore has no stable boundary: its base occupies the wall, the floor, and the surrounding atmosphere.$s$, $s$Does the glow make the structure feel more substantial or less material?$s$,
    50, 86, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 9  Chuck Close - Agnes  [LC-044 -> A021]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A021$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin far enough away for Agnes Martin’s face to feel whole. Then move closer until her eyes, cheeks, and mouth break into hundreds of separate colored cells.$s$, $s$Step back once more. Does Agnes now feel like one continuous presence, or an image your eye keeps reconstructing from many independent marks?$s$,
    $s$https://www.sfmoma.org/artwork/FC.626/$s$, $s$https://www.pacegallery.com/artists/chuck-close/$s$, $s$The exact SFMOMA image was visually audited. The existing eye point was close; the cheek and outer-edge points were moved upward and rightward to land on the visible right cheek and the face-background transition.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all three coordinates directly match the left eye, right cheek, and right facial boundary.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The left eye assembled from cells$s$, $s$Tap the eye on the left side of the image, where dark ovals and pale loops combine into the eyelid, iris, and surrounding shadow.$s$,
    $s$No single cell contains a complete eye. Recognition appears only when the viewer combines neighboring marks across the grid, so a psychologically powerful feature emerges from locally abstract units.$s$, $s$At what distance does the eye become a gaze rather than a collection of shapes?$s$,
    39, 38, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The warm right cheek$s$, $s$Look at the broad cheek on the right side of the face, where peach, pink, turquoise, green, and dark red cells sit beside one another.$s$,
    $s$Close does not create skin by smoothly blending one flesh color. Warmth and volume emerge from contrasts between cells that, seen alone, may look nothing like skin.$s$, $s$Which individual color seems least believable as skin but still contributes to the face?$s$,
    63, 53, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The face meeting the dark background$s$, $s$Follow the right edge of Agnes’s cheek and hair where the colored facial cells gradually give way to deep green-black cells.$s$,
    $s$There is no continuous outline enclosing the head. The boundary forms through changing color and value, requiring the viewer to decide where the person ends and the background begins.$s$, $s$Can you identify one exact cell where Agnes becomes background?$s$,
    78, 49, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 9  Chuck Close - Agnes/maquette  [LC-045 -> A022]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A022$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Treat this as a working object rather than a smaller finished portrait. Agnes’s photograph is crossed by a measured grid, bordered with numbered tape, surrounded by handwritten notes, and stained with paint from the translation process.$s$, $s$Step back and compare this maquette with the finished painting. Does seeing its practical measurements and studio residue make the final portrait feel more mechanical or more intensely handmade?$s$,
    $s$https://www.sfmoma.org/artwork/FC.625/$s$, $s$https://www.pacegallery.com/exhibitions/chuck-close-on-paper/$s$, $s$The exact SFMOMA image shows no taped seam crossing the face. The former seam and vague handwritten-margin hotspots were replaced by the clearly visible numbered tape above the gridded portrait and the paint dabs below it.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: Hotspots 2 and 3 were replaced; all coordinates match the eye, numbered grid border, and paint tests.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The grid crossing the eye$s$, $s$Tap Agnes’s left eye, where several graphite squares divide the eyelid, pupil, and surrounding wrinkles.$s$,
    $s$The grid gives the eye no special protection. One of the portrait’s most expressive areas is broken into the same equal units used for forehead, clothing, and background, converting likeness into a series of manageable tasks.$s$, $s$Does the eye remain emotionally immediate after being divided into boxes?$s$,
    38, 42, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The numbered tape above the face$s$, $s$Look at the horizontal masking-tape strip directly above Agnes’s hair, where small numbers mark the grid columns.$s$,
    $s$This numbered border turns the photograph into a coordinate system. It allowed Close to locate each section precisely when enlarging the image, revealing the administrative structure beneath the seemingly intuitive finished portrait.$s$, $s$Does the numbering make the face feel more like a person or a map?$s$,
    50, 29, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The paint dabs below the portrait$s$, $s$Tap the cluster of multicolored paint smears and test marks directly beneath Agnes’s sweater.$s$,
    $s$These marks are not part of the sitter’s likeness. They preserve color trials and studio handling outside the portrait, showing that the maquette functioned as an active tool rather than a pristine photograph.$s$, $s$Which paint mark seems most likely to have become a cell in the finished painting?$s$,
    51, 75, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 9  Chuck Close - Roy I  [LC-046 -> A023]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A023$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Recognize Roy Lichtenstein’s face first, then move closer until the forehead, eyes, mouth, and jacket dissolve into cells filled with rings, bars, and small color loops.$s$, $s$Step back and ask what makes Roy recognizable when no single cell attempts to imitate him realistically.$s$,
    $s$https://www.sfmoma.org/artwork/FC.697/$s$, $s$https://www.pacegallery.com/artists/chuck-close/$s$, $s$The exact SFMOMA reproduction confirms that Roy is not wearing glasses. The former eyeglass hotspot was removed, and the mouth coordinate was moved substantially upward to the actual lips.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: the invented glasses hotspot was replaced; all coordinates match the left eye, upper forehead cells, and mouth.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The left eye built from rings$s$, $s$Tap the eye on the left side of the image, where turquoise, red, yellow, and dark oval marks gather into the lid and pupil.$s$,
    $s$The eye appears continuous from a distance, but up close it is assembled from separate abstract motifs. Close lets color and value produce recognition without relying on traditional smooth modeling.$s$, $s$At what distance do the colored rings become an eye?$s$,
    42, 35, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The long vertical cells on the forehead$s$, $s$Look above and between the eyes, where several cells stretch into tall pale pink, orange, and blue bars.$s$,
    $s$These elongated marks do not resemble skin or wrinkles on their own. Within the larger portrait, however, their direction helps describe the forehead’s light and vertical structure.$s$, $s$Can you keep seeing Roy while concentrating on one of these tall cells?$s$,
    54, 18, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The mouth forming across several squares$s$, $s$Tap the lips near the center-lower face, where peach, red, blue, and dark cells cross the horizontal grid.$s$,
    $s$The mouth’s expression does not belong to any one unit. It emerges across several independently painted squares, showing how emotional legibility can arise from marks that are not expressive in isolation.$s$, $s$At what point do the separate cells become an expression?$s$,
    50, 53, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 9  Chuck Close - Roy/maquette  [LC-047 -> A024]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A024$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Look at Roy’s photograph as a measured plan. The grid runs across his face and clothing, while letters, numbers, masking tape, and handwritten notes remain visible around the image.$s$, $s$Step back and imagine translating every square into the monumental painting. Does the maquette make that process seem systematic, repetitive, or full of countless local judgments?$s$,
    $s$https://www.sfmoma.org/artwork/FC.844/$s$, $s$https://www.pacegallery.com/exhibitions/chuck-close-on-paper/$s$, $s$The exact SFMOMA image confirms that Roy wears no glasses and that no taped seam crosses the face. The former glasses and seam hotspots were replaced by the gridded eye, coordinate labels, and visible corner tape.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous targets were corrected to match visible process details.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The grid through Roy’s left eye$s$, $s$Tap the eye on the left side of the image, where the pupil and lid are split by the graphite grid.$s$,
    $s$The grid treats the eye as a set of coordinates rather than one privileged expressive feature. Close could enlarge each square independently while trusting the complete gaze to reappear only when all the units were recombined.$s$, $s$Does dividing the eye weaken its presence?$s$,
    45, 35, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The lettered and numbered border$s$, $s$Look along the top edge of the photograph, where letters label the columns while numbers run down the sides.$s$,
    $s$The labels turn Roy’s portrait into an addressable system. Any facial detail can be located by row and column, making the human likeness function like a map or technical plan.$s$, $s$Does the coordinate system make the portrait easier to understand or more impersonal?$s$,
    50, 14, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The masking tape at the upper corner$s$, $s$Tap the tan tape securing the upper-left corner and outer border to the backing.$s$,
    $s$The tape is plainly practical rather than pictorial. Its wrinkles and overlaps preserve how the photograph was mounted and handled, keeping the maquette visibly tied to studio labor.$s$, $s$Does this rough attachment change how you value the object?$s$,
    8, 7, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 9  Chuck Close - John  [LC-048 -> A025]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A025$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin far enough away to see John Chamberlain’s face clearly. Then move closer and remember that the portrait was built through 126 separate screenprinted colors rather than painted in one continuous layer.$s$, $s$Step back after inspecting the cells. Does the mechanical printing process make John feel less present, or does the accumulation of so many precise impressions create another kind of intimacy?$s$,
    $s$https://www.sfmoma.org/artwork/FC.615/$s$, $s$https://www.pacegallery.com/artists/chuck-close/$s$, $s$The exact SFMOMA image was visually audited. The previous generic cheek point was moved to the unmistakably bright right temple, and the grid-boundary point was refined to the jaw-clothing-background transition.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all coordinates match the left eye, bright right facial passage, and lower-right jaw transition.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The left eye built through many colors$s$, $s$Tap the eye on the left side of the image, where small red, blue, turquoise, cream, and black marks combine.$s$,
    $s$Each printed color required a separate screen and impression. The eye therefore appears through accumulated registration rather than one gesture, turning recognition into the result of many carefully aligned operations.$s$, $s$Can you identify which color appears to sit on top?$s$,
    36, 37, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The pale right temple and cheek$s$, $s$Look at the brightly lit area on the right side of John’s forehead and cheek, where elongated cells contain several translucent colors.$s$,
    $s$The lightest part of the face is not empty or simply white. Layered pinks, yellows, blues, and greens combine to produce illumination while remaining visibly separate up close.$s$, $s$Which colors are doing the work of light here?$s$,
    66, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The jaw dissolving into jacket and background$s$, $s$Follow the lower-right edge of the face where skin-colored cells shift into red clothing and dark patterned background.$s$,
    $s$The rigid grid continues unchanged across skin, garment, and space. Only color relationships tell the viewer where the jaw ends, demonstrating how volume emerges from a structure that never bends.$s$, $s$At which cell does the face become clothing or background?$s$,
    67, 69, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 10  Richard Serra - Melnikov II  [LC-049 -> A050]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A050$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin with the broad horizontal steel plate hovering overhead, then trace its weight down into the single upright plate beneath it. The sculpture looks almost like a table or roof, but its balance feels far less ordinary.$s$, $s$Step back and ask whether the horizontal plate seems firmly supported or improbably suspended. How much of the sculpture’s force comes from imagining its weight?$s$,
    $s$https://www.sfmoma.org/artwork/FC.276.A-B/$s$, $s$https://www.gagosian.com/artists/richard-serra/$s$, $s$The official SFMOMA image was visually audited. The former description of two plates leaning toward one another was incorrect. Melnikov II consists of one vertical plate supporting a wide horizontal plate in a T-like cantilevered structure.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous hotspots were replaced with the upper contact, rightward cantilever, and floor-bearing vertical plate.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The narrow contact at the top$s$, $s$Tap the point where the upright plate meets the underside of the horizontal plate.$s$,
    $s$The enormous upper slab appears to depend on a surprisingly limited contact. Serra makes structural support visible rather than hiding it inside joints, so the meeting point becomes the sculpture’s most tense and consequential detail.$s$, $s$Does this contact look sufficient to hold the plate above it?$s$,
    43, 28, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The horizontal plate projecting right$s$, $s$Follow the broad overhead slab from the central support toward the far-right edge.$s$,
    $s$The plate extends much farther into open space than the upright support beneath it. This cantilever transforms weight into visual tension, making the viewer continuously measure the possibility of balance and collapse.$s$, $s$Does the projection feel heavy, floating, or both?$s$,
    70, 24, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The upright plate meeting the floor$s$, $s$Look at the lower edge of the vertical plate where it bears directly on the dark floor.$s$,
    $s$The sculpture transfers its entire visible load through this single standing plane. The floor is therefore not a neutral display surface; it completes the chain of gravity from the overhead slab to the room.$s$, $s$Can you imagine the pressure concentrated along this bottom edge?$s$,
    42, 82, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 10  Richard Serra - House of Cards  [LC-050 -> A051]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A051$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Read the four lead-antimony plates as a box for a moment. Then notice that no plate is fixed to another: each leans inward and remains standing only because all four press together.$s$, $s$Step back and consider the contradiction. The sculpture is physically heavy, but its survival depends on a balance that appears temporary and fragile.$s$,
    $s$https://www.sfmoma.org/artwork/94.453.A-D/$s$, $s$https://www.moma.org/collection/works/81291$s$, $s$The exact frontal-oblique SFMOMA image was visually audited. The former upper-contact point was moved to the visible open top-right junction; the interior and lower left floor contact were refined to the actual photograph.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all coordinates directly match the open upper junction, visible interior, and left plate-floor contact.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The open upper corner$s$, $s$Tap the top-right area where two plates approach one another but leave the interior visibly open.$s$,
    $s$The plates do not form a sealed architectural joint. Their angled upper edges reveal that the structure is held by mutual pressure rather than fastening, keeping the possibility of instability visually present.$s$, $s$Does this corner look locked together or merely arrested in motion?$s$,
    69, 23, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark interior above the front plate$s$, $s$Look into the shadowed space visible just behind the front panel’s top edge.$s$,
    $s$The void is shaped by the four leaning plates and is therefore an active part of the sculpture. It makes the object feel inhabitable in scale while withholding any clear entrance.$s$, $s$Does the interior invite curiosity or create warning?$s$,
    50, 18, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The left plate touching the floor$s$, $s$Tap the narrow lower edge of the left side plate where it reaches the wooden floor.$s$,
    $s$The angled plate channels its weight into a small line of contact. Seeing the edge rather than a broad base makes the enormous sheet look simultaneously grounded and precarious.$s$, $s$Can you feel the force moving downward through this thin edge?$s$,
    24, 77, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 10  Richard Serra - Doors  [LC-051 -> A052]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A052$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Look across the four low, dark sections resting against the wall. Their repeated rectangular shape suggests a sequence of doors, but they lie sideways at floor level and cannot open.$s$, $s$Step back and ask what the title contributes. Do these forms become blocked entrances, fallen architectural parts, or simply heavy repeated slabs?$s$,
    $s$https://www.sfmoma.org/artwork/94.454.A-D/$s$, $s$https://www.sfmoma.org/artwork/94.454.A-D/#audio$s$, $s$The official image and collection record were visually audited. The earlier entry incorrectly described lead forms that bend or slump. Doors is a low wall-length work in rubber, resin, and fiberglass, divided into four irregular rectangular sections.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three former folded-lead hotspots were replaced with visible seams, material surfaces, and narrowing right-hand sections.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The first vertical division$s$, $s$Tap the seam separating the first and second dark sections near the left side.$s$,
    $s$The seam allows the long object to be read as a sequence rather than one continuous slab. Repetition begins here, but the rough handmade edge keeps the units from feeling industrially identical.$s$, $s$Does this line make you imagine separate doors or one folded surface?$s$,
    20, 58, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The broad rust-brown middle panel$s$, $s$Look at the largest warm brown section slightly left of center.$s$,
    $s$The material is rubber, resin, and fiberglass rather than lead or steel. Its uneven skin, stains, and muted color make the panel resemble weathered industrial matter while retaining a slightly soft, cast quality.$s$, $s$Does the surface look rigid, leathery, or compressed?$s$,
    45, 59, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The narrower dark sections at the right$s$, $s$Follow the progressively narrower gray-black divisions near the far-right end.$s$,
    $s$The changing widths interrupt the expectation of four equal doors. The rhythm compresses toward the edge, making the installation feel measured but not standardized.$s$, $s$Does the narrowing sequence make the work feel as though it is closing?$s$,
    79, 59, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 10  Richard Serra - Floor Pole Prop  [LC-052 -> A053]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A053$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Identify the large square lead plate against the wall and the dark pole leaning from the floor into its center-right area. Nothing is bolted together; the sculpture exists through pressure.$s$, $s$Step back and ask where the work really resides—in the two lead elements, in the force passing between them, or in the wall and floor completing the structure.$s$,
    $s$https://www.sfmoma.org/artwork/94.451.A-B/$s$, $s$https://www.sfmoma.org/artwork/94.451.A-B/#audio$s$, $s$The exact official image was visually audited. The contact and pole points were refined, and the former broad wall-contact marker was replaced with the clearly visible lower-left plate-floor-wall junction.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all coordinates directly match the upper pole contact, diagonal support, and plate’s lower architectural junction.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The pole pressing the plate$s$, $s$Tap the upper end of the diagonal pole where it meets the plate.$s$,
    $s$This small contact point holds the broad sheet against the wall. There is no visible bracket or fixed joint, so the sculpture makes friction and compressed weight perform the work of construction.$s$, $s$What would happen if this contact shifted a few centimeters?$s$,
    56, 38, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The diagonal pole$s$, $s$Follow the dark pole downward from the plate to its rounded end on the floor.$s$,
    $s$The diagonal is a visible line of force. Instead of concealing structural pressure inside architecture, Serra places it openly in the room so viewers can mentally trace the load.$s$, $s$Which direction does the force seem to travel?$s$,
    55, 63, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The plate’s lower-left edge$s$, $s$Look at the bottom-left corner of the large plate where it meets the wall and floor.$s$,
    $s$The plate is not hanging like a picture. Its scale and direct contact with the architecture make it behave as a physical load occupying the room, while the pole prevents it from simply falling forward.$s$, $s$Does the plate feel attached to the wall or temporarily trapped against it?$s$,
    25, 82, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 10  Richard Serra - The United States Courts Are Partial to Government  [LC-053 -> A054]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A054$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Read the title before looking for words in the drawing—there are none. Instead, compare the two enormous black paintstick masses and the sharp white opening that separates them.$s$, $s$Step back and ask how the title changes these abstract forms. Do the unequal black panels begin to feel like opposing institutions, unequal weights, or a judgment already decided?$s$,
    $s$https://www.sfmoma.org/artwork/94.449/$s$, $s$https://www.sfmoma.org/artwork/94.449/#audio$s$, $s$The official image was visually audited. The previous entry falsely described visible words and typography. The drawing contains two large black paintstick panels separated by an irregular white wedge; the political sentence exists only as the title.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all text-based hotspots were removed and replaced with the left mass, taller right mass, and central white wedge.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The lower left black mass$s$, $s$Tap the broad black panel on the left, whose top edge sits noticeably lower than the panel on the right.$s$,
    $s$The left mass appears heavy and expansive but physically subordinate to the taller right panel. Serra described these horizontal diptychs as comparisons of different weights rather than conventional figure-ground compositions.$s$, $s$Does the lower height make this panel feel weaker or simply different?$s$,
    25, 55, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The tall black panel on the right$s$, $s$Look at the immense right-hand mass rising almost to the top edge.$s$,
    $s$Its greater height and uninterrupted black surface give it more visual authority. Once the political title is known, the imbalance can feel less neutral—as though one side already possesses institutional advantage.$s$, $s$Does the right panel seem dominant because of size, position, or the title?$s$,
    73, 45, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The white wedge between them$s$, $s$Tap the narrow white gap that descends sharply between the two black panels near the center.$s$,
    $s$The gap is not an even border. It begins broad at the top and narrows into a pointed divide, making separation feel active and pressured rather than calm. The empty paper carries as much tension as the black paintstick.$s$, $s$Does this white space divide the panels or force them into confrontation?$s$,
    44, 31, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 11  Brice Marden - The Sisters  [LC-054 -> A018]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A018$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Choose one colored ribbon and follow it until another line crosses, hides, or redirects it. The painting becomes easier to enter when you treat each path as an individual movement rather than one tangled mass.$s$, $s$Step back and compare the darker blue network on the left with the warmer yellow-orange movement on the right. Do they feel like separate presences sharing one space?$s$,
    $s$https://www.sfmoma.org/artwork/FC.516/$s$, $s$https://www.sfmoma.org/artwork/FC.516/#audio$s$, $s$The exact image and SFMOMA audio description were visually audited together. The previous upper-center loop and near-contact points were difficult to identify consistently. They were replaced with the clearly visible dark blue left path, golden right ribbon, and brown line partly exiting near the upper-right edge.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three coordinates directly match distinct colored paths described by SFMOMA’s image and audio.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The dark blue path on the left$s$, $s$Tap the deep blue line curving through the upper-left quadrant, where it bends inward and crosses lighter gray and brown paths.$s$,
    $s$SFMOMA’s audio associates the darker blue figure with one of Marden’s daughters. Even without that story, its cooler color and more compact path give the left side a distinct visual personality within the larger network.$s$, $s$Does the dark blue line feel more contained or more forceful than the warmer lines?$s$,
    28, 28, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The golden ribbon on the right$s$, $s$Look at the yellow-orange line looping through the middle-right side.$s$,
    $s$The artist’s daughters recalled that Marden associated the golden right-hand ribbon with Mirabelle, whose name evokes golden-yellow plums. The line remains abstract, but its warmth and open looping path make it feel different from the darker network opposite it.$s$, $s$Does knowing the family association make this line feel more figure-like?$s$,
    74, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The brown line nearly leaving at the top$s$, $s$Follow the reddish-brown ribbon upward along the right edge to the point near the top where it partly exits the canvas before turning back.$s$,
    $s$The edge does not simply stop the line. It creates the impression that the path almost escapes and then returns, echoing the sisters’ description of the painting as balancing what is kept inside with what is nearly leaving.$s$, $s$Does the line feel contained by the canvas or only temporarily visible within it?$s$,
    78, 7, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 11  Brice Marden - Epitaph Painting 1  [LC-055 -> A019]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A019$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Follow the green, yellow, and pale blue ribbons separately before letting them merge into one network. Each color creates its own route across the gray field, but crossings continually make those routes difficult to preserve.$s$, $s$Step back and ask whether the painting feels like writing without words, a map without destinations, or several bodies moving through the same constrained space.$s$,
    $s$https://www.sfmoma.org/artwork/FC.579/$s$, $s$https://matthewmarks.com/exhibitions/brice-marden-two-new-paintings-with-five-chinese-tang-dynasty-stone-epitaphs-05-1997$s$, $s$The exact SFMOMA image was visually audited. The former upper yellow point did not land on the clearest yellow passage, and the lower gray pocket was too subjective. Revised hotspots identify the unmistakable upper-left yellow arc, central green crossing, and pale blue lower sweep.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three coordinates directly match visible yellow, green, and pale blue paths.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The yellow arc at the upper left$s$, $s$Tap the bright yellow line curving around the broad upper-left loop.$s$,
    $s$This is one of the clearest yellow passages in the painting. It runs beside a darker green path without perfectly following it, creating the sense of two related movements that repeatedly separate and reunite.$s$, $s$Does the yellow seem to shadow the green line or pursue its own route?$s$,
    23, 18, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The green crossing near the center$s$, $s$Look at the dark green intersection near the middle, where one long horizontal curve passes through several vertical and looping paths.$s$,
    $s$The crossing gives the network a temporary center of gravity. Multiple routes occupy the same area without blending into one shape, so compression and independence remain visible at once.$s$, $s$How many separate lines can you trace through this crossing?$s$,
    51, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The pale blue sweep near the bottom$s$, $s$Tap the broad pale blue curve rising from the lower-left and passing behind the darker green and yellow loops near the bottom.$s$,
    $s$The blue is quieter than the dark green and bright yellow, so it can disappear at first glance. Once noticed, it adds another spatial layer, seeming to pass behind the stronger lines and deepen the otherwise flat gray field.$s$, $s$Does the pale blue line feel farther away because it is less forceful?$s$,
    42, 83, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 12  Agnes Martin - Wheat  [LC-056 -> A001]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A001$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Begin with the broad pale cross dividing the interior into four softly colored fields. Then compare that warm center with the cool gray-green border around the entire square.$s$, $s$Step back and ask how the title changes these simple divisions. Do the four pale areas begin to feel like fields, light, or something growing—or do they remain quiet blocks of color?$s$,
    $s$https://www.sfmoma.org/artwork/FC.787/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$The exact SFMOMA image was visually audited. The previous description of repeated vertical marks and varying density was incompatible with the image, which clearly shows four pale fields divided by a broad cross and enclosed by a gray-green border.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND FULLY REVISED: all three previous hotspots were replaced with the central vertical band, horizontal division, and outer border.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The broad vertical band$s$, $s$Tap the pale vertical strip running through the center from top to bottom.$s$,
    $s$This band separates the left and right fields without using a hard outline. Its near-white color creates a pause inside the warmer yellow area, making the painting feel divided and connected at the same time.$s$, $s$Does the central band feel like an empty path or a source of light?$s$,
    50, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The horizontal division$s$, $s$Look at the pale horizontal band crossing the painting slightly above the midpoint.$s$,
    $s$Together with the vertical strip, it forms a simple cross and creates four unequal-looking fields. The structure is extremely clear, but the soft boundaries prevent it from feeling rigid or diagrammatic.$s$, $s$Do the four surrounding fields feel equal despite their subtle tonal differences?$s$,
    50, 45, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The cool outer border$s$, $s$Tap the gray-green band surrounding the warm interior near the upper-left edge.$s$,
    $s$The border changes the entire temperature of the painting. It contains the pale yellow center while also making that center appear warmer and more luminous by contrast.$s$, $s$Would the central fields feel as warm without this cool frame?$s$,
    12, 18, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 12  Agnes Martin - Untitled #5  [LC-057 -> A002]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A002$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the broad square grid appear before inspecting the finer lines inside it. The painting is not one uniform graph: large divisions and closely spaced ruling coexist on the same pale surface.$s$, $s$Step back and ask whether the grid feels strict or fragile. Does its order come from perfect geometry, or from many faint handmade lines working together?$s$,
    $s$https://www.sfmoma.org/artwork/FC.788/$s$, $s$https://openspace.sfmoma.org/2017/02/agnes-martins-world-facing-grid/$s$, $s$The exact SFMOMA image was visually audited. The former claims about one trembling line and a specific line stopping short were too fine to verify consistently. Revised points identify clearly visible major horizontal and vertical divisions and an edge intersection.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REVISED: all coordinates now land on stable, visible grid structures rather than unprovable microscopic irregularities.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$A major horizontal division$s$, $s$Tap the darker horizontal grid line running across the upper third.$s$,
    $s$This line divides the canvas into large horizontal zones and is visibly stronger than the fine ruling around it. The hierarchy keeps the grid from becoming one undifferentiated pattern.$s$, $s$How does this stronger line change the scale of the squares you see?$s$,
    50, 25, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$A major vertical division$s$, $s$Look at the darker vertical line just left of center, where it crosses the broad horizontal structure.$s$,
    $s$The intersection makes the painting’s nested organization visible: large squares are built from smaller intervals. One crossing therefore reveals two scales of measurement at once.$s$, $s$Do you notice the large square first or the smaller lines within it?$s$,
    38, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The grid near the lower-right edge$s$, $s$Tap a clearly visible intersection close to the lower-right border.$s$,
    $s$The regular structure continues almost to the edge but does not disguise the physical linen beneath it. The pale margin and slight irregularity keep the grid from feeling printed or mechanically imposed.$s$, $s$Does the edge make the grid feel finished or merely cropped?$s$,
    83, 76, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 12  Agnes Martin - Drift of Summer  [LC-058 -> A003]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A003$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the pale warm field register slowly, then follow the graphite structure that divides it. Avoid searching for one dramatic focal point; the painting depends on comparison across the whole surface.$s$, $s$Step back and ask what the title contributes. Does the measured structure feel seasonal because of its warmth, lightness, and gradual shifts rather than any pictured landscape?$s$,
    $s$https://www.sfmoma.org/artwork/FC.691/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$The SFMOMA reproduction was visually checked at available resolution. The former claims about one uniquely warmer square and one darker crossing were too specific for reliable digital verification. Revised hotspots use stable upper, central, and lower structural zones.$s$,
    $s$Medium$s$, false, $s$VISUALLY AUDITED WITH SUBTLETY LIMITATION: coordinates match visible regions, but exact color temperature depends on the final screen and image calibration.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The upper warm field$s$, $s$Tap the pale cream-yellow area in the upper-center portion.$s$,
    $s$This broad area carries the painting’s warmth without depicting sunlight or a field. Its effect depends on sustained looking and comparison with cooler or lighter passages nearby.$s$, $s$Does the color feel warmer after you have looked at the rest of the canvas?$s$,
    52, 28, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The central graphite structure$s$, $s$Look at a clearly visible graphite crossing near the middle.$s$,
    $s$The crossing anchors the soft color inside a measured system. Martin’s geometry does not eliminate sensation; it creates the quiet conditions in which small tonal differences become noticeable.$s$, $s$Does the line interrupt the color or help you perceive it?$s$,
    50, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The lower field approaching the edge$s$, $s$Tap the pale area near the lower center, just above the bottom boundary.$s$,
    $s$The composition continues its restrained rhythm almost to the edge. The boundary ends the physical canvas, but the repeated intervals make the structure feel capable of continuing.$s$, $s$Does the bottom feel like a conclusion or a crop from something larger?$s$,
    50, 82, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 12  Agnes Martin - Night Sea  [LC-059 -> A004]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A004$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the deep blue-black field register first, then look for the faint gold and crayon grid emerging from it. The structure becomes visible slowly, more like reflected light than a boldly drawn pattern.$s$, $s$Step back and ask whether the title turns the grid into water for you. Does the painting feel like a sea at night, or like darkness measured into quiet intervals?$s$,
    $s$https://www.sfmoma.org/artwork/FC.459/$s$, $s$https://www.sfmoma.org/read/angles-on-agnes/$s$, $s$The official reproduction and confirmed gold-leaf medium were visually audited. The coordinates point to a visible upper gold line, central dark interval, and left-edge grid passage. Because gold changes with lighting, the first hotspot remains installation-dependent.$s$,
    $s$High$s$, false, $s$VISUALLY AUDITED AND REFINED: all coordinates match stable regions; gold-leaf intensity may differ between the photograph and gallery installation.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$A gold horizontal line$s$, $s$Tap a visible gold-toned horizontal line in the upper-middle portion.$s$,
    $s$Gold leaf can brighten or recede as light and viewpoint change. The line therefore behaves less like fixed yellow paint and more like a reflection that appears briefly across dark water.$s$, $s$Does the line seem brighter when you shift your viewing position?$s$,
    50, 35, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$A dark interval between lines$s$, $s$Look into the blue-black band between two horizontal lines near the center.$s$,
    $s$The ground is not a single flat color. Oil, crayon, linen, and reflected light create subtle tonal variation, giving the darkness material depth.$s$, $s$How many different dark blues or blacks can you distinguish here?$s$,
    50, 53, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The grid reaching the left edge$s$, $s$Tap the place where one horizontal line approaches the left boundary.$s$,
    $s$The faint structure extends across the broad field without becoming a heavy frame. At the edge, the viewer becomes aware of both the repeated grid and the physical limit of the linen.$s$, $s$Does the edge stop the imagined sea or only the painting?$s$,
    12, 68, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 12  Agnes Martin - Untitled #9  [LC-060 -> A005]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A005$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Compare the horizontal bands one at a time. Their widths and pale colors appear restrained, but each band changes because of the stripe immediately above and below it.$s$, $s$Step back until the separate bands begin to merge into one atmosphere. Does repetition erase difference or make small differences more powerful?$s$,
    $s$https://www.sfmoma.org/artwork/FC.711/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$The exact image was reviewed at available digital resolution. The former claim that one band visibly changed near the far-right edge was not dependable. Revised points use three stable horizontal features that remain valid across screen calibrations.$s$,
    $s$Medium$s$, false, $s$VISUALLY AUDITED WITH COLOR LIMITATION: coordinates directly match bands and a divider, but nuanced color comparisons require the final calibrated image.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$An upper horizontal band$s$, $s$Tap a clearly visible pale band near the upper third.$s$,
    $s$This stripe establishes the painting’s measured horizontal rhythm. Its color matters less as an isolated swatch than as one term in a sequence of neighboring bands.$s$, $s$How does this band change when you compare it with the one directly below?$s$,
    50, 30, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$A central colored-pencil divider$s$, $s$Look at the thin horizontal line separating two bands near the center.$s$,
    $s$The colored-pencil boundary organizes the surface without becoming a heavy contour. It measures the interval while allowing the colors on either side to remain visually connected.$s$, $s$Does the line divide the bands or make their relationship clearer?$s$,
    50, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$A lower horizontal band$s$, $s$Tap a broad band in the lower third and compare it with the upper one.$s$,
    $s$Repeated structure encourages the eye to notice minute shifts in tone and width. The lower band may seem different even when the materials and format remain consistent.$s$, $s$Does this lower stripe feel heavier, cooler, or simply lower because of its position?$s$,
    50, 73, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 12  Agnes Martin - Untitled #5  [LC-061 -> A006]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A006$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Follow the horizontal graphite lines from top to bottom and notice how they create broad, nearly white bands. The work asks you to compare intervals that initially seem identical.$s$, $s$Step back and decide whether the painting feels empty or carefully full. How much visual activity can emerge from lines and colors that almost disappear?$s$,
    $s$https://www.sfmoma.org/artwork/FC.305/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$The official image was visually reviewed. The previous claims about one widest interval and one specifically fading line were not reliably verifiable. Revised hotspots identify stable upper and lower dividers and the central pale band.$s$,
    $s$Medium$s$, false, $s$VISUALLY AUDITED WITH SUBTLETY LIMITATION: all coordinates match visible structural zones; line strength may vary by reproduction.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$The upper graphite divider$s$, $s$Tap a visible horizontal line near the upper quarter.$s$,
    $s$The line is delicate, but it establishes a clear interval without sealing it into a hard-edged stripe. Measurement remains present while the surface stays open and luminous.$s$, $s$Does the line feel precise or vulnerable?$s$,
    50, 25, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The central pale band$s$, $s$Look at the broad, nearly white interval around the center.$s$,
    $s$The band may appear empty at first, yet its tone is defined by the graphite lines and neighboring fields. Martin makes comparison—not strong contrast—the main act of seeing.$s$, $s$Does the band become more visible the longer you compare it?$s$,
    50, 50, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The lower graphite divider$s$, $s$Tap a horizontal line in the lower third.$s$,
    $s$Repeating a similar line lower down creates rhythm without dramatic progression. The eye begins to register spacing, pressure, and subtle tonal difference rather than searching for a focal point.$s$, $s$Does this line feel identical to the upper divider?$s$,
    50, 73, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

-- Room 12  Agnes Martin - Untitled #9  [LC-062 -> A007]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A007$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Move slowly from the upper bands to the lower ones, noticing pale blue, pink, peach, yellow, and near-white shifts. Avoid naming one stripe as the main subject; the experience lies in their sequence.$s$, $s$Step back and ask what kind of feeling the painting creates without depicting an event. Does its lightness feel joyful, delicate, distant, or quietly unstable?$s$,
    $s$https://www.sfmoma.org/artwork/FC.549/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$The official reproduction was visually reviewed. The former hotspot naming one exact pink-blue adjacency and a nearly white lower stripe was too dependent on screen rendering. Revised targets identify stable cool, graphite, and warm horizontal zones.$s$,
    $s$Medium$s$, false, $s$VISUALLY AUDITED WITH COLOR LIMITATION: all coordinates match visible bands and a divider; final color names should be checked on the production display.$s$,
    $s$approved$s$, true
  from target
  on conflict (artwork_id) do update set
    whole_artwork_prompt   = excluded.whole_artwork_prompt,
    step_back_reflection   = excluded.step_back_reflection,
    main_source_used       = excluded.main_source_used,
    additional_source_used = excluded.additional_source_used,
    source_notes           = excluded.source_notes,
    confidence             = excluded.confidence,
    human_reviewed         = excluded.human_reviewed,
    admin_notes            = excluded.admin_notes,
    review_status          = excluded.review_status,
    is_published           = excluded.is_published,
    updated_at             = now()
  returning id, artwork_id
)
insert into public.guided_looking_hotspots
  (set_id, artwork_id, hotspot_number, title, what_to_look_at,
   why_it_matters, visitor_question, x_coordinate, y_coordinate, is_published)
  select up_set.id, up_set.artwork_id, 1::int,
    $s$A cool upper band$s$, $s$Tap a pale blue or gray-blue stripe in the upper third.$s$,
    $s$The cool band changes the apparent warmth of the stripes around it. Martin lets color operate relationally: a restrained blue can make a neighboring cream or pink feel unexpectedly luminous.$s$, $s$Which neighboring band changes most because of this cool stripe?$s$,
    50, 29, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$A central graphite divider$s$, $s$Look at a thin graphite line near the middle of the canvas.$s$,
    $s$The line prevents the pastel fields from dissolving into one haze, but it remains too quiet to dominate them. Structure and softness coexist on the same surface.$s$, $s$Does the line separate the colors or hold them in balance?$s$,
    50, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$A pale warm band below$s$, $s$Tap a cream, peach, or pink-tinged band in the lower third.$s$,
    $s$Placed beneath cooler stripes, this band can feel warmer than its pigment alone would suggest. The painting turns comparison into an emotional experience without using dramatic color.$s$, $s$Does this lower band seem warmer because of its own color or because of what surrounds it?$s$,
    50, 74, true
  from up_set
on conflict (artwork_id, hotspot_number) do update set
  set_id           = excluded.set_id,
  title            = excluded.title,
  what_to_look_at  = excluded.what_to_look_at,
  why_it_matters   = excluded.why_it_matters,
  visitor_question = excluded.visitor_question,
  x_coordinate     = excluded.x_coordinate,
  y_coordinate     = excluded.y_coordinate,
  is_published     = excluded.is_published,
  updated_at       = now();

commit;
