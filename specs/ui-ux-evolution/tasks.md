# UI/UX Evolution: Task Breakdown

## Overview

**Total estimate:** 22 iterations (sequential) or 14 iterations (parallelized with 2 developers)

**Critical Path:** Group A (Tokens + Theme) → Group B (Font + Icons) → Group C (Modals + Dialogs) → Group D (Toast + Skeleton) → Group E (Shortcuts + Command Palette) → Group F (Responsive + Cleanup)

**Parallelization:** Groups B and C can run in parallel after A. Groups D and E can run in parallel after C. Group F is final cleanup after all others.

---

## Task Groups

### Group A: Design Token System + Theme Provider (Phase I)
**Estimated: 4 iterations**

- [ ] A.1 Define CSS custom property token system in `:root` and `[data-theme]` blocks
  - Spacing scale (4px base: --space-1 through --space-8)
  - Radius tokens (--radius-sm/md/lg/full)
  - Shadow tokens (--shadow-sm/md/lg)
  - Typography tokens (--font-sans, --font-mono, --text-xs through --text-2xl)
  - Color tokens for dark theme (matching existing values)
  - Color tokens for light theme (new, WCAG AA compliant)
  - Transition tokens (--transition-fast/normal/slow with easing curves)
  - Z-index tokens (--z-base/overlay/modal/toast)
  - File: `src/styles/index.css`

- [ ] A.2 Create ThemeProvider component with system preference detection
  - Reads `prefers-color-scheme` on first load
  - Persists choice to localStorage (`aura-theme`)
  - Applies `data-theme` attribute to `<html>` before first paint (inline script in index.html to prevent FOUC)
  - `useTheme()` hook returns current theme + toggle function
  - File: `src/components/shared/ThemeProvider.tsx`, `src/hooks/useTheme.ts`

- [ ] A.3 Add theme toggle button to app header
  - Sun/Moon icons from Lucide
  - Active state reflects current theme
  - Persists on toggle
  - File: `src/Workspace.tsx`, `src/styles/index.css`

- [ ] A.4 Migrate hardcoded CSS values to tokens
  - Replace all ad-hoc `0.5rem`, `1rem`, `20px`, `12px` with `var(--space-*)`
  - Replace all ad-hoc `4px`, `8px`, `12px` radius with `var(--radius-*)`
  - Replace all hardcoded colors with token references
  - Replace all `border-radius`, `padding`, `margin` hardcoded values
  - File: `src/styles/index.css`

**Dependencies:** None (foundation — everything else builds on this)
**Acceptance Criteria:** Both themes render correctly with all tokens applied. No FOUC on page load. Toggle persists across sessions. All existing colors come from tokens.

---

### Group B: Font Migration + Icon Consolidation (Phase I)
**Estimated: 4 iterations**

- [ ] B.1 Update font loading in `index.html`
  - Add Inter variable font (weights 400-700)
  - Keep Space Mono (weights 400, 700 only — for code/timestamps)
  - Remove Material Symbols Outlined font link
  - Add inline FOUC-prevention script for theme (from A.2)
  - File: `index.html`

- [ ] B.2 Migrate body font from Space Mono to Inter
  - `body { font-family: var(--font-sans) }` in index.css
  - `button { font-family: var(--font-sans) }` in index.css
  - Add `.mono` utility class and `--font-mono` token usage for timestamps, code, data tables
  - Apply `.mono` to all `<time>` elements, code blocks, table cells with data, provider settings API key input
  - File: `src/styles/index.css`, all components with `<time>` elements

- [ ] B.3 Migrate Material Symbols icons to Lucide React
  - ConductorInput: `send` → Send, `mic`/`mic_none` → Mic/MicOff, `record_voice_over`/`voice_over_off` → AudioLines/AudioLinesOff (or closest Lucide equivalents)
  - VideoControls: `skip_previous`/`skip_next` → SkipBack/SkipForward, `play_arrow`/`pause` → Play/Pause
  - CardFooter: `picture_as_pdf` → FileText, `data_object` → Braces, `code` → Code, `image` → Image, `download` → Download, `description` → FileText, `add_to_queue` → Plus
  - ChatContent: `attachment` → Paperclip, `send` → Send, `description` → FileText
  - InsightCard: `neurology` → Brain, `unfold_less`/`unfold_more` → ChevronsDown/Up, `close` → X
  - LensLaboratory: `science` → FlaskConical, `add_circle` → PlusCircle
  - HelpModal: lens icons already use Lucide (from modes.ts)
  - LibraryModal: `open_in_new` → ExternalLink, `delete` → Trash2
  - LensPromptModal: `mic` → Mic, `stop_circle` → CircleStop
  - QuizModule: `lightbulb` → Lightbulb
  - CreatorStudio: `slideshow` → Presentation
  - CustomVirtuosoBuilder: already uses Lucide (X, Save, Plus, Trash2)
  - Files: 11 component files

- [ ] B.4 Remove `.icon` CSS class and Material Symbols styles
  - Delete `.icon` class definition from index.css
  - Verify no remaining `<span className="icon">` patterns
  - File: `src/styles/index.css`

