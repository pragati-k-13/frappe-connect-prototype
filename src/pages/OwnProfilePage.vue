<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { Avatar, Badge, Button, Dialog, Dropdown, ErrorMessage, FormControl, Textarea, Tooltip, dialog, toast } from 'frappe-ui'
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
import MediaGrid from '../components/MediaGrid.vue'
import TierIcon from '../components/TierIcon.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { PARTNERS } from '../data/partners'
import { clientsFor, mediaFor } from '../data/media'
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
// `draft` holds changed profile fields, `draftMedia` the whole media list once
// it's touched. The page always shows published + draft.
const draft = ref({})
const draftMedia = ref(null)
const published = computed(() => ({ ...base.value, ...account.edits.profile }))
const p = computed(() => ({ ...published.value, ...draft.value }))
const dirty = computed(() => Object.keys(draft.value).length > 0 || draftMedia.value !== null)
const edit = (patch) => Object.assign(draft.value, patch)

const logo = computed(() => (beginner.value ? null : logoFor(p.value.id)))
const publishedMedia = computed(() => account.edits.media ?? (beginner.value ? [] : mediaFor(p.value.id)))
const media = computed(() => draftMedia.value ?? publishedMedia.value)
// Every logo in the partner's order, new ones `pending` until Frappe approves
// them. Only approved logos reach the profile.
const logos = computed(() => account.edits.logos ?? (beginner.value ? [] : clientsFor(p.value.id)).map((c) => ({ ...c, pending: false })))
const clients = computed(() => logos.value.filter((l) => !l.pending))

// ── Edit or preview ─────────────────────────────────────────────────────────
// In the URL, so a reload keeps it. People who can't edit only ever see the
// preview.
const mode = computed(() => (canEdit.value && route.query.preview !== '1' ? 'edit' : 'preview'))
const editing = computed(() => mode.value === 'edit')
const setMode = (m) => router.replace({ query: { ...route.query, preview: m === 'preview' ? '1' : undefined } })

// ── Required fields ─────────────────────────────────────────────────────────
// Checked when Publish is pressed, then live, so each "Required" clears as
// the partner fills it in.
const attempted = ref(false)
const missing = computed(() => {
  const v = p.value.vision ?? {}
  return [
    !(p.value.founding?.story?.length) && 'story',
    !v.why?.trim() && 'why',
    !v.together?.text?.trim() && 'together',
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
  clearDraft()
  toast.success('Published', { id: 'profile-saved' })
}
function clearDraft() {
  draft.value = {}
  draftMedia.value = null
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

// ── Logos ───────────────────────────────────────────────────────────────────
// Outside the draft: a new logo claims a client relationship, so it waits for
// Frappe; removing or reordering claims nothing and applies at once.
function changeLogos(list, how) {
  account.setLogos(list)
  toast.success(how === 'added' ? 'Sent to Frappe for review' : 'Saved', { id: 'logos-saved' })
}

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
    <!-- Both page actions in the bar. Preview is a button named for where it
         goes: "Preview" while editing, "Edit" while previewing. People who
         can't edit only ever see the page as businesses do. -->
    <template #action>
      <!-- Icons alone on a phone, where the bar can't fit the labels beside
           the title; the label stays for screen readers. The toggle keeps one
           width in both states so it doesn't shift when clicked. -->
      <div class="flex items-center gap-2">
        <!-- While there's a draft: what's unpublished, a way to drop it, and
             the page's one primary action. Publish stays in Preview too: that's
             where you check a draft before publishing it. -->
        <template v-if="canEdit && dirty">
          <span class="text-sm text-ink-gray-5 max-md:hidden">Unpublished changes</span>
          <Button label="Discard" @click="confirmDiscard()" />
        </template>
        <Button v-if="canEdit" class="sm:min-w-24" :icon-left="editing ? 'lucide-eye' : 'lucide-pencil'" @click="setMode(editing ? 'preview' : 'edit')">
          <span class="max-sm:sr-only">{{ editing ? 'Preview' : 'Edit' }}</span>
        </Button>
        <!-- On a phone with a draft, Copy link steps aside so Publish fits:
             there's nothing new at the link until it's published. -->
        <Button icon-left="lucide-link" :class="dirty && 'max-sm:hidden'" @click="shareLink">
          <span class="max-sm:sr-only">Copy link</span>
        </Button>
        <Button v-if="canEdit && dirty" variant="solid" label="Publish" @click="publish" />
      </div>
    </template>

    <div class="fc-page-read space-y-12 pb-24 pt-8">
      <!-- ── Header ───────────────────────────────────────────────────── -->
      <div>
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
      <section v-if="editing">
        <MediaGrid :items="media" @change="draftMedia = $event" />
      </section>
      <MediaGallery v-else-if="media.length" :items="media" />

      <!-- ── Client logos ─────────────────────────────────────────────── -->
      <!-- Edit mode shows every logo, still, and edits them in place; the
           directory's rotating strip is for reading, not editing. -->
      <section v-if="editing">
        <ClientLogoGrid :logos="logos" @change="changeLogos" />
      </section>
      <!-- The public profile's own measure for the strip, so Preview matches it. -->
      <div v-else-if="clients.length" class="mx-auto max-w-[600px]"><!-- design-lint-ignore -->
        <ClientStrip :clients="clients" :visible="5" />
      </div>

      <!-- ── About ────────────────────────────────────────────────────── -->
      <PartnerAboutCard :partner="p" :editable="editing" @change="edit" />

      <!-- ── In their words, then Frappe's ────────────────────────────── -->
      <PartnerWordsSection :partner="p" :editable="editing" :errors="errors" @change="edit" />
      <PartnerFeaturedSection :partner="p" />

      <!-- ── Reviews: Frappe's. The partner replies or reports. ────────── -->
      <PartnerReviewsSection v-if="p.reviews" :partner="p" own>
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
      <div>
        <PartnerStoriesSection :partner="p" />
        <Button v-if="editing" class="mt-3" label="Submit on frappe.io" href="https://frappe.io/partners" />
      </div>

      <!-- ── The quote: optional, before the marketplace ─────────────────────────────────── -->
      <PartnerQuoteSection :partner="p" :editable="editing" @edit="editQuote" />

      <!-- ── Marketplace: Frappe Cloud's, read-only here ──────────────── -->
      <div>
        <PartnerMarketplaceSection class="!mt-0" :partner="p" />
        <Button v-if="editing" class="mt-3" label="Manage on Frappe Cloud" href="https://frappecloud.com/marketplace" />
      </div>
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
