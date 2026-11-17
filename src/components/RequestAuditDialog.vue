<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, FormControl, toast } from 'frappe-ui'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { useAuditReadiness } from '../composables/useAuditReadiness'
import { AUDIT_TYPES, todayIso } from '../data/audits'

// Ask Frappe for a PMM audit. Frappe picks the auditor and sets the date; the
// proposed date only helps it choose, as in press. A firm that isn't ready yet
// sees the criterion it's short of instead of the form, with the way to
// Partnership.

const open = defineModel('open', { type: Boolean, default: false })

const router = useRouter()
const account = usePartnerAccountStore()
// The level the audit is for: the next tier's PMM.
const { missing, next } = useAuditReadiness()

const type = ref('Online')
const proposed = ref('')
const proposedError = ref('')
watch(open, (v) => {
  if (!v) return
  type.value = 'Online'
  proposed.value = ''
  proposedError.value = ''
})
watch(proposed, () => (proposedError.value = ''))

const typeOptions = AUDIT_TYPES.map((t) => ({ label: t, value: t }))

const actions = computed(() =>
  missing.value
    ? [
        {
          label: 'Open Partnership',
          variant: 'solid',
          onClick: ({ close }) => {
            close()
            router.push('/connect/partnership')
          },
        },
      ]
    : [
        {
          label: 'Request audit',
          variant: 'solid',
          onClick: ({ close }) => {
            if (!proposed.value) return (proposedError.value = 'Pick a date')
            if (proposed.value <= todayIso()) return (proposedError.value = 'Pick a date after today')
            account.requestAudit({ type: type.value, proposed: proposed.value, pmm: next.value?.pmm })
            close()
            toast.success('Audit requested')
          },
        },
      ],
)
</script>

<template>
  <Dialog
    v-model:open="open"
    size="md"
    :title="missing ? 'Not ready for an audit yet' : 'Request audit'"
    :message="missing ?? undefined"
    :actions="actions"
  >
    <div v-if="!missing" class="space-y-4">
      <FormControl v-model="type" type="select" label="Type" :options="typeOptions" />
      <FormControl v-model="proposed" type="date" label="Proposed date" required :error="proposedError" />
    </div>
  </Dialog>
</template>
