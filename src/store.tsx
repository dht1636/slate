import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Collection, ID, Note, Project, Selection } from "./types";
import { seedCollections, seedNotes, seedProjects } from "./seed";
import { loadVault, saveVault } from "./persist";

/* In-memory store — the single data-layer seam. Every read/write the UI
   does goes through this hook. When file persistence lands, only the
   bodies of these actions change (read seed → read disk, mutate → write
   disk); the surface the components consume stays identical. */

const uid = () => crypto.randomUUID();

interface Store {
  projects: Project[];
  collections: Collection[];
  notes: Note[];
  selection: Selection | null;
  activeNoteId: ID | null;
  expanded: Set<ID>;
  /** Project or collection id currently being renamed inline, if any. */
  editingId: ID | null;

  select: (s: Selection) => void;
  openNote: (id: ID) => void;
  toggleExpanded: (projectId: ID) => void;
  setEditingId: (id: ID | null) => void;

  createProject: () => void;
  createCollection: (projectId: ID) => void;
  createNote: () => ID | null;
  updateNote: (id: ID, patch: Partial<Pick<Note, "title" | "body">>) => void;
  deleteNote: (id: ID) => void;
  renameProject: (id: ID, name: string) => void;
  renameCollection: (id: ID, name: string) => void;
  deleteProject: (id: ID) => void;
  deleteCollection: (id: ID) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<ID | null>(null);
  const [editingId, setEditingId] = useState<ID | null>(null);
  const [expanded, setExpanded] = useState<Set<ID>>(() => new Set());
  const [loaded, setLoaded] = useState(false);

  /* Load the vault from disk on mount; first run (or no Tauri) falls back to
     the demo seed, which then gets persisted by the save effect below. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let data = await loadVault().catch(() => null);
      if (!data || (data.projects.length === 0 && data.notes.length === 0)) {
        data = {
          projects: seedProjects,
          collections: seedCollections,
          notes: seedNotes,
        };
      }
      if (cancelled) return;
      setProjects(data.projects);
      setCollections(data.collections);
      setNotes(data.notes);
      setSelection(
        data.projects[0] ? { kind: "project", projectId: data.projects[0].id } : null,
      );
      setExpanded(new Set(data.projects.map((p) => p.id)));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Debounced reconciling save whenever content changes (after load). */
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveVault({ projects, collections, notes }).catch((e) =>
        console.error("Slate: save failed", e),
      );
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [loaded, projects, collections, notes]);

  const select = useCallback((s: Selection) => {
    setSelection(s);
    setActiveNoteId(null);
  }, []);

  const openNote = useCallback((id: ID) => setActiveNoteId(id), []);

  const toggleExpanded = useCallback((projectId: ID) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(projectId) ? next.delete(projectId) : next.add(projectId);
      return next;
    });
  }, []);

  const createProject = useCallback(() => {
    const id = uid();
    setProjects((p) => [...p, { id, name: "New Project" }]);
    setExpanded((e) => new Set(e).add(id));
    setSelection({ kind: "project", projectId: id });
    setActiveNoteId(null);
    setEditingId(id); // drop straight into rename
  }, []);

  const createCollection = useCallback((projectId: ID) => {
    const id = uid();
    setCollections((c) => [...c, { id, projectId, name: "New Collection" }]);
    setExpanded((e) => new Set(e).add(projectId));
    setSelection({ kind: "collection", projectId, collectionId: id });
    setEditingId(id);
  }, []);

  const createNote = useCallback((): ID | null => {
    if (!selection) return null;
    const ts = Date.now();
    const note: Note = {
      id: uid(),
      projectId: selection.projectId,
      collectionId: selection.kind === "collection" ? selection.collectionId : null,
      title: "",
      body: "",
      createdAt: ts,
      updatedAt: ts,
    };
    setNotes((n) => [note, ...n]);
    setExpanded((e) => new Set(e).add(selection.projectId));
    setActiveNoteId(note.id);
    return note.id;
  }, [selection]);

  const updateNote = useCallback(
    (id: ID, patch: Partial<Pick<Note, "title" | "body">>) => {
      setNotes((n) =>
        n.map((note) =>
          note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note,
        ),
      );
    },
    [],
  );

  const deleteNote = useCallback(
    (id: ID) => {
      setNotes((n) => n.filter((note) => note.id !== id));
      setActiveNoteId((cur) => (cur === id ? null : cur));
    },
    [],
  );

  const renameProject = useCallback((id: ID, name: string) => {
    setProjects((p) => p.map((proj) => (proj.id === id ? { ...proj, name } : proj)));
  }, []);

  const renameCollection = useCallback((id: ID, name: string) => {
    setCollections((c) => c.map((coll) => (coll.id === id ? { ...coll, name } : coll)));
  }, []);

  const deleteProject = useCallback(
    (id: ID) => {
      setActiveNoteId((cur) =>
        cur && notes.find((n) => n.id === cur)?.projectId === id ? null : cur,
      );
      setSelection((sel) => {
        if (!sel || sel.projectId !== id) return sel;
        const next = projects.find((p) => p.id !== id);
        return next ? { kind: "project", projectId: next.id } : null;
      });
      setNotes((n) => n.filter((note) => note.projectId !== id));
      setCollections((c) => c.filter((coll) => coll.projectId !== id));
      setProjects((p) => p.filter((proj) => proj.id !== id));
    },
    [notes, projects],
  );

  const deleteCollection = useCallback(
    (id: ID) => {
      const coll = collections.find((c) => c.id === id);
      setActiveNoteId((cur) =>
        cur && notes.find((n) => n.id === cur)?.collectionId === id ? null : cur,
      );
      setSelection((sel) =>
        sel && sel.kind === "collection" && sel.collectionId === id
          ? { kind: "project", projectId: coll?.projectId ?? sel.projectId }
          : sel,
      );
      setNotes((n) => n.filter((note) => note.collectionId !== id));
      setCollections((c) => c.filter((c2) => c2.id !== id));
    },
    [collections, notes],
  );

  const value = useMemo<Store>(
    () => ({
      projects,
      collections,
      notes,
      selection,
      activeNoteId,
      expanded,
      editingId,
      select,
      openNote,
      toggleExpanded,
      setEditingId,
      createProject,
      createCollection,
      createNote,
      updateNote,
      deleteNote,
      renameProject,
      renameCollection,
      deleteProject,
      deleteCollection,
    }),
    [
      projects,
      collections,
      notes,
      selection,
      activeNoteId,
      expanded,
      editingId,
      select,
      openNote,
      toggleExpanded,
      createProject,
      createCollection,
      createNote,
      updateNote,
      deleteNote,
      renameProject,
      renameCollection,
      deleteProject,
      deleteCollection,
    ],
  );

  return (
    <StoreContext.Provider value={value}>
      {loaded ? children : <div style={{ height: "100%" }} />}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
