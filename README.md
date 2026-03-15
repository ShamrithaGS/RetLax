# RetLax. Retirement Planning Calculator
### by HDFC Mutual Fund · Investor Education Tool

RetLax is a retirement planning calculator that's easy to use and helps people understand how much they need to save for a comfortable retirement. This calculator is built with Next.js 15.5.9. Is very accessible.

## What is RetLax?
RetLax is a tool that helps people plan for their retirement. It shows them how much they need to save to have a life after they stop working. The results from RetLax are for purposes only and do not guarantee anything.

## Features
•	RetLax has a 4-Step Guided Wizard that makes it easy to use.
•	It also has Inflation Bucketing which means it separates rates for types of expenses like general, medical and lifestyle expenses.
•	RetLax gives credit for Existing Savings so people can see how their current savings will help them in retirement.
•	It also has a Top-Up SIP feature that helps people save more each year.
•	Uses Monte Carlo Simulation to show how different scenarios might play out.
•	It estimates the Break- Age, which is the age when the retirement savings will run out.
•	Has an Inflation-Adjusted Depletion Table that shows how the savings will be used over time.
•	The What-If Explorer lets people see how different choices might affect their retirement savings.
•	Also has a Scenario A vs B Comparison feature that lets people compare scenarios side by side.
•	Keeps a record of all the changes made to the assumptions so people can see how they affected the results.
•	RetLax does a Sensitivity Analysis to show how different factors might affect the results.
•	It is WCAG 2.1 AA Compliant which means it is accessible to people with disabilities.
•	RetLax can be used offline. Is fully responsive so it works well on all devices.
•	Has a Dark Mode and can be printed or saved as a PDF.
•	All the inputs are saved in the URL so people can share their results with others.
•	RetLax has a disclaimer on every page to remind people that the results are illustrative and not a guarantee.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.9 |
| Runtime | Node.js 22.11.0 |
| Language | TypeScript |
| Styling | Pure CSS (no Tailwind) |
| Fonts | Montserrat (Google Fonts) |
| Testing | Jest + ts-jest |

## Getting Started
bash
npm install
npm run dev      # → http://localhost:3000
npm run build    # Production build
npm test         # Run 25 unit tests

## Project Structure
retirement-calculator/
├── __tests__/
│   └── retirement.test.ts       # 25 unit tests covering all core functions
├── app/
│   ├── globals.css              # Brand design system, dark mode, print, PWA
│   ├── layout.tsx               # Root layout, metadata, SW registration
│   └── page.tsx                 # Main RetLax page
├── components/
│   ├── steps/
│   │   ├── Step1Age.tsx         # Age & timeline (focus-managed)
│   │   ├── Step2Expenses.tsx    # Expenses + fraction guards (focus-managed)
│   │   ├── Step3Assumptions.tsx # Lifestyle presets, returns, existing savings
│   │   └── Step4Results.tsx     # Full results dashboard
│   └── ui/
│       ├── AssumptionChangeLog.tsx   # Diff from defaults
│       ├── DonutChart.tsx            # Pure SVG donut
│       ├── FormComponents.tsx        # Slider, Input, Tooltip (unique IDs)
│       ├── LiveResultsPanel.tsx      # Sticky sidebar (no MC jank)
│       ├── MonteCarloChart.tsx       # Fan chart
│       ├── ScenarioComparison.tsx    # A vs B table
│       ├── Stepper.tsx               # Progress stepper (all visited steps clickable)
│       └── WhatIfSliders.tsx         # Debounced what-if explorer
├── hooks/
│   ├── useAnimatedCounter.ts    # Animated number count-up
│   ├── useDebounce.ts           # 150ms debounce for WhatIf sliders
│   └── useRetirementCalc.ts     # State, URL sync, scenario management
├── lib/
│   └── retirement.ts            # All pure calculation logic
└── public/
    ├── icon-192.png             # PWA icon
    ├── icon-512.png             # PWA icon
    ├── manifest.json            # Web App Manifest
    └── sw.js                    # Service Worker

## Calculation Logic
Step 1: Inflate Annual Expenses (per bucket)
BasicInflated = BasicNow × (1 + generalInflation) ^ yearsToRetirement
LifestyleInflated = LifestyleNow × (1 + lifestyleInflation) ^ yearsToRetirement
HealthcareInflated = HealthcareNow × (1 + medicalInflation) ^ yearsToRetirement

Step 2: Retirement Corpus (PV of Annuity)
Corpus = AnnualExpense × [(1 − (1 + r) ^ −t) ÷ r]
where, r = post-retirement return 
t = years in retirement
Existing savings are compounded to retirement at pre-retirement return and deducted.

Step 3:  Monthly SIP
SIP = Corpus × r ÷ [((1 + r) ^ n − 1) × (1 + r)]
where, r = monthly rate 
n = total months to retirement

Step 3b: Top-Up SIP
Binary search (80 iterations) for first-year SIP that compounds to target corpus with annual step-ups.
### Monte Carlo
500 log-normal return sequences. Volatility calibrated to portfolio conservatism (7–12%). Reports success rate, p10–p90 fan, and median ruin age. Illustrative only.

### Break-Even Age
Iterates year-by-year with inflation-adjusted withdrawals until corpus reaches zero.

## Compliance
•	RetLax has a disclaimer bar below the header on every screen.
•	Has a disclaimer on every page.
•	All outputs are labelled "Illustrative Estimate.
•	All assumptions are visible and editable.
•	There is no guarantee language
•	There is no scheme promotion or performance commitments.
•	There is a "What this doesn't include" disclosure box on the results.

## Accessibility
•	RetLax is accessible to people with disabilities.
•	Focus moves to heading on every step transition (all 4 steps)
•	Unique tooltip IDs via useId() — no duplicate aria-describedby targets
•	aria-live="polite" on results and live panel
•	role="alert" + aria-live="assertive" on errors
•	aria-current="step" on active stepper
•	Screen reader step announcer
•	All form inputs have associated labels
•	Keyboard navigation, visible 3px focus rings
•	Colour contrast ≥ 4.5:1
•	forced-colors media query support

## License
All code is the intellectual property of HDFC Asset Management Company Limited.

##Video
[Google Drive Folder](https://drive.google.com/drive/folders/1JJTfoWVRCarqTriltO2UYw_74x-pLhvV?usp=drive_link)

