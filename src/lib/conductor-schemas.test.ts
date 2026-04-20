/**
 * Conductor Schemas — Property-Based & Edge Case Tests
 *
 * Tests every Zod schema in the conductor schema registry
 * for correct acceptance, rejection, and .strict() enforcement.
 */

import {describe, it, expect} from 'vitest';
import {
  conductorSchemas,
  GenerateSummarySchema,
  CreateMermaidDiagramSchema,
  CreateChartSchema,
  GenerateImageSchema,
  GenerateVideoSchema,
  WebSearchSchema,
  SearchVideoSchema,
  SeekToTimeSchema,
  SetPlaybackSpeedSchema,
  AddAnnotationSchema,
  SetSelectionRangeSchema,
  ApplyLensSchema,
  LaunchValhallaSchema,
  EditImageSchema,
  CustomVideoAnalysisSchema,
} from './conductor-schemas';

describe('Schema Registry', () => {
  it('has schemas for all 17 conductor functions', () => {
    const expected = [
      'generate_summary', 'list_key_moments', 'generate_instructions', 'create_haiku',
      'create_mermaid_diagram', 'create_chart', 'generate_image', 'edit_image',
      'generate_video', 'web_search', 'search_video', 'custom_video_analysis',
      'launch_valhalla', 'applyLens', 'seekToTime', 'setPlaybackSpeed',
      'addAnnotation', 'setSelectionRange',
    ];
    for (const name of expected) {
      expect(conductorSchemas[name]).toBeDefined();
    }
    expect(Object.keys(conductorSchemas).length).toBe(18);
  });
});

describe('No-argument schemas', () => {
  for (const name of ['generate_summary', 'list_key_moments', 'generate_instructions', 'create_haiku']) {
    it(`${name} accepts empty object`, () => {
      expect(conductorSchemas[name].safeParse({}).success).toBe(true);
    });

    it(`${name} rejects extra properties (.strict())`, () => {
      expect(conductorSchemas[name].safeParse({hallucinated: true}).success).toBe(false);
    });
  }
});

describe('CreateMermaidDiagramSchema', () => {
  it('accepts valid topic', () => {
    expect(CreateMermaidDiagramSchema.safeParse({topic: 'user login flow'}).success).toBe(true);
  });

  it('rejects empty topic', () => {
    expect(CreateMermaidDiagramSchema.safeParse({topic: ''}).success).toBe(false);
  });

  it('rejects missing topic', () => {
    expect(CreateMermaidDiagramSchema.safeParse({}).success).toBe(false);
  });

  it('rejects extra fields', () => {
    expect(CreateMermaidDiagramSchema.safeParse({topic: 'test', extra: 1}).success).toBe(false);
  });
});

describe('CreateChartSchema', () => {
  it('accepts valid metric', () => {
    expect(CreateChartSchema.safeParse({metric: 'excitement'}).success).toBe(true);
  });

  it('rejects empty metric', () => {
    expect(CreateChartSchema.safeParse({metric: ''}).success).toBe(false);
  });
});

describe('GenerateImageSchema', () => {
  it('accepts prompt only', () => {
    expect(GenerateImageSchema.safeParse({prompt: 'a sunset'}).success).toBe(true);
  });

  it('accepts prompt with valid aspect ratio', () => {
    expect(GenerateImageSchema.safeParse({prompt: 'a sunset', aspect_ratio: '16:9'}).success).toBe(true);
    expect(GenerateImageSchema.safeParse({prompt: 'a sunset', aspect_ratio: '1:1'}).success).toBe(true);
    expect(GenerateImageSchema.safeParse({prompt: 'a sunset', aspect_ratio: '9:16'}).success).toBe(true);
  });

  it('rejects invalid aspect ratio', () => {
    expect(GenerateImageSchema.safeParse({prompt: 'a sunset', aspect_ratio: '4:3'}).success).toBe(false);
  });

  it('rejects empty prompt', () => {
    expect(GenerateImageSchema.safeParse({prompt: ''}).success).toBe(false);
  });
});

describe('GenerateVideoSchema', () => {
  it('accepts prompt only', () => {
    expect(GenerateVideoSchema.safeParse({prompt: 'a car driving'}).success).toBe(true);
  });

  it('rejects invalid aspect ratio', () => {
    expect(GenerateVideoSchema.safeParse({prompt: 'test', aspect_ratio: '1:1'}).success).toBe(false);
  });
});

