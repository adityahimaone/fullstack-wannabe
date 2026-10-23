import { readStore } from '@/lib/storage';
import { erdDataset, execSql, getDatabase } from '@/modules/sql/engine';
import type { Ctx } from './ctx';

export interface ApiResult {
  status: number;
  statusText: string;
  ms: number;
  body: unknown;
  trace: number[];
  method: string;
  path: string;
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  404: 'Not Found',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

function sampleValue(raw: string, name: string, index: number): unknown {
  switch (raw) {
    case 'INT':
    case 'BIGINT':
      return index + 1;
    case 'DECIMAL':
      return Number((12.5 * (index + 1)).toFixed(2));
    case 'BOOLEAN':
      return true;
    case 'TIMESTAMP':
      return new Date(Date.now() - index * 86_400_000).toISOString();
    case 'DATE':
      return new Date(Date.now() - index * 86_400_000).toISOString().slice(0, 10);
    case 'JSON':
      return { tag: 'demo' };
    default:
      if (/email/i.test(name)) return `user${index + 1}@example.dev`;
      if (/name/i.test(name)) return ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds'][index % 3];
      return `${name}_${index + 1}`;
  }
}

function fallbackRows(ctx: Ctx): Record<string, unknown>[] {
  return Array.from({ length: 3 }, (_, i) => {
    const row: Record<string, unknown> = { [ctx.pk]: i + 1 };
    ctx.fields.forEach((f) => {
      row[f.name] = sampleValue(f.raw, f.name, i);
    });
    return row;
  });
}

async function loadRows(ctx: Ctx): Promise<Record<string, unknown>[]> {
  const erd = readStore<unknown>('erd:seed', null);
  if (!erd) return fallbackRows(ctx);
  try {
    const dataset = erdDataset();
    if (!dataset) return fallbackRows(ctx);
    const db = await getDatabase(dataset.key, () => dataset.script);
    const res = execSql(db, `SELECT * FROM "${ctx.table}" LIMIT 10`);
    if (res.columns.length === 0) return fallbackRows(ctx);
    return res.rows.map((row) =>
      Object.fromEntries(res.columns.map((col, i) => [col, row[i]])),
    );
  } catch {
    return fallbackRows(ctx);
  }
}

export async function handleRequest(input: {
  method: string;
  path: string;
  body: string;
  ctx: Ctx;
}): Promise<ApiResult> {
  const started = performance.now();
  const method = input.method.toUpperCase();
  const path = input.path.trim().replace(/\/+$/, '') || '/';
  const listPath = `/api/v1/${input.ctx.table}`;
  const itemPattern = new RegExp(`^${listPath.replace(/\//g, '\\/')}\\/(\\d+)$`);
  const itemMatch = path.match(itemPattern);

  await new Promise((resolve) => setTimeout(resolve, 140 + Math.random() * 160));

  const requestId = `req_${Math.random().toString(36).slice(2, 10)}`;
  const finish = (status: number, body: unknown, trace: number[]): ApiResult => ({
    status,
    statusText: STATUS_TEXT[status] ?? 'Unknown',
    ms: Math.round((performance.now() - started) * 10) / 10,
    body,
    trace,
    method,
    path,
  });

  const meta = (extra: Record<string, unknown> = {}) => ({
    request_id: requestId,
    ...extra,
  });

  if (path !== listPath && !itemMatch) {
    return finish(
      404,
      {
        error: {
          code: 'route_not_found',
          message: `No route matches ${method} ${path}. Try ${listPath}.`,
        },
        meta: meta(),
      },
      [6],
    );
  }

  if (method === 'GET' && !itemMatch) {
    const rows = await loadRows(input.ctx);
    return finish(200, { data: rows, meta: meta({ count: rows.length }) }, [6, 5, 4, 3, 2, 1, 6]);
  }

  if (method === 'GET' && itemMatch) {
    const id = Number(itemMatch[1]);
    const rows = await loadRows(input.ctx);
    const row = rows.find((r) => Number(r[input.ctx.pk]) === id);
    if (!row) {
      return finish(
        404,
        {
          error: { code: 'not_found', message: `${input.ctx.model} ${id} does not exist.` },
          meta: meta(),
        },
        [6, 5, 4, 3, 2, 1],
      );
    }
    return finish(200, { data: row, meta: meta() }, [6, 5, 4, 3, 2, 1, 6]);
  }

  if (method === 'POST') {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = input.body.trim() ? JSON.parse(input.body) : {};
    } catch {
      return finish(
        400,
        {
          error: { code: 'invalid_json', message: 'Request body is not valid JSON.' },
          meta: meta(),
        },
        [6, 5],
      );
    }
    const rows = await loadRows(input.ctx);
    const nextId = Math.max(0, ...rows.map((r) => Number(r[input.ctx.pk]) || 0)) + 1;
    return finish(
      201,
      {
        data: { [input.ctx.pk]: nextId, ...parsed },
        meta: meta({ location: `${listPath}/${nextId}` }),
      },
      [6, 5, 4, 3, 1, 6],
    );
  }

  if (method === 'PUT' && itemMatch) {
    const id = Number(itemMatch[1]);
    const rows = await loadRows(input.ctx);
    const row = rows.find((r) => Number(r[input.ctx.pk]) === id);
    if (!row) {
      return finish(
        404,
        { error: { code: 'not_found', message: `${input.ctx.model} ${id} does not exist.` }, meta: meta() },
        [6, 5, 4, 3, 1],
      );
    }
    let parsed: Record<string, unknown> = {};
    try {
      parsed = input.body.trim() ? JSON.parse(input.body) : {};
    } catch {
      return finish(
        400,
        { error: { code: 'invalid_json', message: 'Request body is not valid JSON.' }, meta: meta() },
        [6, 5],
      );
    }
    return finish(200, { data: { ...row, ...parsed }, meta: meta() }, [6, 5, 4, 3, 1, 6]);
  }

  if (method === 'DELETE' && itemMatch) {
    return finish(204, null, [6, 5, 4, 3, 1]);
  }

  return finish(
    422,
    {
      error: { code: 'unsupported_method', message: `${method} is not wired for this resource.` },
      meta: meta(),
    },
    [6, 5],
  );
}

export function defaultBody(ctx: Ctx): string {
  const payload: Record<string, unknown> = {};
  ctx.fields.slice(0, 3).forEach((f) => {
    payload[f.name] = sampleValue(f.raw, f.name, 0);
  });
  return JSON.stringify(payload, null, 2);
}
