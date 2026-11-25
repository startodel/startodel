# Deploy Startodel

Build the image from the repository root and give it a separate PostgreSQL database. The same image runs the web app, the MCP endpoint, and the migration command. Supply credentials at runtime.

## Runtime environment

Replace the placeholders with values for your installation. Use the same Session password for every replica and across restarts. Rotating it signs Users out.

| Variable                          | Required                 | Value or example                                                                                                                                                                                          |
| --------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Yes                      | `postgresql://<user>:<password>@<db-host>:5432/<database>`. Use a host reachable from the container. The migration role needs permission to create schemas and tables and alter the application's tables. |
| `NUXT_SESSION_PASSWORD`           | Yes                      | Generate a random secret of at least 32 characters with `openssl rand -base64 32`.                                                                                                                        |
| `NUXT_OAUTH_GITHUB_CLIENT_ID`     | Yes                      | `<github-oauth-app-client-id>`                                                                                                                                                                            |
| `NUXT_OAUTH_GITHUB_CLIENT_SECRET` | Yes                      | `<github-oauth-app-client-secret>`                                                                                                                                                                        |
| `NUXT_OAUTH_GITHUB_REDIRECT_URL`  | Yes for this HTTPS setup | `https://startodel.example/auth/github`. Use the exact public GitHub callback. Its origin also identifies same-origin MCP requests behind the proxy.                                                      |
| `RUN_MIGRATIONS`                  | Optional                 | Defaults to enabled. Set to `false` or `0` to skip the startup migration.                                                                                                                                 |
| `HOST`, `PORT`                    | Optional                 | The image listens on `0.0.0.0` and port `3000` by default.                                                                                                                                                |

Register a GitHub OAuth App with homepage `https://<domain>` and authorization callback URL `https://<domain>/auth/github`. Configure your TLS-terminating proxy to preserve the public Host and set `X-Forwarded-Host` to that host and `X-Forwarded-Proto` to `https`. [GitHub OAuth App registration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

## Run with Docker

Save the runtime values in a private `startodel.env` file outside the build context. From the repository root, run the following commands with its path. This example publishes the app on loopback for a reverse proxy on the host. If PostgreSQL runs on a private Docker network, also pass `--network <network>` to both the application and manual migration commands.

```sh
docker build -t startodel:local .
docker run -d --name startodel --env-file /path/to/startodel.env \
  -p 127.0.0.1:3000:3000 startodel:local
curl -fsS http://127.0.0.1:3000/api/health
```

Once startup finishes, expect `{"ok":true,"db":"up"}`. The image healthcheck reads both fields because a database outage also returns HTTP 200.

## Set up Dokploy

1. Create a project. Add a **PostgreSQL** database, set its database name and credentials, deploy it, and wait until it is ready. Copy the internal connection URL for the application. Keep the database on the private service network.
2. Add an **Application** in the same project environment. Select the **GitHub** source, repository, and branch or revision to build. Select the **Dockerfile** build type, set **Dockerfile Path** to `Dockerfile` and **Docker Context Path** to `.`. Leave the build stage empty to select the runtime stage. [Dokploy build types](https://docs.dokploy.com/docs/core/applications/build-type)
3. Under **Environment**, enter the runtime variables above, using the database's internal URL and the credentials from your GitHub OAuth App. Save the environment. The build itself needs no credentials.
4. Point the public domain's DNS at the proxy. Under **Domains**, add the host, set path `/` and **Container Port** `3000`, enable **HTTPS**, and choose **Let's Encrypt** as the certificate provider. [Dokploy domains](https://docs.dokploy.com/docs/core/domains)
5. Deploy the application. Use the image's healthcheck at `/api/health`. Once healthy, visit `https://<domain>/api/health` and confirm the database is up. Open `https://<domain>` and sign in with GitHub.
6. Create an MCP Token in the app and connect the agent to `https://<domain>/mcp` using Streamable HTTP. [MCP client setup](../README.md#connect-your-agent)
7. To redeploy on every push, install the Dokploy GitHub App on the account or organization that owns the repository and grant it access to the repository. In the application, select that GitHub provider as the source with branch `main` and turn on **Autodeploy**. Each push to `main` then builds and deploys the new commit, and startup migrations run as described below. [Dokploy auto deploy](https://docs.dokploy.com/docs/core/auto-deploy)

## Migrations and rollback

On startup, the container connects to PostgreSQL and takes a session-level advisory lock. Drizzle applies the pending SQL migrations shipped in the image. Other starting replicas wait for the lock, then check the same migration journal. The server starts only after migration succeeds. A failed migration exits the process so the failure is visible in the container logs.

To migrate separately, export `DATABASE_URL` in the calling shell and run the image once. This command exits when migrations finish.

```sh
docker run --rm -e DATABASE_URL startodel:local node migrate.mjs
```

You can then start the application with `RUN_MIGRATIONS=false`. This flag skips the automatic step only. Take a database backup before upgrading. To roll back the application, redeploy the previous image or rebuild its commit. Applied migrations persist. If that version requires the old schema, stop all application replicas, restore the matching backup and start the previous version. Restoring a backup discards writes made after that backup.
