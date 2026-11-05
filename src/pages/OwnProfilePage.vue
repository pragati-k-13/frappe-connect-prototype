<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { Avatar, Badge, Button, Dialog, Dropdown, ErrorMessage, FormControl, TabButtons, Textarea, Tooltip, dialog, toast } from 'frappe-ui'
import IconEdit from '~icons/lucide/pencil'
import IconPreview from '~icons/lucide/eye'
import ConnectShell from '../components/ConnectShell.vue'
import ClientLogoGrid from '../components/ClientLogoGrid.vue'
import InlineInput from '../components/InlineInput.vue'
import MediaGallery from '../components/MediaGallery.vue'
import ClientStrip from '../components/ClientStrip.vue'
import PartnerAboutCard from '../components/PartnerAboutCard.vue'
import PartnerWordsSection from '../components/PartnerWordsSection.vue'
import PartnerFeaturedSection from '../components/PartnerFeaturedSection.vue'
import PartnerQuoteSection from '../components/PartnerQuoteSection.vue'
import PartnerReviewsSection from '../components/PartnerReviewsSection.vue'
import PartnerStoriesSection from '../components/PartnerStoriesSection.vue'
import PartnerMarketplaceSection from '../components/PartnerMarketplaceSection.vue'
import CompactSection from '../components/CompactSection.vue'
import MediaGrid from '../components/MediaGrid.vue'
import TierIcon from '../components/TierIcon.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { ANSWER_MAX, PARTNERS, STORY_MAX } from '../data/partners'
import { clientsFor, mediaFor } from '../data/media'
import { featuredFor } from '../data/featured'
import { storiesFor } from '../data/stories'
import { contributionsFor } from '../data/marketplace'
import { logoFor } from '../data/logos'
import { firmFor } from '../data/partnership'

// SCREEN — the partner's public profile, as a business sees it in the
// directory, and edited where it sits. Edits are a DRAFT until Publish: a
// half-written tagline never sits on the live profile, and Preview shows the
// draft before anyone else sees it. Publish checks the required fields
// ("In their words", and a quote's author) and points at what's missing.
// Discard, and leaving with a draft, ask first.
//
// Outside the draft, because they aren't profile copy: new client logos (they
// go to Frappe for review, and removing or reordering applies at once), and
// review replies and reports (each has its own action). Taking new work is in
// Firm settings › Leads. Case studies are submitted on frappe.io; tier, PMM,
// certifications, awards, reviews and "Featured by Frappe" are Frappe's.
// See PARTNER-VIEW-PLAN.md §6.

const route = useRoute()
const router = useRouter()
const store = useConnectStore()
const account = usePartnerAccountStore()
const beginner = computed(() => store.partnerTier === 'beginner')
const canEdit = computed(() => store.partnerRole === 'owner')

// A Beginner's firm isn't in the directory, so its page is a draft built here
// with nothing borrowed from a real partner's words.
const base = computed(() => {
  const sw = PARTNERS.find((p) => p.id === 'software-work')
  if (!beginner.value) return sw
  const firm = firmFor('beginner')
  return {
    ...sw,
    id: 'lumen-digital',
    name: firm.name,
    tagline: '',
    city: 'Manama, Bahrain',
    address: null,
    tier: null,
    pmm: '—',
    countries: ['Bahrain'],
    zone: null,
    rate: 40,
    initials: 'LD',
    color: '#0ea5e9',
    certifications: [{ app: 'erpnext', members: 1 }],
    industries: ['Goods Trading'],
    apps: ['erpnext'],
    migrations: [],
    accolades: [],
    stories: 0,
    reviews: 0,
    rating: 0,
    vision: null,
    founding: null,
    workStyle: 'remote',
    minBand: 1,
  }
})
// ── The draft ───────────────────────────────────────────────────────────────
// `draft` holds changed profile fields, `draftMedia` and `draftLogos` the
// whole media or logo list once it's touched. The page always shows
// published + draft.
const draft = ref({})
const draftMedia = ref(null)
const draftLogos = ref(null)
const published = computed(() => ({ ...base.value, ...account.edits.profile }))
const p = computed(() => ({ ...published.value, ...draft.value }))
const dirty = computed(() => Object.keys(draft.value).length > 0 || draftMedia.value !== null || draftLogos.value !== null)
const edit = (patch) => Object.assign(draft.value, patch)

