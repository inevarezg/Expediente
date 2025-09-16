<template>
  <q-page class="q-pa-lg ives-bg">
    <div class="ives-sheet">
      <div class="ives-logo-wrap">
        <img :src="logo" class="ives-logo" alt="IVES" />
      </div>

      <h2 class="ives-h2">HISTORIAL DE EXPEDIENTE</h2>

      <!-- Selector de paciente -->
      <q-card flat bordered class="q-pa-md q-mb-lg">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md-8">
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
          <div class="col-12 col-md-4 flex justify-end">
            <q-btn label="Cancelar" @click="cancel" />
            <q-btn
              color="primary"
              icon="print"
              label="Imprimir"
              :disable="!selectedPatientId"
              @click="printPage"
            />
          </div>
        </div>
      </q-card>

      <q-inner-loading :showing="loading">
        <q-spinner size="30px" />
      </q-inner-loading>

      <div v-if="!loading && selectedPatientId && patient">
        <!-- 1) HOJA INICIAL -->
        <h3 class="ives-h3">HOJA INICIAL</h3>
        <div class="ives-table ives-grid">
          <div class="ives-cell">
            <span class="lbl">NOMBRE</span>
            <div class="val">{{ patient.nombre }}</div>
          </div>
          <div class="ives-cell">
            <span class="lbl">GÉNERO</span>
            <div class="val">{{ patient.genero || '-' }}</div>
          </div>

          <div class="ives-cell">
            <span class="lbl">F. NACIMIENTO</span>
            <div class="val">{{ patient.fecha_nacimiento || '-' }}</div>
          </div>
          <div class="ives-cell">
            <span class="lbl">EDAD</span>
            <div class="val">{{ patient.edad || '-' }}</div>
          </div>

          <div class="ives-cell ives-span-2">
            <span class="lbl">DIRECCIÓN</span>
            <div class="val">{{ patient.direccion || '-' }}</div>
          </div>

          <div class="ives-cell">
            <span class="lbl">CIUDAD ORIGEN</span>
            <div class="val">{{ patient.ciudad_origen || '-' }}</div>
          </div>
          <div class="ives-cell">
            <span class="lbl">PROFESIÓN</span>
            <div class="val">{{ patient.profesion || '-' }}</div>
          </div>

          <div class="ives-cell">
            <span class="lbl">CELULAR</span>
            <div class="val">{{ patient.celular || '-' }}</div>
          </div>
          <div class="ives-cell">
            <span class="lbl">CREADO</span>
            <div class="val">{{ formatDate(patient.created_at) }}</div>
          </div>
        </div>

        <div class="q-mb-md">
          <h4 class="ives-sub">MOTIVO DE CONSULTA</h4>
          <div class="ives-textblock">{{ primeraConsulta?.motivo || '—' }}</div>
        </div>

        <div class="q-mb-lg">
          <h4 class="ives-sub">SIGNOS</h4>
          <div class="ives-table ives-grid">
            <div class="ives-cell">
              <span class="lbl">PESO</span>
              <div class="val">{{ primeraConsulta?.signos_peso || '-' }}</div>
            </div>
            <div class="ives-cell">
              <span class="lbl">ESTATURA</span>
              <div class="val">{{ primeraConsulta?.signos_estatura || '-' }}</div>
            </div>
            <div class="ives-cell">
              <span class="lbl">IMC</span>
              <div class="val">{{ primeraConsulta?.signos_imc || '-' }}</div>
            </div>
            <div class="ives-cell">
              <span class="lbl">T/A</span>
              <div class="val">{{ primeraConsulta?.signos_ta || '-' }}</div>
            </div>
            <div class="ives-cell">
              <span class="lbl">FC</span>
              <div class="val">{{ primeraConsulta?.signos_fc || '-' }}</div>
            </div>
            <div class="ives-cell">
              <span class="lbl">TEMP</span>
              <div class="val">{{ primeraConsulta?.signos_temp || '-' }}</div>
            </div>
          </div>
        </div>

        <!-- 2) LÍNEA DE TIEMPO: TODAS LAS CONSULTAS DE SEGUIMIENTO -->
        <h3 class="ives-h3">SEGUIMIENTOS</h3>
        <div v-if="seguimientos.length === 0" class="text-grey q-mt-sm">
          Aún no hay seguimientos.
        </div>

        <q-timeline v-else color="primary" class="q-mt-md">
          <q-timeline-entry
            v-for="seg in seguimientos"
            :key="seg.id"
            :title="`Seguimiento #${seg.id}`"
            :subtitle="formatDate(seg.created_at) || formatDate(seg.fecha)"
            icon="assignment"
          >
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

            <div>
              <h4 class="ives-sub">TRATAMIENTO</h4>
              <div class="ives-textblock">{{ seg.tratamiento || '—' }}</div>
            </div>
          </q-timeline-entry>
        </q-timeline>
      </div>
    </div>
  </q-page>
