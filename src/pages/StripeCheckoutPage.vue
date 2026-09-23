<script setup>
// SCREEN — the payment page, drawn as Stripe's hosted checkout.
//
// ⚠️ THE FICTION IS THAT YOU HAVE LEFT THE APP, and every layout decision here
// serves it: no ConnectShell, no sidebar, no breadcrumb, no app nav. Stripe
// hosts its own checkout, which is the entire reason a card number never
// reaches this application — drawing it as a dialog floating over our own
// chrome would be drawing a lie about where the buyer's details go.
//
// ⚠️ THIS COLLECTS NOTHING AND CAN COLLECT NOTHING. The fields below are inert
// on purpose: they are `readonly`, they carry obviously fake values, and the
// banner says so. A convincing card form in a prototype is an invitation to
// type a real card number into a page that will do something unknown with it,
// and no amount of "it's only a mock" in a comment protects the person who does
// it. If this is ever wired up, it is wired up to Stripe's hosted page — not by
// making these inputs real.
//
// ⚠️ NO STRIPE LOGO. The wordmark is a trademark and a hand-drawn approximation
// of a payment brand on a payment screen is worse than none — this is the one
// page where slightly wrong reads as fraudulent. The name in text is the honest
// stand-in until licensed assets are dropped in, same rule as the card networks
// on `PaymentMethodPicker`.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Spinner, toast } from 'frappe-ui'
import IconLock from '~icons/lucide/lock'
import IconArrowLeft from '~icons/lucide/arrow-left'
import { PARTNERS } from '../data/partners'
import { checkoutFor, marketFor, DEFAULT_REGION } from '../data/packs'
import { PAYMENT_MS, PROVIDER, methodBy } from '../data/payment'
import { useConnectStore } from '../stores/connect'

const store = useConnectStore()
const router = useRouter()
const route = useRoute()

const packs = computed(() => store.packRecords())
const region = computed(() => marketFor(store.company.country) ?? DEFAULT_REGION)
const bill = computed(() => checkoutFor(packs.value, region.value))
const method = computed(() => methodBy(route.query.method) ?? methodBy('card'))

const paying = ref(false)

// ⚠️ THE ASSIGNMENT HAPPENS ON PAYMENT, which is what the catalogue's "How it
// works" promises: you buy the pack from Frappe, and Frappe assigns a partner
// against it. Not before — an assignment made at the point of browsing would be
// a name shown to somebody who never bought anything.
//
// The best match under the answers already given, which is `store.results` —
// the same filtered, tier-ranked list the directory shows, so the assignment is
// at least consistent with what the visitor would have seen browsing. A real
// build decides this server-side on capacity and the overlap the profile brags
// about. Falling back to the first partner keeps the screen reachable when the
// filters have narrowed to nothing.
const pay = () => {
  if (paying.value || !packs.value.length) return
  paying.value = true
  // The delay exists so the processing state is reviewable; there is nothing to
  // call. Same reasoning as `AUTH_MS` on the auth screens.
  setTimeout(() => {
    const assigned = store.results[0] ?? PARTNERS[0]
    // ⚠️ THREE THINGS AT ONCE, in this order: the project exists, the partner
    // is on it, and the conversation is open with the brief already sent. The
    // last one is the part a customer would otherwise have to do themselves,
    // and it is the difference between being assigned a partner and being
    // introduced to one. See `bookingThread`.
    store.startBooking({ partner: assigned, packs: packs.value })
    toast.success('Payment received', {
      description: `A receipt is on its way, and we have introduced you to ${assigned.name}.`,
    })
    // ⚠️ The basket is cleared HERE and not on the confirmation screen. Leaving
    // it full would let a reload of the checkout charge for the same packs
    // again, and the confirmation reads the project rather than the basket.
    store.setPacks([])
    router.replace({ name: 'confirmed', query: { partner: assigned.id } })
  }, PAYMENT_MS)
}
</script>

