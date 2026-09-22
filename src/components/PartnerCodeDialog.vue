<script setup>
import { computed, ref } from 'vue'
import { Button, Dialog, toast } from 'frappe-ui'
import IconCopy from '~icons/lucide/copy'
import IconExternal from '~icons/lucide/arrow-up-right'
import { FRAPPE_CLOUD_PARTNER_URL, partnerCodeFor } from '../data/project'

// The Frappe Cloud partner code, and the three steps it belongs to.
//
// ⚠️ THIS SHORT STRING IS HOW FRAPPE IS PAID. Not by the packs — those are one
// purchase — and not at all by custom work, which goes entirely to the partner.
// What Frappe sells is the Frappe Cloud site the implementation runs on, and
// this code is what bills that site to the partner, who bills the business. It
// is the commercial point of the whole product wearing the clothes of a
// checklist item, which is exactly why it gets a dialog rather than a line of
// hint text.
//
// ⚠️ THE FRAPPE CLOUD SIDE IS NOT MOCKED, deliberately: it is a different
// product with its own design, and a half-drawn imitation of its billing page
// would be reviewed as if it were a proposal for one. The link goes out.
const props = defineProps({
  open: { type: Boolean, default: false },
  project: { type: Object, default: null },
  partner: { type: Object, default: null },
})
const emit = defineEmits(['update:open'])

const code = computed(() => partnerCodeFor(props.project, props.partner))

const copied = ref(false)

// ⚠️ `navigator.clipboard` can reject — an insecure origin, a browser that
// refuses without a user gesture it recognises — and a copy button that appears
// to work and does not is worse than one that admits it. The code is on screen
// and selectable either way.
const copy = async () => {
  try {
    await navigator.clipboard.writeText(code.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    toast.info('Copy it by hand', { description: 'Your browser would not let us use the clipboard.' })
  }
}
</script>

<template>
  <Dialog
    :model-value="open"
    title="Your partner code"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- ⚠️ The DEFAULT slot, not `#body-content`: this version of frappe-ui's
         Dialog exposes only `default`, `title` and `actions`, and the older
         `#body-content` name fails silently — the dialog opens empty. Same trap
         documented in `NewProjectDialog`. -->
    <template #default>
      <p class="text-p-base leading-relaxed text-ink-gray-6">
        ERPNext runs on Frappe Cloud. Enter this code there and your site is billed to
        {{ partner?.name ?? 'your partner' }}, who bills you along with the rest of the work — so
        you deal with one invoice rather than two.
      </p>

      <!-- Big, monospaced and selectable. A code you are about to type into
           another product is read character by character, and the one thing
           this dialog must not do is make a 0 look like an O. -->
      <div class="mt-4 flex items-center gap-2 rounded-5 bg-surface-gray-2 px-4 py-3">
        <code class="flex-1 select-all font-mono text-lg tracking-wider text-ink-gray-9">
          {{ code }}
        </code>
        <Button :label="copied ? 'Copied' : 'Copy'" @click="copy">
          <template #prefix><IconCopy class="size-4" /></template>
        </Button>
      </div>

      <!-- ⚠️ TWO STEPS, AND THERE WERE THREE. The third read "Come back and
           tick the task", which has been wrong since tasks stopped being
           tickable — taking the code is what completes this one, and an
           instruction to press a control that no longer exists sends somebody
           hunting for it. Rewriting it as what happens next just restated the
           paragraph above, which already says the partner is billed and bills
           you. A list of steps should hold the steps. -->
      <ol class="mt-5 space-y-2 text-p-base text-ink-gray-7">
        <li>1. Log in to Frappe Cloud, or create an account.</li>
        <li>2. Under Billing, choose "Paid via Partner" and enter the code above.</li>
      </ol>

      <div class="mt-5 flex items-center gap-2">
        <!-- ⚠️ THE EXACT PAGE, not the home page — a code is useless beside a
             marketing site. The path is invented; see the note on
             `FRAPPE_CLOUD_PARTNER_URL`. The label names the destination
             precisely for the same reason the link is deep: somebody arriving
             at Frappe Cloud should already know which screen they are looking
             for, in case the link lands them somewhere else. -->
        <Button
          variant="solid"
          label="Open Frappe Cloud billing"
          :link="FRAPPE_CLOUD_PARTNER_URL"
        >
          <template #suffix><IconExternal class="size-4" /></template>
        </Button>
        <Button variant="ghost" label="Close" @click="emit('update:open', false)" />
      </div>
    </template>
  </Dialog>
</template>
