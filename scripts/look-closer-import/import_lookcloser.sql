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
    $s$https://www.sfmoma.org/artwork/FC.519/$s$, $s$https://www.sfmoma.org/artist/Elizabeth_Murray/$s$, $s$The SFMOMA record confirms the work’s unusually deep, shaped oil-on-canvas construction. Hotspots were chosen from the official image to show how the orange form, looping line, and warped upper edge make pictorial pressure feel physically built into the support.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full SFMOMA image. Confirm only if the app uses a differently cropped reproduction.$s$,
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
    $s$The orange shape under pressure$s$, $s$Tap the large orange form just right of center. Look at how it is squeezed between the pale loop around its left side and the dark blue-green shapes pressing in from above and below.$s$,
    $s$This is not simply a bright focal point. The orange form feels swollen and crowded, almost like something soft being compressed inside a container. That pressure gives an abstract arrangement the physical urgency of a body trying to make room for itself.$s$, $s$Does the orange form seem protected by the surrounding shapes, or trapped by them?$s$,
    61, 47, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The loop that ties it together$s$, $s$Follow the pale blue-gray line that curls around the orange form, drops downward, and then travels across the right half of the painting.$s$,
    $s$It behaves almost like a cord, handle, or loose piece of tubing—but it never becomes one definite object. Because it passes through several otherwise separate shapes, it gives the eye a route through the painting and makes the whole image feel connected, as if its parts belong to one odd machine or body.$s$, $s$Where does the line seem to pass behind a form, and where does it come forward?$s$,
    64, 60, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The edge that becomes a wave$s$, $s$Look at the deep curve along the upper-left edge, where the turquoise support rises and then sinks before meeting the central arch.$s$,
    $s$A normal canvas edge would simply contain the image. Here, the edge itself bends like a wave, so the painting’s outer shape continues the motion happening inside it. Murray makes it difficult to tell where composition ends and sculpture begins.$s$, $s$Would the work feel as energetic if this edge were perfectly straight?$s$,
    24, 19, true
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
    $s$At first glance, this may look like a cartoon splash frozen in midair. Before focusing on one shape, ask what seems to be moving—and what reminds you that none of it can actually move.$s$, $s$Step back and compare the lively painted forms with the exposed construction. Does the work feel more animated because its physical structure is so obvious?$s$,
    $s$https://www.sfmoma.org/artwork/FC.277.A-B/$s$, $s$https://www.sfmoma.org/exhibition/freeform-experiencing-abstraction/$s$, $s$SFMOMA’s artwork text specifically identifies the rolling water-drop forms, exposed wooden supports, thick palette-knife paint, and flicked or splattered strokes. Each hotspot corresponds directly to one of those visible features.$s$,
    $s$High$s$, false, $s$Coordinate centers are based on the supplied official image. Recheck the exposed-support hotspot if a tighter crop is used.$s$,
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
    $s$The drops rolling outward$s$, $s$Look for the rounded drop-like forms that seem to slide or spill toward the outer edge of the shaped support.$s$,
    $s$SFMOMA describes these as cartoonish water drops, and their direction gives the whole work a sense of motion. Yet they are painted onto a rigid wooden structure. That contradiction—liquid-looking forms on an immovable object—is what makes the piece feel both comic and slightly tense.$s$, $s$Which drop looks as though it would move first if the painting suddenly came alive?$s$,
    28, 35, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$Where the wooden body shows$s$, $s$Tap the exposed structural area where the painted surface opens and the support becomes visible rather than fully disguised.$s$,
    $s$This is the moment when the illusion breaks. Instead of seeing only an image, you see the work as something cut, assembled, and built. Murray lets the construction interrupt the fantasy rather than hiding it neatly behind the paint.$s$, $s$Does seeing the support make the painted drops feel less believable, or even stranger?$s$,
    74, 50, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The paint that refuses to stay neat$s$, $s$Zoom in on a passage where thick paint, palette-knife ridges, flicks, or splatters gather around the smoother cartoonlike shapes.$s$,
    $s$The rough handling keeps the work from looking like a clean graphic design. SFMOMA notes that Murray flicked, flung, and splattered paint across the surface, so the image carries traces of force and speed as well as carefully planned shapes.$s$, $s$Which part looks deliberately drawn, and which part feels as though the paint took over?$s$,
    55, 73, true
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
    $s$Do not search for a hidden object. First look at how the three panels divide the painting—and then at how the brushstrokes ignore those divisions.$s$, $s$Now take in all three panels at once. Do they feel like separate sections placed side by side, or one burst of movement temporarily interrupted by two seams?$s$,
    $s$https://www.joanmitchellfoundation.org/joan-mitchell/artwork/0822-bracket$s$, $s$https://www.joanmitchellfoundation.org/joan-mitchell/materials-and-practice$s$, $s$The Foundation confirms that Bracket is a monumental three-panel oil painting. The hotspots focus on features visible in the official image: a blue passage that crosses a panel seam, a compact warm cluster on the left, and an active white interval below.$s$,
    $s$High$s$, false, $s$Coordinates are based on the full triptych image. The exact blue crossing point may shift slightly if the reproduction includes different outer margins.$s$,
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
    $s$The blue mass crossing the seam$s$, $s$Look near the upper middle, where a dense knot of cobalt and dark blue presses across the boundary between the center and right panels.$s$,
    $s$The canvas seam should divide the image, but this mass visually jumps across it. That makes the painting feel larger than any single panel and turns the physical division into something the brushwork can challenge rather than obey.$s$, $s$Do you notice the seam first, or the blue movement passing over it?$s$,
    67, 28, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The orange weight low on the left$s$, $s$Tap the compact orange-brown cluster in the lower half of the left panel, surrounded by darker green and blue strokes.$s$,
    $s$Because much of the painting is cool blue, green, and white, this warmer patch has unusual visual weight. It anchors the left side without becoming a recognizable object, almost like a concentrated ember inside a much larger field of weather.$s$, $s$Does this small warm area balance the enormous blue passages, or make them feel even colder?$s$,
    17, 60, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The white that is not empty$s$, $s$Look at the broad white passages near the lower center, where thin yellow, green, and dark marks drift through mostly unpainted canvas.$s$,
    $s$The white is not a background Mitchell simply forgot to cover. It creates intervals between denser gestures, allowing the surrounding marks to feel suspended, accelerated, or suddenly exposed. Without these openings, the painting would become a continuous wall of color.$s$, $s$Does this white area feel like light, air, distance, or simply untouched canvas?$s$,
    53, 75, true
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
    $s$https://www.joanmitchellfoundation.org/uploads/pdf/JMF-ArtEdPoster-Sunflowers.pdf$s$, $s$https://www.joanmitchellfoundation.org/joan-mitchell/key-works$s$, $s$The Foundation links Mitchell’s sunflower paintings to Van Gogh and to the flower’s cycle of gathered energy, flowering, and decline. The visual choices remain cautious: the hotspots point to a yellow flare, a dark late-stage cluster, and the white passage visibly separating them.$s$,
    $s$High$s$, false, $s$Coordinates verified against the Foundation’s full diptych image.$s$,
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
    $s$The color carries the brightness we associate with a sunflower, but there is no clear stem, center, or ring of petals. Mitchell lets color trigger recognition without finishing the image for us. The flower appears as an sensation—brightness under pressure—rather than a botanical description.$s$, $s$How much of a sunflower can you see when almost none of its parts are drawn?$s$,
    28, 17, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The heavy red-blue bloom$s$, $s$Look at the large dark red and blue cluster in the lower-right quadrant.$s$,
    $s$This dense form feels much heavier than the yellow passages above it. In the Foundation’s educational material, Mitchell’s late sunflower works are connected to the flower’s full life cycle, including fading and decline. Here, the bruised colors can make growth and decay feel present at the same time without illustrating either literally.$s$, $s$Does this cluster feel like a flower at full strength, or one beginning to collapse?$s$,
    83, 75, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The white channel between crowds$s$, $s$Follow the jagged white passage running through the lower middle, where it separates masses of blue, red, green, and turquoise.$s$,
    $s$The white does not produce peaceful emptiness. It cuts through the crowded paint like a narrow current, preventing the two panels from becoming solid blocks. Your eye uses it to weave between the surrounding masses.$s$, $s$Does the white passage open the painting up, or make the colored forms press against it more strongly?$s$,
    52, 67, true
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
    $s$https://www.joanmitchellfoundation.org/joan-mitchell/timeline$s$, $s$https://www.joanmitchellfoundation.org/joan-mitchell/citations/joan-mitchell-paints-a-symphony$s$, $s$The Foundation identifies La Grande Vallée as a twenty-one-work suite inspired by a friend’s memory of a hidden valley in Brittany; Mitchell did not paint its flowers and meadows literally. The hotspots therefore focus on how yellow, dark blue, and edge-bound marks create an immersive but nonliteral sense of place.$s$,
    $s$High$s$, false, $s$Coordinates verified against the Foundation image. The work is tripartite; preserve the complete three-panel crop in production.$s$,
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
    $s$The yellow opening$s$, $s$Look at the large yellow field spreading across the upper center panel, partly crossed by blue, gray, and green strokes.$s$,
    $s$This is the nearest thing the painting offers to an opening or clearing, but it does not recede neatly into distance. The yellow comes forward with such force that the supposed 'valley' feels less like scenery and more like light remembered from inside an experience.$s$, $s$Does the yellow create depth, or does it press toward you?$s$,
    52, 20, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark blue barrier$s$, $s$Tap the deep blue mass along the lower center, where short, dense strokes gather beneath the yellow.$s$,
    $s$This passage prevents the bright center from becoming simply cheerful or open. It acts like a visual threshold: the eye can sense space beyond it, but the dark paint also blocks easy entry. The imagined landscape is inviting and obstructed at once.$s$, $s$Does this dark band feel like ground, shadow, water, or a barrier made only of paint?$s$,
    51, 72, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The restless right edge$s$, $s$Look at the upper-right area, where dark blue loops and strokes crowd against bright green near the edge of the canvas.$s$,
    $s$The marks do not settle into a framing border. They twist, overlap, and run into the limit of the painting, suggesting that the energy continues beyond what we can see. This keeps the work from feeling like a neatly contained view.$s$, $s$What do you imagine continuing beyond this edge?$s$,
    87, 25, true
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
    $s$At first, the surface resembles a page of notes made too quickly to read. Instead of trying to translate it, follow where the marks become crowded, faint, or suddenly forceful.$s$, $s$Now take in the whole surface again. Does it feel like a record of an actual journey, or like what remains after places, names, and sensations have begun to blur together?$s$,
    $s$https://www.sfmoma.org/artwork/FC.586/$s$, $s$https://cytwombly.org/artist/chronology/$s$, $s$SFMOMA confirms the mixture of crayon, graphite, and oil on linen. The Cy Twombly Foundation chronology places the work among paintings made in Rome in 1962, when travel, classical references, and fragmented inscription were central to his practice. Hotspots are based on the official full image.$s$,
    $s$High$s$, false, $s$The central red cluster and pale upper-right interval are clearly locatable. The handwriting-like hotspot should be rechecked if the app uses a lower-resolution crop.$s$,
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
    $s$The red knot near the center$s$, $s$Tap the tangled red marks near the middle of the linen, where several loops, scratches, and smears collect more densely than elsewhere.$s$,
    $s$This small knot interrupts the otherwise pale, scattered surface. It feels less like a picture of something seen in Italy than a moment of memory becoming unusually intense—one place or sensation refusing to fade as quickly as the rest.$s$, $s$Does the red cluster feel like a destination, a wound, or simply a thought that has been underlined?$s$,
    52, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The name that almost forms$s$, $s$Look just left of center for the thin graphite and crayon marks that begin to resemble handwriting but never settle into a clearly readable word.$s$,
    $s$Twombly lets writing hover at the edge of meaning. Because the marks look as though they should communicate something, their refusal to become legible makes the painting feel intimate but inaccessible—like finding someone else’s travel notes after the context has been lost.$s$, $s$How long can you look before your mind starts inventing a word?$s$,
    35, 40, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The nearly empty upper corner$s$, $s$Move to the pale upper-right area, where only a few light scratches and isolated marks interrupt the linen.$s$,
    $s$The emptiness gives the denser passages room to feel like fragments rather than an all-over pattern. It also makes the journey in the title feel incomplete: the painting offers scattered traces, with large stretches that memory has left blank.$s$, $s$Does this quiet area feel unfinished, forgotten, or deliberately held open?$s$,
    80, 22, true
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
    $s$Stand back far enough to see the loops as rows, then move closer until each row breaks into an uneven series of hand-drawn turns. The painting lives between those two views.$s$, $s$Look across the entire gray field once more. Does the repetition make the work feel disciplined, obsessive, soothing, or increasingly out of control?$s$,
    $s$https://www.sfmoma.org/artwork/FC.460/$s$, $s$https://www.moma.org/collection/works/80088$s$, $s$SFMOMA identifies the materials as oil-based house paint, crayon, and graphite. MoMA’s account of Twombly’s related gray-ground paintings describes their colorless scrawls as resembling chalk on a blackboard while forming no actual words. The selected details emphasize changes in rhythm, pressure, and termination visible in this specific canvas.$s$,
    $s$High$s$, false, $s$Coordinates are based on the full portrait-format reproduction. Confirm the exact row positions if the production image is rotated or recropped.$s$,
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
    $s$The first row finding its rhythm$s$, $s$Look along the upper band of pale loops, especially where the marks begin unevenly near the left before settling into a repeated motion.$s$,
    $s$The row does not arrive as a perfect pattern. You can see the hand testing its pace, adjusting the size of the loops, and gradually finding a rhythm. That small irregular beginning keeps the painting from feeling mechanically produced.$s$, $s$When does the row start to feel like a rhythm rather than a collection of separate marks?$s$,
    25, 25, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$One loop under pressure$s$, $s$Zoom in near the center, where a loop becomes darker, thicker, or more tightly wound than the marks around it.$s$,
    $s$The repeated gesture may look effortless from across the room, but this heavier passage reveals pressure and resistance. A tiny change in the crayon makes one loop feel urgent while the surrounding ones remain lighter and more open.$s$, $s$Does the darker loop interrupt the pattern, or make you notice the pattern more clearly?$s$,
    52, 49, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$Where the line runs out$s$, $s$Follow a lower row toward the right edge, where the repeated motion weakens, compresses, or stops against the boundary.$s$,
    $s$The edge turns an apparently endless exercise into a physical action with a limit. The hand has traveled across the canvas, but the row cannot continue forever; its ending makes the passing of time suddenly visible.$s$, $s$Does the final loop feel finished, cut off, or simply exhausted?$s$,
    84, 75, true
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
    $s$Do not read the marks one at a time at first. Let the enormous horizontal sweep register as a whole—like several lines of writing racing across a wall faster than they can be controlled.$s$, $s$Step back until the marks merge into a single field of motion. Does the painting feel like writing enlarged beyond language, or like movement that only happens to resemble writing?$s$,
    $s$https://www.sfmoma.org/artwork/2000.204/$s$, $s$https://www.sfmoma.org/press-release/sfmoma-acquires-major-twombly-painting-directly-f/$s$, $s$SFMOMA identifies this as a monumental late example of Twombly’s blackboard paintings and specifically notes its energetic, lyrical surface of graffiti-like marks and erasures. The hotspots distinguish collision, revision, and long bodily movement across the unusually wide canvas.$s$,
    $s$High$s$, false, $s$Coordinates are estimated from the complete horizontal image. Preserve the full width; a cropped mobile image would weaken Hotspot 3.$s$,
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
    $s$The loops that collide$s$, $s$Look just right of center, where several white looping lines crowd into one another instead of remaining in separate, tidy rows.$s$,
    $s$In the 1968 painting, repetition still feels comparatively measured. Here, the loops overlap and compete for space, so the same basic gesture becomes turbulent. The painting begins to feel less like handwriting practice and more like several thoughts arriving at once.$s$, $s$Can you follow one line through the collision without losing it?$s$,
    62, 47, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The erased gray cloud$s$, $s$Tap a rubbed, cloudy area in the gray ground where earlier marks seem to have been covered, smeared, or partially removed.$s$,
    $s$SFMOMA describes the surface as richly worked with marks and erasures. The gray is therefore not an untouched background; it carries the remains of decisions that were revised but never completely disappeared. The painting remembers its own changes.$s$, $s$Does the erasure quiet the surface, or make it feel more restless because something is still underneath?$s$,
    36, 58, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The long run toward the edge$s$, $s$Follow one extended chain of loops across the upper half until it approaches the far-right edge.$s$,
    $s$At roughly sixteen feet wide, the painting makes drawing into a bodily journey. The repeated line records not just the wrist but sustained movement along the length of the canvas, and the approaching edge makes that momentum feel difficult to stop.$s$, $s$Do you sense the artist moving across the canvas as you follow the line?$s$,
    82, 28, true
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
    $s$Let the dark green reach you before the white marks do. Then notice how the pale forms seem to rise, loop, and finally give in to gravity.$s$, $s$Now see the three panels together. Does the painting feel like writing laid over a landscape, plants emerging from darkness, or rain slowly pulling every mark downward?$s$,
    $s$https://www.sfmoma.org/artwork/FC.807/$s$, $s$https://archive.artic.edu/cytwombly/salalah/$s$, $s$The Art Institute’s exhibition material explains that the three conjoined panels were covered with varied, transparent strokes of dark green over a white ground. It also connects the pale looping marks to enlarged pseudo-writing and the calligraphic character of printed Arabic. The hotspots separate loop, drip, and layered ground so the user can see how each behaves differently.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full three-panel image. The white-loop hotspot is centered on the left panel; confirm only if the app adds substantial framing around the artwork.$s$,
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
    $s$The white loop opening up$s$, $s$Tap the broad white loop on the left panel, where the stroke rises from the dark field and opens into an airy oval.$s$,
    $s$The shape resembles a letter without becoming readable, but it also feels plantlike—a leaf, vine, or tendril briefly catching light. Twombly enlarges the scale of handwriting until it begins to behave like something growing in space.$s$, $s$Does this form feel written, drawn, or grown?$s$,
    24, 36, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The drips beneath the stroke$s$, $s$Look directly below one of the thick white gestures, where long narrow drips descend through the green.$s$,
    $s$The upper stroke records the sweep of Twombly’s arm; the drips record what happened afterward, when gravity continued the painting without him. One mark therefore contains both deliberate gesture and slow physical consequence.$s$, $s$Which part feels more alive: the fast loop above or the slow drip below?$s$,
    55, 67, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The green that is made of layers$s$, $s$Zoom into a quieter area of the dark green ground, especially between the large white forms, and look for transparent streaks and overlapping brushwork.$s$,
    $s$The Art Institute notes that Twombly built the ground from thin dark-green acrylic over white, varying its transparency. What first appears to be one deep color is actually full of lighter seams and brush directions, making the darkness feel humid and atmospheric rather than flat.$s$, $s$Where does the hidden white ground seem closest to breaking through?$s$,
    72, 34, true
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
    $s$Begin with the objects you can recognize, but do not rush to make them form a sensible room. Let the shoes, legs, and fleshy shapes remain awkwardly piled together for a moment.$s$, $s$Step back and ask what the rug is doing. Does it organize the objects like a stage, or make the whole scene feel like one heavy pile that cannot be sorted out?$s$,
    $s$https://www.sfmoma.org/artwork/FC.475/$s$, $s$https://www.sfmoma.org/artist/Philip_Guston/$s$, $s$SFMOMA’s artwork audio identifies a mound of shoes, tangled limbs, and colors resembling raw meat. Its Guston overview also emphasizes the clunky cartoon shoes and provocative fleshy palette of the late figurative works. The three hotspots separate crowding, bodily fragmentation, and the destabilized domestic ground.$s$,
    $s$High$s$, false, $s$Coordinates are centered on the main shoe pile, central leg cluster, and lower rug area in the official image. Verify if the production crop trims the lower edge.$s$,
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
    $s$The shoes that become a crowd$s$, $s$Look across the lower half, where several thick-soled shoes point in different directions and overlap one another.$s$,
    $s$A shoe normally suggests one absent person. Repeated here, the shoes stop feeling individual and become a crowd of blunt, nearly interchangeable bodies. Their weight and sameness make the scene feel less like a still life than the aftermath of something we have not been allowed to witness.$s$, $s$Can you match each shoe to a believable body, or does the pile refuse to make sense?$s$,
    35, 67, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The legs with nowhere to go$s$, $s$Tap the bent pink-red legs near the center, where they twist into the surrounding shoes and dark outlines.$s$,
    $s$The legs are recognizable, but they do not lead to complete figures. Guston gives us body parts without stable bodies, which makes the scene feel both cartoonish and disturbing. The raw-meat pinks keep these forms uncomfortably physical.$s$, $s$Do the legs look active, injured, asleep, or simply abandoned?$s$,
    53, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The rug that will not stay flat$s$, $s$Look at the patterned or outlined ground beneath the pile, especially where its edge bends and disappears under the objects.$s$,
    $s$The title suggests an ordinary domestic rug, something meant to make a room comfortable. Instead, it becomes an unstable platform for a tangle of shoes and limbs. The familiar setting does not calm the image; it makes the disorder feel closer to home.$s$, $s$Does the rug make this feel like a private interior, or like a stage for something public and violent?$s$,
    70, 78, true
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
    $s$Try to enter the painting as you would enter a street. Where can your eye move forward—and where does a thick block of paint immediately stop it?$s$, $s$Now look at the whole painting as a city-like field rather than a collection of separate strokes. Does it feel built, crowded, damaged, or in the middle of becoming something?$s$,
    $s$https://www.sfmoma.org/artwork/FC.752/$s$, $s$https://www.philipguston.org/home/chronology$s$, $s$SFMOMA confirms the work’s 1956 date, placing it in Guston’s Abstract Expressionist period. The hotspots are grounded in the supplied image and focus on the central pale mass, the dark left-side obstruction, and the smaller warm accents that give the dense field an urban pressure without claiming literal buildings or figures.$s$,
    $s$Medium$s$, false, $s$The work is abstract, so object-like comparisons are intentionally framed as possibilities rather than identifications. Coordinates should be manually checked against the full-resolution image before launch.$s$,
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
    $s$The pale block pushing forward$s$, $s$Look at the large pale pink-white mass near the center, built from short strokes that thicken into a roughly rectangular form.$s$,
    $s$This light area might initially read as an opening, but its dense brushwork makes it feel solid and close. Instead of giving the eye a way into the painting, it becomes something like a wall, building, or body pressing toward us.$s$, $s$Does the light color create space, or does its thickness close the space off?$s$,
    51, 43, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark passage at the left$s$, $s$Tap the deep gray-black cluster along the left side, where darker strokes gather against muted pinks and reds.$s$,
    $s$The dark area gives the painting a sense of weight and obstruction. Because its edge remains broken and brushed rather than cleanly drawn, it never becomes one identifiable object; it feels like shadow, architecture, and pressure at the same time.$s$, $s$Can your eye move through this dark area, or does it keep being pushed back?$s$,
    21, 55, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The small red interruptions$s$, $s$Find the compact red-orange strokes scattered through the center and lower part of the painting.$s$,
    $s$These warm notes are small, but they prevent the muted field from becoming passive. They behave like flashes of traffic, signs, windows, or human activity without clearly representing any of them. The street is suggested through friction between colors rather than through perspective.$s$, $s$Which red mark feels most like an event rather than simply a patch of color?$s$,
    62, 65, true
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
    $s$Look at these brushes first as objects, not as symbols. They are thick, worn, crowded together, and far heavier-looking than the light tools we normally hold in a hand.$s$, $s$Take in the whole group again. Do the brushes feel ready for work, left behind after work, or almost like a portrait of the painter without his body?$s$,
    $s$https://www.sfmoma.org/artwork/FC.681/$s$, $s$https://gustoncrllc.org/catalogue-raisonne/works/2567$s$, $s$SFMOMA and the Guston Catalogue Raisonné confirm the 1978 painting and its dimensions. The existing workbook identifies the tightly grouped brushes as a late self-referential studio image. The hotspots focus on the visibly paint-loaded bristles, crowded handles, and bodily bluntness of their lower ends.$s$,
    $s$High$s$, false, $s$Coordinates correspond to the upper bristles, central handle cluster, and lower handle ends. Confirm against the final app crop.$s$,
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
    $s$The bristles loaded with color$s$, $s$Look at the upper ends of the brushes, where dark red, blue, and black paint gathers on the bristles.$s$,
    $s$The colored tips are the only direct evidence of what these tools have been doing. Yet the paint does not lead us to another image; it stops on the brushes themselves. Guston turns the instruments of painting into the painting’s main event.$s$, $s$Do the loaded bristles make the brushes feel prepared, used up, or still in the middle of working?$s$,
    47, 29, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The handles pressed together$s$, $s$Tap the thick handles in the center, where their black outlines crowd together with almost no space between them.$s$,
    $s$The brushes form a row, but not a tidy one. Their uneven leaning and compressed outlines make them feel like a group of bodies packed into a narrow space. A simple studio still life begins to carry the social pressure of a crowd.$s$, $s$Which brush seems to lean on another, and which one appears to stand alone?$s$,
    50, 53, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The blunt lower ends$s$, $s$Look near the bottom, where the handles end in rounded or cut-off shapes against the pale ground.$s$,
    $s$These heavy ends make the tools feel strangely bodily—closer to fingers, legs, or stumps than elegant artist’s equipment. Guston’s rough cartoon language prevents the brushes from becoming decorative and keeps attention on their awkward physical presence.$s$, $s$At what point do these stop looking like tools and start looking like characters?$s$,
    57, 79, true
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
    $s$Let the title influence the temperature of what you see, but do not search for trees or leaves. Instead, look for where the painting still carries warmth—and where that warmth seems to be going dark.$s$, $s$Step back and ask whether the painting feels like a season ending, or whether the title has made you read ordinary abstract color as weather, age, and loss.$s$,
    $s$https://www.sfmoma.org/artwork/FC.779/$s$, $s$https://www.tate.org.uk/documents/1863/TM_EXH_0089_Philip_Guston_LPG_Web_AW.pdf$s$, $s$SFMOMA provides the artwork record for this 1963 abstract painting. Tate’s Guston guide describes his abstract compositions as unstable accumulations in which forms hover near dissolution. The hotspot language therefore stays with visible layering, downward pressure, and thinning brushwork rather than treating the title as a literal autumn scene.$s$,
    $s$Medium$s$, false, $s$Exact color positions require final confirmation against the full-resolution production image. Interpretive language is deliberately cautious because no detailed artwork-specific curatorial text was located.$s$,
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
    $s$The red buried in gray$s$, $s$Look near the center for muted red or pink strokes partly covered by heavier gray and black paint.$s$,
    $s$The warmer color does not sit cleanly on top. It seems caught underneath, as though an earlier brightness has been obscured but not completely erased. That layering gives the title’s 'late' feeling a visible form: something remains, but only through darker paint.$s$, $s$Does the red feel as though it is emerging from the gray or disappearing into it?$s$,
    50, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark weight above$s$, $s$Tap the broad dark passage in the upper portion, where black and charcoal strokes gather more heavily than the surrounding paint.$s$,
    $s$This area presses downward rather than opening into sky. Its weight makes the rest of the composition feel compressed beneath it, turning abstraction into an atmosphere of closing light and physical pressure.$s$, $s$Does this dark area feel distant, or uncomfortably close to the surface?$s$,
    52, 26, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The thinning edge$s$, $s$Look toward a side or lower corner where the brushwork becomes looser and more of the pale ground remains visible.$s$,
    $s$The quieter edge gives the dense center somewhere to end, but it does not provide a clean escape. Sparse marks feel less like openness than the last traces left after the painting’s energy has withdrawn.$s$, $s$Does the exposed ground feel like empty space, fading light, or unfinished work?$s$,
    79, 77, true
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
    $s$Before deciding what story is taking place, notice how low and cramped the objects sit. The painting gives them a great deal of canvas, yet almost no comfortable space.$s$, $s$Look once more at the entire scene. Does the casual title make the objects feel resigned to their situation, or does it make their awkwardness seem even more troubling?$s$,
    $s$https://www.sfmoma.org/artwork/FC.501/$s$, $s$https://www.tate.org.uk/documents/1863/TM_EXH_0089_Philip_Guston_LPG_Web_AW.pdf$s$, $s$SFMOMA confirms this 1978 late figurative painting. Tate characterizes Guston’s late compositions as enigmatic, dreamlike arrangements of objects in precarious balance. The hotspots identify a clocklike circular form, a movement-related bodily fragment, and an edge crop while avoiding a fixed narrative that the available sources do not support.$s$,
    $s$Medium$s$, false, $s$The precise identity and center of the circular and bodily forms should receive human confirmation against the highest-resolution image. Coordinates are reasonable estimates from the supplied reproduction.$s$,
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
    $s$The clocklike circle$s$, $s$Look for the large round form with a dark outline, positioned among the other blunt objects near the center-right.$s$,
    $s$It suggests a clock or dial, but its face offers little useful information. Time appears as a heavy object rather than something that moves smoothly forward. In a painting titled *As It Goes*, that stalled-looking circle makes the phrase sound less carefree and more weary.$s$, $s$Does this form make you think of time passing, time stopping, or an object that has simply lost its purpose?$s$,
    67, 45, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The bent leg or shoe$s$, $s$Tap the fleshy pink form in the lower area, where a thick black outline turns an ordinary limb or shoe into an awkward, compressed shape.$s$,
    $s$Guston’s late vocabulary repeatedly returns to legs and shoes, objects associated with movement. Here, however, the form appears stuck among the other things. The part of the body that should carry someone forward instead adds to the painting’s sense of exhaustion.$s$, $s$Does this shape look capable of moving, or has it become just another object in the pile?$s$,
    42, 69, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The object cut by the edge$s$, $s$Look at the form that runs into or is cropped by one side of the canvas rather than fitting neatly inside the scene.$s$,
    $s$The crop makes the arrangement feel less like a complete still life and more like one fragment of an ongoing, cluttered world. The title’s shrug—'as it goes'—fits a scene that seems to continue without explanation beyond the frame.$s$, $s$What might be continuing outside the painting, and would seeing it make the scene easier to understand?$s$,
    86, 55, true
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
    $s$Do not try to solve the scene immediately. Let your eye move between the tiny sunset at the far left, the enormous fragments of bodies, and the neat black outlines that make everything look strangely easy to read.$s$, $s$Now take in the full painting again. Does it feel like one coherent scene, or like several kinds of images—romance, anatomy, design, and advertising—forced to share the same frame?$s$,
    $s$https://www.sfmoma.org/artwork/99.374/$s$, $s$https://lichtensteinfoundation.org/view-in-museums/$s$, $s$SFMOMA describes the work as a monumental, cluttered composition of figures and abstract shapes in strong black outlines and primary colors. The hotspots focus on the unusually small sunset, the isolated male face, and the large fragmented dotted figure visible in the official image.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full horizontal image. Preserve the entire left edge so the sunset hotspot remains usable.$s$,
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
    $s$The tiny sunset$s$, $s$Tap the small red-and-yellow sun near the far-left edge, where it sits inside a sharp triangular landscape shape.$s$,
    $s$The title gives this detail enormous importance, yet the sunset occupies only a tiny part of the painting. It looks like a ready-made symbol for romance rather than an observed sky. Its smallness makes the surrounding figures and abstract fragments feel almost comically oversized.$s$, $s$Why call the whole painting *Figures with Sunset* when the sunset is so easy to miss?$s$,
    9, 44, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The face split by the center$s$, $s$Look at the male face near the upper center-right, especially where the clean black features meet a yellow hat and the surrounding disjointed forms.$s$,
    $s$The face is clear enough to recognize instantly, but it belongs to no stable body. It has been inserted among enlarged fragments, dotted passages, and flat color blocks. Lichtenstein gives us the certainty of a comic-book face inside a scene whose space makes very little ordinary sense.$s$, $s$Does the clear face help organize the painting, or make the rest of it feel even stranger?$s$,
    59, 27, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The dotted body without a head$s$, $s$Tap the large pale oval and red-dotted body near the lower center-left, where a figure seems to face away from us.$s$,
    $s$The figure is built from different visual systems: a smooth blank oval, a field of printed-looking dots, and thick outlines. Those systems do not blend naturally, so the body feels assembled rather than alive—like an image made from parts borrowed from different pages.$s$, $s$At what point does this collection of shapes become a person?$s$,
    42, 57, true
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
    $s$Walk around this sculpture before deciding what it represents. From one angle it reads like a comic drawing of a gesture; from another, its extreme thinness becomes impossible to ignore.$s$, $s$Step back and compare the sculpture’s height with its almost sheet-like depth. Does it feel like a drawing that escaped the page, or a three-dimensional object pretending to stay flat?$s$,
    $s$https://www.sfmoma.org/artwork/FC.704/$s$, $s$https://lichtensteinfoundation.org/view-in-museums/$s$, $s$SFMOMA confirms the painted and patinated bronze medium and the sculpture’s tall, extremely shallow dimensions. The official image shows a yellow hand and hat, a red comic-style burst, and a long curved striped form, allowing hotspots to address gesture, frozen impact, and flatness.$s$,
    $s$High$s$, false, $s$Front-view coordinates are reliable. Because the flatness is best understood by moving around the work, Hotspot 3 should trigger text encouraging a side view rather than relying only on digital zoom.$s$,
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
    $s$The hand lifting the hat$s$, $s$Look at the yellow hand and hat shape at the very top, where the gesture seems to continue beyond the long curved arm below.$s$,
    $s$The title refers to a tip of the hat, a brief social gesture. Lichtenstein freezes that moment at an exaggerated scale, turning a tiny movement of politeness into something nearly nine feet tall. The hand is readable at once, yet it remains as simplified as a comic-book symbol.$s$, $s$Does enlarging this small gesture make it feel more sincere, more theatrical, or more absurd?$s$,
    53, 10, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The red impact burst$s$, $s$Tap the red center surrounded by a jagged black-and-white burst roughly halfway up the sculpture.$s$,
    $s$This burst resembles the graphic shorthand comics use for impact, noise, or sudden movement. In bronze, however, the supposedly instantaneous effect becomes permanent and heavy. A split-second visual device has been made physically durable.$s$, $s$What changes when an image of impact cannot actually move or disappear?$s$,
    51, 40, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The curve that is almost flat$s$, $s$Look along the long yellow, blue, and black curve below the burst, then shift sideways enough to see the sculpture’s narrow edge.$s$,
    $s$From the front, the colored curve suggests a sweeping arm in motion. From the side, the bronze is startlingly thin. Lichtenstein keeps the frontality of a printed image while giving it just enough depth to occupy real space.$s$, $s$Which view feels more truthful: the lively front or the nearly flat side?$s$,
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
    $s$Let the image hit you at comic-book speed first: face, gun, sound effect. Then slow down and notice how carefully that apparent instant has been separated into flat zones, outlines, and printed-looking patterns.$s$, $s$Look at the whole image again. Does the clean graphic style make the danger feel more immediate, or does it turn violence into something disturbingly easy to consume?$s$,
    $s$https://www.sfmoma.org/artwork/FC.612/$s$, $s$https://lichtensteinfoundation.org/view-in-museums/$s$, $s$SFMOMA confirms this 1962 oil painting, and the Lichtenstein Foundation identifies it as panel three of a four-part Live Ammo group. Hotspots correspond to the visible onomatopoeia, the sharply divided face, and the cropped weapon in the official image.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full portrait-format image. Retain the upper-left lettering and lower-right gun in any responsive crop.$s$,
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
    $s$The word that arrives first$s$, $s$Tap the red word “TZING!” in the upper-left corner, tilted beside the white streak cutting across the image.$s$,
    $s$The sound effect is not a caption placed after the action; it is part of the action. Its angle, color, and size make the eye almost hear the shot before fully reading the soldier’s face. Language becomes a visual weapon.$s$, $s$Did you hear the sound in your head before you understood what was happening?$s$,
    20, 21, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The face divided by shadow$s$, $s$Look at the soldier’s yellow face, where a hard black shape cuts across one side and leaves the eyes staring out from sharply separated zones.$s$,
    $s$The face is emotionally tense, but it is built from almost brutally simple divisions of yellow, black, and line. That clarity makes fear or concentration instantly readable while stripping away the gradual shading we associate with a natural face.$s$, $s$Does the simplified face feel more dramatic than a realistic one would?$s$,
    57, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The gun entering from below$s$, $s$Tap the barrel and mechanical parts rising from the lower-right edge.$s$,
    $s$The weapon is cropped, so we see only the part needed to understand the scene. This is how a comic panel creates urgency: the action seems larger than the frame, and the viewer is placed uncomfortably close to the machinery of violence.$s$, $s$Does the crop make the gun feel closer to you than the soldier does?$s$,
    76, 82, true
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
    $s$At first this looks like a flat picture of a radio. Then notice the real leather strap above it and ask where the representation stops and the object begins.$s$, $s$Step back and decide what you are looking at now: a painting of a radio, a radio-shaped sculpture, or a joke that depends on refusing to choose between the two?$s$,
    $s$https://www.sfmoma.org/artwork/FC.604/$s$, $s$https://lichtensteinfoundation.org/view-in-museums/$s$, $s$SFMOMA’s audio specifically explains that the image was hand-painted but given a real strap, making the painting itself partly resemble a radio. The official image clearly supports hotspots on the strap, dotted speaker grille, and numbered tuning display.$s$,
    $s$High$s$, false, $s$Coordinates verified against the uncropped official image. The leather strap must remain visible in production.$s$,
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
    $s$The real carrying strap$s$, $s$Tap the brown leather strap arching above the painted rectangle.$s$,
    $s$SFMOMA notes that the hand-painted image is fitted with an actual strap, so the painting partly behaves like the object it depicts. The strap is practical-looking, but it cannot make this canvas function as a radio. It turns representation into a deadpan physical joke.$s$, $s$Does the real strap make the painted radio seem more convincing or more obviously fake?$s$,
    50, 7, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The speaker made from dots$s$, $s$Zoom into the large dotted rectangle covering most of the lower-left half.$s$,
    $s$From a distance, the repeated dots read as the perforated grille of a speaker. Up close, they become a laboriously painted pattern. The passage imitates industrial manufacture while revealing the slow handmade work behind the illusion.$s$, $s$At what distance do the dots stop being a pattern and start becoming a speaker?$s$,
    28, 65, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The dial you cannot use$s$, $s$Look at the two numbered tuning bands across the upper-right area, with their tiny frequency markings and central divider.$s$,
    $s$The numbers promise precise control, but no station can actually be selected. Lichtenstein copies the visual authority of a consumer device while removing its function. The radio remains perfectly legible and completely silent.$s$, $s$Why include so much usable-looking information on an object that cannot work?$s$,
    68, 28, true
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
    $s$Begin with how instantly recognizable this object is. Then look long enough for the tire to stop feeling ordinary and start feeling like a huge system of black shapes, zigzags, and empty white spaces.$s$, $s$Take in the full painting again. Has the tire become more like a useful object, a commercial illustration, an abstract pattern, or all three at once?$s$,
    $s$https://www.sfmoma.org/artwork/FC.705/$s$, $s$https://lichtensteinfoundation.org/view-in-museums/$s$, $s$SFMOMA confirms the monumental 1962 oil painting. The official reproduction shows a highly legible tire built from a zigzag tread, broad black sidewall, and conventionally hatched wheel hub. The hotspot choices show how an ordinary manufactured object shifts into graphic abstraction.$s$,
    $s$High$s$, false, $s$Coordinates are based on the complete portrait image. Preserve the full right-side tread and lower-left hub.$s$,
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
    $s$The tread that becomes a pattern$s$, $s$Tap the large zigzag tread running down the right side of the tire.$s$,
    $s$The tread is designed for traction, but Lichtenstein turns it into a bold all-over pattern. Because every groove is sharply outlined and repeated, the practical surface begins to compete with the object itself. You can almost forget you are looking at rubber.$s$, $s$When do these repeated zigzags stop describing a tire and become an abstract design?$s$,
    76, 49, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The black sidewall$s$, $s$Look at the broad black band on the left half, between the pale wheel rim and the patterned tread.$s$,
    $s$This nearly solid area gives the tire its visual weight. It also flattens what should be a curved rubber surface into a stark graphic shape. The tire looks heavy and dimensional from afar, yet its volume is built from simple black-and-white divisions.$s$, $s$Does this black area feel rounded, or does it read as a flat shape pasted onto the canvas?$s$,
    30, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The shiny hub without shine$s$, $s$Zoom into the circular wheel hub near the lower-left center, where curved lines and short hatching marks suggest metal reflections.$s$,
    $s$There is no gradual metallic shimmer here. A few standardized marks stand in for polished steel, much as they would in a commercial illustration. Your eye supplies the shine even though the painting gives you only black lines and white paint.$s$, $s$How little information does the image need before you imagine reflective metal?$s$,
    27, 63, true
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
    $s$Take in the scene as if you had entered a stage set midway through a ritual. Before deciding whether anything supernatural is happening, look at how the painting itself makes some figures solid and others barely present.$s$, $s$Now step back and decide where the illusion really lives. Is it in the magician’s ritual, the ghostly figure, the translucent fabric, or your own willingness to connect all these fragments into one event?$s$,
    $s$https://www.sfmoma.org/artwork/FC.735/$s$, $s$https://www.sfmoma.org/artwork/FC.735/#essay$s$, $s$SFMOMA’s audio description identifies the magician, pale ghost, ritual objects, protective circles, stage-like curtain, and stretcher visible through the thin fabric. The hotspots use those specific details to distinguish apparition, ritual boundary, and the exposed construction of illusion.$s$,
    $s$High$s$, false, $s$Coordinates are based on SFMOMA’s described composition and supplied full image. Preserve the far-left curtain and lower ritual circle in the app crop.$s$,
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
    $s$The ghost made from almost nothing$s$, $s$Tap the pale hooded figure left of center. Its raised arms and robe are visible, but the body is drawn so lightly that the yellow ground seems to pass straight through it.$s$,
    $s$The magician on the right is built from dark, decisive lines, while this second figure nearly disappears. Polke does not need to paint a glowing spirit; he creates one simply by weakening the image. The figure feels supernatural because it is less materially present than everything around it.$s$, $s$At what point does a faint outline become a ghost rather than an unfinished person?$s$,
    42, 43, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The circle of protection$s$, $s$Look at the two broad curved lines running across the floor beneath the figures, enclosing the skull, candles, book, picture, and goblet.$s$,
    $s$The circle turns a loose collection of objects into a ritual space. It also functions like a picture frame inside the painting, separating the supposed magical event from the room around it. Yet the line is incomplete and visually fragile, so the protection never feels entirely secure.$s$, $s$Does the circle make the scene feel controlled, or does it emphasize how easily the boundary could be broken?$s$,
    51, 76, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The curtain—and the real frame behind it$s$, $s$Tap the white curtain at the far-left edge, then look through the thin painted fabric for the rectangular wooden stretcher showing behind the image.$s$,
    $s$The curtain makes the scene resemble a stage, encouraging us to treat the apparition as performance. But the visible stretcher reveals another layer of illusion: the physical support of the painting appears through the image. Polke lets the machinery behind both theater and painting remain visible.$s$, $s$Which is more convincing here: the painted room or the real structure behind it?$s$,
    10, 42, true
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

