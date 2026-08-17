import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return <VirtuosoDoc
    label="Agent"
    name="The Chronicler"
    file="src/api/virtuosos/chronicler.ts"
    model="gemini-2.5-flash"
    capabilities={['summarization', 'report-generation', 'export-formatting', 'tts', 'transcription']}
    description="The Chronicler handles documentation, speech synthesis, and audio transcription. It uses Gemini's TTS model for voice generation and the Flash model for audio-to-text transcription."
    apiSignatures={`// Text-to-speech via Gemini TTS
async function generateSpeech(text: string): Promise<string>  // base64 audio

// Audio transcription
async function transcribeAudio(
  audio: { mimeType: string; data: string }
): Promise<string>  // Transcribed text`}
  />;
}