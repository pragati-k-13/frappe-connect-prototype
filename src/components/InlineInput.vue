<script setup>
import { ref, watch } from 'vue'
import { Textarea, TextInput } from 'frappe-ui'

// A value that is its own control, as Frappe CRM's side panel does it: a ghost
// input that reads as text until it's hovered or focused. It keeps its own
// draft and reports once, when the edit ends: blur or Enter commits a change,
// Esc puts the old value back. Multi-line fields commit on blur only, so Enter
// can start a new line.
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '' },
  label: { type: String, required: true },
  multiline: { type: Boolean, default: false },
  // One line of meaning that may wrap on a narrow screen (a tagline): a
  // textarea that grows with its text, where Enter commits.
  wrap: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  rows: { type: Number, default: 3 },
})
const emit = defineEmits(['commit'])

// frappe-ui's ghost variant has no hover or focus style, so on its own a
// field reads as plain text and nobody knows it can be edited. Hover gives it
// the subtle fill, focus the field's outline, matching frappe-ui's own
// outline input while typing. The textarea takes classes itself; the text
// input puts them on a wrapper, so its rules reach the control inside.
// The textarea's own size is 13px; the page's body text is 14px, so it's set
// back to match, or a field would shrink when you click into it.
const AREA = '!text-p-base hover:!bg-surface-gray-2 focus:!bg-surface-base focus:!ring-1 focus:!ring-outline-gray-4'
const FIELD =
  '[&_[data-slot=control]:hover]:bg-surface-gray-2 [&_[data-slot=control]:focus]:bg-surface-base [&_[data-slot=control]:focus]:ring-1 [&_[data-slot=control]:focus]:ring-outline-gray-4'

const draft = ref(props.modelValue ?? '')
watch(
  () => props.modelValue,
  (v) => (draft.value = v ?? ''),
)

function commit() {
  const next = typeof draft.value === 'string' ? draft.value.trim() : draft.value
  if (next === (props.modelValue ?? '')) return
  emit('commit', next)
}
function cancel(e) {
  draft.value = props.modelValue ?? ''
  e.target.blur()
}
</script>

<template>
  <Textarea
    v-if="multiline || wrap"
    v-model="draft"
    variant="ghost"
    :rows="wrap ? 1 : rows"
    :placeholder="placeholder"
    :aria-label="label"
    :class="['-mx-2 resize-none', AREA, wrap && '!min-h-7 !py-1 [field-sizing:content]']"
    @blur="commit"
    @keydown.enter="wrap && ($event.preventDefault(), $event.target.blur())"
    @keydown.esc.prevent="cancel"
  />
  <TextInput
    v-else
    v-model="draft"
    variant="ghost"
    :type="type"
    :placeholder="placeholder"
    :aria-label="label"
    :class="['-mx-2', FIELD]"
    @blur="commit"
    @keydown.enter.prevent="$event.target.blur()"
    @keydown.esc.prevent="cancel"
  >
    <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="$slots.suffix" #suffix><slot name="suffix" /></template>
  </TextInput>
</template>