-- Room 5  Sigmar Polke - Untitled, 1983  [LC-021 -> A061]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A061$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Do not try to force the surface into one scene. Begin by identifying separate visual events—a stain, a drawn shape, a strip of color—and notice how little effort the painting makes to reconcile them.$s$, $s$Look again at the whole sheet. Does its confusion feel random, or does the placement of incompatible marks make you more aware of how eagerly the mind tries to build a single image?$s$,
    $s$https://www.sfmoma.org/artwork/FC.394/$s$, $s$https://www.tate.org.uk/art/artists/sigmar-polke-2203$s$, $s$SFMOMA confirms that this is acrylic on paper. Because no detailed artwork-specific curatorial account was located, the hotspot choices rely on cautious close visual analysis of the supplied image and Polke’s broader practice of colliding recognizable imagery with stains, overlays, and disruptive marks.$s$,
    $s$Medium$s$, false, $s$The face and diagonal require human verification against the highest-resolution image. Coordinates are approximate and should be adjusted if the final crop differs.$s$,
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
    $s$The pale face in the collision$s$, $s$Look near the upper half for the loosely indicated face or head emerging among stronger colors and overlapping marks.$s$,
    $s$The face gives the eye something recognizable to hold onto, but it never gains complete control of the composition. Other marks pass beside or through it, so recognition feels temporary. The image seems to appear because the viewer gathers scattered clues, not because Polke presents a stable portrait.$s$, $s$How many marks do you actually need before you begin seeing a face?$s$,
    52, 30, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark diagonal interruption$s$, $s$Tap the strong dark stroke or band cutting diagonally through the more loosely organized forms.$s$,
    $s$This mark does not politely belong to the image around it. It acts like interference—crossing, dividing, and refusing to explain itself. Its blunt direction makes the rest of the sheet feel less like a unified composition and more like several images competing on the same surface.$s$, $s$Does the diagonal organize the picture, or does it prevent the picture from settling?$s$,
    60, 55, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The color that behaves like a stain$s$, $s$Look at a broad translucent or uneven patch of color where the paper remains partly visible beneath it.$s$,
    $s$Unlike a neatly outlined form, the wash spreads according to the liquid and the absorbency of the paper. That gives the material its own agency. The stain can suggest atmosphere or depth, but it also reminds us that this is acrylic moving across paper rather than a coherent depicted space.$s$, $s$Do you read this patch as part of an image, or first as something that happened to the paper?$s$,
    28, 69, true
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

