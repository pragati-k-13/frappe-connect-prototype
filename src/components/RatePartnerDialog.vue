<script setup>
import { computed, ref } from 'vue'
import { Button, Dialog, Rating, Textarea, toast } from 'frappe-ui'
import { useConnectStore } from '../stores/connect'

// Rate the partner, at go-live.
//
// ⚠️ ASKED ONCE, AND LATE. The obvious place for this is "after every stage",
// and that is the version that stops being answered: halfway through a
// configuration the honest answer is "nothing has happened yet". Go-live is the
// first moment somebody has an opinion worth publishing and the last moment
// they are still paying attention.
//
// ⚠️ IT IS PUBLISHED. The rating goes on the partner's public profile, beside
// the reviews already there, and this dialog says so before the stars rather
// than in a confirmation afterwards. A review someone did not know was public
// is the kind of thing that ends up in a complaint.
const props = defineProps({
  open: { type: Boolean, default: false },
  project: { type: Object, default: null },
  partner: { type: Object, default: null },
})
const emit = defineEmits(['update:open', 'done'])

const store = useConnectStore()

const rating = ref(0)
const text = ref('')

const existing = computed(() =>
  store.feedback.find((f) => f.projectId === props.project?.id) ?? null,
)

const submit = () => {
  if (!rating.value) return toast.info('Pick a rating first')
  store.recordFeedback({
    projectId: props.project.id,
    partnerId: props.partner?.id ?? null,
    rating: rating.value,
    text: text.value,
  })
  emit('done')
  emit('update:open', false)
  toast.success('Thanks — this goes on their profile')
}
</script>

<template>
  <Dialog
    :model-value="open"
    :title="`How did it go with ${partner?.name ?? 'your partner'}?`"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- ⚠️ The DEFAULT slot, not `#body-content`: this version of frappe-ui's
         Dialog exposes only `default`, `title` and `actions`, and the older
         `#body-content` name fails silently — the dialog opens empty. Same trap
         documented in `NewProjectDialog`. -->
    <template #default>
      <p class="text-p-base leading-relaxed text-ink-gray-6">
        This is published on {{ partner?.name ?? 'their' }} profile, with your company name — it is
        how the next business decides who to work with.
      </p>

      <!-- ⚠️ frappe-ui's own `Rating`, not five hand-rolled buttons: it has the
           keyboard behaviour and the half-star handling already, and a lookalike
           row of star glyphs is a control that cannot be tabbed to.

           ⚠️ Its `label` is RENDERED, not just announced — this had a heading of
           its own above it as well and the words "Your rating" appeared twice,
           one line apart. The component's own label is the one that keeps the
           control's spacing. -->
      <Rating v-model="rating" class="mt-4" :max="5" size="lg" label="Your rating" />

      <Textarea
        v-model="text"
        class="mt-4"
        label="Anything you'd tell another business?"
        :rows="4"
        placeholder="What they were good at, and what to watch out for."
      />

      <div class="mt-5 flex items-center gap-2">
        <Button variant="solid" label="Publish" @click="submit" />
        <!-- ⚠️ A real way out. A review request with no dismissal is how a
             product teaches people that its dialogs are traps. -->
        <Button variant="ghost" label="Not now" @click="emit('update:open', false)" />
      </div>

      <p v-if="existing" class="mt-3 text-p-sm text-ink-gray-5">
        You rated them {{ existing.rating }} out of 5 already. Publishing again replaces it.
      </p>
    </template>
  </Dialog>
</template>
