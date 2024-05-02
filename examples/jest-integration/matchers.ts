import { matchesSimilarity, matchesLlmRubric } from '../../dist/assertions.js';

import type { GradingConfig } from '../../dist/types.js';

declare global {
  namespace vi {
    interface Matchers<R> {
      toMatchSemanticSimilarity(expected: string, threshold?: number): R;
      toPassLLMRubric(expected: string, gradingConfig: GradingConfig): R;
    }
  }
}

export function installVitestMatchers() {
  expect.extend({
    async toMatchSemanticSimilarity(
      received: string,
      expected: string,
      threshold: number = 0.8,
    ): Promise<vi.CustomMatcherResult> {
      const result = await matchesSimilarity(received, expected, threshold);
      const pass = received === expected || result.pass;
      if (pass) {
        return {
          message: () => `expected ${received} not to match semantic similarity with ${expected}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${received} to match semantic similarity with ${expected}, but it did not. Reason: ${result.reason}`,
          pass: false,
        };
      }
    },

    async toPassLLMRubric(
      received: string,
      expected: string,
      gradingConfig: GradingConfig,
    ): Promise<vi.CustomMatcherResult> {
      const gradingResult = await matchesLlmRubric(expected, received, gradingConfig);
      if (gradingResult.pass) {
        return {
          message: () => `expected ${received} not to pass LLM Rubric with ${expected}`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${received} to pass LLM Rubric with ${expected}, but it did not. Reason: ${gradingResult.reason}`,
          pass: false,
        };
      }
    },
  });
}
