<!-- ⚠️ A plain `<script>` beside `<script setup>`: the draft and the step live
     at MODULE scope. Share sends a signed-out visitor to sign-up and back, and
     a quiz that rewound and emptied on the round trip would ask every question
     twice. -->
<script>
import { reactive, ref } from 'vue'
import { emptyCompanyForm } from '../data/company'

const form = reactive(emptyCompanyForm())
const step = ref(0)
</script>

<script setup>
// Contact partners — the custom door from Get started and the Connect home.
//
// ⚠️ THE CONTACT WIZARD'S STEPS, ON A PAGE. The same questions `NewProjectDialog`
// asks somebody messaging a partner with no project yet — who you are, how you
// work today, then the brief — minus "what are you trying to fix", which the
// brief's own "What do you want built?" asks better in the partner's terms.
// The fields are the same components, so a brief sent from here and one sent
// from a partner's profile carry the same answers.
//
// ⚠️ THE PANEL READS THE DRAFT, not the account. Its logos and its count narrow
// as the questions are answered, which is the reason it is beside them.
import { computed, onMounted, ref as vueRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Button, Dialog, FormControl, Progress, Textarea, toast } from 'frappe-ui'
import IconSend from '~icons/lucide/send'
// The Partners tab's own glyph, so the empty state names what is missing in
// the product's own vocabulary.
import IconPartners from '~icons/lucide/building-2'
import IconMapPin from '~icons/lucide/map-pin'
import IconBriefcase from '~icons/lucide/briefcase'
import IconCalendar from '~icons/lucide/calendar'
import IconAward from '~icons/lucide/award'
import IconUsers from '~icons/lucide/users'
import IconUser from '~icons/lucide/user-round'
import ConnectShell from '../components/ConnectShell.vue'
import CompanyQuestions from '../components/CompanyQuestions.vue'
import FilterChip from '../components/FilterChip.vue'
import { GEO_CHOICES, REGION_OF } from '../data/quiz'
import PartnerCriteriaFields from '../components/PartnerCriteriaFields.vue'
import { companyPayload, stepErrors } from '../data/company'
import {
  briefErrors,
  budgetBandsFor,
  criteriaLines,
  matchingPartners,
  scopeHint,
} from '../data/custom'
import { logoFor } from '../data/logos'
import { PARTNERS } from '../data/partners'
import { useConnectStore } from '../stores/connect'

const store = useConnectStore()
const route = useRoute()
const router = useRouter()

// Step 3 of the wizard — the problems checklist — is the one left out.
const STEPS = [1, 2, 'brief']
const current = computed(() => STEPS[step.value])
const last = computed(() => step.value === STEPS.length - 1)
const submitLabel = computed(() =>
  !last.value ? 'Continue' : store.signedIn ? 'View details' : 'Sign up to see partners',
)

const CRITERIA_ICONS = {
  'map-pin': IconMapPin,
  briefcase: IconBriefcase,
  calendar: IconCalendar,
  award: IconAward,
  users: IconUsers,
}

// Seeded from what the account already knows, then from "where we think you
// are". Only into empty fields, so a half-answered draft is left alone.
onMounted(() => {
  const known = store.company
  if (!form.country) form.country = known.country || store.inferredGeo.country
  if (!form.employees) form.employees = known.employees ?? ''
  if (!form.segments.length) form.segments = [...(known.segments ?? [])]
  if (!form.operations) form.operations = known.operations ?? ''
  if (!form.apps.length) form.apps = [...(known.apps ?? [])]
  // The region chips start where the business is — its country as a chip when
  // it has one (India), otherwise its region — so the first answer costs a
  // confirmation, not a decision. Only when nothing is picked yet.
  // Only the first time: once asked, leaving every chip off means anywhere.
  if (!store.brief.geoAsked) {
    const chip = GEO_CHOICES.find((c) => c.country === form.country)
    store.saveBrief(
      chip
        ? { countries: [form.country], geoAsked: true }
        : { regions: [REGION_OF[form.country]].filter(Boolean), geoAsked: true },
    )
  }
  // ⚠️ DEMO ONLY: a written brief, so a reviewer walking the flow does not have
  // to type one every time. Only into an empty box, so an edit survives. Delete
  // this line in a real build — the box should start empty.
  if (!store.brief.scope?.trim()) store.saveBrief({ scope: DEMO_SCOPE })
  // Back from sign-up with `?details=1`: reopen the dialog the gate stood in
  // front of, then drop the flag so Back and reload do not reopen it.
  // ⚠️ IT OPENS, IT DOES NOT SEND. The visitor presses Share themselves, so
  // the confirmation follows something they did rather than something done
  // for them while they were away.
  if (route.query.details && store.signedIn) {
    editing.value = false
    details.value = true
    const { details: _, ...query } = route.query
    router.replace({ query })
  }
})

