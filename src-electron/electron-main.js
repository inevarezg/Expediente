// import { app, BrowserWindow } from 'electron'
// import path from 'path'
// import { fileURLToPath } from 'url'

// process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// const __dirname = path.dirname(fileURLToPath(import.meta.url))

// let mainWindow

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1000,
//     height: 600,
//     useContentSize: true,
//     webPreferences: {
//       contextIsolation: true,
//       nodeIntegration: false,
//       enableRemoteModule: true,
//     },
//   })

//   if (process.env.MODE === 'electron') {
//     if (process.env.NODE_ENV === 'development') {
//       mainWindow.loadURL(process.env.APP_URL)
//     } else {
//       // ✅ Ruta correcta en producción
//       mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`)
//     }
//   }

//   mainWindow.on('closed', () => {
//     mainWindow = null
//   })
// }

// app.whenReady().then(() => {
//   createWindow()

//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow()
//   })
// })

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit()
// })

// src-electron/electron-main.js  (ESM - "type":"module")

// src-electron/electron-main.js  (ESM - "type": "module")
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import fsSync from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---- Usa la MISMA carpeta userData en dev y prod ----
const APP_NAME = 'expediente' // << pon el nombre de tu app
if (!app.isPackaged) {
  app.setName(APP_NAME)
  app.setPath('userData', path.join(app.getPath('appData'), APP_NAME))
}

let mainWindow = null

// -------- Persistencia SQLite (archivo binario) --------
const DB_DIR = path.join(app.getPath('userData'), 'db')
const DB_PATH = path.join(DB_DIR, 'app.sqlite')

console.log('[DB] userData:', app.getPath('userData'))
console.log('[DB] file:', DB_PATH)

async function ensureDbDir() {
  if (!fsSync.existsSync(DB_DIR)) {
    await fs.mkdir(DB_DIR, { recursive: true })
  }
}
async function readDbBytes() {
  try {
    await ensureDbDir()
    const buf = await fs.readFile(DB_PATH)
    return new Uint8Array(buf)
  } catch {
    return null
  }
}
async function writeDbBytes(bytes) {
  await ensureDbDir()
  await fs.writeFile(DB_PATH, Buffer.from(bytes))
}

// -------- Ruta del preload (dev vs build) --------
function getPreloadPath() {
  if (!app.isPackaged) {
    return path.join(__dirname, 'electron-preload.js')
  }
  // En build: lo copiamos a resources/ con extraResources
  return path.join(process.resourcesPath, 'electron-preload.js')
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.MODE === 'electron') {
    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL(process.env.APP_URL)
      // mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
      // Ajusta si tu build deja el index en otra carpeta
      const indexHtml = path.join(__dirname, 'index.html')
      mainWindow.loadURL(pathToFileURL(indexHtml).toString())
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// -------- IPC para leer/escribir BD --------
ipcMain.handle('db:read', async () => {
  const bytes = await readDbBytes()
  return bytes ? Buffer.from(bytes) : null
})
ipcMain.handle('db:write', async (_evt, buffer) => {
  await writeDbBytes(new Uint8Array(buffer))
  return true
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