</template>

<script>
import { getDb } from 'boot/sqljs'
import logo from 'assets/Logo_IVES-22 (2).jpg'

export default {
  name: 'HistorialExpedientePage',
  data() {
    return {
      logo,
      loading: false,
      selectedPatientId: null,
      patientOptions: [],
      // datos cargados
      patient: null,
      primeraConsulta: null,
      seguimientos: [],
    }
  },
  mounted() {
    this.ensureTables()
    // precargar opciones
    this.filterPatients('', () => {})
  },
  methods: {
    ensureTables() {
      const db = getDb()
      db.run(`
        CREATE TABLE IF NOT EXISTS pacientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL, genero TEXT, fecha_nacimiento TEXT, edad TEXT,
          direccion TEXT, ciudad_origen TEXT, profesion TEXT, celular TEXT,
          email TEXT, alergias TEXT, antecedentes TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `)
      db.run(`
        CREATE TABLE IF NOT EXISTS consultas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          paciente_id INTEGER NOT NULL,
          fecha TEXT DEFAULT (datetime('now')),
          tipo TEXT, motivo TEXT,
          signos_peso TEXT, signos_ta TEXT, signos_fc TEXT, signos_temp TEXT, signos_estatura TEXT, signos_imc TEXT,
          detalles TEXT
        );
      `)
      db.run(`
        CREATE TABLE IF NOT EXISTS seguimientos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          consulta_id INTEGER NOT NULL,
          exploracion TEXT,
          rutina_dia TEXT,
          rutina_noche TEXT,
          tratamiento TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `)
    },

    qAll(sql, params = []) {
      const db = getDb()
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const rows = []
      while (stmt.step()) rows.push(stmt.getAsObject())
      stmt.free()
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
          `
          SELECT id, (nombre || CASE WHEN genero IS NOT NULL AND genero<>'' THEN ' ('||genero||')' ELSE '' END) AS label
          FROM pacientes
          WHERE nombre LIKE ? OR genero LIKE ? OR ciudad_origen LIKE ? OR profesion LIKE ?
          ORDER BY id DESC
        `,
          [like, like, like, like],
        )
        this.patientOptions = rows
      })
    },

    loadAll() {
      if (!this.selectedPatientId) return
      this.loading = true
      try {
        // paciente
        this.patient = this.q1('SELECT * FROM pacientes WHERE id = ?', [this.selectedPatientId])

        // primera consulta (tipo 'primera')
        this.primeraConsulta = this.q1(
          `
          SELECT *
          FROM consultas
          WHERE paciente_id = ? AND (tipo = 'primera' OR tipo IS NULL)
          ORDER BY id ASC
          LIMIT 1
        `,
          [this.selectedPatientId],
        )

        // seguimiento timeline
        const rows = this.qAll(
          `
          SELECT s.*, c.fecha
          FROM seguimientos s
          JOIN consultas c ON c.id = s.consulta_id
          WHERE c.paciente_id = ?
          ORDER BY s.id ASC
        `,
          [this.selectedPatientId],
        )

        // parse exploración
        this.seguimientos = rows.map((r) => {
          let checks = [],
            otro = ''
          try {
            const e = r.exploracion ? JSON.parse(r.exploracion) : null
            if (e) {
              checks = Array.isArray(e.checks) ? e.checks : []
              otro = e.otro || ''
            }
          } catch (e) {
            console.log(e)
          }
          return { ...r, explChecks: checks, explOtro: otro }
        })
      } finally {
        this.loading = false
      }
    },

    mapExploracion(key) {
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
      return m[key] || key
    },

    formatDate(dt) {
      if (!dt) return '—'
      // dt puede ser 'YYYY-MM-DD HH:mm:ss'
      return String(dt).replace('T', ' ').slice(0, 19)
    },

    printPage() {
      window.print()
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
.ives-grid .ives-cell.ives-span-2 {
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
