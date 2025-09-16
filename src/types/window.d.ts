export {}

declare global {
  interface Window {
    __resources?: {
      wasmPath: string
    }
  }
}
