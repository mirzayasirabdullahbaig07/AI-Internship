/** @jest-environment node */
import http from "node:http";
import type { AddressInfo } from "node:net";
import { fetchWithRetry, HttpError } from "./fetchWithRetry";

let server: http.Server;
let base = "";
let hits = 0;
let mode: "drop2" | "always401" | "always500" | "500then200" | "alwaysDrop" | "badJson" =
  "drop2";

beforeAll(async () => {
  server = http.createServer((req, res) => {
    hits++;
    const auth = req.headers.authorization;
    const ok = () => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify([{ id: 1, title: "hello", auth }]));
    };
    if (mode === "drop2") return hits <= 2 ? req.socket.destroy() : ok(); // simulated network drops
    if (mode === "badJson") {
      res.setHeader("content-type", "application/json");
      return res.end("<html>not json");
    }
    if (mode === "alwaysDrop") return req.socket.destroy();
    if (mode === "always401") {
      res.statusCode = 401;
      return res.end();
    }
    if (mode === "always500") {
      res.statusCode = 500;
      return res.end();
    }
    if (mode === "500then200")
      return hits === 1 ? ((res.statusCode = 503), res.end()) : ok();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/posts`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));
beforeEach(() => {
  hits = 0;
});

const opts = { token: "abc123", baseDelayMs: 5 };

test("recovers after 2 simulated network drops (3rd attempt succeeds)", async () => {
  mode = "drop2";
  const data = await fetchWithRetry<{ id: number; auth: string }[]>(base, opts);
  expect(hits).toBe(3);
  expect(data[0]?.id).toBe(1);
});

test("sends the Authorization bearer header", async () => {
  mode = "500then200";
  const data = await fetchWithRetry<{ auth: string }[]>(base, opts);
  expect(data[0]?.auth).toBe("Bearer abc123");
});

test("retries 5xx then succeeds", async () => {
  mode = "500then200";
  await fetchWithRetry(base, opts);
  expect(hits).toBe(2);
});

test("401 is NOT retried and surfaces 'Auth required'", async () => {
  mode = "always401";
  await expect(fetchWithRetry(base, opts)).rejects.toMatchObject({
    status: 401,
    message: "Auth required",
  });
  expect(hits).toBe(1);
});

test("gives up after retries are exhausted (1 + 2 attempts) on persistent 500", async () => {
  mode = "always500";
  await expect(fetchWithRetry(base, opts)).rejects.toBeInstanceOf(HttpError);
  expect(hits).toBe(3);
});

test("gives up on persistent network drops", async () => {
  mode = "alwaysDrop";
  await expect(fetchWithRetry(base, opts)).rejects.toThrow();
  expect(hits).toBe(3);
});

test("200 with an invalid JSON body is NOT retried (retrying cannot fix a bad body)", async () => {
  mode = "badJson";
  await expect(fetchWithRetry(base, opts)).rejects.toMatchObject({
    name: "InvalidResponseError",
  });
  expect(hits).toBe(1);
});
