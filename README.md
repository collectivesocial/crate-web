# crate-web

React/Vite/Chakra web app for Crate

## Setup

```bash
npm install
npm run dev
```

## Lexicon codegen

crate-web depends on lexicon definitions from the sibling [`crate`](https://github.com/brittanyellich/crate) repo. The generated TypeScript files in `src/lexicon/` are committed to this repo.

To regenerate after a lexicon schema change:

```bash
# Clone crate as a sibling directory (one-time setup)
git clone https://github.com/brittanyellich/crate.git ../crate

# Regenerate types
npm run lexgen:local
git add src/lexicon/
git commit -m "chore: regenerate lexicon types"
```

## Deploy

Pushes to `main` trigger a GitHub Pages deploy via `.github/workflows/deploy.yml`.

Configurable via GitHub Actions repository variables:
- `VITE_BASE_PATH` — defaults to `/crate-web/`
- `VITE_API_URL` — defaults to `https://api.crate.social`
