/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BRAND?: string;
    readonly VITE_PRIMARY_COLOR?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
