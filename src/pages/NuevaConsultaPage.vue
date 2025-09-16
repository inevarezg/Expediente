<template>
  <q-page class="q-pa-lg ives-bg">
    <!-- 1) DIÁLOGO INICIAL -->
    <q-dialog v-model="choiceDialog" persistent>
      <q-card style="min-width: 420px">
        <q-card-section class="text-subtitle1">¿Qué deseas hacer?</q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-card
                clickable
                bordered
                class="q-pa-md items-center column"
                @click="setMode('nuevo')"
              >
                <q-avatar size="56px" class="bg-green-1 text-green"
                  ><q-icon name="person_add"
                /></q-avatar>
                <div class="q-mt-sm text-center">Nueva consulta</div>
              </q-card>
            </div>
            <div class="col-12 col-sm-6">
              <q-card
                clickable
                bordered
                class="q-pa-md items-center column"
                @click="setMode('seguimiento')"
              >
                <q-avatar size="56px" class="bg-blue-1 text-blue"
                  ><q-icon name="history"
                /></q-avatar>
                <div class="q-mt-sm text-center">Dar seguimiento</div>
              </q-card>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat v-close-popup label="Cerrar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div class="ives-sheet">
      <div class="ives-logo-wrap">
        <img :src="logo" alt="IVES" class="ives-logo" />
      </div>

      <!-- 2A) MODO SEGUIMIENTO: SOLO SELECTOR DE PACIENTE -->
      <div v-if="mode === 'seguimiento'">
        <h2 class="ives-h2">DAR SEGUIMIENTO</h2>
        <q-card flat bordered class="q-pa-md">
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
          />
          <div class="q-mt-md flex justify-end q-gutter-sm">
            <q-btn flat label="Cancelar" @click="goHome" />
            <q-btn
              color="primary"
              label="Ir a Seguimiento"
              :disable="!selectedPatientId"
              @click="goToSeguimiento"
            />
          </div>
        </q-card>
      </div>

      <!-- 2B) MODO NUEVO: FORMULARIO HISTORIA CLÍNICA -->
      <div v-else-if="mode === 'nuevo'">
        <h2 class="ives-h2">HISTORIA CLINICA</h2>

        <!-- Datos principales -->
        <div class="ives-grid ives-table">
          <div class="ives-cell">
            <span class="lbl">NOMBRE</span>
            <input v-model="form.nombre" class="ipt" type="text" />
          </div>
          <div class="ives-cell">
            <span class="lbl">GENERO</span>
            <input v-model="form.genero" class="ipt" type="text" placeholder="F / M / Otro" />
          </div>

          <div class="ives-cell">
            <span class="lbl">FECHA NACIMIENTO:</span>
            <input
              v-model="form.fecha_nacimiento"
              class="ipt"
              type="text"
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div class="ives-cell">
            <span class="lbl">EDAD:</span>
            <input v-model="form.edad" class="ipt" type="text" />
          </div>

          <div class="ives-cell ives-span-2">
            <span class="lbl">DIRECCION:</span>
            <input v-model="form.direccion" class="ipt" type="text" />
          </div>

          <div class="ives-cell">
            <span class="lbl">CIUDAD DE ORIGEN:</span>
            <input v-model="form.ciudad_origen" class="ipt" type="text" />
          </div>
          <div class="ives-cell">
            <span class="lbl">PROFESION:</span>
            <input v-model="form.profesion" class="ipt" type="text" />
          </div>

          <div class="ives-cell">
            <span class="lbl">FECHA ACTUAL:</span>
            <input v-model="form.fecha_actual" class="ipt" type="text" readonly />
          </div>
          <div class="ives-cell">
            <span class="lbl">CELULAR:</span>
            <input v-model="form.celular" class="ipt" type="text" />
          </div>
        </div>

        <h3 class="ives-h3">MOTIVO DE CONSULTA</h3>
        <div class="ives-textarea"><textarea v-model="form.motivo_consulta" /></div>

        <h3 class="ives-h3">ANTECEDENTES</h3>
        <div class="ives-table ives-antecedentes">
          <div class="ives-row3">
            <label class="chk"
              ><input type="checkbox" v-model="form.embarazo" /> ( ) EMBARAZO</label
            >
            <label class="chk"
              ><input type="checkbox" v-model="form.lactancia" /> ( ) LACTANCIA</label
            >
            <label class="chk"
              ><input type="checkbox" v-model="form.trastornos_coagulacion" /> ( ) TRASTORNOS
              COAGULACION</label
            >
          </div>
          <div class="ives-row3">
            <label class="chk"
              ><input type="checkbox" v-model="form.diabetes" /> ( ) DIABETES</label
            >
            <label class="chk"
              ><input type="checkbox" v-model="form.hipertension" /> ( ) HIPERTENSION</label
            >
            <label class="chk"
              ><input type="checkbox" v-model="form.enf_cardiovascular" /> ( ) ENF
              CARDIOVASCULAR</label
            >
          </div>
          <div class="ives-row3">
            <label class="chk"
              ><input type="checkbox" v-model="form.enf_autoinmune" /> ( ) ENF AUTOINMUNE</label
            >
            <label class="chk"
              ><input type="checkbox" v-model="form.epilepsia" /> ( ) EPILEPSIA O
              CONVULSIONES</label
            >
            <label class="chk"><input type="checkbox" v-model="form.asma" /> ( ) ASMA</label>
          </div>

          <div class="ives-cell ives-span-2">
            <span class="lbl">Alergias específicas:</span>
            <input v-model="form.alergias" class="ipt" type="text" />
          </div>
          <div class="ives-cell ives-span-2">
            <span class="lbl">Cirugias o tratamientos previos:</span>
            <input v-model="form.cirugias_previas" class="ipt" type="text" />
          </div>
          <div class="ives-cell ives-span-2">
            <span class="lbl">Medicamentos:</span>
            <input v-model="form.medicamentos" class="ipt" type="text" />
          </div>
          <div class="ives-cell ives-span-2">
            <span class="lbl">Alcoholismo, tabaquismo, drogas:</span>
            <input v-model="form.habitos" class="ipt" type="text" />
          </div>
          <div class="ives-cell ives-span-2">
            <span class="lbl">Otros:</span>
            <input v-model="form.otros" class="ipt" type="text" />
          </div>
        </div>

        <h3 class="ives-h3">SIGNOS</h3>
        <div class="ives-grid ives-table">
          <div class="ives-cell">
            <span class="lbl">( ) PESO</span><input v-model="form.peso" class="ipt" />
          </div>
          <div class="ives-cell">
            <span class="lbl">( ) ESTATURA</span><input v-model="form.estatura" class="ipt" />
          </div>
          <div class="ives-cell">
            <span class="lbl">( ) IMC</span><input v-model="form.imc" class="ipt" />
          </div>
          <div class="ives-cell">
            <span class="lbl">( ) T/A</span><input v-model="form.ta" class="ipt" />
          </div>
          <div class="ives-cell">
            <span class="lbl">( ) FC</span><input v-model="form.fc" class="ipt" />
          </div>
          <div class="ives-cell">
            <span class="lbl">( ) TEMP</span><input v-model="form.temp" class="ipt" />
          </div>
        </div>

        <h3 class="ives-h3">ANTECEDENTES HEREDITARIOS</h3>
        <div class="ives-textarea"><textarea v-model="form.antecedentes_hered" /></div>

        <div class="q-mt-lg flex justify-end q-gutter-sm">
          <q-btn flat label="Cancelar" @click="goHome" />
          <q-btn
            color="primary"
            label="Guardar y continuar a Seguimiento"
            :loading="loading"
            @click="guardarNuevo"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import logo from 'assets/Logo_IVES-22 (2).jpg'
