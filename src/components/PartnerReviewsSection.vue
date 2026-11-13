<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Badge, Button } from 'frappe-ui'
import WriteReviewDialog from './WriteReviewDialog.vue'
import { SHOWN, reviewsFor, writtenAsItem } from '../data/reviews'
import { PROJECT_APPS } from '../data/partners'
import { useConnectStore } from '../stores/connect'
import { useAuthGate } from '../utils/auth'

// SCREEN 6, fifth section — "Reviews".
//
// ⚠️ The reviews themselves are FABRICATED, and they're the most sensitive
// placeholder data in the mock: made-up testimonials attributed to made-up
// customers, about real, named companies. Read the warning at the top of
// `data/reviews.js` before screenshotting this.
// On the profile it shows the first `SHOWN` reviews, and "View all" (more
// than that) opens the Reviews page. On the Reviews page (`full`) it's every
// review, with no heading: the page title says Reviews.
const props = defineProps({
  partner: { type: Object, required: true },
  // The partner's own firm: no "Write a review" (a firm doesn't review
  // itself), and "View all" whenever there's a review, because the Reviews
  // page is where the partner replies and reports.
  own: { type: Boolean, default: false },
  full: { type: Boolean, default: false },
  // Where "View all" goes.
  viewAllTo: { type: String, default: null },
})

// The profile's URL gets `#reviews` first, so Back from the Reviews page lands
// on this section rather than the top of a long profile (the router scrolls to
// a hash).
const route = useRoute()
const router = useRouter()
async function openAll() {
  await router.replace({ ...route, hash: '#reviews' })
  router.push(props.viewAllTo)
}
// The router's own hash scroll is undone: the shell's scroll area resets
// itself just after a page mounts. So on the way back the section brings
// itself into view, after that reset (150ms; at two frames it was still
// undone).
const el = ref(null)
onMounted(() => {
  if (props.full || route.hash !== '#reviews') return
  setTimeout(() => el.value?.scrollIntoView({ block: 'start' }), 150)
})

// Reviews written here come first, newest first, then the seeded ones.
const store = useConnectStore()
const written = computed(() => store.reviewsWrittenFor(props.partner.id).map(writtenAsItem))
const review = computed(() => reviewsFor(props.partner))
const all = computed(() => [...written.value, ...review.value.items])
const items = computed(() => (props.full ? all.value : all.value.slice(0, SHOWN)))
const viewAll = computed(
  () => !props.full && !!props.viewAllTo && (props.own ? items.value.length > 0 : all.value.length > SHOWN),
)

// The aggregate comes from the partner record — the same `rating` and `reviews`
// the listing row shows, so the two screens can't disagree — plus any written
// here. It deliberately isn't the average of the rows below: those are the
// first five of twelve, and a sample of a set doesn't have to average to it.
const count = computed(() => (props.partner.reviews ?? 0) + written.value.length)
const rating = computed(() => {
  const sum = (props.partner.rating ?? 0) * (props.partner.reviews ?? 0) + written.value.reduce((n, r) => n + r.stars, 0)
  return count.value ? (sum / count.value).toFixed(1) : '0.0'
})

// What the work covered, on the company line. Up to two app names, then
// "+N more", which expands the rest in place (tap, not hover, so it works on
// a phone). The line wraps to two lines at most.
const APPS_SHOWN = 2
const appNames = (apps) => (apps ?? []).map((v) => PROJECT_APPS.find((a) => a.value === v)?.label ?? v)
const expanded = ref(new Set())
const shownApps = (r) => {
  const names = appNames(r.apps)
  return expanded.value.has(r.id) ? names : names.slice(0, APPS_SHOWN)
}
const moreApps = (r) => (expanded.value.has(r.id) ? 0 : Math.max(0, appNames(r.apps).length - APPS_SHOWN))
const expandApps = (r) => (expanded.value = new Set([...expanded.value, r.id]))
const ago = (r) => (r.today ? 'Today' : r.monthsAgo < 12 ? `${r.monthsAgo} months ago` : `${Math.floor(r.monthsAgo / 12)}y ago`)

