import {
  ArrowRight,
  KeyRound,
  Link2,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useErd } from './store';
import { COLUMN_TYPES, type ColumnType, type ErdColumn, type RelationKind, type ReferentialAction } from './types';
import { resolvePhysicalTables } from './sql';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const COLORS = ['lime', 'amber', 'violet', 'cyan'] as const;
const KINDS: RelationKind[] = ['1:1', '1:N', 'N:M'];
const ACTIONS: ReferentialAction[] = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'];

export function ErdInspector({
  tableId,
  relationId,
  onSelectTable,
}: {
  tableId: string | null;
  relationId: string | null;
  onSelectTable: (id: string | null) => void;
}) {
  const { schema, seed } = useErd();
  const table = schema.tables.find((t) => t.id === tableId);
  const relation = schema.relations.find((r) => r.id === relationId);

  if (relation) return <RelationInspector relationId={relation.id} onSelectTable={onSelectTable} />;
  if (table) return <TableInspector tableId={table.id} />;

  const physical = resolvePhysicalTables(schema);
  const totalRows = seed?.totalRows ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Schema</p>
        <p className="display mt-1.5 text-lg">Nothing selected</p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
          Click a table to edit its columns, or an edge to change the relationship rules.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'tables', value: physical.length },
          { label: 'columns', value: physical.reduce((n, t) => n + t.columns.length, 0) },
          { label: 'relations', value: schema.relations.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-md border border-border bg-elevated/40 p-2.5">
            <p className="numeric text-lg font-semibold leading-none">{stat.value}</p>
            <p className="mt-1 font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <Separator />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">Relationships</p>
          <Badge variant="outline">{schema.relations.length}</Badge>
        </div>
        {schema.relations.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-3 text-[0.75rem] leading-relaxed text-muted-foreground">
            No edges yet. Drag from a column's right handle onto another table to create a foreign key.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {schema.relations.map((rel) => {
              const s = schema.tables.find((t) => t.id === rel.sourceTableId);
              const t = schema.tables.find((x) => x.id === rel.targetTableId);
              return (
                <li
                  key={rel.id}
                  className="flex items-center gap-2 rounded-sm border border-border/70 bg-elevated/30 px-2 py-1.5 text-[0.6875rem]"
                >
                  <span className="truncate font-mono">{s?.name}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono">{t?.name}</span>
                  <Badge variant={rel.kind === 'N:M' ? 'violet' : 'outline'} className="ml-auto shrink-0">
                    {rel.kind}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {seed && (
        <div className="rounded-md border border-lime/25 bg-lime/5 p-3">
          <p className="font-mono text-[0.625rem] uppercase tracking-widest text-lime-ink">Seeded</p>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-muted-foreground">
            {totalRows} rows across {seed.tables.length} tables. Open the Query Arena → “My schema” to query it.
          </p>
        </div>
      )}
    </div>
  );
}

function TableInspector({ tableId }: { tableId: string }) {
  const { schema, updateTable, removeTable, addColumn, updateColumn, removeColumn, removeRelation, runSeed } =
    useErd();
  const table = schema.tables.find((t) => t.id === tableId)!;
  const relations = schema.relations.filter(
    (r) => r.sourceTableId === tableId || r.targetTableId === tableId,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor="table-name">Table name</Label>
          <Input
            id="table-name"
            value={table.name}
            onChange={(e) => updateTable(tableId, { name: e.target.value })}
            className="mt-1.5 font-mono text-[0.8125rem]"
          />
        </div>
        <div className="flex gap-1 pt-5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateTable(tableId, { color: c })}
              aria-label={`Set ${c} accent`}
              className={cn(
                'h-4 w-4 rounded-full border transition-transform hover:scale-110',
                table.color === c ? 'border-foreground' : 'border-transparent',
              )}
              style={{
                background:
                  c === 'lime' ? 'var(--lime)' : c === 'amber' ? 'var(--amber)' : c === 'violet' ? 'var(--violet)' : 'var(--cyan)',
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="eyebrow">Columns</p>
          <Button size="xs" variant="outline" onClick={() => addColumn(tableId)}>
            <Plus className="h-3 w-3" />
            Column
          </Button>
        </div>

        <div className="space-y-2">
          {table.columns.map((col) => (
            <ColumnRow
              key={col.id}
              column={col}
              onChange={(patch) => updateColumn(tableId, col.id, patch)}
              onRemove={() => removeColumn(tableId, col.id)}
              isFk={schema.relations.some(
                (r) =>
                  (r.sourceTableId === tableId && r.sourceColumnId === col.id) ||
                  (r.targetTableId === tableId && r.targetColumnId === col.id),
              )}
            />
          ))}
          {table.columns.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-3 text-[0.75rem] text-muted-foreground">
              No columns. A table without columns can't compile.
            </p>
          )}
        </div>
      </div>

      {relations.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="eyebrow mb-2">Relations on this table</p>
            <ul className="space-y-1.5">
              {relations.map((rel) => {
                const other =
                  rel.sourceTableId === tableId ? rel.targetTableId : rel.sourceTableId;
                const otherTable = schema.tables.find((t) => t.id === other);
                return (
                  <li
                    key={rel.id}
                    className="flex items-center gap-2 rounded-sm border border-border/70 px-2 py-1.5 text-[0.6875rem]"
                  >
                    <Link2 className="h-3 w-3 shrink-0 text-cyan-ink" />
                    <span className="truncate font-mono">{otherTable?.name}</span>
                    <Badge variant={rel.kind === 'N:M' ? 'violet' : 'outline'} className="ml-auto">
                      {rel.kind}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => removeRelation(rel.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Remove relation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      <Separator />

      <div className="flex flex-col gap-2">
        <Button size="sm" variant="secondary" onClick={() => runSeed()}>
          Seed this schema
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            if (confirm(`Delete table "${table.name}" and its relations?`)) removeTable(tableId);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete table
        </Button>
      </div>
    </div>
  );
}

function FlagChip({
  active,
  label,
  onClick,
  title,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        'rounded-sm border px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider transition-colors',
        active
          ? 'border-primary/50 bg-primary/10 text-primary-ink'
          : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

function ColumnRow({
  column,
  onChange,
  onRemove,
  isFk,
}: {
  column: ErdColumn;
  onChange: (patch: Partial<ErdColumn>) => void;
  onRemove: () => void;
  isFk: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-elevated/30 p-2">
      <div className="flex items-center gap-1.5">
        {column.primaryKey ? (
          <KeyRound className="h-3 w-3 shrink-0 text-mango-ink" />
        ) : isFk ? (
          <Link2 className="h-3 w-3 shrink-0 text-cyan-ink" />
        ) : (
          <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
        )}
        <Input
          value={column.name}
          onChange={(e) => onChange({ name: e.target.value })}
          aria-label="Column name"
          className="h-7 flex-1 font-mono text-[0.75rem]"
        />
        <Select
          value={column.type}
          onValueChange={(value) =>
            onChange({
              type: value as ColumnType,
              length: value === 'VARCHAR' ? column.length ?? 120 : undefined,
              precision: value === 'DECIMAL' ? column.precision ?? 10 : undefined,
              scale: value === 'DECIMAL' ? column.scale ?? 2 : undefined,
            })
          }
        >
          <SelectTrigger className="h-7 w-[92px] px-1.5 font-mono text-[0.625rem] uppercase" aria-label="Column type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLUMN_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Remove column ${column.name}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <FlagChip active={column.primaryKey} label="pk" title="Primary key" onClick={() => onChange({ primaryKey: !column.primaryKey })} />
        <FlagChip active={column.notNull} label="nn" title="Not null" onClick={() => onChange({ notNull: !column.notNull })} />
        <FlagChip active={column.unique} label="uq" title="Unique" onClick={() => onChange({ unique: !column.unique })} />
        <FlagChip
          active={column.autoIncrement}
          label="ai"
          title="Auto increment"
          onClick={() => onChange({ autoIncrement: !column.autoIncrement })}
        />

        {column.type === 'VARCHAR' && (
          <input
            value={column.length ?? 255}
            onChange={(e) => onChange({ length: Number(e.target.value) || 1 })}
            aria-label="VARCHAR length"
            className="numeric ml-auto h-5 w-12 rounded-sm border border-border bg-background/60 px-1 text-center text-[0.5625rem] outline-none focus:border-primary/50"
          />
        )}
        {column.type === 'DECIMAL' && (
          <div className="ml-auto flex items-center gap-1">
            <input
              value={column.precision ?? 10}
              onChange={(e) => onChange({ precision: Number(e.target.value) || 1 })}
              aria-label="Decimal precision"
              className="numeric h-5 w-9 rounded-sm border border-border bg-background/60 px-1 text-center text-[0.5625rem] outline-none focus:border-primary/50"
            />
            <span className="text-[0.5rem] text-muted-foreground">,</span>
            <input
              value={column.scale ?? 2}
              onChange={(e) => onChange({ scale: Number(e.target.value) || 0 })}
              aria-label="Decimal scale"
              className="numeric h-5 w-9 rounded-sm border border-border bg-background/60 px-1 text-center text-[0.5625rem] outline-none focus:border-primary/50"
            />
          </div>
        )}
      </div>

      <input
        value={column.defaultValue ?? ''}
        onChange={(e) => onChange({ defaultValue: e.target.value })}
        placeholder="default (optional) — e.g. CURRENT_TIMESTAMP"
        aria-label="Default value"
        className="mt-1.5 h-5 w-full rounded-sm border border-transparent bg-transparent px-1 font-mono text-[0.5625rem] text-muted-foreground outline-none transition-colors placeholder:text-tertiary focus:border-border focus:bg-background/60"
      />
    </div>
  );
}

function RelationInspector({
  relationId,
  onSelectTable,
}: {
  relationId: string;
  onSelectTable: (id: string | null) => void;
}) {
  const { schema, updateRelation, removeRelation } = useErd();
  const rel = schema.relations.find((r) => r.id === relationId)!;
  const source = schema.tables.find((t) => t.id === rel.sourceTableId);
  const target = schema.tables.find((t) => t.id === rel.targetTableId);
  const sourceCol = source?.columns.find((c) => c.id === rel.sourceColumnId);
  const targetCol = target?.columns.find((c) => c.id === rel.targetColumnId);

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Relationship</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[0.75rem]">
          <button
            type="button"
            onClick={() => onSelectTable(rel.sourceTableId)}
            className="rounded-sm border border-border px-1.5 py-0.5 transition-colors hover:border-primary/50 hover:text-primary-ink"
          >
            {source?.name}.{sourceCol?.name}
          </button>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <button
            type="button"
            onClick={() => onSelectTable(rel.targetTableId)}
            className="rounded-sm border border-border px-1.5 py-0.5 transition-colors hover:border-primary/50 hover:text-primary-ink"
          >
            {target?.name}.{targetCol?.name}
          </button>
        </div>
      </div>

      <div>
        <Label>Cardinality</Label>
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => updateRelation(rel.id, { kind })}
              className={cn(
                'rounded-sm border py-1.5 font-mono text-[0.6875rem] transition-colors',
                rel.kind === kind
                  ? 'border-primary/50 bg-primary/10 text-primary-ink'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {kind}
            </button>
          ))}
        </div>
        {rel.kind === 'N:M' && (
          <p className="mt-2 rounded-sm border border-violet/25 bg-violet/5 p-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
            <span className="text-grape-ink">Pivot table generated:</span> a junction table with a composite key is
            added to the DDL and the seeder.
          </p>
        )}
        {rel.kind === '1:1' && (
          <p className="mt-2 rounded-sm border border-amber/25 bg-amber/5 p-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
            <span className="text-mango-ink">Unique FK:</span> the foreign key column gets a UNIQUE constraint.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>On delete</Label>
          <Select value={rel.onDelete} onValueChange={(v) => updateRelation(rel.id, { onDelete: v as ReferentialAction })}>
            <SelectTrigger className="mt-1.5 font-mono text-[0.6875rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a} className="font-mono text-xs">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>On update</Label>
          <Select value={rel.onUpdate} onValueChange={(v) => updateRelation(rel.id, { onUpdate: v as ReferentialAction })}>
            <SelectTrigger className="mt-1.5 font-mono text-[0.6875rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a} className="font-mono text-xs">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-sm border border-border/70 bg-elevated/30 p-2.5">
        <p className="flex items-center gap-1.5 font-mono text-[0.5625rem] uppercase tracking-widest text-muted-foreground">
          <TriangleAlert className="h-3 w-3 text-mango-ink" />
          what happens on delete
        </p>
        <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
          {rel.onDelete === 'CASCADE'
            ? `Deleting a ${source?.name} row also deletes its dependent ${target?.name} rows.`
            : rel.onDelete === 'SET NULL'
              ? `The foreign key is set to NULL — the column must be nullable or the delete fails.`
              : rel.onDelete === 'RESTRICT'
                ? `The delete is rejected while dependent rows exist.`
                : `No automatic action — the database leaves orphans and the constraint does nothing.`}
        </p>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => removeRelation(rel.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove relationship
      </Button>
    </div>
  );
}
