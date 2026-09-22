<script setup>
import { computed, ref } from 'vue'
import { Badge, Button, ScrollArea } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import IconMessage from '~icons/lucide/message-square'
import { PARTNERS, cityOf } from '../data/partners'
import { useConnectStore } from '../stores/connect'

// The replies to a broadcast, as a table you can read down.
//
// ⚠️ THIS IS WHERE BIDS ARE COMPARED, AND MESSAGES IS WHERE THEY ARRIVE. Both
// are true and the split is the design: a quote lands in the partner's own
// thread, because that is where the conversation with that firm lives and
// because seeing it there is what makes "twelve firms got your requirements"
// checkable. But twelve threads cannot be compared by scrolling an inbox, so
// the numbers are pulled together here, against the project they were quoted
// for.
//
// ⚠️ APPROVED ROWS LEAD, and the rest are behind a toggle. The table's job is
// the shortlist — the firms you are actually weighing up — and a business that
// has approved three out of eleven should not have to read eight rows it has
// already decided about. The eight are one click away rather than gone, because
// "who else replied" is a question people ask once they have a favourite.
const props = defineProps({
  project: { type: Object, required: true },
})

const store = useConnectStore()

const partnerOf = (id) => PARTNERS.find((p) => p.id === id) ?? null

const rows = computed(() =>
  (props.project.bids ?? [])
    .map((bid) => ({ ...bid, partner: partnerOf(bid.partnerId) }))
    .filter((r) => r.partner)
    // Cheapest first. ⚠️ Not "best first" — there is no such sort, and any
    // ordering that mixed price with tier or rating would be this screen
    // quietly recommending one firm over another while pretending to tabulate.
    .sort((a, b) => a.amount - b.amount),
)

const approved = computed(() => rows.value.filter((r) => r.state === 'approved'))
const pending = computed(() => rows.value.filter((r) => r.state === 'pending'))
const passed = computed(() => rows.value.filter((r) => r.state === 'passed'))

const showOthers = ref(false)

// How many firms were written to, against how many answered. ⚠️ BOTH NUMBERS,
// always. "8 replies" alone reads as a full response rate; the gap between 8
// and 12 is a fact about the market that the person who sent it is entitled to.
const sent = computed(() => props.project.broadcast?.partnerIds?.length ?? 0)

// ⚠️ CHOOSING IS A SEPARATE, LATER GESTURE than approving. Approval shares the
// company details and opens a conversation — a shortlist. This ends the stage.
// They were one action in the first version and it forced the decision at the
// moment somebody was still gathering information.
const emit = defineEmits(['choose'])
</script>

