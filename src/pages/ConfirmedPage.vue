<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { Avatar, Badge, Button, ScrollArea, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PackPanel from '../components/PackPanel.vue'
import TierIcon from '../components/TierIcon.vue'
import IconActivity from '~icons/lucide/zap'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconRate from '~icons/lucide/circle-dollar-sign'
import IconStar from '~icons/lucide/star'
import IconClock from '~icons/lucide/clock'
import { PARTNERS } from '../data/partners'
import { logoFor } from '../data/logos'
import { STARTER_PACKS, marketFor, DEFAULT_REGION } from '../data/packs'
import { projectName, stageOf } from '../data/project'
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

// ── The activity feed ──────────────────────────────────────────────────────
// ⚠️ Everything here ALREADY HAPPENED, and all of it happened at once: this is
// the receipt for the click on the screen before, not a live feed. It replaces
// a checklist of ticks that said the same three things without saying when.
//
// The stage is the project's own (`data/project.js`), not a CRM funnel: a
// business that just bought a pack is not a "Proposal".
const project = computed(() => store.project)
const stage = computed(() => stageOf(project.value?.stage))
const title = computed(() =>
  pack.value ? projectName(pack.value, store.company.name || store.viewer.company) : '',
)

// A URL-only arrival (a forwarded link, a reload) has no project behind it, so
// the feed times itself from the page rather than claiming a moment it cannot
// know.
const openedAt = Date.now()
const at = computed(() => project.value?.at ?? openedAt)

const since = (ms) => {
  const mins = Math.floor((Date.now() - ms) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Three entries, in the order they read rather than the order they fired —
// everything here happened in the same click. Each card carries something
// different: the thread you can open, and the project with its stage.
const activity = computed(() => {
  if (!pack.value || !partner.value) return []
  return [
    {
      key: 'details',
      kind: 'details',
      card: {
        label: `${pack.value.name} Starter Pack`,
        to: { name: 'messages', query: { thread: partner.value.id } },
      },
    },
    { key: 'call', kind: 'call' },
    { key: 'created', kind: 'created', card: { label: title.value, badge: stage.value.label } },
  ]
})

const toastOnce = (title, description) => toast.info(title, { id: 'confirmed', description })

// ⚠️ Both inert, and saying so. Booking a slot is the primary action here and
// its design is still to come; cancelling a paid booking has terms behind it
// that nobody has written. A control that swallows a click reads as broken.
const bookSlot = () =>
  toastOnce(
    'Slot booking is not built yet',
    `This is where you would pick a time with ${shortName.value}.`,
  )
const cancel = () =>
  toastOnce('Cancelling is not built yet', 'This is where a booked pack would be called off.')
</script>

<template>
  <!-- ⚠️ `flush`, because the pack panel is part of the CHROME now rather than a
       card in the page: it runs the full height beside the content, with its own
       scroll, and the page scrolls under it. Same frame the messages screen
       uses, and the same reason. -->
  <ConnectShell flush root-label="Starter packs" root-to="/connect/packs" crumb="Confirmed">
    <div class="flex min-h-0 min-w-0 flex-1">
      <ScrollArea class="min-h-0 min-w-0 flex-1">
        <div class="w-full px-10 py-8">
          <div v-if="!pack || !partner" class="py-20 text-center">
            <p class="text-p-lg font-medium text-ink-gray-8">Nothing to show here</p>
            <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
              This link doesn't name a booking. Start from the packs and this is where you'll land.
            </p>
            <Button class="mt-4" variant="solid" label="See the packs" :route="'/connect/packs'" />
          </div>

          <div v-else class="w-full">
            <h1 class="text-lg font-semibold text-ink-gray-8">Confirmed!</h1>
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
              <div
                class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-p-sm text-ink-gray-7"
              >
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

            <!-- ⚠️ Book a slot is the PRIMARY action on this screen: the pack is
               paid for later and the partner is already assigned, so the only
               thing left to do here is meet them. -->
            <div class="mt-6 flex items-center gap-2">
              <Button variant="solid" label="Book a slot" @click="bookSlot" />
              <Button variant="subtle" label="Cancel" @click="cancel" />
            </div>

            <!-- ── What has happened ───────────────────────────────────────
               A feed, not a checklist. The ticks said the same three things
               without saying when, and without the project they belong to. -->
            <section class="mt-8">
              <h2 class="text-base font-medium text-ink-gray-8">Activity</h2>

              <ol class="mt-4">
                <li v-for="row in activity" :key="row.key" class="group relative flex gap-3 pb-5">
                  <!-- The connector, not a decoration: it is what makes three
                     entries read as one project's history rather than three
                     notices. Hidden on the last row, which has nothing to
                     connect to. -->
                  <span
                    class="absolute bottom-0 left-[11px] top-6 w-px bg-outline-gray-2 group-last:hidden"
                    aria-hidden="true"
                  />
                  <span
                    class="relative z-10 mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full bg-surface-gray-2 text-ink-gray-6"
                  >
                    <IconActivity class="size-3.5" />
                  </span>

                  <div class="min-w-0 flex-1">
                    <!-- `gap-x-1.5` rather than spaces in the markup: Vue drops
                         the whitespace between two elements on their own lines,
                         which welded the separator to whichever lead happened
                         to end in a tag. -->
                    <p class="flex flex-wrap items-baseline gap-x-1.5 text-p-base text-ink-gray-7">
                      <span v-if="row.kind === 'details'">
                        Project details sent to {{ shortName }} via
                        <!-- ⚠️ Subtle by instruction, and still the quietest
                           control on the page: a grey underline that darkens on
                           hover, no fill, no chevron.
                           ⚠️ `decoration-[var(--outline-gray-3)]`, NOT
                           `decoration-outline-gray-3`. The `outline-*` scale is
                           border-only — that utility emits no rule at all,
                           which left the underline at full-strength ink. See
                           FRAPPE-UI-NOTES.md. -->
                        <RouterLink
                          class="rounded-1 text-ink-gray-8 underline decoration-[var(--outline-gray-3)] underline-offset-2 transition-colors hover:decoration-[var(--outline-gray-4)]"
                          :to="{ name: 'messages', query: { thread: partner.id } }"
                        >
                          Messaging
                        </RouterLink>
                      </span>
                      <span v-else-if="row.kind === 'call'">Introductory call requested</span>
                      <span v-else>Project created</span>
                      <span class="text-ink-gray-5">·</span>
                      <span class="text-ink-gray-5">{{ since(at) }}</span>
                    </p>

                    <!-- The thing the entry is about, carried as a card so the
                       feed can be read without opening anything and acted on
                       without leaving. -->
                    <div
                      v-if="row.card"
                      class="mt-2 flex items-center gap-3 rounded-5 border border-outline-gray-2 px-3 py-2"
                    >
                      <span class="min-w-0 flex-1 truncate text-p-base text-ink-gray-7">
                        {{ row.card.label }}
                      </span>
                      <Badge
                        v-if="row.card.badge"
                        variant="subtle"
                        :theme="stage.theme"
                        size="sm"
                        :label="row.card.badge"
                      />
                      <Button
                        v-else-if="row.card.to"
                        variant="ghost"
                        size="sm"
                        label="View"
                        :route="row.card.to"
                      >
                        <template #suffix><IconChevronRight class="size-4" /></template>
                      </Button>
                    </div>
                  </div>
                </li>
              </ol>
            </section>

            <!-- Below `lg` the panel stacks under the page instead of beside it:
               a 360px column next to a 360px column is not a layout. `-mx-5`
               cancels the page padding so its own rules run edge to edge. -->
            <div class="-mx-10 mt-8 border-t border-outline-gray-1 lg:hidden">
              <PackPanel heading="Booked service" :pack="pack" :region="region" />
            </div>
          </div>
        </div>
      </ScrollArea>

      <aside
        v-if="pack && partner"
        class="hidden w-[360px] shrink-0 flex-col border-l border-outline-gray-1 lg:flex"
      >
        <ScrollArea class="min-h-0 flex-1">
          <PackPanel heading="Booked service" :pack="pack" :region="region" />
        </ScrollArea>
      </aside>
    </div>
  </ConnectShell>
</template>
