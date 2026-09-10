<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { Avatar, Button } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import SelectedServiceCard from '../components/SelectedServiceCard.vue'
import TierIcon from '../components/TierIcon.vue'
import IconCheck from '~icons/lucide/check'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconRate from '~icons/lucide/circle-dollar-sign'
import IconStar from '~icons/lucide/star'
import IconClock from '~icons/lucide/clock'
import { PARTNERS } from '../data/partners'
import { logoFor } from '../data/logos'
import { STARTER_PACKS, marketFor, DEFAULT_REGION } from '../data/packs'
import { messagesToast } from '../feedback'
import { useConnectStore } from '../stores/connect'

// SCREEN — booked. The end of the journey, and the first place the model's
// promise is actually kept: Frappe said it would assign you a partner, and this
// names them.
//
// ⚠️ Both the pack and the PARTNER are in the URL, not just the store. Same
// reason as the confirmation screen before it: the store is in memory, and this
// is the screen someone screenshots, bookmarks or forwards. An assignment that
// changed on reload would be worse than one that was never shown.
const store = useConnectStore()
const route = useRoute()

const pack = computed(
  () => STARTER_PACKS.find((p) => p.value === (route.query.pack ?? store.pack)) ?? null,
)
const partner = computed(() => PARTNERS.find((p) => p.id === route.query.partner) ?? null)

const region = computed(
  () => marketFor(store.filters.countries[0]) ?? store.answers.region[0] ?? DEFAULT_REGION,
)

watchEffect(() => {
  if (pack.value && store.pack !== pack.value.value) store.selectPack(pack.value.value)
})

const logo = computed(() => (partner.value ? logoFor(partner.value.id) : null))

// The same three facts the listing row carries, in the same order and with the
// same icons — this card is that row, framed. See `PartnerRow`.
const facts = computed(() => {
  const p = partner.value
  if (!p) return []
  return [
    { icon: IconRate, text: p.rate ? `From $${p.rate}/hr` : 'Rate undisclosed', muted: !p.rate },
    { icon: IconStar, text: `${p.rating}`, sub: `(${p.reviews})` },
    { icon: IconClock, text: `Typically ${p.responds}` },
  ]
})

// "Expertise across A, B, C and N more" — the wireframe's line, and a different
// claim from the listing's "N success stories across…". Success stories are
// counted evidence; this is what they were hired for.
const SHOWN = 3
const expertise = computed(() => {
  const industries = partner.value?.industries ?? []
  const rest = Math.max(industries.length - SHOWN, 0)
  return { lead: industries.slice(0, SHOWN).join(', '), rest }
})

// First name only — "Tridots will be in contact", not "Tridots Tech Pvt Ltd
// will be in contact". A sentence about a person you are about to meet.
const shortName = computed(() => partner.value?.name.split(' ')[0] ?? 'Your partner')
</script>

