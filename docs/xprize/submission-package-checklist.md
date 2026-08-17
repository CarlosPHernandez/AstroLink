# Build with Gemini XPRIZE — Submission Package Checklist

**Project:** AstroLink  
**Version:** 0.12.0.0  
**Category:** Professional Services Access  
**Competition:** Build with Gemini XPRIZE ($2M pool)  
**Devpost:** https://xprize.devpost.com/  
**Rules:** https://xprize.devpost.com/rules · https://www.geminixprize.com/rules  
**Production URL:** https://astro-link.space  
**Code repository:** https://github.com/CarlosPHernandez/AstroLink  
**Checklist date:** 2026-08-07  
**Submission deadline:** 2026-08-17 · 1:00 PM Pacific Time  
**Judging period:** 2026-08-18 – 2026-09-15  
**Winners announced (approx):** 2026-09-25  

**Status legend**

| Mark | Meaning |
|------|---------|
| DONE | Artifact exists in product/repo and is usable |
| PARTIAL | Built in product, packaging or evidence incomplete |
| TODO | Required for submission; not ready |
| BLOCKER | Blocks Stage One / Stage Two credibility if missing |
| N/A | Not applicable unless conditions apply |

Use this document as the single ops checklist for the Devpost submission. Checkboxes are operational: check only when the evidence file is saved in the submission folder (see Section 10).

---

# 1. Competition frame (what judges score)

## 1.1 Stage One — pass / fail viability

| Requirement | Status | AstroLink evidence / action |
|-------------|--------|-----------------------------|
| Fits theme: business that operates with AI | DONE | Paid expert marketplace with production agents |
| Fits a category | DONE | Professional Services Access |
| Uses at least one Google Cloud product | PARTIAL | Gemini API (`@google/genai`); Stitch used for Chris campaign design. Confirm Gemini calls in **production** logs. |
| Gemini used for ≥1 LLM call in deployed app | PARTIAL | Code path exists; must prove production `provider: gemini` in audit export |
| Project newly built in Submission Period (from 2026-05-19) | PARTIAL | Document pre-existing scaffolds vs contest-period work in submission text |
| Working product URL for judges | DONE | https://astro-link.space (+ judge test credentials package) |
| Repo accessible to judges | PARTIAL | Repo exists; if private, share with testing@devpost.com and judging@hacker.fund |

## 1.2 Stage Two — equally weighted criteria

| Criterion | Weight | What wins | AstroLink posture |
|-----------|--------|-----------|-------------------|
| **Business Viability** | 1/3 | Real arms-length revenue, real users, sustainable model | PARTIAL — product can charge; revenue evidence pack not assembled here |
| **AI-Native Operations** | 1/3 | AI live in production executing key decisions continuously | PARTIAL — multi-agent stack + T8 export code; need volume + Gemini lock + screenshots |
| **Category Impact** | 1/3 | Redefines access or credible path to widespread adoption | PARTIAL — vertical thesis strong; scale/roster still early |

**Grand prize reality:** feature completeness is not enough. Arms-length GMV + continuous AI decision evidence + a clear 3-minute story decide top ranks.

---

# 2. Devpost form fields — master map

Complete every field on “Enter a Submission.” Save evidence under `docs/xprize/submission-pack/` (create at fill time).

## 2.1 Project identity

| Field | Required | Status | Draft / source |
|-------|----------|--------|----------------|
| Project name | Yes | TODO | **AstroLink** |
| Tagline (short) | Yes | TODO | *Book verified aerospace experts. AI runs match, prep, session synthesis, and translation.* |
| Category | Yes | TODO | **Professional Services Access** |
| Built with (tools) | Yes | TODO | Gemini API, Google Stitch (design), Next.js, Supabase, Stripe, Daily, Vercel, Resend |
| Cover image / gallery | Yes | PARTIAL | `public/og/`, `design/og-cards/`, expert portraits; pick 3–5 clean screenshots |
| Website URL | Yes | DONE | https://astro-link.space |
| Demo video URL | Yes | TODO | ≤3 min on YouTube/Vimeo/Youku, public |
| Code repository URL | Yes | PARTIAL | https://github.com/CarlosPHernandez/AstroLink — verify judge access |
| Testing instructions | Yes | TODO | Judge account, golden path, env notes (Section 8) |
| English materials | Yes | DONE | Product + docs in English |

### Checkbox — identity

