# Product

## Register

product

## Users

crate-web is built primarily for its author (Brittany Ellich) and secondarily for other ATProto users who treat their PDS as the canonical store for the things they make — makers, indie hackers, writers who want their content to live as portable records, rendered by their personal sites or other clients.

They use crate-web in two main contexts:

- **Capture and authoring** — drafting/editing notes and content records during a focused writing session. The writing surface is the priority.
- **Curation and packaging** — publishing illustrations, talks, podcast metadata, RSS imports, or quick "now" updates into structured records on the PDS. Fast, deliberate, low-friction.

The unifying job-to-be-done: _"package this thing I made into a clean, structured ATProto record so it can live in my PDS and be rendered anywhere."_

## Product Purpose

Crate is a custom-lexicon publishing service for ATProto. crate-web is its authoring/management UI — the place where structured records (notes, content, documents, now-page updates) are written, imported, edited, and published to the user's PDS.
Success = the user finishes a session feeling focused and calm, having published a clean, well-formed record they trust to render correctly on their own site and in any future client. The app gets out of the way; the content is the centerpiece.

## Brand Personality

**Craftsman. Quiet. Deliberate.**

The voice is unhurried and confident, like a workshop notebook, not a SaaS dashboard. Copy is precise and plain, never marketing. Microcopy reads like a careful colleague, not a chatbot. The interface should feel like a tool a maker uses every day for years, not a product designed to be screenshot for a launch.

## Anti-references

- **Corporate-SaaS teal-and-illustrations.** Generic teal accent, rounded cards, friendly cartoons. The current crate-web look sits here and we are moving away from it.
- **Generic Chakra defaults.** Default radii, default body font, default button shapes, everything looking like every other Chakra prototype.
- **Notion's everything-is-a-block paradigm.** Slash menus, drag handles, hover toolbars on every line. crate-web is for finished writing, not block-based note-taking.
- **Bluesky / social-app chrome.** Tabbed feeds, sidebar followers, composer-in-the-corner. crate-web is authoring, not posting.
- **Glassy / gradient / AI-coded landing-page slop.** Blurred glass cards, gradient text, dark-mode-with-neon-accent.

## Design Principles

1. **The content is the room; the chrome is the doorframe.** Editor surface (writing or image) gets visual weight, contrast, and space. Navigation, metadata, and actions recede until needed.
2. **Quiet by default, decisive on action.** Surfaces and type sit calm at rest. Color appears only at the moment of intent (publish, error, focused field), not as decoration.
3. **One typeface, two registers.** A single body family that handles reading and editing well, with hierarchy through weight and scale. No second decorative typeface unless it earns its place.
4. **Compact interior, generous edges.** Dense information inside (lists, tables, metadata) framed by generous outer margin and breathing room. Reads like a magazine spread, not a dashboard sidebar.
5. **Respect the record.** Every screen makes the underlying ATProto record shape feel legible and trustworthy: kind, title, dates, links. The user should see what's being packaged, not just a friendly preview.

## Accessibility & Inclusion

- Target **WCAG 2.1 AA** across the app. Text contrast ≥4.5:1 for body, ≥3:1 for large text and non-text UI.
- Respect `prefers-reduced-motion`. Default transitions short and ease-out.
- Keyboard-first: every authoring action reachable without a mouse. Focus rings visible and high-contrast.
- Type scale legible at 200% zoom; no fixed-pixel text in body copy.
- Color is never the only signal for state (error, success, focus); pair with text, icon, or weight.
