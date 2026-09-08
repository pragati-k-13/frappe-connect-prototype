<script setup>
import { computed, ref } from 'vue'
import { Avatar, Button, toast } from 'frappe-ui'
import IconPositive from '~icons/lucide/check'
import IconCaution from '~icons/lucide/info'
import MediaLightbox from './MediaLightbox.vue'
import { reviewMediaFor } from '../data/media'
import { reviewsFor } from '../data/reviews'

// SCREEN 6, fifth section — "Reviews".
//
// ⚠️ The reviews themselves are FABRICATED, and they're the most sensitive
// placeholder data in the mock: made-up testimonials attributed to made-up
// customers, about real, named companies. Read the warning at the top of
// `data/reviews.js` before screenshotting this.
const props = defineProps({
  partner: { type: Object, required: true },
})

const media = computed(() => reviewMediaFor(props.partner.id))
const review = computed(() => reviewsFor(props.partner))

// The aggregate comes from the partner record — the same `rating` and `reviews`
// the listing row shows, so the two screens can't disagree. It deliberately
// isn't the average of the rows below: those are the first four of twelve, and
// a sample of a set doesn't have to average to the set.
const rating = computed(() => props.partner.rating.toFixed(1))

const iconFor = (sentiment) => (sentiment === 'caution' ? IconCaution : IconPositive)

// ⚠️ These chips are NOT selectable. They used to be `FilterChip` toggles with
// a local `activeTags` array, and that was the wrong affordance: a chip that
// takes a pressed state promises it filters the list underneath, and a visitor
// who pressed one and saw four unchanged reviews would read the page as broken
// rather than unbuilt. They're a way IN to a set of reviews — a modal, once it
// exists — not a filter on the ones already shown.
//
// So they're plain buttons now. Same look (`outline` at `sm`, icon, count) and
// still pressable, but no `aria-pressed`, no selected fill, no state to get out
// of sync with the list.
//
// Single-use copy, so it lives here rather than in `feedback.js`. Names the
// destination rather than letting the click vanish, the same way Contact does.
const tagToast = (tag) =>
  toast.info('Reviews by tag are not built yet', {
    id: 'review-tag',
    description: `This would open the ${tag.count} ${
      tag.count === 1 ? 'review' : 'reviews'
    } that mention "${tag.label}".`,
  })

const lightboxOpen = ref(false)
const lightboxAt = ref(0)
const openAt = (i) => {
  lightboxAt.value = i
  lightboxOpen.value = true
}

// Single-use copy, so it lives here rather than in `feedback.js`.
const reviewToast = () =>
  toast.info('Writing a review is not built yet', {
    description: 'Reviews come from customers with a completed implementation.',
  })

const ago = (months) => (months < 12 ? `${months} months ago` : `${Math.floor(months / 12)}y ago`)
</script>

