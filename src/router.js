import { createRouter, createWebHistory } from 'vue-router'
import { useConnectStore } from './stores/connect'

// One route per screen in the handoff.
//
// `/` is the frappe.io partners page — the discovery surface, not part of the
// app. Every link it has into `/connect` opens in a NEW TAB, matching the
// design: Frappe Connect is a separate destination, not a section of the
// marketing site.
const routes = [
  { path: '/', name: 'website', component: () => import('./pages/FrappeSitePage.vue') },
  // frappe.io/contact — the OTHER discovery surface, and the reason it is
  // mocked at all: a large share of implementation leads arrive here rather
  // than on the partners page, and they arrive with a question rather than an
  // intention to buy. It is not part of Frappe Connect; it triages into it.
  { path: '/contact', name: 'site-contact', component: () => import('./pages/ContactSitePage.vue') },
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
  // What the intake adds up to, and the basket it produces. This replaced
  // `/connect/confirm`, which confirmed ONE pack: the recommendation screen is
  // where packs are ticked, totalled and paid for, so a separate confirm step
  // between the two was a screen that only said the same thing again.
  //
  // ⚠️ NOT GUARDED, and nothing on it is. It is reachable signed-out on
  // purpose — someone who has answered three questions is owed the answer
  // before being asked to make an account. The gate is on Checkout.
  {
    path: '/connect/recommendation',
    name: 'recommendation',
    component: () => import('./pages/RecommendPage.vue'),
  },
  // Where the money moves: the basket, a payment method, and the handoff to
  // Stripe. The basket is in the store rather than the URL — it is a list now,
  // and a query string carrying three pack ids is a URL nobody can read and
  // everybody can edit.
  {
    path: '/connect/checkout',
    name: 'checkout',
    component: () => import('./pages/CheckoutPage.vue'),
    // ⚠️ Guarded, like the confirmation after it. Paying creates a project and
    // a conversation with an assigned partner, and both are facts about an
    // ACCOUNT — a signed-out visitor on this URL has nowhere to keep what they
    // are about to buy. Sign-up carrying `?next=`, so the flow the gate
    // interrupted resumes here rather than at the top of the catalogue.
    beforeEnter: (to) => {
      const store = useConnectStore()
      return store.signedIn ? true : { name: 'signup', query: { next: to.fullPath } }
    },
  },
  // The processor's own page, as a full screen rather than a modal over ours.
  // ⚠️ THE FICTION IS THAT YOU HAVE LEFT. Stripe hosts its checkout, which is
  // the entire reason a card number never reaches this application — so drawing
  // it as a dialog floating over our own chrome would be drawing a lie. It
  // takes no app shell, no sidebar and no back button of ours.
  {
    path: '/connect/checkout/pay',
    name: 'pay',
    component: () => import('./pages/StripeCheckoutPage.vue'),
    beforeEnter: (to) => {
      const store = useConnectStore()
      return store.signedIn ? true : { name: 'signup', query: { next: to.fullPath } }
    },
  },
  // The end of the journey: who Frappe assigned you, and what happens next.
  // Both `?pack=` and `?partner=` are in the URL — this is the screen someone
  // screenshots or forwards, and an assignment that changed on reload would be
  // worse than one never shown.
  {
    path: '/connect/confirmed',
    name: 'confirmed',
    component: () => import('./pages/ConfirmedPage.vue'),
    // ⚠️ The one guarded route in the app. This screen says a pack is booked
    // and names the partner assigned to you — both facts about an ACCOUNT — so
    // a signed-out visitor reaching it by URL would be shown someone's booking
    // or, worse, their own booking made without an account to keep it in.
    //
    // Sign-up rather than the catalogue, carrying `?next=`: someone on this URL
    // is far more likely to be a customer who lost their session than a stranger
    // guessing paths, and dropping them on the packs list would throw the link
    // away. `useConnectStore()` is safe here — `main.js` installs Pinia before
    // the router, so the store exists by the time any navigation resolves.
    //
    // ⚠️ This is the LAST line of defence, not the first. The gate that matters
    // is one screen earlier — the pack page's "Continue to checkout" sends a
    // signed-out visitor to sign-up, and `/connect/checkout` guards itself the
    // same way this does, because paying for a pack creates a project and a
    // conversation with nowhere to live without an account.
    beforeEnter: (to) => {
      const store = useConnectStore()
      return store.signedIn ? true : { name: 'signup', query: { next: to.fullPath } }
    },
  },
  // The inbox. `?thread=` names the open conversation, for the same reason
  // `?pack=` names the pack two screens earlier: reloading should not lose
  // which one you were reading, and a thread should be linkable.
  {
    path: '/connect/messages',
    name: 'messages',
    component: () => import('./pages/MessagesPage.vue'),
  },
  // The collaboration half of the product: everything the account is tracking.
  //
  // A LIST and a detail, not one screen. A business routinely has more than one
  // thing on — a pack running while a custom piece is being scoped — and the
  // rail's "Implementation" row, inert until now, is this index.
  {
    path: '/connect/projects',
    name: 'projects',
    component: () => import('./pages/ProjectsPage.vue'),
  },
  // ⚠️ `:id` is the project's own id, not a slug: projects are named by the
  // people who own them and two can share a name. It is also not guarded, on
  // the same reasoning as every other in-app screen — an unknown id renders an
  // empty state that can be recovered from, which is better than a redirect
  // that throws the link away. Nothing here is a fact about anyone until the
  // store has a project under that id.
  {
    path: '/connect/projects/:id',
    name: 'project',
    component: () => import('./pages/ProjectPage.vue'),
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
  // A pack's own scope document, terms and price. Nested under the catalogue
  // and addressed by the pack's `value`, exactly as a partner profile is
  // addressed by its slug — this used to be `/connect/confirm?pack=`, a URL
  // named after a gesture the page no longer performs.
  {
    path: '/connect/packs/:id',
    name: 'pack',
    component: () => import('./pages/PackDetailPage.vue'),
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
