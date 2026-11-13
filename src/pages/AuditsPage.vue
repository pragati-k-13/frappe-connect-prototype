<script setup>
import { computed, ref } from 'vue'
import { Alert, Badge, Button, ScrollArea, Select } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import RequestAuditDialog from '../components/RequestAuditDialog.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { AUDIT_STATUS, auditDate, openNcs } from '../data/audits'

// SCREEN — Audits: the firm's PMM audits, newest first, the same table as
// Leads. A row opens the audit and its non-conformances. Only the owner
// requests one, and only while no request is already waiting on Frappe.

const store = useConnectStore()
const account = usePartnerAccountStore()

const isOwner = computed(() => store.partnerRole === 'owner')
const waiting = computed(() => account.audits.some((a) => a.status === 'Requested'))
const canRequest = computed(() => isOwner.value && !waiting.value)
const requesting = ref(false)

const status = ref('all')
const STATUSES = [
  { label: 'All statuses', value: 'all' },
  ...Object.keys(AUDIT_STATUS).map((s) => ({ label: s, value: s })),
]
const rows = computed(() => account.audits.filter((a) => status.value === 'all' || a.status === status.value))

const ncLine = (a) => {
  const open = openNcs(a).length
  if (a.status === 'Completed' && open) return `${open} open of ${a.ncs.length}`
  return String(a.ncs.length)
}

const columns = {
  base: ['minmax(0,1fr)', 'auto'],
  md: ['minmax(0,1fr)', '8rem', 'minmax(0,1.2fr)', '10rem', '8rem', '8rem'],
}
</script>

<template>
  <ConnectShell root-label="Audits" flush>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <!-- Temporary: the page merges before its design is settled. -->
      <div class="shrink-0 px-3 pt-5 sm:px-5">
        <Alert theme="blue" title="Design in progress. This page will change." />
      </div>
      <template v-if="account.audits.length">
        <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-4 sm:px-5">
          <Select v-model="status" :options="STATUSES" class="min-w-36" aria-label="Status" />
          <Button v-if="canRequest" icon-left="lucide-plus" label="Request audit" @click="requesting = true" />
        </div>

        <ScrollArea class="min-h-0 flex-1" viewport-class="px-3 pb-10 sm:px-5">
          <List v-if="rows.length" class="list-row-px-2" :columns="columns" :row-height="40">
            <ListHeader class="mb-2 rounded-4 bg-surface-gray-2 px-2">
              <ListHeaderCell>Type</ListHeaderCell>
              <ListHeaderCell class="justify-end md:justify-start">Status</ListHeaderCell>
              <ListHeaderCell class="hidden md:flex">Auditor</ListHeaderCell>
              <ListHeaderCell class="hidden md:flex">Non-conformances</ListHeaderCell>
              <ListHeaderCell class="hidden md:flex">Requested</ListHeaderCell>
              <ListHeaderCell class="hidden md:flex">Audit date</ListHeaderCell>
            </ListHeader>
            <ListRows :items="rows" v-slot="{ item }">
              <ListRow :to="`/connect/audits/${item.id}`">
                <ListCell class="min-w-0">
                  <span class="truncate text-base text-ink-gray-8">{{ item.type }}</span>
                </ListCell>
                <ListCell class="justify-end md:justify-start">
                  <Badge variant="subtle" :theme="AUDIT_STATUS[item.status]" :label="item.status" />
                </ListCell>
                <ListCell class="hidden min-w-0 md:flex">
                  <span v-if="item.auditor" class="truncate text-base text-ink-gray-7">{{ item.auditor }}</span>
                  <span v-else class="text-base text-ink-gray-5">Not assigned yet</span>
                </ListCell>
                <ListCell class="hidden text-base tabular-nums text-ink-gray-7 md:flex">{{ ncLine(item) }}</ListCell>
                <ListCell class="hidden whitespace-nowrap text-base text-ink-gray-7 md:flex">{{ auditDate(item.requested) }}</ListCell>
                <ListCell class="hidden whitespace-nowrap text-base text-ink-gray-7 md:flex">{{ item.date ? auditDate(item.date) : '—' }}</ListCell>
              </ListRow>
            </ListRows>
          </List>
          <EmptyState v-else icon="lucide-clipboard-check" title="No audits match">
            <Button label="Clear filter" @click="status = 'all'" />
          </EmptyState>
        </ScrollArea>
      </template>

      <EmptyState v-else class="flex-1" icon="lucide-clipboard-check" title="No audits yet">
        <Button v-if="isOwner" icon-left="lucide-plus" label="Request audit" @click="requesting = true" />
      </EmptyState>
    </div>

    <RequestAuditDialog v-model:open="requesting" />
  </ConnectShell>
</template>
