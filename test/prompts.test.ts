import * as fs from 'fs';
import * as path from 'path';

import { globSync } from 'glob';

import { readPrompts } from '../src/prompts';

import type { Prompt } from '../src/types';
import { vi, beforeEach, afterEach, describe, expect, test, it } from 'vitest';


vi.mock('glob', () => ({
  globSync: vi.fn(),
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

function toPrompt(text: string): Prompt {
  return { raw: text, display: text };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('prompts', () => {
  test('readPrompts with single prompt file', () => {
    (fs.readFileSync as vi.Mock).mockReturnValue('Test prompt 1\n---\nTest prompt 2');
    (fs.statSync as vi.Mock).mockReturnValue({ isDirectory: () => false });
    const promptPaths = ['prompts.txt'];
    (globSync as vi.Mock).mockImplementation((pathOrGlob) => [pathOrGlob]);

    const result = readPrompts(promptPaths);

    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(result).toEqual([toPrompt('Test prompt 1'), toPrompt('Test prompt 2')]);
  });

  test('readPrompts with multiple prompt files', () => {
    (fs.readFileSync as vi.Mock)
      .mockReturnValueOnce('Test prompt 1')
      .mockReturnValueOnce('Test prompt 2');
    (fs.statSync as vi.Mock).mockReturnValue({ isDirectory: () => false });
    const promptPaths = ['prompt1.txt', 'prompt2.txt'];
    (globSync as vi.Mock).mockImplementation((pathOrGlob) => [pathOrGlob]);

    const result = readPrompts(promptPaths);

    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(result).toEqual([toPrompt('Test prompt 1'), toPrompt('Test prompt 2')]);
  });

  test('readPrompts with directory', () => {
    (fs.statSync as vi.Mock).mockReturnValue({ isDirectory: () => true });
    (globSync as vi.Mock).mockImplementation((pathOrGlob) => [pathOrGlob]);
    (fs.readdirSync as vi.Mock).mockReturnValue(['prompt1.txt', 'prompt2.txt']);
    (fs.readFileSync as vi.Mock).mockImplementation((filePath) => {
      if (filePath.endsWith(path.join('prompts', 'prompt1.txt'))) {
        return 'Test prompt 1';
      } else if (filePath.endsWith(path.join('prompts', 'prompt2.txt'))) {
        return 'Test prompt 2';
      }
    });
    const promptPaths = ['prompts'];

    const result = readPrompts(promptPaths);

    expect(fs.statSync).toHaveBeenCalledTimes(1);
    expect(fs.readdirSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(result).toEqual([toPrompt('Test prompt 1'), toPrompt('Test prompt 2')]);
  });

  test('readPrompts with empty input', () => {
    (fs.readFileSync as vi.Mock).mockReturnValue('');
    (fs.statSync as vi.Mock).mockReturnValue({ isDirectory: () => false });
    const promptPaths = ['prompts.txt'];

    const result = readPrompts(promptPaths);

    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(result).toEqual([toPrompt('')]);
  });

  test('readPrompts with map input', () => {
    (fs.readFileSync as vi.Mock).mockReturnValue('some raw text');
    (fs.statSync as vi.Mock).mockReturnValue({ isDirectory: () => false });

    const result = readPrompts({
      'prompts.txt': 'foo1',
      'prompts.py': 'foo2',
    });

    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ raw: 'some raw text', display: 'foo1' });
    expect(result[1]).toEqual(expect.objectContaining({ raw: 'some raw text', display: 'foo2' }));
  });

  test('readPrompts with JSONL file', () => {
    const data = [
      [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Who won the world series in {{ year }}?' },
      ],
      [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Who won the superbowl in {{ year }}?' },
      ],
    ];

    (fs.readFileSync as vi.Mock).mockReturnValue(data.map((o) => JSON.stringify(o)).join('\n'));
    (fs.statSync as vi.Mock).mockReturnValue({ isDirectory: () => false });
    const promptPaths = ['prompts.jsonl'];

    const result = readPrompts(promptPaths);

    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(result).toEqual([toPrompt(JSON.stringify(data[0])), toPrompt(JSON.stringify(data[1]))]);
  });

  test('readPrompts with .py file', () => {
    const code = `print('dummy prompt')`;
    (fs.readFileSync as vi.Mock).mockReturnValue(code);
    const result = readPrompts('prompt.py');
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(result[0].raw).toEqual(code);
    expect(result[0].display).toEqual(code);
    expect(result[0].function).toBeDefined();
  });

  test('readPrompts with .js file', () => {
    vi.doMock(
      path.resolve('prompt.js'),
      () => {
        return vi.fn(() => console.log('dummy prompt'));
      },
      { virtual: true },
    );
    const result = readPrompts('prompt.js');
    expect(result[0].function).toBeDefined();
  });
});
