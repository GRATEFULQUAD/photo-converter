# Photo Converter

A cyberpunk-themed batch photo format converter. Drop in any images, pick a target format (PNG, JPEG, WebP, or BMP), and download converted copies — your originals are never modified.

Everything runs client-side in the browser via `<canvas>`; no files are ever uploaded to a server.

## Features

- Batch convert hundreds of images at once
- Supports input: JPG, PNG, WebP, GIF, BMP, SVG, AVIF, HEIC, TIFF (anything the browser can decode)
- Supports output: PNG, JPEG, WebP, BMP (browser-safe encode targets)
- Download individually or as a single .zip
- Originals are never touched — only new copies are produced
- Cyberpunk UI: pitch-black background, 2,300 static neon particles, frosted glass panels with neon borders

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploying to Vercel

This is a standard Next.js 15 app — import this repo directly into Vercel and it will auto-detect the framework and deploy with zero config.

## Tech stack

Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, JSZip.
