/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
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

import {FunctionDeclaration, Type} from '@google/genai';

export const conductorFunctions: FunctionDeclaration[] = [
  {
    name: 'generate_summary',
    description: 'Summarizes the video content into a concise paragraph.',
    parameters: {type: Type.OBJECT, properties: {}},
  },
  {
    name: 'list_key_moments',
    description:
      'Identifies and lists the key moments from the video as bullet points.',
    parameters: {type: Type.OBJECT, properties: {}},
  },
  {
    name: 'generate_instructions',
    description:
      'Creates a step-by-step guide or walkthrough based on the video content.',
    parameters: {type: Type.OBJECT, properties: {}},
  },
  {
    name: 'create_haiku',
    description: 'Writes a haiku inspired by the video content.',
    parameters: {type: Type.OBJECT, properties: {}},
  },
  {
    name: 'create_mermaid_diagram',
    description:
      'Generates a Mermaid.js diagram to visualize a process or structure shown in the video.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description:
            'A brief description of what the diagram should represent, e.g., "the user login flow".',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'create_chart',
    description:
      'Generates chart data analyzing a specific metric over the course of the video.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        metric: {
          type: Type.STRING,
          description:
            'The metric to analyze, e.g., "excitement", "importance", "number of people".',
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'generate_image',
    description: 'Generates a new image from a text description.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'A detailed description of the image to generate.',
        },
        aspect_ratio: {
          type: Type.STRING,
          description:
            'The desired aspect ratio. Supported values are "1:1", "16:9", "9:16". Defaults to "16:9".',
          enum: ['1:1', '16:9', '9:16'],
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'edit_image',
    description:
      'Edits an existing image based on text instructions. This will require the user to upload an image.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description:
            'The instructions for how to edit the image, e.g., "add a hat to the cat".',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'generate_video',
    description: 'Generates a short video from a text description.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'A detailed description of the video to generate.',
        },
        aspect_ratio: {
          type: Type.STRING,
          description:
            'The desired aspect ratio. Supported values are "16:9" (landscape) or "9:16" (portrait). Defaults to "16:9".',
          enum: ['16:9', '9:16'],
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'web_search',
    description:
      'Performs a web search to answer a question or find information.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The question or topic to search for on the web.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_video',
    description: 'Searches the entire video for specific content, objects, actions, or spoken words and returns a list of timestamps where they occur.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'What to search for in the video (e.g., "a red car", "someone says hello", "an explosion").',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'custom_video_analysis',
    description:
      'Performs a custom analysis on the video based on specific user instructions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        instructions: {
          type: Type.STRING,
          description:
            'The specific, detailed instructions for what to analyze in the video.',
        },
      },
      required: ['instructions'],
    },
  },
  {
    name: 'launch_valhalla',
    description:
      'Launches the Project Valhalla Gateway to interact with external tools like Blender or Ableton.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tool: {
          type: Type.STRING,
          description:
            'The name of the external tool to launch, e.g., "Blender", "Ableton", "Figma".',
        },
      },
      required: ['tool'],
    },
  },
  {
    name: 'applyLens',
    description: 'Applies a specific Virtuoso Lens to the video.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        lensName: {
          type: Type.STRING,
          description: 'The name of the lens to apply (e.g., "Deep Analysis", "Web Search").',
        },
        customPrompt: {
          type: Type.STRING,
          description: 'An optional custom prompt to pass to the lens.',
        },
      },
      required: ['lensName'],
    },
  },
  {
    name: 'seekToTime',
    description: 'Seeks the video player to a specific time in seconds.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timeInSeconds: {
          type: Type.NUMBER,
          description: 'The time in seconds to seek to.',
        },
      },
      required: ['timeInSeconds'],
    },
  },
  {
    name: 'setPlaybackSpeed',
    description: 'Sets the playback speed of the video player.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        speed: {
          type: Type.NUMBER,
          description: 'The playback speed (e.g., 0.5, 1, 1.5, 2).',
        },
      },
      required: ['speed'],
    },
  },
  {
    name: 'addAnnotation',
    description: 'Adds an annotation to the timeline at a specific time.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timeInSeconds: {
          type: Type.NUMBER,
          description: 'The time in seconds for the annotation.',
        },
        text: {
          type: Type.STRING,
          description: 'The text of the annotation.',
        },
      },
      required: ['timeInSeconds', 'text'],
    },
  },
  {
    name: 'setSelectionRange',
    description: 'Sets the selection range on the timeline.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        startTime: {
          type: Type.NUMBER,
          description: 'The start time in seconds.',
        },
        endTime: {
          type: Type.NUMBER,
          description: 'The end time in seconds.',
        },
      },
      required: ['startTime', 'endTime'],
    },
  },
];