- [ ] Project name finalized on Devpost
- [ ] Tagline ≤ ~120 characters, category-aligned
- [ ] Category set to Professional Services Access (only one prize eligible)
- [ ] Cover image uploaded (1920×1080 or platform default)
- [ ] Gallery: landing, Path Assessment, booking, dual brief, session/captions, recap, decision-log export
- [ ] Production URL live and HTTPS healthy
- [ ] Repo public **or** private shared with testing@devpost.com + judging@hacker.fund
- [ ] Testing instructions pasted (credentials + path)

## 2.2 Written description (500–1000 words recommended by orientation sessions)

Judges want: problem, who pays, how AI runs the business, category relevance, traction.

### Structure (paste into Devpost)

1. **Problem** — aerospace expertise locked in networks and conferences  
2. **Solution** — bookable verified operators + full session OS  
3. **Who pays** — mentees / operators / analysts; experts earn  
4. **AI-native operations** — APX agents table + “decisions, not chat”  
5. **Google stack** — Gemini production + Stitch design  
6. **Traction** — users, revenue (arms-length), languages, sessions  
7. **Category impact** — Professional Services Access for high-stakes domains  
8. **What’s next** — roster, Connect payouts, bilingual scale  

### Checkbox — narrative

- [ ] Draft written (source: README Gemini section + this checklist Section 3)
- [ ] No overclaim of auto-match if most bookings are direct-pick
- [ ] Related-party revenue not mixed into “customer” claims
- [ ] Pre-existing templates/boilerplate disclosed if any
- [ ] Peer review: non-engineer reads and restates the business in one sentence

## 2.3 Revenue evidence (BLOCKER for top prizes)

Official requirements:

| Item | Required | Status | How to produce |
|------|----------|--------|----------------|
| Total revenue (USD), hackathon period | Yes | TODO | Stripe Dashboard → Payments / balance; filter May 19–Aug 17 2026 |
| Revenue by month (May, Jun, Jul, Aug 2026) | Yes | TODO | Monthly pivot of succeeded charges with `metadata.app = astrolink` |
| Total costs (excl. marketing) | Yes | TODO | Hosting, LLM API, Daily, Stripe fees, contractors, tools |
| Marketing & customer acquisition spend | Yes | TODO | Ads, sponsorships, promo discounts; **disclose even if $0** |
| Related-party revenue (separate) | Yes | TODO | Team, family, pre-existing relationships — **do not hide** |
| Arms-length third-party customers | Yes | TODO | Distinct paying emails/users with short personas |

### Checkbox — revenue pack

- [ ] Stripe export CSV saved (`submission-pack/finance/stripe-payments.csv`)
- [ ] Monthly table filled (Section 6 template)
- [ ] Related-party list with amounts and reason codes
- [ ] Cost one-pager with line items
- [ ] Marketing spend line (even $0)
- [ ] Screenshot: Stripe production (or clearly labeled test vs live — live preferred for claims)
- [ ] Currency conversions documented if any non-USD
- [ ] Comp grants / $0 sessions excluded from “revenue” or labeled free

**Integrity rule:** Judges may request customer contact info. Only include people who consented to be referenced.

## 2.4 User evidence

| Item | Required | Status | Source |
|------|----------|--------|--------|
| Number of individual users | Yes | PARTIAL | 36 registered early-access users; 1 Path Assessment; 1 paying customer; 1 consented review |
| High-level breakdown of who users are | Yes | TODO | Students, operators, analysts, career switchers, geo |
| Testimonials / feedback | Yes | TODO | Session reviews, emails, Path Assessment feedback (consented) |
| Related-party users noted | Yes | TODO | Seed/demo accounts not counted as customers |

### Checkbox — users

- [ ] Headcount: registered users, waitlist, paying customers (separate numbers)
- [ ] Persona breakdown (table)
- [ ] 3–10 short testimonials with permission
- [ ] Exclude demo emails (`carlos@astrolink.ai`, etc.) from “customer” claims

## 2.5 Product running evidence (AI-Native)

| Item | Required | Status | Source in AstroLink |
|------|----------|--------|---------------------|
| Agent execution logs | Yes | PARTIAL | `audit_log` + `LLM_DECISION` via `GET /api/admin/audit-logs/export` |
| API usage records | Yes | PARTIAL | Google AI Studio / Gemini usage; OpenAI if used (disclose) |
| Dashboards / screenshots | Yes | PARTIAL | Admin metrics, mentor dashboard, mentee brief UI |
| Continuous production ops | Yes | PARTIAL | Production webhooks Stripe + Daily; cron video expire |

