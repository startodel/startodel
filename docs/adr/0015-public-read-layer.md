# 15. Public read layer

## Status

Accepted

## Context

Learners want to share selected Tracks. A Topic can belong to several Tracks, and its Lessons and practice history have one Owner. Publishing a Track must never publish the Owner’s learning record.

## Decision

Keep Session and MCP access to private data scoped by `forUser`. A separate, read-only `publicReader` projects explicit columns into the public types in the core package. A Public Profile exposes the account’s login, name and avatar even when its list of Public Tracks is empty. Track reads check visibility, Topic membership and both endpoints of each TopicEdge. Lesson reads join through the requested Track to the Lesson’s Topic. Public Lesson Blocks omit Quiz answer keys and explanations and Exercise solutions. Public SSR omits the viewer’s Session payload.

The Landing, legacy login redirects, Public Profiles, Public Tracks, public Lessons and legal pages in either language vary on Cookie and Accept-Encoding. With no Session cookie they send `public, max-age=60, s-maxage=300, stale-while-revalidate=600`. Any Session cookie, including an invalid or empty one, selects `private, no-store` for HTML and redirects. Private routes and all API responses, including `/api/public/**`, also send `private, no-store`. The sitemap, robots.txt and Open Graph images depend only on public data and send `public, max-age=300, stale-while-revalidate=3600` regardless of cookies.

Each Track has a stable Track Slug unique within its Owner’s catalog. Allocate from the title, use `track` for an empty normalized name, and append numeric suffixes on creation conflicts. An explicit slug update must be valid and unique. The migration processes existing rows in creation and ID order. New and migrated Tracks start private.

Count every direct Fork using its source foreign key. Only Public Forks appear in the public list. Store the source login and slug at fork time so attribution survives source deletion. This cross-Owner relationship references the source Track ID with ON DELETE SET NULL. Resolve the current public link by ID, including after a slug change. An unpublished or deleted source retains its captured attribution as plain text.

Fork a Public Track into another Owner’s catalog in one repeatable-read transaction. Lock the visible source against concurrent unpublishing and deletion. Read the graph through the public layer and write through the recipient’s `forUser`. Reuse Topics by Topic Slug with their existing content and Mastery. An empty Topic receives the source Lessons. The dedicated fork-only Lesson query checks the same Track visibility and Topic membership and reads complete Blocks so practice works in the copy. It is unavailable to public handlers. Add missing TopicEdges, preserve membership order and create a private Track on every Fork. Copy no private learning history.

Publishing requires Terms Acceptance for the current version. The Session operation updates the owned Track and, when explicitly requested, records the terms version and acceptance time in one transaction. MCP can check acceptance and unpublish. Only the learner can accept in the app. The English and Russian legal documents share a version checked at build time.

## Consequences

Publishing a Track makes future edits to its member Topics’ Lessons visible too. Unpublishing closes public reads at the origin immediately. Cached previews and anonymous pages can remain visible until their cache windows expire. Existing Forks have independent content, and rights to existing copies survive under the published terms. Updating legal documents requires a version bump and acceptance before the next publication. Self-hosted operators govern their own instances.
