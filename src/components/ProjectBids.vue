<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button, Dropdown, ScrollArea, TabButtons, toast } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow } from 'frappe-ui/list'
import IconMessage from '~icons/lucide/message-square'
import IconMore from '~icons/lucide/ellipsis'
import { PARTNERS, cityOf } from '../data/partners'
import { useConnectStore } from '../stores/connect'

// The replies to a broadcast — and, now, the stage itself.
//
// ⚠️ THIS IS WHERE BIDS ARE COMPARED, AND MESSAGES IS WHERE THEY ARRIVE. Both
// are true and the split is the design: a quote lands in the partner's own
// thread, because that is where the conversation with that firm lives and
// because seeing it there is what makes "twelve firms got your requirements"
// checkable. But twelve threads cannot be compared by scrolling an inbox, so
// the numbers are pulled together here, against the project they were quoted
// for.
//
// ⚠️ TWO GROUPS, BEHIND TABS, AND THE CHECKLIST ABOVE THEM IS GONE. The stage
// used to carry four checkboxes — go through the replies, approve at least one,
// choose the one you are going with, agree the terms — three of which recorded
// things this component can SEE. A box asking you to confirm you approved
// somebody, under a button you pressed to approve them, is the product asking
// for a receipt it wrote itself. The replies list is the stage; what is left
// above it is the one task nothing here observes.
//
// ⚠️ "INTERESTED" IS THE OLD APPROVAL, RENAMED, NOT SOFTENED. It shares the
// company's name and contact details and opens the thread — see `setBidState`.
// The stored state is still `'shortlisted'`; only the words changed.
//
// ⚠️ THE BUTTON SAYS "Interested", AND IT SAID "Shortlist" BEFORE. A shortlist
// reads as a private list, and a private-sounding button that introduces you to
// a stranger is the one mistake this flow cannot make. What the gesture means
// is "we want to take this forward", and "Interested" pairs with the "Not
// interested" beside it as two answers to one question. It keeps its name across
// the flow: the button, the tab, the badge and the partner's line all say it.
//
// The consequence keeps its own line directly above the button, in full, with
// the partner named. That sentence is where a disclosure belongs — a button
// label is not long enough to be a disclosure and is the wrong shape for one.
const props = defineProps({
  project: { type: Object, required: true },
})

const store = useConnectStore()
const router = useRouter()

const partnerOf = (id) => PARTNERS.find((p) => p.id === id) ?? null

const TIER_RANK = { gold: 0, silver: 1, bronze: 2 }
const tierRank = (p) => TIER_RANK[p.tier] ?? 3

const rows = computed(() =>
  (props.project.bids ?? [])
    .map((bid) => ({ ...bid, partner: partnerOf(bid.partnerId) }))
    .filter((r) => r.partner)
    // By tier — gold, silver, bronze, then untiered — as the partner listing
    // does, and cheapest first within a tier.
    .sort((a, b) => tierRank(a.partner) - tierRank(b.partner) || a.amount - b.amount),
)

const shortlisted = computed(() => rows.value.filter((r) => r.state === 'shortlisted'))
// ⚠️ NOT-INTERESTED LEAVES THE LIST. A firm you turned down is a decision
// made, and a row that stays to say so is one more line to read past while
// comparing the rest. The way back is the Undo on the toast; the quote itself
// is still in that firm's thread in Messages.
const others = computed(() => rows.value.filter((r) => r.state === 'pending'))

const tab = ref('shortlisted')

// ⚠️ OPENS ON WHICHEVER TAB HAS SOMETHING TO DO. Before anything is
// shortlisted, "Shortlisted 0" is an empty screen where the replies should be;
// after, the shortlist is the thing being compared. It follows the state only
// while the shortlist is empty, so it never pulls the tab out from under
// somebody reading the others.
watch(
  shortlisted,
  (list) => {
    if (!list.length) tab.value = 'others'
  },
  { immediate: true },
)

