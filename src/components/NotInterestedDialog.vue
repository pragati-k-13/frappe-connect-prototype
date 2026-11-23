<script setup>
// Telling a partner you're not taking their work forward.
//
// ⚠️ A DIALOG, BECAUSE IT REACHES SOMEONE ELSE. Hide is private and instant;
// this tells the firm, which can't be called back. It replaces a 5-second
// hold with Undo.
//
// ⚠️ REASONS TO PICK, NOT A BOX TO FILL. A blank box asks the business to
// write a rejection from nothing, which is the pressure this avoids. Every
// reason is optional and several can be picked. The note is a small field
// that's always there, one line until typed into: it was a box behind "Add a
// note", which then had no way to close.
//
// ⚠️ IT GOES AS A STATUS LINE, not a message in the business's voice — see
// `sendNotInterested`. A note, if typed, follows it as an ordinary message.
// No preview: the line is fixed, and the title and button already say the
// firm will be told.
//
// ⚠️ A STATEMENT, NOT A QUESTION. "Tell X you're not interested?" read as
// "are you sure?" and put the rejection on the business. The title names the
// firm, where a long name can wrap; the button says what happens in two
// words, so it never has to fit the name.
//
// ⚠️ NOTHING MOVES ON A PICK. The icon swaps, plus to check, in the same slot
// (a check added only on selection widened the chip), and a picked chip keeps
// a transparent 1px border where the unpicked one has its outline.
import { ref, watch } from 'vue'
import { Button, Dialog, Textarea } from 'frappe-ui'
import IconPlus from '~icons/lucide/plus'
import IconCheck from '~icons/lucide/check'
import FilterChip from './FilterChip.vue'
import { NOT_INTERESTED_REASONS as REASONS } from '../data/notInterested'

defineProps({
  partnerName: { type: String, default: '' },
})
const emit = defineEmits(['send'])
const open = defineModel('open', { type: Boolean, default: false })

// A note, not a letter: room for a sentence or two.
const NOTE_MAX = 300

const picked = ref([])
const note = ref('')
// Fresh on every open: the last partner's reasons aren't this one's.
watch(open, (o) => {
  if (!o) return
  picked.value = []
  note.value = ''
})

const toggle = (value) => {
  picked.value = picked.value.includes(value)
    ? picked.value.filter((v) => v !== value)
    : [...picked.value, value]
}

const send = () => {
  emit('send', { reasons: [...picked.value], note: note.value })
  open.value = false
}
</script>

<template>
  <Dialog v-model="open" size="md" :title="`Not interested in ${partnerName}`">
    <template #default>
      <div class="flex flex-wrap gap-2">
        <FilterChip
          v-for="r in REASONS"
          :key="r.value"
          :label="r.label"
          :icon="picked.includes(r.value) ? IconCheck : IconPlus"
          :selected="picked.includes(r.value)"
          :class="picked.includes(r.value) ? 'border border-transparent' : ''"
          @toggle="toggle(r.value)"
        />
      </div>

      <!-- One line that grows with what's typed (`field-sizing: content`), up
           to five, then scrolls. The label says who reads it, so the
           placeholder prompts what a note is for rather than repeat it. Capped at `NOTE_MAX` characters. The count
           sits on the label's line, once there's something to count, so it
           never pushes the buttons down. -->
      <div class="mt-4">
        <div class="mb-1.5 flex h-4 items-center justify-between gap-2">
          <label for="fc-not-interested-note" class="text-xs text-ink-gray-5">Note to them (optional)</label>
          <span v-if="note" class="text-xs tabular-nums text-ink-gray-5">{{ note.length }}/{{ NOTE_MAX }}</span>
        </div>
        <Textarea
          id="fc-not-interested-note"
          v-model="note"
          class="fc-note"
          :rows="1"
          :maxlength="NOTE_MAX"
          placeholder="Anything else they should know"
        />
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <Button variant="subtle" label="Cancel" @click="open = false" />
        <Button variant="solid" label="Let them know" @click="send" />
      </div>
    </template>
  </Dialog>
</template>

<!-- Not scoped: frappe-ui's Textarea puts the class on the <textarea> it
     renders, which a scoped rule from here can't reach. -->
<style>
textarea.fc-note {
  field-sizing: content;
  min-height: 0;
  max-height: calc(5lh + 1rem);
  resize: none;
}
</style>
