interface Window {
  Telegram?: {
    WebApp?: {
      ready: () => void;
      expand: () => void;
      openTelegramLink: (url: string) => void;
      initDataUnsafe?: {
        user?: {
          id: number;
          username?: string;
        }
      }
    };
  };
}
