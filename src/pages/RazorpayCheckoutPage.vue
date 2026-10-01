<script setup>
// SCREEN — the payment page, drawn as Frappe's Razorpay payment page.
//
// ⚠️ THE FICTION IS THAT YOU HAVE LEFT THE APP, and every layout decision here
// serves it: no ConnectShell, no sidebar, no breadcrumb, no app nav. Razorpay
// hosts the page, which is the entire reason a card number never reaches this
// application.
//
// ⚠️ THIS COLLECTS NOTHING AND CAN COLLECT NOTHING. The fields below are inert
// on purpose: they are `readonly`, they carry obviously fake values, and the
// banner says so. If this is ever wired up, it is wired up to the real Razorpay
// page — not by making these inputs real.
//
// ⚠️ NO RAZORPAY OR CARD-NETWORK LOGOS. Trademarks, and a hand-drawn
// approximation on a payment screen reads as fraudulent. Names in text stand in
// until licensed assets are dropped in.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Spinner } from 'frappe-ui'
import IconMail from '~icons/lucide/mail'
import IconPhone from '~icons/lucide/phone'
import frappeMark from '../assets/frappe.svg'
import { checkoutFor, marketFor, DEFAULT_REGION } from '../data/packs'
import { PAYMENT_MS, PROVIDER } from '../data/payment'
import { useConnectStore } from '../stores/connect'

const store = useConnectStore()
const router = useRouter()

const packs = computed(() => store.packRecords())
const region = computed(() => marketFor(store.company.country) ?? DEFAULT_REGION)
const bill = computed(() => checkoutFor(packs.value, region.value))

const paying = ref(false)

// ⚠️ NO PARTNER IS ASSIGNED ON PAYMENT. Frappe implements Starter Packs itself,
// so paying creates a pack project that is Frappe's and a thread with the
// Frappe team.
const pay = () => {
  if (paying.value || !packs.value.length) return
  paying.value = true
  // The delay exists so the processing state is reviewable; there is nothing to
  // call. Same reasoning as `AUTH_MS` on the auth screens.
  setTimeout(() => {
    const projectId = store.startBooking({ packs: packs.value })
    // ⚠️ The basket is cleared HERE, so a reload of the checkout can't charge
    // for the same packs again.
    store.setPacks([])
    router.replace({ name: 'project', params: { id: projectId }, query: { paid: 1 } })
  }, PAYMENT_MS)
}

const field =
  'w-full rounded-sm border border-outline-gray-2 bg-surface-white px-3 py-2.5 text-base text-ink-gray-6'
</script>

