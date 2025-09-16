// src-electron/electron-preload.cjs  (CommonJS)

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('dbIO', {
  async read() {
    const result = await ipcRenderer.invoke('db:read')
    if (!result) return null
    // Buffer -> Uint8Array (sin copiar)
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength)
  },
  async write(bytes) {
    // Uint8Array -> Buffer (sin copiar)
    const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    await ipcRenderer.invoke('db:write', buffer)
    return true
  },
})
