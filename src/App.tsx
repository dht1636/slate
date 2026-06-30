import { useEffect } from "react";
import { NotebookPen } from "lucide-react";
import { EditorPane } from "./components/Editor";
import { FloatNav } from "./components/FloatNav";
import { useStore } from "./store";

function EditorEmpty() {
  const { projects, createProject, createNote, selection } = useStore();
  const hasProjects = projects.length > 0;

  return (
    <div className="editor-empty">
      <NotebookPen size={28} strokeWidth={1.5} />
      {hasProjects ? (
        <>
          <h2>Nothing open</h2>
          <p>Pick a note from the list, or start a new one.</p>
          <div className="empty-actions">
            <button
              className="primary-btn"
              onClick={() => createNote()}
              disabled={!selection}
            >
              New note
            </button>
            <kbd className="mono">⌘N</kbd>
          </div>
        </>
      ) : (
        <>
          <h2>Welcome to Slate</h2>
          <p>Create a project to start taking notes.</p>
          <div className="empty-actions">
            <button className="primary-btn" onClick={createProject}>
              New project
            </button>
            <kbd className="mono">⌘⇧N</kbd>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const { notes, activeNoteId, createNote, createProject } = useStore();

  const active = notes.find((n) => n.id === activeNoteId) ?? null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "n" && e.shiftKey) {
        e.preventDefault();
        createProject();
      } else if (k === "n") {
        e.preventDefault();
        createNote();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createNote, createProject]);

  return (
    <div className="app">
      <main className="main">
        {active ? <EditorPane note={active} /> : <EditorEmpty />}
      </main>
      <FloatNav />
    </div>
  );
}
