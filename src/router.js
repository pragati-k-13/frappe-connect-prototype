import { createRouter, createWebHistory } from 'vue-router'

// One route per screen in the handoff.
//
// `/` is the frappe.io partners page — the discovery surface, not part of the
// app. Its "Find a partner" CTA opens `/connect` in a NEW TAB, matching the
// design: Frappe Connect is a separate destination, not a section of the
// marketing site.
const routes = [
  { path: '/', name: 'website', component: () => import('./pages/FrappeSitePage.vue') },
  { path: '/connect', name: 'connect', component: () => import('./pages/ConnectLandingPage.vue') },
  { path: '/connect/partners', name: 'results', component: () => import('./pages/ResultsPage.vue') },
  // Nested under the listing so the URL carries the depth the breadcrumb shows.
  // `:id` is the partner slug — the same id that resolves their logo file.
  {
    path: '/connect/partners/:id',
    name: 'partner',
    component: () => import('./pages/PartnerProfilePage.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