const logo = computed(() => (beginner.value ? null : logoFor(p.value.id)))
const publishedMedia = computed(() => account.edits.media ?? (beginner.value ? [] : mediaFor(p.value.id)))
const media = computed(() => draftMedia.value ?? publishedMedia.value)
// Every logo in the partner's order. Logos are part of the draft like
// everything else: they publish with Publish, and Discard drops them.
const publishedLogos = computed(() => account.edits.logos ?? (beginner.value ? [] : clientsFor(p.value.id)))
const logos = computed(() => draftLogos.value ?? publishedLogos.value)
const clients = computed(() => logos.value.filter((l) => l.src))

// ── Edit or preview ─────────────────────────────────────────────────────────
// In the URL, so a reload keeps it. People who can't edit only ever see the
// preview.
const mode = computed(() => (canEdit.value && route.query.preview !== '1' ? 'edit' : 'preview'))
const editing = computed(() => mode.value === 'edit')
// Switching keeps the reader on the section they were looking at: the two
// modes lay sections out differently (compact rows, a grid against a gallery),
// so the scroll offset alone would land somewhere else. Each top-level section
// carries a `data-anchor` with the same name in both modes. The new mode fades
// in over 150ms, opacity only, so a full-page swap doesn't read as a reload.
const pageEl = ref(null)
const scrollerOf = (el) => {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(n).overflowY)) return n
  }
  return document.scrollingElement
}
// Switching back without scrolling in between returns to the exact starting
// place: the anchor is remembered from the first switch, so the 80px clamp
// and the end of the page can't make it drift.
let held = null
async function setMode(m) {
  if (m === mode.value) return
  const scroller = scrollerOf(pageEl.value)
  const top = scroller.getBoundingClientRect().top
  let anchor, offset
  const returning = held && Math.abs(scroller.scrollTop - held.scrollTop) < 1
  if (returning) {
    ;({ anchor, offset } = held)
  } else {
    const anchors = [...(pageEl.value?.querySelectorAll(':scope > [data-anchor]') ?? [])]
    const current = anchors.filter((a) => a.getBoundingClientRect().top <= top + 1).pop()
    anchor = current?.dataset.anchor
    offset = current ? current.getBoundingClientRect().top - top : 0
  }
  await router.replace({ query: { ...route.query, preview: m === 'preview' ? '1' : undefined } })
  await nextTick()
  const next = anchor && pageEl.value?.querySelector(`:scope > [data-anchor="${anchor}"]`)
  if (next) {
    // A section that got shorter keeps at least its last 80px in view. Not on
    // the way back: the original offset is exact there.
    const shift = returning ? offset : Math.max(offset, 80 - next.offsetHeight)
    scroller.scrollTop += next.getBoundingClientRect().top - top - shift
    held = returning ? null : { anchor, offset, scrollTop: scroller.scrollTop }
  } else held = null
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    pageEl.value?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
  }
}

// The mode switch: frappe-ui's segmented control, so the current mode is the
// selected segment. Icons alone on a phone (the label stays as their
// accessible name), icon and label otherwise.
const narrow = ref(window.matchMedia('(max-width: 639px)').matches)
const mq = window.matchMedia('(max-width: 639px)')
const onNarrow = (e) => (narrow.value = e.matches)
mq.addEventListener('change', onNarrow)
onBeforeUnmount(() => mq.removeEventListener('change', onNarrow))
const modeOptions = computed(() =>
  [
    { value: 'edit', label: 'Edit', icon: IconEdit },
    { value: 'preview', label: 'Preview', icon: IconPreview },
  ].map(({ icon, ...o }) => (narrow.value ? { ...o, icon } : { ...o, iconLeft: icon })),
)

