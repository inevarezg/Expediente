<template>
  <q-header elevated>
    <q-toolbar style="background-color: #c4b193">
      <div class="col-12 flex justify-end">
        <q-btn
          label="Regresar"
          style="color: #1976d2; background-color: white; margin: 2px"
          @click="cancel"
        />
        <q-btn
          icon="print"
          label="Imprimir"
          style="color: #1976d2; background-color: white; margin: 2px"
          :disable="!selectedPatientId"
          @click="printAll"
        />
        <q-btn
          label="Nuevo seguimiento"
          style="color: #1976d2; background-color: white; margin: 2px"
          :disable="!selectedPatientId"
          @click="goSeguimiento"
        />
      </div>
    </q-toolbar>
  </q-header>

  <q-page class="q-pa-lg ives-bg">
    <div class="ives-sheet">
      <div class="ives-logo-wrap">
        <img :src="logo" class="ives-logo" alt="IVES" />
      </div>

      <h2 class="ives-h2">HISTORIAL DE EXPEDIENTE</h2>

      <q-card flat bordered class="q-pa-md q-mb-lg">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12">
            <q-select
              v-model="selectedPatientId"
              label="Selecciona paciente"
              use-input
              input-debounce="300"
              :options="patientOptions"
              option-label="label"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              @filter="filterPatients"
              @update:model-value="loadAll"
            />
          </div>
        </div>
      </q-card>

      <q-inner-loading :showing="loading">
        <q-spinner size="30px" />
      </q-inner-loading>

      <div v-if="!loading && selectedPatientId && patient">
        <!-- HOJA INICIAL -->
        <h3 class="ives-h3">HOJA INICIAL</h3>
        <div class="ives-table ives-grid">
          <div class="ives-cell" v-for="(v, label) in patientDataMap" :key="label">
            <span class="lbl">{{ label }}</span>
            <div class="val">{{ v }}</div>
          </div>
        </div>

        <div class="q-mb-md">
          <h4 class="ives-sub">MOTIVO DE CONSULTA</h4>
          <div class="ives-textblock">{{ primeraConsulta?.motivo || '—' }}</div>
        </div>

        <div class="q-mb-lg">
          <h4 class="ives-sub">SIGNOS</h4>
          <div class="ives-table ives-grid">
            <div v-for="(v, label) in signosDataMap" :key="label" class="ives-cell">
              <span class="lbl">{{ label }}</span>
              <div class="val">{{ v }}</div>
            </div>
          </div>
        </div>

        <!-- SEGUIMIENTOS -->
        <h3 class="ives-h3">SEGUIMIENTOS</h3>
        <div v-if="seguimientos.length === 0" class="text-grey q-mt-sm">
          Aún no hay seguimientos.
        </div>

        <div v-else class="q-mt-md">
          <div class="row items-center q-gutter-md q-mb-sm">
            <div class="col">
              <q-btn
                dense
                round
                icon="chevron_left"
                @click="prevSlide"
                :disable="activeIdxNum <= 0"
              />
              <q-btn
                dense
                round
                icon="chevron_right"
                @click="nextSlide"
                :disable="activeIdxNum >= seguimientos.length - 1"
                class="q-ml-sm"
              />
              <span class="q-ml-md text-grey-8">
                {{
                  formatDate(
                    seguimientos[activeIdxNum]?.fecha || seguimientos[activeIdxNum]?.created_at,
                  )
                }}
                ({{ activeIdxNum + 1 }} / {{ seguimientos.length }})
              </span>
            </div>
          </div>

          <q-carousel
            v-model="activeSlide"
            swipeable
            animated
            control-color="primary"
            height="auto"
            class="bg-transparent text-dark no-box-shadow"
          >
            <q-carousel-slide
              v-for="(seg, i) in seguimientos"
              :key="seg.id"
              :name="String(i)"
              class="q-pa-none"
            >
              <div class="q-mb-md text-weight-medium">
                Fecha: {{ formatDate(seg.fecha || seg.created_at) }}
              </div>

              <div class="q-mb-md">
                <h4 class="ives-sub">EXPLORACIÓN</h4>
                <div class="q-gutter-sm">
                  <q-chip v-for="c in seg.explChecks" :key="c" outline>{{
                    mapExploracion(c)
                  }}</q-chip>
                </div>
                <div v-if="seg.explOtro" class="q-mt-xs text-italic">Otro: {{ seg.explOtro }}</div>
              </div>

              <div class="q-mb-md">
                <h4 class="ives-sub">RUTINA</h4>
                <div class="ives-table">
                  <div class="rutina-grid">
                    <div class="rut-col">
                      <div class="rut-title">DÍA</div>
                      <div class="ives-textblock">{{ seg.rutina_dia || '—' }}</div>
                    </div>
                    <div class="rut-col">
                      <div class="rut-title">NOCHE</div>
                      <div class="ives-textblock">{{ seg.rutina_noche || '—' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="q-mb-lg">
                <h4 class="ives-sub">TRATAMIENTO</h4>
                <div class="ives-textblock">{{ seg.tratamiento || '—' }}</div>
              </div>

              <div>
                <h4 class="ives-sub">RECETAS</h4>
                <div v-if="seg.recetas.length === 0" class="text-grey-7">—</div>
                <div v-for="rec in seg.recetas" :key="rec.id" class="q-mb-md">
                  <q-card flat bordered>
                    <q-card-section class="q-pa-sm">
                      <div class="row items-center justify-between">
                        <div class="text-subtitle2">
                          Receta #{{ rec.id }} · {{ formatDate(rec.created_at || rec.fecha) }}
                        </div>
                        <q-btn
                          size="sm"
                          flat
                          icon="print"
                          label="Imprimir"
                          @click="printOneRecipe(rec, rec.notas)"
                        />
                      </div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section class="q-pa-sm">
                      <div v-for="(it, idx) in rec.items" :key="idx" class="q-py-xs">
                        <strong>{{ it.medicamento }}</strong>
                        <span v-if="it.indicaciones"> — {{ it.indicaciones }}</span>
                      </div>
                    </q-card-section>
                    <span v-if="rec.notas" style="margin: 10px"> {{ rec.notas }}</span>
                  </q-card>
                </div>
              </div>
            </q-carousel-slide>
          </q-carousel>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { getDb } from 'boot/sqljs'
import logo from 'assets/Logo_IVES-06.png'

let tablesEnsured = false

export default {
  name: 'HistorialExpedientePage',
  data() {
    return {
      logo,
      loading: false,
      selectedPatientId: null,
      patientOptions: [],
      patient: null,
      primeraConsulta: null,
      seguimientos: [],
      activeSlide: '0',
      consultasAll: [],
      recetasAll: [],
      recetasByConsulta: {},
      seguimientosByConsulta: {},
    }
  },
  computed: {
    activeIdxNum() {
      const n = parseInt(this.activeSlide, 10)
      return isNaN(n) ? 0 : n
    },
    patientDataMap() {
      if (!this.patient) return {}
      return {
        NOMBRE: this.patient.nombre || '-',
        GÉNERO: this.patient.genero || '-',
        'F. NACIMIENTO': this.patient.fecha_nacimiento || '-',
        EDAD: this.patient.edad || '-',
        DIRECCIÓN: this.patient.direccion || '-',
        'CIUDAD ORIGEN': this.patient.ciudad_origen || '-',
        PROFESIÓN: this.patient.profesion || '-',
        CELULAR: this.patient.celular || '-',
        CREADO: this.formatDate(this.patient.created_at),
      }
    },
    signosDataMap() {
      if (!this.primeraConsulta) return {}
      return {
        PESO: this.primeraConsulta.signos_peso || '-',
        ESTATURA: this.primeraConsulta.signos_estatura || '-',
        IMC: this.primeraConsulta.signos_imc || '-',
        'T/A': this.primeraConsulta.signos_ta || '-',
        FC: this.primeraConsulta.signos_fc || '-',
        TEMP: this.primeraConsulta.signos_temp || '-',
      }
    },
  },
  mounted() {
    this.ensureTables()
    this.filterPatients('', () => {})
  },
  methods: {
    goSeguimiento() {
      this.$router.push({ name: 'Seguimiento', params: { pacienteId: this.selectedPatientId } })
    },
    today() {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    formatDate(dt) {
      if (!dt) return '—'
      return new Date(dt).toLocaleDateString('es-MX')
    },
    ensureTables() {
      if (tablesEnsured) return
      tablesEnsured = true
      const db = getDb()
      db.run(
        `CREATE TABLE IF NOT EXISTS pacientes (id INTEGER PRIMARY KEY AUTOINCREMENT,nombre TEXT NOT NULL, genero TEXT, fecha_nacimiento TEXT, edad TEXT,direccion TEXT, ciudad_origen TEXT, profesion TEXT, celular TEXT,email TEXT, alergias TEXT, antecedentes TEXT,created_at TEXT DEFAULT (datetime('now')));`,
      )
      db.run(
        `CREATE TABLE IF NOT EXISTS consultas (id INTEGER PRIMARY KEY AUTOINCREMENT,paciente_id INTEGER NOT NULL,fecha TEXT DEFAULT (datetime('now')),tipo TEXT, motivo TEXT,signos_peso TEXT, signos_ta TEXT, signos_fc TEXT, signos_temp TEXT, signos_estatura TEXT, signos_imc TEXT,detalles TEXT);`,
      )
      db.run(
        `CREATE TABLE IF NOT EXISTS seguimientos (id INTEGER PRIMARY KEY AUTOINCREMENT,consulta_id INTEGER NOT NULL,exploracion TEXT,rutina_dia TEXT,rutina_noche TEXT,tratamiento TEXT,created_at TEXT DEFAULT (datetime('now')));`,
      )
      db.run(
        `CREATE TABLE IF NOT EXISTS recetas (id INTEGER PRIMARY KEY AUTOINCREMENT,paciente_id INTEGER NOT NULL,consulta_id INTEGER,paciente_nombre TEXT,edad TEXT,fecha TEXT DEFAULT (datetime('now')),items TEXT,created_at TEXT DEFAULT (datetime('now')));`,
      )
      db.run(
        `CREATE TABLE IF NOT EXISTS receta_items (id INTEGER PRIMARY KEY AUTOINCREMENT,receta_id INTEGER NOT NULL,medicamento TEXT NOT NULL,indicaciones TEXT);`,
      )
    },
    qAll(sql, params = []) {
      const db = getDb()
      const s = db.prepare(sql)
      s.bind(params)
      const rows = []
      while (s.step()) rows.push(s.getAsObject())
      s.free()
      return rows
    },
    q1(sql, params = []) {
      const db = getDb()
      const s = db.prepare(sql)
      s.bind(params)
      const row = s.step() ? s.getAsObject() : null
      s.free()
      return row
    },
    filterPatients(val, update) {
      update(() => {
        const like = `%${(val || '').trim()}%`
        const rows = this.qAll(
          `SELECT id,(nombre || CASE WHEN genero IS NOT NULL AND genero<>'' THEN ' ('||genero||')' ELSE '' END) AS label
           FROM pacientes
           WHERE nombre LIKE ? OR genero LIKE ? OR ciudad_origen LIKE ? OR profesion LIKE ?
           ORDER BY id DESC LIMIT 100`,
          [like, like, like, like],
        )
        this.patientOptions = rows
      })
    },
    async loadAll() {
      if (!this.selectedPatientId) return
      this.loading = true
      try {
        const id = this.selectedPatientId
        this.patient = this.q1('SELECT * FROM pacientes WHERE id = ?', [id])
        this.primeraConsulta = this.q1(
          `SELECT * FROM consultas WHERE paciente_id = ? AND (tipo='primera' OR tipo IS NULL) ORDER BY id ASC LIMIT 1`,
          [id],
        )
        this.consultasAll = this.qAll(
          `SELECT * FROM consultas WHERE paciente_id = ? ORDER BY id ASC`,
          [id],
        )
        const segRows = this.qAll(
          `SELECT s.*, c.fecha FROM seguimientos s JOIN consultas c ON c.id = s.consulta_id WHERE c.paciente_id = ? ORDER BY s.id ASC`,
          [id],
        )
        const recRows = this.qAll(`SELECT * FROM recetas WHERE paciente_id = ? ORDER BY id ASC`, [
          id,
        ])
        console.log(recRows)

        const recExpanded = recRows.map((r) => {
          let items = this.qAll(
            `SELECT medicamento, indicaciones FROM receta_items WHERE receta_id = ? ORDER BY id ASC`,
            [r.id],
          )
          if (!items.length && r.items) {
            try {
              items = JSON.parse(r.items) || []
            } catch {
              items = []
            }
          }
          return { ...r, items }
        })
        console.log(recExpanded)

        this.recetasAll = recExpanded

        const recByC = {}
        recExpanded.forEach((r) => (recByC[r.consulta_id || '0'] ||= []).push(r))
        this.recetasByConsulta = recByC

        // 🔹 Empareja recetas a cada seguimiento, incluso si no tienen consulta_id

        // 🔹 Relacionar seguimientos con sus recetas correspondientes
        const segEnriched = segRows.map((r) => {
          let checks = []
          let otro = ''

          const e = r.exploracion ? JSON.parse(r.exploracion) : null
          if (e) {
            checks = Array.isArray(e.checks) ? e.checks : []
            otro = e.otro || ''
          }

          let recetas = this.recetasAll.filter(
            (rec) => Number(rec.consulta_id) === Number(r.consulta_id),
          )

          // 🔄 Si no hay consulta_id o no coincidieron, emparejar por fecha aproximada (±1 día)
          if (!recetas.length) {
            const segDate = new Date(r.fecha || r.created_at)
            if (!isNaN(segDate)) {
              recetas = this.recetasAll.filter((rec) => {
                if (!rec.fecha) return false
                const recDate = new Date(rec.fecha)
                if (isNaN(recDate)) return false
                const diffDays = Math.abs((recDate - segDate) / (1000 * 60 * 60 * 24))
                return diffDays <= 1
              })
            }
          }

          console.log('🧾 Recetas encontradas para seguimiento', r.consulta_id, recetas)

          // 🩹 Aseguramos que siempre exista la propiedad recetas (aunque vacía)
          return {
            ...r,
            explChecks: checks,
            explOtro: otro,
            recetas: recetas || [],
          }
        })

        // Guardar en el estado
        this.seguimientos = segEnriched.sort((a, b) => b.id - a.id)
        console.log(this.seguimientos, 'se')

        this.activeSlide = '0'
      } finally {
        this.loading = false
      }
    },
    mapExploracion(k) {
      const m = {
        seca: 'SECA',
        grasa: 'GRASA',
        mixta: 'MIXTA',
        pigmentacion: 'PIGMENTACIÓN',
        cicatrices: 'CICATRICES DE ACNE',
        textura: 'TEXTURA',
        arrugas: 'LÍNEAS FINAS Y ARRUGAS',
        poros: 'POROS ABIERTOS',
        dano: 'DAÑO SOLAR',
        rosacea: 'ROSÁCEA',
        acne: 'ACNE',
        ojeras: 'OJERAS PROFUNDAS O PIGMENTADAS',
      }
      return m[k] || k
    },
    prevSlide() {
      const i = this.activeIdxNum
      if (i > 0) this.activeSlide = String(i - 1)
    },
    nextSlide() {
      const i = this.activeIdxNum
      if (i < this.seguimientos.length - 1) this.activeSlide = String(i + 1)
    },
    escape(s) {
      return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    },
    nl2br(s) {
      return String(s || '').replace(/\n/g, '<br/>')
    },
    resolveAsset(src) {
      try {
        if (typeof src === 'string' && (src.startsWith('http') || src.startsWith('/'))) return src
        return src
      } catch {
        return src
      }
    },
    // ================== IMPRESIÓN COMPLETA ===================
    printAll() {
      if (!this.selectedPatientId || !this.patient) return
      const html = this.buildAllPagesHtml()
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)
      const doc = iframe.contentDocument || iframe.contentWindow.document
      doc.open()
      doc.write(html)
      doc.close()
      const imgs = doc.images
      let loaded = 0
      const doPrint = () => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        setTimeout(() => document.body.removeChild(iframe), 800)
      }
      if (!imgs || !imgs.length) return doPrint()
      Array.from(imgs).forEach((im) => {
        if (im.complete) {
          if (++loaded === imgs.length) doPrint()
        } else {
          im.onload = im.onerror = () => {
            if (++loaded === imgs.length) doPrint()
          }
        }
      })
    },
    buildAllPagesHtml() {
      const p = this.patient || {}
      const c = this.primeraConsulta || {}
      const logoSrc = this.resolveAsset(this.logo)
      const css = `
        @page { size: A4; margin: 18mm; }
        html, body { margin: 0; padding: 0; font-family: "Times New Roman", Times, serif; color: #000; }
        .page { page-break-inside: avoid; }
        .page + .page { break-before: page; page-break-before: always; }
        .logo { text-align: center; margin-bottom: 6mm; }
        .logo img { width: 38mm; }
        h1 { text-transform: uppercase; letter-spacing: 1.5px; font-size: 16pt; margin: 2mm 0 4mm; text-align: center; }
        h2 { font-size: 12pt; margin: 4mm 0 2mm; text-transform: uppercase; letter-spacing: .8px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
        .box { border: 1px solid #000; min-height: 26mm; padding: 4px 6px; }
        .checks { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 8px; }
        .check { display: flex; align-items: center; gap: 6px; }
        .square { width: 12px; height: 12px; border: 1px solid #000; text-align: center; line-height: 12px; font-size: 10px; }
      `
      const header = `<div class="logo"><img src="${logoSrc}" /></div>`
      const hojaPaciente = `
        <div class="page">${header}<h1>Historia Clínica</h1>
        <table>
          <tr><td><strong>Nombre:</strong> ${this.escape(p.nombre)}</td><td><strong>Género:</strong> ${this.escape(p.genero || '')}</td></tr>
          <tr><td><strong>F. Nacimiento:</strong> ${this.escape(p.fecha_nacimiento || '')}</td><td><strong>Edad:</strong> ${this.escape(p.edad || '')}</td></tr>
          <tr><td colspan="2"><strong>Dirección:</strong> ${this.escape(p.direccion || '')}</td></tr>
          <tr><td><strong>Ciudad Origen:</strong> ${this.escape(p.ciudad_origen || '')}</td><td><strong>Profesión:</strong> ${this.escape(p.profesion || '')}</td></tr>
        </table>
        <h2>Antecedentes y alergias</h2>
        <div class="box">${this.escape(p.alergias || '')}<br>${this.escape(p.antecedentes || '')}</div></div>
      `
      const hojaPrimera =
        c && c.id
          ? `
        <div class="page">${header}<h1>Primera Consulta</h1>
        <table><tr><td><strong>Fecha:</strong> ${this.formatDate(c.fecha)}</td><td><strong>Tipo:</strong> ${this.escape(c.tipo || '')}</td></tr></table>
        <h2>Motivo</h2><div class="box">${this.escape(c.motivo || '')}</div>
        <h2>Signos</h2><table>
        <tr><td>Peso: ${this.escape(c.signos_peso || '')}</td><td>Estatura: ${this.escape(c.signos_estatura || '')}</td><td>IMC: ${this.escape(c.signos_imc || '')}</td></tr>
        <tr><td>T/A: ${this.escape(c.signos_ta || '')}</td><td>FC: ${this.escape(c.signos_fc || '')}</td><td>Temp: ${this.escape(c.signos_temp || '')}</td></tr></table></div>`
          : ''
      const hojasSeguimientos = (this.seguimientos || [])
        .map((s) => {
          const checks = s.explChecks || []
          const otro = s.explOtro || ''
          return `
            <div class="page">${header}<h1>Seguimiento</h1>
            <h2>Exploración</h2>
            <div class="checks">
              ${[
                'seca',
                'grasa',
                'mixta',
                'pigmentacion',
                'cicatrices',
                'textura',
                'arrugas',
                'poros',
                'dano',
                'rosacea',
                'acne',
                'ojeras',
              ]
                .map(
                  (k) =>
                    `<div class="check"><span class="square">${checks.includes(k) ? 'X' : ''}</span>${this.mapExploracion(k)}</div>`,
                )
                .join('')}
            </div>
            <div class="box">Otro: ${this.escape(otro)}</div>
            <h2>Rutina</h2>
            <table><tr><td>Día: ${this.escape(s.rutina_dia || '')}</td><td>Noche: ${this.escape(s.rutina_noche || '')}</td></tr></table>
            <h2>Tratamiento</h2><div class="box">${this.escape(s.tratamiento || '')}</div></div>`
        })
        .join('')
      const hojasRecetas = (this.recetasAll || [])
        .map(
          (r) => `
        <div class="page">${header}<h1>Receta</h1>
        <table><tr><td>Fecha: ${this.formatDate(r.fecha || r.created_at)}</td><td>Consulta: #${r.consulta_id || ''}</td></tr></table>
        <div class="box">${(r.items || []).map((i) => `<div><strong>${this.escape(i.medicamento)}</strong> — ${this.escape(i.indicaciones || '')}</div>`).join('')}</div></div>`,
        )
        .join('')
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${hojaPaciente}${hojaPrimera}${hojasSeguimientos}${hojasRecetas}</body></html>`
    },
    printOneRecipe(rec, notas) {
      const r = rec || {}
      let items = r.items || []
      if (!items.length && r.id)
        items = this.qAll(
          `SELECT medicamento, indicaciones, notas FROM receta_items WHERE receta_id=?`,
          [r.id],
        )

      const iframe = document.createElement('iframe')
      Object.assign(iframe.style, {
        position: 'fixed',
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        border: 0,
      })
      document.body.appendChild(iframe)

      // 🎯 Ajustes: mover texto más abajo y más a la derecha
      const css = `
    @page { size: 8.4in 5.5in; margin: 0; }
    body {
      margin: 0;
      height: 5.5in;
      width: 8.4in;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      font: 16px "Segoe UI", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .content {
      position: relative;
      top: 2.2in;   /* 🔽 empuja hacia abajo */
      left: 1.0in;  /* 🔜 empuja hacia la derecha */
      width: 5in;
      line-height: 1.5;
      color: #000;
    }
  `

      const html = `
    <!DOCTYPE html>
    <html>
      <head><style>${css}</style></head>
      <body>
        <div class="content">
          ${items
            .map(
              (i) =>
                `<div><strong>${this.escape(i.medicamento)}</strong> — ${this.escape(i.indicaciones || '')} </div>`,
            )
            .join('')}
             <div>
          ${this.escape(notas || '')}
          <div/>
        </div>

      </body>
    </html>
  `

      const doc = iframe.contentDocument
      doc.open()
      doc.write(html)
      doc.close()

      iframe.contentWindow.print()
      setTimeout(() => document.body.removeChild(iframe), 800)
    },
    cancel() {
      this.$router.push('/')
    },
  },
}
</script>

<style scoped>
:root {
  --ives-accent: #8b6a4f;
  --ives-line: #7d6b63;
  --ives-cellbg: #e9ddda;
  --ives-text: #333;
}
.ives-bg {
  background: #fff;
}
.ives-sheet {
  max-width: 920px;
  margin: 0 auto;
  background: #fff;
}
.ives-logo-wrap {
  display: flex;
  justify-content: center;
  margin: 8px 0 6px;
}
.ives-logo {
  height: 64px;
  object-fit: contain;
}
.ives-h2 {
  color: var(--ives-accent);
  letter-spacing: 0.35em;
  font-weight: 600;
  font-size: 18px;
  margin: 8px 0 14px;
}
.ives-h3 {
  color: var(--ives-accent);
  letter-spacing: 0.32em;
  font-weight: 600;
  font-size: 15px;
  margin: 18px 0 10px;
}
.ives-sub {
  color: #000;
  letter-spacing: 0.18em;
  font-weight: 600;
  font-size: 13px;
  margin: 8px 0 6px;
}
.ives-table {
  border: 2px solid var(--ives-line);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}
.ives-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.ives-span-2 {
  grid-column: 1 / span 2;
}
.ives-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--ives-cellbg);
  border-bottom: 2px solid var(--ives-line);
  border-right: 2px solid var(--ives-line);
  padding: 10px 12px;
}
.ives-grid .ives-cell:nth-child(2n) {
  border-right: none;
}
.lbl {
  font-size: 12px;
  color: var(--ives-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.val {
  font-size: 14px;
  color: #000;
}
.ives-textblock {
  background: var(--ives-cellbg);
  border: 2px solid var(--ives-line);
  padding: 10px;
  white-space: pre-wrap;
  min-height: 48px;
}
.rutina-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.rut-col {
  border-top: 2px solid var(--ives-line);
}
.rut-title {
  text-align: center;
  padding: 8px 0;
  font-size: 12px;
  color: var(--ives-text);
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--ives-line);
}
@media (max-width: 760px) {
  .ives-grid {
    grid-template-columns: 1fr;
  }
  .ives-grid .ives-cell {
    border-right: none;
  }
}
</style>