-- Room 5  Sigmar Polke - Springbrunnen (Fountain), 1966  [LC-022 -> A062]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A062$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Stand back until the fountain becomes readable, then move closer until the water breaks apart into oversized dots. The work changes most in the distance between those two views.$s$, $s$Step back again. Does the fountain regain its sparkle and movement, or can you no longer stop seeing the stiff printed pattern from which it is made?$s$,
    $s$https://www.sfmoma.org/artwork/FC.312/$s$, $s$https://www.moma.org/artists/4637$s$, $s$SFMOMA confirms the 1966 paint-on-linen work. The hotspots focus on Polke’s clearly visible enlarged raster-dot technique: the spray formed by dots, irregularities that reveal hand painting, and the basin assembled from minimal printed-looking information.$s$,
    $s$High$s$, false, $s$Coordinates are reasonable estimates from the official image. Verify the exact center of the irregular-dot passage at full resolution.$s$,
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
    $s$The water made from dots$s$, $s$Tap the rising spray near the upper center, where enlarged black raster dots loosely form arcs and droplets.$s$,
    $s$A fountain is normally defined by continuous movement, changing reflections, and irregular splashes. Polke rebuilds it using the rigid dot system of cheap printed reproduction. The image suggests motion, but every drop has been immobilized inside a mechanical-looking pattern.$s$, $s$Can a grid of fixed dots still make you imagine moving water?$s$,
    52, 30, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$Where the dots lose discipline$s$, $s$Zoom into an area along one side of the fountain where the dots change size, spacing, or alignment instead of forming a perfectly regular printed screen.$s$,
    $s$These dots imitate machine printing, but they are painted and visibly irregular. Their small failures expose the image as handmade. Polke does not simply copy mass reproduction; he makes its supposedly objective system wobble.$s$, $s$Which dot looks most obviously made by a person rather than a machine?$s$,
    69, 53, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The basin reduced to an outline$s$, $s$Look at the lower bowl or basin, where a few curved lines and dotted shadows are enough to suggest a solid stone structure.$s$,
    $s$The basin feels much more stable than the spray above it, yet it is built from the same minimal vocabulary. Your eye turns sparse marks into weight, depth, and material. The painting quietly shows how little visual evidence is needed to make a believable object.$s$, $s$Why does the basin feel solid when it is only a flat collection of lines and dots?$s$,
    50, 76, true
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

