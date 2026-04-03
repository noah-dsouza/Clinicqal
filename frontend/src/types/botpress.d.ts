export {};

declare global {
  interface BotpressWebChat {
    open: () => void;
    close: () => void;
    sendEvent?: (event: {
      type: string;
      payload?: unknown;
      text?: string;
      channel?: string;
    }) => void;
  }

  interface Window {
    botpressWebChat?: BotpressWebChat;
  }
}
