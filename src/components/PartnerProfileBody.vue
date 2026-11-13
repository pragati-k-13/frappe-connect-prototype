<script setup>
import { computed } from 'vue'
import { Avatar, Button } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import InlineInput from './InlineInput.vue'
import MediaGallery from './MediaGallery.vue'
import MediaGrid from './MediaGrid.vue'
import ClientStrip from './ClientStrip.vue'
import ClientLogoGrid from './ClientLogoGrid.vue'
import CompactSection from './CompactSection.vue'
import PartnerAboutCard from './PartnerAboutCard.vue'
import PartnerWordsSection from './PartnerWordsSection.vue'
import PartnerFeaturedSection from './PartnerFeaturedSection.vue'
import PartnerReviewsSection from './PartnerReviewsSection.vue'
import ReviewReply from './ReviewReply.vue'
import PartnerStoriesSection from './PartnerStoriesSection.vue'
import PartnerMarketplaceSection from './PartnerMarketplaceSection.vue'
import { visibleClients } from '../data/media'
import { featuredFor } from '../data/featured'
import { storiesFor } from '../data/stories'
import { contributionsFor } from '../data/marketplace'

// The partner profile, one body for both sides: a business reading it in the
// directory (`PartnerProfilePage`) and the partner editing or previewing it
// (`OwnProfilePage`). Two copies drifted apart before, so each page now brings
// only its own header actions (`#actions`); everything else, order and
// spacing included, is here. Replying to and reporting reviews happens on the
// Reviews page, never here: replies go live at once, which doesn't belong in
// a draft.
//
// Read-only, it's exactly what a business sees, and the partner's Preview
// shows the same thing. `editable` turns on in-place editing: the partner's
// own sections edit where they sit, and the ones Frappe owns (featured,
// stories, marketplace) fold to one row each.
//
// Each top-level section carries a `data-anchor`, the same name in both modes,
// so switching between Edit and Preview can keep the reader in place.
const props = defineProps({
  // The profile as published, plus the draft when editing.
  partner: { type: Object, required: true },
  logo: { type: String, default: null },
  media: { type: Array, default: () => [] },
  // `{ slug, name, src, href, hidden? }` in the partner's order, hidden ones
  // included: the strip leaves them out, the editor shows them dimmed.
  logos: { type: Array, default: () => [] },
  // The partner's own page, in either mode: no "Write a review".
  own: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  // Required fields left empty at the last Publish (see `PartnerWordsSection`).
  errors: { type: Array, default: () => [] },
  // The partner's public replies, by review id.
  replies: { type: Object, default: () => ({}) },
  // The Reviews page, for "View all".
  reviewsTo: { type: String, default: null },
})
const emit = defineEmits(['change', 'update:media', 'update:logos'])

const p = computed(() => props.partner)
const clients = computed(() => visibleClients(props.logos))
// The partner's own strapline. `city` is the last resort for a partner without
// one, so a business never meets a blank line.
const subtitle = computed(() => p.value.tagline || p.value.city)

// ── Sections the partner can't edit, folded in edit mode ────────────────────
const featured = computed(() => featuredFor(p.value.id))
const stories = computed(() => storiesFor(p.value))
const apps = computed(() => contributionsFor(p.value))
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
const featuredLine = computed(() => {
  const pods = featured.value.filter((f) => f.kind === 'podcast').length
  const posts = featured.value.length - pods
  return [pods && plural(pods, 'podcast episode', 'podcast episodes'), posts && plural(posts, 'partner story', 'partner stories')]
    .filter(Boolean)
    .join(' and ')
})
</script>