-- Room 5  Sigmar Polke - Ohne Titel (Untitled), 1968  [LC-023 -> A063]
with target as (
  select a.id as artwork_id from public.artworks a where a.code = $s$A063$s$
), up_set as (
  insert into public.guided_looking_sets
    (artwork_id, whole_artwork_prompt, step_back_reflection,
     main_source_used, additional_source_used, source_notes,
     confidence, human_reviewed, admin_notes,
     review_status, is_published)
  select target.artwork_id,
    $s$Let the face appear quickly, then slow down and inspect how little information actually holds it together. The watercolor never gives the person the stability of a conventional portrait.$s$, $s$Now return to the whole sheet. Does the figure feel more present because your mind completed it, or less present because the marks remain so thin and unstable?$s$,
    $s$https://www.sfmoma.org/artwork/FC.428.2/$s$, $s$https://www.tate.org.uk/art/artists/sigmar-polke-2203$s$, $s$SFMOMA confirms the small 1968 watercolor-on-paper format. With no detailed artwork-specific interpretation available, the hotspots remain close to visible portrait mechanics: dark eyes anchoring recognition, an incomplete contour, and translucent wash crossing the facial structure.$s$,
    $s$Medium$s$, false, $s$Coordinates are approximate. Confirm the eyes and strongest wash against the high-resolution scan before launch.$s$,
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
    $s$The eyes doing most of the work$s$, $s$Tap the pair of dark eyes near the upper center of the face.$s$,
    $s$The rest of the head is loosely washed and partly unresolved, but the eyes immediately establish a human presence. They show how recognition can be concentrated in just a few marks: once the gaze appears, the surrounding stains begin to organize themselves into a person.$s$, $s$Would you still see a face as quickly if these two dark marks were removed?$s$,
    50, 36, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The outline that dissolves$s$, $s$Follow one side of the head or cheek where the line fades into the pale watercolor instead of closing the face completely.$s$,
    $s$A conventional portrait uses contour to separate a person from the background. Here, the boundary weakens and the face seems to leak back into the paper. The figure is recognizable without ever becoming fully contained.$s$, $s$Where exactly does the face end?$s$,
    67, 50, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The wash that ignores the features$s$, $s$Look at a translucent patch of watercolor passing across or beside the face without neatly respecting the drawn eyes, nose, or mouth.$s$,
    $s$The liquid color does not behave like careful flesh tone. It spreads as a material event, partly supporting the face and partly disrupting it. The portrait feels provisional—as if it could disappear into the next wash.$s$, $s$Does the watercolor help create the person, or threaten to erase them?$s$,
    38, 65, true
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
    $s$Look at the two images as if they were evidence. Then notice how much the official format seems to promise—and how little it actually tells you about the person.$s$, $s$Step back and compare the front and profile views. Do two angles make Frank B. more knowable, or simply more thoroughly processed by the same system?$s$,
    $s$https://www.sfmoma.org/artwork/FC.605.A-B/$s$, $s$https://whitney.org/collection/works/9992$s$, $s$SFMOMA confirms the paired silkscreen mug-shot format. Whitney material on the Most Wanted Men series provides context for Warhol’s use of police photographs and the tension between public identification and dehumanizing repetition.$s$,
    $s$High$s$, false, $s$Coordinates verified against the full diptych. Preserve both panels at equal scale.$s$,
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
    $s$The frontal stare$s$, $s$Tap the face in the left panel, where the eyes meet the camera directly.$s$,
    $s$The mug shot format is designed to make a person identifiable, but the flat lighting and enlarged grain reduce expression to official data. The direct gaze feels personal, yet the image treats it as one measurable feature among others.$s$, $s$Do you feel looked at by a person, or presented with a record?$s$,
    27, 46, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The profile as confirmation$s$, $s$Look at the right-hand profile, especially the nose and forehead cut into a stark silhouette.$s$,
    $s$The second view seems to confirm identity, but it also repeats the same institutional logic from another angle. More visual information does not necessarily create more understanding.$s$, $s$Does the profile reveal anything the frontal image did not?$s$,
    72, 46, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The ink that erases detail$s$, $s$Zoom into a dark facial passage where the screenprint turns hair, shadow, or clothing into a dense black mass.$s$,
    $s$The printing process destroys fine information while making the image look bold and authoritative. The portrait becomes easier to classify and harder to encounter as an individual.$s$, $s$Which parts of the person have disappeared into reproduction?$s$,
    47, 66, true
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
    $s$Let the three figures register as one burst of movement before separating them. Then look for where repetition creates motion—and where it makes Elvis begin to disappear.$s$, $s$Now step back. Has repetition made Elvis larger than life, or reduced him to an image that can be stamped out again and again?$s$,
    $s$https://www.sfmoma.org/artwork/FC.556/$s$, $s$https://www.moma.org/artists/6246$s$, $s$SFMOMA’s artwork record and interpretation identify the repeated cowboy publicity still and silver ground. The hotspots distinguish the strongest impression, the central overlap that creates implied movement, and the fading final transfer.$s$,
    $s$High$s$, false, $s$Coordinates checked against the complete horizontal image.$s$,
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
    $s$The first Elvis steps forward$s$, $s$Tap the darkest Elvis on the left, especially the bent leg and gun arm.$s$,
    $s$This figure establishes the pose clearly: a publicity image of Elvis as an armed cowboy. Because it prints most strongly, it feels like the original event from which the others echo.$s$, $s$Why does the darkest figure feel more 'real' than the others?$s$,
    28, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The overlapping gun arms$s$, $s$Look where the repeated arms and guns cross near the center.$s$,
    $s$The overlaps turn one frozen publicity still into a sequence. Nothing actually changes from figure to figure, yet the repeated displacement makes the pose seem to advance across the canvas like film frames.$s$, $s$Do you see three Elvisses, or one Elvis moving?$s$,
    53, 43, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The Elvis fading into silver$s$, $s$Tap the palest figure on the far right, where the face and body nearly dissolve into the metallic ground.$s$,
    $s$The repetition ends not with a stronger image but with a ghost. Celebrity appears endlessly reproducible, yet each transfer can lose information until the star is little more than an afterimage.$s$, $s$Does the fading make Elvis seem distant, fragile, or even more iconic?$s$,
    80, 50, true
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
    $s$Read the image first like a newspaper page: cans, faces, repetition. Then notice how the same printing process makes a grocery product and two deaths look disturbingly similar.$s$, $s$Step back and ask what repetition has done to the tragedy. Has it made the event impossible to ignore, or made it resemble another piece of mass-produced information?$s$,
    $s$https://www.sfmoma.org/artwork/FC.608/$s$, $s$https://www.moma.org/collection/works/79827$s$, $s$SFMOMA and MoMA place the work within Warhol’s Death and Disaster imagery. The hotspots focus on the contrast between consumer packaging, victims’ newspaper photographs, and visibly degraded screenprint transfers.$s$,
    $s$High$s$, false, $s$Coordinates are based on the full portrait-format image; verify individual repeated units if the production image is reduced.$s$,
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
    $s$The cheerful tuna can$s$, $s$Tap one of the clearly printed tuna cans near the upper half.$s$,
    $s$The can belongs to the visual world of packaging and ordinary shopping. Inside this painting, that familiar design becomes evidence in a fatal poisoning, showing how quickly a harmless consumer image can absorb horror.$s$, $s$At what point does the package stop looking ordinary?$s$,
    31, 28, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The two women reduced to newsprint$s$, $s$Look at the repeated newspaper photographs of the two victims in the lower portion.$s$,
    $s$The faces identify real people, but the coarse screenprint makes them small, gray, and difficult to know. Their individuality competes with the repetitive layout of a news story.$s$, $s$Do the repeated faces preserve memory or flatten it?$s$,
    49, 70, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$A print that nearly vanishes$s$, $s$Find a can or face where the ink is faint, incomplete, or broken.$s$,
    $s$The failed transfer resembles damaged newsprint or a signal fading out. It makes information feel unstable: the event is reproduced, but not necessarily preserved clearly.$s$, $s$Does the fading image feel more distant or more haunting?$s$,
    77, 49, true
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
    $s$Look at how much empty canvas surrounds this one silent object. The telephone is made for connection, yet the painting gives it no caller, room, or conversation.$s$, $s$Step back and ask whether the empty space makes the telephone look available, abandoned, or almost like a symbol waiting for a story.$s$,
    $s$https://www.sfmoma.org/artwork/FC.499/$s$, $s$https://www.moma.org/artists/6246$s$, $s$SFMOMA confirms the 1961 painting, made during Warhol’s transition from commercial illustration to Pop painting. The hotspots focus on the inactive receiver, visibly hand-drawn contour, and unusually large empty field.$s$,
    $s$High$s$, false, $s$Coordinates checked against the supplied full image.$s$,
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
    $s$The receiver left in place$s$, $s$Tap the curved handset resting across the top.$s$,
    $s$The receiver suggests a voice that could arrive at any moment, but nothing in the image activates it. Its stillness turns communication into anticipation.$s$, $s$Does the phone feel about to ring, or permanently silent?$s$,
    50, 31, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The wobbling black outline$s$, $s$Zoom into the contour along the body of the telephone, where the black line thickens, thins, or drifts.$s$,
    $s$The drawing resembles commercial illustration, but the irregular line keeps the artist’s hand visible. The object sits between polished advertisement and awkward handmade copy.$s$, $s$Where does the line look least mechanical?$s$,
    39, 54, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The blank field around it$s$, $s$Look at the large empty area above and beside the telephone.$s$,
    $s$The emptiness removes the device from ordinary use. Without a desk, wall, or person, it becomes an isolated sign for connection rather than a functioning household object.$s$, $s$Does the empty space make the phone feel more important or more useless?$s$,
    76, 73, true
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
    $s$Compare the two profiles quickly, as an advertisement expects you to. Then slow down and ask what has actually changed—and what the image asks you to believe that change means.$s$, $s$Look at both profiles together again. Does the painting document improvement, or expose how advertising turns one bodily difference into a complete story?$s$,
    $s$https://www.sfmoma.org/artwork/FC.675/$s$, $s$https://www.moma.org/collection/works/79809$s$, $s$SFMOMA identifies the work as based on a rhinoplasty advertisement. The hotspots isolate the problem-making 'before' profile, simplified 'after' profile, and blank interval that conceals the actual process of transformation.$s$,
    $s$High$s$, false, $s$Coordinates verified against the paired profiles.$s$,
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
    $s$The 'before' nose$s$, $s$Tap the left profile, especially the more prominent nose.$s$,
    $s$The image presents this feature as a problem before we have been given any reason to see it that way. The label and pairing create dissatisfaction rather than merely recording difference.$s$, $s$Would this nose look 'wrong' without the word before beside it?$s$,
    29, 47, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The cleaner 'after' profile$s$, $s$Look at the right profile, where the nose has been shortened and the contour simplified.$s$,
    $s$The second image promises resolution through a small physical alteration. Because the rest of the face barely changes, the advertisement’s confidence begins to look absurdly disproportionate.$s$, $s$How much improvement is the image asking you to imagine?$s$,
    70, 47, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The dividing space$s$, $s$Focus on the blank gap separating the two heads.$s$,
    $s$The empty interval functions like a transformation that the viewer must mentally complete. No surgery, pain, or passage of time appears—only an effortless jump from one image to the next.$s$, $s$What has the advertisement conveniently removed from this gap?$s$,
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
    $s$Let your eye move across all nine faces before choosing one. The expression never changes, but color, contrast, and reversal keep making the same Marilyn feel newly distant or newly vivid.$s$, $s$Step back and ask whether the grid gives you nine versions of Marilyn, or nine demonstrations of how easily one public image can be altered without becoming a new person.$s$,
    $s$https://www.sfmoma.org/artwork/FC.229/$s$, $s$https://www.moma.org/artists/6246$s$, $s$SFMOMA identifies the work as part of Warhol’s Reversal Series. The hotspots focus on negative-like reversal, color misregistration, and the tension between changing presentation and fixed expression across the nine-image grid.$s$,
    $s$High$s$, false, $s$Coordinates are centered on representative panels. Confirm the chosen reversed and misregistered examples against the final crop.$s$,
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
    $s$The face turned into a negative$s$, $s$Tap one panel where the light and dark values appear reversed, making the eyes, teeth, or hair look spectral.$s$,
    $s$The Reversal Series treats a familiar celebrity photograph like a photographic negative. Recognition survives, but the image feels less stable—as though the famous face has become its own afterimage.$s$, $s$Does the reversal make Marilyn seem more alive or more ghostlike?$s$,
    18, 22, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The color that slips$s$, $s$Zoom into a face where bright color falls outside the lips, eyelids, or hairline.$s$,
    $s$The misalignment exposes the portrait as layers of printing rather than a seamless likeness. It also makes the face vibrate between human features and independent patches of color.$s$, $s$Does the slippage make the portrait feel more handmade or more manufactured?$s$,
    50, 50, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$Nine identical expressions$s$, $s$Compare the mouth and eyes across the entire grid.$s$,
    $s$Although the colors change dramatically, the underlying expression remains fixed. Variety is created around a single unchanging publicity image, suggesting how endlessly celebrity can be repackaged without granting access to the person behind it.$s$, $s$Which panel feels most emotionally different despite having the same expression?$s$,
    82, 77, true
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
    $s$Look first for a single face, then notice that the portrait will not stay single. Warhol doubles and overlaps Mapplethorpe until identity feels both intensified and unsettled.$s$, $s$Step back and decide whether the doubled image gives Mapplethorpe more presence, or turns him into a repeatable visual effect.$s$,
    $s$https://www.sfmoma.org/artwork/FC.623/$s$, $s$https://www.mapplethorpe.org/biography/$s$, $s$SFMOMA confirms Warhol’s doubled silkscreen portrait of Mapplethorpe. The hotspots distinguish the primary likeness, offset duplicate, and colored overlap where one portrait becomes an unstable composite.$s$,
    $s$High$s$, false, $s$Coordinate confidence is high if the same full portrait crop is retained.$s$,
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
    $s$The clearer first face$s$, $s$Tap the more legible face, where the eyes, nose, and mouth read most strongly.$s$,
    $s$This image anchors recognition. Because Mapplethorpe was himself a photographer deeply concerned with controlled portraiture, the clarity feels almost like a claim to authorship or self-possession.$s$, $s$Which feature makes him recognizable first?$s$,
    39, 47, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The second face slipping sideways$s$, $s$Look at the overlapping duplicate offset from the first.$s$,
    $s$The doubled image creates movement without changing the pose. It also prevents the portrait from settling into one definitive likeness; Mapplethorpe appears as both person and repeated photograph.$s$, $s$Does the second face feel like an echo, a mask, or a competing identity?$s$,
    62, 46, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The color between the faces$s$, $s$Zoom into a colored passage where the two printed images overlap.$s$,
    $s$In the overlap, color no longer simply describes skin or background. It becomes a separate layer produced by repetition, turning the space between two likenesses into the most visually active part of the portrait.$s$, $s$Is the overlap hiding the face or creating a new one?$s$,
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
    $s$Find Beuys’s face beneath the camouflage before reading the pattern as decoration. Notice which features survive clearly and which are broken apart.$s$, $s$Now look at the whole portrait. Has camouflage hidden Beuys, made him more visible, or turned his already recognizable persona into another public pattern?$s$,
    $s$https://www.sfmoma.org/artwork/FC.620/$s$, $s$https://www.moma.org/artists/6246$s$, $s$SFMOMA confirms the 1986 camouflage portrait. The hotspots focus on recognizable features surviving beneath pattern, the camouflage’s paradoxical visibility, and the mismatch between photographic anatomy and decorative overlay.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full horizontal image.$s$,
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
    $s$The eyes that survive$s$, $s$Tap Beuys’s eyes beneath the colored camouflage shapes.$s$,
    $s$Even as the pattern crosses the face, the eyes remain a strong anchor of identity. The portrait demonstrates how little information is needed for recognition to persist.$s$, $s$Why do the eyes resist camouflage better than the rest of the face?$s$,
    48, 38, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$Camouflage crossing the mouth$s$, $s$Look where a bright camouflage patch interrupts the mouth, cheek, or beard.$s$,
    $s$Camouflage is designed to break up an outline, but Warhol’s bright colors attract attention instead of concealing. The pattern both disrupts the face and advertises it.$s$, $s$Does this pattern hide Beuys or turn him into a stronger emblem?$s$,
    55, 58, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The face and pattern disagree$s$, $s$Zoom into an edge where the photographic contour of the head runs beneath a differently shaped camouflage patch.$s$,
    $s$The two systems do not align: one describes a person, while the other ignores anatomy. Their disagreement keeps the portrait from becoming naturalistic and makes identity feel constructed from competing layers.$s$, $s$Which layer seems to control the image?$s$,
    73, 43, true
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
    $s$Let the face emerge from the dark before focusing on individual features. There is no body, room, or background story—only a head suspended like an apparition.$s$, $s$Step back and ask whether this feels like self-revelation, self-protection, or the transformation of Warhol’s own face into one more celebrity icon.$s$,
    $s$https://www.sfmoma.org/artwork/FC.616/$s$, $s$https://www.tate.org.uk/art/artworks/warhol-self-portrait-t07146$s$, $s$SFMOMA confirms this late 1986 self-portrait. Tate’s discussion of Warhol’s late fright-wig portraits supports attention to the isolated head, dramatic wig, and apparition-like emergence from darkness.$s$,
    $s$High$s$, false, $s$Coordinates verified against the complete portrait.$s$,
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
    $s$The hair as an electric halo$s$, $s$Tap the spiked wig radiating around the top of the head.$s$,
    $s$The pale strands expand beyond the skull like a burst of light. They make the wig more visually commanding than the face itself and turn a familiar part of Warhol’s public appearance into an almost supernatural halo.$s$, $s$Does the hair make him look more alive or more ghostly?$s$,
    50, 20, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The eyes in darkness$s$, $s$Look at the eyes, which emerge only partly from the black surrounding field.$s$,
    $s$The darkness removes ordinary facial context and makes the gaze difficult to read. Warhol appears present, but not emotionally available.$s$, $s$Do the eyes seem to meet you or remain hidden?$s$,
    49, 43, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The face cut off at the chin$s$, $s$Tap the lower edge of the face where it fades or stops without a visible neck or body.$s$,
    $s$The missing body makes the head feel detached, like a mask floating in space. A self-portrait usually locates a person; this one makes physical presence strangely uncertain.$s$, $s$Does the floating head feel intimate or theatrical?$s$,
    50, 69, true
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
    $s$Try to find Warhol’s face before following the camouflage pattern. Then reverse the process: let the colored shapes take over until the portrait almost disappears.$s$, $s$Step back and decide whether Warhol has concealed himself or created an even more recognizable public image by staging his own disappearance.$s$,
    $s$https://www.sfmoma.org/artwork/FC.507/$s$, $s$https://www.moma.org/artists/6246$s$, $s$SFMOMA confirms the combination of Warhol’s late self-image with camouflage overlay. The hotspots isolate a surviving eye, pattern crossing the iconic wig, and a facial edge dissolving into design.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full portrait-format image.$s$,
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
    $s$The eye behind the pattern$s$, $s$Tap the eye that remains most visible beneath the camouflage.$s$,
    $s$The eye preserves the portrait even when much of the face is broken apart. Recognition survives through a small anchor rather than a complete likeness.$s$, $s$How much of the face can disappear before you stop seeing Warhol?$s$,
    45, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The camouflage over the wig$s$, $s$Look where bright camouflage shapes cross the spiky hair.$s$,
    $s$The wig is already a constructed public signature. Covering it with another pattern layers disguise over disguise, yet both remain highly recognizable.$s$, $s$Is the camouflage hiding the wig or emphasizing it?$s$,
    58, 22, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The face dissolving into design$s$, $s$Zoom into a cheek or jaw where skin, shadow, and camouflage become difficult to separate.$s$,
    $s$At this point, portrait and pattern occupy the same surface without a clear hierarchy. Warhol’s identity becomes less a face than a visual system of repeated signs.$s$, $s$Do you still read this area as part of a person?$s$,
    66, 61, true
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
    $s$Try to find a path into the forest. Each time you think one opens, notice what the paint does to block, blur, or redirect it.$s$, $s$Step back and ask whether this still feels like a forest you could enter, or a wall of paint that only borrows the idea of trees.$s$,
    $s$https://www.sfmoma.org/artwork/FC.461/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/abstracts/woods-73$s$, $s$SFMOMA confirms the 1990 oil painting. Richter’s catalogue groups it with his forest works, where recognizable verticals are repeatedly disrupted by smearing and scraping. The hotspots focus on a blocked opening, a dragged trunk, and a pale scrape.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full image. Preserve the complete width so the central gap and right-side smear remain distinct.$s$,
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
    $s$The opening that closes$s$, $s$Tap the lighter vertical gap near the center, where the darker trunks seem to part.$s$,
    $s$For a moment, the gap suggests a path or clearing. But smeared paint and crossing strokes keep it from becoming a stable route. Richter gives the eye the promise of depth, then interrupts it before the space can fully open.$s$, $s$Can your eye actually travel through this gap?$s$,
    50, 45, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The trunk turned into a smear$s$, $s$Look at a dark vertical form on the right where its edge has been dragged sideways.$s$,
    $s$The tree-like form begins as something solid, but the smear converts it back into paint. The work keeps shifting between recognizable forest and visibly manipulated surface.$s$, $s$Does the smear make the tree feel closer, or make it disappear?$s$,
    73, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The pale scrape across darkness$s$, $s$Find a light scraped passage crossing one of the darker zones.$s$,
    $s$The scrape behaves like sudden light, but it also reveals a tool moving across wet paint. What could be mist, glare, or distance is simultaneously evidence of the painting’s construction.$s$, $s$Do you read this first as light in a forest or as paint being pulled?$s$,
    29, 67, true
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
    $s$Before looking for a hidden subject, follow the largest scraped bands. Notice which colors sit on top and which survive only in narrow gaps underneath.$s$, $s$Now look at the entire surface as a history of decisions. Which areas feel newly made, and which seem buried beneath later actions?$s$,
    $s$https://www.sfmoma.org/artwork/FC.459/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/abstracts$s$, $s$SFMOMA identifies the work as a 1990 abstract painting. Richter’s official materials describe his mature abstractions as layered and repeatedly altered with a squeegee. The hotspots isolate buried color, a broad drag, and a visible stopping point.$s$,
    $s$High$s$, false, $s$Coordinates are approximate because the source image is from SFMOMA Custom Prints. Confirm against the exact museum reproduction before launch.$s$,
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
    $s$The color trapped underneath$s$, $s$Tap a bright patch visible through a break in a broader scraped layer.$s$,
    $s$This small survival gives the surface depth without conventional perspective. It feels discovered rather than simply placed, as though an earlier painting is still pushing through the later one.$s$, $s$Does the hidden color feel farther away or more intense because it is partly covered?$s$,
    28, 61, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The broad squeegee pull$s$, $s$Follow the widest dragged band across the center.$s$,
    $s$The passage records one long movement of a broad tool. It pulls several wet colors together while leaving streaks and gaps, so the image is shaped by both deliberate pressure and effects the artist could not fully predict.$s$, $s$Where can you see the drag slowing down or catching?$s$,
    54, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The abrupt edge of a scrape$s$, $s$Look where one dragged passage stops sharply against a differently colored area.$s$,
    $s$The hard stop makes the action legible. It reminds us that the work was not simply poured into existence; the artist chose when to press, pull, lift, and leave earlier layers exposed.$s$, $s$Does this edge feel accidental or carefully timed?$s$,
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
    $s$Treat the work as a window for a moment. Then notice how stubbornly it refuses to show you anything beyond itself.$s$, $s$Step back and decide whether the repeated panes create openness or turn the wall into a more elaborate barrier.$s$,
    $s$https://www.sfmoma.org/artwork/FC.738/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/photo-paintings/buildings-5$s$, $s$SFMOMA confirms the 2002 painting. The hotspots focus on the work’s repeated panes, heavy divisions, and ambiguous reflective surface, all of which frustrate the traditional idea of a window as transparent access.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full frontal image.$s$,
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
    $s$The pane that gives no view$s$, $s$Tap one of the central pale rectangles.$s$,
    $s$A window normally offers access to another space. Here, the pane gives only a muted surface, so the object keeps the architecture of looking while removing the view itself.$s$, $s$What do you expect to see through this pane?$s$,
    50, 44, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark frame dividing everything$s$, $s$Follow one of the strong vertical bars separating the panes.$s$,
    $s$The frame does more than organize the work. Its repeated divisions keep interrupting any sense of continuous space, making the window feel closer to a grid than an opening.$s$, $s$Does the frame hold the view together or prevent it from forming?$s$,
    34, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The reflected blur$s$, $s$Look at a pane where a hazy tonal shift suggests reflection without revealing a clear object.$s$,
    $s$The blurred variation activates the surface just enough to imply glass, but it withholds certainty. You become aware of looking at a barrier rather than through one.$s$, $s$Are you seeing something beyond the glass, or only the glass itself?$s$,
    72, 62, true
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
    $s$Do not try to take in all 256 squares at once. Choose one color, then watch how its neighbors change what you think you are seeing.$s$, $s$Now step back until the individual squares become a single field. Does the painting feel strictly ordered, visually noisy, or unexpectedly balanced?$s$,
    $s$https://www.sfmoma.org/artwork/FC.643/$s$, $s$https://www.glenstone.org/artworks/256-farben$s$, $s$SFMOMA explains Richter’s mathematical mixing system and random number selection for placing the colors. Glenstone confirms the 1974 work and scale. Hotspots focus on adjacency, chance pairings, and repeated hues changing through context.$s$,
    $s$High$s$, false, $s$Coordinates indicate representative grid zones rather than one unique square. Final UI should allow the marker to sit clearly inside a single cell.$s$,
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
    $s$One color changed by its neighbors$s$, $s$Choose a single square near the upper-left area and compare it with the four squares around it.$s$,
    $s$SFMOMA explains that Richter generated the colors systematically and then placed them through chance. The chosen square has no symbolic role, yet adjacency can make it appear warmer, cooler, brighter, or duller than it would alone.$s$, $s$Would this color look the same in another part of the grid?$s$,
    23, 24, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$A pairing that should clash$s$, $s$Find two neighboring squares near the center whose hues seem strongly incompatible.$s$,
    $s$The equal grid gives every pairing the same formal status, but some combinations feel louder than others. Chance produces local tensions that look intentional even though no expressive hierarchy was planned.$s$, $s$Does this pairing feel accidental once you have looked at it for a while?$s$,
    52, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The repeated color$s$, $s$Look for two squares that appear to share the same or a very similar hue in different parts of the grid.$s$,
    $s$Because there are 256 positions but fewer distinct mixed colors, some hues repeat. Each repetition changes through context, showing that color is never experienced in isolation.$s$, $s$Which version of the repeated hue seems stronger?$s$,
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
    $s$Let the painting convince you that it is a traditional seascape. Then look for the blur and smoothness that make the scene feel more like a remembered photograph than direct observation.$s$, $s$Step back again. Does the sea feel vast and sublime, or suspiciously perfect—like an image constructed from familiar landscape expectations?$s$,
    $s$https://www.sfmoma.org/artwork/FC.623/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/photo-paintings/landscapes-14$s$, $s$SFMOMA confirms the 1998 oil painting. Richter’s official catalogue places it within his photo-based landscapes. The hotspots focus on the blurred horizon, minimally articulated water, and photographic softness of the sky.$s$,
    $s$High$s$, false, $s$Coordinates verified against the complete landscape crop.$s$,
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
    $s$The horizon that almost disappears$s$, $s$Look where the dark sea meets the lighter sky.$s$,
    $s$The horizon is clear enough to organize the landscape, but soft enough to resist precision. That blur creates distance while also recalling an out-of-focus photograph.$s$, $s$Does the softened horizon make the space deeper or less trustworthy?$s$,
    50, 53, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark water without waves$s$, $s$Tap the broad low band of sea where very little individual wave detail is visible.$s$,
    $s$The lack of specific marks makes the water feel immense and still, but it also denies the texture we expect from a real sea. The image offers atmosphere more readily than information.$s$, $s$What mood are you placing into this nearly featureless water?$s$,
    39, 72, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The cloud that looks photographic$s$, $s$Look at a pale cloud passage in the upper sky where edges dissolve gradually.$s$,
    $s$Richter paints the look of photographic softness by hand. The cloud feels natural from a distance, yet close inspection reveals an image of photography rather than untouched nature.$s$, $s$At what distance does the cloud stop feeling photographic?$s$,
    70, 27, true
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
    $s$Try to recognize the man before focusing on the blur. Then notice which parts of the face remain useful for identification and which have been wiped into uncertainty.$s$, $s$Look again at the whole portrait. Does the blur make Müller feel distant, protected, anonymous, or strangely more memorable?$s$,
    $s$https://www.sfmoma.org/artwork/FC.293/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/photo-paintings/portraits$s$, $s$SFMOMA confirms this 1965 photo-painting. Richter’s official catalogue contextualizes the work among early portraits based on photographic sources. Hotspots distinguish blurred eyes, lateral smearing, and a comparatively clearer clothing edge.$s$,
    $s$High$s$, false, $s$Coordinates checked against the supplied portrait.$s$,
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
    $s$The eyes behind the blur$s$, $s$Tap the eye area, where the features remain visible but softened.$s$,
    $s$The eyes usually anchor a portrait, yet here they cannot offer a stable expression. Recognition survives, but emotional certainty does not.$s$, $s$Can you tell what Müller is feeling?$s$,
    48, 38, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The mouth smeared sideways$s$, $s$Look at the mouth and lower face where the paint appears dragged horizontally.$s$,
    $s$The smear resembles camera movement or a damaged photograph, but it is painted deliberately. It interrupts the promise that a portrait can preserve a person clearly.$s$, $s$Does the blur feel like movement, erasure, or distance?$s$,
    52, 58, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The sharper clothing edge$s$, $s$Compare the softened face with a clearer edge in the collar or jacket below.$s$,
    $s$The more definite clothing detail makes the facial uncertainty stronger. The painting gives greater stability to an external surface than to the person’s identity.$s$, $s$Why might the jacket be easier to see than the face?$s$,
    41, 77, true
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
    $s$First identify the gymnast’s pose. Then ask whether the blur helps you understand the movement or makes the body harder to locate.$s$, $s$Step back and decide whether the painting freezes an athletic instant or shows how impossible it is to stop movement cleanly.$s$,
    $s$https://www.sfmoma.org/artwork/FC.309/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/photo-paintings/sports$s$, $s$SFMOMA confirms the 1967 oil painting. Richter’s official catalogue places it among photo-based sports subjects. The hotspots focus on directional blur, dissolving bodily contour, and the contrast between moving figure and stable apparatus.$s$,
    $s$High$s$, false, $s$Coordinates are based on the supplied full image; confirm the exact apparatus location at high resolution.$s$,
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
    $s$The limb stretched into motion$s$, $s$Tap the extended arm or leg where the contour smears along the direction of movement.$s$,
    $s$The body is recognizable, but the stretched blur prevents the pose from becoming a crisp diagram. The paint gives a still image the residue of speed.$s$, $s$Does the blur make the limb feel faster or less physical?$s$,
    62, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The body losing its outline$s$, $s$Look at the torso where gray tones merge with the surrounding field.$s$,
    $s$The gymnast’s body no longer has a secure boundary. The figure seems to move not only across space but into the image itself.$s$, $s$Where exactly does the torso end?$s$,
    48, 54, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The fixed support beneath motion$s$, $s$Find the apparatus or stable structural line beside the blurred body.$s$,
    $s$The rigid support contrasts with the unstable figure. It gives the eye one fixed point against which movement can be sensed.$s$, $s$Would the body still appear to move without this stable reference?$s$,
    33, 70, true
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
    $s$Take in the reclining pose before looking closely at the face. The scene seems intimate, but the blur keeps that intimacy from turning into clear access.$s$, $s$Now step back. Does Brigid feel comfortably present in the room, or already transformed into a distant photographic memory?$s$,
    $s$https://www.sfmoma.org/artwork/FC.498/$s$, $s$https://www.gerhard-richter.com/en/art/paintings/photo-paintings/portraits$s$, $s$SFMOMA confirms the 1971 portrait of Brigid Polk. Richter’s official catalogue places it within his photo-painting practice. The hotspots focus on the softened face, comparatively legible resting hand, and interior dissolving into the same blur.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full image.$s$,
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
    $s$The face softened beyond expression$s$, $s$Tap the face, where eyes, nose, and mouth remain visible but blurred together.$s$,
    $s$The pose suggests closeness, yet the face withholds the emotional information a portrait normally promises. Physical proximity and psychological access move in opposite directions.$s$, $s$Can you read her mood with any confidence?$s$,
    60, 37, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The hand resting in place$s$, $s$Look at the clearer hand or arm resting across the reclining body.$s$,
    $s$The gesture appears casual and bodily, anchoring the image in an ordinary moment. Its relative clarity makes the face’s softness feel less like poor technique and more like a deliberate refusal of certainty.$s$, $s$Does the hand tell you more about the moment than the face does?$s$,
    43, 61, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The furniture dissolving around her$s$, $s$Look at the couch or surrounding interior where edges fade into gray.$s$,
    $s$The setting should locate the body securely, but it too becomes unstable. Figure and room share the same photographic haze, making the whole scene feel remembered rather than inhabited.$s$, $s$Does the room support her body or absorb it?$s$,
    73, 72, true
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
    $s$Begin with the fluorescent tubes as ordinary store-bought objects. Then let your attention spread outward to the colored light touching the wall and meeting in the corner.$s$, $s$Move your eyes away from the tubes and across the whole installation. Is the artwork still located on the wall, or has it expanded into the corner and the space where you are standing?$s$,
    $s$https://www.sfmoma.org/artwork/FC.416/$s$, $s$https://www.nga.gov/collection/artist-info.5365.html$s$, $s$SFMOMA confirms that the 1971 work uses red, yellow, and blue fluorescent lights and measures eight feet high. National Gallery material on Flavin supports attention to commercially available fixtures and to light altering architectural space. Hotspots separate the red cast, the mixed light in the corner, and the undisguised hardware.$s$,
    $s$High$s$, false, $s$Coordinates indicate fixture and glow zones in the installation photograph, not permanent points on a portable image object. Reconfirm them against the exact installation photograph used in the app; the colored-light overlap changes with installation conditions.$s$,
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
    $s$The red tube facing outward$s$, $s$Look at the red fluorescent tube mounted along one side, then compare its bright glass with the softer red cast spreading onto the nearby wall.$s$,
    $s$The tube itself is narrow and industrial, but the red it produces occupies a much larger area. Flavin makes one ordinary fixture behave like both an object and a source of colored atmosphere. The work cannot be understood by looking only at the hardware.$s$, $s$Where does the red light become too faint for you to call it part of the artwork?$s$,
    25, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$Yellow meeting blue$s$, $s$Tap the corner area where the yellow and blue light overlap rather than either individual tube.$s$,
    $s$The mixed zone is not contained inside any one fixture. It is created by two separate lights striking the same architecture, so the wall and corner actively produce part of what you see. The exact color can also shift as your eyes adjust and your position changes.$s$, $s$Can you find a point where the light looks neither clearly yellow nor clearly blue?$s$,
    59, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The ordinary metal end$s$, $s$Zoom in on one end of a fluorescent fixture, where the metal housing, socket, or tube cap remains plainly visible.$s$,
    $s$Flavin does not disguise the commercial equipment or make it look precious. The visible fittings keep the installation tied to offices, shops, and other everyday interiors, even while the colored glow transforms the room around them.$s$, $s$Does seeing the standard fixture weaken the effect, or make the transformation more surprising?$s$,
    49, 76, true
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
    $s$Read the arrangement first as a tiny tower: wide at the base and narrowing as it rises. Then notice that every part is still a standard fluorescent tube fixed directly to the wall.$s$, $s$Step back and compare the ambitious word “monument” with the cool, temporary-looking light. Does the work honor Tatlin’s revolutionary tower, quietly parody it, or keep both possibilities open?$s$,
    $s$https://www.sfmoma.org/artwork/FC.824/$s$, $s$https://diaart.org/collection/collection/flavin-dan-monument-for-v-tatlin-1969-1980-018$s$, $s$SFMOMA confirms the eight-foot installation in cool white fluorescent light. Dia identifies Flavin’s 1969 Tatlin works as white fluorescent tubes arranged in towerlike wall configurations. The hotspots focus on the stepped silhouette, structural gaps, and wall halo rather than treating the reference to Tatlin as a literal miniature.$s$,
    $s$High$s$, false, $s$Coordinates are based on the frontal installation photograph. The halo varies with wall color, ambient lighting, exposure, and installation, so the final hotspot should be checked in the exact app image.$s$,
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
    $s$The stepped tower outline$s$, $s$Follow the outer edges of the white tubes from the wider lower section toward the narrower top.$s$,
    $s$The stepped silhouette is enough to suggest architecture, even though no solid building exists. Flavin compresses the idea of Tatlin’s famously unbuilt tower into a flat wall arrangement made from standard lengths of light.$s$, $s$At what point does this group of rectangles begin to look like a tower?$s$,
    50, 46, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark gaps between tubes$s$, $s$Look at the narrow spaces separating the horizontal fluorescent units.$s$,
    $s$The gaps are as important as the glowing bars. They divide the light into stacked levels and make the whole structure resemble a diagram or simplified architectural elevation rather than one continuous luminous shape.$s$, $s$Would the work still feel architectural if the gaps disappeared?$s$,
    50, 57, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The white halo on the wall$s$, $s$Shift your attention just outside the fixtures, where cool white light bleeds onto the wall around the stepped form.$s$,
    $s$The glow softens the supposedly precise tower. Its edges extend beyond the metal housings and become impossible to measure exactly, so a rigid-looking monument is surrounded by something diffuse and temporary.$s$, $s$Does the halo make the tower feel more solid or less material?$s$,
    72, 41, true
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
    $s$Begin far enough away for Agnes Martin’s face to feel whole. Then move closer until the portrait breaks into hundreds of separate colored cells.$s$, $s$Step back once more. Does Agnes now seem like a stable person in front of you, or an image your eye keeps rebuilding from fragments?$s$,
    $s$https://www.sfmoma.org/artwork/FC.626/$s$, $s$https://www.pacegallery.com/artists/chuck-close/$s$, $s$SFMOMA confirms the monumental 1998 oil painting. Pace describes Close’s method of translating photographs into gridded visual data. The hotspots focus on the eye emerging from cells, unexpected colors building skin, and the portrait edge forming without a continuous outline.$s$,
    $s$High$s$, false, $s$Coordinates are based on the full portrait image. Confirm the exact left-eye and cheek positions against the app crop.$s$,
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
    $s$The eye made from small paintings$s$, $s$Tap Agnes’s left eye and look at the grid cells that build the eyelid, iris, and surrounding shadow.$s$,
    $s$Up close, no single cell contains an eye. Each one holds loops, ovals, and patches of color that behave like tiny abstract paintings. The eye appears only when your vision combines them across distance.$s$, $s$At what distance does the eye become recognizable?$s$,
    39, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The cheek changing color$s$, $s$Look at the broad cheek area where neighboring cells move through pink, blue, green, violet, and ocher.$s$,
    $s$Close does not mix one continuous flesh tone. He lets separate colors create the sensation of skin through contrast and accumulation. A cool blue cell can contribute to a warm, living face when seen from farther away.$s$, $s$Which color looks least like skin up close but still works from a distance?$s$,
    61, 57, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The face dissolving at the edge$s$, $s$Follow the outer edge of the hair and cheek where the portrait meets the darker background.$s$,
    $s$There is no single clean contour around Agnes. Her outline emerges gradually as cells shift in value and color, so the boundary between person and background is something the eye constructs rather than a line the artist simply draws.$s$, $s$Where exactly does Agnes end and the background begin?$s$,
    76, 52, true
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
    $s$Look at this not as a smaller finished portrait, but as a working map. The photograph, grid, tape, and handwritten decisions show how Agnes was converted into a problem that could be solved cell by cell.$s$, $s$Now compare the maquette mentally with the large painting. Does seeing the planning make the finished portrait feel more mechanical, or reveal how many individual choices it required?$s$,
    $s$https://www.sfmoma.org/artwork/FC.625/$s$, $s$https://www.pacegallery.com/exhibitions/chuck-close-on-paper/$s$, $s$SFMOMA identifies the maquette as Polaroid, ink, graphite, and masking tape on foamcore. Pace explains Close’s use of a grid to map photographic details before recreating them. The hotspots isolate the grid’s indifference to facial hierarchy, the assembled photograph, and visible studio notation.$s$,
    $s$High$s$, false, $s$Coordinates are approximate because small working marks may be difficult to read in the production image. Use the highest-resolution scan available.$s$,
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
    $s$The grid crossing the eye$s$, $s$Tap the eye area where the drawn grid cuts directly through the photograph.$s$,
    $s$The grid deliberately ignores the importance of the eye. It divides a psychologically charged feature into the same equal units used for forehead, hair, and background. Close turns likeness into a sequence of local tasks rather than painting the face as one expressive whole.$s$, $s$Does the eye remain emotionally powerful after it has been divided into boxes?$s$,
    40, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The taped-together photograph$s$, $s$Look at a seam or strip of masking tape joining sections of the large Polaroid image.$s$,
    $s$The source image is visibly assembled rather than presented as a seamless photograph. The tape reveals that even the supposedly direct photographic starting point is a constructed object with joins, edges, and practical adjustments.$s$, $s$Does the visible assembly make the photograph feel less objective?$s$,
    51, 56, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The handwritten working marks$s$, $s$Zoom into a margin or grid area containing graphite, ink, numbers, or small studio annotations.$s$,
    $s$These marks belong to the process rather than the portrait’s public appearance. They record measurement, orientation, and planning—the quiet administrative work behind a painting that later seems visually overwhelming.$s$, $s$Which mark seems intended for the artist rather than the viewer?$s$,
    74, 77, true
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
    $s$Recognize Roy Lichtenstein’s face first, then move closer until his glasses, skin, and hair become networks of separate abstract marks.$s$, $s$Step back and ask what makes Roy recognizable. Is it a few key features such as the glasses and mouth, or the combined rhythm of every cell?$s$,
    $s$https://www.sfmoma.org/artwork/FC.697/$s$, $s$https://www.pacegallery.com/artists/chuck-close/$s$, $s$SFMOMA confirms the 1994 monumental oil portrait. Pace describes Close’s gridded translation of photographic subjects into visual data. The hotspots focus on the glasses as a recognizable anchor, a locally abstract skin cell, and the mouth emerging across multiple units.$s$,
    $s$High$s$, false, $s$Coordinates should be checked against the complete frontal reproduction, especially if the image includes frame or wall margins.$s$,
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
    $s$The glasses holding the face together$s$, $s$Tap the dark frame around one eye.$s$,
    $s$The glasses provide some of the portrait’s clearest, most continuous structure. Against the looser colored cells of the skin, the dark frames anchor the face and help recognition survive even when nearby marks become abstract.$s$, $s$Would the portrait be as immediately recognizable without the glasses?$s$,
    40, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$A cell that looks nothing like skin$s$, $s$Zoom into a single cheek or forehead cell containing rings, lozenges, or several sharply different colors.$s$,
    $s$Seen alone, the cell does not imitate skin at all. Its role becomes clear only within the larger system, where color and value matter more than literal resemblance. Close lets abstraction produce likeness rather than interrupt it.$s$, $s$Can you hold onto the face while looking only at this cell?$s$,
    61, 55, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The mouth assembled from fragments$s$, $s$Look at the lips and the shadow around them, then separate the area into its individual grid units.$s$,
    $s$The expression appears continuous from a distance, but each cell is independently painted. The mouth demonstrates how an emotionally readable feature can emerge from marks that do not themselves express anything.$s$, $s$At what point do the separate marks become an expression?$s$,
    50, 69, true
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
    $s$Treat this as the portrait before it became a painting. Look for the places where a familiar face has been turned into measurements, taped sections, and manageable units.$s$, $s$Now imagine translating every square into the much larger painting. Does the maquette make the process feel repetitive, inventive, or both at once?$s$,
    $s$https://www.sfmoma.org/artwork/FC.844/$s$, $s$https://www.pacegallery.com/exhibitions/chuck-close-on-paper/$s$, $s$SFMOMA confirms the materials: color Polaroid, ink, graphite, and masking tape on foamcore. Pace describes Close’s grid-based mapping process. The hotspots focus on the grid breaking a signature feature, the assembled photographic seam, and the practical working margin.$s$,
    $s$High$s$, false, $s$The small seam and margin details require a high-resolution image. Coordinates are reasonable but should be manually verified.$s$,
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
    $s$The grid through the glasses$s$, $s$Tap where the graphite grid cuts across Roy’s eyeglass frame and eye.$s$,
    $s$The glasses are one of Roy’s most recognizable features, but the grid refuses to preserve them as a single shape. It breaks the frame into small segments that must later be reconstructed one cell at a time.$s$, $s$Does the grid weaken the glasses as a symbol, or make their structure easier to understand?$s$,
    40, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The seam across the face$s$, $s$Look for a taped join where separate Polaroid sections meet across the head or background.$s$,
    $s$The seam reveals that the source photograph itself was built from multiple instant photographs. The face appears unified only because the viewer mentally repairs the join.$s$, $s$How quickly does your eye ignore the seam?$s$,
    52, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The margin used as a workspace$s$, $s$Look beyond the face at the foamcore edge, tape, or graphite marks that remain visible around the photograph.$s$,
    $s$The unused-looking margin preserves the object’s studio function. Unlike the finished painting, this work still shows where the image was handled, aligned, and prepared for translation.$s$, $s$Which part feels most like a tool rather than a portrait?$s$,
    79, 76, true
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
    $s$Start far enough away to see John Chamberlain’s face clearly. Then move closer and remember that this is not paint: the portrait was built through 126 separate screenprinted colors.$s$, $s$Step back after inspecting the print closely. Does the mechanical process make John feel less personal, or does the accumulation of so many impressions create a different kind of intimacy?$s$,
    $s$https://www.sfmoma.org/artwork/FC.615/$s$, $s$https://www.pacegallery.com/artists/chuck-close/$s$, $s$SFMOMA confirms that John is a 126-color screenprint. Pace describes Close’s broader use of gridded photographic information across painting and printmaking. The hotspots focus on layered registration in the eye, overlapping transparent colors within a cell, and the rigid grid producing apparent facial volume.$s$,
    $s$High$s$, false, $s$Coordinates checked against the full portrait. Fine registration details require the largest image available in the app.$s$,
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
    $s$The eye built through many passes$s$, $s$Tap one eye and inspect the overlapping colors that form its lid, shadow, and highlight.$s$,
    $s$Each color in the print required a separate screen and impression. The eye therefore appears not through one continuous gesture but through many precisely registered layers. Recognition is the result of accumulated process.$s$, $s$Can you tell which printed color seems to sit on top?$s$,
    40, 39, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The color slipping inside one cell$s$, $s$Zoom into a cheek or forehead cell where several translucent colors overlap without aligning into one simple shape.$s$,
    $s$The individual layers remain partly visible instead of blending like wet paint. Their overlap produces new colors while preserving evidence of sequence, making one cell feel like a record of multiple printing decisions.$s$, $s$Does the cell feel planned in advance or discovered through layering?$s$,
    61, 53, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The hard grid beneath the soft face$s$, $s$Look for the straight boundaries separating neighboring units around the cheek or jaw.$s$,
    $s$The grid is rigid and mathematical, yet the face it produces feels rounded and organic from a distance. The portrait depends on a contradiction: soft flesh emerging from a structure that never bends.$s$, $s$When do you stop seeing the grid and start seeing volume?$s$,
    70, 66, true
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
    $s$Before trying to understand the shape, notice how the two steel plates alter the corner. One seems to stand, the other to cut across it, so the architecture no longer feels neutral.$s$, $s$Walk your eyes around the whole arrangement again. Does the sculpture occupy the corner, brace it, divide it, or make the corner itself feel newly unstable?$s$,
    $s$https://www.sfmoma.org/artwork/FC.276.A-B/$s$, $s$https://www.gagosian.com/artists/richard-serra/$s$, $s$SFMOMA confirms the two-part weathering-steel construction. Gagosian’s overview of Serra supports attention to weight, bodily movement, and the way steel changes architectural space. The hotspots isolate the contact seam, the projecting diagonal, and the weathered surface.$s$,
    $s$High$s$, false, $s$Coordinates are tied to the supplied installation view. Reconfirm if the app uses a different angle, since the seam and projecting plate shift substantially with viewpoint.$s$,
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
    $s$The seam where plates nearly meet$s$, $s$Tap the narrow meeting point between the two steel plates near the corner.$s$,
    $s$The joint does not look like a neat architectural connection. It feels tense and provisional, because each plate keeps its own angle and weight. The sculpture’s logic becomes clearest here: stability is produced by relation, not by one self-contained object.$s$, $s$Does this contact point feel secure, or does it make you imagine the plates shifting?$s$,
    51, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The plate leaning into space$s$, $s$Follow the angled plate that projects away from the wall.$s$,
    $s$Its diagonal changes the room more strongly than a flat wall-mounted object would. As the plate advances into your path, viewing becomes bodily: you must judge distance, clearance, and weight rather than simply look from one fixed position.$s$, $s$At what point does the plate stop feeling like an image and start feeling like an obstacle?$s$,
    67, 58, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The weathered steel skin$s$, $s$Zoom into a broad area of rust-colored surface where streaks, discoloration, or mill marks remain visible.$s$,
    $s$The steel is not polished into a neutral finish. Its surface carries industrial production, oxidation, and time. Those marks make the sculpture feel less like ideal geometry and more like a massive material object with a history.$s$, $s$Does the weathering make the plate feel older, heavier, or more vulnerable?$s$,
    29, 39, true
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
    $s$Look at the four lead plates as a structure before thinking about the title. None is bolted or welded, so the apparent box depends entirely on leaning, pressure, and mutual support.$s$, $s$Step back and consider the contradiction: the sculpture is extremely heavy, yet its arrangement feels temporary. Does that make it seem more stable or more precarious?$s$,
    $s$https://www.sfmoma.org/artwork/FC.439.A-D/$s$, $s$https://www.moma.org/collection/works/81291$s$, $s$SFMOMA confirms the four lead-plate construction. MoMA discusses House of Cards as an early Serra prop work held together by gravity and mutual pressure rather than permanent fasteners. The hotspots focus on contact, enclosed void, and weight transferred to the floor.$s$,
    $s$High$s$, false, $s$Coordinates are based on the supplied oblique installation view. The interior and contact points must be rechecked if another view is used.$s$,
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
    $s$The corner held by pressure$s$, $s$Tap one upper contact where two lead plates lean into one another.$s$,
    $s$This point carries more than visual importance. Friction and gravity hold the plates together, so a small area of contact is responsible for the stability of an enormous weight. The sculpture makes invisible forces legible.$s$, $s$Can you tell which plate is supporting which?$s$,
    50, 34, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The dark interior$s$, $s$Look into the shadowed open space enclosed by the four leaning plates.$s$,
    $s$The void is not simply leftover space. Its shape is produced by the pressure of the surrounding lead, making emptiness feel compressed and physically charged. The title suggests a house, but this is an interior no one could comfortably inhabit.$s$, $s$Does the opening invite you in or warn you away?$s$,
    51, 60, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The bottom edge bearing down$s$, $s$Follow one thick lower edge where a plate meets the floor.$s$,
    $s$The floor is not a pedestal beneath the sculpture; it is part of the structural system. The broad edge makes the plate’s weight almost palpable and directs attention to the downward force that keeps the arrangement in place.$s$, $s$Can you feel the pressure on the floor just by looking?$s$,
    30, 81, true
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
    $s$Read the repeated lead forms along the wall as doors for a moment. Then notice everything they refuse to do: they do not stand upright, open, frame a passage, or lead anywhere.$s$, $s$Look across the row again. Does the title make these forms feel more architectural, or emphasize how completely they have abandoned the function of doors?$s$,
    $s$https://www.sfmoma.org/artwork/94.454.A-D/$s$, $s$https://www.gagosian.com/artists/richard-serra/$s$, $s$SFMOMA confirms the repeated lead units from 1966–67. Serra’s broader materials practice supports attention to lead’s weight, softness, folding, and relation to architecture. The hotspots isolate one folded unit, the measured gaps, and the forms’ low contact with wall and floor.$s$,
    $s$High$s$, false, $s$Coordinates are based on the full installation image. Preserve the complete row so repetition and spacing remain visible.$s$,
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
    $s$The first folded unit$s$, $s$Tap the leftmost lead form where one plane bends or folds away from another.$s$,
    $s$The fold suggests the basic action of a hinged door, but the heavy lead lies low and inert. Serra reduces a familiar architectural object to weight, angle, and material without preserving its usefulness.$s$, $s$Does the fold still make you imagine movement?$s$,
    18, 61, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The repeated gaps$s$, $s$Look at the narrow wall spaces separating one lead unit from the next.$s$,
    $s$The intervals create a measured rhythm across the installation. Because the objects repeat with slight changes, the eye begins comparing them like variations rather than reading one continuous barrier.$s$, $s$Which gap feels widest, and does that change the rhythm?$s$,
    51, 54, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The lead slumped against the wall$s$, $s$Zoom into a place where a form rests directly against the wall or floor.$s$,
    $s$Lead appears solid, but it is also soft enough to bend and sag. The contact makes the forms feel heavy and bodily, as if they have collapsed rather than been carefully installed.$s$, $s$Do these forms seem placed, folded, or exhausted?$s$,
    77, 70, true
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
    $s$Identify the plate and pole first, then work out what each is doing. The sculpture looks simple because every structural relationship is exposed rather than hidden.$s$, $s$Step back and ask where the work’s tension lives. Is it in the heavy plate, the angled pole, the contact point, or your knowledge that the arrangement depends on all three?$s$,
    $s$https://www.sfmoma.org/artwork/94.451.A-B/$s$, $s$https://www.moma.org/artists/5349$s$, $s$SFMOMA confirms the two-part lead construction. MoMA’s overview of Serra’s prop works supports the interpretation of exposed balance, gravity, and architectural dependency. The hotspots focus on the pressure point, the diagonal prop, and the wall as structural participant.$s$,
    $s$High$s$, false, $s$Coordinates apply to the supplied installation view. A different camera angle would significantly alter all three hotspot positions.$s$,
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
    $s$The pole pressing the plate$s$, $s$Tap the point where the angled pole makes contact with the lead plate.$s$,
    $s$There is no bracket or bolt securing the connection. Pressure itself is the fastener. The entire arrangement depends on this small point continuing to bear force.$s$, $s$What would happen if the pole shifted even slightly?$s$,
    55, 37, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The diagonal carrying force$s$, $s$Follow the pole from the floor upward to the plate.$s$,
    $s$The diagonal makes force visible. Instead of disappearing inside a wall like a hidden support beam, the prop announces exactly how the plate is being held in place.$s$, $s$Can you sense which direction the pressure is traveling?$s$,
    46, 60, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The plate against the wall$s$, $s$Look at the broad lead sheet where it meets the vertical architecture.$s$,
    $s$The wall is not merely a background. It receives the pressure transmitted through the plate and becomes a necessary component of the sculpture. Without this exact architectural relationship, the work would not exist in the same way.$s$, $s$Is the sculpture attached to the room, or is the room part of the sculpture?$s$,
    73, 48, true
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
    $s$Read the sentence first. Then stop reading it and look at how the black paintstick presses across the paper as a physical mass.$s$, $s$Step back and ask what gives the work its force: the political claim, the scale of the words, the density of the black surface, or the way all three refuse to separate?$s$,
    $s$https://www.sfmoma.org/artwork/94.449/$s$, $s$https://www.moma.org/artists/5349$s$, $s$SFMOMA confirms the 1989 paintstick-on-paper drawing and its politically explicit title. MoMA’s overview of Serra’s drawings supports attention to dense black material as weight rather than mere tone. The hotspots distinguish institution-naming language, near-obscured legibility, and the rough physical edge of the paintstick.$s$,
    $s$High$s$, false, $s$Coordinates are based on the supplied full drawing. Confirm the exact placement of the word 'COURTS' if the app image includes a wider mat or frame.$s$,
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
    $s$The word 'Courts'$s$, $s$Tap the large word “COURTS” within the sentence.$s$,
    $s$The word names the institution being accused, but it is not presented in neutral print. Its scale and rough black material make the term feel heavy, blunt, and already implicated before the sentence is fully read.$s$, $s$Does the word feel like evidence, accusation, or verdict?$s$,
    39, 38, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The sentence crowded by black$s$, $s$Look where the letters press tightly against the surrounding black paintstick.$s$,
    $s$The text remains legible, but it is nearly swallowed by the same dense material that carries it. Reading becomes an effort, which makes the political statement feel obstructed rather than calmly delivered.$s$, $s$Does the black field strengthen the message or make it harder to access?$s$,
    61, 57, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The rough paintstick edge$s$, $s$Zoom into an outer edge or irregular passage where the black material shows streaks, clumps, or uneven pressure.$s$,
    $s$The drawing is not simply typography enlarged on paper. The paintstick leaves a thick, resistant surface, so language becomes bodily and abrasive. The claim arrives as something pushed and rubbed into place.$s$, $s$Would the sentence feel as forceful if it were printed cleanly?$s$,
    78, 76, true
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
    $s$Choose one dark line and follow it as far as you can. Do not worry if you lose it—notice where another line takes over, crosses it, or leaves a pocket of yellow between them.$s$, $s$Now step back and see the painting as a group rather than a tangle. Do the lines feel like separate voices moving together, or one structure that keeps dividing into different paths?$s$,
    $s$https://www.sfmoma.org/artwork/FC.516/$s$, $s$https://gagosian.com/artists/brice-marden/$s$, $s$SFMOMA describes The Sisters as a dynamic tangle of colored lines weaving, bobbing, and coiling across a sunny yellow ground while leaving that ground visible between them. Gagosian characterizes Marden’s mature work through intuitive calligraphic gesture. The hotspots focus on an almost-closed loop, a charged near-contact, and a line continuing toward the edge.$s$,
    $s$High$s$, false, $s$Coordinates are based on the full official image. Confirm the exact near-contact point at high resolution before launch.$s$,
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
    $s$The loop that nearly closes$s$, $s$Tap the large dark loop near the upper center, where the line curves back toward itself but leaves a narrow opening.$s$,
    $s$The almost-closed shape gives the eye the satisfaction of a form without fully sealing it off. Because the gap remains, the yellow ground continues to flow through the loop, keeping the line from becoming a fixed object.$s$, $s$Does the small opening make the loop feel unfinished, or more alive?$s$,
    52, 28, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$Two lines passing without touching$s$, $s$Look just left of center for a narrow yellow gap between two dark lines that run close together.$s$,
    $s$The tension comes from near-contact rather than collision. The lines seem aware of one another, yet each preserves its own path. That small interval makes the empty yellow space feel as active as the painted marks.$s$, $s$Would the relationship feel calmer or more final if the lines actually touched?$s$,
    38, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The line turning at the edge$s$, $s$Follow a dark line toward the lower-right edge, where it bends sharply or disappears beyond the canvas.$s$,
    $s$The line does not treat the edge as a place to conclude neatly. It arrives with momentum and seems capable of continuing outside the painting, making the visible network feel like one section of something larger.$s$, $s$What kind of path do you imagine continuing beyond the edge?$s$,
    80, 77, true
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
    $s$Let the dark gray-green field register first. Then follow the heavier bands slowly, as if they were writing carved into stone but stripped of readable words.$s$, $s$Step back and ask whether the painting feels mournful because of the title, or whether the weight, pace, and color of the lines already create that mood on their own.$s$,
    $s$https://www.sfmoma.org/artwork/FC.579/$s$, $s$https://matthewmarks.com/exhibitions/brice-marden-two-new-paintings-with-five-chinese-tang-dynasty-stone-epitaphs-05-1997$s$, $s$SFMOMA confirms the 1996–97 oil-on-linen painting. Matthew Marks documents its original presentation alongside five Chinese Tang dynasty stone epitaphs, supporting a careful connection between the title, stone-like ground, and inscription-like linear structure without claiming the bands form readable text. The hotspots isolate the muted yellow line, a central crossing, and an active gray interval.$s$,
    $s$High$s$, false, $s$Coordinates are based on the supplied full image. The yellow band and central knot should be verified against the highest-resolution version because the palette is deliberately subdued.$s$,
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
    $s$The yellow line under pressure$s$, $s$Tap the muted yellow-green band near the upper half, where it threads between darker gray and black lines.$s$,
    $s$The color is not bright enough to become a cheerful accent. It feels slightly sour and constrained by the heavier bands around it, introducing a weak pulse of light into an otherwise grave surface.$s$, $s$Does this yellow line offer relief, or make the surrounding darkness feel heavier?$s$,
    56, 31, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The knot of dark crossings$s$, $s$Look near the center where several thick lines overlap or press tightly past one another.$s$,
    $s$The crossings create a dense visual weight, as if several paths have accumulated in one place. Yet the lines do not merge into one solid mass; each remains partly traceable, so the painting holds compression and independence together.$s$, $s$Can you still follow one line through the knot?$s$,
    51, 52, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The gray ground between bands$s$, $s$Focus on a quiet gray-green pocket enclosed by several dark curves in the lower-left area.$s$,
    $s$The ground can resemble stone, but it is not passive background. The lines carve it into uneven spaces that feel held, compressed, or briefly opened. In a painting titled *Epitaph*, the empty interval can feel like a pause in language.$s$, $s$Does this space feel silent, enclosed, or still moving?$s$,
    28, 72, true
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
    $s$Let the title suggest a field, but do not search for stalks. Instead, look for how repeated marks gather, separate, and begin to feel abundant without becoming a literal landscape.$s$, $s$Step back and ask whether the painting now feels empty or full. Has the title helped you see wheat, or only made you more aware of repetition and growth?$s$,
    $s$https://www.sfmoma.org/artwork/FC.787/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$SFMOMA’s Agnes Martin material notes that her rare titled works, including Wheat, refer to natural phenomena without becoming traditional landscapes. The hotspots focus on visible changes in density, open intervals, and continuation at the edge rather than claiming literal stalks.$s$,
    $s$High$s$, false, $s$Coordinates are based on the full official reproduction. Because the changes are subtle, verify all three targets against the highest-resolution image before launch.$s$,
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
    $s$The denser vertical band$s$, $s$Look near the center-left for a passage where the repeated marks stand closer together and feel darker than the surrounding field.$s$,
    $s$The slight increase in density creates the sense of something gathering without outlining a recognizable object. A tiny change in spacing is enough to make one area feel more fertile, crowded, or active than another.$s$, $s$How much does the mood change when the marks move only slightly closer together?$s$,
    34, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The quieter strip beside it$s$, $s$Tap a paler, more open passage immediately beside one of the denser bands.$s$,
    $s$This interval gives the eye room to compare rather than simply count marks. The painting’s rhythm depends on alternation between concentration and release, much as a field can appear different when wind passes through it.$s$, $s$Does this lighter strip feel empty, or like a pause inside something continuous?$s$,
    57, 49, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The pattern meeting the edge$s$, $s$Look where the repeated structure reaches the right edge of the canvas.$s$,
    $s$The painting ends physically, but the pattern does not arrive at a visual conclusion. It seems capable of continuing, which makes the canvas feel like one selected portion of a much larger field.$s$, $s$Do you imagine the pattern stopping here or extending beyond the frame?$s$,
    84, 50, true
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
    $s$Give your eyes time to adjust before looking for a focal point. Follow one faint graphite line and notice every small place where it wavers, fades, or changes pressure.$s$, $s$Now see the entire grid again. Does it feel strict because it is measured, or gentle because the hand never becomes perfectly mechanical?$s$,
    $s$https://www.sfmoma.org/artwork/FC.788/$s$, $s$https://www.metmuseum.org/art/collection/search/483560$s$, $s$SFMOMA confirms the use of gesso, graphite, and ink on linen. The Met’s discussion of Martin’s hand-drawn geometry supports attention to lines that tremble and stutter rather than behaving like machine ruling. The hotspots isolate line variation, a central crossing, and an imperfect edge termination.$s$,
    $s$High$s$, false, $s$Coordinates indicate subtle features rather than bold motifs. Final manual verification at full resolution is essential.$s$,
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
    $s$The line that trembles$s$, $s$Tap a horizontal graphite line near the upper third and follow it across the canvas.$s$,
    $s$The line appears orderly from a distance, but close looking reveals tiny changes in pressure and direction. Martin’s grid is controlled without being machine-perfect, so calm emerges from sustained human attention rather than flawless geometry.$s$, $s$Where does the line first stop looking perfectly straight?$s$,
    50, 32, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$One crossing in the grid$s$, $s$Look at an intersection near the center where a horizontal and vertical line meet.$s$,
    $s$The crossing is extremely simple, yet the entire painting depends on thousands of relationships like this one. No intersection becomes a dramatic focal point; meaning accumulates through equality and repetition.$s$, $s$Does this crossing feel important on its own, or only because it belongs to the whole?$s$,
    51, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The grid stopping short$s$, $s$Look near an outer edge where a graphite line ends just before, or meets, the boundary.$s$,
    $s$The slight irregularity makes the grid feel made rather than imposed. The edge reveals how carefully the structure was brought into relation with the physical canvas.$s$, $s$Does the small gap disturb the order or make it more believable?$s$,
    82, 73, true
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
    $s$Do not expect a summer scene. Let the pale warmth reach you slowly, then notice how the grid holds that warmth in measured intervals rather than letting it spread freely.$s$, $s$Step back and ask what remains of summer when scenery, people, and weather are removed. Is it color, rhythm, lightness, or simply a passing feeling?$s$,
    $s$https://www.sfmoma.org/artwork/FC.691/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$SFMOMA’s artist material emphasizes Martin’s use of natural titles without traditional depiction. The hotspot choices focus on slow-emerging warmth, subtle variation in hand-drawn pressure, and the grid’s continuation against the physical edge.$s$,
    $s$High$s$, false, $s$The color differences are delicate and may change with screen calibration. Confirm the selected warm cell and graphite crossing in the exact app image.$s$,
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
    $s$The warm square that appears late$s$, $s$Choose a pale square near the upper center that begins to look warmer only after several seconds.$s$,
    $s$The color is so restrained that perception happens gradually. What first looks almost white can shift toward cream, peach, or yellow through comparison with neighboring cells.$s$, $s$Did the color change, or did your eyes become more sensitive?$s$,
    52, 29, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The darker graphite crossing$s$, $s$Look at a crossing slightly below center where the graphite appears a little darker or more firmly pressed.$s$,
    $s$This tiny increase in pressure interrupts the painting’s near-uniform calm. It reminds us that the grid was repeatedly drawn by hand and that variation can enter even the most disciplined structure.$s$, $s$Does this darker crossing become a focal point once you notice it?$s$,
    47, 58, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The rhythm at the lower edge$s$, $s$Follow the final row of cells along the bottom.$s$,
    $s$The repeated intervals create a steady cadence, but the boundary ends the rhythm abruptly. The title’s word “drift” becomes visible here: the pattern feels continuous even as the canvas cuts it off.$s$, $s$Does the last row feel complete, or like one moment in an ongoing sequence?$s$,
    50, 84, true
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
    $s$Let the dark blue field register before searching for the grid. Then move closer until faint lines and flashes of gold begin to rise from the surface.$s$, $s$Step back and ask whether the title has turned the grid into water for you. Does the painting feel like a sea at night, or like darkness organized into a quiet visual rhythm?$s$,
    $s$https://www.sfmoma.org/artwork/FC.459/$s$, $s$https://www.sfmoma.org/read/angles-on-agnes/$s$, $s$SFMOMA confirms the unusual combination of crayon, gold leaf, and oil on linen. Its Agnes Martin gallery material highlights Night Sea as a central work. The hotspots distinguish reflective gold, materially varied darkness, and a hand-drawn line meeting the edge.$s$,
    $s$High$s$, false, $s$Gold-leaf visibility changes with lighting and photography. Hotspot 1 must be checked against the exact reproduction and may be more effective with an installation image or alternate-light view.$s$,
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
    $s$The gold line catching light$s$, $s$Tap one thin gold-leaf line near the upper half and shift your viewing angle slightly.$s$,
    $s$The line can brighten or recede depending on the light and your position. It behaves less like a fixed painted stripe than a reflection on dark water—present, then suddenly difficult to see.$s$, $s$Does the line seem to move when you move?$s$,
    51, 35, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The blue-black interval$s$, $s$Look between two horizontal lines where the dark field seems almost empty.$s$,
    $s$The interval is not one uniform blue. Oil, crayon, and the linen surface create small changes in tone and texture, so the darkness feels layered rather than flat.$s$, $s$How many different blues or blacks can you find in this narrow band?$s$,
    50, 55, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The imperfect meeting at the edge$s$, $s$Follow a horizontal line toward the left edge, where it ends or meets the border unevenly.$s$,
    $s$The slight irregularity keeps the grid from becoming an impersonal system. The line carries the scale of a hand moving across six feet of linen, with each tiny variation preserved.$s$, $s$Does the uneven ending make the work feel more fragile?$s$,
    15, 68, true
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
    $s$Compare two neighboring horizontal bands before trying to see the whole painting. They may look identical at first, but their colors and widths begin to separate with time.$s$, $s$Now step back until the bands merge into one atmosphere. Does the painting feel repetitive, or does repetition make small differences unusually vivid?$s$,
    $s$https://www.sfmoma.org/artwork/FC.711/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$SFMOMA confirms acrylic paint, colored pencil, and gesso on linen. The hotspots distinguish subtle temperature difference, the soft pencil divider, and variation within an apparently uniform band.$s$,
    $s$High$s$, false, $s$Color-based coordinates are sensitive to reproduction and display settings. Confirm the cooler band in the production image.$s$,
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
    $s$The band that leans cooler$s$, $s$Tap a pale band near the upper third that appears slightly bluer or grayer than the band beneath it.$s$,
    $s$The difference is modest, but the painting gives it room to matter. Because no bold shape competes for attention, a small temperature shift can change the emotional character of an entire section.$s$, $s$Would you have noticed this color outside such a quiet painting?$s$,
    50, 31, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The pencil boundary$s$, $s$Zoom into the thin colored-pencil line separating two central bands.$s$,
    $s$The line organizes the surface without acting like a heavy border. Its softness allows the bands to remain related even as it measures the interval between them.$s$, $s$Does the line divide the colors or help them speak to each other?$s$,
    50, 51, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The band that changes near the edge$s$, $s$Follow one horizontal stripe toward the far right, looking for slight variation in application or tone.$s$,
    $s$The band is not an industrial strip laid down with perfect uniformity. Small shifts in the acrylic reveal process and keep repetition from becoming sterile.$s$, $s$Where does the band feel most visibly handmade?$s$,
    82, 68, true
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
    $s$Let your breathing slow to the pace of the bands. Instead of searching for the most important stripe, notice how each one depends on the intervals above and below it.$s$, $s$Step back and see whether the painting now feels still. Are the bands resting in place, or does your eye continue moving gently up and down between them?$s$,
    $s$https://www.sfmoma.org/artwork/FC.305/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$SFMOMA confirms the 1988 acrylic-and-graphite medium. The hotspots focus on perceived rather than literal interval width, a graphite divider losing strength, and a pale upper band becoming visible through comparison.$s$,
    $s$High$s$, false, $s$Subtle colors and line fading require high-resolution display and careful calibration. Coordinates should be checked on the final device.$s$,
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
    $s$The widest-looking interval$s$, $s$Compare the spaces around the center and choose the one that appears widest, even if the measurement is nearly the same.$s$,
    $s$Perceived width changes with color and neighboring lines. A pale interval can feel more expansive than a darker one, showing that measurement and experience are not identical.$s$, $s$Is this band truly wider, or does its color make it seem that way?$s$,
    50, 48, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The graphite line that fades$s$, $s$Follow a central graphite divider until it becomes faint or nearly disappears.$s$,
    $s$The weakening line keeps the structure open. It measures without fully enclosing, allowing adjacent bands to remain visually connected.$s$, $s$Does the fading line create calm or uncertainty?$s$,
    67, 56, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The pale band near the top$s$, $s$Look at one of the highest bands, where the acrylic color approaches the surrounding lightness.$s$,
    $s$This nearly disappearing color asks for sustained attention. The band becomes visible through comparison rather than contrast, so seeing it feels gradual and participatory.$s$, $s$How long did it take before this band separated from the one beside it?$s$,
    51, 18, true
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
    $s$Take in the pastel bands without naming their colors too quickly. Let the pinks, blues, yellows, and whites shift as they sit beside one another.$s$, $s$Now step back and ask what kind of feeling the painting creates without showing any event. Does its lightness feel joyful, delicate, distant, or more complicated than those words?$s$,
    $s$https://www.sfmoma.org/artwork/FC.549/$s$, $s$https://www.sfmoma.org/artist/Agnes_Martin/$s$, $s$SFMOMA confirms the 1995 acrylic-and-graphite painting. The hotspots focus on interaction between pastel neighbors, a delicate graphite divider, and a nearly white stripe that becomes visible only through sustained comparison.$s$,
    $s$High$s$, false, $s$Coordinates are representative. Pastel differences can shift substantially by screen and photograph; manually verify the selected bands in the app image.$s$,
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
    $s$The pink band changing beside blue$s$, $s$Tap a pale pink stripe near the upper half and compare it with the cooler band directly beside it.$s$,
    $s$The pink seems warmer because of the blue nearby, while the blue may appear clearer because of the pink. Martin lets emotion emerge through relationships between restrained colors rather than one dramatic hue.$s$, $s$Which band changes more because of its neighbor?$s$,
    50, 34, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 2::int,
    $s$The graphite line still visible$s$, $s$Zoom into one thin graphite divider crossing the pastel surface.$s$,
    $s$The line prevents the colors from dissolving completely into one another, but it remains too delicate to dominate them. Structure and softness coexist.$s$, $s$Does the line make the colors feel more separate or more carefully connected?$s$,
    50, 54, true
  from up_set
  union all
  select up_set.id, up_set.artwork_id, 3::int,
    $s$The nearly white band$s$, $s$Look at a very pale stripe near the lower portion that almost merges with the canvas.$s$,
    $s$This band sits on the threshold of visibility. Its slight difference from white becomes meaningful because the entire painting has trained the eye to notice less.$s$, $s$Would this color seem visible in a louder painting?$s$,
    50, 77, true
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
