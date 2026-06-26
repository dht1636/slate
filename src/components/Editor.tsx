import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { StarterKit } from "@tiptap/starter-kit";
import { Highlight } from "@tiptap/extension-highlight";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { Image } from "@tiptap/extension-image";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import { createLowlight, common } from "lowlight";
import {
  Bold,
  Italic,
  Highlighter,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  SquareCode,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import type { Note } from "../types";
import { useStore } from "../store";
import { useConfirm } from "../confirm";
import { formatWhen, countWords } from "../lib/format";

const lowlight = createLowlight(common);

/* A restrained text-color palette — readable on both themes, not a rainbow. */
const COLORS: { label: string; value: string | null }[] = [
  { label: "Default", value: null },
  { label: "Amber", value: "#d99a2b" },
  { label: "Red", value: "#e0604e" },
  { label: "Green", value: "#4fae83" },
  { label: "Blue", value: "#5795d4" },
  { label: "Violet", value: "#a386d6" },
];

function ToolButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className="tool-btn"
      data-active={active || undefined}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      type="button"
    >
      {children}
    </button>
  );
}

export function EditorPane({ note }: { note: Note }) {
  const { updateNote, projects, collections, deleteNote } = useStore();
  const confirm = useConfirm();
  const [words, setWords] = useState(() => countWords(note.body.replace(/<[^>]+>/g, " ")));
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedId = useRef<string>(note.id);
  const ready = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TextStyle,
      Color,
      Highlight,
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: note.body,
    autofocus: false,
    editorProps: { attributes: { class: "prose", spellcheck: "true" } },
    onUpdate: ({ editor }) => {
      if (!ready.current) return; // initial parse / programmatic swap, not a user edit
      updateNote(note.id, { body: editor.getHTML() });
      setWords(countWords(editor.getText()));
    },
  });

  /* Arm edit-tracking one tick after mount so the initial content parse
     (and StrictMode's dev remount) can't be mistaken for a user edit. */
  useEffect(() => {
    if (!editor) return;
    const t = setTimeout(() => (ready.current = true), 0);
    return () => clearTimeout(t);
  }, [editor]);

  /* Swap content only when a *different* note is opened — never on our own
     keystroke updates (cursor would jump) and never bumping updatedAt. */
  useEffect(() => {
    if (!editor || loadedId.current === note.id) return;
    ready.current = false;
    editor.commands.setContent(note.body, { emitUpdate: false });
    setWords(countWords(editor.getText()));
    loadedId.current = note.id;
    const t = setTimeout(() => (ready.current = true), 0);
    return () => clearTimeout(t);
  }, [editor, note.id, note.body]);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () =>
      editor.chain().focus().setImage({ src: reader.result as string }).run();
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const project = projects.find((p) => p.id === note.projectId);
  const collection = collections.find((c) => c.id === note.collectionId);

  /* Replay the crossfade whenever a different note is opened. */
  const swapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = swapRef.current;
    if (!el) return;
    el.classList.remove("swap");
    void el.offsetWidth; // force reflow so the animation restarts
    el.classList.add("swap");
  }, [note.id]);

  async function onDelete() {
    const ok = await confirm({
      title: "Delete note?",
      message: `"${note.title || "Untitled"}" will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete note",
      tone: "danger",
    });
    if (ok) deleteNote(note.id);
  }

  return (
    <div className="editor" ref={swapRef}>
      <button
        className="editor-del"
        onClick={onDelete}
        title="Delete note"
        aria-label="Delete note"
      >
        <Trash2 size={16} />
      </button>
      <header className="editor-head">
        <input
          className="note-title"
          value={note.title}
          onChange={(e) => updateNote(note.id, { title: e.target.value })}
          placeholder="Untitled"
          aria-label="Note title"
        />
        <div className="note-meta mono">
          <span>{project?.name ?? "—"}</span>
          {collection && (
            <>
              <span className="sep">/</span>
              <span>{collection.name}</span>
            </>
          )}
          <span className="sep">·</span>
          <span>{formatWhen(note.updatedAt)}</span>
          <span className="sep">·</span>
          <span>{words} words</span>
        </div>
      </header>

      {editor && (
        <div className="toolbar" role="toolbar" aria-label="Block formatting">
          <ToolButton
            label="Heading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 size={16} />
          </ToolButton>
          <ToolButton
            label="Subheading"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 size={16} />
          </ToolButton>
          <span className="tool-div" />
          <ToolButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={16} />
          </ToolButton>
          <ToolButton
            label="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={16} />
          </ToolButton>
          <ToolButton
            label="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={16} />
          </ToolButton>
          <ToolButton
            label="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <SquareCode size={16} />
          </ToolButton>
          <span className="tool-div" />
          <ToolButton label="Insert image" onClick={() => fileRef.current?.click()}>
            <ImageIcon size={16} />
          </ToolButton>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={pickImage}
          />
        </div>
      )}

      {editor && (
        <BubbleMenu editor={editor} className="bubble">
          <ToolButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={15} />
          </ToolButton>
          <ToolButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={15} />
          </ToolButton>
          <ToolButton
            label="Highlight"
            active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Highlighter size={15} />
          </ToolButton>
          <ToolButton
            label="Inline code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code size={15} />
          </ToolButton>
          <span className="tool-div" />
          <div className="swatches" role="group" aria-label="Text color">
            {COLORS.map((c) => (
              <button
                key={c.label}
                className="swatch"
                title={c.label}
                aria-label={c.label}
                style={c.value ? { background: c.value } : undefined}
                data-default={c.value === null || undefined}
                onClick={() =>
                  c.value
                    ? editor.chain().focus().setColor(c.value).run()
                    : editor.chain().focus().unsetColor().run()
                }
              />
            ))}
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor as Editor} className="editor-scroll" />
    </div>
  );
}
