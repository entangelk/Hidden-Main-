/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// monaco-editor's package exports only map .js files; its codicon stylesheet (icon font for
// folding arrows etc.) has to be reached by file path.
const codiconCss = fileURLToPath(
  new URL('./node_modules/monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css', import.meta.url),
)

export default defineConfig({
  // Relative asset URLs, so the build works under any path (GitHub Pages serves it at /<repo>/).
  base: './',
  plugins: [react()],
  build: {
    // One chunk on purpose: the editor (Monaco) is needed on the first screen, so splitting it off
    // would only add a second round trip. About 3 MB raw / 0.8 MB gzip.
    chunkSizeWarningLimit: 3500,
  },
  resolve: {
    alias: { 'monaco-codicon.css': codiconCss },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