const tabs = computed(() => [
  { label: `Interested ${shortlisted.value.length}`, value: 'shortlisted' },
  { label: `Others ${others.value.length}`, value: 'others' },
])

// How many firms were written to, against how many answered. ⚠️ BOTH NUMBERS,
// always. "8 replies" alone reads as a full response rate; the gap between 8
// and 12 is a fact about the market that the person who sent it is entitled to.
const sent = computed(() => props.project.broadcast?.partnerIds?.length ?? 0)

// ⚠️ CHOOSING IS A SEPARATE, LATER GESTURE than shortlisting. Shortlisting
// shares the company details and opens a conversation. This ends the stage.
// They were one action in the first version and it forced the decision at the
// moment somebody was still gathering information.
const emit = defineEmits(['choose'])

const notInterested = (row) => {
  store.setBidState(props.project.id, row.partnerId, 'not-interested')
  toast(`${row.partner.name} removed`, {
    id: `not-interested-${row.partnerId}`,
    action: {
      label: 'Undo',
      onClick: () => store.setBidState(props.project.id, row.partnerId, 'pending'),
    },
  })
}

// What sits under More on an Others row.
const moreFor = (row) => [
  { label: 'Not interested', icon: 'lucide-ban', onClick: () => notInterested(row) },
  {
    label: 'Read the thread',
    icon: 'lucide-message-square',
    onClick: () => router.push({ name: 'messages', query: { thread: row.partnerId } }),
  },
]
</script>