### Checkbox — AI ops evidence

- [ ] Export JSON: `astrolink-xprize-decisions-YYYY-MM-DD.json` (schema `t8-v1`)
- [ ] Confirm majority of production decisions show `provider: "gemini"`
- [ ] Screenshot Google AI / Gemini usage for contest window
- [ ] Screenshot admin audit or metrics page
- [ ] One annotated screenshot sequence of APX-02 brief + APX-03 recap + APX-06 captions
- [ ] Note E2E stubs are **not** production evidence (`E2E_STUB_LLM` must be off in prod)

## 2.6 Organization / team

| Item | Required | Status | Notes |
|------|----------|--------|-------|
| Entrant type (individual / team / org <25 employees) | Yes | DONE | Small team of 3; one full-time |
| Representative authorized | Yes | TODO | One Devpost submitter |
| Corporate ID (if organization) | If org | TODO | EIN / registration doc as required |
| Team member names | Recommended | TODO | Credit builders for publicity |

---

# 3. Product fact sheet (for judges and video)

## 3.1 One-liner

AstroLink is a paid aerospace expert network: anyone can discover and book verified operators for live 1:1 sessions, while Gemini-powered agents run matching as the default `/booking` path, dual pre-session briefs, post-session synthesis, bilingual captions/recap, and trust triage.

## 3.2 Category thesis

| | |
|--|--|
| **Category** | Professional Services Access |
| **Problem** | High-stakes aerospace knowledge is locked behind personal networks, opaque consulting, and conferences most buyers cannot access |
| **Product** | Marketplace + AI session operating system |
| **Why not Education-only** | Primary sale is expert access (time), not coursework. Path Assessment supports discovery. |

## 3.3 Stack (submission “Built with”)

| Layer | Choice | Judge note |
|-------|--------|------------|
| LLM | Gemini via `@google/genai` (`LLM_PROVIDER=gemini`) | Required path for contest |
| Optional LLM | OpenAI fallback | Allowed; do not let it silently dominate production |
| App | Next.js 16 (App Router) on Vercel | Production: astro-link.space |
| Data | Supabase (Postgres, auth, storage) | Hosted project |
| Payments | Stripe PaymentIntents (`metadata.app=astrolink`) | Immediate capture at launch |
| Video | Daily.co private rooms + webhooks | Transcription for recap when enabled |
| Design tooling | Google Stitch (Chris campaign) | Google stack story |
| Email | Resend | APX-08 |

## 3.4 AI agents (production)

Be precise in the video: **LLM decision agents** vs **workflow agents**.

| Agent | Role | LLM? | Key decision for judges |
|-------|------|------|-------------------------|
| APX-01 Booking | Default book path: match a listed expert from goals; browse is optional | Yes (match) | Who you talk to |
| APX-02 Briefing | Dual mentee + expert pre-session briefs | Yes | Prep both sides |
| APX-03 Session | Post-call summary + actions from transcript | Yes | Capture session value |
| APX-04 Compliance | Intake / transcript flags (ITAR-adjacent keywords) | Yes | Trust triage |
| APX-06 Translation | Live captions + localized recap (aerospace glossary) | Yes | Cross-language access |
| APX-08 Notifications | Confirmation email + calendar | No (workflow) | Ops automation |
| APX-09 Reviews | Moderate / publish session feedback | Yes | Trust at scale |
| APX-10 Path Assessment | Free readiness report → upsell | Yes | Funnel + discovery |

**Code anchors**

- LLM + audit: `src/lib/llm.ts`, `src/lib/llm-audit.ts`
- Export: `src/lib/xprize-decision-logs.ts`, `src/app/api/admin/audit-logs/export/route.ts`
- Agents: `src/services/agents/*`

**Honesty note for judges:** Default `/booking` (no `?mentor=`) is APX-01 match. Directory / `?mentor=` browse is explicit selection (`matchedByGemini: false`). Match failure is `422 match_failed` (no silent fallback expert). LLM rate limits on match stay `429`. Do not claim every booking is AI-matched.

## 3.5 Paid surfaces (business model)

