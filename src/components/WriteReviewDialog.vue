<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Avatar, Button, Dialog, Rating, TabButtons, Textarea, toast } from 'frappe-ui'
import { useConnectStore } from '../stores/connect'
import { firmDomain } from '../data/partners'

// Writing a review of a partner, the same form for everyone: a business that
// hired them here (prompted when its project completes) or a
// long-time customer their partner sent the profile link to, who has no
// project here at all.
//
// It's public, so it says who it's posted as before anything else. The
// rating and the text are required, each with its own message; "Would you
// recommend them?" can be left alone, or answered "Not sure". Someone from the
// partner's own firm can't review it. Writing again edits the earlier review.
const props = defineProps({
  open: { type: Boolean, default: false },
  partner: { type: Object, default: null },
  // The project it came from, when there is one.
  project: { type: Object, default: null },
})
const emit = defineEmits(['update:open', 'published'])

const store = useConnectStore()
const viewer = computed(() => store.viewer)
const ownFirm = computed(() => Boolean(props.partner) && viewer.value.email?.split('@')[1] === firmDomain(props.partner))
const earlier = computed(() => (props.partner ? store.myReviewOf(props.partner.id) : null))

const RECOMMEND = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Not sure', value: 'unsure' },
]
const form = reactive({ stars: 0, recommend: null, text: '' })
const tried = ref(false)
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    const e = earlier.value
    form.stars = e?.stars ?? 0
    form.recommend = e?.recommend ?? null
    form.text = e?.text ?? ''
    tried.value = false
  },
)
const errors = computed(() =>
  tried.value
    ? {
        stars: form.stars ? '' : 'Pick a rating',
        text: form.text.trim() ? '' : 'Write a few words',
      }
    : {},
)

function publish() {
  tried.value = true
  if (!form.stars || !form.text.trim()) return
  const wasEditing = Boolean(earlier.value)
  const review = store.publishReview({
    partnerId: props.partner.id,
    projectId: props.project?.id ?? null,
    stars: form.stars,
    recommend: form.recommend,
    text: form.text,
  })
  emit('update:open', false)
  emit('published', review)
  toast.success(wasEditing ? 'Review saved' : 'Review published')
}
</script>

<template>
  <Dialog
    :model-value="open"
    :title="earlier && !ownFirm ? 'Edit your review' : `Review ${partner?.name ?? 'your partner'}`"
    size="md"
    @update:model-value="emit('update:open', $event)"
  >
    <template #default>
      <!-- Their own firm: said plainly, nothing to fill in. -->
      <template v-if="ownFirm">
        <p class="text-p-base text-ink-gray-7">You can’t review your own firm.</p>
        <div class="mt-5 flex justify-end">
          <Button label="Close" @click="emit('update:open', false)" />
        </div>
      </template>

      <form v-else novalidate class="space-y-4" @submit.prevent="publish">
        <!-- Public, so who it's posted as comes first. -->
        <p class="flex items-center gap-2 text-p-base text-ink-gray-6">
          <Avatar size="sm" :label="viewer.name" />
          Posting as {{ viewer.name }}, {{ viewer.company }}
        </p>
        <!-- Labels written out to match the fields around them: frappe-ui's
             label, with the same red * the required fields carry. -->
        <div class="space-y-1.5">
          <p class="text-sm text-ink-gray-6">
            Your rating <span class="select-none text-ink-red-5" aria-hidden="true">*</span><span class="sr-only">(required)</span>
          </p>
          <Rating v-model="form.stars" :max="5" size="lg" aria-label="Your rating" />
          <!-- The same red as the fields' own errors (ErrorMessage's is darker). -->
          <p v-if="errors.stars" class="text-p-sm text-ink-red-5">{{ errors.stars }}</p>
        </div>
        <!-- Optional: nothing picked is an answer too, and "Not sure" says so
             for anyone who tapped and changed their mind. -->
        <div class="space-y-1.5">
          <p class="text-sm text-ink-gray-6">Would you recommend them?</p>
          <TabButtons v-model="form.recommend" :options="RECOMMEND" />
        </div>
        <Textarea
          v-model="form.text"
          label="Your review"
          :rows="5"
          required
          placeholder="What did they set up for you, how did it go, and what should the next business know?"
          :error="errors.text"
        />
        <div class="flex justify-end gap-2 pt-1">
          <Button label="Cancel" @click="emit('update:open', false)" />
          <Button variant="solid" type="submit" :label="earlier ? 'Save review' : 'Publish review'" />
        </div>
      </form>
    </template>
  </Dialog>
</template>