**Dependencies:** Group A (tokens must exist for font tokens)
**Acceptance Criteria:** Inter is body font throughout workspace. Space Mono only on timestamps/code/data. Zero Material Symbols references remain. No broken icons. Bundle size net-neutral or smaller.

---

### Group C: Modal Consolidation + Native Dialog Elimination (Phase II)
**Estimated: 4 iterations**

- [ ] C.1 Migrate LensPromptModal to shared Modal.tsx
  - Replace custom overlay with `<Modal>` wrapper
  - Preserve all existing functionality (file upload, aspect ratio, audio recording)
  - Add focus trap and ARIA dialog role (inherited from Modal.tsx)
  - File: `src/components/lenses/LensPromptModal.tsx`

- [ ] C.2 Migrate LibraryModal to shared Modal.tsx
  - Replace custom overlay with `<Modal>` wrapper
  - Replace `window.confirm()` with inline confirmation state (delete button → confirm state → delete)
  - File: `src/components/creator/LibraryModal.tsx`

- [ ] C.3 Migrate ConsentModal to shared Modal.tsx
  - Replace custom overlay with `<Modal>` wrapper
  - Add focus trap (inherited from Modal.tsx)
  - File: `src/components/course/ConsentModal.tsx`

- [ ] C.4 Migrate LiveConversation and ValhallaGateway to shared Modal.tsx
  - Replace custom overlays with `<Modal>` wrapper
  - Remove `useEscapeKey` calls (Modal.tsx handles escape)
  - Preserve all existing functionality (audio streaming, command execution, safety reports)
  - Files: `src/components/shared/LiveConversation.tsx`, `src/components/valhalla/ValhallaGateway.tsx`

- [ ] C.5 Replace native dialogs with custom modals
  - CreatorStudio: `prompt()` → small naming modal component (input + confirm/cancel)
  - CustomVirtuosoBuilder: `alert()` → inline validation messages below form fields
  - File: `src/components/creator/CreatorStudio.tsx`, `src/components/virtuosos/CustomVirtuosoBuilder.tsx`

**Dependencies:** Group A (tokens), Group B (Lucide icons for new modal elements)
**Acceptance Criteria:** All modals use shared Modal.tsx. Zero `alert()`, `prompt()`, `confirm()` calls. Focus trap works in all modals. Escape closes all modals. No functionality lost.

---

### Group D: Toast System + Skeleton Loading (Phase II)
**Estimated: 3 iterations**

- [ ] D.1 Create ToastProvider and useToast hook
  - Context provider wrapping the app
  - `useToast()` returns `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`
  - Toast container fixed bottom-right, framer-motion enter/exit
  - Success/info auto-dismiss after 4s, errors persist until dismissed
  - Keyboard-dismissible (Escape on focused toast)
  - ARIA live region for screen readers
  - Files: `src/components/shared/ToastProvider.tsx`, `src/hooks/useToast.ts`, `src/styles/index.css`

- [ ] D.2 Wire toasts into existing actions
  - Export actions (PDF, JSON, XML, PNG, CSV, MD, TXT) → success toast
  - Save presentation → success toast
  - Delete presentation → success toast
  - Video generation complete → success toast
  - Error states in Workspace → error toast (replace or supplement existing error-toast div)
  - Files: `src/lib/exportUtils.ts`, `src/components/creator/CreatorStudio.tsx`, `src/Workspace.tsx`

- [ ] D.3 Create Skeleton component and integrate into loading states
  - `Skeleton` component with shimmer animation (transform/opacity only)
  - InsightCard loading: skeleton matching card header + body layout
  - ChatContent loading: typing skeleton (3 pulsing dots or message-shaped skeleton)
  - LibraryModal loading: skeleton list items
  - Files: `src/components/shared/Skeleton.tsx`, `src/components/analysis/InsightCard.tsx`, `src/components/analysis/insight-content/ChatContent.tsx`, `src/components/creator/LibraryModal.tsx`

**Dependencies:** Group A (tokens), Group C (modals consolidated)
**Acceptance Criteria:** All success/error actions show toasts. Toasts auto-dismiss correctly. Skeletons match content layout. No spinners remain for content loading (spinners OK for button-level loading like "Test Connection").

---

### Group E: Keyboard Shortcuts + Command Palette (Phase III)
**Estimated: 3 iterations**

- [ ] E.1 Create useKeyboardShortcuts hook and shortcut registry
  - Hook registers global keydown listener in Workspace
  - Registry maps shortcuts to handlers: Space (play/pause), J/K/L (timeline), Arrow Left/Right (frame step), `/` (focus conductor), Cmd/Ctrl+K (command palette)
  - Shortcuts disabled when modal open or input focused (except Escape)
  - Files: `src/hooks/useKeyboardShortcuts.ts`, `src/Workspace.tsx`

- [ ] E.2 Create CommandPalette component
  - Cmd/Ctrl+K opens palette
  - Fuzzy-searchable list of actions: apply lens, toggle theme, export NLE, open settings, open help, switch view (analysis/creator), open library
  - Keyboard-navigable (arrow keys + Enter)
  - framer-motion animated overlay (scale + fade)
  - Files: `src/components/shared/CommandPalette.tsx`, `src/styles/index.css`

