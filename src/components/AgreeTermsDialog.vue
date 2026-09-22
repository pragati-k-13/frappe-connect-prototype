<script setup>
import { ref } from 'vue'
import { Button, Checkbox, Dialog } from 'frappe-ui'

// The contract, as one checkbox.
//
// ⚠️ A TASK, NOT A STAGE. It was drawn as its own step in the progress bar and
// the whole content of that step was this tick — a stage whose entire business
// is "agree" reads as ceremony, and it put a wall between choosing a firm and
// starting work with them where there is really only a signature.
//
// ⚠️ FRAPPE IS NOT A PARTY TO IT, and that is the sentence this dialog exists
// to carry. Custom work is paid entirely to the partner; the agreement is
// between the business and the firm, and a tick collected inside Frappe's
// product could easily be read as Frappe standing behind the engagement. It
// does not, and saying so here is cheaper than explaining it later.
defineProps({
  open: { type: Boolean, default: false },
  partner: { type: Object, default: null },
})
const emit = defineEmits(['update:open', 'agreed'])

const agreed = ref(false)

const confirm = () => {
  if (!agreed.value) return
  emit('agreed')
  emit('update:open', false)
}
</script>

<template>
  <Dialog
    :model-value="open"
    title="Terms of engagement"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- ⚠️ The DEFAULT slot, not `#body-content`: this version of frappe-ui's
         Dialog exposes only `default`, `title` and `actions`, and the older
         `#body-content` name fails silently — the dialog opens empty. Same trap
         documented in `NewProjectDialog`. -->
    <template #default>
      <p class="text-p-base leading-relaxed text-ink-gray-6">
        Work starts once both sides have agreed the terms. The scope, the price and the timeline
        are the ones in {{ partner?.name ?? 'your partner' }}'s quote, and anything beyond them is a
        change the two of you agree separately.
      </p>

      <ul class="mt-4 space-y-2 text-p-base text-ink-gray-7">
        <li>You pay {{ partner?.name ?? 'your partner' }} directly. Frappe takes no fee and is not a party to the agreement.</li>
        <li>Frappe Cloud hosting is billed to your partner through your partner code, and billed on to you.</li>
        <li>Frappe can see that this project exists, not what is in your site.</li>
      </ul>

      <div class="mt-5">
        <Checkbox
          v-model="agreed"
          size="md"
          label="I agree to these terms of engagement"
        />
      </div>

      <div class="mt-5 flex items-center gap-2">
        <Button variant="solid" label="Agree and continue" @click="confirm" />
        <Button variant="ghost" label="Cancel" @click="emit('update:open', false)" />
      </div>
    </template>
  </Dialog>
</template>
