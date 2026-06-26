import { useEffect, useState } from "react";
import { PanelLeft, PanelLeftClose, Sun, Moon, NotebookPen } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { NoteList } from "./components/NoteList";
import { EditorPane } from "./components/Editor";
import { useStore } from "./store";
import { useTheme } from "./theme";

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
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      } else if (k === "\\") {
        e.preventDefault();
        setSidebarOpen((s) => !s);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createNote, createProject]);

  return (
    <div className="app" data-sidebar={sidebarOpen ? "open" : "closed"}>
      <aside className="rail">
        <Sidebar />
        <div className="rail-foot">
          <button
            className="foot-btn"
            onClick={toggle}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button
            className="foot-btn icon"
            onClick={() => setSidebarOpen(false)}
            title="Collapse sidebar  ⌘\"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </aside>

      {!sidebarOpen && (
        <button
          className="rail-reveal"
          onClick={() => setSidebarOpen(true)}
          title="Show sidebar  ⌘\"
          aria-label="Show sidebar"
        >
          <PanelLeft size={16} />
        </button>
      )}

      <NoteList />

      <main className="main">
        {active ? <EditorPane note={active} /> : <EditorEmpty />}
      </main>
    </div>
  );
}