// ── Writing one ─────────────────────────────────────────────────────────────
// For any business, not the partner's own view. Signed out, the gate takes
// them through sign-up and back here with `?review=1`, which opens the form:
// the query survives a reload, which a held action wouldn't.
const { requireAccount } = useAuthGate()
const writing = ref(false)
const mine = computed(() => (props.own ? null : store.myReviewOf(props.partner.id)))
async function write() {
  if (store.signedIn) return (writing.value = true)
  await router.replace({ query: { ...route.query, review: '1' } })
  requireAccount(() => {})
}
watch(
  () => [route.query.review, store.signedIn],
  ([flag, signedIn]) => {
    if (flag !== '1' || props.own || !signedIn) return
    const { review: _, ...query } = route.query
    router.replace({ query })
    writing.value = true
  },
  { immediate: true },
)
// After publishing, the new review is first in the list: bring it into view.
async function published() {
  await nextTick()
  el.value?.querySelector('[data-mine]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}
</script>

<template>
  <section ref="el">
    <!-- "Write a review" beside the heading, so nobody scrolls past every
         review to find it. Subtle: Contact stays the page's one solid button. -->
    <div v-if="!full || !own" class="flex min-h-7 items-center justify-between gap-3">
      <h2 v-if="!full" class="text-base font-semibold text-ink-gray-8">Reviews</h2>
      <span v-else />
      <Button v-if="!own" variant="subtle" :label="mine ? 'Edit your review' : 'Write a review'" @click="write">
        <template v-if="!mine" #prefix><LucidePlus class="size-4" /></template>
      </Button>
    </div>

    <!-- ── The aggregate ───────────────────────────────────────────────── -->
    <!-- None yet: no "0.0 ★", just the way to write the first. -->
    <p v-if="count" :class="full && own ? '' : 'mt-4'" class="flex items-center gap-1.5">
      <span class="text-6xl font-medium tabular-nums text-ink-gray-8">{{ rating }}</span>
      <!-- Amber, the same `ink-amber-5` the marketplace listings fill with
           and the shade frappe-ui's own `Rating` uses for a filled star.
           ⚠️ `ink-amber-1` to `-4` have no generated utility and render
           black — see FRAPPE-UI-NOTES.md. -->
      <LucideStar class="size-4 fill-current text-ink-amber-5" aria-hidden="true" />
      <span class="sr-only">out of 5,</span>
      <span class="ml-2 text-base text-ink-gray-6">
        {{ count }} {{ count === 1 ? 'review' : 'reviews' }}
      </span>
    </p>

    <!-- ── The reviews ─────────────────────────────────────────────────── -->
    <!-- 24px from the aggregate to the first review: the first row drops its
         own top padding, so the gap is the list's margin alone. -->
    <div v-if="items.length" class="mt-6 divide-y divide-outline-gray-1">
      <article v-for="r in items" :key="r.id" class="py-5 first:pt-0" :data-mine="r.id === mine?.id || undefined">
        <div class="flex items-start gap-3">
          <!-- The reviewer's photo, or their initial on gray when there's
               none: frappe-ui's own fallback, as everywhere else in the app. -->
          <Avatar class="size-9 shrink-0" :image="r.avatar" :label="r.name" />
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <p class="flex items-center gap-1.5 text-base font-medium text-ink-gray-8">
                {{ r.name }}
                <!-- The viewer's own review: beside the name, so it adds no row. -->
                <Badge v-if="r.id === mine?.id" label="You" />
              </p>
              <!-- Stored as an age rather than a date, so the label can't drift
                   as the mock gets older — see `data/reviews.js`.

                   `text-sm` (13px) against the name's 14px: the date is the
                   least important thing in the review — you read who wrote it,
                   what they scored it and why, and the age only qualifies all
                   three — so it takes a step down in size as well as the step
                   down in ink it already had.

                   ⚠️ The TIGHT scale, not `text-p-sm`, and that matters more
                   than it looks. Paragraph leading would give this single line
                   a 19.5px box; it shares a flex row with the name, whose box is
                   16px, so `items-start` would leave dead air under the name
                   before the company line's own margin started. Single lines
                   take the tight scale here; only the review body below wants
                   paragraph leading. -->
              <p class="shrink-0 text-sm text-ink-gray-5">{{ ago(r) }}</p>
            </div>
            <p class="mt-1 text-base text-ink-gray-6">
              {{ r.company }}<template v-if="r.apps?.length"> · {{ shownApps(r).join(', ') }}</template>
              <button
                v-if="moreApps(r)"
                type="button"
                class="ml-1 rounded-4 text-ink-gray-6 underline decoration-outline-gray-3 underline-offset-2 hover:text-ink-gray-8 focus-visible:focus-ring"
                @click="expandApps(r)"
              >
                +{{ moreApps(r) }} more
              </button>
            </p>
          </div>
        </div>

        <!-- The verdict sits above the prose, not under it: who wrote this,
             what they scored it, then why. Under the body it was the last thing
             in the row and read as a footnote to the paragraph, when it's
             actually the part someone scanning a list of reviews is looking
             for.

             `mt-3` against the body's `mt-2`, so the review splits 12 / 8 into
             two groups rather than sitting as three evenly spaced lines: WHO
             wrote it (avatar, name, company, date), then WHAT THEY SAID (the
             score, then the reason for it). At an even 8 / 8 the company line
             and the star row read as one run of small grey text and the review
             had no visible start. Same rhythm the listing row uses — identity,
             break, content. -->
        <div class="mt-5 flex items-center gap-4">
          <p class="flex items-center gap-1.5 text-base font-medium text-ink-gray-8">
            <!-- Coloured rather than inherited: `fill-current` on its own would
                 take the row's ink-8 and make a solid black star the loudest
                 thing in the review. Amber carries the same job the grey used
                 to — it's the star that's marked, not the number — and matches
                 the aggregate above and the marketplace rows. -->
            <LucideStar class="size-3.5 fill-current text-ink-amber-5" aria-hidden="true" />
            {{ r.stars.toFixed(1) }}
            <span class="sr-only">out of 5</span>
          </p>
          <!-- Only shown when true. "Would not recommend" as a grey line next
               to a 3-star rating reads as a label rather than a verdict; the
               rating already carries it. -->
          <p v-if="r.recommend" class="flex items-center gap-1.5 text-base text-ink-gray-6">
            <LucideCheck class="size-3.5" aria-hidden="true" />
            Would recommend
          </p>
        </div>

        <!-- Body full width rather than indented beside the avatar: at this
             column width an indented paragraph loses 48px of measure for no
             gain, and the design runs it full width too. The rating row above
             takes the same left edge for the same reason. -->
        <p class="mt-1.5 text-p-base text-ink-gray-7">{{ r.text }}</p>
        <slot name="actions" :review="r" />
      </article>
    </div>

    <!-- A drill-down to the Reviews page, so it carries the chevron. The
         count is already in the aggregate above, so the label doesn't repeat
         it. -->
    <div v-if="viewAll" class="mt-4">
      <Button variant="subtle" label="View all" @click="openAll">
        <template #suffix><LucideChevronRight class="size-4" /></template>
      </Button>
    </div>

    <WriteReviewDialog v-if="!own" v-model:open="writing" :partner="partner" @published="published" />
  </section>
</template>
