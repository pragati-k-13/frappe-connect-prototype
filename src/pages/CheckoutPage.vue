<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PaymentMethodPicker from '../components/PaymentMethodPicker.vue'
import PaymentSheetDialog from '../components/PaymentSheetDialog.vue'
import IconLock from '~icons/lucide/lock'
import { PARTNERS } from '../data/partners'
import { STARTER_PACKS, checkoutFor, marketFor, DEFAULT_REGION } from '../data/packs'
import { PAYMENT_ASSURANCE, methodBy, providerFor } from '../data/payment'
import { useConnectStore } from '../stores/connect'

// SCREEN — checkout. Between the pack page and the confirmation.
//
// ⚠️ THIS IS WHERE THE PURCHASE HAPPENS, and it is new: Confirm on the pack
// page used to book the pack and assign the partner in one click. It now walks
// here instead, and the booking happens on payment. Everything that used to be
// true of that click is true of the pay button on this screen.
//
// Two steps, an accordion, because they are a SEQUENCE and not a form: Frappe
// cannot match a partner without the company answers, and nobody should be
// asked to pay before the thing they are paying for has someone to deliver it.
// One is open at a time, the finished one collapses to its answer, and the next
// opens itself — so the screen always shows exactly the question it is on.
//
// ⚠️ The company questions are the SAME DIALOG the rest of the app uses
// (`CompanySignupDialog`, mounted at the app root, opened through the store).
// This screen owns the step, not the questions — a fourth copy of them is how
// two sign-ups through two doors come to record different things.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

// ⚠️ The URL is authoritative, the store is the fallback — the same contract
// the pack page has. `store.pack` is in memory, so a reload of a checkout that
// read it alone would lose what is being bought, on the one screen where that
// is someone's money.
const pack = computed(
  () => STARTER_PACKS.find((p) => p.value === (route.query.pack ?? store.pack)) ?? null,
)

watchEffect(() => {
  if (pack.value && store.pack !== pack.value.value) store.selectPack(pack.value.value)
})

// Same market resolution as the catalogue and the pack page — the country
// first, because sign-up writes only that.
const region = computed(
  () => marketFor(store.filters.countries[0]) ?? store.answers.region[0] ?? DEFAULT_REGION,
)

// ⚠️ The ONLY place in the app that adds tax to a pack price. Everywhere else
// quotes the pack ex-tax and says so; this is the screen that has to name what
// actually leaves the account. See `checkoutFor`.
const bill = computed(() => (pack.value ? checkoutFor(pack.value, region.value) : null))

// ── One question, or two ───────────────────────────────────────────────────
// Step 1 is done when the account has a company on file. That is a fact about
// the ACCOUNT rather than about this visit: someone who answered the questions
// months ago — or through the contact dialog, or the full-screen sign-up —
// already has one.
const companyDone = computed(() => Boolean(store.company.name))

// ⚠️ A RETURNING CUSTOMER SEES NO STEPS AT ALL. With the company already on
// file there is exactly one thing left to decide, and a numbered accordion
// around a single question is a procedure invented to hold one answer: a step 1
// that is nothing but a green tick, a "2" counting to a total nobody needs, and
// a collapse control on the only thing on screen. They get the payment methods
// under a plain heading, like any other section in the app.
//
// ⚠️ SAMPLED ONCE, deliberately not a computed. Somebody who arrives without a
// company answers it here, and if this tracked `companyDone` the page would
// re-shape itself under them the moment they pressed Confirm in the dialog —
// the step they just finished vanishing, the numbers disappearing, the section
// they were heading towards sliding up the page. The shape of a visit is
// settled when the visit starts.
const stepped = !companyDone.value

const method = ref(null)
const methodDone = computed(() => Boolean(method.value))

// Which step is open. Not a `done`-derived getter: a finished step has to stay
// re-openable, or the answer you just gave is the one thing you can't check.
const openStep = ref(stepped ? 1 : 2)

