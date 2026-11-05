<script setup>
import { computed, ref, watch } from 'vue'
import { ErrorMessage, Textarea, TextInput } from 'frappe-ui'

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
  // A character limit for a multi-line field, with a count under it.
  max: { type: Number, default: null },
  // A visible field (frappe-ui's gray-filled textarea) instead of the ghost
  // that reads as text: for writing several sentences, where the partner
  // needs to see the box, empty or not.
  boxed: { type: Boolean, default: false },
  // Shown under the field, on the count's line, so it sits right under the
  // box rather than below the count's reserved space.
  error: { type: String, default: '' },
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
// The limit is soft: typing or pasting past it is allowed, so nothing is cut
// off unseen. Over it, the count turns red with an error, focused or not, and
// the page's Publish refuses until it's shortened.
const over = computed(() => props.max != null && String(draft.value).length > props.max)
const shownError = computed(() => (over.value ? `Shorten to ${props.max} characters` : props.error))
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
  <!-- The count fades in (150ms) only while typing. Hidden by opacity, not
       `v-if`, so its line stays reserved and the row doesn't jump on focus. -->
  <div v-if="multiline || wrap" class="group">
    <Textarea
      v-model="draft"
      :variant="boxed ? 'subtle' : 'ghost'"
      :rows="wrap ? 1 : rows"
      :placeholder="placeholder"
      :aria-label="label"
      :class="['resize-none', boxed ? '!text-p-base' : ['-mx-2', AREA], wrap && '!min-h-7 !py-1 [field-sizing:content]']"
      @blur="commit"
      @keydown.enter="wrap && ($event.preventDefault(), $event.target.blur())"
      @keydown.esc.prevent="cancel"
    />
    <div v-if="max || error" class="mt-1 flex items-start gap-3" :class="!boxed && 'pr-2'">
      <ErrorMessage v-if="shownError" :message="shownError" />
      <p
        v-if="max"
        class="ml-auto text-p-sm tabular-nums"
        :class="over ? 'text-ink-red-7' : 'text-ink-gray-5 opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none group-focus-within:opacity-100'"
      >{{ String(draft).length }}/{{ max }}</p>
    </div>
  </div>
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
