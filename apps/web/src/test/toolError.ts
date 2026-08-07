import { ToolError } from '@convyx/tool-contract';

/**
 * Returns the `ToolError` a call was supposed to raise, correctly typed.
 *
 * `catch (cause) { cause as ToolError }` widens to a union and defeats the
 * typechecker, and `rejects.toMatchObject` cannot express "the message mentions
 * the real page count" — which is the part of these errors actually worth
 * asserting. Anything that is not a `ToolError` is rethrown, so a genuine crash
 * is never quietly swallowed as an expected failure.
 */
export async function rejectsWithToolError(run: Promise<unknown>): Promise<ToolError> {
  try {
    await run;
  } catch (cause) {
    if (cause instanceof ToolError) return cause;
    throw cause;
  }

  throw new Error('Expected this to reject with a ToolError, but it resolved.');
}

/** The synchronous twin, for parsers and validators. */
export function throwsToolError(run: () => unknown): ToolError {
  try {
    run();
  } catch (cause) {
    if (cause instanceof ToolError) return cause;
    throw cause;
  }

  throw new Error('Expected this to throw a ToolError, but it returned.');
}
