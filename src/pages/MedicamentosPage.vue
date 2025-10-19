<template>
  <q-header elevated>
    <q-toolbar style="background-color: #c4b193">
      <div class="col-12 flex justify-end">
        <q-btn
          color="primary"
          icon="add"
          label="Agregar"
          style="background-color: white; margin: 2px; color: #1976d2"
          @click="addMedicine"
        />
        <q-btn
          flat
          label="Regresar"
          style="color: #1976d2; background-color: white; margin: 2px"
          @click="goHome"
        />
      </div>
    </q-toolbar>
  </q-header>

  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md text-center">Catálogo de Medicamentos</div>

    <!-- Formulario principal -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <q-form @submit.prevent="addMedicine" class="q-gutter-md">
        <q-input
          v-model="newMedicine.name"
          label="Nombre del medicamento *"
          outlined
          dense
          clearable
          required
        />
        <q-input v-model="newMedicine.dose" label="Dosis / Presentación" outlined dense clearable />
        <div class="flex justify-end">
          <q-btn label="Guardar" color="primary" icon="save" type="submit" />
        </div>
      </q-form>
    </q-card>

    <!-- Buscador -->
    <q-input
      v-model="search"
      label="Buscar medicamento"
      outlined
      dense
      class="q-mb-md"
      debounce="400"
      clearable
    >
      <template #append><q-icon name="search" /></template>
    </q-input>

    <!-- Tabla -->
    <q-table
      title="Medicamentos registrados"
      :rows="filteredMedicines"
      :columns="columns"
      row-key="id"
      flat
      bordered
      no-data-label="Sin medicamentos"
    >
      <template #body-cell-actions="props">
        <q-td align="center">
          <q-btn dense flat round color="blue" icon="edit" @click="openEditDialog(props.row)" />
          <q-btn dense flat round color="red" icon="delete" @click="confirmDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo de edición -->
    <q-dialog v-model="editDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="text-h6">Editar medicamento</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="editMedicine.name" label="Nombre" outlined dense />
          <q-input v-model="editMedicine.dose" label="Dosis" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" @click="updateMedicine" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { getDb } from 'boot/sqljs'

export default {
  name: 'MedicamentosPage',
  data() {
    return {
      newMedicine: { name: '', dose: '' },
      editMedicine: { id: null, name: '', dose: '' },
      editDialog: false,
      search: '',
      medicines: [],
      columns: [
        { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
        { name: 'dose', label: 'Dosis', field: 'dose', align: 'left' },
        { name: 'actions', label: 'Acciones', align: 'center' },
      ],
    }
  },
  computed: {
    filteredMedicines() {
      const term = this.search.toLowerCase().trim()
      if (!term) return this.medicines
      return this.medicines.filter((m) => m.name.toLowerCase().includes(term))
    },
  },
  mounted() {
    this.ensureTable()
    this.loadMedicines()
  },
  methods: {
    goHome() {
      this.$router.push('/')
    },
    ensureTable() {
      const db = getDb()
      db.run(`
        CREATE TABLE IF NOT EXISTS medicamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          dose TEXT
        )
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
    qRun(sql, params = []) {
      const db = getDb()
      const stmt = db.prepare(sql)
      stmt.run(params)
      stmt.free()
    },
    loadMedicines() {
      this.medicines = this.qAll(`SELECT * FROM medicamentos ORDER BY name ASC`)
    },
    addMedicine() {
      if (!this.newMedicine.name.trim()) {
        this.$q.notify({ type: 'warning', message: 'El nombre es obligatorio.' })
        return
      }
      this.qRun(`INSERT INTO medicamentos (name, dose) VALUES (?, ?)`, [
        this.newMedicine.name.trim(),
        this.newMedicine.dose.trim(),
      ])
      this.$q.notify({ type: 'positive', message: 'Medicamento agregado.' })
      this.newMedicine = { name: '', dose: '' }
      this.loadMedicines()
    },
    confirmDelete(row) {
      this.$q
        .dialog({
          title: 'Confirmar eliminación',
          message: `¿Eliminar "${row.name}" del catálogo?`,
          cancel: true,
          persistent: true,
        })
        .onOk(() => this.deleteMedicine(row.id))
    },
    deleteMedicine(id) {
      this.qRun(`DELETE FROM medicamentos WHERE id = ?`, [id])
      this.$q.notify({ type: 'positive', message: 'Medicamento eliminado.' })
      this.loadMedicines()
    },
    openEditDialog(row) {
      this.editMedicine = { ...row }
      this.editDialog = true
    },
    updateMedicine() {
      if (!this.editMedicine.name.trim()) {
        this.$q.notify({ type: 'warning', message: 'El nombre no puede estar vacío.' })
        return
      }
      this.qRun(`UPDATE medicamentos SET name = ?, dose = ? WHERE id = ?`, [
        this.editMedicine.name.trim(),
        this.editMedicine.dose.trim(),
        this.editMedicine.id,
      ])
      this.editDialog = false
      this.loadMedicines()
      this.$q.notify({ type: 'positive', message: 'Cambios guardados.' })
    },
  },
}
</script>

<style scoped>
.q-page {
  background: #faf9f6;
}
.q-table {
  border-radius: 10px;
  overflow: hidden;
}
.q-card {
  border-radius: 10px;
}
</style>
