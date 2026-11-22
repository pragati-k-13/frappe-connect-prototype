<script setup>
import { computed } from 'vue'
import { Button, Popover, Tooltip } from 'frappe-ui'
import { savedToast } from '../feedback'
import { useConnectStore } from '../stores/connect'
import { useAuthGate } from '../utils/auth'

// The bookmark, one definition for the listing row and the profile header.
//
// Signed in, it toggles. Signed out, saving needs an account, and the bookmark
// opens a small popover in place rather than sending the visitor to a sign-up
// page they didn't ask for: they stay on the list and choose. Either way into
// an account holds the save and runs it on the way back (`requireAccount`), so
// they land on a partner that is already saved.
//
// No guest saving: a list that vanished with the tab didn't serve how people
// shortlist a partner, over days and with colleagues.
const props = defineProps({
  partner: { type: Object, required: true },
  // Ghost in a listing row, subtle in the profile header.
  variant: { type: String, default: 'ghost' },
  // The saved list: unsaving drops the row, so the toast's Undo is the way
  // back. Elsewhere the filled bookmark is the confirmation and the undo.
  undoToast: { type: Boolean, default: false },
})

const store = useConnectStore()
const { requireAccount } = useAuthGate()
const saved = computed(() => store.isSaved(props.partner.id))

const toggle = () => {
  const p = props.partner
  const now = store.toggleSaved(p.id)
  if (props.undoToast && !now) savedToast(p, now, () => store.toggleSaved(p.id))
}

// The partner is read BEFORE the gate: signing in unmounts this component,
// and the held action outlives it.
const saveAfter = (screen) => {
  const id = props.partner.id
  requireAccount(() => store.isSaved(id) || store.toggleSaved(id), { screen })
}
</script>

<template>
  <Tooltip v-if="store.signedIn" text="Save">
    <Button
      :variant="variant"
      :aria-pressed="saved"
      :aria-label="saved ? `Remove ${partner.name} from saved` : `Save ${partner.name}`"
      @click="toggle"
    >
      <template #icon>
        <LucideBookmark class="size-4" :class="saved ? 'fill-current text-ink-gray-8' : ''" />
      </template>
    </Button>
  </Tooltip>

  <!-- ⚠️ NO TOOLTIP signed out. frappe-ui's Tooltip and Popover both need the
       button as their trigger: inside the trigger slot the Tooltip took the
       click and the popover never opened; around the Popover the tooltip
       never showed. The popover explains itself on click, and the button
       keeps its `aria-label`. -->
  <Popover v-else side="bottom" align="end">
    <template #trigger>
      <Button :variant="variant" :aria-label="`Save ${partner.name}`">
        <template #icon><LucideBookmark class="size-4" /></template>
      </Button>
    </template>
    <div class="w-72 p-3">
      <p class="text-base font-medium text-ink-gray-9">Create an account to save partners</p>
      <div class="mt-3 flex gap-2">
        <Button variant="solid" label="Create account" @click="saveAfter('signup')" />
        <Button variant="ghost" label="Log in" @click="saveAfter('login')" />
      </div>
    </div>
  </Popover>
</template>
