/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_DEV_SERVER_URL?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_SUPERADMIN_DEMO_EMAIL?: string;
  readonly VITE_SUPERADMIN_DEMO_PASSWORD?: string;
  readonly VITE_SUPERADMIN_DEMO_ROLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
