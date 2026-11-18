<script setup>
// Sharing a draft's requirements with every matching partner.
//
// ⚠️ A CONFIRMATION, NOT A FORM. The budget and the description are asked in
// New project, so by now there is usually nothing left to fill in, and this is
// the deliberate yes before messages go out to several firms. Only what's still
// missing is asked — a draft saved without a description gets that one field.
// Both write straight into the draft (`update-brief`), so closing keeps them.
import { computed, ref, watch } from 'vue'
import { Button, Dialog, FormControl, Textarea } from 'frappe-ui'
import { briefErrors, budgetBandsFor } from '../data/custom'

const props = defineProps({
  brief: { type: Object, required: true },
  country: { type: String, default: '' },
  count: { type: Number, required: true },
  // First share on the account: say once what happens after.
  firstTime: { type: Boolean, default: false },
})
const emit = defineEmits(['update-brief', 'share'])
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
const asking = computed(() => ask.value.budget || ask.value.scope)
const errors = computed(() => (tried.value ? briefErrors(props.brief) : {}))
const bands = computed(() => budgetBandsFor(props.country))

const share = () => {
  tried.value = true
  if (Object.keys(briefErrors(props.brief)).length) return
  open.value = false
  emit('share')
}
</script>

<template>
  <Dialog
    v-model="open"
    :size="asking ? 'md' : 'sm'"
    :title="`Share with ${count} ${count === 1 ? 'partner' : 'partners'}?`"
  >
    <template #default>
      <form novalidate class="space-y-4" @submit.prevent="share">
        <p class="text-p-base text-ink-gray-6">
          They get your answers and description. Your name and contact details stay hidden.
          <template v-if="firstTime">Partners reply with quotes, you hire one, then pay per milestone.</template>
        </p>
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
        <div v-if="ask.scope">
          <Textarea
            :model-value="brief.scope"
            label="What do you want built?"
            placeholder="What do you make or sell, who are your customers, how does it run today, what keeps going wrong, and what must it connect to or prove?"
            :rows="5"
            required
            :error="errors.scope"
            @update:model-value="emit('update-brief', { scope: $event })"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="subtle" label="Cancel" @click="open = false" />
          <Button variant="solid" label="Share" icon-left="lucide-send" type="submit" />
        </div>
      </form>
    </template>
  </Dialog>
</template>