<template>
  <section>
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="text-base font-medium text-ink-gray-8">Replies</h2>
      <p class="text-p-sm tabular-nums text-ink-gray-5">
        {{ rows.length }} of {{ sent }} partners replied
      </p>
    </div>

    <!-- Nothing back yet. A real state, not an error: a broadcast sent an hour
         ago has no replies and the page should say so rather than draw an
         empty table. -->
    <div
      v-if="!rows.length"
      class="mt-3 rounded-6 border border-outline-gray-2 px-4 py-8 text-center"
    >
      <p class="text-p-base text-ink-gray-7">No replies yet</p>
      <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
        Your requirements went to {{ sent }} partners. Quotes usually come back within a few working
        days, and they arrive in Messages.
      </p>
    </div>

    <template v-else>
      <!-- ── Pending ──────────────────────────────────────────────────── -->
      <!-- ⚠️ ABOVE the comparison table, because these are the ones that want a
           decision. A quote nobody has looked at is the only row on this screen
           with something outstanding on it. -->
      <div v-if="pending.length" class="mt-3 space-y-2">
        <article
          v-for="row in pending"
          :key="row.partnerId"
          class="rounded-6 border border-outline-gray-2 p-4"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div class="flex items-center gap-2">
              <RouterLink
                :to="{ name: 'partner', params: { id: row.partnerId } }"
                class="text-p-base font-medium text-ink-gray-8 hover:underline"
              >
                {{ row.partner.name }}
              </RouterLink>
              <TierIcon :tier="row.partner.tier" />
            </div>
            <p class="text-p-base font-medium tabular-nums text-ink-gray-9">{{ row.price }}</p>
          </div>
          <p class="mt-0.5 text-p-sm text-ink-gray-5">
            {{ cityOf(row.partner) }} · about {{ row.weeks }} weeks
          </p>
          <p class="mt-2 text-p-base leading-relaxed text-ink-gray-6">{{ row.note }}</p>

          <!-- ⚠️ THE CONSEQUENCE IS ON THE BUTTON'S OWN LINE, not in a tooltip
               and not discovered afterwards. Approving is the moment a stranger
               learns which company they are talking to, and that is not
               something to find out from a toast. -->
          <p class="mt-3 text-p-sm text-ink-gray-5">
            Approving shares your company name and contact details with {{ row.partner.name }}, and
            opens the conversation.
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <Button
              variant="solid"
              label="Approve"
              @click="store.setBidState(project.id, row.partnerId, 'approved')"
            />
            <Button
              variant="subtle"
              label="Pass"
              @click="store.setBidState(project.id, row.partnerId, 'passed')"
            />
            <Button
              variant="ghost"
              label="Read the thread"
              :route="{ name: 'messages', query: { thread: row.partnerId } }"
            />
          </div>
        </article>
      </div>

      <!-- ── The comparison ───────────────────────────────────────────── -->
      <!-- ⚠️ A TABLE, and the one place in this app that earns one: five
           partners against three numbers is exactly the shape a table is for,
           and reading it down a column is the whole point. Everything else in
           the product is a list because it is one thing per row. -->
      <div v-if="approved.length" class="mt-5">
        <h3 class="text-p-base font-medium text-ink-gray-8">Shortlisted</h3>
        <ScrollArea orientation="horizontal" class="mt-2 rounded-6 border border-outline-gray-2">
          <table class="w-full min-w-[560px] border-collapse text-p-base">
            <thead>
              <tr class="bg-surface-gray-1 text-p-sm uppercase tracking-wide text-ink-gray-5">
                <th scope="col" class="px-4 py-2.5 text-left font-medium">Partner</th>
                <th scope="col" class="px-4 py-2.5 text-right font-medium">Quote</th>
                <th scope="col" class="px-4 py-2.5 text-right font-medium">Timeline</th>
                <th scope="col" class="px-4 py-2.5 text-left font-medium">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in approved"
                :key="row.partnerId"
                class="border-t border-outline-gray-2"
              >
                <th scope="row" class="px-4 py-3 text-left font-normal">
                  <span class="flex items-center gap-2">
                    <RouterLink
                      :to="{ name: 'partner', params: { id: row.partnerId } }"
                      class="text-ink-gray-8 hover:underline"
                    >
                      {{ row.partner.name }}
                    </RouterLink>
                    <TierIcon :tier="row.partner.tier" />
                  </span>
                  <span class="mt-0.5 block text-p-sm text-ink-gray-5">
                    {{ cityOf(row.partner) }}
                  </span>
                </th>
                <td class="px-4 py-3 text-right tabular-nums text-ink-gray-8">{{ row.price }}</td>
                <td class="px-4 py-3 text-right tabular-nums text-ink-gray-8">
                  {{ row.weeks }} weeks
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      :aria-label="`Message ${row.partner.name}`"
                      :route="{ name: 'messages', query: { thread: row.partnerId } }"
                    >
                      <IconMessage class="size-4" />
                    </Button>
                    <!-- Once a partner is chosen the others stop being
                         choosable — the row keeps its numbers, which is what
                         the table is for, and loses the control. -->
                    <Badge
                      v-if="project.partnerId === row.partnerId"
                      theme="green"
                      label="Chosen"
                    />
                    <Button
                      v-else-if="!project.partnerId"
                      variant="subtle"
                      label="Choose"
                      @click="emit('choose', row.partner)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </ScrollArea>
      </div>

      <!-- ── The rest ─────────────────────────────────────────────────── -->
      <!-- ⚠️ PASSED, NOT REJECTED, and the partner is never told. See the note
           on `BID_STATES`. The toggle exists because "who else replied" is a
           question people ask once they have a favourite, not because the rows
           are important enough to keep on screen. -->
      <div v-if="passed.length" class="mt-4">
        <button
          type="button"
          class="text-p-base text-ink-gray-6 underline hover:text-ink-gray-8"
          @click="showOthers = !showOthers"
        >
          {{ showOthers ? 'Hide' : 'Show' }} {{ passed.length }} you passed on
        </button>
        <ul v-if="showOthers" class="mt-2 space-y-1.5">
          <li
            v-for="row in passed"
            :key="row.partnerId"
            class="flex items-baseline justify-between gap-4 text-p-base text-ink-gray-6"
          >
            <span>{{ row.partner.name }}</span>
            <span class="flex shrink-0 items-center gap-3">
              <span class="tabular-nums">{{ row.price }}</span>
              <button
                type="button"
                class="underline hover:text-ink-gray-8"
                @click="store.setBidState(project.id, row.partnerId, 'pending')"
              >
                Undo
              </button>
            </span>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
