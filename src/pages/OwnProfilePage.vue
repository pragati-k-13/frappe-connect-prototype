<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Badge, Button, Dialog, Dropdown, FormControl, Switch, Textarea, Tooltip, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import ClientLogoGrid from '../components/ClientLogoGrid.vue'
import InlineInput from '../components/InlineInput.vue'
import MediaGallery from '../components/MediaGallery.vue'
import ClientStrip from '../components/ClientStrip.vue'
import PartnerAboutCard from '../components/PartnerAboutCard.vue'
import PartnerVisionSection from '../components/PartnerVisionSection.vue'
import PartnerReviewsSection from '../components/PartnerReviewsSection.vue'
import PartnerStoriesSection from '../components/PartnerStoriesSection.vue'
import PartnerMarketplaceSection from '../components/PartnerMarketplaceSection.vue'
import PartnerFoundingSection from '../components/PartnerFoundingSection.vue'
import MediaGrid from '../components/MediaGrid.vue'
import TierIcon from '../components/TierIcon.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { PARTNERS } from '../data/partners'
import { clientsFor, mediaFor } from '../data/media'
import { logoFor } from '../data/logos'
import { firmFor } from '../data/partnership'

// SCREEN — the partner's public profile, as a business sees it in the
// directory, and edited where it sits. Text and lists edit in place and
// publish at once; media, client logos and the vision quote open a dialog;
// client logos and claims go to Frappe for review; case studies are submitted
// on frappe.io; tier, PMM, certifications, Frappe's awards and reviews are
// Frappe's. Preview drops every edit control and shows the page exactly as
// the directory does. See PARTNER-VIEW-PLAN.md §6.

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
const p = computed(() => ({ ...base.value, ...account.edits.profile }))
const logo = computed(() => (beginner.value ? null : logoFor(p.value.id)))
const media = computed(() => account.edits.media ?? (beginner.value ? [] : mediaFor(p.value.id)))
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

// ── Publishing ──────────────────────────────────────────────────────────────
// Every in-place edit publishes at once. A Beginner's page is unlisted, so
// nothing is published, only saved. One toast id, so quick edits don't stack.
function publish(patch) {
  account.setProfile(patch, p.value.id)
  toast.success(beginner.value ? 'Saved' : 'Published', { id: 'profile-saved' })
}

// ── Media and logos ─────────────────────────────────────────────────────────
function saveMedia(list) {
  account.setMedia(list)
  toast.success(beginner.value ? 'Saved' : 'Published', { id: 'profile-saved' })
}
// A new logo claims a client relationship, so it waits for Frappe; removing
// or reordering claims nothing and applies at once.
function changeLogos(list, how) {
  account.setLogos(list)
  if (how === 'added') toast.success('Sent to Frappe for review')
  else toast.success(beginner.value ? 'Saved' : 'Published', { id: 'profile-saved' })
}

// The vision quote and who said it: four fields, one of them a photo.
const quoteOpen = ref(false)
const quote = ref({})
function editQuote() {
  const v = p.value.vision
  quote.value = { text: v?.quote ?? '', name: v?.author?.name ?? '', role: v?.author?.role ?? '', photo: v?.author?.photo ?? null }
  quoteOpen.value = true
}
function pickPhoto(e) {
  const file = e.target.files?.[0]
  if (file) quote.value.photo = URL.createObjectURL(file)
}
function saveQuote() {
  const q = quote.value
  const v = p.value.vision ?? { why: '', together: { text: '', tags: [] }, success: { text: '', tags: [] } }
  publish({ vision: { ...v, quote: q.text.trim(), author: { name: q.name.trim(), role: q.role.trim(), photo: q.photo } } })
  quoteOpen.value = false
}

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
        <Button v-if="canEdit" class="sm:min-w-24" :icon-left="editing ? 'lucide-eye' : 'lucide-pencil'" @click="setMode(editing ? 'preview' : 'edit')">
          <span class="max-sm:sr-only">{{ editing ? 'Preview' : 'Edit' }}</span>
        </Button>
        <Button icon-left="lucide-link" @click="shareLink">
          <span class="max-sm:sr-only">Copy link</span>
        </Button>
      </div>
    </template>

    <div class="fc-page-read space-y-12 pb-24 pt-8">
      <!-- ── Header ───────────────────────────────────────────────────── -->
      <div class="space-y-4">
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
              @commit="publish({ tagline: $event })"
            />
            <!-- `py-1`: the same box as the tagline field above, so switching to
                 Preview doesn't move the page. -->
            <p v-else-if="p.tagline" class="py-1 text-p-base text-ink-gray-6">{{ p.tagline }}</p>
          </div>
        </div>

        <!-- Edit mode only: a setting about the firm, not a line of its profile.
             One label in both states, naming what "on" means, as a switch's
             label should; the fill says the state. Off is amber, the one state
             worth noticing. One height in both, so nothing moves. It belongs on
             Leads once it steers which briefs arrive. -->
        <div
          v-if="editing"
          class="flex h-10 items-center rounded-8 px-3"
          :class="p.taking !== false ? 'bg-surface-gray-2' : 'bg-surface-amber-2'"
        >
          <Switch
            class="w-full"
            :class="p.taking === false && '[&_[data-slot=label]]:text-ink-amber-8'"
            :model-value="p.taking !== false"
            label="Taking new work"
            @update:model-value="publish({ taking: $event })"
          />
        </div>
      </div>

      <!-- ── Media ────────────────────────────────────────────────────── -->
      <!-- Edit mode shows every item in a grid, edited in place, the same shape
           as the logos; Preview shows the gallery as the directory does. -->
      <section v-if="editing">
        <MediaGrid :items="media" @change="saveMedia" />
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
      <PartnerAboutCard :partner="p" :editable="editing" :action="beginner ? 'Save' : 'Publish'" @change="publish" />

      <!-- ── Vision ───────────────────────────────────────────────────── -->
      <PartnerVisionSection
        :partner="p"
        :editable="editing"
        @change="publish({ vision: $event })"
        @edit-quote="editQuote"
      />

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

      <!-- ── Marketplace: Frappe Cloud's, read-only here ──────────────── -->
      <div>
        <PartnerMarketplaceSection class="!mt-0" :partner="p" />
        <Button v-if="editing" class="mt-3" label="Manage on Frappe Cloud" href="https://frappecloud.com/marketplace" />
      </div>

      <!-- ── How they began ───────────────────────────────────────────── -->
      <PartnerFoundingSection class="!mt-12" :partner="p" :editable="editing" @change="publish({ founding: $event })" />
    </div>

    <!-- ── Vision quote ─────────────────────────────────────────────────── -->
    <Dialog v-model:open="quoteOpen" title="Vision quote" size="md">
      <div class="space-y-4">
        <Textarea v-model="quote.text" :rows="4" label="Quote" />
        <FormControl v-model="quote.name" label="Who said it" placeholder="Name" />
        <FormControl v-model="quote.role" label="Role" placeholder="Managing Director" />
        <div class="flex items-center gap-3">
          <Avatar :image="quote.photo" :label="quote.name" size="2xl" />
          <label class="cursor-pointer">
            <span class="sr-only">Photo</span>
            <input type="file" accept="image/*" class="sr-only" @change="pickPhoto" />
            <Button as="span" :label="quote.photo ? 'Change photo' : 'Add photo'" icon-left="lucide-upload" />
          </label>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="quoteOpen = false" />
          <Button variant="solid" :label="beginner ? 'Save' : 'Publish'" @click="saveQuote" />
        </div>
      </div>
    </Dialog>

  </ConnectShell>
</template>
