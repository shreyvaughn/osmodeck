import type { BbDesktopApi } from "@osmodeck/desktop-contract";

declare global {
  interface Window {
    bbDesktop?: BbDesktopApi;
  }
}

export {};
