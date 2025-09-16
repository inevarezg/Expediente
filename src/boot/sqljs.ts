// // src/boot/sqljs.ts
// import initSqlJs from 'sql.js'

// let SQL: any
// let db: any

// export default async () => {
//   try {
//     await initDb()
//   } catch (e) {
//     console.warn('[sqljs] no se inicializó (continúa la app):', e?.message || e)
//   }
// }

// export async function initDb() {
//   if (!SQL) {
//     const isElectron = navigator.userAgent.toLowerCase().includes('electron')
//     const isProd = import.meta.env.MODE === 'production'

//     let wasmUrl = ''

//     if (isElectron && isProd) {
//       // Accede desde ruta relativa en producción (archivo incluido como recurso extra)
//       wasmUrl = './sql-wasm.wasm'
//     } else {
//       // Dev (Quasar sirve desde public/)
//       const base =
//         typeof window !== 'undefined' && window.__statics
//           ? window.__statics
//           : window.location.origin
//       wasmUrl = `${base}/sql-wasm.wasm`
//     }

//     console.log('[sqljs] usando wasm desde:', wasmUrl)

//     SQL = await initSqlJs({
//       locateFile: () => wasmUrl,
//     })
//   }

//   db = new SQL.Database()

//   db.run(`
//     CREATE TABLE IF NOT EXISTS pacientes (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       nombre TEXT NOT NULL
//     );
//   `)

//   return db
// }

// export function getDb() {
//   if (!db) throw new Error('DB no inicializada')
//   return db
// }

// src/boot/sqljs.ts
import { boot } from 'quasar/wrappers'
import initSqlJs, { Database, SqlJsStatic } from 'sql.js'

declare global {
  interface Window {
    dbIO?: {
      read: () => Promise<Uint8Array | null>
      write: (bytes: Uint8Array) => Promise<boolean>
    }
  }
}

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let saving = false

function resolveWasmUrl(): string {
  const isFile = typeof window !== 'undefined' && window.location.href.startsWith('file://')
  return isFile ? './sql-wasm.wasm' : '/sql-wasm.wasm'
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  return await initSqlJs({
    locateFile: (file) => (file.endsWith('sql-wasm.wasm') ? resolveWasmUrl() : file),
  })
}

// --- persistencia (inmediata) ---
async function persistNow() {
  if (!db || !window.dbIO || saving) return
  try {
    saving = true
    const bytes = db.export()
    await window.dbIO.write(bytes)
  } finally {
    saving = false
  }
}

// Ejecuta DDL/DML y guarda inmediatamente
async function execAndSave(sql: string, params?: unknown[]) {
  if (!db) throw new Error('DB no inicializada')
  db.run(sql, params as any)

  const s = sql.trim().toUpperCase()
  if (
    s.startsWith('INSERT') ||
    s.startsWith('UPDATE') ||
    s.startsWith('DELETE') ||
    s.startsWith('CREATE') ||
    s.startsWith('ALTER') ||
    s.startsWith('DROP') ||
    s.startsWith('REPLACE') ||
    s.startsWith('BEGIN') ||
    s.startsWith('COMMIT') ||
    s.startsWith('ROLLBACK')
  ) {
    await persistNow()
  }
}

function selectAll<T = any>(query: string, params?: unknown[]): T[] {
  if (!db) throw new Error('DB no inicializada')
  const stmt = db.prepare(query)
  const rows: T[] = []
  try {
    if (params) stmt.bind(params as any)
    while (stmt.step()) rows.push(stmt.getAsObject() as T)
  } finally {
    stmt.free()
  }
  return rows
}

async function transaction(fn: () => void) {
  await execAndSave('BEGIN')
  try {
    fn()
    await execAndSave('COMMIT')
  } catch (e) {
    await execAndSave('ROLLBACK')
    throw e
  }
}

async function initDbInternal() {
  if (!SQL) SQL = await loadSqlJs()

  // cargar desde archivo si existe
  let initialBytes: Uint8Array | null = null
  if (window.dbIO) {
    try {
      initialBytes = await window.dbIO.read()
    } catch (err) {
      console.warn('[sqljs] fallo leyendo archivo persistente:', err)
    }
  }

  if (initialBytes && initialBytes.length > 0) {
    db = new SQL!.Database(initialBytes)
  } else {
    db = new SQL!.Database()
    db.run(`
      PRAGMA user_version = 1;

      CREATE TABLE IF NOT EXISTS pacientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL
      );
    `)
    await persistNow()
  }
}

export default boot(async ({ app }) => {
  try {
    await initDbInternal()

    // Flush al cerrar / perder visibilidad
    const flush = () => {
      void persistNow()
    }
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') flush()
    })

    app.config.globalProperties.$sql = {
      rawDb: () => db,
      exec: execAndSave, // <- usa ESTE para INSERT/UPDATE/DELETE/DDL
      selectAll,
      transaction,
      forceSave: persistNow, // <- úsalo si haces writes con rawDb()
      async vacuumAndSave() {
        if (!db) return
        db.run('VACUUM')
        await persistNow()
      },
    }

    console.info('[sqljs] inicializada con persistencia via preload/IPC')
  } catch (e: any) {
    console.warn('[sqljs] no se inicializó (continúa la app):', e?.message || e)
  }
})

export function getDb(): Database {
  if (!db) throw new Error('DB no inicializada')
  return db
}