- [ ] E.3 Update Help modal with keyboard shortcuts reference
  - Add "Keyboard Shortcuts" tab to HelpModal
  - List all shortcuts in a table format
  - Files: `src/components/shared/HelpModal.tsx`

**Dependencies:** Group A (tokens), Group D (toast for palette action feedback)
**Acceptance Criteria:** All shortcuts work without conflicts. Command palette opens with Cmd/Ctrl+K. Palette is keyboard-navigable. Shortcuts documented in Help. No shortcuts fire when typing in inputs.

---

### Group F: Responsive Design + Inline Style Migration + Dead Code Removal (Phase III)
**Estimated: 4 iterations**

- [ ] F.1 Add responsive breakpoints to workspace CSS
  - 768px: Timeline collapses to icon-only, Lens Laboratory becomes slide-in drawer
  - 1024px: Lens palette wraps, conductor input adjusts
  - Lens Laboratory drawer: toggle button, overlay backdrop, slide animation
  - Files: `src/styles/index.css`, `src/components/analysis/LensLaboratory.tsx`, `src/Workspace.tsx`

- [ ] F.2 Migrate inline styles to CSS classes
  - ProviderSettingsCard: replace `providerSettingsCardStyles.ts` entirely with CSS classes
  - ExportNLEModal: inline flex/gap/margin → CSS classes
  - LensLaboratory: inline flex on header → CSS class
  - VideoControls: inline marginLeft/display/gap → CSS classes
  - InsightContentRenderer: inline styles on TTS button → CSS class
  - CustomVirtuosoBuilder: all inline styles → CSS classes
  - Files: `src/styles/index.css`, 6 component files, delete `providerSettingsCardStyles.ts`

- [ ] F.3 Improve lens palette discoverability
  - Add tooltip labels on hover (CSS tooltip or title attribute enhancement)
  - At wider breakpoints (≥1024px): show persistent labels under icons
  - Disabled lenses: reduced opacity + tooltip explaining "Load a video first"
  - Files: `src/components/lenses/LensPalette.tsx`, `src/styles/index.css`

- [ ] F.4 Remove dead code and clean up imports
  - Delete `src/components/analysis/VideoPlayer.tsx`
  - Delete `src/components/analysis/insight-content/QuizContent.tsx`
  - Delete `src/components/analysis/insight-content/ParagraphContent.tsx`
  - Remove any imports of deleted files
  - Verify no references remain
  - Files: 3 files deleted, import cleanup in any referencing files

**Dependencies:** Groups A-E (all changes must be in place before final cleanup pass)
**Acceptance Criteria:** Workspace is usable at 768px and 1024px. Zero inline style objects in migrated components. Lens palette shows labels. No dead code remains. All imports clean.

---

## Dependency Graph

```
Group A (Tokens + Theme) ── no deps, foundation
    │
    ├──→ Group B (Fonts + Icons) ── needs A for font tokens
    │
    ├──→ Group C (Modals + Dialogs) ── needs A for tokens, B for Lucide icons
    │         │
    │         ├──→ Group D (Toast + Skeleton) ── needs A, C
    │         │
    │         └──→ Group E (Shortcuts + Palette) ── needs A, D
    │                   │
    └───────────────────┴──→ Group F (Responsive + Cleanup) ── needs all
```

## Parallelization Strategy

**If 2 developers:**
- **Dev A:** Group A → Group B → Group F (font/icons, then responsive/cleanup)
- **Dev B:** (waits for A) → Group C → Group D → Group E (modals, toast, shortcuts)
- **Sync point:** After Group A completes, both diverge. After Groups B-E complete, both converge on Group F.
- **Efficiency gain:** ~36% time reduction (22 → 14 iterations)

**If 1 developer (sequential):**
A → B → C → D → E → F (22 iterations)

## Testing Strategy

**Focused testing approach:**
- **Group A:** 4 tests — token system renders, theme toggles, persists, no FOUC
- **Group B:** 3 tests — font application, icon rendering, no Material Symbols remaining
- **Group C:** 4 tests — each modal uses shared component, no native dialogs, focus trap works
- **Group D:** 3 tests — toast appears/dismisses, skeleton renders, error toast persists
- **Group E:** 3 tests — shortcut triggers, palette opens/searches, shortcuts disabled in inputs
- **Group F:** 3 tests — responsive layout at breakpoints, no inline styles, no dead code imports
- **Gap filling:** 4 tests — end-to-end theme switch, full modal flow, toast + export integration, responsive + shortcut interaction
- **Total: 24 tests** (within 16-34 target range)

## Component Size Enforcement

All frontend components must remain under **400 lines**. Current risk areas:
- `Workspace.tsx` (currently ~350 lines) — monitor when adding theme toggle, shortcut hook, command palette trigger
- `CommandPalette.tsx` (new) — keep action list data-driven, extract if approaching 400
- `ToastProvider.tsx` (new) — keep toast item as separate sub-component if needed
- `ThemeProvider.tsx` (new) — should be well under 400
- `InsightContentRenderer.tsx` — already large, skeleton integration must not push past 400