<template>
  <ConnectShell root-label="Starter packs" root-to="/connect/packs" crumb="Confirmed">
    <!-- Full width to 1440. The card rides the page's right padding and the
         600px reading column is placed by `.fc-split`'s own left padding, so
         this cap only decides where the gutter stops growing. -->
    <div class="mx-auto w-full max-w-[1440px] px-5 py-8 lg:px-10">
      <div v-if="!pack || !partner" class="py-20 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">Nothing to show here</p>
        <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
          This link doesn't name a booking. Start from the packs and this is where you'll land.
        </p>
        <Button class="mt-4" variant="solid" label="See the packs" :route="'/connect/packs'" />
      </div>

      <div v-else class="fc-split">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold text-ink-gray-8">Confirmed!</h1>
          <!-- Two short sentences, and the second one's job is to hand off to
               the card rather than to summarise it.
               "Frappe has assigned you a partner" was the previous try and it
               reads like an allocation — a desk you were given. The second
               sentence also restated what the card underneath already shows,
               which made the card read as a repeat instead of the answer.
               (The wireframe's original, "This will connect you with the ideal
               Partner for your needs", was future tense on a page that says the
               connecting is done.) -->
          <p class="mt-1 text-p-base text-ink-gray-6">
            Your {{ pack.name }} pack is booked. Here is who you will work with.
          </p>

          <!-- ⚠️ NOT the listing row's structure, and that's the one place it
               departs. There the avatar indents everything beside it, because a
               row is scanned down a column of identical rows and the indent is
               what separates one from the next. This is a single card, so only
               the IDENTITY sits beside the avatar — the name and the city, which
               are what the mark is a picture of. The facts, the expertise line
               and the button belong to the card rather than to the logo, and
               they start where the avatar starts.
               Everything else is the row's: same 40px `2xl` avatar at 8px
               radius, same three facts with the same icons, same 2/12/4 rhythm.
               16px of padding, and a border rather than the row's hover fill —
               nothing here is a list, so there is nothing to hover between. -->
          <article class="mt-6 rounded-6 border border-outline-gray-2 p-4">
            <!-- The identity: the mark and what it names. -->
            <div class="flex items-start gap-3">
              <Avatar
                v-if="logo"
                :image="logo"
                :label="`${partner.name} logo`"
                size="2xl"
                shape="square"
                class="fc-logo-avatar"
              />
              <!-- Not an `Avatar`: its fallback renders `label[0]` on a theme
                   surface, and this is two initials on the partner's own brand
                   colour. Same 40px and 8px radius as `2xl`. -->
              <div
                v-else
                class="flex size-10 shrink-0 items-center justify-center rounded-4 text-xs font-semibold text-white"
                :style="{ backgroundColor: partner.color }"
                aria-hidden="true"
              >
                {{ partner.initials }}
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 class="text-lg font-medium text-ink-gray-8">{{ partner.name }}</h2>
                  <TierIcon :tier="partner.tier" />
                </div>
                <p class="mt-0.5 text-p-sm text-ink-gray-6">{{ partner.city }}</p>
              </div>
            </div>

            <!-- Full width from here, flush with the avatar's left edge. -->
            <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-p-sm text-ink-gray-7">
              <span v-for="f in facts" :key="f.text" class="flex items-center gap-1">
                <component :is="f.icon" class="size-3.5 shrink-0 text-ink-gray-6" />
                <span :class="f.muted ? 'text-ink-gray-5' : ''">{{ f.text }}</span>
                <span v-if="f.sub" class="text-ink-gray-5">{{ f.sub }}</span>
              </span>
            </div>

            <!-- The tail can't break. Wrapping it stranded "more" alone on a
                 second line; the listing solves the same problem by pinning its
                 tail and truncating the lead, and here the line is allowed to
                 wrap so the tail just has to stay whole. -->
            <p class="mt-1 text-p-sm text-ink-gray-6">
              Expertise across {{ expertise.lead }}
              <span v-if="expertise.rest" class="whitespace-nowrap">
                and {{ expertise.rest }} more
              </span>
            </p>

            <Button
              class="mt-4"
              variant="subtle"
              size="sm"
              label="View full profile"
              :route="`/connect/partners/${partner.id}`"
            >
              <template #suffix><IconChevronRight class="size-4" /></template>
            </Button>
          </article>

          <!-- What has happened, in the order it happened. Ticks rather than
               numbers: the numbered list on the screen before was a sequence
               still to come, this is a receipt. -->
          <ul class="mt-6 space-y-2">
            <li class="flex items-start gap-2 text-p-base text-ink-gray-7">
              <IconCheck class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
              <span>
                Project details sent via
                <!-- ⚠️ Subtle by instruction, and a button rather than a link
                     because the messages screen doesn't exist yet — it raises
                     the same toast every other route into messages does. It
                     reads as part of the sentence rather than a control
                     competing with "View full profile" above it: a grey
                     underline that darkens on hover, no fill, no chevron.

                     ⚠️ `decoration-[var(--outline-gray-3)]`, NOT
                     `decoration-outline-gray-3`. The `outline-*` scale is
                     border-only — the utility emits no rule at all, which left
                     the underline at full-strength ink, the loudest possible
                     version of the quietest thing on the page. Measured: no
                     matching CSS rule was generated. See FRAPPE-UI-NOTES.md. -->
                <button
                  type="button"
                  class="rounded-1 text-ink-gray-8 underline decoration-[var(--outline-gray-3)] underline-offset-2 transition-colors hover:decoration-[var(--outline-gray-4)]"
                  @click="messagesToast"
                >
                  Messaging
                </button>
              </span>
            </li>
            <li class="flex items-start gap-2 text-p-base text-ink-gray-7">
              <IconCheck class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
              <span>Introductory call booked</span>
            </li>
            <li class="flex items-start gap-2 text-p-base text-ink-gray-7">
              <IconCheck class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
              <span>{{ shortName }} will be in contact with you soon</span>
            </li>
          </ul>
        </div>

        <SelectedServiceCard :pack="pack" :region="region" />
      </div>
    </div>
  </ConnectShell>
</template>
