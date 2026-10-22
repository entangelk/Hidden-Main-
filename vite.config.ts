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
    // The main chunk keeps Monaco on purpose: the editor is needed on the first screen, so splitting
    // it off would only add a round trip. About 3 MB raw / 0.8 MB gzip. (Monaco's Python grammar
    // and its editor worker are already separate files, loaded on demand.)
    chunkSizeWarningLimit: 3500,
  },
  resolve: {
    alias: { 'monaco-codicon.css': codiconCss },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