| Offer | Price shape | Status |
|-------|-------------|--------|
| Live 1:1 session | Expert rate / duration (server-authoritative) | DONE |
| Chris campaign sessions | Campaign menu + referrer tiers | DONE |
| Pre-call brief add-on (legacy SKU path) | Bundled into live in practice | PARTIAL |
| Personalized video request | Guest checkout async video | DONE |
| Space Path Assessment | Free AI report | DONE |
| Written expert review of assessment | $50 tripwire | DONE |
| Comp 15-min grants | Ops $0 sessions | DONE (not revenue) |

Sustainability narrative (honest): platform captures payment at launch; mentor Connect payouts deferred / manual settlement documented in ops plans.

## 3.6 Public product routes (demo map)

| Route | Purpose |
|-------|---------|
| `/` | Landing + expert teaser + Path Assessment CTA |
| `/experts` | Full directory |
| `/experts/[slug]` | Profile, book, video request |
| `/assessment` | Space Path Assessment funnel |
| `/booking` | Default: Gemini match from goals; `?mentor=` is explicit pick |
| `/talk-with-chris` | Named expert campaign landing |
| `/dashboard/mentee` | Briefs, join, recaps |
| `/dashboard/mentor` | Sessions, earnings, listing |
| `/session/[bookingId]` | Daily room + captions |
| `/early-access` | Waitlist (if `APP_MODE=waitlist`) |

---

# 4. AI-Native Operations checklist (score driver)

## 4.1 Production lock (do before any evidence export)

| Check | Status | Action |
|-------|--------|--------|
| `LLM_PROVIDER=gemini` on Vercel **Production** | TODO | Currently **openai** until Vertex/Gemini billing is set. Guard now fails only the silent OpenAI default. |
| `GEMINI_API_KEY` present in Production | TODO | |
| `E2E_STUB_LLM` not true in Production | TODO | Stubs invalidate evidence |
| `SKIP_STRIPE_PAYMENTS` false / unset in Production | TODO | Hard-disabled in prod builds by design — still verify |
| `APP_MODE` intended surface | TODO | Full app for judge demo path, or document waitlist + campaign |
| Stripe live vs test | TODO | Live keys only in Production env; never in Preview |
| Daily webhooks production | TODO | `meeting.ended` (+ transcript events if claiming grounded recap) |
| Transcription storage if claiming durable transcripts | TODO | See `docs/how-to/daily-transcription-storage-preflight.md` |

### Checkbox — production lock

- [ ] Vercel Production env screenshot (redact secrets)
- [ ] One real production booking generates `LLM_DECISION` rows with `provider: gemini`
- [ ] Export sample attached to pack
- [ ] No judge demo relies on `ENABLE_DEMO_AUTH` unless labeled “demo auth for testing only”

## 4.2 Decision log export procedure

1. Sign in as admin on production (or staging with real LLM if production not ready — **prefer production**).
2. Call `GET /api/admin/audit-logs/export?limit=500&since=2026-05-19T00:00:00Z`
3. Save file as `submission-pack/ai/astrolink-xprize-decisions-<date>.json`
4. Spot-check: `schema_version` = `t8-v1`, `decision_count` > 0, agents APX-01/02/03/06/09/10 present if claimed
5. Optional: admin UI list `GET /api/admin/audit-logs` for screenshots

### Checkbox — T8

- [ ] Export JSON saved
- [ ] Count of Gemini vs OpenAI decisions tabulated
- [ ] Redact any accidental PII in payload summaries before sharing publicly
- [ ] Update `docs/d1-implementation-plan.md` T8 status to match reality (docs currently lag)

## 4.3 Golden path for video (AI visible on screen)

Recommended single story (under 3 minutes of footage):

1. Path Assessment → personalized Gemini report (APX-10); **Book {Name}** when a listed expert was recommended  
2. Bare `/booking` (no `?mentor=`) → goals → APX-01 match → dual brief on mentee dashboard (APX-02)  
3. Join session → show live captions if bilingual story (APX-06)  
4. Post-session recap actions (APX-03)  
5. Cut to decision log / export (ops evidence)  

Optional B-roll: directory, Stripe success, mentor dashboard, review moderation (APX-09).

### Checkbox — video production

- [ ] Script timed to ≤2:50 (leave buffer)
- [ ] Screen recording 1080p, no private keys visible
- [ ] Face/talking head optional; product must be primary
- [ ] Uploaded public; link in Devpost
- [ ] No unlicensed music / third-party trademarks without permission

---

# 5. Business Viability checklist (score driver)

## 5.1 Revenue table (fill before submit)