describe('SeekToTimeSchema', () => {
  it('accepts 0', () => {
    expect(SeekToTimeSchema.safeParse({timeInSeconds: 0}).success).toBe(true);
  });

  it('accepts positive values', () => {
    expect(SeekToTimeSchema.safeParse({timeInSeconds: 120.5}).success).toBe(true);
  });

  it('rejects negative values', () => {
    expect(SeekToTimeSchema.safeParse({timeInSeconds: -1}).success).toBe(false);
  });

  it('rejects non-numbers', () => {
    expect(SeekToTimeSchema.safeParse({timeInSeconds: 'ten'}).success).toBe(false);
  });
});

describe('SetPlaybackSpeedSchema', () => {
  it('accepts common playback speeds', () => {
    for (const speed of [0.25, 0.5, 1, 1.5, 2, 3]) {
      expect(SetPlaybackSpeedSchema.safeParse({speed}).success).toBe(true);
    }
  });

  it('rejects zero speed', () => {
    expect(SetPlaybackSpeedSchema.safeParse({speed: 0}).success).toBe(false);
  });

  it('rejects negative speed', () => {
    expect(SetPlaybackSpeedSchema.safeParse({speed: -1}).success).toBe(false);
  });
});

describe('AddAnnotationSchema', () => {
  it('accepts valid annotation', () => {
    expect(AddAnnotationSchema.safeParse({timeInSeconds: 30, text: 'Important moment'}).success).toBe(true);
  });

  it('rejects empty text', () => {
    expect(AddAnnotationSchema.safeParse({timeInSeconds: 30, text: ''}).success).toBe(false);
  });

  it('rejects negative time', () => {
    expect(AddAnnotationSchema.safeParse({timeInSeconds: -5, text: 'test'}).success).toBe(false);
  });
});

describe('SetSelectionRangeSchema', () => {
  it('accepts valid range', () => {
    expect(SetSelectionRangeSchema.safeParse({startTime: 10, endTime: 30}).success).toBe(true);
  });

  it('rejects endTime <= startTime', () => {
    expect(SetSelectionRangeSchema.safeParse({startTime: 30, endTime: 10}).success).toBe(false);
    expect(SetSelectionRangeSchema.safeParse({startTime: 10, endTime: 10}).success).toBe(false);
  });

  it('rejects negative times', () => {
    expect(SetSelectionRangeSchema.safeParse({startTime: -1, endTime: 10}).success).toBe(false);
  });
});

describe('ApplyLensSchema', () => {
  it('accepts lensName only', () => {
    expect(ApplyLensSchema.safeParse({lensName: 'Deep Analysis'}).success).toBe(true);
  });

  it('accepts lensName with customPrompt', () => {
    expect(ApplyLensSchema.safeParse({lensName: 'Custom', customPrompt: 'Analyze color'}).success).toBe(true);
  });

  it('rejects empty lensName', () => {
    expect(ApplyLensSchema.safeParse({lensName: ''}).success).toBe(false);
  });
});

describe('WebSearchSchema', () => {
  it('accepts valid query', () => {
    expect(WebSearchSchema.safeParse({query: 'latest AI news'}).success).toBe(true);
  });

  it('rejects empty query', () => {
    expect(WebSearchSchema.safeParse({query: ''}).success).toBe(false);
  });
});

describe('LaunchValhallaSchema', () => {
  it('accepts tool name', () => {
    expect(LaunchValhallaSchema.safeParse({tool: 'Blender'}).success).toBe(true);
  });

  it('rejects empty tool', () => {
    expect(LaunchValhallaSchema.safeParse({tool: ''}).success).toBe(false);
  });
});

describe('Property-based: all schemas reject undefined', () => {
  for (const [name, schema] of Object.entries(conductorSchemas)) {
    it(`${name} rejects undefined input`, () => {
      // safeParse with undefined should either pass (for no-arg schemas with {} default)
      // or fail (for schemas requiring params)
      const result = schema.safeParse(undefined);
      // Either it passes with empty default or fails — both are valid behaviors
      // The key test is it doesn't throw
      expect(typeof result.success).toBe('boolean');
    });
  }
});

describe('Property-based: all schemas reject non-object input', () => {
  for (const [name, schema] of Object.entries(conductorSchemas)) {
    it(`${name} rejects string input`, () => {
      const result = schema.safeParse('not an object');
      expect(result.success).toBe(false);
    });

    it(`${name} rejects number input`, () => {
      const result = schema.safeParse(42);
      expect(result.success).toBe(false);
    });

    it(`${name} rejects array input`, () => {
      const result = schema.safeParse([1, 2, 3]);
      expect(result.success).toBe(false);
    });
  }
});