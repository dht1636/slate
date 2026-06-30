# Slate

A lightweight, native macOS notes app for developers and power users who juggle
many concurrent projects. Notes are organized by project, support rich text
(bold, italic, highlight, color, code blocks, images), and are built for fast
capture and fast retrieval — keyboard-first, dark by default.

Built with [Tauri](https://tauri.app/) (Rust) + React + TypeScript. The editor
is [Tiptap](https://tiptap.dev/); notes persist to the local filesystem.

## Develop

```bash
npm install
npm run tauri dev   # launch the desktop app with hot reload
```

Requires the [Tauri prerequisites](https://tauri.app/start/prerequisites/)
(Rust toolchain + Xcode command line tools on macOS).

## Build

```bash
npm run tauri build   # produce a distributable .app / .dmg
```

`npm run dev` / `npm run build` run the Vite frontend on its own (no native
shell) if you only want to iterate in the browser.

## Layout

- `src/` — React frontend (`App.tsx`, `components/`, `store.tsx`, `persist.ts`)
- `src-tauri/` — Rust/Tauri shell and config
- `PRODUCT.md` — product intent and principles
- `DESIGN.md` — design system
