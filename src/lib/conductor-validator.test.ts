import {describe, it, expect} from 'vitest';
import {
  validateConductorCall,
  buildCorrectionPrompt,
  type ValidationSuccess,
  type ValidationFailure,
} from './conductor-validator';

// ─── validateConductorCall ─────────────────────────────────────────

describe('validateConductorCall', () => {
  // --- Unknown function ---
  it('rejects unknown function names', () => {
    const result = validateConductorCall('nonexistent_tool', {}) as ValidationFailure;
    expect(result.success).toBe(false);
    expect(result.functionName).toBe('nonexistent_tool');
    expect(result.errorMessage).toContain('Unknown function');
    expect(result.errorMessage).toContain('hallucinated');
  });

  // --- No-argument functions ---
  it('accepts generate_summary with empty args', () => {
    const result = validateConductorCall('generate_summary', {}) as ValidationSuccess;
    expect(result.success).toBe(true);
    expect(result.functionName).toBe('generate_summary');
  });

  it('accepts list_key_moments with empty args', () => {
    const result = validateConductorCall('list_key_moments', {}) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('accepts no-arg functions with undefined args (defaults to {})', () => {
    const result = validateConductorCall('generate_summary', undefined) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('accepts no-arg functions with null args (defaults to {})', () => {
    const result = validateConductorCall('create_haiku', null) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('rejects no-arg functions with unexpected extra fields (.strict())', () => {
    const result = validateConductorCall('generate_summary', {
      unexpected: true,
    }) as ValidationFailure;
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // --- applyLens ---
  it('accepts applyLens with lensName', () => {
    const result = validateConductorCall('applyLens', {
      lensName: 'Deep Analysis',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
    expect(result.args).toEqual({lensName: 'Deep Analysis'});
  });

  it('accepts applyLens with lensName and customPrompt', () => {
    const result = validateConductorCall('applyLens', {
      lensName: 'Deep Analysis',
      customPrompt: 'Focus on color composition',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('rejects applyLens without lensName', () => {
    const result = validateConductorCall('applyLens', {}) as ValidationFailure;
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.path.includes('lensName'))).toBe(true);
  });

  it('rejects applyLens with empty lensName', () => {
    const result = validateConductorCall('applyLens', {
      lensName: '',
    }) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  // --- seekToTime ---
  it('accepts seekToTime with valid number', () => {
    const result = validateConductorCall('seekToTime', {
      timeInSeconds: 42.5,
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
    expect(result.args).toEqual({timeInSeconds: 42.5});
  });

  it('rejects seekToTime with negative time', () => {
    const result = validateConductorCall('seekToTime', {
      timeInSeconds: -5,
    }) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  it('rejects seekToTime with string time', () => {
    const result = validateConductorCall('seekToTime', {
      timeInSeconds: '30',
    }) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  it('rejects seekToTime without timeInSeconds', () => {
    const result = validateConductorCall('seekToTime', {}) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  // --- setPlaybackSpeed ---
  it('accepts setPlaybackSpeed with positive number', () => {
    const result = validateConductorCall('setPlaybackSpeed', {
      speed: 1.5,
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('rejects setPlaybackSpeed with zero', () => {
    const result = validateConductorCall('setPlaybackSpeed', {
      speed: 0,
    }) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  it('rejects setPlaybackSpeed with negative speed', () => {
    const result = validateConductorCall('setPlaybackSpeed', {
      speed: -1,
    }) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  // --- addAnnotation ---
  it('accepts addAnnotation with timeInSeconds and text', () => {
    const result = validateConductorCall('addAnnotation', {
      timeInSeconds: 60,
      text: 'Important moment',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('rejects addAnnotation without text', () => {
    const result = validateConductorCall('addAnnotation', {
      timeInSeconds: 60,
    }) as ValidationFailure;
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.path.includes('text'))).toBe(true);
  });

  it('rejects addAnnotation with empty text', () => {
    const result = validateConductorCall('addAnnotation', {
      timeInSeconds: 60,
      text: '',
    }) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  // --- setSelectionRange ---
  it('accepts setSelectionRange with valid range', () => {
    const result = validateConductorCall('setSelectionRange', {
      startTime: 10,
      endTime: 30,
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('rejects setSelectionRange where endTime <= startTime', () => {
    const result = validateConductorCall('setSelectionRange', {
      startTime: 30,
      endTime: 10,
    }) as ValidationFailure;
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('greater than startTime');
  });

  it('rejects setSelectionRange where endTime == startTime', () => {
    const result = validateConductorCall('setSelectionRange', {
      startTime: 20,
      endTime: 20,
    }) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  // --- generate_image ---
  it('accepts generate_image with prompt', () => {
    const result = validateConductorCall('generate_image', {
      prompt: 'A sunset over mountains',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('accepts generate_image with prompt and aspect_ratio', () => {
    const result = validateConductorCall('generate_image', {
      prompt: 'A sunset',
      aspect_ratio: '16:9',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('rejects generate_image with invalid aspect_ratio', () => {
    const result = validateConductorCall('generate_image', {
      prompt: 'A sunset',
      aspect_ratio: '3:2',
    }) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  // --- generate_video ---
  it('accepts generate_video with prompt', () => {
    const result = validateConductorCall('generate_video', {
      prompt: 'A cat walking',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('accepts generate_video with valid portrait aspect_ratio', () => {
    const result = validateConductorCall('generate_video', {
      prompt: 'A cat',
      aspect_ratio: '9:16',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  // --- search_video ---
  it('accepts search_video with query', () => {
    const result = validateConductorCall('search_video', {
      query: 'red car',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('rejects search_video without query', () => {
    const result = validateConductorCall('search_video', {}) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  // --- web_search ---
  it('accepts web_search with query', () => {
    const result = validateConductorCall('web_search', {
      query: 'latest AI news',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  // --- launch_valhalla ---
  it('accepts launch_valhalla with tool name', () => {
    const result = validateConductorCall('launch_valhalla', {
      tool: 'Blender',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('rejects launch_valhalla without tool', () => {
    const result = validateConductorCall('launch_valhalla', {}) as ValidationFailure;
    expect(result.success).toBe(false);
  });

  // --- create_mermaid_diagram ---
  it('accepts create_mermaid_diagram with topic', () => {
    const result = validateConductorCall('create_mermaid_diagram', {
      topic: 'user login flow',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  // --- create_chart ---
  it('accepts create_chart with metric', () => {
    const result = validateConductorCall('create_chart', {
      metric: 'excitement',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  // --- edit_image ---
  it('accepts edit_image with prompt', () => {
    const result = validateConductorCall('edit_image', {
      prompt: 'add a hat to the cat',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  // --- custom_video_analysis ---
  it('accepts custom_video_analysis with instructions', () => {
    const result = validateConductorCall('custom_video_analysis', {
      instructions: 'Analyze the lighting',
    }) as ValidationSuccess;
    expect(result.success).toBe(true);
  });

  it('rejects custom_video_analysis with empty instructions', () => {
    const result = validateConductorCall('custom_video_analysis', {
      instructions: '',
    }) as ValidationFailure;
    expect(result.success).toBe(false);
  });
});

// ─── buildCorrectionPrompt ─────────────────────────────────────────

describe('buildCorrectionPrompt', () => {
  it('includes function name and original args', () => {
    const prompt = buildCorrectionPrompt(
      'seekToTime',
      {timeInSeconds: 'bad'},
      [{message: 'Expected number', path: ['timeInSeconds'], code: 'invalid_type'} as any],
    );
    expect(prompt).toContain('seekToTime');
    expect(prompt).toContain('timeInSeconds');
    expect(prompt).toContain('Expected number');
    expect(prompt).toContain('Please correct');
  });

  it('handles multiple errors', () => {
    const prompt = buildCorrectionPrompt(
      'addAnnotation',
      {},
      [
        {message: 'Required', path: ['timeInSeconds'], code: 'invalid_type'} as any,
        {message: 'Required', path: ['text'], code: 'invalid_type'} as any,
      ],
    );
    expect(prompt).toContain('timeInSeconds');
    expect(prompt).toContain('text');
  });

  it('handles errors with empty path (root-level)', () => {
    const prompt = buildCorrectionPrompt(
      'setSelectionRange',
      {startTime: 30, endTime: 10},
      [{message: 'endTime must be greater', path: [], code: 'custom'} as any],
    );
    expect(prompt).toContain('endTime must be greater');
    expect(prompt).toContain('field: root');
  });
});
