# Aura Symphony Project - Master Context
## Strategic Overview - Updated: Mon Apr 06 2026

### Project Vision
Aura Symphony is an immersive multimedia creation platform that combines AI-assisted analysis, generative AI, and collaborative tools for musicians, artists, educators, and content creators. The platform enables users to analyze, annotate, and transform multimedia content into structured learning experiences and artistic compositions.

### Core Principles
1. **Glass Box Philosophy**: Transparent systems that users can understand and trust
2. **Keyboard-Centric Workflow**: Prioritizing efficiency and flow state for creators
3. **Consciousness Expansion**: Technology as a tool for enlightenment, not mere engagement
4. **Elegant Systems**: Well-structured code following "less, but better" principle
5. **Meaningful Connections**: Facilitating high-bandwidth, authentic interactions

### Technical Stack
- Frontend: React 19, TypeScript, Vite, Framer Motion
- Backend: Firebase (Firestore, Auth), Google GenAI
- Styling: CSS modules, classnames
- State Management: Custom hooks, Context API (via symphonyBus)
- Media Processing: HTML5 Canvas, Video API, FFmpeg concepts via web workers
- Export Formats: FCPXML, EDL, CSV for professional workflow integration

### Current Phase
Foundation implementation - core multimedia analysis and creation workflows established.

### Key Features Implemented
- Multimedia ingestion and analysis timeline
- AI-powered virtuoso assistants (Visionary, Scholar, Conductor, Artisan, Analyst, Chronicler)
- **Provider Settings (operational)**: Dynamic AI provider/model selection via Settings UI, persisted in localStorage, consumed by all API modules via `getAI()` / `getEffectiveModel()`
- Annotation system with timecode synchronization
- Creator Studio for presentation building
- Live conversation and collaboration features
- Export capabilities (FCPXML, EDL, CSV)
- Custom virtuoso builder for personalized AI assistants
- Valhalla Gateway for external tool integration (Blender, Ableton, etc.)

### Architecture Overview
- Modular component structure with clear separation of concerns
- Event-driven communication via SymphonyBus
- Custom hooks for state management (useAnalysisState, useCreatorState, etc.)
- Service layer for API integrations and business logic
- Worker-based media processing for performance
- Extensible virtuoso system for AI assistant customization

### Immediate Priorities
1. Code quality maintenance (frontend components under 400 lines)
2. Performance optimization for media-heavy operations
3. User experience refinement based on interaction patterns
4. Documentation and knowledge transfer preparation
5. Security audit and data protection measures

[Creative_State: ALIGNED]