-- ===========================================================================
-- 0017_refresh_image_urls.sql
-- Reconcile the current + active artwork image URLs stored in Supabase with the
-- build-time verified-images.json. Every URL below was re-checked live and
-- returns HTTP 200 with an image/* content-type.
--
-- WHY: the public tour reads image URLs from artwork_images (see
-- tourDataAdapter.mapDbArtwork). SFMOMA's CDN periodically moves hotlinked image
-- paths, so previously-good URLs 403 at load time and a subset of artworks show
-- the placeholder. This resets the DB to the freshly-verified URLs. (A runtime
-- local-photo fallback also exists now, but keeping the DB correct means the
-- high-quality online image shows in the first place.)
--
-- Idempotent + safe: only rows whose URL actually differs are updated; the
-- set_updated_at trigger maintains updated_at. Wrapped in a transaction.
-- ===========================================================================

begin;

-- Fresh, verified code -> URL pairs from scripts/verified-images.json.
create temporary table _fresh_image_urls (code text primary key, url text not null)
  on commit drop;

insert into _fresh_image_urls (code, url) values
  ('A001', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/05/12221051/FC.787_5064.10Z_MARTIN_NP14r4_FINAL-web.jpg'),
  ('A002', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/05/13005648/FC.788_5064.10R_MARTIN_NP_13r3_FINAL-web.jpg'),
  ('A003', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08175646/FC.691_5064.10R_MARTIN_691r2_cv_FINAL-web.jpg'),
  ('A004', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08175951/FC.459_01_H02-web.jpg'),
  ('A005', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08192538/FC.711_5064.R10R_MARTIN_711R5_p_FINAL-web.jpg'),
  ('A006', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08231506/FC.305_01_g02-web.jpg'),
  ('A007', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08225559/FC.549_5064.10R_MARTIN_549R9_FINAL-web.jpg'),
  ('A008', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/14193620/FC.605.A-B_01_f02-web.jpg'),
  ('A009', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08225727/FC.556_01_H02-web.jpg'),
  ('A010', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/14105637/FC.608_01_P02-web.jpg'),
  ('A011', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15193728/FC.499_01_P02-web.jpg'),
  ('A012', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/05/12225447/FC.675_94_Warhol_3_Before_After_FC.675_01_f02.tif-web.jpg'),
  ('A013', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15203036/FC.229_01_P02-web.jpg'),
  ('A014', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/14091305/Warhol_E_2016_2368_REPLACEMENT_G02-web.jpg'),
  ('A015', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08230058/FC.620_01_H02-web.jpg'),
  ('A016', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15181736/FC.616_01_H02-web.jpg'),
  ('A017', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15201331/FC.507_01_H02-web.jpg'),
  ('A018', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/05/13040648/FC.516_01_f02_HR_FINAL-web.jpg'),
  ('A019', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08201649/FC.579_10Q_MARDEN_579R2_FINAL-web.jpg'),
  ('A021', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15212521/FC.626_01_f02_FINAL-web.jpg'),
  ('A022', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08164051/FC.625_01_P02-web.jpg'),
  ('A023', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/05/12231333/FC.697_25681_CLOSE-web.jpg'),
  ('A024', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08174754/FC.844_01_P02-web.jpg'),
  ('A025', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08192145/FC.615_01_H02-web.jpg'),
  ('A026', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15201240/FC.586_01_H02-web.jpg'),
  ('A027', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08180124/FC.460_01_P02-web.jpg'),
  ('A028', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08192659/2000.204_01_b02-web.jpg'),
  ('A029', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08231354/FC.807_5064.Twombly_Notes_Alt_Ian%20Reeves_FINAL-web.jpg'),
  ('A030', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08181804/FC.416_01_B02_FINAL-web.jpg'),
  ('A031', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15210943/FC.824_01_B02-web.jpg'),
  ('A032', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15203244/FC.519_01_H02-web.jpg'),
  ('A033', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08202602/FC.277.A-B_01_H02-web.jpg'),
  ('A034', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08230256/FC.461_01_H02-web.jpg'),
  ('A036', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08231748/FC.738_10U_RICHTER_738R3_p-web.jpg'),
  ('A037', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08231622/FC.643_01_H02-web.jpg'),
  ('A038', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08201922/FC.623_01_H02.jpg'),
  ('A039', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08193024/FC.293_01_H02-web.jpg'),
  ('A040', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08202737/FC.309_01_H02-web.jpg'),
  ('A041', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/14201442/FC.498_10T_RICHTER_498R2-web.jpg'),
  ('A042', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15214008/FC.838.A-C_01_H02-web.jpg'),
  ('A043', 'https://www.joanmitchellfoundation.org/uploads/artwork/mitchell/0870-1990-1991-Sunflowers-Joan-Mitchell.jpg'),
  ('A044', 'https://www.joanmitchellfoundation.org/uploads/artwork/mitchell/_2500xAUTO_crop_center-center_65_none/0996-1983-La_Grande_Vallee_XIV-Joan-Mitchell.jpg'),
  ('A045', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08180247/FC.475_01_P02-web.jpg'),
  ('A046', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15192936/FC.752_5064.10J_GUSTON_752R4_HR_FINAL-web.jpg'),
  ('A047', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/14173729/FC.681_01_H02-web.jpg'),
  ('A048', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/04/30010952/FC.779_01_P02-web.jpg'),
  ('A049', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08203643/FC.501_01_H02-web.jpg'),
  ('A050', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/23025733/FC.276.A-B_01_f02-web.jpg'),
  ('A051', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/22230309/FC.439.A-D_94.453.A-D_01_cropped_G02_Serra_HouseOfCards_View2_HiRes-web.jpg'),
  ('A052', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/23023445/94.454.A-D_01_P02-web.jpg'),
  ('A053', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/24152759/94.451.A-B_01_H02-web.jpg'),
  ('A054', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/22200850/94.449_01_H02-web.jpg'),
  ('A055', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08181415/99.374_01_H02.jpg'),
  ('A056', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/15204338/FC.704%20-%20primary_02-web.jpg'),
  ('A057', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/14171004/FC.612_01_H02-web.jpg'),
  ('A058', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08193525/FC.604_01_H02-web.jpg'),
  ('A059', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/14172537/FC.705_01_P02-web.jpg'),
  ('A060', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/05/12215437/FC.735_10T_POLKE_735R4_FINAL-web.jpg'),
  ('A061', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/06/08230829/FC.394_01_f02-web.jpg'),
  ('A062', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/05/07084210/FC.312_01_P02-web.jpg'),
  ('A063', 'https://d1hhug17qm51in.cloudfront.net/www-media/2026/07/13235453/FC.428.2_01_P02-web.jpg');

-- 1) The CURRENT image the public adapter reads.
update public.artwork_images ai
set url = f.url
from _fresh_image_urls f
join public.artworks a on a.code = f.code
where ai.artwork_id = a.id
  and ai.is_current = true
  and ai.url is distinct from f.url;

-- 2) Keep the ACTIVE version row (history) consistent with the current image.
update public.artwork_image_versions v
set image_url = f.url
from _fresh_image_urls f
join public.artworks a on a.code = f.code
where v.artwork_id = a.id
  and v.is_active = true
  and v.image_url is distinct from f.url;

-- Report the resulting current URLs so you can eyeball the change.
select a.code, ai.url
from public.artwork_images ai
join public.artworks a on a.id = ai.artwork_id
where ai.is_current = true
order by a.code;

commit;
