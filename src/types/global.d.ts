interface Window {
  Telegram?: {
    WebApp?: {
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
