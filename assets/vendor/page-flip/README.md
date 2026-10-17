# StPageFlip — pinned local browser dependency

Vendored for the Stephen Francis Montagna private author-site concept on October 15, 2026. No application pages were changed by this research/vendor task.

## Provenance and integrity

- Upstream: [Nodlik/StPageFlip](https://github.com/Nodlik/StPageFlip).
- Official demo/docs: [nodlik.github.io/StPageFlip](https://nodlik.github.io/StPageFlip/).
- npm package: [`page-flip`](https://www.npmjs.com/package/page-flip), version **2.0.7**, verified against the [live npm registry](https://registry.npmjs.org/page-flip/latest) on the research date.
- Pinned package: [page-flip-2.0.7.tgz](https://registry.npmjs.org/page-flip/-/page-flip-2.0.7.tgz).
- Registry `gitHead`: `ab30ecc1d9f6d98de1a99b8e296469382f41c120`.
- License: **MIT**, copyright 2020 Nodlik. The unmodified license is included as `LICENSE`; retain it with distributed copies.
- Runtime dependencies: none declared by this package. No npm install or package lifecycle script was executed. Only the browser bundle, license, and package manifest were extracted into this directory.
- Verified tarball integrity: `sha512-96lQFUUz7r/LZzEUZJ3yBIMEKU9+m8HMFDzTvTdD6P7Ag/wXINjp9n0W7b4wanwnDbQETo4uNUoL3zMqpFxwGA==`.
- `page-flip.browser.js`: **44,058 bytes**, SHA-256 `bbaca0bbef57a22bb66a3fc69d67baf9a17fb9a9c89ec9ed35e2b91abe4bd1e7`.

Registry metadata and validation records are archived in `research/page-flip-package-metadata.json` and `research/page-flip-package-validation.json`. Relevant source files were also read from the exact `gitHead`, with URLs recorded in `research/page-flip-source/provenance.json`.

This is an older library release. Pinning and checksumming establish which upstream artifact is used; they are not a claim that all browser/accessibility defects have been resolved.

## Correct browser API

The included browser file is **UMD**, with global namespace **`St`** and constructor **`St.PageFlip`**. It is not a native ES-module file, and does not expose an unqualified global `PageFlip`.

```html
<script src="/assets/vendor/page-flip/page-flip.browser.js" defer></script>
<script src="/assets/app.js" defer></script>
```

```js
const reader = new window.St.PageFlip(document.querySelector('.book-reader'), {
  width: 432,
  height: 648,
  size: 'stretch',
  minWidth: 280,
  maxWidth: 520,
  minHeight: 420,
  maxHeight: 780,
  autoSize: true,
  usePortrait: true,
  showCover: true,
  drawShadow: true,
  maxShadowOpacity: 0.28,
  flippingTime: 850,
  useMouseEvents: true,
  clickEventForward: true,
  disableFlipByClick: true,
  showPageCorners: true,
  mobileScrollSupport: true,
  swipeDistance: 30
});

reader.on('init', ({ data }) => {
  // data.page is zero-based; data.mode is portrait or landscape.
});
reader.on('flip', ({ data }) => {
  // data is the zero-based current page index.
});
reader.on('changeOrientation', ({ data }) => {
  // data is portrait or landscape.
});
reader.on('changeState', ({ data }) => {
  // data is read, flipping, user_fold, or fold_corner.
});

// Register event listeners BEFORE loading. Exact case is required:
reader.loadFromHTML(document.querySelectorAll('.book-reader > .book-page'));

reader.flipNext('top');
reader.flipPrev('top');
reader.flip(4, 'bottom');
reader.turnToPage(4);       // No animated page turn.
reader.turnToNextPage();   // No animated page turn.
reader.turnToPrevPage();   // No animated page turn.
reader.getPageCount();
reader.getCurrentPageIndex();
reader.getOrientation();
reader.getBoundsRect();
reader.getState();
reader.update();           // Recalculate layout; accepts NO settings argument.
```

Do not run those navigation calls in sequence during initialization: the snippet lists the available methods. Use them from explicit controls and check boundaries/state.

**Naming trap:** the initial loader is `loadFromHTML` (uppercase HTML). The replacement-pages method is `updateFromHtml` (mixed-case Html). Some README text incorrectly says `loadFromHtml`; the pinned source and generated class documentation establish the correct method. The npm/bundler form documented upstream is `import { PageFlip } from 'page-flip'`; an ES-module artifact also exists upstream as `dist/js/page-flip.module.js`, but that file is not included here. For this buildless site, use the local UMD script above.

Sources: [pinned PageFlip.ts](https://github.com/Nodlik/StPageFlip/blob/ab30ecc1d9f6d98de1a99b8e296469382f41c120/src/PageFlip.ts), [generated class docs](https://nodlik.github.io/StPageFlip/docs/classes/pageflip.html), [pinned UMD build configuration](https://github.com/Nodlik/StPageFlip/blob/ab30ecc1d9f6d98de1a99b8e296469382f41c120/rollup.config.js).

## Pages, covers, and appearance

Pass actual HTML page elements in reading order. Use `data-density="hard"` on front/back covers; ordinary content pages default to soft. `showCover: true` makes first/last covers single-page presentations. A landscape view displays a spread; portrait displays one page. The current page index is zero-based, so display a reader-facing number with `index + 1` and account for two-page spreads in navigation/status.

The bundle injects the upstream structural CSS. The application must style its own paper, type, cover imagery, borders, inside gutter shading, and page-number layout. Use classes and an inner page-content element: the renderer **replaces each page root element’s inline `style.cssText`** while drawing. Do not put durable padding, background, typography, or transforms only in inline styles on the `.book-page` root. Do not override the renderer’s position/transform/clip-path properties.

No PDF parser or canvas image renderer is needed for native HTML mode. Use selectable text and real headings; image-only page snapshots need an equivalent text mode. Avoid unique IDs and complex interactive controls inside turnable pages: the library can clone page DOM temporarily during a soft-page turn. Keep navigation outside the page content.

Sources: [pinned HTMLPage.ts](https://github.com/Nodlik/StPageFlip/blob/ab30ecc1d9f6d98de1a99b8e296469382f41c120/src/Page/HTMLPage.ts), [pinned structural CSS](https://github.com/Nodlik/StPageFlip/blob/ab30ecc1d9f6d98de1a99b8e296469382f41c120/src/Style/stPageFlip.css).

## Sizing and lifecycle

`width` and `height` are the **base single-page dimensions/aspect ratio**, not the whole two-page spread. Both must be positive. `size: 'stretch'` fits the parent within the configured thresholds. In the pinned render source, portrait is selected when available block width is less than `2 * minWidth` and `usePortrait` is enabled. The sample’s nominal breakpoint is therefore 560 CSS pixels. Actual page size is constrained by container width and height.

Initialize only when the host is visible and has nonzero dimensions. A hidden `<details>`, inactive tab, or `display:none` viewer should be revealed before initialization or followed by `reader.update()` after layout settles. The library installs a **window resize** listener; for container-only resizing or modal/tab changes, use an application-owned ResizeObserver or explicit visibility callback to request a debounced `reader.update()`.

`update()` recalculates the render area and re-shows the current page. It does not accept new settings or new page nodes. Use `updateFromHtml(newPageElements)` to replace content; its `update` event contains `{ page, mode }`. There is no documented `updateSettings` API in this version. Keep a stable instance for a stable reader and avoid constructing many hidden readers at once.

`destroy()` removes the host element as well as library UI/event handlers. It is not a non-destructive toggle back to the original layout. The pinned renderer starts a perpetual requestAnimationFrame loop and exposes no public stop/pause method, so repeated teardown/recreation is undesirable. Prefer one visible initialized reader and an independent linear-reading alternative.

Sources: [pinned Settings.ts](https://github.com/Nodlik/StPageFlip/blob/ab30ecc1d9f6d98de1a99b8e296469382f41c120/src/Settings.ts), [pinned UI.ts](https://github.com/Nodlik/StPageFlip/blob/ab30ecc1d9f6d98de1a99b8e296469382f41c120/src/UI/UI.ts), [pinned Render.ts](https://github.com/Nodlik/StPageFlip/blob/ab30ecc1d9f6d98de1a99b8e296469382f41c120/src/Render/Render.ts).

## Events and accessibility responsibilities

`.on(name, callback)` callbacks receive `{ data, object }`, where `object` is the reader. Supported events relevant here:

- `init`: `{ page, mode }`; attach before `loadFromHTML`.
- `flip`: current zero-based page number.
- `changeOrientation`: `portrait` or `landscape`.
- `changeState`: `read`, `flipping`, `user_fold`, or `fold_corner`.
- `update`: `{ page, mode }` after content replacement.

`off(name)` removes all listeners of that event name, rather than one specified callback. Source: [pinned event implementation](https://github.com/Nodlik/StPageFlip/blob/ab30ecc1d9f6d98de1a99b8e296469382f41c120/src/Event/EventObject.ts).

HTML rendering preserves real text, but the library does **not** establish a complete accessible reader. Application work should include:

1. Clearly labeled native Previous/Next buttons outside the pages, a page count/status, keyboard operation scoped to the reader, visible focus, sensible disabled states, and no automatic focus theft when a page turns.
2. A persistent **Read as text** option with the same substantive content in a normal flow. Hidden/inactive book pages are not a substitute for this complete linear reading mode. Preserve meaningful content if scripts fail.
3. Prefer linear reading or non-animated `turnTo…` navigation when `prefers-reduced-motion: reduce` applies. `flippingTime: 0` is invalid in this version and throws; do not use that as the reduced-motion implementation.
4. A polite page-change announcement after explicit navigation, without announcing animation frames. Do not place all constantly mutating visual reader DOM inside a live region.
5. Keep URLs/buttons inside page content simple. `clickEventForward` only exempts direct `a`/`button` event targets in this version; nested spans/icons may still be intercepted. External navigation controls avoid that problem.
6. Check touch scrolling and swipe behavior in the actual layout. `mobileScrollSupport` affects touch cancellation; the name alone is not enough to establish that a long text area scrolls correctly. Long content may need more pages, a deliberate inner scroll region, or the linear mode.

The previous/next UI, linear alternative, motion settings, and focus behavior require browser QA after integration. They are not supplied by merely loading this bundle.
