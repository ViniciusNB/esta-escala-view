/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_KEY: string
  // adicione outras variáveis se necessário
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}