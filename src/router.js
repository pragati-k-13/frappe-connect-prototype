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
  {
    path: '/connect/partners',
    name: 'results',
    component: () => import('./pages/ResultsPage.vue'),
  },
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
  // `BASE_URL` rather than nothing: under GitHub Pages the app lives at
  // /frappe-connect-prototype/, and without this the router would treat that
  // prefix as part of the route and match nothing. It resolves to '/' locally.
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Top of the page on every navigation, EXCEPT one carrying a hash — the
  // estimate modal links to `/connect#starter-packs`, and without this the
  // router lands on the page and leaves the reader at the top of it.
  //
  // ⚠️ NOT `return { el: to.hash }`. Vue Router resolves that to a position and
  // applies it with `window.scrollTo`, and the window doesn't scroll in this
  // app: `ConnectShell` puts the page inside a `ScrollArea`, so the document is
  // exactly viewport-height and every pixel of scrolling belongs to a div.
  // Measured — `document.documentElement.scrollHeight === clientHeight`, and
  // the router's own scroll was a silent no-op. `scrollIntoView` walks up and
  // moves whichever ancestor actually holds the overflow, so it's the one that
  // works here; resolving `false` tells the router not to try as well.
  //
  // Two frames, not one: on a cold load — which is what the modal's link does,
  // since it opens a new tab — the route component is lazily imported, and its
  // section isn't in the DOM when the first frame runs.
  scrollBehavior: (to) => {
    if (!to.hash) return { top: 0 }
    return new Promise((resolve) => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          document.querySelector(to.hash)?.scrollIntoView()
          resolve(false)
        }),
      )
    })
  },
})