<template>
  <section>
    <h2 class="text-base font-semibold text-ink-gray-8">Reviews</h2>

    <!-- ── The aggregate ───────────────────────────────────────────────── -->
    <div class="mt-4 flex items-start justify-between gap-4">
      <div>
        <p class="flex items-center gap-1.5">
          <span class="text-6xl font-medium tabular-nums text-ink-gray-8">{{ rating }}</span>
          <!-- Amber, the same `ink-amber-5` the marketplace listings fill with
               and the shade frappe-ui's own `Rating` uses for a filled star.
               ⚠️ `ink-amber-1` to `-4` have no generated utility and render
               black — see FRAPPE-UI-NOTES.md. -->
          <LucideStar class="size-4 fill-current text-ink-amber-5" aria-hidden="true" />
          <span class="sr-only">out of 5</span>
        </p>
        <p class="mt-0.5 text-p-base text-ink-gray-6">
          {{ partner.reviews }} {{ partner.reviews === 1 ? 'review' : 'reviews' }}
        </p>
      </div>
      <!-- ⚠️ Still no review form — writing one needs an account AND a
           completed project, both `store.account` questions this section
           doesn't ask yet (see the demo switcher notes in the README). The
           toast names that precondition, which is more useful than the click
           doing nothing: it says why the button won't help you rather than
           leaving you to press it twice. -->
      <Button variant="subtle" label="Write a review" @click="reviewToast">
        <template #prefix><LucidePlus class="size-4" /></template>
      </Button>
    </div>

    <!-- ── Customer media ──────────────────────────────────────────────── -->
    <!-- Opens the same lightbox as the profile gallery: one overlay, one set
         of keyboard shortcuts, wherever media is clicked on this page. -->
    <div v-if="media.length" class="mt-4 grid grid-cols-3 gap-3">
      <button
        v-for="(m, i) in media"
        :key="m.id"
        class="group relative aspect-[2/1] cursor-zoom-in overflow-hidden rounded-5 bg-surface-gray-2"
        :aria-label="m.kind === 'video' ? `Play ${m.alt}` : `Open ${m.alt} full screen`"
        @click="openAt(i)"
      >
        <img
          :src="m.kind === 'video' ? (m.poster ?? m.src) : m.src"
          :alt="m.alt"
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span
          v-if="m.kind === 'video'"
          class="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all group-hover:scale-105 group-hover:bg-black/60"
          aria-hidden="true"
        >
          <LucidePlay class="size-5 translate-x-[1px] fill-current" />
        </span>
      </button>
    </div>

    <!-- ── What reviewers keep saying ──────────────────────────────────── -->
    <!-- ⚠️ NOT `FilterChip`, though it looks identical to one in its unselected
         state. `FilterChip` is a toggle — it exists to carry a pressed state —
         and these aren't selectable: they open a set of reviews rather than
         filtering the four below. Reusing it here would have meant a chip that
         latches on click and changes nothing, which reads as a broken filter
         rather than an unbuilt screen. See the note on `tagToast`.

         Same `Button` underneath at the same `outline` / `sm`, so the row still
         matches the quiz's region chips visually. The icon carries the
         sentiment: a check for what reviewers praised, an info mark for what
         they cautioned about. The count is `currentColor` at 60%, matching
         `FilterChip`'s own treatment. -->
    <div class="mt-4 flex flex-wrap gap-2">
      <Button
        v-for="t in review.tags"
        :key="t.label"
        variant="outline"
        size="sm"
        @click="tagToast(t)"
      >
        <template #prefix>
          <component :is="iconFor(t.sentiment)" class="size-3.5" />
        </template>
        {{ t.label }}
        <template #suffix>
          <span class="tabular-nums opacity-60">{{ t.count }}</span>
        </template>
      </Button>
    </div>

    <!-- ── The reviews ─────────────────────────────────────────────────── -->
    <div class="mt-8 divide-y divide-outline-gray-1">
      <article v-for="r in review.items" :key="r.id" class="py-5">
        <div class="flex items-start gap-3">
          <!-- ⚠️ Placeholder: no image and no label, so it renders as a plain
               circle rather than an initial. A letter would read as this
               person's monogram, and the person is invented. -->
          <Avatar class="size-9 shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <p class="text-base font-medium text-ink-gray-8">{{ r.name }}</p>
              <!-- Stored as an age rather than a date, so the label can't drift
                   as the mock gets older — see `data/reviews.js`.

                   ⚠️ `text-base`, not `text-p-base`, and that matters more than
                   it looks. Paragraph leading gives a single 14px line a 21px
                   box; this one shares a flex row with the name, whose box is
                   16px, so `items-start` left 5px of dead air under the name
                   before the company line's own margin started. The gap read as
                   ~7px against a 2px margin. Single lines take the tight scale;
                   only the review body below wants paragraph leading. -->
              <p class="shrink-0 text-base text-ink-gray-5">{{ ago(r.monthsAgo) }}</p>
            </div>
            <p class="mt-1 text-base text-ink-gray-6">{{ r.company }}</p>
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
        <div class="mt-3 flex items-center gap-4">
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
        <p class="mt-2 text-p-base text-ink-gray-7">{{ r.text }}</p>
      </article>
    </div>

    <!-- ⚠️ Inert — there's no all-reviews screen yet. Same treatment as the
         pricing links: ghost Button pulled back by `-ml-2` so the label lines
         up with the column edge rather than sitting inside its own padding. -->
    <Button
      v-if="partner.reviews > review.items.length"
      variant="ghost"
      label="View all"
      class="-ml-2 mt-3"
    >
      <template #suffix><LucideChevronRight class="size-4" /></template>
    </Button>

    <MediaLightbox
      :open="lightboxOpen"
      :items="media"
      :index="lightboxAt"
      @close="lightboxOpen = false"
      @update:index="lightboxAt = $event"
    />
  </section>
</template>
