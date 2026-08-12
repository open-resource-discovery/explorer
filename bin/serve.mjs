#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");

const portArg = process.argv.find((a) => a.startsWith("--port="));
const port = parseInt(process.env.PORT ?? portArg?.split("=")[1] ?? "3000", 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  let filePath = resolve(distDir, url.pathname.replace(/^\//, ""));

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = resolve(filePath, "index.html");
  }

  if (!existsSync(filePath) || !filePath.startsWith(distDir)) {
    filePath = resolve(distDir, "index.html");
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  res.end(readFileSync(filePath));
});

server.listen(port, () => {
  console.log(`ORD Explorer running at http://localhost:${port}`);
});
