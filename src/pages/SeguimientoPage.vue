<template>
  <q-header elevated>
    <q-toolbar style="background-color: #c4b193">
      <div class="col-12 flex justify-end">
        <q-btn
          flat
          label="Regresar"
          style="color: #1976d2; background-color: white; margin: 2px"
          @click="$router.push('/')"
        />
        <q-btn
          label="Guardar seguimiento"
          :loading="loading"
          style="color: #1976d2; background-color: white; margin: 2px"
          @click="guardarSeguimiento"
        />
      </div>
    </q-toolbar>
  </q-header>

  <q-page class="q-pa-lg ives-bg">
    <div class="ives-sheet">
      <div class="ives-logo-wrap">
        <img :src="logo" alt="IVES" class="ives-logo" />
      </div>

      <h2 class="ives-h2">EXPLORACION / RUTINA / TRATAMIENTO</h2>

      <!-- EXPLORACION -->
      <h3 class="ives-h3">EXPLORACION:</h3>
      <div class="ives-table">
        <div class="exp-grid">
          <label class="chk"
            ><input type="checkbox" value="seca" v-model="form.explChecks" /> ( ) SECA</label
          >
          <label class="chk"
            ><input type="checkbox" value="grasa" v-model="form.explChecks" /> ( ) GRASA</label
          >
          <label class="chk"
            ><input type="checkbox" value="mixta" v-model="form.explChecks" /> ( ) MIXTA</label
          >

          <label class="chk"
            ><input type="checkbox" value="pigmentacion" v-model="form.explChecks" /> ( )
            PIGMENTACION</label
          >
          <label class="chk"
            ><input type="checkbox" value="cicatrices" v-model="form.explChecks" /> ( ) CICATRICES
            DE ACNE</label
          >
          <label class="chk"
            ><input type="checkbox" value="textura" v-model="form.explChecks" /> ( ) TEXTURA</label
          >

          <label class="chk"
            ><input type="checkbox" value="arrugas" v-model="form.explChecks" /> ( ) LINEAS FINAS Y
            ARRUGAS</label
          >
          <label class="chk"
            ><input type="checkbox" value="poros" v-model="form.explChecks" /> ( ) POROS
            ABIERTOS</label
          >
          <label class="chk"
            ><input type="checkbox" value="dano" v-model="form.explChecks" /> ( ) DANO SOLAR</label
          >

          <label class="chk"
            ><input type="checkbox" value="rosacea" v-model="form.explChecks" /> ( ) ROSACEA</label
          >
          <label class="chk"
            ><input type="checkbox" value="acne" v-model="form.explChecks" /> ( ) ACNE</label
          >
          <label class="chk"
            ><input type="checkbox" value="ojeras" v-model="form.explChecks" /> ( ) OJERAS PROFUNDAS
            O PIGMENTADAS</label
          >
        </div>

        <div class="ives-cell ives-span-2">
          <span class="lbl">OTRO :</span>
          <input v-model="form.explOtro" class="ipt" type="text" />
        </div>
      </div>

      <!-- RUTINA -->
      <h3 class="ives-h3">RUTINA</h3>
      <div class="ives-table">
        <div class="rutina-grid">
          <div class="rut-col">
            <div class="rut-title">DIA</div>
            <textarea v-model="form.rutDia" class="rut-ta"></textarea>
          </div>
          <div class="rut-col">
            <div class="rut-title">NOCHE</div>
            <textarea v-model="form.rutNoche" class="rut-ta"></textarea>
          </div>
        </div>
      </div>

      <!-- TRATAMIENTO -->
      <h3 class="ives-h3">TRATAMIENTO:</h3>
      <div class="ives-table">
        <textarea v-model="form.tratamiento" class="trat-ta"></textarea>
      </div>

      <!-- COMENTARIO (se precarga y se puede editar/agregar más) -->
      <h3 class="ives-h3">ANOTACIONES:</h3>
      <div class="ives-table">
        <textarea v-model="form.comentario" class="trat-ta"></textarea>
      </div>
    </div>
  </q-page>
</template>

<script>
import logo from 'assets/Logo_IVES-22 (2).jpg'
import { getDb } from 'boot/sqljs'

