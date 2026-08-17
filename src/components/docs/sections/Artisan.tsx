import React from "react";
import { CodeBlock, PropTable, Callout, FileRef, VirtuosoDoc } from './utils';
export default function () {
  return <VirtuosoDoc
    label="Agent"
    name="The Artisan"
    file="src/api/virtuosos/artisan.ts"
    model="veo-3.1-fast-generate-preview"
    capabilities={['video-generation', 'image-generation', 'media-editing']}
    configNote="Video generation is non-blocking — it runs in the background via performVideoGeneration() and dispatches results via the Symphony Bus when complete. Image generation and editing are synchronous."
    description="The Artisan creates new media assets using Veo 3.1 (video generation), Imagen 4.0 (image generation), and Gemini Flash Image (image editing with multimodal output)."
    apiSignatures={`// Video generation (async, background)
function generateVideo(
  taskId: string | number,
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  image?: { mimeType: string; data: string }  // Optional reference image
): string | number

// Image generation via Imagen 4.0
async function generateImage(
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '9:16'
): Promise<string>  // Returns data:image/jpeg;base64,...

// Image editing via Gemini Flash Image
async function editImage(
  prompt: string,
  image: { mimeType: string; data: string }
): Promise<string>  // Returns data:image/png;base64,...`}
  />;
}