// Invented, for the line above: a textile exporter's brief, written to cover
// every topic `scopeHint` asks about so the hint under the box reads as done.
const DEMO_SCOPE =
  'We make and export cotton fabric to buyers in Europe and the US, about 40 orders a month. Today it runs on Tally and spreadsheets, so stock by warehouse and batch is always out of date and GST invoices take a day to prepare. We need sales orders, purchase, batch-wise stock across two warehouses, GST invoicing, and a link to our Shopify store.'

const brief = computed(() => store.brief)

// One geo chip, either granularity: India flips `countries`, the rest `regions`.
const geoOn = (c) =>
  c.country ? (store.brief.countries ?? []).includes(c.country) : (store.brief.regions ?? []).includes(c.region)
const toggleGeo = (c) => {
  const key = c.country ? 'countries' : 'regions'
  const value = c.country ?? c.region
  const list = store.brief[key] ?? []
  store.saveBrief({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] })
}
const criteria = computed(() => criteriaLines(form, brief.value))
const matches = computed(() => matchingPartners(form, brief.value))
// ── The field ───────────────────────────────────────────────────────────────
// A centre seat and two rings around it, inner first. Each ring starts at its own angle so no
// two line up along a spoke — the stagger is what keeps it from reading as a
// grid bent into a circle. The outer ring runs past the panel's edge on
// purpose; the mask fades it out.
// ⚠️ SIZED TO THE DIRECTORY, so every ring is full. Every partner always has a
// seat (matches inside, the rest outside), so the seat count never changes —
// and a ring with more seats than partners left a gap on one side that broke
// the circle. One in the middle, six around it, the rest on the outer ring.
const RINGS = [
  { r: 0, n: 1, start: 0 },
  { r: 54, n: 6, start: -90 },
  { r: 106, n: Math.max(PARTNERS.length - 7, 0), start: -72 },
]
const SEATS = RINGS.flatMap(({ r, n, start }) =>
  Array.from({ length: n }, (_, i) => {
    const ring = RINGS.findIndex((x) => x.r === r)
    const a = ((start + (360 / n) * i) * Math.PI) / 180
    // Squashed vertically: the panel is wider than it is tall.
    return { ring, x: Math.round(Math.cos(a) * r * 1.1), y: Math.round(Math.sin(a) * r * 0.95) }
  }),
)
// ⚠️ A GAUSSIAN FALLOFF, by distance from the centre: 1 in the middle, about
// 0.3 on the outer ring. `SIGMA` is in the same px as the seats.
const SIGMA = 92
const falloff = ({ x, y }) => Math.exp(-(x * x + y * y) / (2 * SIGMA * SIGMA))

// Matches take the inner seats, in directory order, so a partner that still
// matches keeps its place relative to the others.
const seated = computed(() => {
  const on = new Set(matches.value.map((p) => p.id))
  const order = [...PARTNERS.filter((p) => on.has(p.id)), ...PARTNERS.filter((p) => !on.has(p.id))]
  return order.slice(0, SEATS.length).map((partner, i) => {
    const seat = SEATS[i]
    const match = on.has(partner.id)
    return {
      partner,
      on: match,
      ...seat,
      // One bell curve drives opacity: full in the middle, fainter the further
      // out. A partner that does not match starts fainter still, and its
      // silhouette is lighter (see `.fc-seat` below).
      // ⚠️ NOTHING AT ZERO. Faded logos beside a count of 0 still say "there
      // are firms here", which is the one thing that is not true.
      opacity: matches.value.length ? (match ? 1 : 0.5) * falloff(seat) : 0,
    }
  })
})
const bands = computed(() => budgetBandsFor(form.country))
const hint = computed(() => scopeHint(brief.value.scope))

