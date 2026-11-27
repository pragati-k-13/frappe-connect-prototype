<script setup>
import { computed, ref } from 'vue'
import { Avatar, Badge, Button } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PageIntro from '../components/PageIntro.vue'
import RequestAuditDialog from '../components/RequestAuditDialog.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { AUDIT_STATUS, auditDate, auditDay, auditTitle } from '../data/audits'
import { TIERS, nextTier, standingFor } from '../data/partnership'

// SCREEN — Audits: the firm's PMM audits, newest first, as a compact list in
// the 768px column Invoices uses. Each row is named as the page it opens is,
// "PMM 5 audit", with press's ID under it to quote to Frappe; the date is a
// plain column and the sort. A firm has about one a year, so there's nothing
// to filter or search.
//
// Once an audit is done, its result is the only status that matters, so
// "Met" or "Not met" takes the status slot. Rows are top-aligned so every
// first line shares a baseline beside the two-line name, at 72px.
//
// Above the list, what's at stake: the firm's tier and PMM level now, and the
// PMM level the next tier needs, which is what an audit is for. Tier benefits
// belong on Partnership, not here. Read from the same standing Partnership
// shows, so the two can't disagree. A firm at the top tier has no next one,
// so only the first card shows.
//
// Request audit is always there for the owner, as press's "Request for Audit"
// is: press lets a second request in while another is pending, and the dialog
// itself says when the firm isn't ready.

const store = useConnectStore()
const account = usePartnerAccountStore()

const isOwner = computed(() => store.partnerRole === 'owner')
const requesting = ref(false)

const standing = computed(() => standingFor(store.partnerTier, store.partnershipState))
const tier = computed(() => TIERS[standing.value.tier])
const next = computed(() => nextTier(standing.value.tier))

const rows = computed(() => [...account.audits].sort((a, b) => auditDay(b).localeCompare(auditDay(a))))

const RESULT = { Met: 'green', 'Not met': 'amber' }
const statusOf = (a) =>
  a.status === 'Completed' && a.result
    ? { label: a.result, theme: RESULT[a.result] }
    : AUDIT_STATUS[a.status]

const columns = {
  base: ['minmax(0,1fr)', 'auto'],
  // Every column shares the spare width, so it sits between the columns
  // rather than as one empty gap after the auditor's name.
  sm: ['minmax(0,1.4fr)', 'minmax(0,1fr)', 'minmax(0,1fr)', 'minmax(0,0.8fr)', 'minmax(0,1.2fr)'],
}
</script>

<template>
  <ConnectShell root-label="Audits">
    <div class="fc-page-list py-8">
      <PageIntro title="Your PMM audits" class="!pb-4">
        <template v-if="isOwner && rows.length" #actions>
          <Button icon-left="lucide-plus" label="Request audit" @click="requesting = true" />
        </template>
      </PageIntro>

      <!-- ── What's at stake, as Invoices shows a bill's figures ── -->
      <dl class="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="rounded-4 border border-outline-gray-1 px-4 py-3">
          <dt class="text-sm text-ink-gray-5">Your tier</dt>
          <dd class="mt-1.5 flex h-6 items-center gap-1.5">
            <span class="text-lg-medium text-ink-gray-7">{{ tier.label }}</span>
            <span v-if="standing.pmm" class="text-base text-ink-gray-6">· PMM {{ standing.pmm }}</span>
          </dd>
        </div>
        <div v-if="next" class="rounded-4 border border-outline-gray-1 px-4 py-3">
          <dt class="text-sm text-ink-gray-5">{{ next.label }} needs</dt>
          <dd class="mt-1.5 flex h-6 items-center text-lg-medium text-ink-gray-7">PMM {{ next.pmm }}</dd>
        </div>
      </dl>

      <List v-if="rows.length" class="-mx-3 list-gap-3 list-row-px-3 text-base" :columns="columns" :row-height="72">
        <ListHeader>
          <ListHeaderCell>Audit</ListHeaderCell>
          <ListHeaderCell class="hidden sm:flex">Date</ListHeaderCell>
          <ListHeaderCell class="justify-end sm:justify-start">Status</ListHeaderCell>
          <ListHeaderCell class="hidden sm:flex">Type</ListHeaderCell>
          <ListHeaderCell class="hidden sm:flex">Auditor</ListHeaderCell>
        </ListHeader>
        <ListRows :items="rows" v-slot="{ item }">
          <!-- Top-aligned: the padding sits the first lines where a centered
               two-line name would put its own. -->
          <ListRow :route="`/connect/audits/${item.id}`" class="!items-start pt-3.5">
            <ListCell class="min-w-0">
              <div class="flex min-w-0 flex-col gap-1">
                <span class="truncate font-medium text-ink-gray-7">{{ auditTitle(item) }}</span>
                <span class="truncate text-p-sm text-ink-gray-6">{{ item.id }}</span>
              </div>
            </ListCell>
            <ListCell class="hidden whitespace-nowrap text-ink-gray-7 sm:flex">{{ auditDate(auditDay(item)) }}</ListCell>
            <ListCell class="justify-end sm:justify-start">
              <Badge variant="subtle" :theme="statusOf(item).theme" :label="statusOf(item).label" />
            </ListCell>
            <ListCell class="hidden text-ink-gray-7 sm:flex">{{ item.type }}</ListCell>
            <ListCell class="hidden min-w-0 sm:flex">
              <span v-if="item.auditor" class="flex min-w-0 items-center gap-2">
                <Avatar :label="item.auditor.name" size="sm" />
                <span class="truncate text-ink-gray-7">{{ item.auditor.name }}</span>
              </span>
              <span v-else class="text-ink-gray-5">Not assigned yet</span>
            </ListCell>
          </ListRow>
        </ListRows>
      </List>

      <EmptyState v-else icon="lucide-clipboard-check" title="No audits yet">
        <Button v-if="isOwner" icon-left="lucide-plus" label="Request audit" @click="requesting = true" />
      </EmptyState>
    </div>

    <RequestAuditDialog v-model:open="requesting" />
  </ConnectShell>
</template>
