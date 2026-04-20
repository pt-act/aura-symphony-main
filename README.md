# Aura Symphony

Aura is a zero-surface, multi-agent platform for deep video analysis, generative media creation, and adaptive learning. Step into the conductor's shoes and let the Virtuosos do the heavy lifting.

## Features

### The Virtuosos
Aura is powered by a multi-agent architecture. Each agent, or "Virtuoso," is an expert in a specific domain:
- **The Conductor:** The orchestrator. It parses your intent and routes tasks.
- **The Visionary:** The visual analyst. It uses Gemini's multimodal capabilities to extract deep insights from video frames and images.
- **The Scholar:** The researcher. It grounds analysis in real-world facts using Google Search.
- **The Artisan:** The creator. It uses Veo and Imagen to generate new media assets.
- **The Analyst:** The logician. It synthesizes data, creates structured courses, and tracks learning progress.
- **The Chronicler:** The documentarian. It summarizes sessions and exports data.

### Advanced Capabilities
- **Semantic Video Search:** Ask the Conductor questions like "Where did they discuss the black hole?" and it will instantly drop markers on the timeline at the exact timestamps.
- **Voice-Activated Conductor:** Click the microphone icon or use the wake word to speak your commands naturally, achieving a true "zero-surface" experience.
- **WebWorker Processing:** Heavy media processing (like frame extraction) is offloaded to background threads, ensuring the UI remains buttery smooth.
- **NLE Integration:** Export your timeline, annotations, and generated assets directly to Premiere Pro, Final Cut Pro, or DaVinci Resolve via FCPXML, EDL, or CSV.
- **Agent Studio (Custom Virtuosos):** Build your own custom AI agents. Define their system prompts, capabilities, and models to fit your exact niche, and they will be instantly available to the Conductor.

### Project Valhalla
Project Valhalla is Aura's bridge to the outside world. It allows the AI agents to control external creative software (like Blender, Ableton, or Figma) by generating and executing automation scripts in sandboxed environments.

### Adaptive Learning
Aura isn't just for analysis; it's an educational platform. The "Create Course" lens transforms any video into a structured learning module. As you take quizzes, Aura tracks your performance in a Digital Learner Profile (DLP). If you struggle with a concept, the system adapts, offering remedial content and guided hints to ensure mastery.

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com/apikey))

### Setup

1. Clone and install:
   ```bash
   git clone <repo-url> && cd aura-symphony
   npm install
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=AIzaSy...your_actual_key
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

The app runs at `http://localhost:3000`.

### API Configuration

Aura supports **two ways** to supply an AI provider key:

| Method | Description |
|--------|-------------|
| **In-App Settings (recommended)** | Click the ⚙️ Settings icon in the toolbar to open the **AI Provider Settings** panel. From there you can add one or more providers, each with its own **Base URL**, **API Key**, and **Model**. The active provider is used for all AI calls. A **Test Connection** button validates the key and model before you commit. Settings are persisted in `localStorage`. |
| **`.env` file (fallback)** | Set `GEMINI_API_KEY` in a `.env` file at the project root. Vite injects it as `process.env.API_KEY` at build time via `define` in `vite.config.ts`. This key is used only when no custom provider is configured in Settings. |

> **Resolution order:** `getAI()` checks for an active provider with a non-empty API key first. If none exists, it falls back to the `.env`-based default client. `getEffectiveModel(registryModel)` similarly returns the user's custom model when set, or the per-virtuoso default otherwise.

> **Compatibility:** The Settings panel supports any OpenAI-compatible API (Google AI, Anthropic via proxy, Ollama, local LLMs, etc.).

## Architecture

Aura is built with React, Vite, and Firebase. It leverages the `@google/genai` SDK for interacting with Gemini models. The multi-agent system communicates via a custom event bus (`SymphonyBus`), allowing agents to delegate tasks to one another asynchronously.

## License
Apache 2.0
