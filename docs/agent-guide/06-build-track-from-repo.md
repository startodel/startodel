---
id: build-track-from-repo
title: Build a Track from a repository
order: 6
skillDescription: Build a Track from a repository when the learning goal depends on a specific revision.
---

# Build a Track from a repository

Use `get_profile` to establish the learner’s goal and `list_topics` to find relevant prior work. Ground the Track in a real repository revision before applying the Track design workflow.

1. **Pin the task.** Pair the learner’s project and experience with a change, diagnosis or design choice they want to make. Resolve the target release or branch to a commit. Continue when you can name the task and link to the revision.
2. **Trace one real call.** Use your own repository and web tools to check the release history and official docs against that revision. Follow a public entry point through its implementation to a test that exercises the behavior. Keep a permalink to each and distinguish the public guarantee from the implementation detail. If access is missing, get the source or a verifiable public revision before continuing.
3. **Choose the route.** Use comparison mode for a choice between approaches and deep-dive mode for a working change. For a comparison, trace the same operation on both sides. For a deep dive, locate the setup and a failure the learner can reproduce. Carry that evidence into **Design and verify a Track**. The outline is ready to build when it names the mode, the pinned revision for the Track description and the permalinks for Track Sources.
