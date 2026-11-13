<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Badge, Button, Dialog, FormControl, ScrollArea, toast } from 'frappe-ui'
import { List, ListCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { AUDIT_STATUS, NC_STATUS, auditDate, auditLongDate, openNcs } from '../data/audits'

// SCREEN — one audit. Requested and scheduled ones say what happens next in a
// line. A completed one lists its non-conformances, open ones first, with the
// selected one beside the list: what the auditor found, what to do about it,
// and who closed it. Closing one asks what changed.

const route = useRoute()
const store = useConnectStore()
const account = usePartnerAccountStore()

const audit = computed(() => account.audits.find((a) => a.id === route.params.id) ?? null)
const title = computed(() => (audit.value ? `${audit.value.type} audit` : 'Not found'))

const closedCount = computed(() => (audit.value ? audit.value.ncs.length - openNcs(audit.value).length : 0))

// Each part stays on one line when the row wraps.
const meta = computed(() => {
  const a = audit.value
  if (!a) return []
  if (a.status === 'Completed')
    return [`Held ${auditLongDate(a.date)}`, a.auditor, a.ncs.length && `${closedCount.value} of ${a.ncs.length} closed`].filter(Boolean)
  return [`Requested ${auditDate(a.requested)}`, a.status === 'Requested' && (a.auditor ?? 'Not assigned yet')].filter(Boolean)
})

const nextLine = computed(() => {
  const a = audit.value
  if (a?.status === 'Scheduled') return `Scheduled for ${auditLongDate(a.date)} with ${a.auditor}.`
  if (a?.status === 'Requested') return 'You’ll get an email once Frappe sets the date.'
  return 'No non-conformances.'
})

// Open ones first; otherwise the auditor's order.
const ncs = computed(() => {
  if (!audit.value) return []
  const list = audit.value.ncs
  return [...list.filter((n) => n.status !== 'Closed'), ...list.filter((n) => n.status === 'Closed')]
})

const selectedId = ref()
const firstOpen = () => ncs.value.find((n) => n.status !== 'Closed')?.id ?? ncs.value[0]?.id
watch(() => route.params.id, () => (selectedId.value = firstOpen()), { immediate: true })
const selected = computed(() => ncs.value.find((n) => n.id === selectedId.value) ?? null)

// On a phone the detail sits under the list, so picking a row brings it up.
const detail = ref(null)
function showDetail() {
  if (window.matchMedia('(min-width: 768px)').matches) return
  requestAnimationFrame(() => detail.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

// Owners and the people in that NC's function close it; for the demo, the
// owner role is enough.
const canClose = computed(() => store.partnerRole === 'owner')

const closing = ref(false)
const changed = ref('')
const changedError = ref('')
function startClose() {
  changed.value = ''
  changedError.value = ''
  closing.value = true
}
watch(changed, () => (changedError.value = ''))
const closeActions = [
  {
    label: 'Close',
    variant: 'solid',
    onClick: ({ close }) => {
      const text = changed.value.trim()
      if (!text) return (changedError.value = 'Say what you changed')
      account.closeNonConformance(audit.value.id, selected.value.id, text)
      close()
      toast.success('Non-conformance closed')
      selectedId.value = firstOpen()
    },
  },
]
</script>

<template>
  <ConnectShell root-label="Audits" root-to="/connect/audits" :crumb="title" flush>
    <EmptyState v-if="!audit" class="flex-1" icon="lucide-clipboard-check" title="This audit isn’t in your list" />

    <ScrollArea v-else class="min-h-0 flex-1" viewport-class="px-3 pt-5 pb-10 sm:px-5">
      <!-- No title here: the breadcrumb already names the audit. The status
           and the one line of facts lead instead. -->
      <header class="flex flex-wrap items-center gap-2">
        <Badge variant="subtle" :theme="AUDIT_STATUS[audit.status]" :label="audit.status" />
        <p class="text-base text-ink-gray-5">
          <template v-for="(part, i) in meta" :key="i"><template v-if="i"> · </template><span class="whitespace-nowrap">{{ part }}</span></template>
        </p>
      </header>

      <p v-if="!ncs.length" class="mt-6 text-p-base text-ink-gray-8">{{ nextLine }}</p>

      <!-- ── Non-conformances: the list, and the one selected beside it ── -->
      <div v-else class="mt-8 grid gap-8 md:grid-cols-[20rem_minmax(0,1fr)]">
        <List v-model:active="selectedId" class="-mx-2 list-row-px-2" :columns="['minmax(0,1fr)', 'auto']" divider="none">
          <ListRows :items="ncs" v-slot="{ item, value }">
            <ListRow :value="value" class="py-2.5" @click="showDetail">
              <ListCell class="min-w-0">
                <span class="text-p-base text-ink-gray-8">{{ item.title }}</span>
              </ListCell>
              <ListCell class="self-start">
                <Badge variant="subtle" :theme="NC_STATUS[item.status]" :label="item.status" />
              </ListCell>
            </ListRow>
          </ListRows>
        </List>

        <article v-if="selected" ref="detail" class="max-w-2xl scroll-mt-5">
          <h2 class="text-lg-semibold text-ink-gray-9">{{ selected.title }}</h2>
          <p class="mt-1.5 text-base text-ink-gray-5">{{ selected.id }} · {{ selected.function }}</p>
          <Button v-if="selected.status !== 'Closed' && canClose" class="mt-4" label="Close non-conformance" @click="startClose" />

          <div class="mt-6 space-y-6">
            <section>
              <h3 class="text-base-medium text-ink-gray-8">What the auditor found</h3>
              <p class="mt-1.5 max-w-prose text-p-base text-ink-gray-7">{{ selected.finding }}</p>
            </section>
            <section>
              <h3 class="text-base-medium text-ink-gray-8">Measures to be taken</h3>
              <p class="mt-1.5 max-w-prose text-p-base text-ink-gray-7">{{ selected.measures }}</p>
            </section>
            <section v-if="selected.status === 'Closed'">
              <h3 class="text-base-medium text-ink-gray-8">What was changed</h3>
              <p v-if="selected.measuresTaken" class="mt-1.5 max-w-prose text-p-base text-ink-gray-7">{{ selected.measuresTaken }}</p>
              <p class="mt-1.5 text-sm text-ink-gray-5">Closed by {{ selected.closedBy }} on {{ auditDate(selected.closedOn) }}</p>
            </section>
          </div>
        </article>
      </div>
    </ScrollArea>

    <Dialog v-model:open="closing" size="md" title="Close non-conformance" :actions="closeActions">
      <FormControl v-model="changed" type="textarea" label="What you changed" required :rows="4" :error="changedError" />
    </Dialog>
  </ConnectShell>
</template>