// ⚠️ THE AUTO-ADVANCE. Watching the derived fact rather than the dialog's own
// close, so it fires however the company arrives — through the modal here,
// through a second tab, through a build that prefills it. `flush: 'post'` is
// not needed; nothing here touches the DOM.
watch(companyDone, (done) => {
  if (done) openStep.value = 2
})

const toggle = (n) => {
  openStep.value = openStep.value === n ? null : n
}

// ⚠️ NOT disabled when nothing is chosen, which is this codebase's rule for
// every other primary: a disabled button leaves someone hunting for what is
// stopping them with nothing to press and nothing to read. Pressing it opens
// the step that is actually blocking and says why, which answers that in one
// gesture. `tried` is what turns the message on, and only after the first
// press — the same rule the auth screens and both wizards use.
const tried = ref(false)

const blocker = computed(() => {
  if (!companyDone.value) return 1
  if (!methodDone.value) return 2
  return null
})

const chosen = computed(() => methodBy(method.value))
const provider = computed(() => providerFor(method.value))

const sheet = ref(false)

const pay = () => {
  tried.value = true
  if (blocker.value) {
    openStep.value = blocker.value
    // The first step's answer lives in a dialog, so "open the step" and "ask
    // the question" are the same gesture there and two gestures here would be
    // one too many.
    if (blocker.value === 1) store.openCompanyPrompt()
    return
  }
  sheet.value = true
}

// ⚠️ THE ASSIGNMENT, mocked, and it has MOVED HERE from the pack page: the
// partner is assigned once the pack is paid for, which is what the catalogue's
// "How it works" now promises — pay, then Frappe assigns you a partner.
//
// The best match under the answers already given, which is `store.results` —
// the same filtered, tier-ranked list the directory shows, so the assignment is
// at least consistent with what the visitor would have seen browsing. A real
// build decides this server-side on capacity and the overlap the profile brags
// about. Falling back to the first partner keeps the screen reachable when the
// filters have narrowed to nothing.
const onPaid = () => {
  sheet.value = false
  const assigned = store.results[0] ?? PARTNERS[0]
  // The conversation the next screen promises. Booking is the only thing in the
  // app that opens one, so it happens here rather than on arrival: the
  // confirmed screen links to a thread that already exists.
  store.startBooking({ partner: assigned, pack: pack.value, slot: null })
  toast.success('Payment received', {
    description: `You will get a receipt by email, and an introduction to ${assigned.name}.`,
  })
  router.replace({
    name: 'confirmed',
    query: { pack: pack.value.value, partner: assigned.id },
  })
}
</script>

