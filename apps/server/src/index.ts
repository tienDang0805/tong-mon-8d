import {
  startGameServer,
  loadRepoEnvIfNeeded,
  type StartGameServerOptions
} from "./app/createGameServer.js";

export { startGameServer, loadRepoEnvIfNeeded };
export type { StartGameServerOptions };

const normalizedEntry = (process.argv[1] ?? "").replace(/\\/g, "/");
const isMainModule =
  normalizedEntry.endsWith("src/index.ts") ||
  normalizedEntry.endsWith("dist/index.js");

if (isMainModule && !process.env.VITEST) {
  loadRepoEnvIfNeeded();
  const runtimePort = Number(process.env.PORT ?? 2567);
  startGameServer(runtimePort)
    .then(({ shutdown }) => {
      let shuttingDown = false;
      const handleSignal = () => {
        if (shuttingDown) {
          return;
        }
        shuttingDown = true;
        shutdown()
          .catch(() => undefined)
          .finally(() => {
            process.exit(0);
          });
      };
      process.once("SIGINT", handleSignal);
      process.once("SIGTERM", handleSignal);
    })
    .catch((err) => {
      process.stderr.write(`Server startup error: ${String(err)}\n`);
      process.exit(1);
    });
}
