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
  // The two auth screens. Routes rather than a dialog, and outside
  // `ConnectShell`: sign-up is the first of four steps (create account, verify,
  // company info, project info), and a four-screen sequence needs a URL per
  // step so Back works and a half-finished signup can be resumed.
  //
  // Both accept `?next=` — an in-app path to return to once the visitor is in,
  // so a gated control can send someone here and get them back. The pages
  // reject anything that isn't a relative path; see the note on `next` there.
  { path: '/connect/login', name: 'login', component: () => import('./pages/LoginPage.vue') },
  { path: '/connect/signup', name: 'signup', component: () => import('./pages/SignupPage.vue') },
  // The code step both forms hand off to. ONE component behind two routes:
  // sign-up and log-in reach the identical screen, and only the heading, the
  // toast and where "Use a different email" goes back to differ. The route NAME
  // is what tells them apart, which is also how `useAuthExit` knows this hop is
  // still inside the auth flow rather than someone backing out of it.
  {
    path: '/connect/signup/verify',
    name: 'signup-verify',
    component: () => import('./pages/VerifyPage.vue'),
  },
  {
    path: '/connect/login/verify',
    name: 'login-verify',
    component: () => import('./pages/VerifyPage.vue'),
  },
  // Where the booking flow stops: confirm the pack and book the call.
  //
  // `?pack=` names what is being confirmed and `?scope=1` opens the scope panel.
  // The pack is in the URL rather than read from the store alone because the
  // store is in memory: reloading this screen used to lose the selection, and a
  // confirmation page is the one you might refresh or send on before paying.
  {
    path: '/connect/confirm',
    name: 'confirm',
    component: () => import('./pages/ConfirmPage.vue'),
  },
  // The end of the journey: who Frappe assigned you, and what happens next.
  // Both `?pack=` and `?partner=` are in the URL — this is the screen someone
  // screenshots or forwards, and an assignment that changed on reload would be
  // worse than one never shown.
  {
    path: '/connect/confirmed',
    name: 'confirmed',
    component: () => import('./pages/ConfirmedPage.vue'),
  },
  // The last step of signing up, and sign-up only — a returning customer
  // answered these once, so `login-verify` goes straight to `next`. This is
  // where the account actually lands: see the note at the top of the page.
  {
    path: '/connect/signup/company',
    name: 'signup-company',
    component: () => import('./pages/CompanyPage.vue'),
  },
  {
    path: '/connect/partners',
    name: 'results',
    component: () => import('./pages/ResultsPage.vue'),
  },
  // The pack catalogue. A pack's detail opens as a dialog OVER this screen and
  // carries its id in `?pack=`, so a detail view is linkable, Back closes it,
  // and a shared link opens the right pack — none of which a dialog with no
  // route can do.
  { path: '/connect/packs', name: 'packs', component: () => import('./pages/PacksPage.vue') },
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
