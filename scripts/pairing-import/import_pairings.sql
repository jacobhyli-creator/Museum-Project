-- ============================================================================
-- import_pairings.sql  (generated — do not hand-edit)
-- Related Literature & Music pairings from
--   Artwork_Literature_Music_Pairings_Relatable_Edition.xlsx  (sheet: All Pairings)
-- Writes ONLY public.artwork_pairings. Never touches explanations, images,
-- rooms, artwork metadata, routing, or any user/session data.
-- Matched by exact artist + title (year-normalized); the 9 duplicate-title works
-- (Twombly/Polke/Agnes Martin 'Untitled*') are disambiguated by year.
-- Imported as review_status='approved', is_published=true so matched pairings
-- appear to visitors immediately (still editable in the admin).
-- Run in the Supabase SQL Editor AFTER migration 0013.
-- 62 pairing rows. Idempotent: re-running updates in place (unique artwork_id).
-- ============================================================================
begin;

-- Room 1  Elizabeth Murray - My Manhattan, January
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Catcher in the Rye$lit$, $aut$J. D. Salinger$aut$, $lr$Its restless, alienated New York voice fits Murray’s crowded and emotionally unstable vision of the city.$lr$,
       $mus$Empire State of Mind$mus$, $mua$JAY-Z feat. Alicia Keys$mua$, $mg$Hip-hop/pop$mg$, $mr$Its energetic love-hate celebration of New York matches the painting’s loud, compressed urban personality.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$elizabeth murray$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$my manhattan, january$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 1  Elizabeth Murray - Things to Come
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Hunger Games$lit$, $aut$Suzanne Collins$aut$, $lr$Its future feels unstable, threatening, and still in the process of taking shape, much like Murray’s forms pushing beyond the canvas.$lr$,
       $mus$Everything in Its Right Place$mus$, $mua$Radiohead$mua$, $mg$Alternative$mg$, $mr$Its repeated calm phrase over an unsettled electronic surface fits a work where order seems present but never secure.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$elizabeth murray$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$things to come$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 1  Joan Mitchell - Bracket
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$To the Lighthouse$lit$, $aut$Virginia Woolf$aut$, $lr$Its landscape is experienced through memory and emotion rather than description, just as Mitchell paints remembered atmosphere instead of scenery.$lr$,
       $mus$The Lark Ascending$mus$, $mua$Ralph Vaughan Williams$mua$, $mg$Classical$mg$, $mr$Its sweeping movement and changing emotional weather closely match Mitchell’s expansive brushwork.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$joan mitchell$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$bracket$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 1  Joan Mitchell - Sunflowers
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Sun Also Rises$lit$, $aut$Ernest Hemingway$aut$, $lr$Its bright surface carries loss and exhaustion underneath, matching Mitchell’s sunflowers as beauty mixed with mortality.$lr$,
       $mus$Yellow$mus$, $mua$Coldplay$mua$, $mg$Pop rock$mg$, $mr$Its warm, vulnerable emotional tone fits the painting’s intense yellow without reducing it to simple happiness.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$joan mitchell$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$sunflowers$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 1  Joan Mitchell - La Grande Vallée XIV (For a Little While)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$A Grief Observed$lit$, $aut$C. S. Lewis$aut$, $lr$Its fragmented confrontation with grief matches Mitchell’s attempt to hold beauty and loss together without resolving them.$lr$,
       $mus$Adagio for Strings$mus$, $mua$Samuel Barber$mua$, $mg$Classical$mg$, $mr$Its slow rise and suspended sorrow reflect the painting’s vast emotional pressure.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$joan mitchell$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$la grande vallée xiv (for a little while)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 2  Cy Twombly - Second Voyage to Italy (Second Version)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Odyssey$lit$, $aut$Homer$aut$, $lr$Its journey through memory, myth, and return fits Twombly’s Italy as a place made from fragments of the ancient past.$lr$,
       $mus$The Four Seasons: Summer, III. Presto$mus$, $mua$Antonio Vivaldi$mua$, $mg$Classical$mg$, $mr$Its heat, speed, and disorder evoke an Italy experienced through sensation rather than calm classical balance.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$cy twombly$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$second voyage to italy (second version)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 2  Cy Twombly - Untitled
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Waves$lit$, $aut$Virginia Woolf$aut$, $lr$Its repeated voices and circular rhythms parallel Twombly’s loops, where meaning comes through cadence more than plot.$lr$,
       $mus$Clocks$mus$, $mua$Coldplay$mua$, $mg$Pop rock$mg$, $mr$Its repeating piano pattern captures the painting’s sense of motion trapped inside recurrence.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$cy twombly$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$untitled$nt$ and coalesce(a.year::text,'') = $yr$1968$yr$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 2  Cy Twombly - Untitled
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Book Thief$lit$, $aut$Markus Zusak$aut$, $lr$Its concern with writing, memory, and traces left behind fits Twombly’s chalkboard-like marks that resemble language without becoming readable.$lr$,
       $mus$On the Nature of Daylight$mus$, $mua$Max Richter$mua$, $mg$Contemporary classical$mg$, $mr$Its repeating phrase gathers emotion through small changes, much like Twombly’s lines.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$cy twombly$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$untitled$nt$ and coalesce(a.year::text,'') = $yr$1971$yr$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 2  Cy Twombly - Note I, from the series III Notes from Salalah
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Alchemist$lit$, $aut$Paulo Coelho$aut$, $lr$Its desert journey and search for meaning make an accessible match for Twombly’s memory of Salalah as travel, weather, and writing.$lr$,
       $mus$Desert Rose$mus$, $mua$Sting feat. Cheb Mami$mua$, $mg$Pop/world$mg$, $mr$Its lush desert atmosphere captures the work’s mixture of travel, memory, and flowing movement.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$cy twombly$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$note i, from the series iii notes from salalah$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 3  Philip Guston - Rug III
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Metamorphosis$lit$, $aut$Franz Kafka$aut$, $lr$Its familiar room becomes absurd and oppressive, matching Guston’s domestic objects as comic but psychologically disturbing.$lr$,
       $mus$A Day in the Life$mus$, $mua$The Beatles$mua$, $mg$Rock$mg$, $mr$Its shift from ordinary routine into surreal unease fits Guston’s transformation of everyday objects.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$philip guston$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$rug iii$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 3  Philip Guston - The Street
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$1984$lit$, $aut$George Orwell$aut$, $lr$Its public world is shaped by violence, conformity, and fear, fitting Guston’s street as collective pressure rather than normal city life.$lr$,
       $mus$Alright$mus$, $mua$Kendrick Lamar$mua$, $mg$Hip-hop$mg$, $mr$Its mix of political danger, resilience, and public urgency fits the painting’s crowded tension.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$philip guston$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$the street$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 3  Philip Guston - Brushes
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Death of Ivan Ilyich$lit$, $aut$Leo Tolstoy$aut$, $lr$Its confrontation with mortality makes Guston’s ordinary studio tools feel like witnesses to a life running out.$lr$,
       $mus$Hurt$mus$, $mua$Johnny Cash$mua$, $mg$Country/rock$mg$, $mr$Its worn simplicity and focus on regret match Guston’s blunt late style.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$philip guston$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$brushes$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 3  Philip Guston - Late Fall
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Remains of the Day$lit$, $aut$Kazuo Ishiguro$aut$, $lr$Its restrained regret and awareness of time nearly gone align with the painting’s late-season mood.$lr$,
       $mus$Autumn Leaves$mus$, $mua$Nat King Cole$mua$, $mg$Jazz/pop standard$mg$, $mr$Its familiar melancholy captures the painting’s sense of fading time.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$philip guston$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$late fall$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 3  Philip Guston - As It Goes
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Waiting for Godot$lit$, $aut$Samuel Beckett$aut$, $lr$Its repetition and absurd endurance fit Guston’s clocks, shoes, cigarettes, and life continuing without clear resolution.$lr$,
       $mus$Time$mus$, $mua$Pink Floyd$mua$, $mg$Progressive rock$mg$, $mr$Its meditation on wasted days and mortality directly fits the work’s clock-bound atmosphere.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$philip guston$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$as it goes$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 4  Roy Lichtenstein - Figures with Sunset
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Great Gatsby$lit$, $aut$F. Scott Fitzgerald$aut$, $lr$Its glamorous romance is inseparable from artificiality and distance, just like Lichtenstein’s perfect sunset image.$lr$,
       $mus$Young and Beautiful$mus$, $mua$Lana Del Rey$mua$, $mg$Pop$mg$, $mr$Its cinematic romance and awareness of image and performance fit the work’s polished emotion.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$roy lichtenstein$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$figures with sunset$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 4  Roy Lichtenstein - Coup de Chapeau II
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Cyrano de Bergerac$lit$, $aut$Edmond Rostand$aut$, $lr$Its dramatic gestures and theatrical wit match a sculpture that turns a hat-tip into an oversized performance.$lr$,
       $mus$Take a Bow$mus$, $mua$Rihanna$mua$, $mg$Pop/R&B$mg$, $mr$Its polished theatrical farewell makes a relatable musical counterpart to the exaggerated gesture.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$roy lichtenstein$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$coup de chapeau ii$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 4  Roy Lichtenstein - Live Ammo (Tzing!)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Slaughterhouse-Five$lit$, $aut$Kurt Vonnegut$aut$, $lr$Its absurd treatment of war exposes how violence can become repeated spectacle, matching Lichtenstein’s comic-book explosion.$lr$,
       $mus$Paper Planes$mus$, $mua$M.I.A.$mua$, $mg$Hip-hop/pop$mg$, $mr$Its catchy rhythm and gunshot sound effects create the same uneasy mixture of violence and pop entertainment.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$roy lichtenstein$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$live ammo (tzing!)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 4  Roy Lichtenstein - Portable Radio
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Fahrenheit 451$lit$, $aut$Ray Bradbury$aut$, $lr$Its society is flooded with media that connects and distracts at the same time, fitting the radio as both communication and control.$lr$,
       $mus$Radio Ga Ga$mus$, $mua$Queen$mua$, $mg$Rock$mg$, $mr$Its nostalgia for radio culture fits a device that has become a silent visual icon.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$roy lichtenstein$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$portable radio$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 4  Roy Lichtenstein - Tire
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Road$lit$, $aut$Cormac McCarthy$aut$, $lr$Its world is defined by movement, survival, and the road itself, making the isolated tire feel existential rather than merely industrial.$lr$,
       $mus$Life Is a Highway$mus$, $mua$Tom Cochrane$mua$, $mg$Rock$mg$, $mr$Its familiar forward motion creates an ironic contrast with a tire permanently stopped in the museum.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$roy lichtenstein$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$tire$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 5  Sigmar Polke - Ohne Titel (Untitled)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Harry Potter and the Philosopher’s Stone$lit$, $aut$J. K. Rowling$aut$, $lr$Its mixture of performance, magic, and concealed mechanisms fits Polke’s image of illusion that remains visibly constructed.$lr$,
       $mus$Season of the Witch$mus$, $mua$Donovan$mua$, $mg$Psychedelic rock$mg$, $mr$Its playful supernatural mood suits the work’s magical atmosphere without becoming too dark.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$sigmar polke$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$ohne titel (untitled)$nt$ and coalesce(a.year::text,'') = $yr$2003$yr$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 5  Sigmar Polke - Ohne Titel (Untitled)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$House of Leaves$lit$, $aut$Mark Z. Danielewski$aut$, $lr$Its layered and unstable reality fits Polke’s overlapping images and refusal of one reliable reading.$lr$,
       $mus$Where Is My Mind?$mus$, $mua$Pixies$mua$, $mg$Alternative rock$mg$, $mr$Its disoriented but familiar mood matches the painting’s unstable visual logic.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$sigmar polke$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$ohne titel (untitled)$nt$ and coalesce(a.year::text,'') = $yr$1983$yr$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 5  Sigmar Polke - Springbrunnen (Fountain)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$White Noise$lit$, $aut$Don DeLillo$aut$, $lr$Its world of consumer images and media distortion closely fits Polke’s fountain reproduced through visible printing dots.$lr$,
       $mus$Once in a Lifetime$mus$, $mua$Talking Heads$mua$, $mg$New wave$mg$, $mr$Its bright repetition and strange treatment of ordinary life fit the work’s artificial media surface.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$sigmar polke$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$springbrunnen (fountain)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 5  Sigmar Polke - Ohne Titel (Untitled)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Alice’s Adventures in Wonderland$lit$, $aut$Lewis Carroll$aut$, $lr$Its familiar world keeps slipping into strange visual logic, matching Polke’s comic imagery and unstable meaning.$lr$,
       $mus$Lucy in the Sky with Diamonds$mus$, $mua$The Beatles$mua$, $mg$Psychedelic rock$mg$, $mr$Its dreamlike imagery fits the work’s playful movement between recognition and hallucination.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$sigmar polke$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$ohne titel (untitled)$nt$ and coalesce(a.year::text,'') = $yr$1968$yr$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Most Wanted Men No. 12, Frank B.
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Outsiders$lit$, $aut$S. E. Hinton$aut$, $lr$Its characters are judged through social labels and reputation, matching Warhol’s mug shot turned into a public identity.$lr$,
       $mus$bad guy$mus$, $mua$Billie Eilish$mua$, $mg$Pop$mg$, $mr$Its playful performance of criminal identity suits Warhol’s conversion of a wanted man into an icon.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$most wanted men no. 12, frank b.$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Triple Elvis [Ferus type]
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Talented Mr. Ripley$lit$, $aut$Patricia Highsmith$aut$, $lr$Its identity is built through imitation, glamour, and performance, matching Elvis repeated until persona overtakes person.$lr$,
       $mus$A Little Less Conversation$mus$, $mua$Elvis Presley$mua$, $mg$Rock and roll$mg$, $mr$Its swagger and cinematic energy fit the armed pose and manufactured masculinity.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$triple elvis [ferus type]$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Tunafish Disaster
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Jungle$lit$, $aut$Upton Sinclair$aut$, $lr$Its exposure of danger inside industrial food systems directly matches Warhol’s collision of trusted packaging and death.$lr$,
       $mus$Mad World$mus$, $mua$Tears for Fears$mua$, $mg$New wave$mg$, $mr$Its calm delivery of disturbing reality fits Warhol’s detached repetition of tragedy.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$tunafish disaster$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Telephone [1]
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Telephone Call$lit$, $aut$Dorothy Parker$aut$, $lr$Its anxious waiting for a call matches the silent telephone charged with emotional expectation.$lr$,
       $mus$Call Me Maybe$mus$, $mua$Carly Rae Jepsen$mua$, $mg$Pop$mg$, $mr$Its instantly relatable anticipation of a call makes the ordinary device feel emotionally loaded.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$telephone [1]$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Before and After [3]
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Picture of Dorian Gray$lit$, $aut$Oscar Wilde$aut$, $lr$Its obsession with appearance and self-transformation closely matches the cosmetic before-and-after image.$lr$,
       $mus$Pretty Hurts$mus$, $mua$Beyoncé$mua$, $mg$Pop/R&B$mg$, $mr$Its critique of beauty standards directly fits the work’s promise that appearance can be corrected.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$before and after [3]$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Nine Multicolored Marilyns [Reversal Series]
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Seven Husbands of Evelyn Hugo$lit$, $aut$Taylor Jenkins Reid$aut$, $lr$Its glamorous star is repeatedly reinvented by the public, matching Marilyn as an image multiplied beyond the person.$lr$,
       $mus$Material Girl$mus$, $mua$Madonna$mua$, $mg$Pop$mg$, $mr$Its knowingly manufactured glamour fits Warhol’s bright, repeated celebrity image.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$nine multicolored marilyns [reversal series]$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Robert Mapplethorpe
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Great Gatsby$lit$, $aut$F. Scott Fitzgerald$aut$, $lr$Its elegance, desire, and carefully constructed social image fit Warhol’s polished portrait of Mapplethorpe.$lr$,
       $mus$Vogue$mus$, $mua$Madonna$mua$, $mg$Pop$mg$, $mr$Its focus on style, pose, and public identity closely matches the portrait’s glamorous surface.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$robert mapplethorpe$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Joseph Beuys [Camouflage]
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Book Thief$lit$, $aut$Markus Zusak$aut$, $lr$Its confrontation with German history and the power of public stories fits Beuys’s political persona filtered through camouflage.$lr$,
       $mus$Heroes$mus$, $mua$David Bowie$mua$, $mg$Rock$mg$, $mr$Its Berlin setting and constructed heroism match the meeting of Beuys’s myth and Warhol’s image-making.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$joseph beuys [camouflage]$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Self-Portrait
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Frankenstein$lit$, $aut$Mary Shelley$aut$, $lr$Its face emerging from darkness connects identity, creation, and mortality, fitting Warhol’s late self-invention as an almost artificial being.$lr$,
       $mus$Lazarus$mus$, $mua$David Bowie$mua$, $mg$Rock$mg$, $mr$Its theatrical awareness of death closely matches Warhol’s late face becoming a surviving icon.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$self-portrait$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 6  Andy Warhol - Self-Portrait [Camouflage]
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Invisible Man$lit$, $aut$Ralph Ellison$aut$, $lr$Its central issue of being seen through imposed patterns fits Warhol’s face both concealed and intensified by camouflage.$lr$,
       $mus$How to Disappear Completely$mus$, $mua$Radiohead$mua$, $mg$Alternative rock$mg$, $mr$Its wish to vanish while remaining emotionally visible matches camouflage that makes Warhol more recognizable.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$andy warhol$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$self-portrait [camouflage]$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 7  Gerhard Richter - Wald (4) [Forest (4)]
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Into the Wild$lit$, $aut$Jon Krakauer$aut$, $lr$Its forest becomes a place of freedom, danger, and uncertain self-discovery, matching Richter’s landscape that never fully opens.$lr$,
       $mus$Holocene$mus$, $mua$Bon Iver$mua$, $mg$Indie folk$mg$, $mr$Its fragmented feeling of nature and memory fits Richter’s forest as atmosphere rather than scenery.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$gerhard richter$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$wald (4) [forest (4)]$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 7  Gerhard Richter - Abstraktes Bild (Abstract Picture)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Cloud Atlas$lit$, $aut$David Mitchell$aut$, $lr$Its layered stories reappear in altered forms, matching Richter’s paint layers that are covered, scraped, and revealed.$lr$,
       $mus$Bohemian Rhapsody$mus$, $mua$Queen$mua$, $mg$Rock$mg$, $mr$Its abrupt shifts, overlapping moods, and refusal of one stable structure suit the painting’s controlled disorder.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$gerhard richter$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$abstraktes bild (abstract picture)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 7  Gerhard Richter - Fenster (Window)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Yellow Wallpaper$lit$, $aut$Charlotte Perkins Gilman$aut$, $lr$Its enclosed viewpoint and frustrated visual access fit a window that promises a view but becomes a barrier.$lr$,
       $mus$The Sound of Silence$mus$, $mua$Simon & Garfunkel$mua$, $mg$Folk rock$mg$, $mr$Its theme of failed communication matches the dark panes that offer presence without access.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$gerhard richter$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$fenster (window)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 7  Gerhard Richter - 256 Farben (256 Colours)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Giver$lit$, $aut$Lois Lowry$aut$, $lr$Its controlled world of color and choice makes a relatable match for Richter’s standardized grid of differences.$lr$,
       $mus$Colors$mus$, $mua$Halsey$mua$, $mg$Pop$mg$, $mr$Its focus on emotion expressed through color makes the rigid chart feel personal and immediately relatable.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$gerhard richter$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$256 farben (256 colours)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 7  Gerhard Richter - Seestück (Seascape)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Life of Pi$lit$, $aut$Yann Martel$aut$, $lr$Its sea is both physically real and shaped by storytelling, matching Richter’s beautiful but possibly constructed view.$lr$,
       $mus$Ocean Eyes$mus$, $mua$Billie Eilish$mua$, $mg$Pop$mg$, $mr$Its dreamy, slightly unreal atmosphere fits the painting’s seductive but uncertain seascape.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$gerhard richter$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$seestück (seascape)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 7  Gerhard Richter - Porträt Müller (Portrait Müller)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Sense of an Ending$lit$, $aut$Julian Barnes$aut$, $lr$Its uncertain reconstruction of memory fits a portrait that preserves a person while refusing clarity.$lr$,
       $mus$Somebody That I Used to Know$mus$, $mua$Gotye feat. Kimbra$mua$, $mg$Pop$mg$, $mr$Its sense of a once-familiar person becoming distant matches the blurred face.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$gerhard richter$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$porträt müller (portrait müller)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 7  Gerhard Richter - Gymnastik (Gymnastics)
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Hunger Games$lit$, $aut$Suzanne Collins$aut$, $lr$Its athletic body is turned into public performance and pressure, matching the gymnast caught between skill and media image.$lr$,
       $mus$Chariots of Fire$mus$, $mua$Vangelis$mua$, $mg$Electronic/classical$mg$, $mr$Its famous slow-motion athletic feeling is instantly relatable, while Richter’s blur complicates the usual triumph.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$gerhard richter$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$gymnastik (gymnastics)$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 7  Gerhard Richter - Brigid Polk
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Bell Jar$lit$, $aut$Sylvia Plath$aut$, $lr$Its intimate female perspective and emotional distance fit a reclining figure visible to the public but inwardly unreachable.$lr$,
       $mus$Fade Into You$mus$, $mua$Mazzy Star$mua$, $mg$Dream pop$mg$, $mr$Its soft focus and emotional distance closely match the blurred portrait.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$gerhard richter$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$brigid polk$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 8  Dan Flavin - untitled (to Barnett Newman) two
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Little Prince$lit$, $aut$Antoine de Saint-Exupéry$aut$, $lr$Its simple forms carry emotional meaning and dedication, matching ordinary fluorescent tubes transformed into a luminous tribute.$lr$,
       $mus$Clair de Lune$mus$, $mua$Claude Debussy$mua$, $mg$Classical$mg$, $mr$Its soft radiance and atmosphere suit colored light spreading beyond the object into the room.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$dan flavin$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$untitled (to barnett newman) two$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 8  Dan Flavin - “monument” for V. Tatlin
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Animal Farm$lit$, $aut$George Orwell$aut$, $lr$Its revolutionary ideal becomes compromised and unstable, matching Flavin’s fragile, ironic monument to political utopia.$lr$,
       $mus$Heroes$mus$, $mua$David Bowie$mua$, $mg$Rock$mg$, $mr$Its grand but vulnerable sense of heroism fits a glowing monument that can also burn out.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$dan flavin$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$"monument" for v. tatlin$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 9  Chuck Close - Agnes
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Wonder$lit$, $aut$R. J. Palacio$aut$, $lr$Its focus on how a face is perceived by others makes an accessible match for Close’s portrait that changes completely with distance.$lr$,
       $mus$Both Sides, Now$mus$, $mua$Joni Mitchell$mua$, $mg$Folk$mg$, $mr$Its reflection on changing viewpoints fits Agnes as abstract color up close and recognizable identity from afar.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$chuck close$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$agnes$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 9  Chuck Close - Agnes/maquette
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Diary of Anne Frank$lit$, $aut$Anne Frank$aut$, $lr$Its visible process of recording and constructing a person over time parallels the maquette as a working, unfinished image.$lr$,
       $mus$The Scientist$mus$, $mua$Coldplay$mua$, $mg$Alternative rock$mg$, $mr$Its language of going back and working something out fits the portrait shown in planning and revision.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$chuck close$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$agnes/maquette$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 9  Chuck Close - Roy I
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Understanding Comics$lit$, $aut$Scott McCloud$aut$, $lr$Its clear explanation of how separate marks become images perfectly fits Close portraying Lichtenstein through modular cells.$lr$,
       $mus$Royals$mus$, $mua$Lorde$mua$, $mg$Pop$mg$, $mr$Its cool treatment of fame and image suits a portrait of one of Pop Art’s most famous figures.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$chuck close$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$roy i$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 9  Chuck Close - Roy/maquette
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Ways of Seeing$lit$, $aut$John Berger$aut$, $lr$Its explanation of how images are framed and constructed matches the gridded photograph as a plan for seeing Roy.$lr$,
       $mus$Blueprint 2$mus$, $mua$JAY-Z$mua$, $mg$Hip-hop$mg$, $mr$Its title and controlled structure make a direct, relatable match for a portrait presented as a working plan.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$chuck close$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$roy/maquette$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 9  Chuck Close - John
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Martian$lit$, $aut$Andy Weir$aut$, $lr$Its success depends on solving one technical problem after another, matching a portrait built through 126 carefully aligned colors.$lr$,
       $mus$Harder, Better, Faster, Stronger$mus$, $mua$Daft Punk$mua$, $mg$Electronic$mg$, $mr$Its mechanical repetition and cumulative precision fit the complex printing process.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$chuck close$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$john$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 10  Richard Serra - Melnikov II
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Maze Runner$lit$, $aut$James Dashner$aut$, $lr$Its body must navigate imposing structures that control movement, matching Serra’s steel as architecture experienced physically.$lr$,
       $mus$No Church in the Wild$mus$, $mua$Jay-Z & Kanye West feat. Frank Ocean$mua$, $mg$Hip-hop$mg$, $mr$Its monumental beat and tension between power and structure match the sculpture’s physical authority.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$richard serra$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$melnikov ii$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 10  Richard Serra - House of Cards
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Lord of the Flies$lit$, $aut$William Golding$aut$, $lr$Its social order survives through unstable mutual pressure, matching four plates that depend completely on one another.$lr$,
       $mus$Under Pressure$mus$, $mua$Queen & David Bowie$mua$, $mg$Rock$mg$, $mr$Its title and building tension perfectly match the sculpture’s shared physical pressure.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$richard serra$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$house of cards$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 10  Richard Serra - Doors
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$No Exit$lit$, $aut$Jean-Paul Sartre$aut$, $lr$Its blocked escape and existential enclosure match doors that retain the idea of passage while refusing it.$lr$,
       $mus$Knockin’ on Heaven’s Door$mus$, $mua$Bob Dylan$mua$, $mg$Folk rock$mg$, $mr$Its familiar image of a door as unreachable passage creates an immediate emotional counterpart.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$richard serra$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$doors$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 10  Richard Serra - Floor Pole Prop
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Pillars of the Earth$lit$, $aut$Ken Follett$aut$, $lr$Its focus on support and structural survival makes a clear narrative match for Serra’s exposed balance of forces.$lr$,
       $mus$The Chain$mus$, $mua$Fleetwood Mac$mua$, $mg$Rock$mg$, $mr$Its restrained tension and dependence among parts fit a work where every element must hold.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$richard serra$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$floor pole prop$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 10  Richard Serra - The United States Courts Are Partial to Government
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Trial$lit$, $aut$Franz Kafka$aut$, $lr$Its opaque legal system and institutional helplessness directly match Serra’s accusation of judicial bias.$lr$,
       $mus$Alright$mus$, $mua$Kendrick Lamar$mua$, $mg$Hip-hop$mg$, $mr$Its response to unequal institutions gives the drawing a recognizable contemporary political counterpart.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$richard serra$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$the united states courts are partial to government$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 11  Brice Marden - The Sisters
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Little Women$lit$, $aut$Louisa May Alcott$aut$, $lr$Its sisters remain distinct while continually shaping one another, matching Marden’s lines as a relationship rather than a single form.$lr$,
       $mus$Rivers and Roads$mus$, $mua$The Head and the Heart$mua$, $mg$Indie folk$mg$, $mr$Its pull between closeness and separation fits lines that cross, diverge, and return.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$brice marden$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$the sisters$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 11  Brice Marden - Epitaph Painting 1
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Book Thief$lit$, $aut$Markus Zusak$aut$, $lr$Its concern with death, memory, and the limits of words fits a memorial painting that resembles unreadable writing.$lr$,
       $mus$See You Again$mus$, $mua$Wiz Khalifa feat. Charlie Puth$mua$, $mg$Hip-hop/pop$mg$, $mr$Its accessible language of loss and remembrance fits the work’s elegiac mood without becoming overly formal.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$brice marden$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$epitaph painting 1$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 12  Agnes Martin - Wheat
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Little House on the Prairie$lit$, $aut$Laura Ingalls Wilder$aut$, $lr$Its open landscape and quiet attention to ordinary rural life fit Martin’s restrained evocation of wheat and order.$lr$,
       $mus$Fields of Gold$mus$, $mua$Sting$mua$, $mg$Pop$mg$, $mr$Its warm, familiar image of wheat fields suits the painting’s quiet abundance.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$agnes martin$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$wheat$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 12  Agnes Martin - Untitled #5
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Giver$lit$, $aut$Lois Lowry$aut$, $lr$Its controlled structure contains subtle differences and hidden emotion, matching Martin’s hand-drawn grid.$lr$,
       $mus$Spiegel im Spiegel$mus$, $mua$Arvo Pärt$mua$, $mg$Classical$mg$, $mr$Its spacious repetition and gentle imperfection are an especially close musical equivalent to Martin’s grid.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$agnes martin$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$untitled #5$nt$ and coalesce(a.year::text,'') = $yr$1977$yr$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 12  Agnes Martin - Drift of Summer
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Dandelion Wine$lit$, $aut$Ray Bradbury$aut$, $lr$Its summer exists as memory and atmosphere, closely matching Martin’s pale sense of a season drifting away.$lr$,
       $mus$Cruel Summer$mus$, $mua$Taylor Swift$mua$, $mg$Pop$mg$, $mr$Its title is familiar, but the song’s emotional memory of summer gives the restrained painting a more relatable human connection.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$agnes martin$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$drift of summer$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 12  Agnes Martin - Night Sea
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Old Man and the Sea$lit$, $aut$Ernest Hemingway$aut$, $lr$Its sea is vast, spare, and inwardly spiritual, matching Martin’s reduction of night and ocean to structure and light.$lr$,
       $mus$Clair de Lune$mus$, $mua$Claude Debussy$mua$, $mg$Classical$mg$, $mr$Its nocturnal shimmer closely fits the blue field and flashes of gold.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$agnes martin$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$night sea$nt$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 12  Agnes Martin - Untitled #9
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Little Prince$lit$, $aut$Antoine de Saint-Exupéry$aut$, $lr$Its simplicity reveals meaning only through patient attention, matching Martin’s pale bands and subtle differences.$lr$,
       $mus$Gymnopédie No. 1$mus$, $mua$Erik Satie$mua$, $mg$Classical$mg$, $mr$Its measured simplicity and gentle melancholy mirror the painting’s horizontal intervals.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$agnes martin$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$untitled #9$nt$ and coalesce(a.year::text,'') = $yr$1981$yr$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 12  Agnes Martin - Untitled #5
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$Siddhartha$lit$, $aut$Hermann Hesse$aut$, $lr$Its disciplined search for inner clarity fits Martin’s repeated bands as attentive practice rather than decoration.$lr$,
       $mus$Weightless$mus$, $mua$Marconi Union$mua$, $mg$Ambient$mg$, $mr$Its slow, even pacing makes the painting’s breathing-like rhythm immediately relatable.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$agnes martin$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$untitled #5$nt$ and coalesce(a.year::text,'') = $yr$1988$yr$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

-- Room 12  Agnes Martin - Untitled #9
insert into public.artwork_pairings
  (artwork_id, literature_title, literature_author, literature_reason,
   music_title, music_artist, music_genre, music_reason,
   review_status, is_published)
select a.id, $lit$The Housekeeper and the Professor$lit$, $aut$Yoko Ogawa$aut$, $lr$Its tenderness grows through order and small differences, matching Martin’s late, quietly joyful precision.$lr$,
       $mus$Here Comes the Sun$mus$, $mua$The Beatles$mua$, $mg$Pop rock$mg$, $mr$Its familiar but sincere brightness suits a major late work where joy appears as calm clarity.$mr$,
       'approved', true
from public.artworks a
where regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $na$agnes martin$na$ and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = $nt$untitled #9$nt$ and coalesce(a.year::text,'') = $yr$1995$yr$
on conflict (artwork_id) do update set
  literature_title  = excluded.literature_title,
  literature_author = excluded.literature_author,
  literature_reason = excluded.literature_reason,
  music_title       = excluded.music_title,
  music_artist      = excluded.music_artist,
  music_genre       = excluded.music_genre,
  music_reason      = excluded.music_reason,
  review_status     = 'approved',
  is_published      = true,
  updated_at        = now();

commit;
