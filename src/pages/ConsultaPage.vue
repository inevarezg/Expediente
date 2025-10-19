<template>
  <q-page class="q-pa-lg ives-bg">
    <!-- Diálogo Nuevo / Seguimiento -->
    <q-dialog v-model="choiceDialog" persistent>
      <q-card style="min-width: 420px">
        <q-card-section class="text-subtitle1">¿Qué deseas hacer?</q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-card clickable bordered class="q-pa-md items-center column" @click="chooseNew">
                <q-avatar size="56px" class="bg-green-1 text-green">
                  <q-icon name="person_add" />
                </q-avatar>
                <div class="q-mt-sm text-center">Nuevo paciente</div>
              </q-card>
            </div>
            <div class="col-12 col-sm-6">
              <q-card
                clickable
                bordered
                class="q-pa-md items-center column"
                @click="chooseFollowUp"
              >
                <q-avatar size="56px" class="bg-blue-1 text-blue">
                  <q-icon name="history" />
                </q-avatar>
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
  </q-page>
</template>

<script>
import logo from 'assets/Logo_IVES-22 (2).jpg'
import { getDb } from 'boot/sqljs'

let tablesEnsured = false

export default {
  name: 'ConsultaPage',
  data() {
    const d = new Date()
    const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
    return {
      logo,
      choiceDialog: true,
      isNew: true,
      loading: false,
      selectedPatientId: null,
      patientOptions: [],
      firstForm: {
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
      followForm: { motivo: '', peso: '', ta: '', fc: '', temp: '', observaciones: '' },
    }
  },
  mounted() {
    this.ensureTables()
  },
  methods: {
    chooseNew() {
      this.isNew = true
      this.choiceDialog = false
    },
    chooseFollowUp() {
      this.isNew = false
      this.choiceDialog = false
    },
    cancel() {
      this.$router.push('/')
    },

    // Solo se ejecuta una vez
    ensureTables() {
      if (tablesEnsured) return
      tablesEnsured = true

      const db = getDb()
      db.run(`
        CREATE TABLE IF NOT EXISTS pacientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          genero TEXT, fecha_nacimiento TEXT, edad TEXT, direccion TEXT,
          ciudad_origen TEXT, profesion TEXT, celular TEXT, email TEXT,
          alergias TEXT, antecedentes TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `)
      const colsRes = db.exec('PRAGMA table_info(pacientes);')
      const existing = (colsRes[0]?.values || []).map((v) => String(v[1]))
      const addIfMissing = (name, defSql) => {
        if (!existing.includes(name)) db.run(`ALTER TABLE pacientes ADD COLUMN ${defSql};`)
      }
      addIfMissing('genero', 'genero TEXT')
      addIfMissing('fecha_nacimiento', 'fecha_nacimiento TEXT')
      addIfMissing('edad', 'edad TEXT')
      addIfMissing('direccion', 'direccion TEXT')
      addIfMissing('ciudad_origen', 'ciudad_origen TEXT')
      addIfMissing('profesion', 'profesion TEXT')
      addIfMissing('celular', 'celular TEXT')
      addIfMissing('email', 'email TEXT')
      addIfMissing('alergias', 'alergias TEXT')
      addIfMissing('antecedentes', 'antecedentes TEXT')
      addIfMissing('created_at', "created_at TEXT DEFAULT (datetime('now'))")

      db.run(`
        CREATE TABLE IF NOT EXISTS consultas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          paciente_id INTEGER NOT NULL,
          fecha TEXT DEFAULT (datetime('now')),
          tipo TEXT, motivo TEXT,
          signos_peso TEXT, signos_ta TEXT, signos_fc TEXT, signos_temp TEXT,
          signos_estatura TEXT, signos_imc TEXT, detalles TEXT
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

    insertPaciente(p) {
      const db = getDb()
      const stmt = db.prepare(`
        INSERT INTO pacientes
          (nombre, genero, fecha_nacimiento, edad, direccion, ciudad_origen, profesion,
           celular, email, alergias, antecedentes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run([
        p.nombre,
        p.genero || null,
        p.fecha_nacimiento || null,
        p.edad || null,
        p.direccion || null,
        p.ciudad_origen || null,
        p.profesion || null,
        p.celular || null,
        null,
        p.alergias || null,
        this.buildAntecedentesText(p) || null,
      ])
      stmt.free()
      const row = this.queryOne('SELECT last_insert_rowid() AS id')
      return row?.id || null
    },

    insertConsulta({ paciente_id, tipo, motivo, signos, detalles }) {
      const db = getDb()
      const stmt = db.prepare(`
        INSERT INTO consultas
          (paciente_id, tipo, motivo,
           signos_peso, signos_ta, signos_fc, signos_temp, signos_estatura, signos_imc,
           detalles)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run([
        paciente_id,
        tipo,
        motivo || null,
        signos?.peso || null,
        signos?.ta || null,
        signos?.fc || null,
        signos?.temp || null,
        signos?.estatura || null,
        signos?.imc || null,
        detalles || null,
      ])
      stmt.free()
    },

    queryOne(sql, params = []) {
      const db = getDb()
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const row = stmt.step() ? stmt.getAsObject() : null
      stmt.free()
      return row
    },

    async saveFirstTime() {
      if (!this.firstForm.nombre) {
        this.$q.notify({ type: 'warning', message: 'Nombre requerido' })
        return
      }
      this.loading = true
      try {
        const pacienteId = this.insertPaciente(this.firstForm)
        this.insertConsulta({
          paciente_id: pacienteId,
          tipo: 'primera',
          motivo: this.firstForm.motivo_consulta,
          signos: {
            peso: this.firstForm.peso,
            ta: this.firstForm.ta,
            fc: this.firstForm.fc,
            temp: this.firstForm.temp,
            estatura: this.firstForm.estatura,
            imc: this.firstForm.imc,
          },
        })
        await this.persistIfAvailable()
        this.$q.notify({ type: 'positive', message: 'Paciente y primera consulta guardados' })
        this.$router.push('/expedientes')
      } catch (e) {
        console.error(e)
        this.$q.notify({ type: 'negative', message: 'Error al guardar' })
      } finally {
        this.loading = false
      }
    },

    async saveFollowUp() {
      if (!this.selectedPatientId) {
        this.$q.notify({ type: 'warning', message: 'Selecciona un paciente' })
        return
      }
      this.loading = true
      try {
        this.insertConsulta({
          paciente_id: this.selectedPatientId,
          tipo: 'seguimiento',
          motivo: this.followForm.motivo,
          signos: {
            peso: this.followForm.peso,
            ta: this.followForm.ta,
            fc: this.followForm.fc,
            temp: this.followForm.temp,
          },
          detalles: this.followForm.observaciones,
        })
        await this.persistIfAvailable()
        this.$q.notify({ type: 'positive', message: 'Consulta guardada' })
        this.$router.push('/expedientes')
      } catch (e) {
        console.error(e)
        this.$q.notify({ type: 'negative', message: 'Error al guardar' })
      } finally {
        this.loading = false
      }
    },

    async persistIfAvailable() {
      try {
        const db = getDb()
        if (window?.electronAPI?.writeDb) {
          const data = db.export()
          await window.electronAPI.writeDb(data)
        }
      } catch (e) {
        console.log(e)
      }
    },

    // Optimizada: consulta con límite y pequeño yield
    filterPatients(val, update) {
      update(async () => {
        const db = getDb()
        const like = `%${(val || '').trim()}%`
        const stmt = db.prepare(`
          SELECT id, (nombre || CASE WHEN genero IS NOT NULL AND genero <> '' THEN ' ('||genero||')' ELSE '' END) AS label
          FROM pacientes
          WHERE nombre LIKE ? OR genero LIKE ? OR ciudad_origen LIKE ? OR profesion LIKE ?
          ORDER BY id DESC
          LIMIT 50
        `)
        const rows = []
        stmt.bind([like, like, like, like])
        while (stmt.step()) rows.push(stmt.getAsObject())
        stmt.free()
        await new Promise((r) => setTimeout(r, 0))
        this.patientOptions = rows
      })
    },
  },
}
</script>

<style scoped>
:root {
  --ives-accent: #8b6a4f; /* texto dorado-marrón */
  --ives-line: #7d6b63; /* líneas gris-marrón */
  --ives-cellbg: #e9ddda; /* rosa-beige celdas */
  --ives-text: #333333;
}
.ives-bg {
  background: #ffffff;
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
  gap: 0;
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
