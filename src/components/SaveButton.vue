<script setup>
import { computed } from 'vue'
import { Button, Tooltip } from 'frappe-ui'
import { savedToast } from '../feedback'
import { useConnectStore } from '../stores/connect'

// The bookmark, one definition for the listing row and the profile header.
//
// ⚠️ SIGNED IN ONLY. A visitor sees no bookmark at all: saving needs an
// account, and asking for one here (a popover) while Contact beside it went
// straight to sign-up was two behaviours for the same gate on every row. With
// Save gone, Contact is the visitor's one action and the one place they meet
// the gate. Guest saving went earlier — a list that vanished with the tab
// didn't serve how people shortlist a partner, over days and with colleagues.
const props = defineProps({
  partner: { type: Object, required: true },
  // Ghost in a listing row, subtle in the profile header.
  variant: { type: String, default: 'ghost' },
  // The saved list: unsaving drops the row, so the toast's Undo is the way
  // back. Elsewhere the filled bookmark is the confirmation and the undo.
  undoToast: { type: Boolean, default: false },
})

const store = useConnectStore()
const saved = computed(() => store.isSaved(props.partner.id))

const toggle = () => {
  const p = props.partner
  const now = store.toggleSaved(p.id)
  if (props.undoToast && !now) savedToast(p, now, () => store.toggleSaved(p.id))
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
</template>