<template>
  <!-- Razorpay's payment page: the merchant and what is being bought on the
       left, the payment card on the right. Stacked below `lg`, order first. -->
  <div class="min-h-screen bg-surface-gray-1 pl-3">
    <div class="fixed inset-y-0 left-0 w-3 bg-surface-blue-7" aria-hidden="true" />
    <div
      class="mx-auto grid max-w-[1080px] gap-12 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:py-12"
    >
      <!-- ── The merchant and the order ──────────────────────────────── -->
      <section class="min-w-0">
        <div class="flex items-center gap-4">
          <div class="grid size-14 place-items-center rounded-sm bg-surface-white shadow-sm">
            <img :src="frappeMark" alt="" class="size-10" />
          </div>
          <p class="text-lg font-semibold text-ink-gray-9">Frappe Technologies Pvt. Ltd.</p>
        </div>

        <h1 class="mt-12 text-3xl font-semibold text-ink-gray-9">
          {{ bill.lines.length > 1 ? 'Starter Packs' : 'Starter Pack' }}
        </h1>
        <div class="mt-4 h-1 w-10 bg-surface-blue-7" aria-hidden="true" />

        <ul class="mt-8 space-y-2 text-p-base text-ink-gray-8">
          <li v-for="line in bill.lines" :key="line.value" class="flex justify-between gap-4">
            <span class="min-w-0">{{ line.name }} · {{ line.hours }} hours</span>
            <span class="shrink-0 tabular-nums">{{ line.price }}</span>
          </li>
        </ul>
        <p v-if="bill.tax" class="mt-4 text-p-base text-ink-gray-8">
          Note: Amount is including {{ bill.taxLabel }} ({{ bill.subtotal }} + {{ bill.tax }})
        </p>

        <h2 class="mt-12 text-base font-semibold text-ink-gray-9">Contact Us:</h2>
        <ul class="mt-3 space-y-2.5 text-p-base text-ink-gray-8">
          <li class="flex items-center gap-3">
            <IconMail class="size-4 text-ink-gray-7" />
            hello@frappe.io
          </li>
          <li class="flex items-center gap-3">
            <IconPhone class="size-4 text-ink-gray-7" />
            +918898415142
          </li>
        </ul>

        <h2 class="mt-12 text-base font-semibold text-ink-gray-9">Terms &amp; Conditions:</h2>
        <p class="mt-3 max-w-[520px] text-p-base leading-relaxed text-ink-gray-6">
          You agree to share information entered on this page with Frappe Technologies Pvt. Ltd.
          (owner of this page) and {{ PROVIDER.label }}, adhering to applicable laws.
        </p>

        <div class="mt-12 max-w-[520px] border-t border-outline-gray-2 pt-6">
          <p class="text-lg font-semibold italic text-ink-gray-9">{{ PROVIDER.label }}</p>
        </div>
      </section>

      <!-- ── The payment card ─────────────────────────────────────────── -->
      <section class="lg:pt-24">
        <!-- ⚠️ THE BANNER IS NOT DECORATION. It is what stops somebody typing a
             real card number into a prototype. Grey text on the amber surface:
             `ink-amber-*` is too light to read on it. -->
        <div class="rounded-5 border border-outline-amber-2 bg-surface-amber-1 px-4 py-3">
          <p class="text-p-sm leading-relaxed text-ink-gray-8">
            Mock payment page. Nothing here is connected to a payment processor, the fields cannot
            be edited, and no card or UPI details are collected or sent anywhere.
          </p>
        </div>

        <div class="mt-6 overflow-hidden rounded-sm bg-surface-white shadow-xl">
          <div class="px-8 pb-10 pt-8">
            <h2 class="text-xl font-semibold text-ink-gray-9">Payment Details</h2>
            <div class="mt-4 h-1 w-10 bg-surface-blue-7" aria-hidden="true" />

            <!-- ⚠️ `readonly`, and every value visibly fake. See the top of the
                 file. -->
            <dl class="mt-8 space-y-6">
              <div class="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                <dt class="text-base text-ink-gray-6">Amount <span class="text-ink-red-4">*</span></dt>
                <dd>
                  <input
                    :class="[field, 'bg-surface-gray-1 font-semibold tabular-nums text-ink-gray-9']"
                    readonly
                    :value="bill.total"
                    aria-label="Amount"
                  />
                </dd>
              </div>
              <div class="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                <dt class="text-base text-ink-gray-6">Email <span class="text-ink-red-4">*</span></dt>
                <dd>
                  <input
                    :class="field"
                    readonly
                    :value="store.viewer.email || 'you@company.example'"
                    aria-label="Email, not editable"
                  />
                </dd>
              </div>
              <div class="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                <dt class="text-base text-ink-gray-6">Phone <span class="text-ink-red-4">*</span></dt>
                <dd class="flex">
                  <span
                    class="shrink-0 rounded-l-sm border border-r-0 border-outline-gray-2 bg-surface-gray-2 px-3 py-2.5 text-base text-ink-gray-7"
                  >
                    IN +91
                  </span>
                  <input
                    :class="[field, 'min-w-0 rounded-l-none tabular-nums']"
                    readonly
                    value="00000 00000"
                    aria-label="Phone, sample value, not editable"
                  />
                </dd>
              </div>
            </dl>
          </div>

          <div class="flex items-stretch bg-surface-gray-1">
            <p class="flex flex-1 items-center px-8 py-5 text-p-sm font-medium text-ink-gray-6">
              UPI · Visa · Mastercard · RuPay
            </p>
            <button
              type="button"
              class="flex shrink-0 items-center gap-2 bg-surface-blue-7 px-8 text-lg font-semibold tabular-nums text-ink-base hover:bg-surface-blue-8 disabled:opacity-80"
              :disabled="paying"
              @click="pay"
            >
              <Spinner v-if="paying" class="size-4" />
              {{ paying ? 'Processing…' : `Pay ${bill.total}` }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
