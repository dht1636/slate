export type ID = string;

export interface Project {
  id: ID;
  name: string;
}

/** An optional grouping of notes within a project. */
export interface Collection {
  id: ID;
  projectId: ID;
  name: string;
}

export interface Note {
  id: ID;
  projectId: ID;
  /** null = loose note directly under the project. */
  collectionId: ID | null;
  title: string;
  /** TipTap HTML. Serialized to Markdown when file persistence lands. */
  body: string;
  createdAt: number;
  updatedAt: number;
}

/** What the note list is currently scoped to. */
export type Selection =
  | { kind: "project"; projectId: ID }
  | { kind: "collection"; projectId: ID; collectionId: ID };
