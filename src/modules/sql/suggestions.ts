import type { Completion } from '@/lib/completions';
import type { TableSchema } from './engine';

/** Ordered so the most-used clauses surface first when the prefix is empty. */
const KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'JOIN',
  'LEFT JOIN',
  'INNER JOIN',
  'ON',
  'AS',
  'DISTINCT',
  'UNION',
  'UNION ALL',
  'WITH',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'AND',
  'OR',
  'NOT',
  'NULL',
  'IS NULL',
  'IS NOT NULL',
  'IN',
  'BETWEEN',
  'LIKE',
  'EXISTS',
  'ASC',
  'DESC',
  'INSERT INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE FROM',
  'CREATE TABLE',
  'ALTER TABLE',
  'DROP TABLE',
];

const FUNCTIONS = [
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'ROUND',
  'ABS',
  'COALESCE',
  'IFNULL',
  'NULLIF',
  'LENGTH',
  'LOWER',
  'UPPER',
  'SUBSTR',
  'TRIM',
  'REPLACE',
  'DATE',
  'DATETIME',
  'STRFTIME',
  'JULIANDAY',
  'GROUP_CONCAT',
  'CAST',
  'ROW_NUMBER',
  'RANK',
  'DENSE_RANK',
  'LAG',
  'LEAD',
  'NTILE',
  'OVER',
  'PARTITION BY',
];

/**
 * Everything the caret can complete in the Query Arena: the SQL vocabulary plus
 * the tables and columns of whichever database is currently loaded.
 */
export function buildSqlCompletions(tables: TableSchema[]): Completion[] {
  const out: Completion[] = [];

  for (const table of tables) {
    out.push({ label: table.name, kind: 'table', detail: `${table.rows} rows` });
    for (const col of table.columns) {
      out.push({ label: col.name, kind: 'column', detail: col.type, parent: table.name });
    }
  }

  for (const fn of FUNCTIONS) out.push({ label: fn, kind: 'function' });
  for (const kw of KEYWORDS) out.push({ label: kw, kind: 'keyword' });

  return out;
}
