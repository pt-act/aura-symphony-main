# UI/UX Evolution Specification

## Goal

Transform the Aura Symphony workspace from a fragmented, dated interface into a cohesive, modern design system — unifying three disconnected visual languages into one, adding light/dark theming, replacing native dialogs, consolidating icon systems, and bringing loading/feedback patterns to 2026 standards. All while preserving the zero-surface progressive revelation philosophy and existing functionality.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Design Token Layer                     │
│  CSS Custom Properties (spacing, radius, shadow, type,    │
│  color) with light/dark variants via [data-theme]         │
└──────────────────────────┬──────────────────────────────┘
                           │ consumed by
┌──────────────────────────▼──────────────────────────────┐
│                    Component Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Theme   │  │  Toast   │  │ Skeleton │  │ Command  │ │
│  │ Provider │  │  System  │  │  Loader  │  │  Palette │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────────────────────────────────────────────────┐│
│  │           Migrated Components (existing)              ││
│  │  Modal consolidation · Icon migration · CSS cleanup   ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

## User Stories

### US1: Theme Awareness
As a user, I want the workspace to respect my system's light/dark preference and allow manual toggling, so that I can work comfortably in any lighting condition.

**Acceptance Criteria:**
- [ ] Workspace defaults to `prefers-color-scheme` on first load
- [ ] Theme toggle in header persists choice to localStorage
- [ ] All surfaces, text, borders, and shadows adapt to active theme
- [ ] No flash of wrong theme on page load (FOUC prevention)

### US2: Readable Content
As a user analyzing video insights, I want prose content in a readable sans-serif font, so that I can quickly scan summaries, chat messages, and course text without monospace eye strain.

**Acceptance Criteria:**
- [ ] Inter is the body/UI font throughout the workspace
- [ ] Space Mono is used only for timestamps, code blocks, and data tables
- [ ] Font loading optimized (Inter variable, Space Mono weights only as needed)

### US3: Lens Discoverability
As a new user, I want to understand what each lens does without hovering each icon, so that I can quickly find the right analysis tool.

**Acceptance Criteria:**
- [ ] Lens palette shows labels (at minimum on hover via tooltip, ideally persistent labels at wider breakpoints)
- [ ] Disabled lenses are visually distinct and explain why (no video loaded)
- [ ] Lens descriptions from Help modal are accessible from the palette

### US4: Consistent Modals
As a user, I want all dialogs and modals to behave consistently, so that I can navigate them predictably with keyboard and screen readers.

**Acceptance Criteria:**
- [ ] All modals use the shared `Modal.tsx` component (focus trap, escape, ARIA, body scroll lock)
- [ ] No native `alert()`, `prompt()`, or `confirm()` calls remain
- [ ] Confirmation dialogs replace `window.confirm()` with custom modal
- [ ] Inline validation replaces `alert()` for form errors

### US5: Action Feedback
As a user, I want confirmation when actions succeed or fail, so that I know whether my export, save, or generation completed.

**Acceptance Criteria:**
- [ ] Toast notifications appear for success and error events
- [ ] Toasts auto-dismiss after 4s (errors persist until dismissed)
- [ ] Toasts are keyboard-dismissable and ARIA-announced
- [ ] No silent successes (exports, saves, generations all confirm)

### US6: Perceived Performance
As a user waiting for AI-generated insights, I want skeleton placeholders instead of spinners, so that the interface feels responsive even during processing.

**Acceptance Criteria:**
- [ ] Insight cards show skeleton content while generating (not just "Generating..." + spinner)
- [ ] Chat messages show typing skeleton while waiting for response
- [ ] Library modal shows skeleton list while loading presentations
- [ ] Skeletons match the layout of expected content

### US7: Keyboard Power
As a power user, I want keyboard shortcuts for common actions, so that I can work at the speed of thought without reaching for the mouse.

