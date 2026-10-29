import * as React from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';
import { TableNode, type TableNodeType } from './TableNode';
import { useErd } from './store';
import { Button } from '@/components/ui/button';

const nodeTypes: NodeTypes = { table: TableNode };

interface ErdCanvasProps {
  selectedTableId: string | null;
  selectedRelationId: string | null;
  onSelectTable: (id: string | null) => void;
  onSelectRelation: (id: string | null) => void;
}

function CanvasInner({
  selectedTableId,
  selectedRelationId,
  onSelectTable,
  onSelectRelation,
}: ErdCanvasProps) {
  const { schema, moveTable, addRelation, removeRelation, addTable } = useErd();

  const derivedNodes = React.useMemo<TableNodeType[]>(
    () =>
      schema.tables.map((table) => ({
        id: table.id,
        type: 'table',
        position: { x: table.x, y: table.y },
        data: {
          table,
          fkColumnIds: schema.relations
            .filter((r) => r.sourceTableId === table.id)
            .map((r) => r.sourceColumnId),
        },
        selected: table.id === selectedTableId,
        dragHandle: '.drag-handle',
      })),
    [schema.tables, schema.relations, selectedTableId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeType>(derivedNodes);

  React.useEffect(() => {
    setNodes(derivedNodes);
  }, [derivedNodes, setNodes]);

  const edges = React.useMemo<Edge[]>(
    () =>
      schema.relations.map((rel) => {
        const isSelected = rel.id === selectedRelationId;
        const sourceTable = schema.tables.find((t) => t.id === rel.sourceTableId);
        const accent =
          rel.kind === 'N:M' ? 'var(--violet)' : rel.kind === '1:1' ? 'var(--amber)' : 'var(--cyan)';
        return {
          id: rel.id,
          source: rel.sourceTableId,
          target: rel.targetTableId,
          sourceHandle: `${rel.sourceColumnId}-s`,
          targetHandle: `${rel.targetColumnId}-t`,
          type: 'smoothstep',
          animated: isSelected,
          label: rel.kind,
          labelShowBg: true,
          labelBgPadding: [5, 2] as [number, number],
          labelBgBorderRadius: 3,
          labelBgStyle: { fill: 'var(--surface)', stroke: 'var(--border)' },
          labelStyle: {
            fill: isSelected ? accent : 'var(--muted-foreground)',
            fontSize: 10,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.08em',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: isSelected ? accent : 'var(--muted-foreground)',
          },
          style: {
            stroke: isSelected ? accent : 'var(--border)',
            strokeWidth: isSelected ? 2 : 1.4,
          },
          data: { sourceName: sourceTable?.name },
        } satisfies Edge;
      }),
    [schema.relations, schema.tables, selectedRelationId],
  );

  const [edgeState, setEdgeState] = useEdgesState(edges);
  React.useEffect(() => {
    setEdgeState(edges);
  }, [edges, setEdgeState]);

  const onConnect = React.useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) return;
      const sourceColumnId = connection.sourceHandle?.replace(/-s$/, '');
      const targetColumnId = connection.targetHandle?.replace(/-t$/, '');
      if (!sourceColumnId || !targetColumnId) return;
      addRelation({
        sourceTableId: connection.source,
        sourceColumnId,
        targetTableId: connection.target,
        targetColumnId,
        kind: '1:N',
      });
    },
    [addRelation],
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edgeState}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={(_, node) => moveTable(node.id, node.position.x, node.position.y)}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          onSelectTable(node.id);
          onSelectRelation(null);
        }}
        onEdgeClick={(_, edge) => {
          onSelectRelation(edge.id);
          onSelectTable(null);
        }}
        onPaneClick={() => {
          onSelectTable(null);
          onSelectRelation(null);
        }}
        onEdgesDelete={(deleted) => deleted.forEach((e) => removeRelation(e.id))}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1 }}
        onInit={(instance) => {
          window.setTimeout(() => instance.fitView({ padding: 0.2, minZoom: 0.5, maxZoom: 1 }), 140);
        }}
        minZoom={0.2}
        maxZoom={1.6}
        snapToGrid
        snapGrid={[14, 14]}
        proOptions={{ hideAttribution: true }}
        className="grid-canvas"
        connectionLineStyle={{ stroke: 'var(--lime)', strokeWidth: 1.6, strokeDasharray: '4 3' }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="var(--grid-line)" />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4 !shadow-none [&>button]:!bg-elevated"
        />
      </ReactFlow>

      <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border-[2px] border-edge bg-elevated px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground md:flex">
        <span className="h-1 w-1 rounded-full bg-lime" />
        drag a column handle onto another table to relate
      </div>

      {schema.tables.length === 0 && (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="max-w-xs rounded-[14px] border-[2.5px] border-dashed border-edge bg-elevated p-6 text-center">
            <p className="display text-base">An empty canvas</p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
              Every API starts with a table. Drop one in and the DDL writes itself.
            </p>
            <Button size="sm" className="mt-4" onClick={() => addTable()}>
              <Plus className="h-3.5 w-3.5" />
              Add first table
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ErdCanvas(props: ErdCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