import { getDb } from 'boot/sqljs'

export default {
  name: 'NuevaConsultaPage',
  data() {
    const d = new Date()
    const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      logo,
      loading: false,
      choiceDialog: true,
      mode: null, // 'nuevo' | 'seguimiento'
      // seguimiento
      selectedPatientId: null,
      patientOptions: [],
      // nuevo
      form: {
        nombre: '',
        genero: '',
        fecha_nacimiento: '',
        edad: '',
        direccion: '',
        ciudad_origen: '',
        profesion: '',
        fecha_actual: hoy,
        celular: '',
        motivo_consulta: '',
        embarazo: false,
        lactancia: false,
        trastornos_coagulacion: false,
        diabetes: false,
        hipertension: false,
        enf_cardiovascular: false,
        enf_autoinmune: false,
        epilepsia: false,
        asma: false,
        alergias: '',
        cirugias_previas: '',
        medicamentos: '',
        habitos: '',
        otros: '',
        peso: '',
        estatura: '',
        imc: '',
        ta: '',
        fc: '',
        temp: '',
        antecedentes_hered: '',
      },
    }
  },
  mounted() {
    this.ensureTables()
  },
  methods: {
    setMode(m) {
      this.mode = m
      this.choiceDialog = false
    },

    goHome() {
      this.$router.push('/')
    },

    goToSeguimiento() {
      if (!this.selectedPatientId) {
        this.$q.notify({ type: 'warning', message: 'Selecciona un paciente' })
        return
      }
      this.$router.push({ name: 'Seguimiento', params: { pacienteId: this.selectedPatientId } })
    },

    // ====== DB / ESQUEMA ======
    ensureTables() {
      const db = getDb()
      // pacientes
      db.run(`
        CREATE TABLE IF NOT EXISTS pacientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          genero TEXT,
          fecha_nacimiento TEXT,
          edad TEXT,
          direccion TEXT,
          ciudad_origen TEXT,
          profesion TEXT,
          celular TEXT,
          email TEXT,
          alergias TEXT,
          antecedentes TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `)
      const colsRes = db.exec('PRAGMA table_info(pacientes);')
      const existing = (colsRes[0]?.values || []).map((v) => String(v[1]))
      const addIfMissing = (n, def) => {
        if (!existing.includes(n)) db.run(`ALTER TABLE pacientes ADD COLUMN ${def}`)
      }
      ;[
        ['genero', 'genero TEXT'],
        ['fecha_nacimiento', 'fecha_nacimiento TEXT'],
        ['edad', 'edad TEXT'],
        ['direccion', 'direccion TEXT'],
        ['ciudad_origen', 'ciudad_origen TEXT'],
        ['profesion', 'profesion TEXT'],
        ['celular', 'celular TEXT'],
        ['email', 'email TEXT'],
        ['alergias', 'alergias TEXT'],
        ['antecedentes', 'antecedentes TEXT'],
        ['created_at', "created_at TEXT DEFAULT (datetime('now'))"],
      ].forEach(([n, def]) => addIfMissing(n, def))

      // consultas
      db.run(`
        CREATE TABLE IF NOT EXISTS consultas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          paciente_id INTEGER NOT NULL,
          fecha TEXT DEFAULT (datetime('now')),
          tipo TEXT,          -- 'primera' | 'seguimiento'
          motivo TEXT,
          signos_peso TEXT, signos_ta TEXT, signos_fc TEXT, signos_temp TEXT, signos_estatura TEXT, signos_imc TEXT,
          detalles TEXT
        );
      `)
      // seguimientos (para la otra página)
      db.run(`
        CREATE TABLE IF NOT EXISTS seguimientos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          consulta_id INTEGER NOT NULL,
          exploracion TEXT,   -- JSON
          rutina_dia TEXT,
          rutina_noche TEXT,
          tratamiento TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `)
    },

    buildAntecedentesText(p) {
      const flags = []
      if (p.embarazo) flags.push('Embarazo')
      if (p.lactancia) flags.push('Lactancia')
      if (p.trastornos_coagulacion) flags.push('Trastornos coagulación')
      if (p.diabetes) flags.push('Diabetes')
      if (p.hipertension) flags.push('Hipertensión')
      if (p.enf_cardiovascular) flags.push('Enf. cardiovascular')
      if (p.enf_autoinmune) flags.push('Enf. autoinmune')
      if (p.epilepsia) flags.push('Epilepsia/Convulsiones')
      if (p.asma) flags.push('Asma')
      const lines = []
      if (flags.length) lines.push(`Marcadores: ${flags.join(', ')}`)
      if (p.alergias) lines.push(`Alergias: ${p.alergias}`)
      if (p.cirugias_previas) lines.push(`Cirugías/Trat.: ${p.cirugias_previas}`)
      if (p.medicamentos) lines.push(`Medicamentos: ${p.medicamentos}`)
      if (p.habitos) lines.push(`Hábitos: ${p.habitos}`)
      if (p.otros) lines.push(`Otros: ${p.otros}`)
      if (p.antecedentes_hered) lines.push(`Hereditarios: ${p.antecedentes_hered}`)
      return lines.join('\n')
    },

    q1(sql, params = []) {
      const db = getDb()
      const s = db.prepare(sql)
      s.bind(params)
      const row = s.step() ? s.getAsObject() : null
      s.free()
      return row
    },

    // ====== GUARDAR NUEVO Y REDIRIGIR A SEGUIMIENTO ======
    async guardarNuevo() {
      if (!this.form.nombre) {
        this.$q.notify({ type: 'warning', message: 'Nombre requerido' })
        return
      }
      this.loading = true
      try {
        const db = getDb()

        // 1) Paciente
        const st = db.prepare(`
          INSERT INTO pacientes
            (nombre,genero,fecha_nacimiento,edad,direccion,ciudad_origen,profesion,celular,email,alergias,antecedentes)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)
        `)
        st.run([
          this.form.nombre,
          this.form.genero || null,
          this.form.fecha_nacimiento || null,
          this.form.edad || null,
          this.form.direccion || null,
          this.form.ciudad_origen || null,
          this.form.profesion || null,
          this.form.celular || null,
          null,
          this.form.alergias || null,
          this.buildAntecedentesText(this.form) || null,
        ])
        st.free()
        const row = this.q1('SELECT last_insert_rowid() AS id')
        const pacienteId = row?.id

        // 2) Consulta inicial
        const stc = db.prepare(`
          INSERT INTO consultas
            (paciente_id, tipo, motivo, signos_peso, signos_ta, signos_fc, signos_temp, signos_estatura, signos_imc, detalles)
          VALUES (?, 'primera', ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        stc.run([
          pacienteId,
          this.form.motivo_consulta || null,
          this.form.peso || null,
          this.form.ta || null,
          this.form.fc || null,
          this.form.temp || null,
          this.form.estatura || null,
          this.form.imc || null,
          null,
        ])
        stc.free()

        // 3) Persistir a disco si hay Electron
        try {
          if (window?.electronAPI?.writeDb) {
            const data = db.export()
            await window.electronAPI.writeDb(data)
          }
        } catch (e) {
          console.log(e)
        }

        this.$q.notify({ type: 'positive', message: 'Guardado. Continúa con Seguimiento.' })
        // 4) Redirigir a Seguimiento
        this.$router.push({ name: 'Seguimiento', params: { pacienteId } })
      } catch (e) {
        console.error(e)
        this.$q.notify({ type: 'negative', message: 'No se pudo guardar' })
      } finally {
        this.loading = false
      }
    },

    // ====== BÚSQUEDA PACIENTES PARA SEGUIMIENTO ======
    filterPatients(val, update) {
      update(() => {
        const db = getDb()
        const like = `%${(val || '').trim()}%`
        const stmt = db.prepare(`
          SELECT id,
                 (nombre || CASE WHEN genero IS NOT NULL AND genero <> '' THEN ' ('||genero||')' ELSE '' END) AS label
          FROM pacientes
          WHERE nombre LIKE ? OR genero LIKE ? OR ciudad_origen LIKE ? OR profesion LIKE ?
          ORDER BY id DESC
        `)
        const rows = []
        stmt.bind([like, like, like, like])
        while (stmt.step()) rows.push(stmt.getAsObject())
        stmt.free()
        this.patientOptions = rows
      })
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
  max-width: 760px;
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
  margin: 18px 0 8px;
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
.ipt {
  flex: 1;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  background: transparent;
  outline: none;
  padding: 4px 2px;
  font-size: 14px;
  color: var(--ives-text);
}

.ives-antecedentes {
  border-top: 2px solid var(--ives-line);
}
.ives-row3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-bottom: 2px solid var(--ives-line);
}
.chk {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--ives-cellbg);
  border-right: 2px solid var(--ives-line);
  font-size: 13px;
  color: var(--ives-text);
}
.ives-row3 .chk:last-child {
  border-right: none;
}

.ives-textarea {
  border: 2px solid var(--ives-line);
  background: var(--ives-cellbg);
  padding: 8px;
}
.ives-textarea textarea {
  width: 100%;
  min-height: 80px;
  border: none;
  background: transparent;
  outline: none;
  resize: vertical;
  font-size: 14px;
  color: var(--ives-text);
}

@media (max-width: 700px) {
  .ives-grid {
    grid-template-columns: 1fr;
  }
  .ives-grid .ives-cell {
    border-right: none;
  }
  .ives-row3 {
    grid-template-columns: 1fr;
  }
  .ives-row3 .chk {
    border-right: none;
  }
}
</style>
