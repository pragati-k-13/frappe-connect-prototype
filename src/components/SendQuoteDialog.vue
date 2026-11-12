<script setup>
import { reactive, ref, watch } from 'vue'
import { Button, Dialog, Textarea, TextInput } from 'frappe-ui'

// A partner's quote: a figure, how long, and a sentence. Opened from "Send new
// quote" on a requirements update, prefilled from the quote it replaces, so a
// partner changing only the price changes only the price.
// See docs/edit-requirements.md, "Partner responses".
const props = defineProps({
  open: { type: Boolean, default: false },
  from: { type: Object, default: null },
})
const emit = defineEmits(['update:open', 'send'])

const form = reactive({ price: '', weeks: '', note: '' })
const tried = ref(false)
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    Object.assign(form, { price: props.from?.price ?? '', weeks: String(props.from?.weeks ?? ''), note: props.from?.note ?? '' })
    tried.value = false
  },
)

const errorsOf = () => ({
  ...(form.price.trim() ? {} : { price: 'Enter a price' }),
  ...(Number(form.weeks) > 0 ? {} : { weeks: 'Enter the number of weeks' }),
})

function send() {
  tried.value = true
  if (Object.keys(errorsOf()).length) return
  emit('send', { price: form.price.trim(), weeks: Number(form.weeks), note: form.note.trim() })
  emit('update:open', false)
}
</script>

<template>
  <Dialog :model-value="open" title="Send quote" size="md" @update:model-value="emit('update:open', $event)">
    <template #default>
      <form novalidate class="space-y-4" @submit.prevent="send">
        <div class="grid grid-cols-2 gap-4">
          <TextInput v-model="form.price" label="Price" placeholder="₹9,75,000" required :error="tried ? errorsOf().price : ''" />
          <TextInput v-model="form.weeks" type="number" label="Weeks" required :error="tried ? errorsOf().weeks : ''" />
        </div>
        <Textarea v-model="form.note" label="Note" :rows="4" />
        <div class="flex justify-end gap-2">
          <Button variant="subtle" size="sm" label="Cancel" @click="emit('update:open', false)" />
          <Button variant="solid" size="sm" type="submit" label="Send quote" />
        </div>
      </form>
    </template>
  </Dialog>
</template>
