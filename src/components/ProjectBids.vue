<script setup>
import { computed, ref, watch } from 'vue'
import { Badge, Button, ScrollArea, TabButtons } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import IconMessage from '~icons/lucide/message-square'
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
// ⚠️ SHORTLISTING IS THE OLD APPROVAL, RENAMED, NOT SOFTENED. It shares the
// company's name and contact details and opens the thread — see
// `setBidState`. That is why the control does not say "Shortlist": the word
// reads as a private bookmark, and a private-sounding button that introduces
// you to a stranger is the one mistake this flow cannot make. The GROUP is
// called Shortlisted; the BUTTON says what pressing it does.
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

const shortlisted = computed(() => rows.value.filter((r) => r.state === 'shortlisted'))
// ⚠️ "Others" IS PENDING AND PASSED TOGETHER, not pending alone. A firm you
// passed on is not a fourth state of the world, it is one of the others with a
// decision already recorded against it — and putting it in a tab of its own
// would give the rows nobody wants equal billing with the rows they do. Inside
// the tab it keeps its numbers, loses its two buttons, and offers Undo.
const others = computed(() => rows.value.filter((r) => r.state !== 'shortlisted'))

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
  { label: `Shortlisted ${shortlisted.value.length}`, value: 'shortlisted' },
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
         empty table. It is also the ONLY place this is said now — the stage
         above used to carry a second copy as a notice over an impossible
         checklist, and that checklist is gone. -->
    <div
      v-if="!rows.length"
      class="mt-3 rounded-6 border border-outline-gray-2 px-4 py-8 text-center"
    >
      <p class="text-p-base text-ink-gray-7">No replies yet</p>
      <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
        Your requirements went to {{ sent }} partners. Quotes usually come back within a few
        working days, not everyone answers, and they arrive in Messages.
      </p>
    </div>

    <template v-else>
      <TabButtons v-model="tab" class="mt-3" :options="tabs" />

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
          <p class="text-p-base text-ink-gray-7">Nobody shortlisted yet</p>
          <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
            Shortlist a reply in Others and it lands here, next to the rest, for comparing.
          </p>
        </div>

        <ScrollArea v-else orientation="horizontal" class="rounded-6 border border-outline-gray-2">
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
                v-for="row in shortlisted"
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
                    <!-- ⚠️ "Hire", and it was "Choose". The word is the point of
                         the whole rewrite: this is the control that ENDS the
                         stage, and it used to sit above a checkbox asking you
                         to confirm you had chosen somebody. One gesture, named
                         for what it is. Once a partner is hired the other rows
                         keep their numbers, which is what the table is for, and
                         lose the control. -->
                    <Badge
                      v-if="project.partnerId === row.partnerId"
                      theme="green"
                      label="Hired"
                    />
                    <Button
                      v-else-if="!project.partnerId"
                      variant="solid"
                      label="Hire"
                      @click="emit('choose', row.partner)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </ScrollArea>
      </div>

      <!-- ── Others ───────────────────────────────────────────────────── -->
      <div v-else class="mt-3 space-y-2">
        <div
          v-if="!others.length"
          class="rounded-6 border border-outline-gray-2 px-4 py-8 text-center"
        >
          <p class="text-p-base text-ink-gray-7">Everyone who replied is shortlisted</p>
        </div>

        <article
          v-for="row in others"
          :key="row.partnerId"
          class="rounded-6 border border-outline-gray-2 p-4"
          :class="row.state === 'passed' ? 'opacity-60' : ''"
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

          <!-- A firm you have already passed on. It keeps everything above and
               loses the decision, because the only thing left to do with it is
               change your mind. ⚠️ "Passed", never "rejected", and the partner
               is not told either way — see the note on `BID_STATES`. -->
          <div v-if="row.state === 'passed'" class="mt-3 flex items-center gap-3">
            <Badge theme="gray" label="Passed" />
            <button
              type="button"
              class="text-p-base text-ink-gray-6 underline hover:text-ink-gray-8"
              @click="store.setBidState(project.id, row.partnerId, 'pending')"
            >
              Undo
            </button>
          </div>

          <template v-else>
            <!-- ⚠️ THE CONSEQUENCE IS ON THE BUTTON'S OWN LINE, not in a tooltip
                 and not discovered afterwards. This is the moment a stranger
                 learns which company they are talking to, and that is not
                 something to find out from a toast. -->
            <p class="mt-3 text-p-sm text-ink-gray-5">
              Shares your company name and contact details with {{ row.partner.name }}, and opens
              the conversation.
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <Button
                variant="solid"
                label="Share and talk"
                @click="store.setBidState(project.id, row.partnerId, 'shortlisted')"
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
          </template>
        </article>
      </div>
    </template>
  </section>
</template>
