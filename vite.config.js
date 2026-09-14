import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// ─── Content-Security-Policy ──────────────────────────────────────────────────
//
// The built page is entirely self-contained: vite-plugin-singlefile inlines
// every script and style, and the app makes no network request of any kind —
// no fetch, no XHR, no WebSocket, no external font or image. That makes a very
// tight policy free to adopt, and `connect-src 'none'` is the line worth
// having: it means a script that somehow got onto the page has nowhere to send
// what it reads. On GitHub Pages that matters more than usual, since a user
// site shares one origin with every other repo published under it and with
// every branch preview deployed beside the app.
//
// Applied at build time only. The dev server serves modules over http and
// needs a websocket for HMR, so any policy strict enough to be worth shipping
// would break `npm run dev`.
//
// Not included: frame-ancestors, which a <meta> CSP cannot express — it is
// honoured only as a real HTTP header, and GitHub Pages does not let us set
// one. Clickjacking therefore stays unaddressed by this route.
const CSP = [
  "default-src 'none'",
  // The bundle is inlined, so it is an inline script. A hash would be exact
  // but changes on every build; 'unsafe-inline' is what is left. It is a far
  // weaker loss than it looks here, because default-src 'none' and
  // connect-src 'none' still deny an injected script any way to load or
  // exfiltrate anything.
  "script-src 'unsafe-inline'",
  // The <style> block in index.html, plus React's style={{…}} attributes,
  // which the app uses throughout.
  "style-src 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "manifest-src 'self'",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

const cspPlugin = {
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: () => [{
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
      // Must precede the inlined bundle to govern it.
      injectTo: 'head-prepend',
    }],
  },
}

export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/metronome/',
    plugins: [react(), viteSingleFile(), cspPlugin],
})