// ── Sections the partner can't edit ─────────────────────────────────────────
// Folded to one row each in edit mode; View opens the full section in place.
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

// ── Required fields ─────────────────────────────────────────────────────────
// Checked when Publish is pressed, then live, so each "Required" clears as
// the partner fills it in.
const attempted = ref(false)
// Empty or over its character limit: either one stops Publish. The field
// itself says which.
const missing = computed(() => {
  const v = p.value.vision ?? {}
  const story = (p.value.founding?.story ?? []).join('\n\n')
  const bad = (text, max) => !text?.trim() || text.length > max
  return [
    bad(story, STORY_MAX) && 'story',
    bad(v.why, ANSWER_MAX) && 'why',
    bad(v.together?.text, ANSWER_MAX) && 'together',
  ].filter(Boolean)
})
const errors = computed(() => (attempted.value ? missing.value : []))

// ── Publish and discard ─────────────────────────────────────────────────────
async function publish() {
  attempted.value = true
  if (missing.value.length) {
    // The fields only exist in edit mode.
    if (!editing.value) setMode('edit')
    await nextTick()
    document.querySelector('[data-invalid]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  account.setProfile(draft.value)
  if (draftMedia.value) account.setMedia(draftMedia.value)
  if (draftLogos.value) account.setLogos(draftLogos.value)
  clearDraft()
  toast.success('Published', { id: 'profile-saved', action: { label: 'Copy link', onClick: shareLink } })
}
function clearDraft() {
  draft.value = {}
  draftMedia.value = null
  draftLogos.value = null
  attempted.value = false
}
const confirmDiscard = (onDiscard) =>
  dialog.danger({
    title: 'Discard unpublished changes?',
    message: 'Your profile goes back to what’s published now.',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
    size: 'sm',
    onConfirm: () => {
      clearDraft()
      onDiscard?.()
    },
  })

// Leaving with a draft asks first: inside the app through the router, and
// closing or reloading the tab through the browser's own prompt.
onBeforeRouteLeave((to) => {
  if (!dirty.value) return true
  confirmDiscard(() => router.push(to))
  return false
})
const warnUnload = (e) => {
  if (dirty.value) e.preventDefault()
}
window.addEventListener('beforeunload', warnUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnUnload))

// ── The quote ───────────────────────────────────────────────────────────────
// Optional. With a quote, its author's name, role and photo are all required.
const quoteOpen = ref(false)
const quote = ref({})
const quoteTried = ref(false)
function editQuote() {
  const v = p.value.vision
  quote.value = { text: v?.quote ?? '', name: v?.author?.name ?? '', role: v?.author?.role ?? '', photo: v?.author?.photo ?? null }
  quoteTried.value = false
  quoteOpen.value = true
}
function pickPhoto(e) {
  const file = e.target.files?.[0]
  if (file) quote.value.photo = URL.createObjectURL(file)
}
const quoteMissing = computed(() => {
  const q = quote.value
  return { text: !q.text?.trim(), name: !q.name?.trim(), role: !q.role?.trim(), photo: !q.photo }
})
function saveQuote() {
  quoteTried.value = true
  if (Object.values(quoteMissing.value).some(Boolean)) return
  const q = quote.value
  edit({ vision: { ...(p.value.vision ?? {}), quote: q.text.trim(), author: { name: q.name.trim(), role: q.role.trim(), photo: q.photo } } })
  quoteOpen.value = false
}
function removeQuote() {
  edit({ vision: { ...(p.value.vision ?? {}), quote: '', author: { name: '', role: '', photo: null } } })
  quoteOpen.value = false
}
const hasQuote = computed(() => !!p.value.vision?.quote)

// ── Reviews: reply and report ───────────────────────────────────────────────
// A report doesn't hide the review: it stays up, marked Reported, until Frappe
// decides. Hiding on a click would let a firm clear its own bad reviews.
const REPORT_REASONS = ['Spam', 'Not our client', 'Offensive']
const replyingTo = ref(null)
const replyDraft = ref('')
function startReply(r) {
  replyingTo.value = r.id
  replyDraft.value = account.edits.reviewReplies[r.id] ?? ''
}
function postReply(r) {
  const text = replyDraft.value.trim()
  if (!text) return
  account.replyToReview(r.id, text)
  replyingTo.value = null
  toast.success('Reply published')
}
const reportMenu = (r) =>
  REPORT_REASONS.map((reason) => ({
    label: reason,
    onClick: () => {
      account.reportReview(r.id, reason)
      toast.success('Reported to Frappe')
    },
  }))

// The Beginner's unlisted page works by link, so they can send it to their own
// prospects. Everyone else's link is their directory page.
const shareLink = async () => {
  try {
    await navigator.clipboard.writeText(`https://frappe.io/partners/${p.value.id}`)
    toast.success('Link copied')
  } catch {
    toast.error('Couldn’t copy the link')
  }
}
</script>

<template>
  <ConnectShell root-label="Public profile">
    <!-- A Beginner isn't in the directory yet; the page still works by link. -->
    <template v-if="beginner" #title-suffix>
      <Tooltip text="Not in the directory until Bronze. Anyone with the link can see it.">
        <Badge theme="gray" variant="subtle" size="md" label="Unlisted" />
      </Tooltip>
    </template>
    <!-- Copy link (Preview, nothing unpublished), then the mode switch, then
         Discard and Publish with a draft, so Publish sits at the right edge.
         People who can't edit only ever see the page as businesses do: no
         switch. -->
    <template #action>
      <div class="flex items-center gap-2">
        <!-- The link opens the published page, so it's offered only when
             that's what Preview shows: never with a draft. Publishing offers
             it again, in the toast. An icon is enough on its own here. -->
        <Tooltip v-if="!editing && !dirty" text="Copy link">
          <Button icon="lucide-link" aria-label="Copy link" @click="shareLink" />
        </Tooltip>
        <TabButtons v-if="canEdit" :model-value="mode" :options="modeOptions" @update:model-value="setMode" />
        <!-- Discard and Publish appear only with a draft: their arriving is
             the "unpublished changes" signal, so there's no label for it.
             They fade in over 150ms; gone at once when the draft is. -->
        <Transition enter-active-class="transition-opacity duration-150 ease-out motion-reduce:transition-none" enter-from-class="opacity-0">
          <div v-if="canEdit && dirty" class="flex items-center gap-2">
            <Button label="Discard" @click="confirmDiscard()" />
            <Button variant="solid" label="Publish" @click="publish" />
          </div>
        </Transition>
      </div>
    </template>

    <div ref="pageEl" class="fc-page-read space-y-24 pb-24 pt-8">
      <!-- ── Header ───────────────────────────────────────────────────── -->
      <div data-anchor="header">
        <div class="flex items-start gap-3">
          <Avatar v-if="logo" :image="logo" :label="`${p.name} logo`" size="3xl" shape="square" class="fc-logo-avatar" />
          <div
            v-else
            class="grid size-12 shrink-0 place-items-center rounded-4 text-base-semibold text-white"
            :style="{ backgroundColor: p.color }"
          >
            {{ p.initials }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-semibold text-ink-gray-9">{{ p.name }}</h2>
              <TierIcon :tier="p.tier" />
            </div>
            <InlineInput
              v-if="editing"
              wrap
              :model-value="p.tagline ?? ''"
              label="Tagline"
              placeholder="Add a tagline"
              @commit="edit({ tagline: $event })"
            />
            <!-- `py-1`: the same box as the tagline field above, so switching to
                 Preview doesn't move the page. -->
            <p v-else-if="p.tagline" class="py-1 text-p-base text-ink-gray-6">{{ p.tagline }}</p>
          </div>
        </div>

      </div>

      <!-- ── Media ────────────────────────────────────────────────────── -->
      <!-- Edit mode shows every item in a grid, edited in place, the same shape
           as the logos; Preview shows the gallery as the directory does. -->
      <section v-if="editing" data-anchor="media">
        <MediaGrid :items="media" @change="draftMedia = $event" />
      </section>
      <!-- Preview spaces the top of the page as the business view does: 24px
           to the gallery, 48px to the strip, 48px (64px with no strip) to About. -->
      <MediaGallery v-else-if="media.length" data-anchor="media" class="!mt-6" :items="media" />

      <!-- ── Client logos ─────────────────────────────────────────────── -->
      <!-- Edit mode shows every logo, still, and edits them in place; the
           directory's rotating strip is for reading, not editing. -->
      <section v-if="editing" data-anchor="logos">
        <ClientLogoGrid :logos="logos" @change="draftLogos = $event" />
      </section>
      <!-- The public profile's own measure for the strip, so Preview matches it. -->
      <div v-else-if="clients.length" data-anchor="logos" class="mx-auto !mt-12 max-w-[600px]"><!-- design-lint-ignore -->
        <ClientStrip :clients="clients" :visible="5" />
      </div>

      <!-- ── About ────────────────────────────────────────────────────── -->
      <PartnerAboutCard data-anchor="about" :class="!editing && (clients.length ? '!mt-12' : '!mt-16')" :partner="p" :editable="editing" @change="edit" />

      <!-- ── In their words, then Frappe's ────────────────────────────── -->
      <PartnerWordsSection data-anchor="words" :partner="p" :editable="editing" :errors="errors" @change="edit" />
      <CompactSection v-if="editing && featured.length" data-anchor="featured" title="Featured by Frappe" :count="featured.length" :description="featuredLine">
        <template #full><PartnerFeaturedSection :partner="p" headless /></template>
      </CompactSection>
      <PartnerFeaturedSection v-else-if="!editing" data-anchor="featured" :partner="p" />

      <!-- ── Reviews: Frappe's. The partner replies or reports. ────────── -->
      <PartnerReviewsSection v-if="p.reviews" data-anchor="reviews" :partner="p" own>
        <template #actions="{ review: r }">
          <!-- The reply shows in preview too: it's public. -->
          <div v-if="account.edits.reviewReplies[r.id] && replyingTo !== r.id" class="mt-4 border-l-2 border-outline-gray-2 pl-3">
            <p class="text-sm font-medium text-ink-gray-7">Reply from {{ p.name }}</p>
            <p class="mt-1 text-p-base text-ink-gray-6">{{ account.edits.reviewReplies[r.id] }}</p>
          </div>
          <template v-if="editing">
            <div v-if="replyingTo === r.id" class="mt-4 space-y-2">
              <Textarea v-model="replyDraft" :rows="3" :aria-label="`Reply to ${r.name}`" placeholder="Write a public reply" />
              <div class="flex justify-end gap-2">
                <Button label="Cancel" @click="replyingTo = null" />
                <Button variant="solid" label="Publish reply" @click="postReply(r)" />
              </div>
            </div>
            <div v-else class="-ml-2 mt-3 flex items-center gap-1">
              <Button
                variant="ghost"
                :label="account.edits.reviewReplies[r.id] ? 'Edit reply' : 'Reply'"
                @click="startReply(r)"
              />
              <template v-if="account.edits.reviewReports[r.id]">
                <Badge theme="amber" variant="subtle" size="md" :label="`Reported: ${account.edits.reviewReports[r.id].reason}`" />
                <Button variant="ghost" label="Undo report" @click="account.reportReview(r.id, null)" />
              </template>
              <Dropdown v-else :options="reportMenu(r)">
                <Button variant="ghost" class="data-[state=open]:bg-surface-gray-3" label="Report" />
              </Dropdown>
            </div>
          </template>
        </template>
      </PartnerReviewsSection>

      <!-- ── Case studies: submitted on frappe.io ───────────────────────── -->
      <CompactSection
        v-if="editing"
        data-anchor="stories"
        title="Success stories"
        :count="stories.length"
        :description="stories.length ? 'Published on frappe.io' : 'None published yet'"
      >
        <!-- Just the verb on a phone, so the title keeps its line. -->
        <Button icon-right="lucide-external-link" href="https://frappe.io/partners">Submit<span class="max-sm:sr-only"> on frappe.io</span></Button>
        <template v-if="stories.length" #full><PartnerStoriesSection :partner="p" headless /></template>
      </CompactSection>
      <PartnerStoriesSection v-else data-anchor="stories" :partner="p" />

      <!-- ── The quote: optional, before the marketplace ─────────────────────────────────── -->
      <PartnerQuoteSection data-anchor="quote" :partner="p" :editable="editing" @edit="editQuote" />

      <!-- ── Marketplace: Frappe Cloud's, read-only here ──────────────── -->
      <CompactSection
        v-if="editing"
        data-anchor="marketplace"
        title="Marketplace contributions"
        :count="apps.length"
        :description="apps.length ? 'Listed on the Frappe Cloud Marketplace' : 'Hidden from clients until you publish an app'"
      >
        <Button icon-right="lucide-external-link" href="https://frappecloud.com/marketplace">Manage<span class="max-sm:sr-only"> on Frappe Cloud</span></Button>
        <template v-if="apps.length" #full><PartnerMarketplaceSection :partner="p" headless /></template>
      </CompactSection>
      <PartnerMarketplaceSection v-else data-anchor="marketplace" class="!mt-0" :partner="p" />
    </div>

    <!-- ── The quote ──────────────────────────────────────────────────── -->
    <!-- Done puts it in the draft; Publish makes it public. With a quote, its
         author's name, role and photo are all required. -->
    <Dialog v-model:open="quoteOpen" :title="hasQuote ? 'Edit quote' : 'Add a quote'" size="md">
      <div class="space-y-4">
        <div>
          <Textarea v-model="quote.text" :rows="4" label="Quote" />
          <ErrorMessage v-if="quoteTried && quoteMissing.text" class="mt-1" message="Required" />
        </div>
        <div>
          <FormControl v-model="quote.name" label="Who said it" placeholder="Name" />
          <ErrorMessage v-if="quoteTried && quoteMissing.name" class="mt-1" message="Required" />
        </div>
        <div>
          <FormControl v-model="quote.role" label="Role" placeholder="Managing Director" />
          <ErrorMessage v-if="quoteTried && quoteMissing.role" class="mt-1" message="Required" />
        </div>
        <div>
          <div class="flex items-center gap-3">
            <Avatar :image="quote.photo" :label="quote.name" size="2xl" />
            <label class="cursor-pointer">
              <span class="sr-only">Photo</span>
              <input type="file" accept="image/*" class="sr-only" @change="pickPhoto" />
              <Button as="span" :label="quote.photo ? 'Change photo' : 'Add photo'" icon-left="lucide-upload" />
            </label>
          </div>
          <ErrorMessage v-if="quoteTried && quoteMissing.photo" class="mt-1" message="Required" />
        </div>
        <div class="flex items-center gap-2 pt-2">
          <Button v-if="hasQuote" variant="ghost" theme="red" label="Remove quote" @click="removeQuote" />
          <span class="flex-1" />
          <Button label="Cancel" @click="quoteOpen = false" />
          <Button variant="solid" label="Done" @click="saveQuote" />
        </div>
      </div>
    </Dialog>

  </ConnectShell>
</template>
