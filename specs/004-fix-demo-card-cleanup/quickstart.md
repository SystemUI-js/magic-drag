# Quickstart

## Verify demo card cleanup

1. Start the demo: `yarn dev`
2. Open the demo page in two tabs.
3. Drag a card in the same tab and drop it.
4. Confirm no temporary demo-card remains under `document.body`.
5. Drag a card into the other tab and drop it.
6. Confirm the source tab has no leftover temporary demo-card.
7. Start a drag and release outside any tab.
8. Confirm the temporary demo-card is removed within 1 second.