<template>
  <!-- Stripe's own two-up: the order on the left against a tinted panel, the
       form on the right on white. Stacked below `lg`, order first — on a phone
       the thing being bought has to come before the way of buying it. -->
  <div class="min-h-screen bg-white lg:grid lg:grid-cols-2">
    <!-- ── What you are paying for ───────────────────────────────────── -->
    <section class="border-b border-outline-gray-2 bg-surface-gray-1 px-6 py-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
      <div class="mx-auto w-full max-w-[380px]">
        <!-- Back to the merchant, which is us. Stripe's own page carries this
             arrow and it is the one control on the left half. -->
        <button
          type="button"
          class="flex items-center gap-2 text-p-base text-ink-gray-6 hover:text-ink-gray-8"
          @click="router.back()"
        >
          <IconArrowLeft class="size-4" />
          Frappe Technologies
        </button>

        <p class="mt-8 text-p-base text-ink-gray-6">
          Pay Frappe Technologies
        </p>
        <p class="mt-1 text-3xl font-semibold tabular-nums text-ink-gray-9">{{ bill.total }}</p>

        <dl class="mt-8 space-y-3 text-p-base">
          <div v-for="line in bill.lines" :key="line.value" class="flex justify-between gap-4">
            <dt class="min-w-0 text-ink-gray-7">
              {{ line.name }}
              <span class="block text-p-sm text-ink-gray-5">{{ line.hours }} hours</span>
            </dt>
            <dd class="shrink-0 tabular-nums text-ink-gray-8">{{ line.price }}</dd>
          </div>
          <div class="flex justify-between gap-4 border-t border-outline-gray-2 pt-3">
            <dt class="text-ink-gray-7">Subtotal</dt>
            <dd class="shrink-0 tabular-nums text-ink-gray-8">{{ bill.subtotal }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-ink-gray-7">{{ bill.taxLabel }}</dt>
            <dd class="shrink-0 tabular-nums text-ink-gray-8">{{ bill.tax ?? '—' }}</dd>
          </div>
          <div class="flex justify-between gap-4 border-t border-outline-gray-2 pt-3">
            <dt class="font-medium text-ink-gray-9">Total due</dt>
            <dd class="shrink-0 font-medium tabular-nums text-ink-gray-9">{{ bill.total }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- ── How you are paying ────────────────────────────────────────── -->
    <section class="px-6 py-10 lg:px-12 lg:py-16">
      <div class="mx-auto w-full max-w-[380px]">
        <!-- ⚠️ THE BANNER IS NOT DECORATION. It is what stops somebody typing a
             real card number into a prototype. It says what this is before the
             fields, not after them. -->
        <div class="rounded-5 border border-outline-amber-2 bg-surface-amber-1 px-4 py-3">
          <!-- ⚠️ GREY TEXT ON THE AMBER SURFACE, not amber text. `ink-amber-3`
               is oklch .917 — near-white, and on `surface-amber-1` the warning
               was effectively invisible, which for the one notice on the page
               that stops somebody typing a real card number is the worst
               possible failure. The amber fill and border carry the signal; the
               words carry the contrast. (`ink-amber-1..4` are all too light for
               body copy — see the same trap documented in
               `PartnerMarketplaceSection`.) -->
          <p class="text-p-sm leading-relaxed text-ink-gray-8">
            Mock payment page. Nothing here is connected to a payment processor, the fields cannot
            be edited, and no card or UPI details are collected or sent anywhere.
          </p>
        </div>

        <h1 class="mt-8 text-p-lg font-semibold text-ink-gray-9">
          Pay with {{ method.label }}
        </h1>
        <p class="mt-1 text-p-base text-ink-gray-6">{{ PROVIDER.label }} · {{ PROVIDER.blurb }}</p>

        <!-- ⚠️ `readonly`, and every value visibly fake. See the top of the
             file. These are here so the page has the shape of a checkout, not
             so anyone can use them. -->
        <div class="mt-6 space-y-4">
          <label class="block">
            <span class="block text-sm text-ink-gray-7">Email</span>
            <input
              class="mt-1.5 w-full rounded-md border border-outline-gray-2 bg-surface-gray-1 px-3 py-2 text-base text-ink-gray-6"
              readonly
              :value="store.viewer.email || 'you@company.example'"
            />
          </label>

          <template v-if="method.value === 'card'">
            <label class="block">
              <span class="block text-sm text-ink-gray-7">Card information</span>
              <input
                class="mt-1.5 w-full rounded-md border border-outline-gray-2 bg-surface-gray-1 px-3 py-2 text-base tabular-nums text-ink-gray-6"
                readonly
                value="0000 0000 0000 0000"
                aria-label="Card number, sample value, not editable"
              />
            </label>
            <div class="grid grid-cols-2 gap-3">
              <input
                class="w-full rounded-md border border-outline-gray-2 bg-surface-gray-1 px-3 py-2 text-base tabular-nums text-ink-gray-6"
                readonly
                value="MM / YY"
                aria-label="Expiry, sample value, not editable"
              />
              <input
                class="w-full rounded-md border border-outline-gray-2 bg-surface-gray-1 px-3 py-2 text-base tabular-nums text-ink-gray-6"
                readonly
                value="CVC"
                aria-label="Security code, sample value, not editable"
              />
            </div>
          </template>

          <label v-else class="block">
            <span class="block text-sm text-ink-gray-7">UPI ID</span>
            <input
              class="mt-1.5 w-full rounded-md border border-outline-gray-2 bg-surface-gray-1 px-3 py-2 text-base text-ink-gray-6"
              readonly
              value="you@examplebank"
              aria-label="UPI ID, sample value, not editable"
            />
            <span class="mt-1.5 block text-p-sm text-ink-gray-5">{{ method.hint }}</span>
          </label>
        </div>

        <Button
          class="mt-6 w-full"
          variant="solid"
          size="md"
          :disabled="paying"
          :label="paying ? 'Processing…' : `Pay ${bill.total}`"
          @click="pay"
        >
          <template v-if="paying" #prefix>
            <Spinner class="size-4" />
          </template>
        </Button>

        <p class="mt-3 flex items-center justify-center gap-1.5 text-p-sm text-ink-gray-5">
          <IconLock class="size-3.5" />
          Payments are processed by {{ PROVIDER.label }}
        </p>
      </div>
    </section>
  </div>
</template>
