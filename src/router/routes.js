//import RecetaPage from 'pages/RecetaPage.vue'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        name: 'motivos_no_venta',
        path: '/consulta',
        component: () => import('../pages/ConsultaPage.vue'),
        meta: {
          auth: false,
        },
      },
      {
        path: '/consulta/nueva',
        name: 'NuevaConsulta',
        component: () => import('pages/NuevaConsultaPage.vue'),
      },
      {
        path: '/consulta/seguimiento/:pacienteId',
        name: 'Seguimiento',
        props: true,
        component: () => import('pages/SeguimientoPage.vue'),
      },
      {
        path: '/expedientes',
        name: 'HistorialExpediente',
        component: () => import('pages/HistorialExpedientePage.vue'),
      },
      {
        path: '/medicamentos',
        component: () => import('pages/MedicamentosPage.vue'),
      },
      {
        path: '/receta/:pacienteId?',
        name: 'Receta',
        component: () => import('pages/RecetaPage.vue'),
      },
      // {
      //   path: '/receta/:pacienteId',
      //   name: 'Receta',
      //   component: RecetaPage,
      //   props: true, // <--- importante
      // },
      {
        path: '/receta/:pacienteId/:consultaId?', // 👈 consultaId es opcional
        name: 'Receta',
        component: () => import('pages/RecetaPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