// ⚠️ Errors wait for the first press on each step, as on every form here.
const tried = vueRef(false)
const errorsFor = (s) => (s === 'brief' ? briefErrors(brief.value) : stepErrors(form, s))
const errors = computed(() => (tried.value ? errorsFor(current.value) : {}))

const next = () => {
  tried.value = true
  if (Object.keys(errorsFor(current.value)).length) return
  tried.value = false
  if (last.value) {
    // ⚠️ THE ACCOUNT IS ASKED FOR HERE, BEFORE THE COMMITMENT. Share used to
    // send a signed-out visitor to sign-up and send on their return, so the
    // brief went out while nobody was looking and the confirmation reported
    // something they never saw happen. Now the gate stands in front of the
    // dialog; the answers, the step and the brief live at module scope and
    // survive the round trip.
    if (!store.signedIn) {
      return router.push({
        name: 'signup',
        query: { next: '/connect/partners/contact?details=1' },
      })
    }
    editing.value = false
    details.value = true
    return
  }
  step.value += 1
}
const back = () => {
  tried.value = false
  step.value -= 1
}

// ── The details dialog ──────────────────────────────────────────────────────
// Who it goes to, and the one commitment. "Edit criteria" swaps the list for
// the criteria's own fields in place, rather than opening a dialog over a
// dialog; Share stays at the foot either way.
const details = vueRef(false)
const editing = vueRef(false)

const share = () => {
  // ⚠️ `narrow: false`. These answers describe the business; writing them into
  // the directory's filters would leave "View all" showing some.
  store.saveCompany(companyPayload(form), { narrow: false })
  const id = store.startCustomProject()
  const result = store.broadcastBrief(id)
  toast.success(`Sent to ${result.sent} ${result.sent === 1 ? 'partner' : 'partners'}`, {
    description: 'Their replies come back as quotes. Mark the ones you want to take forward as Interested.',
  })
  details.value = false
  step.value = 0
  router.push({ name: 'brief-sent', query: { project: id } })
}
</script>

