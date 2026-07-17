-- ============================================================================
-- verify_lookcloser_match.sql  (PRE-FLIGHT — read-only, makes NO changes)
-- Run in the Supabase SQL Editor BEFORE import_lookcloser.sql to confirm every
-- guided-looking row matches exactly one artwork by its code. Any row with
-- match_count <> 1 must be resolved before importing (0 = no such code).
-- ============================================================================
with wanted (code) as (
  values
  ($s$A032$s$),
  ($s$A033$s$),
  ($s$A042$s$),
  ($s$A043$s$),
  ($s$A044$s$),
  ($s$A026$s$),
  ($s$A027$s$),
  ($s$A028$s$),
  ($s$A029$s$),
  ($s$A045$s$),
  ($s$A046$s$),
  ($s$A047$s$),
  ($s$A048$s$),
  ($s$A049$s$),
  ($s$A055$s$),
  ($s$A056$s$),
  ($s$A057$s$),
  ($s$A058$s$),
  ($s$A059$s$),
  ($s$A060$s$),
  ($s$A061$s$),
  ($s$A062$s$),
  ($s$A063$s$),
  ($s$A008$s$),
  ($s$A009$s$),
  ($s$A010$s$),
  ($s$A011$s$),
  ($s$A012$s$),
  ($s$A013$s$),
  ($s$A014$s$),
  ($s$A015$s$),
  ($s$A016$s$),
  ($s$A017$s$),
  ($s$A034$s$),
  ($s$A035$s$),
  ($s$A036$s$),
  ($s$A037$s$),
  ($s$A038$s$),
  ($s$A039$s$),
  ($s$A040$s$),
  ($s$A041$s$),
  ($s$A030$s$),
  ($s$A031$s$),
  ($s$A021$s$),
  ($s$A022$s$),
  ($s$A023$s$),
  ($s$A024$s$),
  ($s$A025$s$),
  ($s$A050$s$),
  ($s$A051$s$),
  ($s$A052$s$),
  ($s$A053$s$),
  ($s$A054$s$),
  ($s$A018$s$),
  ($s$A019$s$),
  ($s$A001$s$),
  ($s$A002$s$),
  ($s$A003$s$),
  ($s$A004$s$),
  ($s$A005$s$),
  ($s$A006$s$),
  ($s$A007$s$)
)
select w.code, count(a.id) as match_count
from wanted w
left join public.artworks a on a.code = w.code
group by w.code
order by match_count, w.code;
-- Expect: every row match_count = 1. Rows with 0 need attention.
