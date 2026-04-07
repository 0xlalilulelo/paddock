"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useLayoutStore } from "@/lib/store";
import { Pane } from "./pane";
import { AddPaneButton } from "./add-pane-button";
import type { SeriesId } from "@paddock/api-types";

const SERIES_ALL: SeriesId[] = ["f1", "imsa", "wec", "nascar"];

export function PaneContainer() {
  const { panes, reorderPanes, addPane } = useLayoutStore();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = panes.findIndex((p) => p.id === active.id);
    const newIndex = panes.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(panes, oldIndex, newIndex).map((p, i) => ({
      ...p,
      sortOrder: i,
    }));
    reorderPanes(reordered);
  }

  const activeSeries = new Set(panes.map((p) => p.series));
  const availableSeries = SERIES_ALL.filter((s) => !activeSeries.has(s));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={panes.map((p) => p.id)}
        strategy={horizontalListSortingStrategy}
      >
        {/* Base layer: darkest surface — pane bg shifts create column separation (no border gaps) */}
        <div className="flex flex-1 overflow-x-auto overflow-y-hidden gap-0.5 bg-[--color-surface-dim]">
          {panes
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((pane) => (
              <Pane key={pane.id} pane={pane} />
            ))}
          {availableSeries.length > 0 && (
            <AddPaneButton
              availableSeries={availableSeries}
              onAdd={addPane}
            />
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
