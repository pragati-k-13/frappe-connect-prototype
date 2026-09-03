<script setup>
import { computed } from 'vue'
import { Avatar, Badge, Button } from 'frappe-ui'
import { contributionsFor } from '../data/marketplace'

// SCREEN 6, seventh section — "Marketplace contributions".
//
// The apps this partner has published to the Frappe Marketplace. It sits last
// because it's the one section that isn't about the engagement you're
// considering: it's evidence of what they build when nobody has hired them to.
//
// ⚠️ Every app, rating and review count is INVENTED — see `data/marketplace.js`,
// and read the warning there before screenshotting this. Crediting a real,
// named company with a specific published product is the most attributable
// placeholder data in the mock after the reviews.
const props = defineProps({
  partner: { type: Object, required: true },
})

const apps = computed(() => contributionsFor(props.partner))
</script>

<template>
  <!-- Five of the thirteen partners publish nothing, and this section simply
       doesn't render for them — no empty state, unlike "Success stories" a
       section above.
       The difference: every partner could have written up a project, so
       "none yet" there says something about them. Publishing a marketplace app
       is a thing most implementation partners never do, so "no contributions"
       says nothing at all, and an empty row would read as a shortcoming rather
       than as a non-event. -->
  <!-- `mt-24` lives here rather than on a wrapper in the page: this is the only
       section that can be absent, and an empty wrapper still contributes its
       margin. See the note at the call site. -->
  <section v-if="apps.length" class="mt-24">
    <!-- Title and count exactly as in "Success stories" — same size, weight and
         Badge — because they're the same kind of thing: a named collection with
         a length. -->
    <h2 class="flex items-center gap-2 text-base font-semibold text-ink-gray-8">
      Marketplace contributions
      <Badge theme="gray" variant="subtle" size="md" :label="`${apps.length}`" />
    </h2>

    <div class="mt-2 divide-y divide-outline-gray-1">
      <div v-for="app in apps" :key="app.id" class="flex items-center gap-3 py-4">
        <!-- ⚠️ Placeholder: no image, so `Avatar` renders the app's initial on
             its own surface. The design's mark is a real app icon, and inventing
             one per invented app would be inventing branding on top of an
             invented product. `2xl` square is the same 40px box the partner
             logos use in the listing. -->
        <Avatar size="2xl" shape="square" :label="app.name" />

        <div class="min-w-0 flex-1">
          <p class="truncate text-base font-medium text-ink-gray-8">{{ app.name }}</p>
          <p class="mt-1 flex items-center gap-1.5">
            <!-- Five stars with a fractional fill: two identical rows stacked,
                 the amber one clipped to the rating's share of the width. A
                 single star plus a number (the treatment in the Reviews section)
                 reads as one partner's own score; five stars reads as a
                 marketplace listing, which is what this is.

                 ⚠️ The amber is `text-ink-amber-5`. Shades 1-4 of that scale
                 have no generated utility — `text-ink-amber-3` and friends
                 compile to nothing and render black. Checked, all five. -->
            <span
              class="relative inline-flex shrink-0"
              role="img"
              :aria-label="`Rated ${app.rating.toFixed(1)} out of 5`"
            >
              <span class="flex gap-0.5">
                <LucideStar
                  v-for="i in 5"
                  :key="`bg-${i}`"
                  class="size-3.5 shrink-0 fill-current text-ink-gray-3"
                  aria-hidden="true"
                />
              </span>
              <span
                class="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden"
                :style="{ width: `${(app.rating / 5) * 100}%` }"
                aria-hidden="true"
              >
                <LucideStar
                  v-for="i in 5"
                  :key="`fg-${i}`"
                  class="size-3.5 shrink-0 fill-current text-ink-amber-5"
                />
              </span>
            </span>
            <span class="text-p-sm text-ink-gray-7">{{ app.rating.toFixed(1) }}</span>
            <span class="text-p-sm text-ink-gray-5">({{ app.reviews }})</span>
          </p>
        </div>

        <!-- "View", not the design's "Install". Installing is something you do
             to a site you own, from inside Frappe Cloud; nothing on this page
             knows what site you have, and a directory shouldn't be installing
             software from a partner's profile. Viewing the listing is the
             action that actually belongs here — and the row names the app, so
             the button doesn't have to.
             ⚠️ Inert — it would open the app's marketplace page, which lives on
             Frappe Cloud rather than in this app. -->
        <Button variant="subtle" label="View">
          <template #suffix><LucideChevronRight class="size-4" /></template>
        </Button>
      </div>
    </div>
  </section>
</template>
