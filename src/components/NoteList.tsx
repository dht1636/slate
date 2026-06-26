import { useEffect, useRef } from "react";
import { Plus, FileText, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { useConfirm } from "../confirm";
import { formatWhen, snippet } from "../lib/format";
import type { Note } from "../types";

export function NoteList() {
  const {
    notes,
    projects,
    collections,
    selection,
    activeNoteId,
    openNote,
    createNote,
    deleteNote,
  } = useStore();
  const confirm = useConfirm();
  const listRef = useRef<HTMLUListElement>(null);

  /* Keyboard "keying through notes": ↑/↓ (or k/j) moves through the scoped
     list and opens, as long as focus isn't in the editor or an input. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const down = e.key === "ArrowDown" || e.key === "j";
      const up = e.key === "ArrowUp" || e.key === "k";
      if (!down && !up) return;
      const ae = document.activeElement as HTMLElement | null;
      if (
        ae &&
        (ae.closest(".prose") ||
          ae.tagName === "INPUT" ||
          ae.tagName === "TEXTAREA" ||
          ae.isContentEditable)
      )
        return;
      if (!selection) return;
      const list = notes
        .filter((n) =>
          selection.kind === "collection"
            ? n.collectionId === selection.collectionId
            : n.projectId === selection.projectId,
        )
        .sort((a, b) => b.updatedAt - a.updatedAt);
      if (list.length === 0) return;
      e.preventDefault();
      const idx = list.findIndex((n) => n.id === activeNoteId);
      const next =
        idx === -1
          ? down
            ? 0
            : list.length - 1
          : Math.max(0, Math.min(list.length - 1, idx + (down ? 1 : -1)));
      openNote(list[next].id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notes, selection, activeNoteId, openNote]);

  /* Keep the active row in view as you key through. */
  useEffect(() => {
    if (!activeNoteId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-id="${activeNoteId}"]`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [activeNoteId]);

  if (!selection) return <section className="notelist" aria-label="Notes" />;

  const scoped: Note[] = notes
    .filter((n) =>
      selection.kind === "collection"
        ? n.collectionId === selection.collectionId
        : n.projectId === selection.projectId,
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const title =
    selection.kind === "collection"
      ? collections.find((c) => c.id === selection.collectionId)?.name
      : projects.find((p) => p.id === selection.projectId)?.name;

  // Remount the list (and replay the entrance) only when the scope changes.
  const scopeKey =
    selection.kind === "collection" ? selection.collectionId : selection.projectId;

  async function onDelete(note: Note) {
    const ok = await confirm({
      title: "Delete note?",
      message: `"${note.title || "Untitled"}" will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete note",
      tone: "danger",
    });
    if (ok) deleteNote(note.id);
  }

  return (
    <section className="notelist" aria-label="Notes">
      <header className="notelist-head">
        <div className="nl-title">
          <span className="nl-name">{title}</span>
          <span className="count mono">{scoped.length}</span>
        </div>
        <button
          className="head-add"
          onClick={() => createNote()}
          title="New note  ⌘N"
          aria-label="New note"
        >
          <Plus size={16} />
        </button>
      </header>

      {scoped.length === 0 ? (
        <div className="nl-empty">
          <FileText size={20} strokeWidth={1.5} />
          <p>No notes yet</p>
          <button className="ghost-btn" onClick={() => createNote()}>
            Create one
          </button>
          <kbd className="mono">⌘N</kbd>
        </div>
      ) : (
        <ul className="nl-items" key={scopeKey} ref={listRef}>
          {scoped.map((n, i) => (
            <li
              key={n.id}
              className="nl-row"
              style={{ animationDelay: `${Math.min(i, 8) * 18}ms` }}
            >
              <button
                className="nl-item"
                data-id={n.id}
                data-active={n.id === activeNoteId || undefined}
                onClick={() => openNote(n.id)}
              >
                <span className="nl-item-title">{n.title || "Untitled"}</span>
                <span className="nl-item-snip">
                  {snippet(n.body) || "No additional text"}
                </span>
                <span className="nl-item-when mono">{formatWhen(n.updatedAt)}</span>
              </button>
              <button
                className="nl-del"
                title="Delete note"
                aria-label="Delete note"
                onClick={() => onDelete(n)}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
