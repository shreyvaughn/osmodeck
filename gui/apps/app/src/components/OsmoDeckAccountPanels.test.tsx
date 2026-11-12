// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { sdk } from "@/lib/sdk";
import { OsmoDeckAccountPanels } from "./OsmoDeckAccountPanels";

vi.mock("@/lib/sdk", () => ({ sdk: { osmodeck: { status: vi.fn() } } }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it("never blocks the app for users without a OsmoDeck account", async () => {
  const status = vi.mocked(sdk.osmodeck.status).mockResolvedValue({
    ready: false, account: null, projectId: null, repository: null, model: null,
    error: null, signingIn: false, signInError: null,
  } as never);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <OsmoDeckAccountPanels />
    </QueryClientProvider>,
  );
  await vi.waitFor(() => expect(status).toHaveBeenCalled());
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.querySelector("[data-persistent-drawer-backdrop]")).toBeNull();
});
