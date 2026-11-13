<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Checkbox, Combobox, Dialog, Textarea } from 'frappe-ui'

// Adding or editing one of the partner's office addresses, from the About
// card in edit mode. Saving changes the draft only; Publish puts it live.
//
// City is searchable, and a city that isn't listed can be added as typed:
// the directory's list only has the cities partners already use. Both fields
// are required, so a half-filled address never reaches the draft.
const props = defineProps({
  open: { type: Boolean, default: false },
  // The address being edited, or null to add one.
  address: { type: Object, default: null },
  // Whether it's the main office (always true for a partner's only address).
  main: { type: Boolean, default: false },
  // How many addresses there are, this one included when editing.
  count: { type: Number, default: 1 },
  cities: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:open', 'save', 'remove'])

const adding = computed(() => !props.address)
const form = reactive({ city: '', text: '', main: false })
const tried = ref(false)
const extra = ref([])
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    form.city = props.address?.city ?? ''
    form.text = props.address?.text ?? ''
    form.main = false
    tried.value = false
    extra.value = []
  },
)

const known = computed(() => [...new Set([...props.cities, ...extra.value, form.city].filter(Boolean))].sort())
const options = computed(() => [
  ...known.value.map((c) => ({ label: c, value: c })),
  {
    type: 'custom',
    key: 'add',
    label: 'Add city',
    slot: 'add',
    condition: ({ query }) => {
      const q = query.trim().toLowerCase()
      return Boolean(q) && !known.value.some((c) => c.toLowerCase() === q || c.split(',')[0].trim().toLowerCase() === q)
    },
    onClick: ({ query }) => {
      const city = query.trim()
      if (!city) return
      extra.value = [...extra.value, city]
      form.city = city
    },
  },
])

// "Make this the main office" only when there's another address for it to
// take over from, and it isn't the main one already.
const canMakeMain = computed(() => !props.main && (adding.value ? props.count >= 1 : props.count >= 2))
const canRemove = computed(() => !adding.value && props.count >= 2)

const errors = computed(() =>
  tried.value ? { city: form.city ? '' : 'Choose a city', text: form.text.trim() ? '' : 'Enter the street address' } : {},
)
function save() {
  tried.value = true
  if (!form.city || !form.text.trim()) return
  emit('save', { city: form.city, text: form.text.trim(), main: form.main })
  emit('update:open', false)
}
function remove() {
  emit('remove')
  emit('update:open', false)
}
</script>

<template>
  <Dialog
    :model-value="open"
    :title="adding ? 'Add address' : 'Edit address'"
    size="md"
    @update:model-value="emit('update:open', $event)"
  >
    <template #default>
      <form novalidate class="space-y-4" @submit.prevent="save">
        <Combobox
          v-model="form.city"
          :options="options"
          label="City"
          required
          placeholder="Search cities"
          open-on-focus
          :error="errors.city"
        >
          <template #item-add="{ query }">
            <span class="truncate">Add <span class="font-medium text-ink-gray-8">{{ query }}</span></span>
          </template>
        </Combobox>
        <Textarea v-model="form.text" label="Street address" required :rows="3" :error="errors.text" />
        <Checkbox v-if="canMakeMain" v-model="form.main" label="Make this the main office" />
        <div class="flex items-center gap-2 pt-1">
          <Button v-if="canRemove" variant="ghost" theme="red" label="Remove" @click="remove" />
          <span class="flex-1" />
          <Button label="Cancel" @click="emit('update:open', false)" />
          <Button variant="solid" type="submit" :label="adding ? 'Add address' : 'Save'" />
        </div>
      </form>
    </template>
  </Dialog>
</template>
