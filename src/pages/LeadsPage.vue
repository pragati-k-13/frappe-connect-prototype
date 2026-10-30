<script setup>
import { computed, ref, watch } from 'vue'
import { Avatar, Badge, Button, TabButtons, TextInput } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PageIntro from '../components/PageIntro.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { companyName, isClosed, lastAt, needsReply, queue, stageTheme, theirLast, useLeads } from '../composables/useLeads'

// SCREEN — Leads: every Connect brief as a row, the way Helpdesk lists
// tickets. A pipeline more than a chat: stage, owner and probability across
// all leads at once, which an inbox row couldn't show. A row opens the lead's
// own page. See PARTNER-VIEW-PLAN.md, Leads.
//
// A Beginner isn't listed, so no brief reaches them: they find their own leads
// until Bronze.

const store = useConnectStore()
const account = usePartnerAccountStore()
const leads = useLeads()

// Who "Mine" means: the person the demo role stands for, from Team.
const me = computed(() => (store.partnerRole === 'sales' ? 'rahul-verma' : 'farhan-qureshi'))
const nameOf = (id) => account.team.find((p) => p.id === id)?.name

// Landing for Sales, so the default is only what waits on the firm.
const view = ref('needs')
const VIEWS = [
  { label: 'To reply', value: 'needs' },
  { label: 'Mine', value: 'mine' },
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
]
const query = ref('')

// Only the business moves a row: ordered by their last message. "To reply"
// goes oldest waiting first, since that's the order to answer in.
const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = leads.value
    .filter((t) => !q || t.project.toLowerCase().includes(q) || t.company?.name.toLowerCase().includes(q))
    .filter((t) =>
      view.value === 'needs'
        ? needsReply(t)
        : view.value === 'mine'
          ? !isClosed(t) && t.owner === me.value
          : view.value === 'open'
            ? !isClosed(t)
            : isClosed(t),
    )
  return list.sort((a, b) => (view.value === 'needs' ? theirLast(a) - theirLast(b) : lastAt(b) - lastAt(a)))
})

watch(rows, (r) => (queue.value = r.map((t) => t.id)), { immediate: true })

const time = (at) => {
  const d = new Date(at)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const EMPTY = { needs: 'All caught up', mine: 'None assigned to you', open: 'No open leads', closed: 'No closed leads' }
</script>

<template>
  <ConnectShell v-if="store.partnerTier === 'beginner'" root-label="Leads">
    <EmptyState icon="lucide-inbox" title="Leads from Connect start at Bronze">
      <Button label="View milestones" route="/connect/partnership" />
    </EmptyState>
  </ConnectShell>

  <ConnectShell v-else root-label="Leads">
    <div class="fc-page-wide py-8">
      <PageIntro title="Briefs sent to you through Connect" />

      <div class="flex flex-wrap items-center gap-2">
        <TabButtons v-model="view" :options="VIEWS" />
        <TextInput v-model="query" type="search" placeholder="Search leads" class="w-full sm:ml-auto sm:w-56">
          <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
        </TextInput>
      </div>

      <List
        v-if="rows.length"
        class="-mx-3 mt-4 list-row-px-3"
        :columns="{
          base: ['minmax(0,1fr)', 'auto'],
          md: ['minmax(0,1fr)', '10rem', '9rem', '10rem', '6rem', '5rem'],
        }"
        :row-height="52"
      >
        <ListHeader>
          <ListHeaderCell>Lead</ListHeaderCell>
          <ListHeaderCell class="hidden md:flex">Company</ListHeaderCell>
          <ListHeaderCell class="hidden md:flex">Stage</ListHeaderCell>
          <ListHeaderCell class="hidden md:flex">Assigned to</ListHeaderCell>
          <ListHeaderCell class="hidden md:flex">Probability</ListHeaderCell>
          <ListHeaderCell class="justify-end">Updated</ListHeaderCell>
        </ListHeader>
        <ListRows :items="rows" v-slot="{ item }">
          <ListRow :to="`/connect/leads/${item.id}`">
            <!-- Bold while a reply waits on you, as Helpdesk bolds an unread
                 ticket. -->
            <ListCell class="min-w-0">
              <span class="min-w-0">
                <span
                  class="block truncate text-base"
                  :class="needsReply(item) ? 'font-semibold text-ink-gray-9' : 'text-ink-gray-8'"
                >
                  {{ item.project }}
                </span>
                <span class="mt-1 flex items-center gap-1.5 md:hidden">
                  <Badge variant="subtle" size="sm" :theme="stageTheme(item.stage)" :label="item.stage" />
                  <span class="truncate text-sm text-ink-gray-5">{{ companyName(item) }}</span>
                </span>
              </span>
            </ListCell>
            <ListCell class="hidden truncate text-ink-gray-7 md:flex">{{ companyName(item) }}</ListCell>
            <ListCell class="hidden md:flex">
              <Badge variant="subtle" size="sm" :theme="stageTheme(item.stage)" :label="item.stage" />
            </ListCell>
            <ListCell class="hidden min-w-0 gap-2 md:flex">
              <template v-if="item.owner">
                <Avatar :label="nameOf(item.owner)" size="sm" />
                <span class="truncate text-ink-gray-7">{{ nameOf(item.owner) }}</span>
              </template>
              <span v-else class="text-ink-gray-5">Unassigned</span>
            </ListCell>
            <ListCell class="hidden text-ink-gray-7 md:flex">{{ item.probability ?? '—' }}</ListCell>
            <ListCell class="justify-end whitespace-nowrap text-sm text-ink-gray-5">{{ time(lastAt(item)) }}</ListCell>
          </ListRow>
        </ListRows>
      </List>

      <EmptyState
        v-else
        :icon="view === 'needs' && !query.trim() ? 'lucide-check-check' : 'lucide-inbox'"
        :title="query.trim() ? 'No leads match' : EMPTY[view]"
      >
        <Button v-if="view === 'needs' && !query.trim()" label="View open leads" @click="view = 'open'" />
      </EmptyState>
    </div>
  </ConnectShell>
</template>
