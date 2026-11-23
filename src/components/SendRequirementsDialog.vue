<script setup>
// Send on the project's table, when the requirements can't go yet.
//
// ⚠️ ONLY WHAT'S MISSING, AND ONLY WHEN SOMETHING IS. Send with a complete
// brief needs no dialog: the requirements are in the rail and each Send is a
// choice of one firm, so a confirmation would repeat the page. New project asks
// for the budget and the description, so this mostly meets older projects.
// Both fields write straight into the project (`update-brief`), so Cancel keeps
// what was typed and the next Send doesn't ask again.
import { computed, ref, watch } from 'vue'
import { Button, Dialog, FormControl, Textarea } from 'frappe-ui'
import { briefErrors, budgetBandsFor } from '../data/custom'

const props = defineProps({
  brief: { type: Object, required: true },
  country: { type: String, default: '' },
  partnerName: { type: String, default: '' },
})
const emit = defineEmits(['update-brief', 'send'])
const open = defineModel('open', { type: Boolean, default: false })

// What's missing is fixed when the dialog opens, so a field doesn't vanish
// from under the cursor the moment it's filled.
const ask = ref({ budget: false, scope: false })
const tried = ref(false)
watch(open, (o) => {
  if (!o) return
  tried.value = false
  const missing = briefErrors(props.brief)
  ask.value = { budget: Boolean(missing.budget), scope: Boolean(missing.scope) }
})
const errors = computed(() => (tried.value ? briefErrors(props.brief) : {}))
const bands = computed(() => budgetBandsFor(props.country))

const send = () => {
  tried.value = true
  if (Object.keys(briefErrors(props.brief)).length) return
  // Send first: the parent reads which partner from the open state.
  emit('send')
  open.value = false
}
</script>

<template>
  <Dialog v-model="open" size="md" :title="`Send to ${partnerName}`">
    <template #default>
      <form novalidate class="space-y-4" @submit.prevent="send">
        <FormControl
          v-if="ask.budget"
          type="select"
          :model-value="brief.budget"
          label="Your budget"
          placeholder="Select a range"
          required
          :options="bands"
          :error="errors.budget"
          @update:model-value="emit('update-brief', { budget: $event })"
        />
        <Textarea
          v-if="ask.scope"
          :model-value="brief.scope"
          label="What do you want built?"
          placeholder="What do you make or sell, who are your customers, how does it run today, what keeps going wrong, and what must it connect to or prove?"
          :rows="5"
          required
          :error="errors.scope"
          @update:model-value="emit('update-brief', { scope: $event })"
        />
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="subtle" label="Cancel" @click="open = false" />
          <Button variant="solid" label="Send" type="submit" />
        </div>
      </form>
    </template>
  </Dialog>
</template>
