import { useEffect, useMemo, useState } from "react";
import {
  Folder,
  FileText,
  Plus,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../store";
import { useTheme } from "../theme";
import { Sidebar } from "./Sidebar";
import { NoteList } from "./NoteList";

type Pop = "project" | "note" | null;

/* The single floating, glass navigation bar — Slate's global "get from project
   to project, note to note" control. It replaces the two persistent sidebars,
   handing the whole window to the editor. Each navigator opens its list in an
   upward glass popover; Sidebar/NoteList are reused verbatim inside them. */
export function FloatNav() {
  const {
    projects,
    collections,
    notes,
    selection,
    activeNoteId,
    openNote,
    createNote,
    createProject,
  } = useStore();
  const { theme, toggle } = useTheme();
  const [pop, setPop] = useState<Pop>(null);

  const scopeName = selection
    ? selection.kind === "collection"
      ? collections.find((c) => c.id === selection.collectionId)?.name
      : projects.find((p) => p.id === selection.projectId)?.name
    : null;

  // Mirror NoteList's scope+order so the counter and prev/next match the list.
  const scoped = useMemo(
    () =>
      selection
        ? notes
            .filter((n) =>
              selection.kind === "collection"
                ? n.collectionId === selection.collectionId
                : n.projectId === selection.projectId,
            )
            .sort((a, b) => b.updatedAt - a.updatedAt)
        : [],
    [notes, selection],
  );

  const idx = scoped.findIndex((n) => n.id === activeNoteId);
  const active = idx >= 0 ? scoped[idx] : null;

  const step = (dir: number) => {
    if (!scoped.length) return;
    const next =
      idx === -1
        ? dir > 0
          ? 0
          : scoped.length - 1
        : Math.min(scoped.length - 1, Math.max(0, idx + dir));
    openNote(scoped[next].id);
  };

  // ⌘K → notes, ⌘⇧P → projects, Escape → close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && pop) {
        setPop(null);
        return;
      }
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "k") {
        e.preventDefault();
        setPop((p) => (p === "note" ? null : "note"));
      } else if (k === "p" && e.shiftKey) {
        e.preventDefault();
        setPop((p) => (p === "project" ? null : "project"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pop]);

  const hasProjects = projects.length > 0;

  return (
    <>
      {pop && (
        <button
          className="pop-scrim"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setPop(null)}
        />
      )}

      <nav className="floatbar glass" aria-label="Navigation">
        <span className="fb-brand" aria-hidden="true">
          S<span className="fb-dot">◆</span>
        </span>

        {hasProjects ? (
          <>
            <span className="fb-div" />

            <div className="fb-group">
              <button
                className="fb-pill"
                data-open={pop === "project" || undefined}
                onClick={() => setPop((p) => (p === "project" ? null : "project"))}
                title="Projects  ⌘⇧P"
                aria-haspopup="menu"
                aria-expanded={pop === "project"}
              >
                <Folder size={15} strokeWidth={1.75} />
                <span className="fb-label">{scopeName ?? "Select project"}</span>
              </button>
              {pop === "project" && (
                <div className="pop glass" data-anchor="left" role="menu">
                  <Sidebar onNavigate={() => setPop(null)} />
                </div>
              )}
            </div>

            <div className="fb-group fb-notegroup">
              <button
                className="fb-step"
                onClick={() => step(-1)}
                disabled={idx <= 0}
                title="Previous note"
                aria-label="Previous note"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                className="fb-pill fb-note"
                data-open={pop === "note" || undefined}
                onClick={() => setPop((p) => (p === "note" ? null : "note"))}
                title="Notes  ⌘K"
                aria-haspopup="menu"
                aria-expanded={pop === "note"}
              >
                <FileText size={15} strokeWidth={1.75} />
                <span className="fb-label">
                  {active ? active.title || "Untitled" : "No note open"}
                </span>
                {scoped.length > 0 && (
                  <span className="fb-count mono">
                    {idx >= 0 ? idx + 1 : "–"}/{scoped.length}
                  </span>
                )}
              </button>

              <button
                className="fb-step"
                onClick={() => step(1)}
                disabled={idx >= scoped.length - 1}
                title="Next note"
                aria-label="Next note"
              >
                <ChevronRight size={16} />
              </button>

              {pop === "note" && (
                <div className="pop glass" data-anchor="right" role="menu">
                  <NoteList onNavigate={() => setPop(null)} />
                </div>
              )}
            </div>

            <span className="fb-div" />
            <button
              className="fb-new"
              onClick={() => {
                if (createNote()) setPop(null);
              }}
              disabled={!selection}
              title="New note  ⌘N"
              aria-label="New note"
            >
              <Plus size={17} strokeWidth={2.25} />
            </button>
          </>
        ) : (
          <>
            <span className="fb-div" />
            <button className="fb-pill fb-primary-pill" onClick={createProject}>
              <Plus size={15} strokeWidth={2.25} />
              <span className="fb-label">New project</span>
            </button>
          </>
        )}

        <button
          className="fb-icon"
          onClick={toggle}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>
    </>
  );
}