**Acceptance Criteria:**
- [ ] Space toggles play/pause
- [ ] J/K/L for timeline navigation (backward/pause/forward)
- [ ] Arrow keys for frame stepping
- [ ] `/` focuses the conductor input
- [ ] Cmd/Ctrl+K opens command palette
- [ ] Shortcuts are documented in Help modal

### US8: Responsive Workspace
As a user on tablet or narrow windows, I want the workspace to reflow gracefully, so that I can work on any screen size.

**Acceptance Criteria:**
- [ ] Timeline collapses to icon-only at narrow widths
- [ ] Lens Laboratory becomes a drawer/overlay at narrow widths
- [ ] Lens palette wraps or scrolls horizontally
- [ ] Conductor input remains accessible at all widths
- [ ] No horizontal scrolling for page-level layout

## Specific Requirements

### Functional Requirements:

1. **Design Token System** — CSS custom properties for spacing (4px base scale), border-radius (4/6/8/12/100px), shadow/elevation (3 levels), typography (fluid type scale), color (full palette with light/dark variants), transition curves, and z-index layers. All hardcoded values in `index.css` replaced with token references.

2. **Theme System** — `[data-theme="light"]` and `[data-theme="dark"]` attribute on `<html>` element. Theme provider reads `prefers-color-scheme` on first load, persists user choice to localStorage, applies attribute before first paint. Toggle button in app header.

3. **Font Migration** — `index.html` loads Inter (variable, weights 400-700) and Space Mono (weights 400, 700 only). `body` font-family changes from `'Space Mono', monospace` to `'Inter', system-ui, sans-serif`. Monospace class (`.mono` or `--font-mono` token) applied to timestamps, code blocks, data tables, and the provider settings API key input.

4. **Icon Consolidation** — All `<span className="icon">material_symbol</span>` patterns replaced with Lucide React components. Material Symbols Outlined font loading removed from `index.html`. Components migrated: ConductorInput, VideoControls, CardFooter, ChatContent, InsightCard, LensLaboratory, HelpModal, LibraryModal, LensPromptModal, QuizModule, CreatorStudio.

5. **Modal Consolidation** — LensPromptModal, LibraryModal, ConsentModal, LiveConversation, ValhallaGateway all refactored to use shared `Modal.tsx`. Custom overlay implementations removed. Focus trap and ARIA dialog roles guaranteed across all modals.

6. **Native Dialog Elimination** — `prompt()` in CreatorStudio replaced with a naming modal. `alert()` in CustomVirtuosoBuilder replaced with inline validation. `window.confirm()` in LibraryModal replaced with a confirmation dialog component.

7. **Toast Notification System** — New `ToastProvider` context + `useToast()` hook. Toasts render in a fixed-position container with framer-motion enter/exit. Three variants: success (green), error (red), info (blue). Auto-dismiss for success/info, persistent for error. Keyboard-dismissible.

8. **Skeleton Loading** — New `Skeleton` component (shimmer animation). InsightCard loading state shows skeleton matching expected content layout. ChatContent shows typing skeleton. LibraryModal shows skeleton list items.

9. **Keyboard Shortcuts** — New `useKeyboardShortcuts` hook registered in Workspace. Shortcut registry maps key combinations to handlers. Shortcuts disabled when modals are open or input is focused (except Escape). Documented in Help modal.

10. **Command Palette** — New `CommandPalette` component (Cmd/Ctrl+K). Fuzzy-searchable list of actions: apply lens, toggle theme, export, open settings, open help, navigate views. framer-motion animated overlay.

11. **Responsive Breakpoints** — Workspace CSS gains breakpoints at 768px and 1024px. Timeline collapses, Lens Laboratory becomes drawer, lens palette adapts, conductor input remains full-width.

12. **Inline Style Migration** — All inline `style={{}}` objects in ProviderSettingsCard, ExportNLEModal, LensLaboratory, VideoControls, InsightContentRenderer, CustomVirtuosoBuilder migrated to CSS classes in `index.css`.

13. **Dead Code Removal** — VideoPlayer.tsx, QuizContent.tsx, ParagraphContent.tsx deleted. Imports cleaned up.

### Non-Functional Requirements:

- **Performance:** No increase in bundle size beyond Inter font addition (Material Symbols removal offsets this). No layout shift on theme switch. Skeleton animations use transform/opacity only (GPU-accelerated).
- **Accessibility:** WCAG AA contrast ratios in both themes. All new interactive elements have focus states. Toasts are ARIA-live regions. Command palette is keyboard-navigable. Shortcuts don't conflict with screen reader commands.
- **Reliability:** Zero test regressions. All 438 existing tests pass. New tests added for theme provider, toast system, keyboard shortcuts.
- **Compatibility:** Works in Chrome, Firefox, Safari, Edge. `prefers-color-scheme` supported, falls back to dark if unsupported.

## Visual Design

### Color Tokens (Dark Theme — primary, matches existing workspace)
```
--bg-base: #121212
--bg-surface: #1e1e1e
--bg-surface-hover: #252525
--text-primary: #e0e0e0
--text-secondary: #b0b0b0
--text-tertiary: #757575
--accent: #8ab4f8
--accent-hover: #1a73e8
--border: #333333
--error: #cf6679
--success: #34a853
--warning: #fbbc04
```

### Color Tokens (Light Theme — new)
```
--bg-base: #ffffff
--bg-surface: #f7f8f8
--bg-surface-hover: #f0f1f2
--text-primary: #1a1a1a
--text-secondary: #555555
--text-tertiary: #888888
--accent: #1a73e8
--accent-hover: #1557b0
--border: #e0e0e0
--error: #d93025
--success: #188038
--warning: #f9ab00
```

### Spacing Tokens
```
--space-1: 0.25rem (4px)
--space-2: 0.5rem  (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem    (16px)
--space-5: 1.5rem  (24px)
--space-6: 2rem    (32px)
--space-8: 3rem    (48px)
```

### Radius Tokens
```
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-full: 100px
```

### Shadow Tokens
```
--shadow-sm: 0 1px 2px rgba(0,0,0,0.08)
--shadow-md: 0 4px 12px rgba(0,0,0,0.12)
--shadow-lg: 0 8px 24px rgba(0,0,0,0.16)
```

### Typography Tokens
```
--font-sans: 'Inter', system-ui, -apple-system, sans-serif
--font-mono: 'Space Mono', monospace
--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem
```

## Existing Code to Leverage

- `src/components/shared/Modal.tsx` — shared modal pattern for all modal consolidation
- `src/lib/a11y.tsx` — accessibility utilities (focus trap, escape, screen reader)
- `src/components/landing/LandingPage.css` — reference for modern design values
- `src/components/docs/DocsPage.css` — reference for responsive patterns
- `src/components/shared/OrchestraVisualizer.tsx` — reference for component polish
- `framer-motion` / `motion` — already installed, used for all animations
- `lucide-react` — already installed, target icon system

## Out of Scope

- **Backend service UI changes** — API proxy, vector search, graph knowledge, media pipeline, CLIP embeddings are out of scope
- **Landing page redesign** — already modern, only font loading alignment needed
- **Docs page redesign** — already modern, only token alignment needed
- **New Virtuosos or lenses** — this is UI/UX only, no new AI capabilities
- **CRDT collaboration UI** — existing Yjs implementation unchanged
- **Valhalla sandbox logic** — only the gateway modal UI is in scope, not the execution engine
- **Firebase/Firestore changes** — no auth or data layer changes
- **Complete infinite canvas implementation** — the UI_UX.md vision describes an infinite canvas; that is a future phase. This spec addresses the current fixed-layout workspace.

## Quality Gates

- [ ] Quality Gate 1: Alignment validated — enhances readability/accessibility/discoverability without adding distraction
- [ ] Quality Gate 2: All 438 existing tests pass + new tests for theme, toast, shortcuts
- [ ] Quality Gate 3: Both themes verified at WCAG AA contrast, no FOUC, responsive at 768/1024px
- [ ] Documentation: Help modal updated with keyboard shortcuts, design tokens documented in code comments