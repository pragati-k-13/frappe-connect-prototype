<script setup>
import { computed, ref, watch } from 'vue'
import { Alert, Avatar, Button, Dialog, FormControl, MultiSelect, Select, Switch, Textarea, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import ProfileSection from '../components/ProfileSection.vue'
import MediaGallery from '../components/MediaGallery.vue'
import ClientStrip from '../components/ClientStrip.vue'
import PartnerAboutCard from '../components/PartnerAboutCard.vue'
import PartnerVisionSection from '../components/PartnerVisionSection.vue'
import PartnerReviewsSection from '../components/PartnerReviewsSection.vue'
import PartnerStoriesSection from '../components/PartnerStoriesSection.vue'
import MediaUploadDialog from '../components/MediaUploadDialog.vue'
import ClientLogosDialog from '../components/ClientLogosDialog.vue'
import TierIcon from '../components/TierIcon.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { PARTNERS } from '../data/partners'
import { clientsFor, mediaFor } from '../data/media'
import { logoFor } from '../data/logos'
import { INDUSTRIES } from '../data/quiz'
import { budgetBandsFor, WORK_STYLES } from '../data/custom'
import { firmFor } from '../data/partnership'

// SCREEN — the partner's own directory page, laid out as a business sees it,
// with an Edit control on each section. Plain details publish at once; client
// logos and claims go to Frappe for review; case studies are submitted on
// frappe.io; tier, PMM, certifications and reviews are Frappe's.
// See PARTNER-VIEW-PLAN.md §6.

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
    pmm: 1,
    initials: 'LD',
    color: '#0ea5e9',
    certifications: [{ app: 'erpnext', members: 1 }],
    industries: ['Goods Trading'],
    apps: ['erpnext'],
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
const media = computed(() => [...(beginner.value ? [] : mediaFor(p.value.id)), ...account.edits.media])
const review = computed(() => account.edits.logoReview)
const clients = computed(() => (beginner.value ? [] : clientsFor(p.value.id)))

// ── Edit dialogs ────────────────────────────────────────────────────────────
const editing = ref(null)
const draft = ref({})
const bands = computed(() => budgetBandsFor('India').filter((b) => b.value !== 'unsure'))
const industryOptions = INDUSTRIES.flatMap((i) => i.segments.map((s) => ({ label: s, value: s })))
const styleOptions = [...WORK_STYLES.map((w) => ({ label: w.label, value: w.value })), { label: 'Either', value: 'both' }]

function edit(section) {
  const v = p.value
  draft.value = {
    header: { tagline: v.tagline ?? '', taking: v.taking ?? true },
    about: { industries: [...v.industries], workStyle: v.workStyle, minBand: bands.value[(v.minBand ?? 1) - 1]?.value },
    vision: { quote: v.vision?.quote ?? '' },
  }[section]
  editing.value = section
}

function save() {
  const d = draft.value
  if (editing.value === 'header') account.setProfile({ tagline: d.tagline.trim(), taking: d.taking })
  if (editing.value === 'about') {
    if (!d.industries.length) return toast.error('Pick at least one industry')
    account.setProfile({
      industries: d.industries,
      workStyle: d.workStyle,
      minBand: bands.value.findIndex((b) => b.value === d.minBand) + 1,
    })
  }
  if (editing.value === 'vision') account.setProfile({ vision: p.value.vision ? { ...p.value.vision, quote: d.quote.trim() } : null })
  editing.value = null
  toast.success('Published', { id: 'profile-saved' })
}

const mediaOpen = ref(false)
const logosOpen = ref(false)
function submitLogos(list) {
  account.submitLogos(list)
  toast.success('Sent to Frappe for review')
}

// The Beginner's unlisted page works by link, so they can send it to their own
// prospects. Bronze makes the same page public.
const shareLink = async () => {
  try {
    await navigator.clipboard.writeText(`https://frappe.io/partners/${p.value.id}`)
    toast.success('Link copied')
  } catch {
    toast.error('Couldn’t copy the link')
  }
}
watch(editing, (v) => v === null && (draft.value = {}))
</script>

<template>
  <ConnectShell root-label="Profile">
    <template #action>
      <Button
        v-if="!beginner"
        variant="ghost"
        class="-mr-2"
        label="View in directory"
        :route="`/connect/partners/${p.id}`"
      />
    </template>

    <div class="fc-page-read space-y-12 pb-24 pt-8">
      <Alert
        v-if="beginner"
        theme="blue"
        title="Unlisted until Bronze. Anyone with the link can see it."
        :primary-action="{ label: 'Copy link', onClick: shareLink }"
      />
      <p v-else-if="!canEdit" class="text-p-sm text-ink-gray-5">Your firm’s owner edits this page.</p>

      <!-- ── Header ───────────────────────────────────────────────────── -->
      <ProfileSection label="Name and tagline" :editable="canEdit" @edit="edit('header')">
        <div class="flex items-start gap-3">
          <Avatar v-if="logo" :image="logo" :label="`${p.name} logo`" size="3xl" shape="square" class="fc-logo-avatar" />
          <div
            v-else
            class="grid size-12 shrink-0 place-items-center rounded-4 text-base-semibold text-white"
            :style="{ backgroundColor: p.color }"
          >
            {{ p.initials }}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-semibold text-ink-gray-9">{{ p.name }}</h1>
              <TierIcon :tier="p.tier" />
            </div>
            <p class="mt-1 text-p-base text-ink-gray-6">{{ p.tagline || 'No tagline yet' }}</p>
            <p class="mt-1 text-sm text-ink-gray-5">
              {{ p.taking === false ? 'Not taking new work this quarter' : 'Taking new work this quarter' }}
            </p>
          </div>
        </div>
      </ProfileSection>

      <!-- ── Media ────────────────────────────────────────────────────── -->
      <ProfileSection label="Photos and video" :editable="canEdit" @edit="mediaOpen = true">
        <MediaGallery v-if="media.length" :items="media" />
        <p v-else class="text-p-sm text-ink-gray-5">No photos or video yet.</p>
      </ProfileSection>

      <!-- ── Client logos (reviewed) ──────────────────────────────────── -->
      <ProfileSection
        label="Client logos"
        :editable="canEdit"
        :state="review ? 'review' : null"
        @edit="logosOpen = true"
      >
        <ClientStrip v-if="clients.length" :clients="clients" :visible="5" />
        <p v-else class="text-p-sm text-ink-gray-5">No client logos yet.</p>
        <p v-if="review" class="mt-3 text-p-sm text-ink-gray-5">
          {{ review.logos.length }} logos sent for review. The set above stays live until Frappe approves it.
        </p>
      </ProfileSection>

      <!-- ── About ────────────────────────────────────────────────────── -->
      <ProfileSection
        label="About"
        :editable="canEdit"
        @edit="edit('about')"
      >
        <PartnerAboutCard :partner="p" />
        <p class="mt-3 text-p-sm text-ink-gray-5">Tier, PMM and certifications come from Frappe.</p>
      </ProfileSection>

      <!-- ── Vision ───────────────────────────────────────────────────── -->
      <ProfileSection v-if="p.vision" label="Vision" :editable="canEdit" @edit="edit('vision')">
        <PartnerVisionSection :partner="p" />
      </ProfileSection>

      <!-- ── Read-only ────────────────────────────────────────────────── -->
      <ProfileSection v-if="p.reviews" label="Reviews" note="From businesses you worked with">
        <PartnerReviewsSection :partner="p" />
      </ProfileSection>

      <ProfileSection label="Case studies" note="Submitted on frappe.io">
        <PartnerStoriesSection :partner="p" />
        <Button class="mt-4" label="Submit on frappe.io" href="https://frappe.io/partners" />
      </ProfileSection>
    </div>

    <!-- ── Plain edits: publish at once ─────────────────────────────────── -->
    <Dialog
      :open="editing !== null"
      :title="{ header: 'Name and tagline', about: 'About', vision: 'Vision' }[editing] ?? ''"
      @update:open="(v) => !v && (editing = null)"
    >
      <div class="space-y-4">
        <template v-if="editing === 'header'">
          <FormControl v-model="draft.tagline" label="Tagline" placeholder="What your firm does, in a line" />
          <Switch v-model="draft.taking" label="Taking new work this quarter" />
        </template>
        <template v-if="editing === 'about'">
          <div>
            <p class="mb-1.5 text-sm text-ink-gray-6">Industries</p>
            <MultiSelect v-model="draft.industries" :options="industryOptions" placeholder="Pick industries" />
          </div>
          <FormControl v-model="draft.workStyle" type="select" label="How you work" :options="styleOptions" />
          <div>
            <p class="mb-1.5 text-sm text-ink-gray-6">Smallest project you take</p>
            <Select v-model="draft.minBand" :options="bands" />
            <p class="mt-1.5 text-p-sm text-ink-gray-5">Briefs below this don’t reach you.</p>
          </div>
        </template>
        <template v-if="editing === 'vision'">
          <Textarea v-model="draft.quote" :rows="4" label="Quote" />
        </template>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="editing = null" />
          <Button variant="solid" label="Publish" @click="save" />
        </div>
      </div>
    </Dialog>

    <MediaUploadDialog v-model:open="mediaOpen" @add="account.addMedia" />
    <ClientLogosDialog v-model:open="logosOpen" :clients="clients" @submit="submitLogos" />
  </ConnectShell>
</template>