export default {
  name: 'SeguimientoPage',
  props: { pacienteId: { type: [String, Number], required: true } },
  data() {
    return {
      logo,
      loading: false,
      form: {
        explChecks: [],
        explOtro: '',
        rutDia: '',
        rutNoche: '',
        tratamiento: '',
        comentario: '', // 👈 nuevo
      },
    }
  },
  mounted() {
    this.ensureTables()
    this.cargarBaseExploracionYComentario()
  },
  methods: {
    ensureTables() {
      const db = getDb()
      db.run(`
        CREATE TABLE IF NOT EXISTS consultas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          paciente_id INTEGER NOT NULL,
          fecha TEXT DEFAULT (datetime('now')),
          tipo TEXT,
          motivo TEXT,
          signos_peso TEXT, signos_ta TEXT, signos_fc TEXT, signos_temp TEXT,
          signos_estatura TEXT, signos_imc TEXT, detalles TEXT
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
          comentario TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `)
      try {
        db.run('ALTER TABLE seguimientos ADD COLUMN comentario TEXT;')
      } catch (e) {
        console.log(e)

        /* ya existe */
      }
    },

    q1(sql, params = []) {
      const db = getDb()
      const s = db.prepare(sql)
      s.bind(params)
      const row = s.step() ? s.getAsObject() : null
      s.free()
      return row
    },

    cargarBaseExploracionYComentario() {
      const lastConsulta = this.q1(
        'SELECT id FROM consultas WHERE paciente_id = ? ORDER BY id DESC LIMIT 1',
        [this.pacienteId],
      )
      if (!lastConsulta) return

      const seg = this.q1(
        'SELECT exploracion, comentario FROM seguimientos WHERE consulta_id = ? ORDER BY id DESC LIMIT 1',
        [lastConsulta.id],
      )

      if (!seg) return

      // precargar exploración (como original)
      if (seg.exploracion) {
        try {
          const exp = JSON.parse(seg.exploracion)
          this.form.explChecks = Array.isArray(exp.checks) ? exp.checks : []
          this.form.explOtro = exp.otro || ''
        } catch (e) {
          console.log(e)
        }
      }

      // precargar comentario
      this.form.comentario = seg.comentario || ''
    },

    async guardarSeguimiento() {
      this.loading = true
      try {
        const db = getDb()
        db.run('INSERT INTO consultas (paciente_id, tipo) VALUES (?, "seguimiento")', [
          this.pacienteId,
        ])
        const last = this.q1('SELECT last_insert_rowid() AS id')
        const consultaId = last?.id

        const exploracion = JSON.stringify({
          checks: this.form.explChecks,
          otro: this.form.explOtro,
        })

        db.run(
          `INSERT INTO seguimientos (consulta_id, exploracion, rutina_dia, rutina_noche, tratamiento, comentario)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            consultaId,
            exploracion,
            this.form.rutDia || null,
            this.form.rutNoche || null,
            this.form.tratamiento || null,
            this.form.comentario || null,
          ],
        )

        if (window?.electronAPI?.writeDb) {
          const data = db.export()
          await window.electronAPI.writeDb(data)
        }

        this.$q.notify({ type: 'positive', message: 'Seguimiento guardado correctamente' })
        console.log(consultaId)

        this.$router.push({
          name: 'Receta',
          params: { pacienteId: String(this.pacienteId), consultaId: String(consultaId) },
        })
      } catch (e) {
        console.error(e)
        this.$q.notify({ type: 'negative', message: 'No se pudo guardar seguimiento' })
      } finally {
        this.loading = false
      }
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
  background: var(--ives-cellbg);
}
.ives-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 2px solid var(--ives-line);
  padding: 10px 12px;
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

.exp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-bottom: 2px solid var(--ives-line);
}
.chk {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-right: 2px solid var(--ives-line);
  font-size: 13px;
  color: var(--ives-text);
}
.exp-grid .chk:nth-child(3n) {
  border-right: none;
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
.rut-ta {
  width: 100%;
  min-height: 160px;
  border: none;
  outline: none;
  background: transparent;
  padding: 10px;
  resize: vertical;
  font-size: 14px;
  color: var(--ives-text);
}
.trat-ta {
  width: 100%;
  min-height: 120px;
  border: none;
  outline: none;
  background: transparent;
  padding: 10px;
  resize: vertical;
  font-size: 14px;
  color: var(--ives-text);
}

@media (max-width: 700px) {
  .exp-grid {
    grid-template-columns: 1fr;
  }
  .chk {
    border-right: none;
  }
  .rutina-grid {
    grid-template-columns: 1fr;
  }
}
</style>
