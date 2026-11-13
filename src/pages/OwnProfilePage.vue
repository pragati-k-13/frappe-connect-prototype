<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { Badge, Button, Tooltip, dialog, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PartnerProfileBody from '../components/PartnerProfileBody.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { ANSWER_MAX, STORY_MAX } from '../data/partners'
import { clientsFor, mediaFor } from '../data/media'
import { logoFor } from '../data/logos'

// SCREEN — the partner's public profile, as a business sees it in the
// directory, and edited where it sits. The body is `PartnerProfileBody`, the
// same one the directory renders, so the page and Preview are exactly what a
// business sees. Edits are a DRAFT until Publish: a half-written tagline never
// sits on the live profile. Publish checks the required fields ("In their
// words") and points at what's missing. Cancel with changes, and leaving with
// a draft, ask first.
//
// Client logos come from success stories: the partner reorders and hides them
// in the draft, and adds one by submitting a story. Outside the draft, because
// they aren't profile copy: review replies and reports, on the Reviews page
// (`OwnReviewsPage`). Taking new work is in
// Firm settings › Leads. Case studies are submitted on frappe.io; tier, PMM,
// certifications, awards, reviews and "Featured by Frappe" are Frappe's.
// See PARTNER-VIEW-PLAN.md §6.

const route = useRoute()
const router = useRouter()
const store = useConnectStore()
const account = usePartnerAccountStore()
const beginner = computed(() => store.partnerTier === 'beginner')
const canEdit = computed(() => store.partnerRole === 'owner')

// ── The draft ───────────────────────────────────────────────────────────────
// `draft` holds changed profile fields, `draftMedia` and `draftLogos` the
// whole media or logo list once it's touched. The page always shows
// published + draft.
const draft = ref({})
const draftMedia = ref(null)
const draftLogos = ref(null)
const published = computed(() => account.ownProfile)
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

// ── View, edit, preview ─────────────────────────────────────────────────────
// The page opens on what's live, exactly as businesses see it. Editing is a
// mode the partner enters with "Edit profile", and Preview is a step inside
// it: the draft in the business layout. Cancel and Publish both return to the
// live page, so the page's name always matches what it shows. The title
// never changes (a mode, not a page); the header's actions and a "Not
// published" badge carry the state.
//
// In the URL (`?mode=edit|preview`), so a reload keeps it. A Beginner who has
// never published opens straight in Edit: there's nothing live to look at.
// People who can't edit only ever see the live page.
const defaultMode = computed(() => (beginner.value && !account.edits.publishedAt ? 'edit' : 'view'))
const mode = computed(() => {
  if (!canEdit.value) return 'view'
  const q = route.query.mode
  return ['view', 'edit', 'preview'].includes(q) ? q : defaultMode.value
})
const editing = computed(() => mode.value === 'edit')
const inEditor = computed(() => mode.value !== 'view')
// Switching keeps the reader on the section they were looking at: the two
// modes lay sections out differently (compact rows, a grid against a gallery),
// so the scroll offset alone would land somewhere else. Each top-level section
// carries a `data-anchor` with the same name in every mode. The new mode fades
// in over 150ms, opacity only, so a full-page swap doesn't read as a reload.
const body = ref(null)
const pageEl = computed(() => body.value?.$el)
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
  // The default stays out of the URL; anything else is spelled out, so an
  // unpublished Beginner's Cancel can still reach the (empty) live page.
  await router.replace({ query: { ...route.query, mode: m === defaultMode.value ? undefined : m } })
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

// Edit profile, Preview, Edit and Cancel are icon-only on a phone (the label
// stays as their accessible name), so the header fits beside the title.
const narrow = ref(window.matchMedia('(max-width: 639px)').matches)
const mq = window.matchMedia('(max-width: 639px)')
const onNarrow = (e) => (narrow.value = e.matches)
mq.addEventListener('change', onNarrow)
onBeforeUnmount(() => mq.removeEventListener('change', onNarrow))

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
  // Nothing changed: back to the live page, with nothing to announce.
  const changed = dirty.value || (beginner.value && !account.edits.publishedAt)
  // An office added and left empty is dropped rather than blocking Publish.
  if (draft.value.addresses) {
    const kept = draft.value.addresses.filter((a, i) => i === 0 || a.text?.trim())
    Object.assign(draft.value, { addresses: kept, city: kept[0].city, address: kept[0].text || null })
  }
  account.setProfile(draft.value)
  if (draftMedia.value) account.setMedia(draftMedia.value)
  if (draftLogos.value) account.setLogos(draftLogos.value)
  account.markPublished()
  clearDraft()
  await setMode('view')
  if (changed) toast.success('Published', { id: 'profile-saved', action: { label: 'Copy link', onClick: shareLink } })
}
// Cancel asks only when there's something to lose.
const cancel = () => (dirty.value ? confirmDiscard(() => setMode('view')) : setMode('view'))
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
    <!-- Beside the title: "Unlisted" for a Beginner (not in the directory yet;
         the page still works by link), and "Not published" while the draft
         has changes. A phone has no room for them beside the editor's three
         buttons, so they're left out there while editing; Cancel still asks
         before dropping a draft. -->
    <template v-if="(beginner || dirty) && !(narrow && inEditor)" #title-suffix>
      <Tooltip v-if="beginner" text="Not in the directory until Bronze. Anyone with the link can see it.">
        <Badge theme="gray" variant="subtle" size="md" label="Unlisted" />
      </Tooltip>
      <Badge v-if="dirty" theme="amber" variant="subtle" size="md" label="Not published" />
    </template>
    <!-- Viewing: Copy link and Edit profile. In the editor: Preview (or Edit,
         from Preview), Cancel, Publish, always all three, so nothing shifts
         when the draft changes. Preview and Edit share one width (`w-24`)
         so swapping them doesn't move the row. Publish is the page's one solid button. -->
    <template #action>
      <div v-if="!inEditor" class="flex items-center gap-2">
        <Tooltip text="Copy link">
          <Button icon="lucide-link" aria-label="Copy link" @click="shareLink" />
        </Tooltip>
        <Button
          v-if="canEdit"
          :icon="narrow ? 'lucide-pencil' : undefined"
          :icon-left="narrow ? undefined : 'lucide-pencil'"
          :label="narrow ? undefined : 'Edit profile'"
          aria-label="Edit profile"
          @click="setMode('edit')"
        />
      </div>
      <div v-else class="flex items-center gap-2">
        <Button
          v-if="editing"
          :icon="narrow ? 'lucide-eye' : undefined"
          :icon-left="narrow ? undefined : 'lucide-eye'"
          :label="narrow ? undefined : 'Preview'"
          :class="!narrow && 'w-24'"
          aria-label="Preview"
          @click="setMode('preview')"
        />
        <Button
          v-else
          :icon="narrow ? 'lucide-pencil' : undefined"
          :icon-left="narrow ? undefined : 'lucide-pencil'"
          :label="narrow ? undefined : 'Edit'"
          :class="!narrow && 'w-24'"
          aria-label="Edit"
          @click="setMode('edit')"
        />
        <Button :icon="narrow ? 'lucide-x' : undefined" :label="narrow ? undefined : 'Cancel'" aria-label="Cancel" @click="cancel" />
        <Button variant="solid" label="Publish" @click="publish" />
      </div>
    </template>

    <PartnerProfileBody
      ref="body"
      :partner="p"
      :logo="logo"
      :media="media"
      :logos="logos"
      own
      :editable="editing"
      :errors="errors"
      :replies="account.edits.reviewReplies"
      reviews-to="/connect/profile/reviews"
      @change="edit"
      @update:media="draftMedia = $event"
      @update:logos="draftLogos = $event"
    >
    </PartnerProfileBody>
  </ConnectShell>
</template>