| Month | Arms-length revenue (USD) | Related-party (USD) | Paying customers (count) | Notes |
|-------|---------------------------:|--------------------:|-------------------------:|-------|
| May 2026 (from May 19) | 0 | 0 | 0 | |
| June 2026 | 0 | 0 | 0 | |
| July 2026 | | 0 | | Confirm month of the $144 live charge |
| August 2026 (through Aug 17) | | 0 | | Confirm month of the $144 live charge |
| **Total** | **144** | **0** | **1** | Arms-length; live Stripe; no test/$1 charges |

| Cost category | Amount (USD) | Description |
|---------------|-------------:|-------------|
| Hosting (Vercel, etc.) | | Vercel Pro |
| Supabase | | Supabase Pro |
| Daily | | |
| Gemini / LLM API | | OpenAI until Vertex/Gemini billing is live |
| Stripe fees | | Standard Stripe fee on $144 |
| Email (Resend) | | |
| Contractors / tools | | |
| Expert settlement | 80% of session | Expert keeps 80%; platform 20% |
| **Total costs (excl. marketing)** | | Fill dollar amounts from invoices |
| Marketing & CAC | **0** | No paid advertising |

## 5.2 Unit economics (short narrative)

| Metric | Value | Notes |
|--------|------:|-------|
| Typical live session price | | Chris vs general roster |
| Platform take / fee model | | Immediate capture; Connect deferred |
| Expert settlement method | | Manual payouts at launch |
| Free funnel | Path Assessment | Conversion to book / $50 written review |
| Gross margin drivers | | LLM cost per session, Daily minutes |

### Checkbox — viability story

- [ ] Numbers table complete and consistent with Stripe export
- [ ] Related-party disclosed
- [ ] Sustainability paragraph written (not “we’ll figure out later”)
- [ ] At least one non-related-party paid customer documented if claiming commercial traction
- [ ] Comp grants excluded from revenue

## 5.3 User & GTM evidence

| Channel | Status | Evidence to attach |
|---------|--------|--------------------|
| Chris Sembroski campaign | PARTIAL | `/talk-with-chris`, slot metrics, referrers |
| Waitlist / early access | PARTIAL | Supabase early_access_signups |
| Path Assessment funnel | PARTIAL | `spa_*` analytics events, assessment rows |
| Expert activation | PARTIAL | Invite / claim flows |
| Press page | PARTIAL | `/press` content |

### Checkbox — GTM

- [ ] User count snapshot dated
- [ ] Campaign metrics export (admin Chris metrics if available)
- [ ] Path Assessment volume + conversion notes
- [ ] 1–2 non-Chris experts with completed sessions (strengthens platform thesis)

---

# 6. Category Impact checklist

| Question judges ask | Your answer (draft) | Status |
|---------------------|---------------------|--------|
| Who is “everyday people” here? | Students, early-career operators, analysts, founders outside aerospace networks | TODO polish |
| How is access redefined? | Named experts + escrow + AI prep/synthesis/translation vs opaque networks | PARTIAL |
| Path to 100k+ impact? | Not 100k astronaut calls — Path Assessment + bilingual access + cohort pilots + adjacent verticals | TODO polish |
| Why aerospace first? | Domain hardness (compliance, scarcity, high stakes) proves Professional Services Access | DONE thesis |
| Credible scale? | Roster depth, languages, completed sessions, orgs | PARTIAL |

### Checkbox — impact

- [ ] One paragraph “redefines access” without overclaiming scale
- [ ] Metrics that show breadth (assessments, locales, sessions) not only celebrity
- [ ] Optional: education adjacency called secondary, not competing category claim

---

# 7. Eligibility & compliance gates

| Rule | Status | Action |
|------|--------|--------|
| Entrant age / org <25 employees | TODO | Confirm |
| Not in OFAC-restricted jurisdiction | TODO | Confirm |
| No conflict with Sponsor/Admin preferential support | TODO | Confirm |
| Original work / IP owned by entrant | PARTIAL | Third-party SDKs licensed (Stripe, Daily, Supabase, Google) — OK if authorized |
| Disclose pre-existing templates/boilerplates | TODO | Next.js app scaffold, shadcn patterns, etc. |
| Third-party data authorized | PARTIAL | Expert likeness/bios need rights; media in `public/` |
| English submission | DONE | |
| Response window for verification (2 business days) | TODO | Staff inbox monitored Aug 18–Sep 15 |

### Checkbox — legal/eligibility

