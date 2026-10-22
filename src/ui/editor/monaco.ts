// Bundles only the Monaco pieces the IDE shell needs (no CDN, no extra language services).
import * as monaco from 'monaco-editor/editor/editor.api'
import 'monaco-editor/editor/browser/coreCommands'
import 'monaco-editor/editor/contrib/folding/browser/folding'
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching'
import 'monaco-editor/editor/contrib/wordOperations/browser/wordOperations'
// Ctrl+M (macOS Ctrl+Shift+M) toggles Tab between indenting and moving focus out of the editor.
import 'monaco-editor/editor/contrib/toggleTabFocusMode/browser/toggleTabFocusMode'
import 'monaco-editor/languages/definitions/python/register'
import 'monaco-codicon.css'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'

self.MonacoEnvironment = { getWorker: () => new EditorWorker() }

export { monaco }
