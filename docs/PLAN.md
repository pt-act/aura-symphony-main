# Project Plan: Aura - Media Canvas

This document outlines the development plan for Aura, an intelligent media analysis and creation platform. It reflects the current state of the application and maps a path toward the ambitious goals outlined in the `VISION.md` and `AGENTS.md` documents.

## Phase 1: Solidify Core Analysis & Interaction Features (Complete)

This phase focused on refining the foundational components of the application. The result is a stable, intuitive, and powerful media analysis tool.

-   **[✅] Media Ingestion:** Allow users to load video content from either a URL or a local file upload.
-   **[✅] Multi-modal Analysis Engine ("Lenses"):** Utilize Gemini's multi-modal capabilities to analyze video frames and offer a "Lens Palette" with a variety of pre-defined and custom analysis modes.
-   **[✅] Generative AI:** Integrate models for text-to-video (Veo), text-to-image (Imagen), and image-to-image to allow users to generate and edit new media content from prompts.
-   **[✅] Interactive Timeline:** Display video playback progress, enable time-range selection for focused analysis, and support timestamped annotations.
-   **[✅] Insight Visualization:** Display each analysis result in a dedicated "Insight Card" that appropriately renders different data types.
-   **[✅] Contextual Chat:** Provide a chat interface to discuss the video content, with support for file uploads to enrich the context.
-   **[✅] Data Export:** Implement robust export functionality for all generated insights into various formats (TXT, CSV, MD, PDF, JSON, etc.).

---

## Phase 2: Enhance Educational & Creative Tooling (Complete)

This phase built upon the core analysis by adding powerful features for creating structured educational content and presentations. This phase has been successfully implemented, integrating adaptive learning and a full-featured creator studio.

-   **[✅] Automated Course Generation:** Implement a "Create Course" lens that uses Gemini to generate a complete learning module from a video, including a summary, key moments, and a quiz.
-   **[✅] Adaptive Learning Course View:**
    -   **[✅] Biofeedback Integration:** Use on-device facial expression analysis (`face-api.js`) to detect user engagement and frustration, enabling the system to adapt.
    -   **[✅] Dynamic Adaptation:** Automatically trigger a "remedial" layout for review upon poor quiz performance and provide guided hints if a user appears stuck on a question.
    -   **[✅] Digital Learner Profile (DLP):** Track user performance on quizzes to build and visualize a "Knowledge Graph" of their mastery over different concepts.
-   **[✅] Creator Studio:**
    -   **[✅] Foundation & Persistence:** Build a dedicated view for creating and editing slide-based presentations, with Firebase/Firestore integration for user authentication and data persistence.
    -   **[✅] Content Integration:** Bridge the Analysis and Creator views, allowing users to seamlessly send generated insights to the presentation editor as new slides.

---

## Phase 3: Realize the "Aura Symphony" Vision (Current Focus)

This phase begins the evolution from a tool-based interface into the "live orchestra" envisioned in `VISION.md`.

-   **[✅] Step 3.1: The Symphony Bus - Foundational Messaging**
    -   **Description:** Implement a robust, real-time messaging bus as the core communication layer. This will decouple the front-end from the back-end AI calls, allowing for asynchronous task management and preparing the architecture for multi-agent collaboration.
    -   **Key Tasks:**
        -   **[✅]** Create a `ChimeraTaskStatus.tsx` component to monitor the status of long-running, asynchronous AI tasks initiated via the bus.
        -   **[✅]** Refactor existing API calls in `api.ts` to dispatch messages to the bus and listen for results.

-   **[✅] Step 3.2: The Conductor AI - The Zero-Surface Interface**
    -   **Description:** Begin the transition from a tool-based UI to a primary conversational interface. The "Conductor" is a central AI agent that interprets natural language commands and dispatches tasks over the Symphony Bus.
    -   **Key Tasks:**
        -   **[✅]** Develop a new primary input component that prioritizes text and voice.
        -   **[✅]** Implement the core logic for the Conductor agent to parse user intent and map it to existing functionalities.

-   **[ 🚧 ] Step 3.3: Evolve the UI Towards "The Conductor's Interface"**
    -   **Description:** Iteratively refactor the application's UI to match the progressive, "zero-surface" design outlined in `UI_UX.md`.
    -   **Key Tasks:**
        -   **[✅] 3.3.1: Implement the "Conductor's Baton" (Omnibar) as the primary interface.** Remove the old Lens Palette and position the new Conductor input as the central, floating interaction point.
        -   **[✅] 3.3.2: Refactor the Analysis View into the "Lens Laboratory" side panel.** Transition from a grid-based layout to a single-column, list-based view for all Insight Cards.
        -   **[✅] 3.3.3: Design the "Orchestra Visualizer".** Evolve the `ChimeraTaskStatus` component into the richer, more informative visualization of active AI agents.
        -   **[✅] 3.3.4: Implement the "Master Score".** Redesign the timeline as a vertical, collapsible ribbon on the left edge of the canvas.

-   **[ 🚧 ] Step 3.4: The Assembled Orchestra - Multi-Agent Collaboration**
    -   **Description:** Transition from simple function-calling to a true multi-agent architecture. The Conductor delegates "Commissions" to specialized "Sovereign Virtuosos," each powered by a model and configuration optimized for their specific domain (e.g., Analysis, Generation, Search).
    -   **Key Tasks:**
        -   **[✅] 3.4.1: Define the Virtuoso Registry.** Create a registry of specialized agent profiles (Visionary, Scholar, Artisan, Analyst) with unique system instructions, model selections, and domain expertise.
        -   **[✅] 3.4.2: Implement the Commission Protocol.** Refactor the Symphony Bus to support "Commissions"—asynchronous requests that agents "claim" or are assigned based on their expertise.
        -   **[✅] 3.4.3: Multi-Model Orchestration.** Integrate specific Gemini, Veo, and Imagen models tailored to each Virtuoso's domain, ensuring the "strongest suit" is used for every task.

-   **[ aspirational ] Step 3.5: Project Valhalla - The Ghost-in-the-Machine**
    -   **Description:** The ultimate goal. Develop the protocol for AI agents to control external, third-party creative software. This involves creating secure, sandboxed environments and multimodal control systems.
    -   **Key Tasks:**
        -   Research and prototype secure environments for running external software.
        -   Develop the "Eyes" (UI vision), "Hands" (automation control), and "Knowledge" (scripting) components for a single target application (e.g., Blender).