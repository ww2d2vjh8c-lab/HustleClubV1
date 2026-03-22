# Your Action Checklist
**Everything below requires you to log in — I've done everything else.**
Total time: ~45 minutes. Do it once. Done.

---

## STEP 1 — New GitHub Account (10 min)

You need a new account with your real name. The username `ww2d2vjh8c-lab` looks like a machine account to recruiters.

1. Go to **github.com/signup**
2. Use username: `ayushkaushik` (or `ayush-kaushik` if taken)
3. Use your real email: `coc123.1607@gmail.com`
4. After signing up, go to **Settings → Profile** and fill in:
   - Name: `Ayush Kaushik`
   - Bio: `Full-stack developer · Next.js · Supabase · Electron · CS Graduate`
   - Location: your city
   - Email: `coc123.1607@gmail.com`

---

## STEP 2 — Transfer / Re-upload Repos (10 min)

Easiest approach — create fresh repos on the new account and push:

```bash
# For HustleClub
cd /path/to/HustleClubV1
git remote set-url origin https://github.com/ayushkaushik/HustleClubV1.git
git push -u origin main

# For Bloom Cafe POS
cd /path/to/POS-BASIC-BILLING
git remote set-url origin https://github.com/ayushkaushik/POS-BASIC-BILLING.git
git push -u origin main
```

Or just create new repos on the new account and push everything fresh.

---

## STEP 3 — Profile README (5 min)

This makes your GitHub look professional. GitHub shows this as your profile homepage.

1. On the new account, create a new repo named **exactly** your username (e.g., `ayushkaushik/ayushkaushik`)
2. Make it public
3. Create a file called `README.md`
4. **Copy-paste the content from `docs/GITHUB-PROFILE-README.md`** (already written for you)
5. Update the two `YOUR_USERNAME` placeholders with your real GitHub username
6. Commit

---

## STEP 4 — Deploy HustleClub to Vercel (15 min)

1. Go to **vercel.com** → Sign up with GitHub (use the new account)
2. Click **Add New Project** → Import `HustleClubV1`
3. Vercel will auto-detect Next.js. Under **Environment Variables**, add these 6 variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR-PROJECT.vercel.app` |
| `PAYMENT_PROVIDER` | `mock` |
| `PAYMENT_WEBHOOK_SECRET` | any random string |

4. Click **Deploy**
5. Once deployed, copy the Vercel URL (e.g., `https://hustleclub-xyz.vercel.app`)

**After you have the URL:**
- Open `README.md` in HustleClubV1
- Replace `https://hustleclub.vercel.app` with your real Vercel URL (appears twice — in the badge and at the bottom)
- Commit and push

---

## STEP 5 — Pin Repos on GitHub (2 min)

1. Go to your new GitHub profile
2. Click **Customize your pins**
3. Pin: `HustleClubV1` and `POS-BASIC-BILLING`

---

## STEP 6 — Update Repo Descriptions (3 min)

On GitHub, click each repo → the gear icon next to "About" → add:

**HustleClubV1:**
> Full-stack creator economy platform for India — courses, gig jobs, marketplace. Next.js 16 · TypeScript · Supabase · Razorpay

**POS-BASIC-BILLING:**
> Offline desktop POS system delivered to Bloom Cafe — Electron · SQLite · thermal printing · Windows installer

Also add the live Vercel URL as the Website for HustleClubV1.

---

## What I Already Did For You

- ✅ Rewrote `README.md` for HustleClub (recruiter-facing, with badges, architecture, CI/CD docs)
- ✅ Created `vercel.json` (sets India region `bom1`, security headers, deploy config)
- ✅ Wrote your GitHub profile README (`docs/GITHUB-PROFILE-README.md`) — just copy-paste
- ✅ Created this checklist

---

## After All This — Your Profile Will Look Like

- Real name, real username
- 2 pinned repos with descriptions and live URL
- HustleClub README with badges, architecture diagram, feature breakdown
- Profile README showing both projects, your tech, and what you're building next
- A Vercel URL any recruiter can click and actually see the product

**That's all a recruiter needs to shortlist you.**
