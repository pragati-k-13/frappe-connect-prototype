<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { Badge, Button, Dropdown, ErrorMessage, Textarea, dialog, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PartnerReviewsSection from '../components/PartnerReviewsSection.vue'
import ReviewReply from '../components/ReviewReply.vue'
import { usePartnerAccountStore } from '../stores/partnerAccount'

// SCREEN — the partner's own reviews, every one, with Reply and Report. Its
// own page rather than part of the profile's edit mode: a reply goes live the
// moment it's published, and edit mode is a draft that waits for Publish.
// Reached from "View all" on the partner's Public profile, which shows it
// whenever there's a review.
//
// A report doesn't hide the review: it stays up, marked Reported, until Frappe
// decides. Hiding on a click would let a firm clear its own bad reviews.
const router = useRouter()
const account = usePartnerAccountStore()
const p = computed(() => account.ownProfile)
const replies = computed(() => account.edits.reviewReplies)
const reports = computed(() => account.edits.reviewReports)

// ── Replying ────────────────────────────────────────────────────────────────
// One reply open at a time. Publishing an empty one says so under the box.
const replyingTo = ref(null)
const draft = ref('')
const tried = ref(false)
const unsent = computed(() => replyingTo.value !== null && draft.value.trim() !== (replies.value[replyingTo.value] ?? ''))
const confirmDiscard = (then) =>
  dialog.danger({
    title: 'Discard reply?',
    message: 'What you’ve written won’t be published.',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep writing',
    size: 'sm',
    onConfirm: () => {
      close()
      then?.()
    },
  })
function start(r) {
  const open = () => {
    replyingTo.value = r.id
    draft.value = replies.value[r.id] ?? ''
    tried.value = false
    nextTick(() => document.querySelector(`[data-reply="${r.id}"] textarea`)?.focus())
  }
  unsent.value ? confirmDiscard(open) : open()
}
function close() {
  replyingTo.value = null
  draft.value = ''
  tried.value = false
}
function publish(r) {
  tried.value = true
  const text = draft.value.trim()
  if (!text) return
  account.replyToReview(r.id, text)
  close()
  toast.success('Reply published')
}

// ── Reporting ───────────────────────────────────────────────────────────────
const REPORT_REASONS = ['Spam', 'Not our client', 'Offensive']
const reportMenu = (r) =>
  REPORT_REASONS.map((reason) => ({
    label: reason,
    onClick: () => {
      account.reportReview(r.id, reason)
      toast.success('Reported to Frappe')
    },
  }))

// Leaving with an unsent reply asks first: in the app through the router, and
// closing or reloading the tab through the browser's own prompt.
onBeforeRouteLeave((to) => {
  if (!unsent.value) return true
  confirmDiscard(() => router.push(to))
  return false
})
const warnUnload = (e) => {
  if (unsent.value) e.preventDefault()
}
window.addEventListener('beforeunload', warnUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnUnload))
</script>

<template>
  <ConnectShell root-label="Public profile" root-to="/connect/profile" crumb="Reviews">
    <div class="fc-page-read pb-24 pt-8">
      <EmptyState v-if="!p.reviews" icon="lucide-star" title="No reviews yet" />
      <PartnerReviewsSection v-else :partner="p" own full>
        <template #actions="{ review: r }">
          <ReviewReply v-if="replyingTo !== r.id" :partner="p" :text="replies[r.id]" />
          <div v-if="replyingTo === r.id" class="mt-4 space-y-2" :data-reply="r.id">
            <Textarea v-model="draft" :rows="3" :aria-label="`Reply to ${r.name}`" placeholder="Write a public reply" />
            <!-- The message sits beside the buttons, so showing it doesn't
                 move them. -->
            <div class="flex items-center gap-2">
              <ErrorMessage v-if="tried && !draft.trim()" message="Write a reply first" />
              <span class="flex-1" />
              <Button label="Cancel" @click="close" />
              <Button variant="solid" label="Publish reply" @click="publish(r)" />
            </div>
          </div>
          <div v-else class="-ml-2 mt-3 flex items-center gap-1">
            <Button variant="ghost" :label="replies[r.id] ? 'Edit reply' : 'Reply'" @click="start(r)" />
            <template v-if="reports[r.id]">
              <Badge theme="amber" variant="subtle" size="md" :label="`Reported: ${reports[r.id].reason}`" />
              <Button variant="ghost" label="Undo report" @click="account.reportReview(r.id, null)" />
            </template>
            <Dropdown v-else :options="reportMenu(r)">
              <Button variant="ghost" class="data-[state=open]:bg-surface-gray-3" label="Report">
                <template #suffix><LucideChevronDown class="size-4" /></template>
              </Button>
            </Dropdown>
          </div>
        </template>
      </PartnerReviewsSection>
    </div>
  </ConnectShell>
</template>
