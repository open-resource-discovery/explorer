import { createServer } from "node:net";
import { createServer as createViteServer } from "vite";
import { resolve } from "node:path";

async function getFreePort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close((err) => (err ? rej(err) : res(port)));
    });
    srv.on("error", rej);
  });
}

export default async function globalSetup() {
  const [appPort, proxyPort] = await Promise.all([
    getFreePort(),
    getFreePort(),
  ]);

  process.env.E2E_APP_PORT = String(appPort);
  process.env.E2E_PROXY_PORT = String(proxyPort);

  // Start auth-proxy
  const { start } = await import(
    new URL("../auth-proxy/src/index.ts", import.meta.url).pathname
  );
  process.env.ALLOW_ORIGIN = `http://localhost:${appPort}`;
  const stopProxy: () => Promise<void> = await (
    start as (port: number) => Promise<() => Promise<void>>
  )(proxyPort);

  // Start Vite dev server
  process.env.PROXY_PORT = String(proxyPort);
  const vite = await createViteServer({
    configFile: resolve(process.cwd(), "app/vite.config.ts"),
    server: { port: appPort, strictPort: true },
    logLevel: "error",
  });
  await vite.listen();

  return async function globalTeardown() {
    await vite.close();
    await stopProxy();
  };
}
