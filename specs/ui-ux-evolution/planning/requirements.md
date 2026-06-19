# UI/UX Evolution — Requirements (Phase 1)

## Feature Intent

Transform the Aura Symphony workspace from a fragmented, dated dark-only interface into a cohesive, modern design system that matches the quality of the landing page and docs — while preserving the project's "zero-surface" philosophy and progressive revelation architecture (Novice → Apprentice → Maestro).

## Problem Statement

The workspace UI was built incrementally as features were added. It now has three disconnected visual languages, hardcoded dark-only styling, monospace body font hostile to readability, no design token system, native browser dialogs, mixed icon libraries, no responsive breakpoints, and no loading/feedback patterns beyond spinners. The landing page and docs are genuinely modern; the workspace feels like a different product.

## User Value

- **Readability:** Switching from Space Mono to Inter for prose content improves reading speed ~30% for insight cards, chat, courses, and quizzes.
- **Accessibility:** Light/dark theme with system preference detection meets 2026 user expectations and WCAG AA contrast requirements.
- **Discoverability:** Labeled lens palette, empty states, and onboarding moments reduce time-to-first-insight for new users.
- **Consistency:** Unified design tokens eliminate the visual whiplash between surfaces and make future development faster.
- **Polish:** Custom modals, toast notifications, skeleton loaders, and micro-interactions bring the workspace to the polish level of the landing page.

## Who Benefits

- **New users** — onboarding, discoverability, empty states, labeled lenses
- **Power users** — keyboard shortcuts, command palette, responsive design, light/dark toggle
- **Developers** — design tokens replace ad-hoc values, single icon system, shared modal pattern, maintainable CSS
- **Accessibility users** — proper focus management, light/dark contrast, ARIA compliance

## Constraints

- **Must preserve:** SymphonyBus event architecture, Virtuoso system, all existing functionality, framer-motion animations, the "zero-surface" progressive revelation philosophy from UI_UX.md
- **Must not break:** 438 existing tests, component APIs, Firebase integration, backend service contracts
- **Component size:** All frontend components must remain under 400 lines
- **Stack:** React 19, Vite 6, TypeScript, CSS (no CSS-in-JS frameworks to add), framer-motion/motion for animations
- **Icons:** Consolidate to Lucide React (already a dependency); remove Material Symbols Outlined
- **Fonts:** Inter for body/UI, Space Mono reserved for timestamps, code blocks, and data tables only

## Existing Code to Leverage

### Reuse directly:
- `src/components/shared/Modal.tsx` — accessible modal with focus trap, escape, ARIA. Gold standard for all modals.
- `src/lib/a11y.tsx` — keyboard activator, screen reader announcer, focus trap, escape key, visually hidden. Solid foundation.
- `src/components/landing/LandingPage.css` — modern design language (Inter, glassmorphism, pill buttons, black canvas). Reference for token values.
- `src/components/docs/DocsPage.css` — sidebar nav, search, responsive breakpoints. Reference for workspace responsive patterns.
- `src/components/shared/OrchestraVisualizer.tsx` — most polished workspace component (animated cards, pulse effects, progress bars). Reference for workspace component quality.
- `src/components/analysis/Timeline.tsx` — vertical timeline with spring animations, collapse/expand. Good framer-motion pattern reference.
- `src/components/analysis/InsightCard.tsx` — good expand/collapse layout animations. Pattern reference.

### Refactor / migrate:
- `src/styles/index.css` — central stylesheet, needs token system overhaul (currently 7 dark-only CSS variables, no spacing/radius/shadow/type tokens)
- `index.html` — font loading (currently Space Mono + Material Symbols; needs Inter + Space Mono for code only, remove Material Symbols)
- `src/components/settings/ProviderSettingsCard.tsx` — 200-line inline styles object, needs migration to CSS classes
- `src/components/settings/providerSettingsCardStyles.ts` — inline style definitions, to be replaced by CSS classes
- `src/components/analysis/ExportNLEModal.tsx` — inline styles, migrate to CSS
- `src/components/analysis/LensLaboratory.tsx` — inline styles on header, migrate to CSS
- `src/components/analysis/VideoControls.tsx` — inline styles, migrate to CSS
- `src/components/analysis/InsightContentRenderer.tsx` — inline styles on TTS button, migrate to CSS
- `src/components/virtuosos/CustomVirtuosoBuilder.tsx` — inline styles throughout, migrate to CSS; replace alert() with custom modal
- `src/components/creator/CreatorStudio.tsx` — replace prompt() with custom modal
- `src/components/creator/LibraryModal.tsx` — replace window.confirm() with custom modal; migrate to shared Modal.tsx
- `src/components/lenses/LensPromptModal.tsx` — migrate to shared Modal.tsx (currently custom overlay, no focus trap)
- `src/components/course/ConsentModal.tsx` — migrate to shared Modal.tsx
- `src/components/shared/LiveConversation.tsx` — migrate to shared Modal.tsx
- `src/components/valhalla/ValhallaGateway.tsx` — migrate to shared Modal.tsx
- `src/components/conductor/ConductorInput.tsx` — Material Symbols icons, migrate to Lucide
- `src/components/analysis/VideoControls.tsx` — Material Symbols icons, migrate to Lucide
- `src/components/analysis/CardFooter.tsx` — Material Symbols icons, migrate to Lucide
- `src/components/analysis/insight-content/ChatContent.tsx` — Material Symbols icons, migrate to Lucide
- `src/components/analysis/InsightCard.tsx` — Material Symbols icons (neurology, unfold_less, unfold_more, close), migrate to Lucide

### Remove (dead code):
- `src/components/analysis/VideoPlayer.tsx` — stub returning `<div>Video Player</div>`
- `src/components/analysis/insight-content/QuizContent.tsx` — stub returning `<div>Quiz Content</div>`
- `src/components/analysis/insight-content/ParagraphContent.tsx` — stub returning `<div>Paragraph Content</div>`

## Visual Assets

No external mockups provided. The design direction is established by:
1. Landing page (`LandingPage.css`) — the target quality bar
2. Docs page (`DocsPage.css`) — responsive reference
3. OrchestraVisualizer — the target workspace component quality
4. UI_UX.md design philosophy — progressive revelation, zero-surface, concert hall metaphor

## Design-Principle Alignment (Pre-Gate 1 Check)

- **Enhances human capability?** Yes — better readability, discoverability, and accessibility directly enhance the conductor's ability to work with media.
- **Supports focus?** Yes — unified design language reduces cognitive load from visual inconsistency. Dark/light theme reduces eye strain.
- **Transparent (glass-box)?** Yes — design tokens make the system's visual logic legible and maintainable. No hidden complexity.

**Verdict:** Aligned. Proceed to Phase 2.