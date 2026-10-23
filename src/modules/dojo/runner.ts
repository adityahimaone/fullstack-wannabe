export interface RunOutcome {
  ok: boolean;
  result?: unknown;
  error?: string;
  timedOut?: boolean;
}

/**
 * Execute user JavaScript (or TypeScript, transpiled in the worker) in a
 * throwaway worker so an infinite loop can be terminated without freezing the page.
 */
export function runJs(
  code: string,
  input: unknown,
  opts: { ts?: boolean; timeoutMs?: number } = {},
): Promise<RunOutcome> {
  const { ts = false, timeoutMs = 1600 } = opts;
  return new Promise((resolve) => {
    let settled = false;
    let worker: Worker;
    try {
      worker = new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' });
    } catch (err) {
      resolve({ ok: false, error: err instanceof Error ? err.message : 'Worker unavailable' });
      return;
    }

    const finish = (outcome: RunOutcome) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve(outcome);
    };

    const timer = window.setTimeout(() => {
      finish({ ok: false, timedOut: true, error: `Timed out after ${timeoutMs}ms — check for an infinite loop.` });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<RunOutcome>) => {
      window.clearTimeout(timer);
      finish(event.data);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timer);
      finish({ ok: false, error: event.message || 'Runtime error' });
    };

    worker.postMessage({ code, input, ts });
  });
}

export function deepEqualLoose(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 0.0001;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqualLoose(item, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao).sort();
    const bk = Object.keys(bo).sort();
    if (ak.length !== bk.length) return false;
    if (!ak.every((k, i) => k === bk[i])) return false;
    return ak.every((k) => deepEqualLoose(ao[k], bo[k]));
  }
  return false;
}