<template>
  <section>

    <!-- Nothing back yet. A real state, not an error: a broadcast sent an hour
         ago has no replies and the page should say so rather than draw an
         empty table. It is also the ONLY place this is said now — the stage
         above used to carry a second copy as a notice over an impossible
         checklist, and that checklist is gone. -->
    <div
      v-if="!rows.length"
      class="rounded-6 border border-outline-gray-2 px-4 py-8 text-center"
    >
      <p class="text-base font-medium text-ink-gray-8">No quotes yet</p>
      <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
        Sent to {{ sent }} partners. Quotes arrive in Messages, usually within a few working days.
      </p>
    </div>

    <template v-else>
      <!-- ⚠️ NO SECTION HEADING AND NO COUNT. The bar above names the stage,
           and the tabs already carry how many quotes each holds. -->
      <TabButtons v-model="tab" :options="tabs" />

      <!-- ── Shortlisted ──────────────────────────────────────────────── -->
      <!-- ⚠️ A TABLE, and the one place in this app that earns one: five
           partners against three numbers is exactly the shape a table is for,
           and reading it down a column is the whole point. Everything else in
           the product is a list because it is one thing per row. -->
      <div v-if="tab === 'shortlisted'" class="mt-3">
        <div
          v-if="!shortlisted.length"
          class="rounded-6 border border-outline-gray-2 px-4 py-8 text-center"
        >
          <p class="text-base font-medium text-ink-gray-8">No one marked interested yet</p>
          <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
            Mark a reply Interested in Others and it lands here, next to the rest, for comparing.
          </p>
        </div>

        <!-- frappe-ui's List in column mode. Static rows: each carries a
             profile link and two buttons of its own, so the row itself is not
             a click target. Fixed tracks for the figures so they line up. -->
        <ScrollArea v-else orientation="horizontal">
          <List
            class="min-w-[560px]"
            :columns="['minmax(0,1fr)', '7.5rem', '6.5rem', '9rem']"
            :row-height="60"
          >
            <ListHeader>
              <ListHeaderCell>Partner</ListHeaderCell>
              <ListHeaderCell class="justify-end">Quote</ListHeaderCell>
              <ListHeaderCell class="justify-end">Timeline</ListHeaderCell>
              <ListHeaderCell><span class="sr-only">Actions</span></ListHeaderCell>
            </ListHeader>
            <ListRow v-for="row in shortlisted" :key="row.partnerId">
              <ListCell>
                <div class="min-w-0">
                  <span class="flex items-center gap-2">
                    <RouterLink
                      :to="{ name: 'partner', params: { id: row.partnerId } }"
                      class="truncate text-base text-ink-gray-8 hover:underline"
                    >
                      {{ row.partner.name }}
                    </RouterLink>
                    <TierIcon :tier="row.partner.tier" />
                  </span>
                  <span class="mt-1 block truncate text-base text-ink-gray-6">
                    {{ cityOf(row.partner) }}
                  </span>
                </div>
              </ListCell>
              <ListCell class="justify-end">
                <span class="text-base tabular-nums text-ink-gray-6">{{ row.price }}</span>
              </ListCell>
              <ListCell class="justify-end">
                <span class="text-base tabular-nums text-ink-gray-6">{{ row.weeks }} weeks</span>
              </ListCell>
              <ListCell class="justify-end gap-1.5">
                <Button
                  variant="ghost"
                  :aria-label="`Message ${row.partner.name}`"
                  :route="{ name: 'messages', query: { thread: row.partnerId } }"
                >
                  <IconMessage class="size-4" />
                </Button>
                <Badge v-if="project.partnerId === row.partnerId" theme="green" label="Hired" />
                <Button
                  v-else-if="!project.partnerId"
                  variant="solid"
                  label="Hire"
                  @click="emit('choose', row.partner)"
                />
              </ListCell>
            </ListRow>
          </List>
        </ScrollArea>
      </div>

      <!-- ── Others ───────────────────────────────────────────────────── -->
      <div v-else class="mt-3">
        <div
          v-if="!others.length"
          class="rounded-6 border border-outline-gray-2 px-4 py-8 text-center"
        >
          <p class="text-base font-medium text-ink-gray-8">No other quotes</p>
        </div>

        <!-- The same columns as Interested, so the two tabs read as one table.
             The decision is the one button; the rest waits under More. -->
        <ScrollArea v-else orientation="horizontal">
          <List
            class="min-w-[560px]"
            :columns="['minmax(0,1fr)', '7.5rem', '6.5rem', '9rem']"
            :row-height="60"
          >
            <ListHeader>
              <ListHeaderCell>Partner</ListHeaderCell>
              <ListHeaderCell class="justify-end">Quote</ListHeaderCell>
              <ListHeaderCell class="justify-end">Timeline</ListHeaderCell>
              <ListHeaderCell><span class="sr-only">Actions</span></ListHeaderCell>
            </ListHeader>
            <ListRow v-for="row in others" :key="row.partnerId">
              <ListCell>
                <div class="min-w-0">
                  <span class="flex items-center gap-2">
                    <RouterLink
                      :to="{ name: 'partner', params: { id: row.partnerId } }"
                      class="truncate text-base text-ink-gray-8 hover:underline"
                    >
                      {{ row.partner.name }}
                    </RouterLink>
                    <TierIcon :tier="row.partner.tier" />
                  </span>
                  <span class="mt-1 block truncate text-base text-ink-gray-6">
                    {{ cityOf(row.partner) }}
                  </span>
                </div>
              </ListCell>
              <ListCell class="justify-end">
                <span class="text-base tabular-nums text-ink-gray-6">{{ row.price }}</span>
              </ListCell>
              <ListCell class="justify-end">
                <span class="text-base tabular-nums text-ink-gray-6">{{ row.weeks }} weeks</span>
              </ListCell>
              <ListCell class="justify-end gap-1.5">
                <Button
                  variant="subtle"
                  label="Interested"
                  @click="store.setBidState(project.id, row.partnerId, 'shortlisted')"
                />
                <Dropdown :options="moreFor(row)" align="end">
                  <Button variant="ghost" :aria-label="`More for ${row.partner.name}`">
                    <template #icon><IconMore class="size-4" /></template>
                  </Button>
                </Dropdown>
              </ListCell>
            </ListRow>
          </List>
        </ScrollArea>
      </div>
    </template>
  </section>
</template>
