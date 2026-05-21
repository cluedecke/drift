# Drift

Drift is a small ambient web app for creating a little room when your mind feels loud.

It is intentionally quiet: no accounts, no backend, no streaks, no task system. The app centers on a press-and-hold orb interaction, a release moment, and a few low-pressure support paths.

## What It Does

- Press and hold a soft central orb.
- Stars gather inward while pressure builds.
- Release to create a visual exhale.
- Choose a quiet next place: `Quiet`, `Say more`, or `Ground me`.
- Keep thoughts in local state only for the current session.

## Project Rules

Drift should feel:

- Calm
- Spacious
- Human
- Non-clinical

Drift should never become:

- A task manager
- A habit tracker
- A streak app
- A productivity system
- Therapy homework

Writing should stay short, simple, and plain.

## Run Locally

This is a static site. You can open `index.html` directly, or run a small local server:

```bash
python -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

## Deploy

Because the app is static, it can be hosted with GitHub Pages.

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `app.js`, `README.md`, and `.gitignore`.
3. In the repository settings, enable GitHub Pages from the main branch.

## Notes

Haptics use the browser vibration API. Support varies by browser and device.
