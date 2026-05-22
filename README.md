# StudyTimerNiPako

StudyTimerNiPako is a cozy, browser-only study timer based on Pako Mode: study time counts upward, and break time is earned when you choose to stop.

## Pako Mode Rules

- Minimum study time: 10 minutes
- 10:00-29:59 studied: 5 minute break
- 30:00-59:59 studied: 10 minute break
- 60:00+ studied: 10 minutes plus 2 minutes for every completed 4 study minutes after 1 hour
- Example: 1 hour and 16 minutes studied earns an 18 minute break

## Included Features

- Upward study timer
- Confirmation before starting a break
- Break countdown that keeps running in real clock time if the tab is closed
- Break-finished popup with the message: `tama na yan boss, aral na ulit.`
- Optional browser notifications
- Built-in alarm sounds and custom sound upload
- Looping alarm until dismissed
- Break warnings at 1 hour, 5 minutes, and 1 minute remaining
- Break bank with a 2 hour limit
- Bank spending and manual break adjustment unlocked after a 7-day streak of studying at least 1 hour per day
- Daily study/session goals
- Streaks, grace days, and 3 restore chances
- Light and dark themes
- Local-only data with export/import

## Run Locally

Open `index.html` in a browser.

No install step is required because this is a static web app.

## Host With GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. Open the repository settings.
4. Go to **Pages**.
5. Set the source to the main branch and root folder.
6. Save, then wait for GitHub to give you the public Pages link.

## Optional Git Workflow

If Git is installed later, you can publish through the terminal:

```bash
git init
git add index.html styles.css script.js README.md
git commit -m "Build StudyTimerNiPako"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

After pushing, enable GitHub Pages from the repository settings.

## Privacy

All timer history, settings, uploaded sounds, goals, streaks, and banked break time are stored only in the current browser. They do not sync between devices unless you export and import a backup file.
