# Startodel agent skills

These five skills teach a connected agent how to onboard a learner, build a technology Track, build a repository-based Track, run a grill session and review due Topics. Each folder in [skills](skills/) contains a complete workflow in the [Agent Skills format](https://agentskills.io/specification).

The workflows and their descriptions are generated from the [agent guide](../../docs/agent-guide/README.md). To change one, edit the guide and run `pnpm guide:build && pnpm skills:build` at the repository root.

## Install

Connect your agent client to `https://<host>/mcp` using Streamable HTTP and a Bearer token from **Settings → MCP tokens**. The [connection instructions](../../README.md#connect-your-agent) cover token creation and client configuration.

From the root of a Startodel checkout, run the command for your client to install the skills for your user account.

| Client                                                                         | User install command                                                                      | Project folder    |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------- |
| [Cursor](https://cursor.com/docs/skills#skill-directories)                     | `mkdir -p ~/.cursor/skills && cp -R packages/skills/skills/startodel-* ~/.cursor/skills/` | `.cursor/skills/` |
| [Claude Code](https://code.claude.com/docs/en/skills#choose-where-skills-load) | `mkdir -p ~/.claude/skills && cp -R packages/skills/skills/startodel-* ~/.claude/skills/` | `.claude/skills/` |
| [Codex](https://developers.openai.com/codex/skills/)                           | `mkdir -p ~/.agents/skills && cp -R packages/skills/skills/startodel-* ~/.agents/skills/` | `.agents/skills/` |

For a project install, replace the destination in both parts of the command with the project folder under the target repository. Each installed folder should contain its own `SKILL.md`. Ask the connected agent to call `get_guide` to see the next step for your Profile.
