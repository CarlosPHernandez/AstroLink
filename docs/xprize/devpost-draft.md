# Devpost paste draft — AstroLink

Fill Devpost from this file. Do not invent numbers. Blanks are yours.

**Deadline:** 2026-08-17 1:00 PM PT  
**Category:** Professional Services Access (only this one)  
**Site:** https://www.astro-link.space  
**Repo:** https://github.com/CarlosPHernandez/AstroLink  

---

## You still have to do (not code)

1. **Film ≤3 min** — `/booking` with no expert → goals → Match me → named expert. Then brief on mentee dashboard. Say “AI decides who you talk to,” not “AI-powered marketplace.”
2. **Repo access** — make public, or invite `testing@devpost.com` and `judging@hacker.fund`.
3. **Gemini proof** — Production `LLM_PROVIDER=gemini`, then one audit export row with `provider: "gemini"` plus AI Studio / Cloud usage screenshot.
4. **Stripe screenshot** — live mode, one $144 charge, no test cards mixed in.
5. **Cost dollars** — fill the blanks below from Stripe + Supabase + Vercel invoices.

---

## 2.1 Identity (paste)

| Field | Paste |
|-------|--------|
| Project name | AstroLink |
| Tagline | Book a live 1:1 with a verified aerospace expert. AI picks who you talk to. |
| Category | Professional Services Access |
| Built with | Gemini API, Google Stitch, Next.js, Supabase, Stripe, Daily, Vercel, Resend |
| Website | https://www.astro-link.space |
| Repo | https://github.com/CarlosPHernandez/AstroLink |
| Demo video | *(YouTube/Vimeo URL)* |

---

## 2.2 Narrative (500–1000 words)

Aerospace expertise is locked in personal networks, opaque consulting shops, and conferences most buyers cannot reach. If you need a flight controller, a payload integrator, or an astronaut for a real decision, the default path is still “know someone.”

AstroLink is a paid expert network for that access. Buyers book a live 1:1 video session with a verified operator. Price is on the profile. Payment is collected when they book. This is not a course, a chatbot, or a job board.

The business is operated by agents, not a recommendation widget:

- **APX-01 Match** is the default book path. On `/booking` with no expert selected, the buyer writes goals. The configured LLM picks a listed expert and creates the booking. Browse and named profile links still work; those are explicit picks, not matches.
- **APX-10 Path Assessment** writes a free readiness report and, when the model succeeds, names a listed expert (**Book {Name}**). If the model fails, we show a template-report banner. We do not pretend that was a Gemini decision.
- **APX-02 Briefing** writes dual pre-call briefs after payment.
- **APX-12 Settlement** decides completed / no-show / hold after hang-up.
- **APX-03 Recap** only appears when a stored transcript exists.
- **APX-06 Translation** is live captions and localized recap for bilingual sessions.

Google stack: Gemini API (`@google/genai`) for LLM decisions; Google Stitch for the Chris campaign layout. First commit 2026-05-24 (after the May 19 start). Create-Next-App boilerplate is disclosed.

**Traction (locked 2026-08-15, contest window):** $144 arms-length revenue, one paying customer, live Stripe, no related-party charges, no test charges in that number. 36 early-access registrations. 1 completed Path Assessment. 1 consented review. $0 ads. Take rate 20% platform / 80% expert. Team of 3, one full-time.

**Category:** we sell access to named people who have done the work — not generic advice. The path to scale is more listed experts and the same operator loop (match → brief → session → settle), not a new product.

**Do not claim in the form:** every booking is AI-matched; intake auto-blocks ITAR; onboard NF-1860 is auto-audited; a recap exists without a transcript; Stripe test charges or $1 comps are revenue.

**What’s next (one sentence):** grow the listed roster and pay experts from the same settlement record. Do not promise Connect auto-payouts if they are still manual.

---

## 2.3 Revenue (locked + blanks)

| Item | Value |
|------|--------|
| Total arms-length revenue (May 19–Aug 17 2026) | **$144** |
| Paying customers (arms-length) | **1** (2026-08-15) |
| Related-party revenue | **$0** (do not mix team/friends) |
| Test / $1 / comp sessions in “revenue” | **$0** — exclude |
| Marketing spend | **$0** |
| Take rate | 20% platform / 80% expert |

### Revenue by month

| Month | Arms-length | Notes |
|-------|-------------|--------|
| May 2026 | $0 | |
| Jun 2026 | $0 | |
| Jul 2026 | $0 | |
| Aug 2026 | $144 | One live Stripe charge |

### Costs (fill dollars from invoices)

| Line | Amount | Source |
|------|--------|--------|
| Stripe processing on $144 | $______ | Stripe |
| Expert share (80% of $144 = $115.20) reserved / paid | $______ | Manual payout — say so |
| Supabase Pro | $______ | Invoice |
| Vercel Pro | $______ | Invoice |
| Daily | $______ | Invoice |
| LLM (Gemini / OpenAI) | $______ | AI Studio / OpenAI / GCP |
| Other tools | $______ | |
| **Total costs (excl. marketing)** | $______ | |

Save Stripe live screenshot + CSV outside git if they contain PII: do not commit customer emails.

---

## 2.4 Users (locked)

| Metric | Value |
|--------|--------|
| Early-access registrations | 36 |
| Paying customers | 1 |
| Path Assessments completed | 1 |
| Consented reviews | 1 |
| Demo / seed emails | Not customers (`carlos@astrolink.ai`, `chris@astrolink.ai`, `admin@astrolink.ai`) |

Persona line (edit if wrong): early-career and switching professionals who need a real operator conversation, not a course.

---

## Testing instructions (paste)

Production: https://www.astro-link.space (`APP_MODE=full`)

1. Open `/assessment`. Complete the quiz. If the model succeeds you see **Gemini matched you to {Expert}** and **Book {Name}**. If it fails, a **template report** banner — that is not a model match.
2. Open `/booking` with **no** `?mentor=`. Sign in as a mentee. Enter goals, background, and a time at least **2 Eastern calendar days** out. Click **Match me and continue**. The LLM picks a listed expert. **Choose an expert yourself** is optional and is not a match.
3. After payment, mentee dashboard shows the dual brief (APX-02).
4. Join `/session/[id]` at start. After hang-up, settlement writes completed / no-show / hold. Recap only if a stored transcript exists.

Do not treat browse-selected bookings as AI-matched.

Judge accounts: *(add emails + passwords you created for testers — do not commit real passwords to git)*.

---

## Video shot list (≤3:00)

| 0:00–0:20 | Problem: expertise is locked; one sentence who pays |
| 0:20–1:10 | `/booking` no mentor → goals → Match me → named expert on screen |
| 1:10–1:50 | Paid brief (APX-02) on mentee dashboard |
| 1:50–2:20 | Assessment **Book {Name}** or settlement / recap only if real |
| 2:20–2:50 | $144, 36 users, $0 ads — say “one paying customer” |
| 2:50–3:00 | Category: Professional Services Access |

Say “the agent decides who you talk to.” Do not say “AI-powered.”

---

## Stage One self-check

| Must be true | Status |
|--------------|--------|
| Live URL works | Yes |
| Category = Professional Services Access | You set on Devpost |
| Gemini used in **deployed** app | Prove with export + usage screenshot |
| ≥1 Google Cloud product | Gemini API and/or Vertex; invoices if claiming Cloud |
| Built after 2026-05-19 | First commit 2026-05-24; disclose Next.js template |
| Repo reachable by judges | Public or shared |
| Video public ≤3 min | You film |
