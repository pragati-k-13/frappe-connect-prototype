<script setup>
// SCREEN 6 — the partner profile.
//
// ⚠️ TOP SECTION ONLY. The header, the media gallery and the client strip are
// built; the About / Services and Expertise cards below them are the next
// section and are deliberately absent rather than stubbed — an empty card reads
// as a bug in review, a missing one reads as "not yet".

import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Button, Tooltip } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import TierIcon from '../components/TierIcon.vue'
import MediaGallery from '../components/MediaGallery.vue'
import ClientStrip from '../components/ClientStrip.vue'
import PartnerAboutCard from '../components/PartnerAboutCard.vue'
import PartnerVisionSection from '../components/PartnerVisionSection.vue'
import PartnerPricingSection from '../components/PartnerPricingSection.vue'
import PartnerReviewsSection from '../components/PartnerReviewsSection.vue'
import PartnerStoriesSection from '../components/PartnerStoriesSection.vue'
import PartnerMarketplaceSection from '../components/PartnerMarketplaceSection.vue'
import BookSlotDialog from '../components/BookSlotDialog.vue'
import { PARTNERS } from '../data/partners'
import { logoFor } from '../data/logos'
import { clientsFor, mediaFor } from '../data/media'

const route = useRoute()
const router = useRouter()

const partner = computed(() => PARTNERS.find((p) => p.id === route.params.id) ?? null)
const logo = computed(() => (partner.value ? logoFor(partner.value.id) : null))
const media = computed(() => (partner.value ? mediaFor(partner.value.id) : []))
const clients = computed(() => (partner.value ? clientsFor(partner.value.id) : []))

// The partner's own strapline. This used to fall back to a generated
// "city · N success stories" line, which restated two things the page already
// shows — the address is in the About card and the count is the Success
// stories title. Every partner now carries a tagline (⚠️ twelve of them
// invented, see `data/partners.js`); `city` is the last resort only so a
// partner added without one doesn't render a blank line.
const subtitle = computed(() => {
  if (!partner.value) return ''
  return partner.value.tagline ?? partner.value.city
})

// Local to the mock, same as the row's bookmark — a real build writes to the
// visitor's saved partners. Not shared with the row's state on purpose: wiring one
// boolean across two screens would imply persistence this mock doesn't have.
const saved = ref(false)
const booking = ref(false)
</script>

<template>
  <ConnectShell :crumb="partner?.name">
    <!-- Unknown id: a real 404 rather than a blank page, with the way back. -->
    <div v-if="!partner" class="mx-auto w-full max-w-[800px] px-5 py-20 text-center lg:px-10">
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

    <div v-else class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
      <!-- ── Header ──────────────────────────────────────────────────────
           Identity left, actions right. The actions are ordered by weight, not
           by frequency: Contact is the page's one solid button because it is
           the outcome the whole directory exists to produce, and the other two
           are subtle and icon-only so they don't compete with it. -->
      <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div class="flex min-w-0 items-start gap-3">
          <!-- `Avatar` at `2xl`, same as the listing row: 40px, `rounded-[8px]`.
               `.fc-logo-avatar` flips its `object-cover` to `contain` — see
               `index.css`. -->
          <Avatar
            v-if="logo"
            :image="logo"
            :label="`${partner.name} logo`"
            size="2xl"
            shape="square"
            class="fc-logo-avatar"
          />
          <div
            v-else
            class="flex size-10 shrink-0 items-center justify-center rounded-4 text-p-base font-semibold text-white"
            :style="{ backgroundColor: partner.color }"
            aria-hidden="true"
          >
            {{ partner.initials }}
          </div>

          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 class="text-xl font-semibold text-ink-gray-9">
                {{ partner.name }}
              </h1>
              <TierIcon :tier="partner.tier" />
            </div>
            <p class="mt-1 text-p-base text-ink-gray-6">{{ subtitle }}</p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <Tooltip text="Book a slot">
            <Button variant="subtle" aria-label="Book a slot" @click="booking = true">
              <template #icon><LucideCalendar class="size-4" /></template>
            </Button>
          </Tooltip>
          <!-- Same control, same word, same stateful aria-label as the row's
               bookmark — see `PartnerRow.vue`. -->
          <Tooltip text="Save">
            <Button
              variant="subtle"
              :aria-pressed="saved"
              :aria-label="saved ? `Remove ${partner.name} from saved` : `Save ${partner.name}`"
              @click="saved = !saved"
            >
              <template #icon>
                <LucideBookmark class="size-4" :class="saved ? 'fill-current' : ''" />
              </template>
            </Button>
          </Tooltip>
          <!-- ⚠️ Inert. This goes to the in-app messages screen, which doesn't
               exist yet — deliberately not routed to a stub, so the gap stays
               visible instead of looking finished. -->
          <Button variant="solid" label="Contact">
            <template #prefix><LucideSend class="size-4" /></template>
          </Button>
        </div>
      </div>

      <!-- ── Media ───────────────────────────────────────────────────────
           Directly under the header with no section label: it's the partner
           showing you their work, not a titled block. -->
      <div class="mt-6">
        <MediaGallery :items="media" />
      </div>

      <!-- ── Clients ─────────────────────────────────────────────────────
           No heading either. A row of client marks reads as "these are their
           clients" without being told, and a label would give the strip more
           weight in the page than it has earned. -->
      <div v-if="clients.length" class="mx-auto mt-10 max-w-[600px]">
        <ClientStrip :clients="clients" :visible="5" />
      </div>

      <!-- ── About / Services and Expertise ──────────────────────────────
           The first framed block on the page. Everything above it is the
           partner presenting themselves; this is the specification, and the
           frame is what marks the change of register. -->
      <div class="mt-16">
        <PartnerAboutCard :partner="partner" />
      </div>

      <!-- ── Partner vision ──────────────────────────────────────────────
           Back to unframed, after the card. The card is the specification;
           this is the partner talking, so it reads better without a border
           around it. -->
      <div class="mt-24">
        <PartnerVisionSection :partner="partner" />
      </div>

      <!-- ── Pricing ─────────────────────────────────────────────────────
           Same 96px break as the section above it, so the page's own sections
           are spaced consistently rather than by how tall each one happens to
           be. -->
      <div class="mt-24">
        <PartnerPricingSection :partner="partner" />
      </div>

      <!-- ── Reviews ─────────────────────────────────────────────────────
           Last, and after the pricing: what it costs is the partner's claim,
           what it was like is somebody else's. -->
      <div class="mt-24">
        <PartnerReviewsSection :partner="partner" />
      </div>

      <!-- ── Success stories ─────────────────────────────────────────────
           After the reviews. The reviews are other people's account of the
           partner and the stories are the partner's own, so the independent
           evidence reads first and the case studies expand on it. -->
      <div class="mt-24">
        <PartnerStoriesSection :partner="partner" />
      </div>

      <!-- Last, and it renders for only eight of the thirteen partners. What a
           partner has published to the marketplace isn't about the engagement
           you're weighing up — it's evidence of what they build unpaid — so it
           comes after everything that is.

           ⚠️ No wrapper div, unlike every section above. This is the only
           section that can be absent, and an empty `<div class="mt-24">` still
           contributes its margin (a block with no height, border or padding
           collapses its margins THROUGH itself), which left 96px of dead space
           at the foot of five profiles. So this one owns its own top margin. -->
      <PartnerMarketplaceSection :partner="partner" />
    </div>

    <BookSlotDialog v-if="partner" :open="booking" :partner="partner" @close="booking = false" />
  </ConnectShell>
</template>