- [ ] Eligibility statement written
- [ ] Expert media rights confirmed for gallery/video
- [ ] Privacy: users told if testimonials shared with judges
- [ ] Team representative named

---

# 8. Judge testing package

Judges may or may not deep-test. Still provide a frictionless path.

## 8.1 Credentials & mode

| Item | Value / instruction | Status |
|------|---------------------|--------|
| Base URL | https://astro-link.space | DONE |
| Judge login | Create dedicated accounts; avoid production admin secrets in public text | TODO |
| Role matrix | mentee / mentor / (optional admin read-only) | TODO |
| Payment | Stripe test card **or** pre-provisioned booking if live-only | TODO |
| LLM | Real Gemini (no stubs) | TODO |
| Dual device | Optional: `docs/how-to/demo-dual-device-video.md` | DONE doc |

**Do not** put production service-role keys or webhook secrets in Devpost.

## 8.2 Golden path script (copy into Testing Instructions)

1. Open production URL.  
2. Sign in as judge mentee.  
3. Complete Path Assessment **or** open `/experts` and pick a listed expert.  
4. Book a short session (or use provisioned booking).  
5. Open mentee dashboard → open dual AI brief.  
6. Join `/session/[id]` (or view completed recap if time-shifted demo).  
7. Optional mentor login to join same room.  
8. Optional admin: download decision log export.  

Fallback if live video blocked: pre-recorded clip in submission video + static booking with completed recap already on account.

### Checkbox — testing pack

- [ ] Accounts created and smoke-tested within 48h of deadline
- [ ] Instructions ≤1 page
- [ ] Known failure modes documented (transcription storage, join window, lead time)
- [ ] Contact email for live demo request

## 8.3 Internal rehearsal (before submit)

Use: `docs/how-to/video-session-demo.md`, `docs/tutorial/first-video-session.md`, `docs/tutorial/bidirectional-live-captions.md`.

- [ ] Cold run of golden path twice without engineer help
- [ ] Capture backup screen recordings if live fails during judging
- [ ] Verify join window / lead-time rules won’t block judge same-day book

---

# 9. Repo & engineering readiness (support, not a scoring criterion)

Judges may open the repo. Present a clean story.

| Item | Status | Notes |
|------|--------|-------|
| README XPRIZE section | DONE | Category, agents, links |
| VERSION / CHANGELOG | DONE | 0.12.0.0 Path Assessment |
| Decision log export | DONE (code) | Package evidence still TODO |
| E2E golden path | DONE | Playwright; not a substitute for production proof |
| Env example documents Gemini primary | DONE | `.env.example` |
| Dual booking paths (Chris vs generic) | PARTIAL debt | Prefer one path in demo video |
| D1 plan T8 checkbox | STALE | Code exists; docs say “Not started” — fix before judges read docs |

### Checkbox — repo hygiene for judges

- [ ] README “how to run” works for interested technical judges
- [ ] No secrets in repo
- [ ] Private repo invites sent if needed
- [ ] Optional: short `docs/xprize/README.md` pointer to this checklist

---

# 10. Submission pack folder layout

Create before deadline (gitignored if it contains PII/financials, or store offline):

```text
docs/xprize/submission-pack/
  README.md                 # index of files + owners
  narrative/
    devpost-description.md
    tagline.txt
    built-with.txt
  video/
    script.md
    final-url.txt
    raw-recordings/         # optional, offline
  finance/
    revenue-by-month.md
    costs.md
    marketing-spend.md
    related-party.md
    stripe-export.csv
    screenshots/
  users/
    user-counts.md
    personas.md
    testimonials.md         # with consent flags
  ai-ops/
    astrolink-xprize-decisions-*.json
    gemini-usage-screenshots/
    agent-ui-screenshots/
  testing/
    judge-instructions.md
    credentials.private.md  # DO NOT commit if secrets
  eligibility/
    entrant-type.md
    team.md
  gallery/
    01-landing.png
    02-assessment.png
    03-booking.png
    04-brief.png
    05-session.png
    06-recap.png
    07-decision-export.png
```

### Checkbox — pack completeness

- [ ] Folder created
- [ ] All BLOCKER items from Section 11 closed
- [ ] Second person review of numbers vs Stripe
- [ ] Devpost draft saved before deadline buffer (48h recommended)
- [ ] Final submit click before 2026-08-17 1:00 PM PT

---

# 11. Priority backlog (what to do next)

## BLOCKERS (do first)

