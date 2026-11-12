// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { NativeSession } from "@osmodeck/sdk/browser";
import { ChatPicker } from "./ImportChats";

const now = Date.now();
const sessions: NativeSession[] = [
  { harness: "claude-code", id: "a", title: "osmodeck", cwd: "/Users/me/dev/aios", updatedAt: now - 60_000 },
  { harness: "claude-code", id: "b", title: "tracking", cwd: "/Users/me/dev/aios", updatedAt: now - 120_000 },
  { harness: "codex", id: "c", title: "Fix the build", cwd: "/Users/me/dev/site", updatedAt: now - 180_000 },
];

let latest = new Set<string>();
function Harness() {
  const [picked, setPicked] = useState(new Set<string>());
  const onChange = (next: Set<string>) => {
    latest = next;
    setPicked(next);
  };
  return <ChatPicker sessions={sessions} picked={picked} onChange={onChange} />;
}

afterEach(cleanup);

describe("ChatPicker", () => {
  it("lists chats by name and picks only the ticked ones", () => {
    render(<Harness />);
    expect(screen.getByText("osmodeck")).toBeTruthy();
    expect(screen.getByText("tracking")).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: "osmodeck" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "tracking" }));
    expect([...latest].sort()).toEqual(["claude-code:a", "claude-code:b"]);

    fireEvent.click(screen.getByRole("checkbox", { name: "osmodeck" }));
    expect([...latest]).toEqual(["claude-code:b"]);
  });

  it("filters by name or folder and selects only what is shown", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Search chats by name"), { target: { value: "site" } });
    expect(screen.queryByText("osmodeck")).toBeNull();
    expect(screen.getByText("Fix the build")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Select 1 shown" }));
    expect([...latest]).toEqual(["codex:c"]);
  });
});
