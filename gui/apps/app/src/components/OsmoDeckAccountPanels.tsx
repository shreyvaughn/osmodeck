import { useEffect, useRef } from "react";
import { useOsmoDeckAccount } from "@/hooks/queries/osmodeck-queries";
import { getBbDesktopInfo } from "@/lib/bb-desktop";
import { CodexConnectionPanel, CursorConnectionPanel } from "./CodexConnectionPanel";

export function OsmoDeckAccountPanels() {
  const status = useOsmoDeckAccount();
  const signingIn = status.data?.signingIn;
  const accountId = status.data?.account?.id;
  const wasSigningIn = useRef(false);
  // Bring the app back in front of the browser once sign-in finishes there.
  useEffect(() => {
    if (signingIn) wasSigningIn.current = true;
    else if (wasSigningIn.current && accountId) {
      wasSigningIn.current = false;
      getBbDesktopInfo()?.focusWindow?.();
    }
  }, [signingIn, accountId]);
  if (!accountId) return null;
  return <><CodexConnectionPanel /><CursorConnectionPanel /></>;
}
