/// <reference types="vite/client" />

declare module 'sql.js/dist/sql-wasm.js' {
  import type { SqlJsConfig, SqlJsStatic } from 'sql.js';
  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
  export type { Database, SqlJsStatic } from 'sql.js';
}
