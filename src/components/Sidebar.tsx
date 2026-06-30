import { useEffect, useRef } from "react";
import { ChevronRight, FolderPlus, Plus, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { useConfirm } from "../confirm";
import type { Project, Selection } from "../types";

function sameSel(a: Selection | null, b: Selection): boolean {
  if (!a || a.kind !== b.kind) return false;
  if (a.kind === "project" && b.kind === "project") return a.projectId === b.projectId;
  if (a.kind === "collection" && b.kind === "collection")
    return a.collectionId === b.collectionId;
  return false;
}

/* Inline rename field. Enter / blur commits, Escape reverts. Commit fires
   exactly once so a blur after Enter/Escape can't double-write. */
function RenameInput({
  initial,
  onCommit,
  className,
}: {
  initial: string;
  onCommit: (name: string) => void;
  className: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const finish = (value: string) => {
    if (done.current) return;
    done.current = true;
    onCommit(value.trim() || initial);
  };

  return (
    <input
      ref={ref}
      className={className}
      defaultValue={initial}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(ref.current!.value);
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(initial);
        }
      }}
      onBlur={() => finish(ref.current!.value)}
    />
  );
}

function ProjectNode({
  project,
  onNavigate,
}: {
  project: Project;
  onNavigate?: () => void;
}) {
  const {
    collections,
    notes,
    selection,
    expanded,
    editingId,
    select,
    toggleExpanded,
    setEditingId,
    createCollection,
    renameProject,
    renameCollection,
    deleteProject,
    deleteCollection,
  } = useStore();
  const confirm = useConfirm();

  const isOpen = expanded.has(project.id);
  const projCollections = collections.filter((c) => c.projectId === project.id);
  const noteCount = notes.filter((n) => n.projectId === project.id).length;
  const active = sameSel(selection, { kind: "project", projectId: project.id });

  async function onDeleteProject() {
    const tail = noteCount === 1 ? "1 note" : `${noteCount} notes`;
    const ok = await confirm({
      title: "Delete project?",
      message: `"${project.name}"${noteCount ? ` and its ${tail}` : ""} will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete project",
      tone: "danger",
    });
    if (ok) deleteProject(project.id);
  }

  async function onDeleteCollection(id: string, name: string, count: number) {
    const tail = count === 1 ? "1 note" : `${count} notes`;
    const ok = await confirm({
      title: "Delete collection?",
      message: `"${name}"${count ? ` and its ${tail}` : ""} will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete collection",
      tone: "danger",
    });
    if (ok) deleteCollection(id);
  }

  return (
    <li className="proj">
      <div className="proj-row" data-active={active || undefined}>
        <button
          className="twisty"
          onClick={() => toggleExpanded(project.id)}
          aria-label={isOpen ? "Collapse" : "Expand"}
          aria-expanded={isOpen}
        >
          <ChevronRight size={14} className="chev" data-open={isOpen || undefined} />
        </button>

        {editingId === project.id ? (
          <RenameInput
            className="rename-input proj-rename"
            initial={project.name}
            onCommit={(name) => {
              renameProject(project.id, name);
              setEditingId(null);
            }}
          />
        ) : (
          <button
            className="proj-name"
            onClick={() => {
              select({ kind: "project", projectId: project.id });
              onNavigate?.();
            }}
            onDoubleClick={() => setEditingId(project.id)}
            title="Double-click to rename"
          >
            <span className="proj-label">{project.name}</span>
            <span className="count mono">{noteCount}</span>
          </button>
        )}

        <button
          className="row-act"
          title="New collection"
          aria-label="New collection in project"
          onClick={() => createCollection(project.id)}
        >
          <FolderPlus size={14} />
        </button>
        <button
          className="row-act danger"
          title="Delete project"
          aria-label="Delete project"
          onClick={onDeleteProject}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {projCollections.length > 0 && (
        <div className="coll-wrap" data-collapsed={!isOpen || undefined}>
          <ul className="coll-list">
            {projCollections.map((c) => {
            const cActive = sameSel(selection, {
              kind: "collection",
              projectId: project.id,
              collectionId: c.id,
            });
            const cCount = notes.filter((n) => n.collectionId === c.id).length;
            return (
              <li key={c.id}>
                <div className="coll-row" data-active={cActive || undefined}>
                  {editingId === c.id ? (
                    <RenameInput
                      className="rename-input coll-rename"
                      initial={c.name}
                      onCommit={(name) => {
                        renameCollection(c.id, name);
                        setEditingId(null);
                      }}
                    />
                  ) : (
                    <button
                      className="coll-name"
                      onClick={() => {
                        select({
                          kind: "collection",
                          projectId: project.id,
                          collectionId: c.id,
                        });
                        onNavigate?.();
                      }}
                      onDoubleClick={() => setEditingId(c.id)}
                      title="Double-click to rename"
                    >
                      <span className="coll-label">{c.name}</span>
                      <span className="count mono">{cCount}</span>
                    </button>
                  )}
                  <button
                    className="row-act danger"
                    title="Delete collection"
                    aria-label="Delete collection"
                    onClick={() => onDeleteCollection(c.id, c.name, cCount)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            );
          })}
          </ul>
        </div>
      )}
    </li>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { projects, createProject } = useStore();

  return (
    <nav className="sidebar" aria-label="Projects">
      <div className="side-head">
        <span className="side-title mono">Projects</span>
        <button
          className="head-add"
          onClick={createProject}
          title="New project  ⌘⇧N"
          aria-label="New project"
        >
          <Plus size={16} />
        </button>
      </div>
      <ul className="proj-list">
        {projects.map((p) => (
          <ProjectNode key={p.id} project={p} onNavigate={onNavigate} />
        ))}
      </ul>
    </nav>
  );
}
