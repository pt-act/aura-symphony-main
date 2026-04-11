/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  AlignLeft,
  BarChart,
  BookOpen,
  Captions,
  Clock,
  Feather,
  FileText,
  Globe,
  Image as ImageIcon,
  ImagePlus,
  ListChecks,
  Mic,
  Network,
  PhoneCall,
  Search,
  Table,
  Video,
  Wand2,
} from 'lucide-react';

export default {
  'Create Course': {
    icon: BookOpen,
    prompt: '', // Handled by a dedicated API call
    isList: false, // This will generate multiple insights
    description:
      'Generates a mini-course from the video, including a summary, key moments, and a quiz.',
  },
  'A/V captions': {
    icon: Captions,
    prompt: `For each scene in this video, generate captions that describe the \
    scene along with any spoken text placed in quotation marks. Place each \
    caption into an object sent to set_timecodes with the timecode of the caption \
    in the video.`,
    isList: true,
    description:
      'Generates a scene-by-scene transcript, capturing both spoken dialogue and visual descriptions.',
  },

  Paragraph: {
    icon: AlignLeft,
    prompt: `Generate a paragraph that summarizes this video. Keep it to 3 to 5 \
sentences. Place each sentence of the summary into an object sent to \
set_timecodes with the timecode of the sentence in the video.`,
    isList: false,
    description:
      'Creates a concise, 3-5 sentence summary of the entire video, with each sentence linked to its relevant timecode.',
  },

  'Key moments': {
    icon: Clock,
    prompt: `Generate bullet points for the video. Place each bullet point into an \
object sent to set_timecodes with the timecode of the bullet point in the video.`,
    isList: true,
    description:
      'Extracts the most important highlights and presents them as a clickable list of bullet points.',
  },

  'In-strukt': {
    icon: ListChecks,
    prompt: `Analyze the provided video and generate a detailed step-by-step walkthrough or a set of instructions based on its content. Each step should be clear, concise, and actionable. For each step, call set_timecodes with the instruction text and its corresponding start timecode in the video.`,
    isList: true,
    description:
      'Generates a detailed, step-by-step walkthrough from the video content, perfect for tutorials and guides.',
  },

  Table: {
    icon: Table,
    prompt: `Choose 5 key shots from this video and call set_timecodes_with_objects \
with the timecode, text description of 10 words or less, and a list of objects \
visible in the scene (with representative emojis).`,
    isList: false,
    description:
      'Identifies 5 key shots and organizes them into a table with descriptions and a list of visible objects.',
  },

  Haiku: {
    icon: Feather,
    prompt: `Generate a haiku for the video. Place each line of the haiku into an \
object sent to set_timecodes with the timecode of the line in the video. Make sure \
to follow the syllable count rules (5-7-5).`,
    isList: false,
    description:
      'Generates a 5-7-5 syllable haiku that creatively captures the essence of the video.',
  },

  Chart: {
    icon: BarChart,
    prompt: (input: string) =>
      `Generate chart data for this video based on the following instructions: \
${input}. Call set_timecodes_with_numeric_values once with the list of data values and timecodes.`,
    subModes: {
      Excitement:
        'for each scene, estimate the level of excitement on a a scale of 1 to 10',
      Importance:
        'for each scene, estimate the level of overall importance to the video on a scale of 1 to 10',
      'Number of people': 'for each scene, count the number of people visible',
    },
    isList: false,
    description:
      'Creates a chart by analyzing a specific metric (e.g., excitement, importance) throughout the video.',
  },

  Mermaid: {
    icon: Network,
    prompt: `Analyze this video and generate a Mermaid.js diagram that represents its structure, flow, or key concepts. The diagram should be a flowchart, sequence diagram, or another appropriate type. Output only the Mermaid code block inside a \`\`\`mermaid block.`,
    isList: false,
    description:
      'Generates a Mermaid.js diagram (e.g., flowchart) to visualize the structure or workflow shown in the video.',
  },

  Custom: {
    icon: Wand2,
    prompt: (input: string) =>
      `Call set_timecodes once using the following instructions: ${input}`,
    isList: true,
    description:
      'Provide your own custom prompt to analyze the video and generate a time-coded list of results.',
  },
  'Deep Analysis': {
    icon: Search,
    prompt: (input: string) =>
      `Call set_timecodes once using the following instructions: ${input}`,
    isList: true,
    description:
      'Uses Thinking Mode for complex, in-depth video analysis based on your prompt.',
  },
  'Web Search': {
    icon: Globe,
    prompt: (input: string) => input, // The prompt is just the input
    isList: false, // will produce text and sources
    description: 'Uses Google Search to answer questions about current events or topics.',
  },
  'PDF Analysis': {
    icon: FileText,
    prompt: (input: string) => input,
    isList: false,
    description: 'Upload a PDF to ask questions or get a summary.',
  },
  'Transcribe Audio': {
    icon: Mic,
    prompt: '',
    isList: false,
    description:
      'Records audio from your microphone and transcribes it to text.',
  },
  'Live Conversation': {
    icon: PhoneCall,
    prompt: '',
    isList: false,
    description: 'Start a real-time voice conversation with Gemini.',
  },
  'Generate Image': {
    icon: ImageIcon,
    prompt: (input: string) => `Generate an image with the prompt: ${input}`,
    isList: false,
    description: 'Generates a new image from a text prompt using Imagen.',
  },
  'Edit Image': {
    icon: ImagePlus,
    prompt: (input: string) => `Edit the image with the instruction: ${input}`,
    isList: false,
    description: 'Edits an uploaded image based on your text instructions.',
  },
  'Generate Video': {
    icon: Video,
    prompt: (input: string) => `Generate a video with the prompt: ${input}`,
    isList: false,
    description:
      'Generates a new video from a text prompt and an optional starting image.',
  },
};