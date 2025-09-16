// quasar.config.js
import { defineConfig } from '#q-app/wrappers'
import { fileURLToPath } from 'node:url'

export default defineConfig((ctx) => ({
  boot: [
    'i18n',
    'axios',
    'sqljs', // inicializa SQL.js (WASM) y tus tablas
  ],

  css: ['app.scss'],

  extras: ['roboto-font', 'material-icons'],

  build: {
    publicPath: './',
    copyPublicFolder: true,
    target: {
      browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
      node: 'node20',
    },

    // Evita pantalla en blanco en Electron
    vueRouterMode: 'hash',

    vitePlugins: [
      [
        '@intlify/unplugin-vue-i18n/vite',
        {
          ssr: ctx.modeName === 'ssr',
          include: [fileURLToPath(new URL('./src/i18n', import.meta.url))],
        },
      ],
      [
        'vite-plugin-checker',
        {
          eslint: {
            lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
            useFlatConfig: true,
          },
        },
        { server: false },
      ],
    ],
  },

  devServer: {
    open: true,
  },

  framework: {
    config: {},
    plugins: ['Notify', 'Dialog'],
  },

  animations: [],

  ssr: {
    prodPort: 3000,
    middlewares: ['render'],
    pwa: false,
  },

  pwa: {
    workboxMode: 'GenerateSW',
  },

  capacitor: { hideSplashscreen: true },
  cordova: {},

  // ============== ELECTRON ==============
  electron: {
    bundler: 'builder', // o 'packager' si prefieres
    mainProcessFile: 'src-electron/electron-main.js',
    packager: {
      extraResource: ['public/sql-wasm.wasm'], // o donde tengas tu .wasm
    },
    builder: {
      appId: 'expediente.app',
      productName: 'expediente',
      extraResources: [
        // copia el preload al directorio de resources para poder leerlo con process.resourcesPath
        { from: 'src-electron/electron-preload.js', to: 'electron-preload.js' },
        // OPCIONAL: si prefieres forzar el WASM en resources (y NO depender de public)
        // { from: 'public/sql-wasm.wasm', to: 'sql-wasm.wasm' }
      ],
      directories: {
        output: 'dist/electron',
      },
      files: [
        '**/*',
        {
          from: 'dist/spa',
          to: 'spa',
        },
      ],
    },

    nodeIntegration: true,
    extendWebpack(cfg) {
      console.log(cfg)

      // por si necesitas meter algo más
    },
  },
  bex: { extraScripts: [] },
}))
