<script setup>
import { ref, watch } from 'vue'
import { Alert, Button, Dialog, ScrollArea, dialog } from 'frappe-ui'
import RequirementsForm from './RequirementsForm.vue'
import BriefSummary from './BriefSummary.vue'
import { useScrollFade } from '../lib/scrollFade'

// Everything on a brief that is not the first thing you need from it.
//
// ⚠️ READ ONCE, TOP TO BOTTOM, by someone deciding whether to quote. So it is
// shaped as a document, not a record:
//
//   title      the project's name — what the card they opened is called
//   facts      the deciding numbers, as the card's own icon facts: who, how
//              big, what budget, when
//   scope      the one long read, with the modules it covers under it
//   today      how they run now, one line per answer
//   fixed      what they want fixed, one per line
//   looking    who they asked for, as one sentence
//
// It was one flat list of label/value rows between dividers, which gave every
// fact the same weight and put the three that decide it mid-list — and printed
// "Systems that do not talk to each other" twice, once as the operations answer
// and once as a problem.
//
// ⚠️ THREE TONES: title and headings gray-8, every value gray-6, icons gray-5.
// Values were gray-7, a shade darker than the card this opens from and too
// close to the headings to tell the sections apart at a glance.
//
// ⚠️ BUILT FROM THE SNAPSHOT, not from the store. The brief on the message is
// what was sent; the account's answers have kept moving since.
const props = defineProps({
  open: { type: Boolean, default: false },
  brief: { type: Object, default: null },
  // The business reading its own requirements, rather than a partner reading
  // them. Only the wording changes: "you", not "they".
  own: { type: Boolean, default: false },
  // What the caller already shows, so the dialog doesn't repeat it:
  //   'description'  opened from under a message, whose text it is
  //   'facts'        the partner Lead page, whose side panel lists Budget,
  //                  Timeline, Apps, industry and size (the rest stay here)
  omit: { type: Array, default: () => [] },
  // The version this one replaced, when opened from an update. Changed values
  // show the old one struck through before the new one.
  previous: { type: Object, default: null },
  // The business's own view: an Edit button, or, once editing is locked, the
  // line that says why (`lockNote`).
  editable: { type: Boolean, default: false },
  lockNote: { type: String, default: '' },
  // The company's name, when it went out with these requirements rather than
  // separately (a pack booking, a direct contact). Leads the facts.
  companyName: { type: String, default: '' },
  // The project these requirements belong to — what Edit edits.
  projectId: { type: String, default: null },
  // After Send: close (a thread, which scrolls to the new update card), or stay
  // open showing the new version (the project page).
  closeOnSave: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'saved'])

// ── Editing, in place ───────────────────────────────────────────────────────
// ⚠️ ONE DIALOG, TWO STATES. Edit used to close this dialog and open a second
// one titled "Edit requirements": the overlay flickered, the title changed,
// the scroll was lost, and Cancel had to reopen this one. Now Edit turns the
// body into fields, the title stays, and the footer becomes Cancel and Send.
const editing = ref(false)
const form = ref(null)
watch(
  () => props.open,
  (isOpen) => isOpen && (editing.value = false),
)
// The fade at the scroll edge, while more is below — see `useScrollFade`.
const scroller = ref(null)
const { more, remeasure } = useScrollFade(scroller)
watch(editing, remeasure)

const editActions = [{ label: 'Edit', variant: 'subtle', iconLeft: 'lucide-pencil', onClick: () => (editing.value = true) }]

// ⚠️ UNSAVED EDITS ARE ASKED ABOUT, NOT DROPPED. Cancel, ×, Esc and the overlay
// all come through here; with nothing changed they just leave.
const leave = (then) => {
  if (!form.value?.dirty) return then()
  // ⚠️ DANGER, NOT CONFIRM: discarded edits can't be got back, and the
  // destructive pattern gives that a red Discard (frappe-ui `dialog.danger`).
  dialog.danger({
    title: 'Discard changes?',
    message: 'Your edits won’t be sent, and can’t be recovered.',
    confirmLabel: 'Discard',
    size: 'sm',
    onConfirm: () => then(),
  })
}
const cancel = () => leave(() => (editing.value = false))
const onOpen = (value) => {
  if (value || !editing.value) return emit('update:open', value)
  leave(() => emit('update:open', false))
}

const send = () => {
  const result = form.value?.submit()
  if (result === false) return
  if (result) emit('saved', result)
  if (props.closeOnSave) emit('update:open', false)
  else editing.value = false
}
</script>

<template>
  <!-- `md`, not `lg`: the text is prose now, and 448px keeps its lines under
       about 75 characters. -->
  <Dialog
    :model-value="open"
    :title="own ? 'Your requirements' : 'Requirements'"
    :actions="editable && !lockNote && projectId && !editing ? editActions : []"
    size="md"
    @update:model-value="onOpen"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <!-- No negative margin: the pinned header has a solid background, and
           content pulled up under it loses its first line. -->
      <!-- A ScrollArea, as in `PackTermsDialog`: frappe-ui's scrollbar, shown
           on scroll, in place of the browser's. -->
      <!-- `fc-scroll-tight` while editing: the body's own 24px under the fields
           plus the footer's 16px left a 40px empty band above Cancel and Send. -->
      <ScrollArea
        v-if="brief"
        ref="scroller"
        class="fc-scroll-dialog -mr-4 sm:-mr-6"
        :class="{ 'fc-scroll-tight': editing, 'fc-scroll-more': more }"
        viewport-class="pr-4 sm:pr-6"
      >
      <!-- Editing: what Send does that the button can't say, read before the
           fields rather than found beside Send. A frappe-ui Alert; it names
           the pending hire request when there is one. -->
      <div v-if="editing" class="space-y-6">
        <Alert
          theme="blue"
          title="Partners who quoted will confirm or re-quote"
          :description="form?.requester ? `Sending declines ${form.requester.name}’s hire request. They can send a new one.` : undefined"
        />
        <RequirementsForm ref="form" :project-id="projectId" />
      </div>
      <BriefSummary v-else :brief="brief" :own="own" :omit="omit" :previous="previous" :company-name="companyName" />
      </ScrollArea>
    </template>
    <!-- Edit goes through `actions`, so frappe-ui lays it out: a single action
         in a `md` dialog is full width. The slot is only for the lock note. -->
    <template v-if="lockNote" #actions>
      <p class="text-p-sm text-ink-gray-6">{{ lockNote }}</p>
    </template>
    <!-- Editing: Cancel and Send. Who it goes to is on the button; it turns
         on once something has changed. -->
    <template v-else-if="editing" #actions>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" @click="cancel" />
        <!-- Disabled until a field changes: with nothing changed, Send sent
             nothing and said nothing, under a label promising 12 partners. -->
        <Button variant="solid" :label="form?.sendLabel ?? 'Send'" :disabled="!form?.dirty" @click="send" />
      </div>
    </template>
  </Dialog>
</template>
