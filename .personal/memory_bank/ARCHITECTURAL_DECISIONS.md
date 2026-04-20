# Architectural Decisions
## Tech Decisions with Rationale - Newest First

### Mon Apr 06 2026
#### Event-Driven Communication (SymphonyBus)
**Decision**: Implement custom event bus using DOM CustomEvent for loose coupling between components
**Rationale**: 
- Avoids prop drilling in deeply nested component tree
- Provides type-safe communication through TypeScript interfaces
- Enables independent development of features
- Lightweight compared to external state management libraries
- Maintains "glass box" transparency - easy to trace event flow

**Alternatives Considered**:
- Redux Toolkit: Rejected due to boilerplate and learning curve outweighing benefits for current scale
- Zustand: Rejected to keep bundle size minimal and avoid additional dependency
- React Context: Rejected due to potential over-rendering issues with frequent updates

#### Custom Hooks for State Management
**Decision**: Use custom hooks (useAnalysisState, useCreatorState, etc.) to encapsulate related state and logic
**Rationale**:
- Separates concerns between analysis and creator workflows
- Encapsulates complex state transitions and side effects
- Enables reuse across components
- Follows React best practices for stateful logic
- Improves testability by isolating state management

#### Worker-Based Media Processing
**Decision**: Use Web Workers for media-intensive operations (video frame extraction, audio analysis)
**Rationale**:
- Prevents blocking the main thread during intensive operations
- Maintains responsive UI for user interactions
- Leverages multi-core processing capabilities
- Isolates media processing errors from UI layer
- Aligns with performance-conscious development

#### Modular Component Architecture
**Decision**: Organize components by feature/domain rather than type (analysis/, creator/, shared/, etc.)
**Rationale**:
- Improves discoverability of related components
- Enables easier refactoring and maintenance
- Supports gradual adoption of new patterns
- Reduces cognitive load when working on specific features
- Follows domain-driven design principles

#### Firebase Backend Selection
**Decision**: Use Firebase (Firestore, Auth) for backend services
**Rationale**:
- Provides real-time synchronization for collaborative features
- Handles authentication and security rules out-of-box
- Scales automatically with user growth
- Offers generous free tier for development
- Integrates well with Google's AI services (GenAI)
- Reduces backend infrastructure maintenance burden

[Creative_State: ALIGNED]