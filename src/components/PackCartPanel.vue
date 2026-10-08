<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import IconClose from '~icons/lucide/x'
import IconRemove from '~icons/lucide/trash-2'
import IconBag from '~icons/lucide/shopping-bag'
import { STARTER_PACKS, checkoutFor, priceFor } from '../data/packs'
import { useConnectStore } from '../stores/connect'

// The cart as a drawer: opened from the bag on a pack's page, in the shell's
// own right-hand panel (`ConnectShell`'s `#panel`), so it slides in the way
// every panel in the app does and the page stays readable beside it.
//
// ⚠️ A SHORT CART PAGE, not a second one: line items with Remove, then the
// bill. What the cart page adds (packs not yet in it, "Why Starter Packs") is
// for a page; a drawer opened from a pack is for finishing.
//
// ⚠️ THE BILL IS AN INVOICE'S FOOT, not `PackBasket`: subtotal, tax, total,
// each a labelled row with its figure in one right-hand column, so the total
// can be checked by adding down. Same `checkoutFor` the checkout bills from,
// so the drawer and the payment can't disagree. Where a market's rate isn't
// decided (`exact` false) the tax row says so and the total is named for
// what it is — before tax.
//
// Three sections, ruled: a header, the line items (the only part that
// scrolls), and the total with its button pinned at the foot.
//
// ⚠️ The button goes to the CART PAGE, not straight to payment: the cart is
// where a visitor signs up and a customer pays, the same step the catalogue's
// Continue leads to.
const props = defineProps({
  region: { type: String, required: true },
})
const emit = defineEmits(['close'])

const store = useConnectStore()
const router = useRouter()

const inCart = computed(() => STARTER_PACKS.filter((p) => store.packs.includes(p.value)))

const bill = computed(() => checkoutFor(inCart.value, props.region))

const checkout = () => store.packs.length && router.push({ name: 'cart' })

// Focus goes to the drawer when it opens, so a keyboard user is in it rather
// than still on the bag behind it; Escape closes it.
const closeButton = ref(null)
const onKey = (e) => e.key === 'Escape' && emit('close')
onMounted(() => {
  closeButton.value?.$el?.focus?.()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="flex h-full flex-col" aria-labelledby="cart-title">
    <div
      class="flex shrink-0 items-center justify-between border-b border-outline-gray-1 px-5 py-2"
    >
      <h2 id="cart-title" class="text-lg font-semibold text-ink-gray-8">Your packs</h2>
      <Button
        ref="closeButton"
        class="-mr-2"
        variant="ghost"
        :icon="IconClose"
        aria-label="Close"
        @click="emit('close')"
      />
    </div>

    <!-- ⚠️ EMPTY: the app's own empty state (as on Contact partners) — the
         drawer's mark, thin and gray, over a few words, centred where the
         line items would be. No bill under it: a subtotal, tax and total of
         ₹0 over a disabled button described nothing and offered nothing. -->
    <div
      v-if="!inCart.length"
      class="flex flex-1 flex-col items-center justify-center gap-3 px-5 pb-16"
    >
      <IconBag class="size-8 text-ink-gray-4" stroke-width="1.25" aria-hidden="true" />
      <p class="text-p-base text-ink-gray-6">No packs added</p>
    </div>

    <div v-else class="min-h-0 flex-1 overflow-y-auto px-5 py-1">
      <!-- Rules between line items only, the same as the scope's rows. -->
      <ul class="divide-y divide-outline-gray-1">
        <li v-for="pack in inCart" :key="pack.value" class="py-4">
          <div class="flex items-start justify-between gap-3">
            <p class="min-w-0 text-base font-medium text-ink-gray-8">{{ pack.name }}</p>
            <p class="shrink-0 text-base font-medium tabular-nums text-ink-gray-8">
              {{ priceFor(pack, props.region) }}
            </p>
          </div>
          <p class="mt-1 text-p-sm text-ink-gray-6">{{ pack.hours }} hrs of effort</p>
          <Button
            class="-ml-2 mt-1.5"
            variant="ghost"
            size="sm"
            label="Remove"
            @click="store.togglePack(pack.value)"
          >
            <template #prefix><IconRemove class="size-3.5" /></template>
          </Button>
        </li>
      </ul>
    </div>

    <!-- Pinned to the foot: the bill and the one button that finishes, in
         reach however long the list gets. -->
    <div v-if="inCart.length" class="shrink-0 border-t border-outline-gray-1 px-5 py-4">
      <dl class="space-y-2 text-p-base">
        <div class="flex justify-between gap-4">
          <dt class="text-ink-gray-6">Subtotal</dt>
          <dd class="tabular-nums text-ink-gray-8">{{ bill.subtotal }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-ink-gray-6">
            {{ bill.taxLabel[0].toUpperCase() + bill.taxLabel.slice(1) }}
          </dt>
          <dd class="tabular-nums text-ink-gray-8">{{ bill.exact ? bill.tax : 'At checkout' }}</dd>
        </div>
        <!-- The total sits on a rule, the line an invoice draws before it. -->
        <div class="flex items-baseline justify-between gap-4 border-t border-outline-gray-1 pt-3">
          <dt class="text-base font-medium text-ink-gray-8">
            {{ bill.exact ? 'Total' : 'Total before tax' }}
          </dt>
          <dd class="text-xl font-semibold tabular-nums text-ink-gray-9">{{ bill.total }}</dd>
        </div>
      </dl>

      <Button
        class="mt-4 w-full"
        variant="solid"
        size="md"
        label="Go to checkout"
        @click="checkout"
      />
    </div>
  </section>
</template>
