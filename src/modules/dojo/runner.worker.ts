/// <reference lib="webworker" />
import { transform } from 'sucrase';

type Payload = { code: string; input: unknown; ts?: boolean };

self.onmessage = async (event: MessageEvent<Payload>) => {
  const { code, input, ts } = event.data;
  try {
    // TypeScript is transpiled inside the worker — same sandbox, same timeout.
    const source = ts
      ? transform(code, { transforms: ['typescript'], disableESTransforms: true }).code
      : code;

    const factory = new Function(
      'data',
      `"use strict";\n${source}\n;return typeof solve === 'function' ? solve(data) : undefined;`,
    );
    const result = await factory(input);
    // structured-clone friendly round trip
    const safe = JSON.parse(JSON.stringify(result ?? null));
    (self as unknown as Worker).postMessage({ ok: true, result: safe });
  } catch (err) {
    (self as unknown as Worker).postMessage({
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
  }
};
