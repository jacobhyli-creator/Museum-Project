-- ============================================================================
-- verify_pairings_match.sql  (PRE-FLIGHT — read-only, makes NO changes)
-- Run this in the Supabase SQL Editor BEFORE import_pairings.sql to confirm all
-- 62 spreadsheet rows match exactly one artwork. Any row with match_count <> 1
-- must be resolved before importing (0 = no artwork, 2+ = ambiguous).
-- ============================================================================
with wanted (n_artist, n_title, want_year) as (
  values
  ($a$elizabeth murray$a$, $t$my manhattan, january$t$, null::text),
  ($a$elizabeth murray$a$, $t$things to come$t$, null::text),
  ($a$joan mitchell$a$, $t$bracket$t$, null::text),
  ($a$joan mitchell$a$, $t$sunflowers$t$, null::text),
  ($a$joan mitchell$a$, $t$la grande vallée xiv (for a little while)$t$, null::text),
  ($a$cy twombly$a$, $t$second voyage to italy (second version)$t$, null::text),
  ($a$cy twombly$a$, $t$untitled$t$, $y$1968$y$::text),
  ($a$cy twombly$a$, $t$untitled$t$, $y$1971$y$::text),
  ($a$cy twombly$a$, $t$note i, from the series iii notes from salalah$t$, null::text),
  ($a$philip guston$a$, $t$rug iii$t$, null::text),
  ($a$philip guston$a$, $t$the street$t$, null::text),
  ($a$philip guston$a$, $t$brushes$t$, null::text),
  ($a$philip guston$a$, $t$late fall$t$, null::text),
  ($a$philip guston$a$, $t$as it goes$t$, null::text),
  ($a$roy lichtenstein$a$, $t$figures with sunset$t$, null::text),
  ($a$roy lichtenstein$a$, $t$coup de chapeau ii$t$, null::text),
  ($a$roy lichtenstein$a$, $t$live ammo (tzing!)$t$, null::text),
  ($a$roy lichtenstein$a$, $t$portable radio$t$, null::text),
  ($a$roy lichtenstein$a$, $t$tire$t$, null::text),
  ($a$sigmar polke$a$, $t$ohne titel (untitled)$t$, $y$2003$y$::text),
  ($a$sigmar polke$a$, $t$ohne titel (untitled)$t$, $y$1983$y$::text),
  ($a$sigmar polke$a$, $t$springbrunnen (fountain)$t$, null::text),
  ($a$sigmar polke$a$, $t$ohne titel (untitled)$t$, $y$1968$y$::text),
  ($a$andy warhol$a$, $t$most wanted men no. 12, frank b.$t$, null::text),
  ($a$andy warhol$a$, $t$triple elvis [ferus type]$t$, null::text),
  ($a$andy warhol$a$, $t$tunafish disaster$t$, null::text),
  ($a$andy warhol$a$, $t$telephone [1]$t$, null::text),
  ($a$andy warhol$a$, $t$before and after [3]$t$, null::text),
  ($a$andy warhol$a$, $t$nine multicolored marilyns [reversal series]$t$, null::text),
  ($a$andy warhol$a$, $t$robert mapplethorpe$t$, null::text),
  ($a$andy warhol$a$, $t$joseph beuys [camouflage]$t$, null::text),
  ($a$andy warhol$a$, $t$self-portrait$t$, null::text),
  ($a$andy warhol$a$, $t$self-portrait [camouflage]$t$, null::text),
  ($a$gerhard richter$a$, $t$wald (4) [forest (4)]$t$, null::text),
  ($a$gerhard richter$a$, $t$abstraktes bild (abstract picture)$t$, null::text),
  ($a$gerhard richter$a$, $t$fenster (window)$t$, null::text),
  ($a$gerhard richter$a$, $t$256 farben (256 colours)$t$, null::text),
  ($a$gerhard richter$a$, $t$seestück (seascape)$t$, null::text),
  ($a$gerhard richter$a$, $t$porträt müller (portrait müller)$t$, null::text),
  ($a$gerhard richter$a$, $t$gymnastik (gymnastics)$t$, null::text),
  ($a$gerhard richter$a$, $t$brigid polk$t$, null::text),
  ($a$dan flavin$a$, $t$untitled (to barnett newman) two$t$, null::text),
  ($a$dan flavin$a$, $t$"monument" for v. tatlin$t$, null::text),
  ($a$chuck close$a$, $t$agnes$t$, null::text),
  ($a$chuck close$a$, $t$agnes/maquette$t$, null::text),
  ($a$chuck close$a$, $t$roy i$t$, null::text),
  ($a$chuck close$a$, $t$roy/maquette$t$, null::text),
  ($a$chuck close$a$, $t$john$t$, null::text),
  ($a$richard serra$a$, $t$melnikov ii$t$, null::text),
  ($a$richard serra$a$, $t$house of cards$t$, null::text),
  ($a$richard serra$a$, $t$doors$t$, null::text),
  ($a$richard serra$a$, $t$floor pole prop$t$, null::text),
  ($a$richard serra$a$, $t$the united states courts are partial to government$t$, null::text),
  ($a$brice marden$a$, $t$the sisters$t$, null::text),
  ($a$brice marden$a$, $t$epitaph painting 1$t$, null::text),
  ($a$agnes martin$a$, $t$wheat$t$, null::text),
  ($a$agnes martin$a$, $t$untitled #5$t$, $y$1977$y$::text),
  ($a$agnes martin$a$, $t$drift of summer$t$, null::text),
  ($a$agnes martin$a$, $t$night sea$t$, null::text),
  ($a$agnes martin$a$, $t$untitled #9$t$, $y$1981$y$::text),
  ($a$agnes martin$a$, $t$untitled #5$t$, $y$1988$y$::text),
  ($a$agnes martin$a$, $t$untitled #9$t$, $y$1995$y$::text)
)
select w.n_artist, w.n_title, w.want_year,
       count(a.id) as match_count
from wanted w
left join public.artworks a
  on regexp_replace(lower(translate(a.artist, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = w.n_artist
 and regexp_replace(lower(translate(a.title, $q$“”‘’–—$q$, $q$""''--$q$)), $s$\s+$s$, $s$ $s$, $s$g$s$) = w.n_title
 and (w.want_year is null or coalesce(a.year::text,'') = w.want_year)
group by w.n_artist, w.n_title, w.want_year
order by match_count, w.n_artist, w.n_title;
-- Expect: every row match_count = 1. Rows with 0 or >1 need attention.
