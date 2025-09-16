// src/types/electron-api.d.ts
export {}

declare global {
  interface Window {
    electronAPI?: {
      loadDb: () => Promise<Uint8Array | null>
      saveDb: (bytes: Uint8Array) => Promise<boolean>
    }
    env?: {
      resourcesPath?: string
    }
    __statics?: string // 👈 Quasar expone /public aquí en Electron
  }
}
