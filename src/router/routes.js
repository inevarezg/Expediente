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
