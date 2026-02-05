/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOEX_API_BASE_URL: string
  readonly VITE_MOEX_API_KEY?: string
  readonly VITE_MOEX_API_SECRET?: string
  readonly VITE_API_RATE_LIMIT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
