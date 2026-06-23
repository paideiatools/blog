"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { Editor } from "@tiptap/core";
import {
  Columns3,
  PanelLeft,
  PanelTop,
  Plus,
  Rows3,
  Table as TableIcon,
  Trash2,
} from "lucide-react";

// Word/Notion-style inline table controls (replaces the old top toolbar):
//   • "+" strip on the right edge  → add a column at the end
//   • "+" strip on the bottom edge → add a row at the end
//   • a grip menu at the top-left  → header row / header column / delete
// Rendered as an overlay so it never interferes with ProseMirror's DOM.

interface TableBox {
  index: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function TableControls({
  editor,
  canvasRef,
}: {
  editor: Editor;
  canvasRef: RefObject<HTMLDivElement | null>;
}) {
  const [boxes, setBoxes] = useState<TableBox[]>([]);
  const [menuFor, setMenuFor] = useState<number | null>(null);

  const recompute = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    const tables =
      editor.view.dom.querySelectorAll<HTMLElement>(".tableWrapper table");
    const next: TableBox[] = [];
    tables.forEach((table, index) => {
      const r = table.getBoundingClientRect();
      next.push({
        index,
        top: r.top - cRect.top,
        left: r.left - cRect.left,
        width: r.width,
        height: r.height,
      });
    });
    setBoxes(next);
  }, [editor, canvasRef]);

  useEffect(() => {
    recompute();
    editor.on("update", recompute);
    editor.on("selectionUpdate", recompute);
    editor.on("transaction", recompute);
    window.addEventListener("resize", recompute);
    const ro = new ResizeObserver(recompute);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => {
      editor.off("update", recompute);
      editor.off("selectionUpdate", recompute);
      editor.off("transaction", recompute);
      window.removeEventListener("resize", recompute);
      ro.disconnect();
    };
  }, [editor, recompute, canvasRef]);

  function cellPos(index: number, which: "first" | "last"): number | null {
    const tables =
      editor.view.dom.querySelectorAll<HTMLElement>(".tableWrapper table");
    const cells = tables[index]?.querySelectorAll("td, th");
    if (!cells || cells.length === 0) return null;
    const cell = which === "first" ? cells[0] : cells[cells.length - 1];
    try {
      return editor.view.posAtDOM(cell, 0);
    } catch {
      return null;
    }
  }

  // Commit a cell selection first (table commands read it from state), then run.
  function selectCell(index: number, which: "first" | "last"): boolean {
    const pos = cellPos(index, which);
    if (pos == null) return false;
    editor.chain().focus().setTextSelection(pos).run();
    return true;
  }

  function addColumn(index: number) {
    if (selectCell(index, "last")) editor.chain().focus().addColumnAfter().run();
  }
  function addRow(index: number) {
    if (selectCell(index, "last")) editor.chain().focus().addRowAfter().run();
  }

  function openMenu(index: number) {
    // Make sure a cell in this table is selected so the menu commands apply.
    if (!editor.isActive("table")) selectCell(index, "first");
    setMenuFor((cur) => (cur === index ? null : index));
  }

  function run(action: () => void) {
    action();
    setMenuFor(null);
  }

  const strip =
    "absolute z-10 flex items-center justify-center rounded-md border border-dashed border-line text-faint transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent";

  const menuItem =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-paper hover:text-ink";

  return (
    <>
      {menuFor !== null && (
        <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} />
      )}

      {boxes.map((b) => (
        <div key={b.index}>
          {/* Add column — right edge */}
          <button
            type="button"
            title="Add column"
            aria-label="Add column"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => addColumn(b.index)}
            className={strip}
            style={{ top: b.top, left: b.left + b.width + 6, width: 20, height: b.height }}
          >
            <Plus size={14} />
          </button>

          {/* Add row — bottom edge */}
          <button
            type="button"
            title="Add row"
            aria-label="Add row"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => addRow(b.index)}
            className={strip}
            style={{ top: b.top + b.height + 6, left: b.left, width: b.width, height: 20 }}
          >
            <Plus size={14} />
          </button>

          {/* Grip menu — top-left */}
          <button
            type="button"
            title="Table options"
            aria-label="Table options"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openMenu(b.index)}
            className="absolute z-30 flex items-center justify-center rounded-md border border-line bg-surface text-muted shadow-sm transition-colors hover:border-accent hover:text-accent"
            style={{ top: b.top - 30, left: b.left, width: 26, height: 24 }}
          >
            <TableIcon size={14} />
          </button>

          {menuFor === b.index && (
            <div
              className="absolute z-30 w-48 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl"
              style={{ top: b.top, left: b.left + 4 }}
            >
              <button
                type="button"
                className={menuItem}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(() => editor.chain().focus().toggleHeaderRow().run())}
              >
                <PanelTop size={15} /> Header row
              </button>
              <button
                type="button"
                className={menuItem}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(() => editor.chain().focus().toggleHeaderColumn().run())}
              >
                <PanelLeft size={15} /> Header column
              </button>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                className={menuItem}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(() => editor.chain().focus().deleteRow().run())}
              >
                <Rows3 size={15} /> Delete row
              </button>
              <button
                type="button"
                className={menuItem}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(() => editor.chain().focus().deleteColumn().run())}
              >
                <Columns3 size={15} /> Delete column
              </button>
              <button
                type="button"
                className={`${menuItem} hover:!text-danger`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(() => editor.chain().focus().deleteTable().run())}
              >
                <Trash2 size={15} /> Delete table
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
