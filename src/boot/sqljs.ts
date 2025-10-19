// import { boot } from 'quasar/wrappers'
// import initSqlJs, { Database, SqlJsStatic } from 'sql.js'

// declare global {
//   interface Window {
//     dbIO?: {
//       read: () => Promise<Uint8Array | null>
//       write: (bytes: Uint8Array) => Promise<boolean>
//     }
//   }
// }

// let SQL: SqlJsStatic | null = null
// let db: Database | null = null
// let saving = false

// function resolveWasmUrl(): string {
//   const isFile = typeof window !== 'undefined' && window.location.href.startsWith('file://')
//   return isFile ? './sql-wasm.wasm' : '/sql-wasm.wasm'
// }

// async function loadSqlJs(): Promise<SqlJsStatic> {
//   return await initSqlJs({
//     locateFile: (file) => (file.endsWith('sql-wasm.wasm') ? resolveWasmUrl() : file),
//   })
// }

// // --- persistencia (inmediata) ---
// async function persistNow() {
//   if (!db || !window.dbIO || saving) return
//   try {
//     saving = true
//     const bytes = db.export()
//     await window.dbIO.write(bytes)
//   } finally {
//     saving = false
//   }
// }

// // Ejecuta DDL/DML y guarda inmediatamente
// async function execAndSave(sql: string, params?: unknown[]) {
//   if (!db) throw new Error('DB no inicializada')
//   db.run(sql, params as any)

//   const s = sql.trim().toUpperCase()
//   if (
//     s.startsWith('INSERT') ||
//     s.startsWith('UPDATE') ||
//     s.startsWith('DELETE') ||
//     s.startsWith('CREATE') ||
//     s.startsWith('ALTER') ||
//     s.startsWith('DROP') ||
//     s.startsWith('REPLACE') ||
//     s.startsWith('BEGIN') ||
//     s.startsWith('COMMIT') ||
//     s.startsWith('ROLLBACK')
//   ) {
//     await persistNow()
//   }
// }

// function selectAll<T = any>(query: string, params?: unknown[]): T[] {
//   if (!db) throw new Error('DB no inicializada')
//   const stmt = db.prepare(query)
//   const rows: T[] = []
//   try {
//     if (params) stmt.bind(params as any)
//     while (stmt.step()) rows.push(stmt.getAsObject() as T)
//   } finally {
//     stmt.free()
//   }
//   return rows
// }

// async function transaction(fn: () => void) {
//   await execAndSave('BEGIN')
//   try {
//     fn()
//     await execAndSave('COMMIT')
//   } catch (e) {
//     await execAndSave('ROLLBACK')
//     throw e
//   }
// }

// async function initDbInternal() {
//   if (!SQL) SQL = await loadSqlJs()

//   // cargar desde archivo si existe
//   let initialBytes: Uint8Array | null = null
//   if (window.dbIO) {
//     try {
//       initialBytes = await window.dbIO.read()
//     } catch (err) {
//       console.warn('[sqljs] fallo leyendo archivo persistente:', err)
//     }
//   }

//   if (initialBytes && initialBytes.length > 0) {
//     db = new SQL!.Database(initialBytes)
//   } else {
//     db = new SQL!.Database()
//     db.run(`
//       PRAGMA user_version = 1;

//       CREATE TABLE IF NOT EXISTS pacientes (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         nombre TEXT NOT NULL
//       );
//     `)
//     await persistNow()
//   }
// }

// export default boot(async ({ app }) => {
//   try {
//     await initDbInternal()

//     // Flush al cerrar / perder visibilidad
//     const flush = () => {
//       void persistNow()
//     }
//     window.addEventListener('beforeunload', flush)
//     document.addEventListener('visibilitychange', () => {
//       if (document.visibilityState !== 'visible') flush()
//     })

//     app.config.globalProperties.$sql = {
//       rawDb: () => db,
//       exec: execAndSave, // <- usa ESTE para INSERT/UPDATE/DELETE/DDL
//       selectAll,
//       transaction,
//       forceSave: persistNow, // <- úsalo si haces writes con rawDb()
//       async vacuumAndSave() {
//         if (!db) return
//         db.run('VACUUM')
//         await persistNow()
//       },
//     }

//     console.info('[sqljs] inicializada con persistencia via preload/IPC')
//   } catch (e: any) {
//     console.warn('[sqljs] no se inicializó (continúa la app):', e?.message || e)
//   }
// })

// export function getDb(): Database {
//   if (!db) throw new Error('DB no inicializada')
//   return db
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
import { boot } from 'quasar/wrappers'
import initSqlJs, { Database, SqlJsStatic } from 'sql.js'

/**
 * Config IndexedDB
 */
const IDB_NAME = 'ives-sqljs'
const IDB_STORE = 'sqlite'
const IDB_KEY = 'db.bin'