<template>
  <ConnectShell root-label="Starter packs" root-to="/connect/packs" crumb="Checkout">
    <div class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
      <!-- No pack: someone reached this by URL rather than by buying. The same
           answer the pack page gives — there is nothing to pay for. -->
      <div v-if="!pack" class="py-20 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">Nothing to pay for</p>
        <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
          This link doesn't name a pack. Pick one and this is where you'll pay for it.
        </p>
        <Button class="mt-4" variant="solid" label="See the packs" :route="'/connect/packs'" />
      </div>

      <template v-else>
        <h1 class="text-2xl font-semibold text-ink-gray-8">Checkout</h1>

        <!-- Steps left, summary right, stacked below `lg` — 260px beside a
             ~460px column is a layout; beside a phone it is two paragraphs.
             `items-start` so the summary keeps its own height instead of
             stretching down the accordion. -->
        <div class="mt-7 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div class="min-w-0 flex-1">
            <!-- ── The whole question, for an account that has one ──────────
                 No number, no tick, no disclosure: this is a heading and a
                 choice, the way every other section in the app is written. A
                 step 1 that exists only to show a green tick, a "2" counting
                 towards a total nobody needs, and a collapse control on the
                 only thing on screen are three pieces of procedure invented to
                 hold one answer. -->
            <section v-if="!stepped">
              <h2 class="text-base font-semibold text-ink-gray-8">Payment method</h2>
              <div class="mt-4">
                <PaymentMethodPicker v-model="method" :invalid="tried && !methodDone" />
              </div>
            </section>

            <!-- ⚠️ The rules are on the list, not on cards. Two boxed steps
                 read as two things you could do in either order; one ruled
                 stack reads as a sequence, which is what it is. -->
            <ol v-else class="divide-y divide-outline-gray-2 border-y border-outline-gray-2">
              <!-- ── Step 1: the company ──────────────────────────────── -->
              <li>
                <!-- The whole header is the control, so a finished step can be
                     reopened to check what it says. `aria-expanded` rather
                     than a `<details>`: only one panel is open at a time and
                     that is this component's state, not the element's. -->
                <button
                  type="button"
                  class="flex w-full items-center gap-3 py-4 text-left"
                  :aria-expanded="openStep === 1"
                  @click="toggle(1)"
                >
                  <!-- Done is a tick, pending is the number. The numeral is
                       what says "first of two" while it is still ahead of you;
                       once it is behind you, what you want to know is that it
                       is behind you. -->
                  <span
                    class="grid size-7 shrink-0 place-items-center rounded-full text-p-base font-medium"
                    :class="
                      companyDone
                        ? 'bg-surface-green-2 text-ink-green-3'
                        : 'bg-surface-gray-2 text-ink-gray-5'
                    "
                    aria-hidden="true"
                  >
                    <LucideCheck v-if="companyDone" class="size-4" />
                    <template v-else>1</template>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-base font-medium text-ink-gray-8">Company details</span>
                    <span class="mt-0.5 block text-p-base text-ink-gray-6">
                      {{ companyDone ? store.company.name : 'What Frappe matches your partner on' }}
                    </span>
                  </span>
                  <LucideChevronDown
                    class="size-4 shrink-0 text-ink-gray-5 transition-transform motion-safe:duration-150"
                    :class="openStep === 1 && 'rotate-180'"
                  />
                </button>

                <div v-if="openStep === 1" class="pb-5 pl-10">
                  <template v-if="companyDone">
                    <!-- ⚠️ No Edit. `CompanySignupDialog` empties its form on
                         open, so a button labelled Edit would present blank
                         fields and overwrite good answers with them. Reopening
                         the step to READ what was recorded is the useful half;
                         changing it needs a dialog that loads what is there,
                         which is a different piece of work. -->
                    <p class="text-p-base text-ink-gray-6">
                      {{ store.company.employees }} employees
                      <template v-if="store.company.segments?.length">
                        · {{ store.company.segments.join(', ') }}
                      </template>
                    </p>
                  </template>
                  <template v-else>
                    <p class="max-w-[46ch] text-p-base text-ink-gray-6">
                      Frappe assigns your partner on what your business does and where it is. Four
                      questions.
                    </p>
                    <Button
                      class="mt-3"
                      variant="solid"
                      label="Add company details"
                      @click="store.openCompanyPrompt()"
                    />
                    <p v-if="tried && !companyDone" class="mt-2 text-p-base text-ink-red-5">
                      Needed before you pay — Frappe can't match a partner without it.
                    </p>
                  </template>
                </div>
              </li>

              <!-- ── Step 2: how to pay ───────────────────────────────── -->
              <li>
                <button
                  type="button"
                  class="flex w-full items-center gap-3 py-4 text-left"
                  :aria-expanded="openStep === 2"
                  @click="toggle(2)"
                >
                  <span
                    class="grid size-7 shrink-0 place-items-center rounded-full text-p-base font-medium"
                    :class="
                      methodDone
                        ? 'bg-surface-green-2 text-ink-green-3'
                        : 'bg-surface-gray-2 text-ink-gray-5'
                    "
                    aria-hidden="true"
                  >
                    <LucideCheck v-if="methodDone" class="size-4" />
                    <template v-else>2</template>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-base font-medium text-ink-gray-8">Payment method</span>
                    <span class="mt-0.5 block text-p-base text-ink-gray-6">
                      {{ chosen ? chosen.label : 'Card, RuPay or UPI' }}
                    </span>
                  </span>
                  <LucideChevronDown
                    class="size-4 shrink-0 text-ink-gray-5 transition-transform motion-safe:duration-150"
                    :class="openStep === 2 && 'rotate-180'"
                  />
                </button>

                <div v-if="openStep === 2" class="pb-5 pl-10">
                  <PaymentMethodPicker v-model="method" :invalid="tried && !methodDone" />
                </div>
              </li>
            </ol>
          </div>

          <!-- ── The summary, and the action ──────────────────────────────
               ⚠️ THIS IS THE PAGE'S ANCHOR, and it did not used to be. The
               steps were the loud half and this was a quiet box beside them,
               with the pay button floating under the accordion in open space —
               on a screen whose whole job is one payment. The steps are chrome
               for two short questions; what someone is deciding is here.

               So the total leaves the label/figure row it shared with the two
               lines above it and takes a line of its own, and the button sits
               directly under the figure it charges. Standard checkout anatomy,
               and it costs no new type size: the figure reads as the largest
               thing on the page at `text-xl` because nothing around it competes.

               Below `lg` this stacks UNDER the steps, which is the right order
               on a phone — answer the questions, then see what you owe and
               pay. -->
          <aside class="w-full shrink-0 rounded-5 border border-outline-gray-2 p-4 lg:w-72">
            <h2 class="text-base font-medium text-ink-gray-8">{{ pack.name }}</h2>
            <p class="mt-0.5 text-p-base text-ink-gray-6">Starter Pack · {{ pack.hours }} hrs</p>

            <dl class="mt-4 space-y-1.5 border-t border-outline-gray-2 pt-3">
              <div class="flex items-baseline justify-between gap-4">
                <dt class="text-p-base text-ink-gray-6">Pack</dt>
                <dd class="text-p-base tabular-nums text-ink-gray-7">{{ bill.subtotal }}</dd>
              </div>
              <div class="flex items-baseline justify-between gap-4">
                <dt class="text-p-base text-ink-gray-6">{{ bill.taxLabel }}</dt>
                <!-- ⚠️ A PHRASE, not a zero, where the market has no decided
                     rate. India's 18% is in the scope document; no other
                     market's is, and a checkout that quietly adds an invented
                     VAT charges a number nobody agreed. See `checkoutFor`. -->
                <dd class="text-p-base tabular-nums text-ink-gray-7">
                  {{ bill.tax ?? 'Added at payment' }}
                </dd>
              </div>
            </dl>

            <div class="mt-3 border-t border-outline-gray-2 pt-3">
              <p class="text-p-base text-ink-gray-6">Total</p>
              <p class="mt-0.5 text-xl font-semibold tabular-nums text-ink-gray-8">
                {{ bill.total }}
              </p>
              <!-- The payee, on the screen where the money moves and beside the
                   figure that moves. It used to run on into "your partner is
                   assigned once payment clears", which is step 2 of "How it
                   works" on the page before this one, said twice. -->
              <p class="mt-1 text-p-sm text-ink-gray-5">Paid to Frappe in full.</p>
            </div>

            <!-- ⚠️ No amount on the button — it is directly above, and a figure
                 printed twice is a figure that can be wrong in one place. The
                 label carries WHO takes the payment instead, because that is
                 the surprise the click holds: it opens someone else's sheet.
                 Before a method is picked it can't name one, so it says the
                 plain thing rather than guessing. -->
            <Button
              class="mt-4 w-full"
              variant="solid"
              :label="provider ? `Pay with ${provider.label}` : 'Pay'"
              @click="pay"
            />

            <p class="mt-2.5 flex items-start gap-1.5 text-p-sm text-ink-gray-5">
              <IconLock class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{{ PAYMENT_ASSURANCE }}</span>
            </p>
          </aside>
        </div>
      </template>
    </div>

    <PaymentSheetDialog
      v-if="pack && chosen && provider"
      :open="sheet"
      :provider="provider"
      :method="chosen"
      :amount="bill.total"
      :pack="pack.name"
      @paid="onPaid"
      @close="sheet = false"
    />
  </ConnectShell>
</template>
