# Startodel agent skills

The five installable skills cover onboarding, technology Tracks, repository Tracks, GrillSessions and Reviews. Both Track skills teach comparison and deep-dive modes, then guide the agent through writing a Lesson. The repository workflow adds a trace through source and tests at a real revision.

Each folder under [skills](skills/) contains a generated `SKILL.md` with workflow steps and shared rules. The Track skills also include the worked seven-Block Lesson under `references/`. Edit the [agent guide](../../docs/agent-guide/README.md) and run `pnpm guide:build && pnpm skills:build` at the repository root to update the MCP resources and installable skills together.

## Install

1. Connect the client to your installation’s `/mcp` endpoint with Streamable HTTP and a Bearer credential from **Settings → MCP tokens**. [Connection instructions](../../README.md#connect-your-agent)
2. From the root of a Startodel checkout, copy the **whole skill folders** to your client’s user or project skills directory. For a client that reads user skills from `~/.agents/skills/`, run the following command.

   ```sh
   mkdir -p ~/.agents/skills
   cp -R packages/skills/skills/startodel-* ~/.agents/skills/
   ```

3. Check that each installed folder contains `SKILL.md` and that the browser tasks link inside each Track skill opens its local reference. Ask the connected agent to call `get_guide` for the Next Step.
