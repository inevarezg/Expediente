<template>
  <q-header elevated>
    <q-toolbar style="background-color: #c4b193">
      <div class="col-12 flex justify-end">
        <q-btn
          flat
          style="color: black; margin: 2px"
          icon="arrow_back"
          label="Salir"
          @click="$router.push('/')"
        />
        <q-space />
        <q-btn
          icon="history"
          style="color: #1976d2; background-color: white; margin: 2px"
          label="Cargar última receta"
          @click="loadLastRecipe"
        />
        <q-btn
          icon="save"
          label="Guardar receta"
          style="color: #1976d2; background-color: white; margin: 2px"
          :loading="loading"
          @click="confirmAndSave"
        />
        <q-btn
          icon="print"
          label="Imprimir receta"
          style="color: #1976d2; background-color: white; margin: 2px"
          :loading="loading"
          @click="saveAndPrint"
        />
        <q-btn
          icon="assignment"
          label="Imprimir rutina"
          style="color: #1976d2; background-color: white; margin: 2px"
          :loading="loading"
          @click="printRoutine"
        />
      </div>
    </q-toolbar>
  </q-header>

  <q-page class="q-pa-md bg-grey-1">
    <!-- Datos del paciente -->
    <q-card flat bordered class="q-pa-md q-mb-md no-print">
      <div class="row q-col-gutter-md">
        <div class="col-6">
          <q-input v-model="header.paciente" label="Paciente" outlined dense readonly />
        </div>
        <div class="col-2">
          <q-input v-model="header.edad" label="Edad" outlined dense suffix="años" readonly />
        </div>
        <div class="col-4">
          <q-input v-model="header.fecha" label="Fecha" outlined dense mask="####-##-##">
            <template #append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-date v-model="header.fecha" mask="YYYY-MM-DD" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
      </div>
    </q-card>

    <!-- Formulario medicamentos -->
    <q-card flat bordered class="q-pa-md q-mb-lg no-print">
      <div class="text-subtitle1 q-mb-sm">Medicamentos</div>

      <div
        v-for="(line, idx) in lines"
        :key="line.uid"
        class="row q-col-gutter-md items-start q-mb-sm"
      >
        <div class="col-6 relative">
          <input
            v-model="line.medicamento"
            type="text"
            class="custom-input"
            placeholder="Medicamento"
            @focus="showAll(line)"
            @input="filterOptions(line)"
            @blur="hideLater(line)"
          />
          <div v-if="line.showList" class="suggest-box">
            <div
              v-for="opt in line.filtered"
              :key="opt.name"
              class="suggest-item"
              @mousedown.prevent="selectOption(line, opt.name)"
            >
              {{ opt.name }}
            </div>
          </div>
        </div>

        <div class="col-6">
          <q-input v-model="line.indicaciones" dense outlined label="Indicaciones" />
        </div>

        <div class="col-12 text-right">
          <q-btn flat dense color="negative" icon="close" @click="removeLine(idx)" />
        </div>
      </div>

      <q-btn color="primary" outline icon="add" label="Agregar otra línea" @click="addLine" />

      <!-- Campo de comentarios -->
      <div class="q-mt-md">
        <q-input
          v-model="notes"
          type="textarea"
          outlined
          label="Anotaciones / Comentarios"
          rows="4"
          placeholder="Ej. observaciones adicionales del tratamiento"
        />
      </div>
    </q-card>

    <!-- Vista previa fija en hoja -->
    <!-- 🔹 Vista previa (reactiva y fija sobre la hoja) -->
    <div class="print-wrapper">
      <div id="recipe-sheet" class="sheet" style="position: relative">
        <!-- Aquí simula el fondo del papel -->
        <div class="overlay">
          <!-- Lista dentro del área fija -->
          <div
            class="ov-lista"
            style="
              position: absolute;
              left: 1.3in;
              top: 2.2in;
              width: 6in;
              font:
                16px/1.4 'Segoe UI',
                Arial;
              color: #3b2a26;
            "
          >
            <!-- Medicamentos -->
            <div
              v-for="(line, i) in lines.filter((f) => f.medicamento || f.indicaciones)"
              :key="`p${i}-${line.uid}`"
              class="ov-item"
            >
              <b>{{ line.medicamento || '—' }}</b>
              <span v-if="line.indicaciones"> — {{ line.indicaciones }}</span>
            </div>

            <!-- Comentarios -->
            <div v-if="notes" style="margin-top: 10px; font-size: 14px; white-space: pre-line">
              {{ notes }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Diálogo rutina -->
    <q-dialog v-model="showRoutineDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="text-h6">Seleccionar rutina</q-card-section>
        <q-card-section>
          <q-select
            v-model="selectedRoutineId"
            :options="routineOptions"
            option-label="label"
            option-value="id"
            label="Rutina registrada"
            outlined
            dense
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="negative" v-close-popup />
          <q-btn flat label="Imprimir" color="primary" @click="printSelectedRoutine" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { uid } from 'quasar'
import { getDb } from 'boot/sqljs'

export default {
  name: 'RecetaPage',
  props: { pacienteId: [String, Number], consultaId: [String, Number] },
  data() {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`
    return {
      loading: false,
      consulTID: this.consultaId,
      header: { paciente: '', edad: '', fecha: today, nacimiento: '' },
      lines: [{ uid: uid(), medicamento: '', indicaciones: '', showList: false, filtered: [] }],
      allMedicines: [],
      notes: '',
      showRoutineDialog: false,
      routineOptions: [],
      selectedRoutineId: null,
    }
  },
  mounted() {
    this.ensureTables()
    this.loadPatientHeader()
    this.loadMedicines()
  },
  methods: {
    ensureTables() {
      const db = getDb()
      db.run(`
        CREATE TABLE IF NOT EXISTS recetas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          paciente_id INTEGER,
          consulta_id INTEGER,
          paciente_nombre TEXT,
          edad TEXT,
          fecha TEXT,
          items TEXT,
          notas TEXT,
          created_at TEXT DEFAULT (datetime('now','localtime'))
        );
      `)
    },

    loadPatientHeader() {
      const id = this.pacienteId ?? this.$route.params.pacienteId
      if (!id) return
      const db = getDb()
      const st = db.prepare(`SELECT nombre, fecha_nacimiento FROM pacientes WHERE id = ? LIMIT 1`)
      st.bind([id])
      const row = st.step() ? st.getAsObject() : null
      st.free()
      if (row) {
        this.header.paciente = row.nombre || ''
        this.header.nacimiento = row.fecha_nacimiento || ''
        this.header.edad = this.calcAge(this.header.nacimiento)
      }
    },

    calcAge(date) {
      if (!date) return ''
      const [y, m, d] = date.split('-').map(Number)
      const birth = new Date(y, m - 1, d)
      const t = new Date()
      let a = t.getFullYear() - birth.getFullYear()
      const mm = t.getMonth() - birth.getMonth()
      if (mm < 0 || (mm === 0 && t.getDate() < birth.getDate())) a--
      return a
    },

    loadMedicines() {
      const db = getDb()
      const st =
        db.prepare(`SELECT TRIM(name || CASE WHEN COALESCE(dose,'')='' THEN '' ELSE ' (' || dose || ')' END) AS name
    FROM medicamentos
    ORDER BY name ASC`)
      const arr = []
      while (st.step()) arr.push(st.getAsObject())
      st.free()
      this.allMedicines = arr
    },

    showAll(line) {
      line.filtered = this.allMedicines
      line.showList = true
    },
    hideLater(line) {
      setTimeout(() => (line.showList = false), 150)
    },
    filterOptions(line) {
      const val = (line.medicamento || '').toLowerCase().trim()
      line.filtered = !val
        ? this.allMedicines
        : this.allMedicines.filter((m) => m.name.toLowerCase().includes(val))
      line.showList = true
    },
    selectOption(line, name) {
      line.medicamento = name
      line.showList = false
    },

    addLine() {
      this.lines.push({
        uid: uid(),
        medicamento: '',
        indicaciones: '',
        showList: false,
        filtered: [],
      })
    },
    removeLine(i) {
      this.lines.splice(i, 1)
      if (!this.lines.length) this.addLine()
    },

    confirmAndSave() {
      console.log(this.$route.params.consultaId, 'dmmm')

      this.$q
        .dialog({
          title: 'Guardar receta',
          message: '¿Deseas guardar esta receta?',
          cancel: true,
          persistent: true,
          ok: { label: 'Sí, guardar', color: 'primary' },
        })
        .onOk(() => this.saveRecipe())
    },

    saveRecipe() {
      const valid = this.lines.filter((l) => l.medicamento.trim() || l.indicaciones.trim())
      if (!valid.length) {
        this.$q.notify({ type: 'warning', message: 'Agrega al menos un medicamento' })
        return
      }

      const db = getDb()
      const st = db.prepare(`
    INSERT INTO recetas (paciente_id, consulta_id, paciente_nombre, edad, fecha, items, notas)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
      st.run([
        this.pacienteId || this.$route.params.pacienteId || null,
        this.$route.params.consultaId,
        this.header.paciente,
        this.header.edad,
        this.header.fecha,
        JSON.stringify(valid),
        this.notes,
      ])
      st.free()

      this.$q.notify({ type: 'positive', message: 'Receta guardada correctamente' })

      // 🔹 Limpia los inputs después de guardar
      this.resetForm()
    },

    resetForm() {
      this.lines = [
        { uid: uid(), medicamento: '', indicaciones: '', showList: false, filtered: [] },
      ]
      this.notes = ''
    },
    loadLastRecipe() {
      const db = getDb()
      const id = this.pacienteId || this.$route.params.pacienteId
      if (!id) return
      const st = db.prepare(`
        SELECT items, fecha, created_at, notas
        FROM recetas
        WHERE paciente_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `)
      st.bind([id])
      const row = st.step() ? st.getAsObject() : null
      st.free()

      if (row) {
        const items = JSON.parse(row.items || '[]')
        this.lines = items.map((it) => ({
          uid: uid(),
          medicamento: it.medicamento || '',
          indicaciones: it.indicaciones || '',
          showList: false,
          filtered: [],
        }))
        this.header.fecha = row.fecha
        this.notes = row.notas || ''
        this.$q.notify({
          type: 'info',
          message: `Última receta cargada (${row.fecha})`,
        })
      } else {
        this.$q.notify({ type: 'warning', message: 'No se encontró ninguna receta previa' })
      }
    },

    saveAndPrint() {
      this.$nextTick(() => this.printExact())
    },

    printExact() {
      const sheet = document.getElementById('recipe-sheet')
      if (!sheet) return
      const frame = document.createElement('iframe')
      frame.style.position = 'fixed'
      frame.style.width = '0'
      frame.style.height = '0'
      document.body.appendChild(frame)
      const css = `
        @page{size:8.4in 5.5in;margin:0;}
        html,body{margin:0;padding:0;}
        .sheet{position:relative;width:8.5in;height:5.5in;}
        .ov-lista{position:absolute;left:1.3in;top:2.2in;width:6in;font:16px/1.4 Segoe UI,Arial;color:#3b2a26;}
        .ov-item{margin-bottom:3px;}
      `
      const doc = frame.contentDocument
      doc.open()
      doc.write(
        `<!DOCTYPE html><html><head><style>${css}</style></head><body>${sheet.outerHTML}</body></html>`,
      )
      doc.close()
      frame.contentWindow.focus()
      frame.contentWindow.print()
      setTimeout(() => document.body.removeChild(frame), 800)
    },

    printRoutine() {
      this.loadRoutines()
    },
    loadRoutines() {
      const db = getDb()
      const idConsulta = this.consultaId || this.$route.params.consultaId
      if (!idConsulta) {
        this.$q.notify({ type: 'warning', message: 'No hay consulta activa' })
        return
      }

      const st = db.prepare(`
        SELECT id, created_at
        FROM seguimientos
        WHERE consulta_id = ?
        ORDER BY id DESC
      `)
      st.bind([idConsulta])
      const arr = []
      while (st.step()) {
        const r = st.getAsObject()
        arr.push({
          id: r.id,
          label: `Rutina #${r.id} — ${r.created_at}`,
        })
      }
      st.free()
      this.routineOptions = arr
      if (arr.length === 1) {
        this.selectedRoutineId = arr[0].id
        this.printSelectedRoutine()
      } else if (arr.length > 1) {
        this.showRoutineDialog = true
      } else {
        this.$q.notify({ type: 'warning', message: 'No hay rutinas registradas' })
      }
    },
    printSelectedRoutine() {
      if (!this.selectedRoutineId) return
      const db = getDb()
      const st = db.prepare(`
    SELECT exploracion, rutina_dia, rutina_noche, tratamiento
    FROM seguimientos
    WHERE id = ?
    LIMIT 1
  `)
      st.bind([this.selectedRoutineId])
      const row = st.step() ? st.getAsObject() : null
      st.free()

      if (!row) {
        this.$q.notify({ type: 'warning', message: 'No se encontró la rutina seleccionada' })
        return
      }

      const content = `
  <div style="
    font-family:'Segoe UI',Arial;
    color:#2b2b2b;
    font-size:14px;
    width:100%;
    max-width:750px;
    margin:60px auto;
    padding:30px 40px;
    border:2px solid #ccc;
    border-radius:10px;
    box-shadow:0 0 10px rgba(0,0,0,0.08);
    box-sizing:border-box;
  ">
    <h2 style="
      text-align:center;
      letter-spacing:3px;
      margin-top:0;
      margin-bottom:25px;
      font-size:20px;
    ">
      R U T I N A
    </h2>

    <div style="
      border:1px solid #ddd;
      border-radius:8px;
      padding:15px 20px;
      margin-bottom:20px;
      background:#fafafa;
    ">
      <p><b>Paciente:</b> ${this.header.paciente}</p>
      <p><b>Edad:</b> ${this.header.edad} años</p>
      <p><b>Fecha:</b> ${this.header.fecha}</p>
    </div>

    <table style="
      width:100%;
      border-collapse:collapse;
      text-align:center;
      margin-bottom:25px;
      border:1px solid #ddd;
    ">
      <thead style="background:#f3f3f3;">
        <tr>
          <th style="padding:10px;font-weight:bold;border-right:1px solid #ddd;">DÍA</th>
          <th style="padding:10px;font-weight:bold;">NOCHE</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="vertical-align:top;padding:10px 15px;width:50%;border-top:1px solid #ddd;border-right:1px solid #ddd;white-space:pre-line;">
            ${row.rutina_dia || '—'}
          </td>
          <td style="vertical-align:top;padding:10px 15px;width:50%;border-top:1px solid #ddd;white-space:pre-line;">
            ${row.rutina_noche || '—'}
          </td>
        </tr>
      </tbody>
    </table>

    <div style="border-top:2px solid #ddd;padding-top:15px;">
      <p style="font-weight:bold;letter-spacing:1px;margin-bottom:8px;">TRATAMIENTO:</p>
      <div style="white-space:pre-line;">${row.tratamiento || '—'}</div>
    </div>


  </div>
`

      const frame = document.createElement('iframe')
      frame.style.position = 'fixed'
      frame.style.width = '0'
      frame.style.height = '0'
      document.body.appendChild(frame)
      const doc = frame.contentDocument
      doc.open()
      doc.write(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Rutina</title>
      <style>
        @page { size: A4; margin: 25mm; }
        body { margin: 0; padding: 0; }
      </style>
    </head>
    <body>${content}</body>
  </html>
`)
      doc.close()
      frame.contentWindow.focus()
      frame.contentWindow.print()
      setTimeout(() => document.body.removeChild(frame), 800)
    },
  },
}
</script>

<style scoped>
.relative {
  position: relative;
}
.custom-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
.custom-input:focus {
  outline: none;
  border-color: #1976d2;
}
.suggest-box {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}
.suggest-item {
  padding: 6px 10px;
  cursor: pointer;
}
.suggest-item:hover {
  background: #f2f2f2;
}
.print-wrapper {
  display: flex;
  justify-content: center;
}
.sheet {
  width: 820px;
  height: 555px;
  background: #fff;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.1);
}
.ov-lista {
  position: absolute;
  left: 450px;
  top: 600px;
  width: 640px;
}
.ov-item {
  margin-bottom: 4px;
}
</style>
