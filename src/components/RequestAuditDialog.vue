<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, FormControl, toast } from 'frappe-ui'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { useAuditReadiness } from '../composables/useAuditReadiness'
import { AUDIT_TYPES } from '../data/audits'

// Ask Frappe for a PMM audit. Frappe picks the auditor and the date; the
// preferred dates only help it choose. A firm that isn't ready yet sees the
// criterion it's short of instead of the form, with the way to Partnership.

const open = defineModel('open', { type: Boolean, default: false })

const router = useRouter()
const account = usePartnerAccountStore()
const { missing } = useAuditReadiness()

const type = ref('Online')
const dates = ref([])
watch(open, (v) => {
  if (!v) return
  type.value = 'Online'
  dates.value = []
})

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
            account.requestAudit({ type: type.value, dates: dates.value })
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
      <FormControl v-model="dates" type="daterange" label="Preferred dates" />
    </div>
  </Dialog>
</template>
