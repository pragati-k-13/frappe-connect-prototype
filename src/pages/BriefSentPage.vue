<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import IconMessage from '~icons/lucide/message-square'
import ConnectShell from '../components/ConnectShell.vue'
import TierIcon from '../components/TierIcon.vue'
import { PARTNERS, cityOf } from '../data/partners'
import { budgetLabel } from '../data/custom'
import { useConnectStore } from '../stores/connect'

// SCREEN — the requirements are out.
//
// ⚠️ THE CUSTOM PATH HAD NO RECEIPT, and that was the asymmetry. Buying a pack
// ends on a confirmation naming the partner, showing the message that went out
// in your name and saying what happens next. Sending a brief went straight to
// the project tracker — a screen about work that has not started, reached from
// a decision screen, with nothing in between to say what had just happened.
// Twelve companies had been written to and the product never mentioned it.
//
// So this does the same three jobs `ConfirmedPage` does: what happened, who it
// reached, and what to expect. The count is checkable because the firms are
// named, which matters more here than on the pack path — a number you cannot
// audit is the wrong way to tell somebody you contacted a dozen businesses on
// their behalf.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

// ⚠️ The PROJECT is the source, not the store's brief. The brief keeps being
// edited; what went out is fixed at the moment it went, and this screen is
// about that moment. `?project=` so a reload survives — this is a page somebody
// might leave open.
const project = computed(() => store.projectBy(route.query.project))

const partners = computed(() =>
  (project.value?.broadcast?.partnerIds ?? [])
    .map((id) => PARTNERS.find((p) => p.id === id))
    .filter(Boolean),
)
</script>

<template>
  <ConnectShell root-label="Implementation" root-to="/connect/projects" crumb="Requirements sent">
    <div class="mx-auto w-full max-w-[800px] px-5 py-10 lg:px-10">
      <!-- No project behind the link: a reload after the store was cleared, or
           a forwarded URL. The list is the honest destination. -->
      <div v-if="!project" class="py-20 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">Nothing to show here</p>
        <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
          This link doesn't name anything you've sent.
        </p>
        <Button
          class="mt-4"
          variant="solid"
          label="See what's under way"
          :route="{ name: 'projects' }"
        />
      </div>

      <template v-else>
        <h1 class="text-2xl font-semibold text-ink-gray-9">
          Your requirements are with {{ partners.length }}
          {{ partners.length === 1 ? 'partner' : 'partners' }}
        </h1>
        <!-- ⚠️ THE TIMEFRAME, and it is the sentence this screen exists for.
             Nothing else in the flow says that quotes take days — the send
             button is instant, the project opens instantly, and without this
             the silence that follows reads as something being broken. -->
        <p class="mt-2 max-w-[62ch] text-p-base leading-relaxed text-ink-gray-6">
          Quotes usually come back over the next few working days, and not everyone answers. They
          arrive in Messages, and in your project.
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-2">
          <Button
            variant="solid"
            size="md"
            label="Open the project"
            :route="{ name: 'project', params: { id: project.id } }"
          />
          <Button variant="subtle" size="md" label="Read what was sent" :route="{ name: 'messages' }">
            <template #prefix><IconMessage class="size-4" /></template>
          </Button>
        </div>

        <!-- ── What they got ─────────────────────────────────────────── -->
        <!-- ⚠️ THE SAME CARD THE PARTNERS RECEIVED, not a summary of it. This
             is the one screen where somebody checks what was said in their
             name, and a paraphrase here would be the product telling them what
             it sent rather than showing them. -->
        <section class="mt-10">
          <h2 class="text-p-lg font-semibold text-ink-gray-9">What they received</h2>
          <div class="mt-3 max-w-[62ch] rounded-6 border border-outline-gray-2 p-4">
            <p class="text-p-base font-medium text-ink-gray-8">{{ project.name }}</p>
            <p class="mt-1.5 whitespace-pre-line text-p-base leading-relaxed text-ink-gray-7">
              {{ store.brief.scope }}
            </p>
            <dl class="mt-3 space-y-1 border-t border-outline-gray-2 pt-3">
              <div class="flex gap-6 text-p-base">
                <dt class="w-28 shrink-0 text-ink-gray-5">Budget</dt>
                <dd class="text-ink-gray-8">{{ budgetLabel(store.brief.budget) }}</dd>
              </div>
              <div class="flex gap-6 text-p-base">
                <dt class="w-28 shrink-0 text-ink-gray-5">Industry</dt>
                <dd class="text-ink-gray-8">{{ store.company.segments?.[0] || 'Not given' }}</dd>
              </div>
              <div class="flex gap-6 text-p-base">
                <dt class="w-28 shrink-0 text-ink-gray-5">Size</dt>
                <dd class="text-ink-gray-8">{{ store.company.employees }} people</dd>
              </div>
            </dl>
            <p class="mt-3 text-p-sm leading-relaxed text-ink-gray-5">
              Not your company name or contact details — those are shared with a partner when you
              approve their reply.
            </p>
          </div>
        </section>

        <!-- ── Who it went to ────────────────────────────────────────── -->
        <!-- ⚠️ NAMED, not counted. "Sent to 8 partners" is a claim about other
             people's inboxes that the person who made it cannot check, and the
             whole reason the send button carries a number is that the number
             should be accountable. Naming them costs eight rows. -->
        <section class="mt-8">
          <h2 class="text-p-lg font-semibold text-ink-gray-9">Who it went to</h2>
          <ul class="mt-3 divide-y divide-outline-gray-2 rounded-6 border border-outline-gray-2">
            <li
              v-for="partner in partners"
              :key="partner.id"
              class="flex items-baseline justify-between gap-4 px-4 py-2.5"
            >
              <span class="flex min-w-0 items-center gap-2">
                <RouterLink
                  :to="{ name: 'partner', params: { id: partner.id } }"
                  class="truncate text-p-base text-ink-gray-8 hover:underline"
                >
                  {{ partner.name }}
                </RouterLink>
                <TierIcon :tier="partner.tier" />
              </span>
              <span class="shrink-0 text-p-sm text-ink-gray-5">{{ cityOf(partner) }}</span>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </ConnectShell>
</template>
