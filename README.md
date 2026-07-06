# Kaam Card

Kaam Card is a hackathon prototype for informal and gig workers in India. It turns a simple transaction CSV into a portable income profile, matches the worker against public welfare schemes using transparent rules, and suggests a practical savings habit based on the worker's own earning pattern.

The goal is not to replace official eligibility checks. The goal is to make a worker's income story easier to understand, explain, and act on in under two minutes.

## What It Does

- Simulated phone login with OTP for a demo-friendly session flow.
- CSV upload or sample datasets for delivery workers, street vendors, and messy data.
- Safe CSV parsing with malformed-row handling instead of app crashes.
- Income profile computation:
  - average daily income
  - income variance
  - good-day threshold
  - bad-day threshold
  - good-day and bad-day counts
- Scheme matching against simplified hardcoded rules for:
  - PM Shram Yogi Maandhan
  - e-Shram
  - Ayushman Bharat PM-JAY
  - PM Jeevan Jyoti Bima Yojana
  - PM Suraksha Bima Yojana
  - Delhi Construction Workers Welfare Board
- Ranked scheme cards with plain-language reasons.
- Arithmetic-based savings suggestion using the computed income profile.
- Mobile-first dashboard with an income chart, scheme cards, savings card, and shareable summary.
- Light/dark theme toggle, interactive grid background, and custom cursor polish for desktop.

## Demo Flow

1. Open the app.
2. Continue with sample data, or enter a phone number and any 4-digit OTP.
3. Upload a CSV or choose a sample dataset.
4. Review parsed rows and skipped malformed rows.
5. Open the dashboard to see income pattern, likely schemes, and a savings rule.
6. Use the sidebar or bottom navigation for Transactions, Insights, and Schemes.
7. Copy the shareable summary if needed.

## Run Locally

This is a static HTML/CSS/JavaScript app. No build step is required.

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 4173
```

Then visit:

```text
http://127.0.0.1:4173
```

## CSV Format

Required columns:

```csv
date,amount,direction
2026-05-01,720,credit
2026-05-02,210,debit
```

Accepted date formats:

- `YYYY-MM-DD`
- `DD-MM-YYYY`
- `DD/MM/YYYY`

Accepted income directions:

- `credit`
- `income`
- `in`
- `deposit`
- `received`
- `cr`

Debit/expense rows are parsed but not counted as income.

## Privacy And Safety

- The app does not ask for Aadhaar, PAN, or full bank account numbers.
- Uploaded transactions are processed in the browser.
- Raw transaction rows are discarded after aggregate income stats are computed.
- The demo session is in memory and phone-keyed.
- No password login is implemented.
- No session token is stored in `localStorage`.
- The only `localStorage` use is the visual light/dark theme preference.
- External scheme links are hardcoded HTTPS links and validated against `.gov.in` / `.nic.in` domains.
- Links found inside uploaded files are treated as inert text and are never followed automatically.

## Prototype Notes

- OTP verification is simulated. Any 4 digits work.
- Scheme matching uses simplified rules for demo clarity.
- This is not an official eligibility determination.
- No account aggregator, bank API, SMS gateway, or government portal submission is connected.
- The app is frontend-only, so there is no server-side user record or database.

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── favicon.svg
├── README.md
└── COMPONENTS/
    └── UI/
        ├── animated-theme-toggler.tsx
        ├── cursor.tsx
        └── interactive-grid-pattern.tsx
```

The live app runs from `index.html`, `styles.css`, and `app.js`. The files in `COMPONENTS/UI` are React reference components matching UI ideas already implemented in the static app.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- No backend
- No package install required

## Hackathon Definition Of Done

A worker can go from sample/uploaded statement to:

- income pattern
- matched schemes with reasons
- a concrete savings suggestion
- shareable summary

without exposing sensitive identity numbers or persisting raw transaction data.