1. **Arms-length revenue pack** — monthly table + Stripe export + related-party split  
2. **User evidence pack** — counts, personas, consented quotes  
3. **Gemini production lock** + decision-log export with `provider: gemini`  
4. **≤3 minute public demo video** covering viability + AI decisions + category  
5. **Judge testing instructions** + working credentials  
6. **Repo access** for Devpost/XPRIZE test addresses if private  

## HIGH (strong runner-up / category prize)

7. Path Assessment conversion stats (free → paid)  
8. Non-Chris expert completed paid sessions  
9. Gallery screenshots polished  
10. Written description peer-reviewed  
11. Cost + marketing spend one-pager  

## MEDIUM (polish / risk reduction)

12. Align D1 T8 docs with shipped export  
13. One golden path only in video (avoid dual-product confusion)  
14. Backup recordings for judging period  
15. Monitor verification email 2-business-day SLA  

## LOW (post-submit or nice-to-have)

16. Dual booking UI consolidation (code quality, not prize)  
17. Stripe Connect restore for sustainability narrative v2  
18. Broader Google Cloud (Vertex/Cloud Run) — optional story only  

---

# 12. Final submit-day checklist (print this page)

**T-48 hours**

- [ ] Revenue numbers frozen and dual-checked  
- [ ] Video final cut uploaded; link works in incognito  
- [ ] Decision log export refreshed from production  
- [ ] Judge accounts re-tested  

**T-24 hours**

- [ ] Devpost draft complete (all required fields green)  
- [ ] Gallery + cover uploaded  
- [ ] Testing instructions final  
- [ ] Team representative available through judging period  

**T-2 hours**

- [ ] Production site health check (landing, auth, book, dashboard)  
- [ ] No deploy that risks golden path  
- [ ] Related-party and marketing spend fields filled (even $0)  

**Submit**

- [ ] Click submit on Devpost before **2026-08-17 1:00 PM PT**  
- [ ] Screenshot confirmation page  
- [ ] Archive submission-pack zip offline  

**Judging period**

- [ ] Inbox monitored for verification requests (2 business days)  
- [ ] Live demo ready if called  
- [ ] Financial docs ready for deeper diligence  

---

# 13. One-page score self-audit

Rate honestly 1–5 before submit. Grand prize contenders are usually 4–5 on all three.

| Criterion | Self-score (1–5) | Weakest evidence | Next action |
|-----------|------------------:|------------------|-------------|
| Business Viability | | | |
| AI-Native Operations | | | |
| Category Impact | | | |

**Minimum bar to submit with pride:** product works, Gemini in production, honest finance table, clear category story, watchable video.

**Minimum bar for grand prize contention:** meaningful arms-length revenue, continuous AI decision volume, multi-user proof beyond team, video that makes a non-technical judge “get it” in 90 seconds.

---

# 14. Quick reference — key links & code

| Resource | Link / path |
|----------|-------------|
| Devpost | https://xprize.devpost.com/ |
| Official rules | https://xprize.devpost.com/rules |
| Gemini XPRIZE site | https://www.geminixprize.com/ |
| Production | https://astro-link.space |
| Repo | https://github.com/CarlosPHernandez/AstroLink |
| Decision export API | `GET /api/admin/audit-logs/export` |
| Decision formatter | `src/lib/xprize-decision-logs.ts` |
| LLM provider | `src/lib/llm.ts` (`LLM_PROVIDER=gemini`) |
| Agents | `src/services/agents/` |
| Demo runbook | `docs/how-to/video-session-demo.md` |
| Stripe cutover | `docs/how-to/stripe-production-cutover.md` |
| Captions tutorial | `docs/tutorial/bidirectional-live-captions.md` |
| This checklist | `docs/xprize/submission-package-checklist.md` |

---

# 15. Owner assignment (fill in)

| Workstream | Owner | Due | Done |
|------------|-------|-----|------|
| Finance / Stripe | | Aug __ | [ ] |
| User evidence / testimonials | | Aug __ | [ ] |
| Gemini lock + decision export | | Aug __ | [ ] |
| Demo video | | Aug __ | [ ] |
| Devpost form | | Aug __ | [ ] |
| Judge testing pack | | Aug __ | [ ] |
| Gallery / screenshots | | Aug __ | [ ] |
| Second-person review | | Aug __ | [ ] |

---

*End of checklist. Generate or refresh this PDF after major evidence updates. Do not treat code shipping as submission completion.*
