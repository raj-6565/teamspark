# TeamSpark: Hackathon Project Team Formation System

CSE3132 Software Engineering Lab, Department of CSE, Manipal University Jaipur.
Team: Bhavya Bansal (2427030421), Raj Shukla (2427030683)

TeamSpark helps students form hackathon teams. A student posts a team listing with the skills it needs.
The system ranks students with a **Compatibility Score** and shows the top three with the reasons. The listing owner decides whom to invite. Other students can search listings and send a request to join.

    Score = 0.35 x SkillMatch + 0.20 x SkillDepth + 0.25 x Capacity + 0.20 x PastRating

## Run it
Open `index.html` in a browser. There is no server and no install. Data is saved in your browser (localStorage).

## Tests
    npm install
    npx playwright install chromium
    npm test               # Jest: 13 logic tests (white-box)
    npm run test:coverage  # Jest with V8 coverage
    npm run test:e2e       # Playwright: 7 browser tests (black-box)
    npm run test:selenium  # Selenium WebDriver: 3 browser tests (needs Chrome)

Every push runs these automatically (GitHub Actions, `.github/workflows/tests.yml`).

## Folders
- `index.html`: the whole website (HTML, CSS and JavaScript)
- `teamspark.test.js`, `e2e/`, `selenium/`: test code
- `docs/`: project report, SRS, test case document, demo video, UML / DFD / ER / DD diagrams

## Status
Front-end prototype for a single user. Login, notifications, an admin role and a shared database are described in the SRS as future work.
