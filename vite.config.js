import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import frappeui from 'frappe-ui/vite'

export default defineConfig({
  plugins: [
    // Frappe UI ships raw .vue/.ts source rather than a prebuilt bundle, so its
    // own Vite plugin has to run to provide the ~icons/lucide/* virtual modules
    // its components import. Backend integrations are off — this is a design
    // mock with no Frappe server behind it.
    frappeui({
      frappeProxy: false,
      jinjaBootData: false,
      buildConfig: false,
      lucideIcons: true,
    }),
    vue(),
  ],
  optimizeDeps: {
    exclude: ['frappe-ui'],
    include: [
      'feather-icons',
      'dayjs',
      '@vueuse/core',
      '@headlessui/vue',
      'reka-ui',
      'vue-sonner',
      'tippy.js',
      '@floating-ui/dom',
      'fuzzysort',
      'socket.io-client',
      'idb-keyval',
    ],
  },
})
