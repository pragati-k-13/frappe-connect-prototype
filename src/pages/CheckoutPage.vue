<script setup>
// SCREEN — checkout. Between the recommendation and the assignment.
//
// ⚠️ MUCH SHORTER THAN IT WAS, and the reason is upstream. This screen used to
// be a two-step accordion: the company questions, then a payment method, on the
// argument that Frappe cannot match a partner without the answers. The intake
// asks them on the landing page now, before anybody signs up, so by the time
// anyone is here the answers are on file and the accordion had one step in it.
// A numbered sequence invented to hold one answer is procedure, so it went.
//
// What is left is the basket, who it is billed to, and how it is being paid.
//
// ⚠️ THE MONEY DOES NOT MOVE HERE. Pressing Pay leaves for Stripe's own page —
// a full screen, not a sheet over this one — and everything that follows from a
// payment happens on the way back. See `StripeCheckoutPage`.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import IconLock from '~icons/lucide/lock'
import ConnectShell from '../components/ConnectShell.vue'
import PaymentMethodPicker from '../components/PaymentMethodPicker.vue'
import { checkoutFor, marketFor, DEFAULT_REGION } from '../data/packs'
import { PAYMENT_ASSURANCE } from '../data/payment'
import { useConnectStore } from '../stores/connect'

const store = useConnectStore()
const router = useRouter()

// ⚠️ THE BASKET COMES FROM THE STORE, not from the URL. It used to be `?pack=`,
// because a reload of a checkout that read memory alone would lose what was
// being bought — on the one screen where that is someone's money. A basket is a
// list now, and three pack ids in a query string is a URL nobody can read and
// anybody can edit. The trade is real and it is the right way round: a reload
// here loses the basket, which is recoverable in two clicks from the
// recommendation, and nothing can be bought by editing an address bar.
const packs = computed(() => store.packRecords())

const region = computed(() => marketFor(store.company.country) ?? DEFAULT_REGION)
const bill = computed(() => checkoutFor(packs.value, region.value))

const method = ref('card')

// ⚠️ ENABLED, ALWAYS, like every other primary in this app. A disabled button
// leaves someone hunting for what is stopping them with nothing to press and
// nothing to read.
const pay = () => {
  if (!packs.value.length) return
  router.push({ name: 'pay', query: { method: method.value } })
}
</script>

<template>
  <ConnectShell root-label="Starter packs" root-to="/connect/packs" crumb="Checkout">
    <div class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
      <!-- An empty basket: someone reached this by URL, or reloaded and lost
           it. The recommendation is where it is rebuilt, not the catalogue —
           their answers are still on file, so the packs come back ticked. -->
      <div v-if="!packs.length" class="py-20 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">Nothing to pay for</p>
        <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
          There are no packs in your basket. Your answers are still saved, so the recommendation
          will come back with them ticked.
        </p>
        <Button
          class="mt-4"
          variant="solid"
          label="Back to the recommendation"
          :route="{ name: 'recommendation' }"
        />
      </div>

      <template v-else>
        <h1 class="text-2xl font-semibold text-ink-gray-8">Checkout</h1>

        <div class="mt-7 flex flex-col gap-8 lg:flex-row lg:items-start">
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-semibold text-ink-gray-8">Payment method</h2>
            <div class="mt-4">
              <PaymentMethodPicker v-model="method" />
            </div>

            <div class="mt-6">
              <Button variant="solid" size="md" :label="`Pay ${bill.total}`" @click="pay" />
              <p class="mt-2 flex items-center gap-1.5 text-p-sm text-ink-gray-5">
                <IconLock class="size-3.5" />
                {{ PAYMENT_ASSURANCE }}
              </p>
            </div>
          </div>

          <!-- ── The summary ──────────────────────────────────────────── -->
          <aside class="w-full shrink-0 rounded-6 bg-surface-gray-1 p-5 lg:w-[280px]">
            <h2 class="text-base font-semibold text-ink-gray-8">Your packs</h2>
            <dl class="mt-4 space-y-2 text-p-base">
              <div v-for="line in bill.lines" :key="line.value" class="flex justify-between gap-3">
                <dt class="min-w-0 text-ink-gray-7">{{ line.name }}</dt>
                <dd class="shrink-0 tabular-nums text-ink-gray-8">{{ line.price }}</dd>
              </div>
              <div class="flex justify-between gap-3 border-t border-outline-gray-2 pt-2">
                <dt class="text-ink-gray-7">{{ bill.taxLabel }}</dt>
                <!-- Blank where a market's rate is not decided — see
                     `checkoutFor`. Charging an invented VAT would be worse. -->
                <dd class="shrink-0 tabular-nums text-ink-gray-8">{{ bill.tax ?? '—' }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="font-medium text-ink-gray-9">Total</dt>
                <dd class="shrink-0 font-medium tabular-nums text-ink-gray-9">{{ bill.total }}</dd>
              </div>
            </dl>

            <!-- ⚠️ WHO IS BILLED, and it is editable here because this is the
                 screen where a wrong company name actually costs something —
                 it goes on the invoice. The name was collected at sign-up; a
                 business whose trading name differs from its registered one
                 finds that out at exactly this moment. -->
            <div class="mt-5 border-t border-outline-gray-2 pt-4">
              <p class="text-p-sm text-ink-gray-5">Billed to</p>
              <p class="mt-0.5 text-p-base text-ink-gray-8">{{ store.company.name }}</p>
              <p class="text-p-base text-ink-gray-6">{{ store.company.country }}</p>
            </div>

            <p class="mt-4 text-p-sm leading-relaxed text-ink-gray-5">
              Paid to Frappe, in full and in advance. Frappe Cloud hosting is billed separately by
              your partner.
            </p>
          </aside>
        </div>
      </template>
    </div>
  </ConnectShell>
</template>
