import type { Project, Collection, Note } from "./types";

/* Seed content for first run — realistic notes for someone juggling
   several work projects. Doubles as a demo of the editor's formatting.
   Replaced by real file-loaded data when persistence lands. */

const now = Date.now();
const min = 60_000;
const hr = 60 * min;
const day = 24 * hr;

export const seedProjects: Project[] = [
  { id: "p-platform", name: "Acme Platform" },
  { id: "p-northwind", name: "Client — Northwind" },
  { id: "p-internal", name: "Internal Tools" },
];

export const seedCollections: Collection[] = [
  { id: "c-meetings", projectId: "p-platform", name: "Meetings" },
  { id: "c-specs", projectId: "p-platform", name: "Specs" },
  { id: "c-nw-onboard", projectId: "p-northwind", name: "Onboarding" },
];

export const seedNotes: Note[] = [
  {
    id: "n-arch",
    projectId: "p-platform",
    collectionId: "c-specs",
    title: "Auth service — design notes",
    body: `<h2>Auth service</h2><p>Splitting session handling out of the monolith. The token exchange stays <strong>synchronous</strong>, but refresh moves to a background job so we stop <mark>blocking the request path</mark> on Redis writes.</p><h3>Token rotation</h3><p>Rotate on every refresh, keep a short grace window for in-flight requests:</p><pre><code class="language-typescript">async function rotate(token: RefreshToken) {
  const next = await issue(token.subject);
  await store.revoke(token.id, { graceMs: 5_000 });
  return next;
}</code></pre><ul><li>Grace window covers double-submits from retries</li><li>Revocation is <em>append-only</em> — never hard-delete</li></ul>`,
    createdAt: now - 3 * day,
    updatedAt: now - 4 * hr,
  },
  {
    id: "n-standup",
    projectId: "p-platform",
    collectionId: "c-meetings",
    title: "Standup — Thu",
    body: `<p><strong>Shipped:</strong> rate limiter behind the gateway.</p><p><strong>Blocked:</strong> staging DB migration — waiting on infra to bump the connection cap.</p><p><strong>Next:</strong> wire the <mark>auth refresh job</mark> and backfill metrics.</p>`,
    createdAt: now - 1 * day,
    updatedAt: now - 22 * hr,
  },
  {
    id: "n-ideas",
    projectId: "p-platform",
    collectionId: null,
    title: "Scratch — ideas",
    body: `<p>Loose thoughts that don't belong anywhere yet.</p><ul><li>Per-project keyboard macros?</li><li>Inline <code>TODO</code> extraction across notes</li></ul>`,
    createdAt: now - 6 * hr,
    updatedAt: now - 35 * min,
  },
  {
    id: "n-kickoff",
    projectId: "p-northwind",
    collectionId: "c-nw-onboard",
    title: "Kickoff call",
    body: `<h2>Northwind kickoff</h2><p>Scope is a read-only reporting portal on top of their existing warehouse. They explicitly do <strong>not</strong> want write access in phase one.</p><blockquote>"If it can break the books, it's out of scope." — their CFO</blockquote><p>Deliverable cadence: fortnightly demos, Thursdays.</p>`,
    createdAt: now - 9 * day,
    updatedAt: now - 2 * day,
  },
  {
    id: "n-access",
    projectId: "p-northwind",
    collectionId: null,
    title: "Access checklist",
    body: `<p>Still waiting on:</p><ul><li>Warehouse read replica creds</li><li>VPN profile</li><li>SSO app registration</li></ul>`,
    createdAt: now - 5 * day,
    updatedAt: now - 5 * day,
  },
  {
    id: "n-snippets",
    projectId: "p-internal",
    collectionId: null,
    title: "Useful snippets",
    body: `<p>One-liners I keep forgetting.</p><pre><code class="language-bash">git log --oneline --graph --decorate --all</code></pre><p>And resetting a stuck migration:</p><pre><code class="language-sql">UPDATE schema_migrations SET dirty = false WHERE version = $1;</code></pre>`,
    createdAt: now - 12 * day,
    updatedAt: now - 1 * day,
  },
];
