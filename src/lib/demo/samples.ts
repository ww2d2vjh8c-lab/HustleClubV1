// Example listings shown when the database has no real content yet (or is
// unreachable), so visitors see what each section looks like. These are never
// written to the database and never link to real detail pages.

export type SampleKind = "courses" | "jobs" | "marketplace";

export type SampleListing = {
  title: string;
  byline: string;
  summary: string;
  price: number | null;
  tags: string[];
};

export const SAMPLE_LISTINGS: Record<SampleKind, SampleListing[]> = {
  courses: [
    {
      title: "Freelancing 101: Land Your First Client",
      byline: "@priya.builds",
      summary: "Pick a niche, build a portfolio in a weekend, and send pitches that actually get replies.",
      price: 0,
      tags: ["8 lessons", "Beginner"],
    },
    {
      title: "Instagram Reels That Convert",
      byline: "@reelsbyarjun",
      summary: "Hooks, scripting and editing workflows used to grow small brands to 100k followers.",
      price: 499,
      tags: ["12 lessons", "Marketing"],
    },
    {
      title: "Build a SaaS with Next.js & Supabase",
      byline: "@devkaran",
      summary: "Auth, payments and deployment — ship a real product from an empty folder.",
      price: 1299,
      tags: ["24 lessons", "Coding"],
    },
    {
      title: "Canva Mastery for Side Hustlers",
      byline: "@designwithmeera",
      summary: "Design thumbnails, posts and pitch decks that look agency-made — no Photoshop needed.",
      price: 299,
      tags: ["10 lessons", "Design"],
    },
  ],
  jobs: [
    {
      title: "Video editor for YouTube channel",
      byline: "@techtalkshindi",
      summary: "Edit 2 long-form videos a week (10–15 min). Cuts, captions, B-roll. Remote.",
      price: 8000,
      tags: ["Freelance", "Remote"],
    },
    {
      title: "Landing page in Next.js",
      byline: "@startupnest",
      summary: "One responsive landing page with a waitlist form. Figma design provided.",
      price: 15000,
      tags: ["Contract", "1 week"],
    },
    {
      title: "Social media manager (part-time)",
      byline: "@chaiandco",
      summary: "Plan and post content for a café brand on Instagram, 3 posts a week.",
      price: 12000,
      tags: ["Part-time", "Monthly"],
    },
    {
      title: "Logo + brand kit for a D2C label",
      byline: "@threadhouse",
      summary: "Logo, colour palette and type pairing for a new clothing brand.",
      price: 6000,
      tags: ["Freelance", "Design"],
    },
  ],
  marketplace: [
    {
      title: "Notion Freelancer OS",
      byline: "@priya.builds",
      summary: "Client CRM, invoice tracker and project board in one Notion template.",
      price: 199,
      tags: ["Template", "Instant download"],
    },
    {
      title: "50 Lightroom Presets — Street Pack",
      byline: "@shotbyrohan",
      summary: "Moody, film-style presets for mobile and desktop Lightroom.",
      price: 349,
      tags: ["Presets"],
    },
    {
      title: "Resume Template Bundle",
      byline: "@careerkit",
      summary: "5 ATS-friendly resume templates for Google Docs and Word.",
      price: 99,
      tags: ["Template"],
    },
    {
      title: "Cold Email Swipe File",
      byline: "@growthwithsam",
      summary: "30 proven cold emails for freelancers, with follow-up sequences.",
      price: 0,
      tags: ["Guide", "PDF"],
    },
  ],
};
