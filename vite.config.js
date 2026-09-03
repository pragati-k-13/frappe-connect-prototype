import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import frappeui from 'frappe-ui/vite'

export default defineConfig({
  // GitHub Pages serves this from a subpath — pragati-k-13.github.io/
  // frappe-connect-prototype/ — so every built asset URL has to carry it.
  //
  // Only in CI, deliberately: setting it unconditionally would move the local
  // dev server to localhost:5173/frappe-connect-prototype/ too, and there's no
  // reason for the localhost URLs to change. `import.meta.env.BASE_URL` follows
  // whichever value applies, which is what the router reads.
  //
  // ⚠️ Rename the repo and this string has to change with it.
  base: process.env.GITHUB_ACTIONS ? '/frappe-connect-prototype/' : '/',
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
