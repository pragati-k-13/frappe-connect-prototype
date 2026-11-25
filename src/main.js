import 'frappe-ui/style.css'
import './index.css'
import './assets/file-types/file-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
