<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Button, Dialog, Textarea, toast } from 'frappe-ui'
import { useConnectStore } from '../stores/connect'

// Tell Frappe something, from anywhere, at any time.
//
// ⚠️ THE THIRD FEEDBACK MOMENT, and the only unprompted one. The other two are
// asked AT something: one tap on why a partner was chosen, a rating at go-live,
// plus the "does this look right?" line on the recommendation. Every one of
// those is Frappe choosing the question and the moment — which is what makes
// them answerable, and also what makes them useless for the thing nobody
// predicted. This is the other half: no question, no moment, whatever is on
// somebody's mind while it still is.
//
// ⚠️ NO RATING, NO CATEGORY, NO SUBJECT LINE. A box and a button. Every field
// added here is a toll on somebody who was not asked to be here in the first
// place, and a category picker in particular makes a person classify their own
// complaint before they are allowed to make it — the surest way to get a shrug
// instead of a sentence.
//
// ⚠️ THE SCREEN IS RECORDED, NOT ASKED FOR. "Which page were you on?" is a
// question the product can answer itself, and the route is the single most
// useful thing attached to a loose sentence — "this is confusing" is noise
// until you know it was said on the checkout.
const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open'])

const store = useConnectStore()
const route = useRoute()

const text = ref('')
const sent = ref(false)

// Reset on OPEN, not on close, so nothing empties while the dialog fades out —
// the flash this codebase has now fixed in three other dialogs.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      text.value = ''
      sent.value = false
    }
  },
)

const canSend = computed(() => text.value.trim().length > 0)

const send = () => {
  if (!canSend.value) return
  store.recordProductFeedback({ text: text.value, route: route.fullPath })
  sent.value = true
  // ⚠️ THE DIALOG CLOSES ITSELF. A "thanks" state somebody has to dismiss makes
  // them press twice to finish a thing they did as a favour. The toast carries
  // the receipt, on the screen they were already looking at.
  emit('update:open', false)
  toast.success('Thanks — that went to Frappe', {
    description: 'We read all of it, and we will not reply unless you asked us to.',
  })
}
</script>

<template>
  <Dialog
    :model-value="open"
    title="Tell Frappe something"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <p class="text-p-base leading-relaxed text-ink-gray-6">
        Anything about Connect, the packs, or a partner you are working with. It goes to Frappe,
        not to your partner.
      </p>

      <div class="mt-4">
        <!-- ⚠️ NO LABEL ON THE FIELD. The heading is the question and the
             placeholder is the prompt; a "Your feedback" label between them
             would be the third time this dialog asks for the same thing. -->
        <Textarea
          v-model="text"
          :rows="5"
          placeholder="What is on your mind?"
          aria-label="Your feedback"
        />
      </div>

      <div class="mt-4 flex items-center gap-2">
        <!-- ⚠️ ENABLED ALWAYS, like every other primary in this app. A disabled
             button leaves somebody hunting for what is stopping them with
             nothing to press and nothing to read; `send` simply does nothing
             on an empty box, and the box is plainly empty. -->
        <Button variant="solid" label="Send" @click="send" />
        <Button variant="ghost" label="Cancel" @click="emit('update:open', false)" />
      </div>
    </template>
  </Dialog>
</template>
