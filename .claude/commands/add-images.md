---
description: Add/refresh high-quality images for a lodge brand or a destination (dedup + curate to ~15-20)
argument-hint: <brand or destination> e.g. "Elewana properties" or "Serengeti"
---

Use the `add-images` subagent to add or refresh images for: **$ARGUMENTS**

Launch the `add-images` agent (via the Agent tool) with that brief. It will pick the right mode on its own:
- a lodge/camp **brand** → seed each property as a global accommodation (R2 images + DB rows + short/enhanced descriptions), or
- a **destination** (national park) → add/refresh its R2 image gallery.

In both modes it finds high-quality images, removes duplicates, curates each gallery to the best ~15-20, verifies, and reports back a summary. If the brief is empty, ask what brand or destination to add images for.
