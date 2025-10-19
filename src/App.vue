<template>
  <router-view />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { persistNow } from 'boot/sqljs' // Asegúrate que esto exista en tu boot

let timer = null

async function safePersist() {
  try {
    if (typeof persistNow === 'function') {
      await persistNow() // guarda db.export() → IndexedDB
    }
  } catch (e) {
    console.log(e)

    // opcional: console.warn('[persistNow] falló', e)
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    void safePersist()
  }
}

function onBeforeUnload() {
  void safePersist()
}

onMounted(() => {
  // 1) persistir cada 30s
  timer = window.setInterval(() => {
    void safePersist()
  }, 30 * 1000)

  // 2) persistir cuando se oculta la pestaña
  document.addEventListener('visibilitychange', onVisibilityChange)

  // 3) persistir al cerrar/recargar
  window.addEventListener('beforeunload', onBeforeUnload)

  // 4) persistir inmediatamente al entrar (opcional)
  void safePersist()
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>
