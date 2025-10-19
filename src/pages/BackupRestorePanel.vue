<template>
  <q-card flat bordered class="q-pa-md">
    <div class="row items-center justify-between">
      <div class="text-subtitle1">Respaldo y Restauración</div>

      <div class="q-gutter-sm">
        <!-- 1) Elegir carpeta -->
        <q-btn color="secondary" icon="folder" label="Configurar carpeta" @click="chooseFolder" />

        <!-- 2) Guardar directo en carpeta configurada -->
        <q-btn
          color="primary"
          icon="save"
          :loading="saving"
          :disable="!supportedFS"
          label="Guardar respaldo en carpeta configurada"
          @click="saveToConfiguredFolder"
        />

        <!-- 3) Descargar respaldo normal -->
        <q-btn
          color="primary"
          outline
          icon="download"
          label="Descargar respaldo (.sqlite)"
          @click="onDownload"
        />

        <!-- 4) Restaurar desde archivo -->
        <q-btn
          color="orange"
          icon="upload"
          label="Restaurar desde archivo"
          @click="openFileDialog"
        />
        <input
          ref="fileInput"
          type="file"
          accept=".sqlite,application/octet-stream"
          class="hidden"
          @change="onFilePicked"
        />

        <!-- 5) Eliminar toda la base -->
        <q-btn
          color="negative"
          icon="delete_forever"
          label="Eliminar base de datos"
          @click="confirmDeleteDb"
        />
      </div>
    </div>
  </q-card>
</template>

<script>
import { getDb, downloadBackup, uploadBackup } from 'boot/sqljs'

const FS_IDB_NAME = 'ives-fs-handles'
const FS_STORE = 'handles'
const FS_KEY_DIR = 'backup-dir'

function openFSIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FS_IDB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(FS_STORE)) {
        db.createObjectStore(FS_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveDirHandle(handle) {
  const db = await openFSIDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(FS_STORE, 'readwrite')
    const store = tx.objectStore(FS_STORE)
    const req = store.put(handle, FS_KEY_DIR)
    req.onsuccess = () => res()
    req.onerror = () => rej(req.error)
  })
}

async function loadDirHandle() {
  const db = await openFSIDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(FS_STORE, 'readonly')
    const store = tx.objectStore(FS_STORE)
    const req = store.get(FS_KEY_DIR)
    req.onsuccess = () => res(req.result || null)
    req.onerror = () => rej(req.error)
  })
}

async function verifyPermission(handle, opts = { mode: 'readwrite' }) {
  if (!handle) return false
  if ((await handle.queryPermission(opts)) === 'granted') return true
  const r = await handle.requestPermission(opts)
  return r === 'granted'
}

function ts() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}${pad(d.getSeconds())}`
}

export default {
  name: 'BackupRestorePanel',
  data() {
    return {
      saving: false,
      supportedFS: !!(window.showDirectoryPicker && window.FileSystemDirectoryHandle),
      folderStatus: '',
    }
  },
  async mounted() {
    if (this.supportedFS) {
      const dir = await loadDirHandle().catch(() => null)
      if (dir) {
        try {
          const ok = await verifyPermission(dir, { mode: 'read' })
          this.folderStatus = ok ? '(permisos vigentes)' : '(requiere permiso)'
        } catch {
          this.folderStatus = '(no disponible)'
        }
      }
    }
  },
  methods: {
    async chooseFolder() {
      if (!this.supportedFS) {
        this.$q.notify({
          type: 'warning',
          message: 'Tu navegador no soporta seleccionar carpeta. Usa la descarga normal.',
        })
        return
      }
      try {
        const dir = await window.showDirectoryPicker({
          id: 'ives-backups',
          mode: 'readwrite',
          startIn: 'documents',
        })
        const ok = await verifyPermission(dir, { mode: 'readwrite' })
        if (!ok) {
          this.$q.notify({ type: 'negative', message: 'Permiso denegado para la carpeta.' })
          return
        }
        await saveDirHandle(dir)
        this.folderStatus = '(permisos vigentes)'
        this.$q.notify({
          type: 'positive',
          message: 'Carpeta configurada correctamente.',
        })
      } catch (e) {
        console.log(e)
        this.$q.notify({ type: 'warning', message: 'No se seleccionó carpeta.' })
      }
    },

    async saveToConfiguredFolder() {
      if (!this.supportedFS) {
        this.$q.notify({
          type: 'warning',
          message: 'Navegador sin soporte. Usa “Descargar respaldo”.',
        })
        return
      }
      this.saving = true
      try {
        const dir = await loadDirHandle()
        if (!dir) {
          this.$q.notify({
            type: 'warning',
            message: 'Primero configura la carpeta (elige C:\\Expediente).',
          })
          return
        }
        const ok = await verifyPermission(dir, { mode: 'readwrite' })
        if (!ok) {
          this.$q.notify({
            type: 'negative',
            message: 'Sin permisos para escribir en la carpeta configurada.',
          })
          return
        }

        const bytes = getDb().export()
        const blob = new Blob([bytes], { type: 'application/octet-stream' })
        const filename = `expediente_backup_${ts()}.sqlite`

        const fileHandle = await dir.getFileHandle(filename, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()

        this.$q.notify({ type: 'positive', message: `Respaldo guardado (${filename})` })
      } catch (e) {
        console.error(e)
        this.$q.notify({ type: 'negative', message: 'Error al guardar respaldo.' })
      } finally {
        this.saving = false
      }
    },

    async onDownload() {
      try {
        const today = new Date().toISOString().slice(0, 10)
        await downloadBackup(`expediente_backup_${today}.sqlite`)
        this.$q.notify({ type: 'positive', message: 'Respaldo descargado' })
      } catch (e) {
        console.error(e)
        this.$q.notify({ type: 'negative', message: 'No se pudo generar el respaldo' })
      }
    },

    openFileDialog() {
      this.$refs.fileInput?.click()
    },

    async onFilePicked(e) {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        await uploadBackup(file)
        this.$q.notify({
          type: 'positive',
          message: 'Base restaurada. Recargando...',
        })
        setTimeout(() => location.reload(), 600)
      } catch (err) {
        console.error(err)
        this.$q.notify({ type: 'negative', message: 'No se pudo restaurar la base' })
      } finally {
        e.target.value = ''
      }
    },

    // 🔥 NUEVO: Eliminar base de datos (con contraseña)
    confirmDeleteDb() {
      this.$q
        .dialog({
          title: 'Eliminar base de datos',
          message:
            '⚠️ Esta acción eliminará *todas las tablas y datos* del sistema. Escribe la contraseña para continuar:',
          prompt: {
            model: '',
            type: 'password',
            isValid: (val) => val.length > 0,
          },
          cancel: true,
          persistent: true,
          ok: { label: 'Eliminar', color: 'negative' },
        })
        .onOk((pass) => {
          if (pass !== 'Expediente2025') {
            this.$q.notify({ type: 'negative', message: 'Contraseña incorrecta ❌' })
            return
          }
          this.deleteAllTables()
        })
    },

    deleteAllTables() {
      try {
        const db = getDb()
        const tables = db.exec(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
        )
        const list = tables[0]?.values?.flat() || []
        list.forEach((t) => db.run(`DELETE FROM ${t}`))
        this.$q.notify({ type: 'positive', message: 'Base de datos limpiada correctamente ✅' })
      } catch (e) {
        console.error(e)
        this.$q.notify({ type: 'negative', message: 'Error al limpiar la base de datos' })
      }
    },
  },
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>
