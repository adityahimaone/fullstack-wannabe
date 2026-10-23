/// <reference lib="webworker" />

type Payload = { code: string; input: unknown };

self.onmessage = async (event: MessageEvent<Payload>) => {
  const { code, input } = event.data;
  try {
    const factory = new Function(
      'data',
      `"use strict";\n${code}\n;return typeof solve === 'function' ? solve(data) : undefined;`,
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
