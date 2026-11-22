<script setup>
// SCREEN 6 — the partner profile, as a business reads it in the directory.
//
// The body is `PartnerProfileBody`, shared with the partner's own page, so
// what the partner publishes and previews is what shows here. This page adds
// only the header's Save and Contact, the chrome's stand-in Contact, and the
// 404.

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PartnerProfileBody from '../components/PartnerProfileBody.vue'
import PageCrumbs from '../components/PageCrumbs.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import SaveButton from '../components/SaveButton.vue'
import { PARTNERS } from '../data/partners'
import { takingWork } from '../data/takingWork'
import { logoFor } from '../data/logos'
import { clientsFor, mediaFor } from '../data/media'
import { useContactPartner } from '../utils/contact'

const route = useRoute()
const router = useRouter()

const account = usePartnerAccountStore()
// The seed, with whatever the partner has published on top.
const published = computed(() => account.published(route.params.id))
const partner = computed(() => {
  const p = PARTNERS.find((x) => x.id === route.params.id)
  return p ? { ...p, ...published.value.profile } : null
})
// A firm that isn't taking new work is only reached by a link or from Saved:
// the page stays, without Contact. Save stays, for when it's back.
const open = computed(() => takingWork(partner.value))
const logo = computed(() => (partner.value ? logoFor(partner.value.id) : null))
const media = computed(() => (partner.value ? (published.value.media ?? mediaFor(partner.value.id)) : []))
const logos = computed(() => (partner.value ? (published.value.logos ?? clientsFor(partner.value.id)) : []))

const store = useConnectStore()
const { contactPartner } = useContactPartner()

// ── Does the page's own Contact still show? ──────────────────────────────────
// The chrome's Contact is a STAND-IN for the one in the page header, not a
// second copy of it: two identical buttons a centimetre apart, both saying
// Contact, is one button too many. So the chrome's only appears once the real
// one has scrolled out of view.
//
// `IntersectionObserver` rather than a scroll handler: it fires only on the
// crossing rather than on every frame of the scroll, and it needs no knowledge
// of where the button sits or how tall the header above it is. Ancestor
// overflow clipping counts as part of the intersection, which is what makes
// `root: null` correct here even though the page scrolls inside the shell's
// `ScrollArea` rather than the window.
const pageContact = ref(null)
const pageContactVisible = ref(true)

// ⚠️ Watched rather than set up in `onMounted`. The ref is null on the 404
// branch and is REPLACED when you navigate from one profile to another, which
// reuses this component rather than remounting it — an observer bound once at
// mount would be left watching a detached node from the previous partner.
let observer = null
watch(pageContact, (el) => {
  observer?.disconnect()
  observer = null
  // Nothing to watch (the 404 branch): leave the chrome's button showing, since
  // there is no page-level one to defer to.
  const node = el?.$el ?? el
  if (!node) {
    pageContactVisible.value = false
    return
  }
  observer = new IntersectionObserver(([entry]) => {
    pageContactVisible.value = entry.isIntersecting
  })
  observer.observe(node)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <ConnectShell :crumb="partner?.name">
    <!-- The chrome's trailing control, taken over from the shell's default auth
         CTA. Contact is what this whole page is for, and the page's own Contact
         sits in the header at the very top — which is off screen for most of a
         profile this long. This one doesn't scroll away, so the action stays
         reachable from the reviews, the pricing and the founding story at the
         foot.

         Ghost, matching the control it replaces and for the same reason: a
         solid button in the chrome would outrank the page's own solid Contact,
         and the two would be competing for the same click.

         ⚠️ `v-if` on the slot template, not on the Button. It has to be the
         SLOT that goes away on the 404 branch, or the shell sees a provided
         slot, skips its fallback, and a visitor who followed a dead link gets a
         bar with no control in it at all.

         Signed out this opens the login prompt first, exactly like the page's
         own Contact — which is what keeps the sign-in path intact on a screen
         that has taken the auth CTA out of the chrome. -->
    <template v-if="partner" #action>
      <!-- ⚠️ The `v-if` for the scroll state goes on the BUTTON, while the one
           for the 404 stays on the template above. They are not
           interchangeable: an absent SLOT makes the shell fall back to its auth
           CTA, so putting the scroll test up there would swap "Contact" for
           "Log in or create account" every time you scrolled back to the top.
           An empty provided slot is what we want here — the page's own Contact
           is on screen, so the bar should simply be quiet. -->
      <Transition
        enter-active-class="motion-safe:transition-opacity motion-safe:duration-150"
        leave-active-class="motion-safe:transition-opacity motion-safe:duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <Button
          v-if="open && !pageContactVisible"
          variant="ghost"
          class="-mr-2"
          label="Contact"
          @click="contactPartner(partner)"
        >
          <template #suffix><LucideArrowRight class="size-4" /></template>
        </Button>
      </Transition>
    </template>

    <!-- Unknown id: a real 404 rather than a blank page, with the way back. -->
    <div v-if="!partner" class="fc-page-read py-20 text-center">
      <p class="text-p-lg font-medium text-ink-gray-8">No such partner</p>
      <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
        The link may be out of date, or the partner may have left the programme.
      </p>
      <div class="mt-4">
        <Button
          variant="subtle"
          label="Back to all partners"
          @click="router.push('/connect/partners')"
        />
      </div>
    </div>

    <PartnerProfileBody
      v-else
      :partner="partner"
      :logo="logo"
      :media="media"
      :logos="logos"
      :replies="published.replies"
      :reviews-to="`/connect/partners/${partner.id}/reviews`"
    >
      <!-- Ordered by weight: Contact is the page's one solid button, the
           outcome the directory exists for; Save is subtle and icon-only. -->
      <template #crumbs><PageCrumbs /></template>
      <template #actions>
        <!-- Same control, same word, same stateful aria-label as the row's
             bookmark — see `PartnerRow.vue`. -->
        <SaveButton :partner="partner" variant="subtle" />
        <!-- The same message bubble the listing row's Contact carries: one
             action, one mark. -->
        <Button v-if="open" ref="pageContact" variant="solid" label="Contact" @click="contactPartner(partner)">
          <template #prefix><LucideMessageSquare class="size-4" /></template>
        </Button>
      </template>
    </PartnerProfileBody>
  </ConnectShell>
</template>
