# Contributing to RetLax

Thank you for improving RetLax. Please keep contributions focused on retirement planning, inflation and risk disclosure, and product-quality improvements.

## Getting started
1. Install dependencies: `npm install`
2. Run locally: `npm run dev`
3. Run tests: `npm test`
4. Build: `npm run build`

## Contribution guidelines
- Open an issue before large changes.
- Keep UI changes accessible and responsive.
- Add tests for new financial logic and edge cases.
- Document any assumptions or model changes in `README.md` and the methodology page.

## Limitations
- This project currently uses a simplified flat withdrawal tax toggle, not full Indian tax slab modelling.
- Currency presentation is India-focused (₹, lakhs, crores) and does not support locale switching.
- Monte Carlo assumes independent annual returns and does not model multi-year cycles.
