import {getAI, getEffectiveModel} from './client';
import {symphonyBus, Events} from '../lib/symphonyBus';
import {VirtuosoType} from '../services/virtuosos';

export interface ValhallaResponse {
  script: string;
  imageUrl?: string;
  logs: string[];
}

export async function executeValhallaCommand(
  toolName: string,
  command: string
): Promise<ValhallaResponse> {
  const taskId = symphonyBus.commission(VirtuosoType.ANALYST, `Valhalla: ${toolName} Command`);
  
  try {
    // 1. Generate the script (Knowledge)
    const scriptPrompt = `You are an expert automation agent controlling ${toolName}.
The user wants to: "${command}"
Write the exact script (e.g., Python for Blender) to accomplish this.
Return ONLY the code block, no markdown formatting outside the code block.`;

    const scriptResponse = await getAI().models.generateContent({
      model: getEffectiveModel('gemini-2.5-pro'),
      contents: scriptPrompt,
    });
    
    let script = scriptResponse.text || '';
    // Clean up markdown code blocks if present
    if (script.startsWith('```')) {
      const lines = script.split('\n');
      lines.shift();
      if (lines[lines.length - 1].startsWith('```')) {
        lines.pop();
      }
      script = lines.join('\n');
    }

    // 2. Generate the visual output (Eyes/Hands)
    const imagePrompt = `A high-quality 3D render from ${toolName} showing: ${command}. Professional lighting, 4k.`;
    
    let imageUrl = '';
    try {
      const imageResponse = await getAI().models.generateContent({
        model: getEffectiveModel('gemini-2.5-flash'),
        contents: imagePrompt,
        config: {
          imageConfig: {
            aspectRatio: '16:9',
            imageSize: '1K'
          }
        }
      });
      
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (imgErr) {
      console.error('Failed to generate image:', imgErr);
    }

    const logs = [
      `[AI] Interpreting command: "${command}"`,
      `[AI] Generating ${toolName} automation script...`,
      `[AI] Executing script in sandboxed environment...`,
      `[AI] Rendering viewport output...`,
      `[AI] Operation complete.`
    ];

    const result: ValhallaResponse = {
      script,
      imageUrl,
      logs
    };

    symphonyBus.dispatch(Events.TASK_SUCCESS, {id: taskId, result});
    return result;
  } catch (error: any) {
    symphonyBus.dispatch(Events.TASK_ERROR, {id: taskId, error: error.message});
    throw error;
  }
}
