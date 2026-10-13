-- Demo content for HustleClub.
--
-- Fills courses, jobs and the marketplace with example listings so the site
-- isn't empty. Everything is owned by one existing account: sign up on the site
-- first (ideally your admin account), then run this in the Supabase SQL editor.
-- Safe to re-run: rows whose title already exists are skipped.

do $$
declare
  owner uuid;
begin
  select id into owner
  from public.profiles
  order by (role = 'admin') desc, (role = 'creator') desc, created_at
  limit 1;

  if owner is null then
    raise exception 'No profiles found. Sign up on the site first, then re-run this seed.';
  end if;

  insert into public.courses (creator_id, title, description, instructor, status, price)
  select owner, v.title, v.description, v.instructor, 'published', v.price
  from (values
    ('Freelancing 101: Land Your First Client',
     'Pick a niche, build a portfolio in a weekend, and send pitches that actually get replies.',
     'priya.builds', 0),
    ('Instagram Reels That Convert',
     'Hooks, scripting and editing workflows used to grow small brands to 100k followers.',
     'reelsbyarjun', 499),
    ('Build a SaaS with Next.js & Supabase',
     'Auth, payments and deployment: ship a real product from an empty folder.',
     'devkaran', 1299),
    ('Canva Mastery for Side Hustlers',
     'Design thumbnails, posts and pitch decks that look agency-made, no Photoshop needed.',
     'designwithmeera', 299)
  ) as v(title, description, instructor, price)
  where not exists (select 1 from public.courses c where c.title = v.title);

  insert into public.jobs (creator_id, created_by, title, description, budget, type, is_open)
  select owner, owner, v.title, v.description, v.budget, v.type, true
  from (values
    ('Video editor for YouTube channel',
     'Edit 2 long-form videos a week (10-15 min). Cuts, captions, B-roll. Remote.', 8000, 'video'),
    ('Landing page in Next.js',
     'One responsive landing page with a waitlist form. Figma design provided.', 15000, 'tech'),
    ('Social media manager (part-time)',
     'Plan and post content for a cafe brand on Instagram, 3 posts a week.', 12000, 'marketing'),
    ('Logo + brand kit for a D2C label',
     'Logo, colour palette and type pairing for a new clothing brand.', 6000, 'design')
  ) as v(title, description, budget, type)
  where not exists (select 1 from public.jobs j where j.title = v.title);

  insert into public.marketplace_items (seller_id, user_id, title, description, price, is_published, is_sold)
  select owner, owner, v.title, v.description, v.price, true, false
  from (values
    ('Notion Freelancer OS',
     'Client CRM, invoice tracker and project board in one Notion template.', 199),
    ('50 Lightroom Presets - Street Pack',
     'Moody, film-style presets for mobile and desktop Lightroom.', 349),
    ('Resume Template Bundle',
     '5 ATS-friendly resume templates for Google Docs and Word.', 99),
    ('Cold Email Swipe File',
     '30 proven cold emails for freelancers, with follow-up sequences.', 0)
  ) as v(title, description, price)
  where not exists (select 1 from public.marketplace_items m where m.title = v.title);
end $$;
