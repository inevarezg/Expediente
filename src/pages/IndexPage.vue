<template>
  <q-page class="bg-page">
    <!-- Header -->
    <div class="container">
      <div class="header">
        <div class="brand">
          <img :src="logoLight" alt="IVES" class="brand__logo" />
          <div class="brand__text">
            <div class="brand__title">Sistema Médico</div>
            <div class="brand__subtitle">Panel de administración</div>
          </div>
        </div>
      </div>

      <!-- Hero -->
      <div class="hero">
        <h1 class="hero__title">¿Qué deseas hacer hoy?</h1>
        <p class="hero__subtitle">
          Selecciona una de las opciones disponibles para gestionar pacientes y consultas médicas
        </p>
      </div>

      <!-- Cards -->
      <div class="cards">
        <!-- Historial de Expedientes -->
        <q-card class="card card--blue" flat bordered>
          <div class="card__icon">
            <q-icon name="description" size="40px" />
          </div>
          <div class="card__body">
            <div class="card__title">Historial de Expedientes</div>
            <div class="card__text">Consultar y revisar expedientes médicos existentes</div>
          </div>
          <q-btn color="primary" class="card__btn" label="Acceder" @click="goTo('/expedientes')" />
        </q-card>

        <!-- Nueva Consulta -->
        <q-card class="card card--orange" flat bordered>
          <div class="card__icon card__icon--orange">
            <q-icon name="event" size="40px" />
          </div>
          <div class="card__body">
            <div class="card__title">Nueva Consulta</div>
            <div class="card__text">Agendar o iniciar una nueva consulta médica</div>
          </div>
          <q-btn
            color="orange"
            class="card__btn"
            label="Acceder"
            @click="goTo('/consulta/nueva')"
          />
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import logoDark from 'assets/Logo_IVES-06.png'
import logoLight from 'assets/Logo_IVES-30 (4).jpg'
import logoBeige from 'assets/Logo_IVES-22 (2).jpg'

export default {
  name: 'IndexPage',
  data() {
    return {
      // Elige el que prefieras para el header:
      logoDark,
      logoLight,
      logoBeige,
    }
  },
  methods: {
    goTo(path) {
      this.$router.push(path)
    },
  },
}
</script>

<style scoped>
/* Layout base */
.bg-page {
  background: #f6f9fc; /* suave como en tu captura */
  min-height: 100%;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 64px;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.brand__logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 10px;
}
.brand__text {
  line-height: 1.1;
}
.brand__title {
  font-weight: 700;
  font-size: 18px;
}
.brand__subtitle {
  font-size: 12.5px;
  color: #6b7280;
}

/* Hero */
.hero {
  text-align: center;
  margin: 28px 0 36px;
}
.hero__title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}
.hero__subtitle {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

/* Cards grid */
.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 22px;
  justify-content: center;
}
@media (max-width: 720px) {
  .cards {
    grid-template-columns: 1fr;
  }
}

/* Card */
.card {
  border-radius: 16px;
  padding: 18px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(16, 24, 40, 0.06);
  background: #fff;
}
.card__icon {
  width: 72px;
  height: 72px;
  border-radius: 9999px;
  display: grid;
  place-items: center;
  background: #e8f0ff;
  color: #1d4ed8;
  margin: 0 auto 4px;
  box-shadow: 0 2px 8px rgba(29, 78, 216, 0.15);
}
.card__icon--orange {
  background: #ffedd5;
  color: #ea580c;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.15);
}
.card__title {
  font-weight: 700;
  font-size: 16px;
  color: #0f172a;
  text-align: center;
}
.card__text {
  color: #64748b;
  font-size: 13.5px;
  text-align: center;
}
.card__btn {
  margin-top: 10px;
  width: 100%;
  font-weight: 700;
  border-radius: 10px;
  height: 42px;
}

/* Variantes de borde superior suave para cada tarjeta (como las tarjetas de tu captura) */
.card--blue {
  border-top: 6px solid rgba(29, 78, 216, 0.15);
}
.card--orange {
  border-top: 6px solid rgba(234, 88, 12, 0.18);
}
</style>
