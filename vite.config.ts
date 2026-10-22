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
  plugins: [react()],
  resolve: {
    alias: { 'monaco-codicon.css': codiconCss },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