<template>
  <ConnectShell crumb="Contact partners">
    <!-- ⚠️ BALANCED, NOT HALF AND HALF. The questions take 440px and the
         picture the rest of a 1120px page — about 600px — at a fixed 5:4, so it
         reads as a companion to the form rather than a wall behind it. The two
         are centred on each other, which is what makes them one composition, and
         sit a little above the window's middle — `pb-[16vh]` — where the eye
         lands first. -->
    <div
      class="mx-auto grid w-full max-w-[1120px] content-center items-center gap-10 px-5 py-10 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-16 lg:px-10 lg:pb-[16vh]"
    >
        <!-- ── The quiz ─────────────────────────────────────────────────── -->
        <div class="min-w-0">
          <!-- The wizard's own stepper, rounded the same way — `Progress` has no
               prop for segment shape. -->
          <Progress
            class="mb-8 [&_[role=progressbar]>div]:rounded-full"
            size="md"
            intervals
            :interval-count="STEPS.length"
            :value="((step + 1) / STEPS.length) * 100"
          />
          <h1 class="text-xl font-semibold text-ink-gray-9">
            Tell us about your project for closer quotes
          </h1>

          <!-- Return moves a step on, and on the last step opens the details. -->
          <form class="mt-6" novalidate @submit.prevent="next">
            <div v-if="current === 'brief'" class="space-y-4">
              <FormControl
                type="select"
                :model-value="brief.budget"
                label="Your budget"
                placeholder="Select a range"
                required
                :options="bands"
                :error="errors.budget"
                @update:model-value="store.saveBrief({ budget: $event })"
              />
              <div>
                <Textarea
                  :model-value="brief.scope"
                  label="What do you want built?"
                  placeholder="What do you make or sell, who are your customers, how does it run today, what keeps going wrong, and what must it connect to or prove?"
                  :rows="5"
                  required
                  :error="errors.scope"
                  @update:model-value="store.saveBrief({ scope: $event })"
                />
                <!-- Live, as on the wizard — see `scopeHint`. -->
                <p
                  class="mt-1.5 text-p-sm leading-relaxed"
                  :class="{
                    'text-ink-gray-5': hint.tone === 'neutral',
                    'text-ink-amber-7': hint.tone === 'warn',
                    'text-ink-green-7': hint.tone === 'good',
                  }"
                >
                  {{ hint.text }}
                </p>
              </div>
            </div>
            <template v-else-if="current === 1">
              <!-- ⚠️ WHERE THE PARTNERS ARE, NOT WHERE THE BUSINESS IS. The
                   brief goes to firms, so the question the reader can act on
                   is which places they would work with; several are fine. The
                   business's own country is still kept — from the account, or
                   inferred — because the budget is quoted in its currency.
                   Chips because the answer is a handful of short options that
                   combine; India is a chip of its own, as a country, because
                   it is most of the directory — see `GEO_CHOICES`. -->
              <fieldset>
                <legend class="block text-sm text-ink-gray-7">
                  Which regions should your partners be from?
                </legend>
                <div class="mt-2 flex flex-wrap gap-2">
                  <FilterChip
                    v-for="c in GEO_CHOICES"
                    :key="c.region ?? c.country"
                    :label="c.label"
                    :selected="geoOn(c)"
                    @toggle="toggleGeo(c)"
                  />
                </div>
              </fieldset>
              <div class="mt-5">
                <CompanyQuestions :step="1" :form="form" :errors="errors" :ask-country="false" />
              </div>
            </template>
            <CompanyQuestions v-else :step="current" :form="form" :errors="errors" />

            <div class="mt-6 flex items-center gap-2">
              <!-- On the last step the label names what actually comes next: an
                   account for a visitor, the details for a signed-in viewer. -->
              <Button variant="solid" :label="submitLabel" type="submit">
                <template v-if="last && !store.signedIn" #prefix>
                  <IconUser class="size-4" />
                </template>
              </Button>
              <Button v-if="step > 0" variant="subtle" label="Back" @click="back" />
            </div>
          </form>
        </div>

        <!-- ── Who it reaches ───────────────────────────────────────────── -->
        <aside
          class="relative flex aspect-[5/4] min-w-0 flex-col overflow-hidden rounded-7 bg-surface-gray-1"
        >
          <!-- ⚠️ A FIELD, NOT A GRID. Every partner has a seat, at the centre or
               on one of four staggered rings; the ones that match take the inner
               seats at full strength, the rest drift outward and fade, so
               narrowing reads as the field emptying towards the middle.
               ⚠️ TINTED MARKS, NOT LOGOS: a match keeps a light tint of its
               colour and the rest are grey, all lightly blurred, so the field
               reads as real firms without any one brand standing out — who
               received the brief is on the confirmation.
               ⚠️ IT FADES BY DISTANCE as well as by match: the further a seat is
               from the middle, the greyer and fainter its logo, so the edge
               dissolves instead of stopping. `aria-hidden`: the count is the
               accessible version. -->
          <div class="fc-field absolute inset-x-0 bottom-[88px] top-0" aria-hidden="true">
            <div
              v-for="seat in seated"
              :key="seat.partner.id"
              class="fc-seat absolute left-1/2 top-1/2"
              :class="seat.on && 'fc-seat-match'"
              :style="{
                transform: `translate(${seat.x}px, ${seat.y}px) translate(-50%, -50%) scale(${seat.on ? 1 : 0.92})`,
                opacity: seat.opacity,
              }"
            >
              <Avatar
                :image="logoFor(seat.partner.id)"
                :label="seat.partner.name"
                size="2xl"
                shape="circle"
                class="select-none shadow-sm ring-1 ring-outline-gray-1"
                :class="logoFor(seat.partner.id) && 'fc-logo-avatar'"
              />
            </div>
          </div>

          <!-- The empty state: a mark and three words, where the logos were. -->
          <Transition name="fc-empty">
            <div
              v-if="!matches.length"
              class="absolute inset-x-0 bottom-[88px] top-0 flex flex-col items-center justify-center gap-3"
            >
              <IconPartners class="size-8 text-ink-gray-4" stroke-width="1.25" aria-hidden="true" />
              <p class="text-p-sm text-ink-gray-5">No partners found</p>
            </div>
          </Transition>

          <div class="relative mt-auto flex items-start justify-between gap-3 p-6">
            <div class="min-w-0">
              <p class="text-3xl font-semibold tabular-nums text-ink-gray-8">
                {{ matches.length }}
              </p>
              <p class="mt-0.5 text-p-base text-ink-gray-7">
                {{ matches.length === 1 ? 'Partner that matches' : 'Partners that match' }}
                your answers
              </p>
            </div>
            <Button variant="subtle" label="View all" route="/connect/partners" />
          </div>
        </aside>
    </div>

    <!-- ⚠️ THE CRITERIA AND THE COMMITMENT, NOTHING ELSE. No subtitle, no
         note under the buttons and no count: the panel behind already says how
         many, and this dialog's job is to say who, and to send. -->
    <Dialog v-model:open="details" size="md" title="Share requirements">
      <template #default>
        <PartnerCriteriaFields
          v-if="editing"
          :brief="brief"
          :answers="form"
          :total="false"
          @patch="store.saveBrief"
        />
        <ul v-else class="space-y-2.5">
          <li
            v-for="line in criteria"
            :key="line.text"
            class="flex items-center gap-2.5 text-p-base text-ink-gray-7"
          >
            <component :is="CRITERIA_ICONS[line.icon]" class="size-4 text-ink-gray-5" />
            {{ line.text }}
          </li>
        </ul>

        <div class="mt-8 flex items-center gap-2">
          <Button
            variant="solid"
            :disabled="matches.length === 0"
            label="Share requirements"
            @click="share"
          >
            <template #prefix><IconSend class="size-4" /></template>
          </Button>
          <Button
            variant="subtle"
            :label="editing ? 'Done' : 'Edit criteria'"
            @click="editing = !editing"
          />
        </div>
      </template>
    </Dialog>
  </ConnectShell>
