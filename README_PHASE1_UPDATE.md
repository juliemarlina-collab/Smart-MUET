# Smart MUET Guide Phase 1 — Original Style Update

This is **not a redesign**. It is a drop-in enhancement for the existing
`juliemarlina-collab/Smart-MUET-Guide` codebase.

## Protected original design
Keep the original repo's:
- `index.html`
- `css/muet-guide.css`
- `css/responsive-fix.css`
- `js/muet-shared.js`
- all `assets/heroes/*.svg`
- original Home / Vault / Progress / Profile flow
- Sora + DM Sans typography
- teal app shell, black outlines, yellow/blue/pink/green accents
- original vault and badge system

## What this update adds
1. MUET session selection during registration.
2. Personal Speaking date (from MUET/D slip) in Profile.
3. A prominent live countdown: Days / Hours / Minutes / Seconds.
4. Exam Readiness score based on meaningful preparation:
   - practice performance 45%
   - 4-skill coverage 20%
   - Vault journey 20%
   - exam-preparation checklist 15%
5. Exam Ready checklist.
6. Official MPM quick access:
   - MUET/D slip
   - official timetable
   - result service
   - e-Certificate
7. Email-based restore/login through Apps Script.
8. Activity tracking for testing/research.
9. Backend CONFIG so future exam dates can be changed without rewriting the UI.

## Installation into the NEW repo
Start the new repo from a copy of the original Smart-MUET-Guide repository.

Then copy these files into it:

- Replace: `js/backend-config.js`
- Add: `js/exam-ready.js`
- Add: `css/exam-ready.css`
- Use: `apps-script/Code.gs` in a new Apps Script project

No replacement `index.html` is required. The updated `backend-config.js` automatically
loads the new Exam Ready CSS and JavaScript, so the original homepage remains intact.

## Apps Script
1. Create a Google Sheet.
2. Copy `apps-script/Code.gs` to Apps Script.
3. Replace `SHEET_ID`.
4. Run `setupSmartMuetSheets()`.
5. Deploy as Web App.
6. Copy the deployment URL.
7. Paste it into `js/backend-config.js` as `SMART_MUET_BACKEND_URL`.

## Important login note
This phase uses the student's email as the progress key and restore mechanism.
It does **not** store a password. A later step can add verified Google Identity
Sign-In if you want account-level authentication.

## Session 3 official timing used in this build
The default Session 3 written-test countdown targets **17 October 2026 at 8:00am
Malaysia time**. Students should enter their own Speaking date from the MUET/D slip,
because their individual Speaking date is one of the official Session 3 dates.

## New-repo principle
"Prepare with Purpose. Walk In Ready."

Every returning student should immediately see:
- Which MUET session am I sitting?
- How long until my exam?
- How ready am I?
- What should I do next?


## Splash-page addition

The new repo entry flow is now:

`index.html → splash.html → app.html`

### Required rename in the new repo

Rename the ORIGINAL Smart-MUET-Guide `index.html` to:

`app.html`

Do not rewrite its content.

Then copy the new:
- `index.html`
- `splash.html`
- `css/splash.css`

into the root of the new repo.

This preserves the full original Smart MUET application while adding a clean branded entry experience.
