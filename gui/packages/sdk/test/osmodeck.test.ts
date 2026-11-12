import { expect, it } from "vitest";
import { createBbSdk } from "../src/core.js";
import { createHttpTransport } from "../src/transport-http.js";

it("exposes account status, sign-in, cancellation and local logout over the same API", async () => {
  const calls: { path: string; method: string; body: unknown }[] = [];
  const sdk = createBbSdk({ transport: createHttpTransport({ runtime: "node", baseUrl: "http://localhost:1234", fetch: async (input, init) => {
    calls.push({ path: new URL(String(input)).pathname, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null });
    return Response.json(calls.length === 1 ? { account: null, ready: false } : calls.length === 2 ? { url: "https://www.cloudroom.dev/desktop" } : { ok: true });
  } }) });
  expect(await sdk.osmodeck.status()).toEqual({ account: null, ready: false });
  expect(await sdk.osmodeck.signIn()).toEqual({ url: "https://www.cloudroom.dev/desktop" });
  await sdk.osmodeck.cancel(); await sdk.osmodeck.logout();
  await sdk.osmodeck.retryStart("thread");
  await sdk.osmodeck.threadWorkspace("thread");
  await sdk.osmodeck.cursorAuth();
  await sdk.osmodeck.cursorLogin("cursor-login");
  await sdk.osmodeck.cancelCursorLogin("cursor-login");
  await sdk.osmodeck.cursorApiKey("cursor-key", "synthetic-key");
  expect(calls).toEqual([
    { path: "/api/v1/osmodeck/account", method: "GET", body: null },
    { path: "/api/v1/osmodeck/account/sign-in", method: "POST", body: {} },
    { path: "/api/v1/osmodeck/account/cancel", method: "POST", body: {} },
    { path: "/api/v1/osmodeck/account/logout", method: "POST", body: {} },
    { path: "/api/v1/osmodeck/threads/thread/retry-start", method: "POST", body: {} },
    { path: "/api/v1/osmodeck/threads/thread/workspace", method: "GET", body: null },
    { path: "/api/v1/osmodeck/account/cursor", method: "GET", body: null },
    { path: "/api/v1/osmodeck/account/cursor/login", method: "POST", body: { requestId: "cursor-login" } },
    { path: "/api/v1/osmodeck/account/cursor/cancel", method: "POST", body: { requestId: "cursor-login" } },
    { path: "/api/v1/osmodeck/account/cursor/key", method: "POST", body: { requestId: "cursor-key", apiKey: "synthetic-key" } },
  ]);
});
