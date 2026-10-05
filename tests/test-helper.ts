import { describe as nodeDescribe, it as nodeIt } from 'node:test';
import assert from 'node:assert/strict';

export const describe = nodeDescribe;
export const it = nodeIt;

export function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      assert.strictEqual(actual, expected);
    },
    toEqual(expected: any) {
      assert.deepStrictEqual(actual, expected);
    },
    toBeGreaterThan(expected: number) {
      assert.ok(Number(actual) > expected, `Expected ${actual} > ${expected}`);
    },
    toBeGreaterThanOrEqual(expected: number) {
      assert.ok(Number(actual) >= expected, `Expected ${actual} >= ${expected}`);
    },
    toBeLessThan(expected: number) {
      assert.ok(Number(actual) < expected, `Expected ${actual} < ${expected}`);
    },
    toBeLessThanOrEqual(expected: number) {
      assert.ok(Number(actual) <= expected, `Expected ${actual} <= ${expected}`);
    },
    toBeDefined() {
      assert.notStrictEqual(actual, undefined);
    },
    toBeUndefined() {
      assert.strictEqual(actual, undefined);
    },
    toBeNull() {
      assert.strictEqual(actual, null);
    },
    toContain(expected: any) {
      if (Array.isArray(actual) || typeof actual === 'string') {
        assert.ok(
          actual.includes(expected),
          `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`
        );
      } else {
        assert.fail(`Actual value cannot be checked with toContain: ${actual}`);
      }
    },
  };
}
