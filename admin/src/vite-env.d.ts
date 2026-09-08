/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_LANDING_URL?: string;
  readonly VITE_DEV_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