<template>
  <div class="fc-page-read space-y-24 pb-24 pt-8">
    <!-- ── Header ───────────────────────────────────────────────────────
         Identity left, the page's own actions right. ⚠️ No `flex-wrap`: a
         long tagline wraps, and the actions stay beside the name. -->
    <div data-anchor="header" class="flex items-start justify-between gap-6">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <Avatar v-if="logo" :image="logo" :label="`${p.name} logo`" size="3xl" shape="square" class="fc-logo-avatar" />
        <div
          v-else
          class="grid size-12 shrink-0 place-items-center rounded-4 text-base-semibold text-white"
          :style="{ backgroundColor: p.color }"
          aria-hidden="true"
        >
          {{ p.initials }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-ink-gray-9">{{ p.name }}</h1>
            <TierIcon :tier="p.tier" />
          </div>
          <InlineInput
            v-if="editable"
            wrap
            :model-value="p.tagline ?? ''"
            label="Tagline"
            placeholder="Add a tagline"
            @commit="emit('change', { tagline: $event })"
          />
          <!-- `py-1`: the same box as the tagline field, so switching to
               Preview doesn't move the page. -->
          <p v-else-if="subtitle" class="py-1 text-p-base text-ink-gray-6">{{ subtitle }}</p>
        </div>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2"><slot name="actions" /></div>
    </div>

    <!-- ── Media ─────────────────────────────────────────────────────────
         Edit mode shows every item in a grid, edited in place; reading, it's
         the gallery, 24px under the header. -->
    <section v-if="editable" data-anchor="media">
      <MediaGrid :items="media" @change="emit('update:media', $event)" />
    </section>
    <MediaGallery v-else-if="media.length" data-anchor="media" class="!mt-6" :items="media" />

    <!-- ── Client logos, from the success stories ────────────────────────
         Edit mode shows every logo, still, hidden ones included; reading,
         it's the rotating strip with no heading, 48px under the gallery. -->
    <section v-if="editable" data-anchor="logos">
      <ClientLogoGrid :logos="logos" @change="emit('update:logos', $event)" />
    </section>
    <div v-else-if="clients.length" data-anchor="logos" class="mx-auto !mt-12 max-w-[600px]"><!-- design-lint-ignore -->
      <ClientStrip :clients="clients" :visible="5" />
    </div>

    <!-- ── About ─────────────────────────────────────────────────────────
         48px under the strip, 64px straight after the gallery. -->
    <PartnerAboutCard
      data-anchor="about"
      :class="!editable && (clients.length ? '!mt-12' : '!mt-16')"
      :partner="p"
      :editable="editable"
      @change="emit('change', $event)"
    />

    <!-- ── In their words, then clients', then Frappe's ────────────────── -->
    <PartnerWordsSection data-anchor="words" :partner="p" :editable="editable" :errors="errors" @change="emit('change', $event)" />
    <!-- ── Reviews: Frappe's. Read-only here, in every mode; the partner
         replies and reports on the Reviews page. No "View all" while
         editing: leaving would mean leaving the draft. -->
    <PartnerReviewsSection
      v-if="p.reviews || !own"
      id="reviews"
      data-anchor="reviews"
      :partner="p"
      :own="own"
      :view-all-to="editable ? null : reviewsTo"
    >
      <template #actions="{ review: r }">
        <ReviewReply :partner="p" :text="replies[r.id]" />
      </template>
    </PartnerReviewsSection>

    <!-- Editing: Success stories in full, since the partner picks which
         one leads; then the two sections edited elsewhere, together as
         compact rows. Stories move above Featured here (on the profile
         Featured comes first) so those two rows stay one group. -->
    <template v-if="editable">
      <PartnerStoriesSection data-anchor="stories" :partner="p" editable @change="emit('change', $event)" />
      <div class="divide-y divide-outline-gray-1">
        <CompactSection v-if="featured.length" data-anchor="featured" class="pb-4" title="Featured by Frappe" :description="featuredLine" />
        <!-- Frappe Cloud's, last: what a partner has published isn't about
             the engagement being weighed up. -->
        <CompactSection
          data-anchor="marketplace"
          class="pt-4 first:pt-0"
          title="Marketplace contributions"
          :description="apps.length ? `${apps.length} ${apps.length === 1 ? 'app' : 'apps'} listed` : 'Hidden until you publish an app'"
        >
          <!-- Just the verb on a phone, so the title keeps its line. -->
          <Button icon-right="lucide-external-link" href="https://frappecloud.com/marketplace">Manage<span class="max-sm:sr-only"> on Frappe Cloud</span></Button>
        </CompactSection>
      </div>
    </template>
    <template v-else>
      <PartnerFeaturedSection data-anchor="featured" :partner="p" />
      <PartnerStoriesSection data-anchor="stories" :partner="p" />
      <PartnerMarketplaceSection data-anchor="marketplace" :partner="p" />
    </template>
  </div>
</template>