</template>

<style scoped>
/* The edge of the field fades rather than stopping at the panel's border. */
.fc-field {
  mask-image: radial-gradient(ellipse 60% 60% at center, #000 50%, transparent 100%);
}
/* A seat change answers the visitor's own answer, so it moves — but quietly.
   ease-in-out, because the logo is moving across the screen rather than
   entering; the curve is soft (no overshoot, gentle at both ends) so a logo
   glides rather than darts. The silhouette's shade fades with it. */
.fc-seat {
  transition:
    transform 320ms cubic-bezier(0.45, 0, 0.25, 1),
    opacity 320ms ease;
}
/* Colour only where it means something: a partner your answers reach keeps
   its colour, as a light tint — faded into the Avatar's white disc — and every
   other mark is grey. Narrowing gathers the colour towards the middle. The
   filter is on the image, so the disc stays white.
   ⚠️ `grayscale`, NOT `brightness(0)`, for the rest: several logo files carry
   an opaque background, and flattening those to black came out as solid grey
   discs and squares.
   A light blur softens every mark without losing its shape. */
.fc-seat :deep(img) {
  filter: grayscale(1) contrast(1.15) blur(0.8px);
  opacity: 0.35;
  transition:
    opacity 320ms ease,
    filter 320ms ease;
}
.fc-seat-match :deep(img) {
  filter: grayscale(0) blur(0.8px);
  opacity: 0.65;
}
.fc-empty-enter-active,
.fc-empty-leave-active {
  transition: opacity 200ms ease;
}
.fc-empty-enter-from,
.fc-empty-leave-to {
  opacity: 0;
}
/* Reduced motion: no travel, but the fade still says what changed. */
@media (prefers-reduced-motion: reduce) {
  .fc-seat {
    transition: opacity 200ms ease;
  }
}
</style>