/**
 * Path del wasm (asegúrate que exista en /public)
 * /sql-wasm.wasm  ->  public/sql-wasm.wasm
 */
const SQL_WASM_URL = '/sql-wasm.wasm'

let SQL: SqlJsStatic
let db: Database | null = null
let dirty = false
let saveTimer: number | null = null

/**
 * Convierte un Uint8Array a un ArrayBuffer “clásico” (no SharedArrayBuffer)
 * para satisfacer a TypeScript y a los tipos de Blob/IDB.
 */

/**
 * Convierte un Uint8Array a un ArrayBuffer clásico (no SharedArrayBuffer),
 * evitando errores de tipos y de compatibilidad con Blob/IDB.
 */
function toClassicArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const buf = u8.buffer as ArrayBuffer | SharedArrayBuffer

  // ¿Viene de un SharedArrayBuffer? -> clonar a un nuevo ArrayBuffer
  const isSAB = typeof SharedArrayBuffer !== 'undefined' && buf instanceof SharedArrayBuffer

  if (isSAB) {
    const copy = new Uint8Array(u8.byteLength)
    copy.set(u8) // copia los bytes
    return copy.buffer // <- esto es un ArrayBuffer "normal"
  }

  // Caso normal: ArrayBuffer -> devolvemos sólo la ventana que nos interesa
  const ab = buf as ArrayBuffer
  const start = u8.byteOffset
  const end = start + u8.byteLength
  return ab.slice(start, end)
}

/* ======================== IndexedDB helpers ======================== */

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function readFromIndexedDB(): Promise<ArrayBuffer | null> {
  const idb = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly')
    const store = tx.objectStore(IDB_STORE)
    const req = store.get(IDB_KEY)
    req.onsuccess = () => {
      const val = req.result as ArrayBuffer | Uint8Array | Blob | undefined
      if (!val) return resolve(null)

      if (val instanceof Uint8Array) {
        return resolve(toClassicArrayBuffer(val))
      }
      if (val instanceof ArrayBuffer) {
        return resolve(val)
      }
      if (val && typeof (val as Blob).arrayBuffer === 'function') {
        ;(val as Blob).arrayBuffer().then(resolve).catch(reject)
        return
      }
      resolve(null)
    }
    req.onerror = () => reject(req.error)
  })
}

function saveToIndexedDB(ab: ArrayBuffer): Promise<void> {
  return openIDB().then(
    (idb) =>
      new Promise<void>((resolve, reject) => {
        const tx = idb.transaction(IDB_STORE, 'readwrite')
        const store = tx.objectStore(IDB_STORE)
        const req = store.put(ab, IDB_KEY)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      }),
  )
}

/* ======================== Persistencia ======================== */

function exportBytes(): Uint8Array {
  if (!db) throw new Error('DB not ready')
  return db.export()
}

export async function persistNow() {
  if (!db) return
  try {
    const bytes = exportBytes()
    const ab = toClassicArrayBuffer(bytes)
    await saveToIndexedDB(ab)
    dirty = false
  } catch (e) {
    console.warn('[sqljs] persist failed', e)
  }
}

/**
 * Marca la BD como “sucia” y agenda un guardado automático con debounce.
 * Llámala después de cualquier INSERT/UPDATE/DELETE.
 */
export function markDirty() {
  dirty = true
  if (saveTimer != null) return
  saveTimer = window.setTimeout(async () => {
    saveTimer = null
    await persistNow()
  }, 800)
}

/* ======================== API pública ======================== */

export function getDb(): Database {
  if (!db) throw new Error('DB not ready')
  return db
}

export async function downloadBackup(filename = 'db-backup.sqlite') {
  const bytes = exportBytes()
  const ab = toClassicArrayBuffer(bytes)
  const blob = new Blob([ab], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function uploadBackup(file: File) {
  const buf = await file.arrayBuffer()
  if (!SQL) throw new Error('SQL not loaded')
  if (db) db.close()
  db = new SQL.Database(new Uint8Array(buf))
  dirty = true
  await persistNow()
}

/* ======================== Boot ======================== */

export default boot(async () => {
  SQL = await initSqlJs({
    locateFile: () => SQL_WASM_URL,
  })

  // Carga la DB desde IndexedDB si existe
  const initial = await readFromIndexedDB()
  if (initial) {
    db = new SQL.Database(new Uint8Array(initial))
  } else {
    db = new SQL.Database()
  }

  // Guarda al salir si hay cambios pendientes (best-effort)
  window.addEventListener('beforeunload', () => {
    if (!db || !dirty) return
    try {
      const bytes = exportBytes()
      const ab = toClassicArrayBuffer(bytes)
      // fire & forget en SPA
      void saveToIndexedDB(ab)
    } catch {}
  })

  // Helpers para debug en consola
  ;(window as any).sqljs = {
    getDb,
    markDirty,
    persistNow,
    downloadBackup,
    uploadBackup,
  }
})
