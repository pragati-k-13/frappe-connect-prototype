<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Checkbox } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import IconClose from '~icons/lucide/x'
import IconBag from '~icons/lucide/shopping-bag'
import IconUser from '~icons/lucide/user-round'
import PackTermsDialog from './PackTermsDialog.vue'
import { STARTER_PACKS, checkoutFor, priceFor } from '../data/packs'
import { appLogo } from '../data/apps'
import { useConnectStore } from '../stores/connect'
import { basketReturnTo } from '../utils/auth'

// ⚠️ THE CART. There is no cart page: this drawer, in the shell's right-hand
// panel (`ConnectShell`'s `cart-region`), is where the packs are reviewed and
// paid for, from whichever page it was opened on. Its button goes straight to
// the payment page.
//
// Three sections: a header, the line items (the only part that scrolls), and
// the bill with the act pinned at the foot.
//
// ⚠️ THE BILL IS AN INVOICE'S FOOT: subtotal, tax, total, each a labelled row
// with its figure in one right-hand column, so the total can be checked by
// adding down. Same `checkoutFor` the payment bills from, so the two can't
// disagree. Where a market's rate isn't decided (`exact` false) the tax row
// says so and the total is named for what it is — before tax.
//
// ⚠️ SIGNED OUT, THE BUTTON IS SIGN UP, and there is no terms box: nobody is
// paying yet. Sign-up returns to the page they were on with this drawer open
// again (`basketReturnTo(…, { cart: true })`), signed in, the packs kept — and
// then the box, and the payment.
const props = defineProps({
  region: { type: String, required: true },
})
const emit = defineEmits(['close'])

const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const inCart = computed(() => STARTER_PACKS.filter((p) => store.packs.includes(p.value)))

const bill = computed(() => checkoutFor(inCart.value, props.region))
const taxRow = computed(() => bill.value.taxLabel[0].toUpperCase() + bill.value.taxLabel.slice(1))

// ⚠️ AN EXPLICIT TICK, ONLY WHERE PAYING IS NEXT. The button stays live:
// pressed unticked it says why under the box, rather than sitting disabled with
// no reason. "Starter Pack terms" opens the terms, and their Agree ticks it.
const agreed = ref(false)
const termsOpen = ref(false)
const termsError = ref('')
watch(agreed, (v) => v && (termsError.value = ''))

const act = () => {
  if (!store.packs.length) return
  if (!store.signedIn) {
    return router.push({
      name: 'signup',
      query: { next: basketReturnTo(route.path, { cart: true }) },
    })
  }
  if (!agreed.value) {
    termsError.value = 'Agree to the terms to continue'
    return
  }
  router.push({ name: 'checkout' })
}

// Focus goes to the drawer when it opens, so a keyboard user is in it rather
// than still on the bag behind it; Escape closes it — unless the terms are
// open over it, which take their own Escape.
const closeButton = ref(null)
const onKey = (e) => e.key === 'Escape' && !termsOpen.value && emit('close')
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
      <h2 id="cart-title" class="text-lg font-semibold text-ink-gray-8">Your cart</h2>
      <Button
        ref="closeButton"
        class="-mr-2"
        variant="ghost"
        :icon="IconClose"
        aria-label="Close"
        @click="emit('close')"
      />
    </div>

    <!-- ⚠️ EMPTY: the app's own empty state — the bag, gray, over a few words,
         centred where the line items would be. No bill under it: a ₹0 total
         over a disabled button described nothing and offered nothing. -->
    <div
      v-if="!inCart.length"
      class="flex flex-1 flex-col items-center justify-center gap-3 px-5 pb-16"
    >
      <IconBag class="size-6 text-ink-gray-5" aria-hidden="true" />
      <p class="text-p-base text-ink-gray-6">No packs added</p>
    </div>

    <!-- The line items: logo, name over Remove, then the price. No modules or
         hours: the cards and pack pages carry those; the cart is for what it
         costs. Static
         List rows — they carry their own Remove — with cells top-aligned.
         Panel sizes: the name a step under the drawer's title, so the title
         reads as one; the total stays the largest figure. -->
    <div v-else class="min-h-0 flex-1 overflow-y-auto px-5">
      <List class="[--list-gap:0.75rem]">
        <ListRow v-for="pack in inCart" :key="pack.value" :value="pack.value" class="py-4">
          <ListCell class="self-start">
            <img :src="appLogo(pack.apps[0])" alt="" class="size-7 object-contain" />
          </ListCell>
          <!-- The name, on the logo's top edge as the price is, with Remove
               under it — the
               action beside what it removes, and the right edge left to the
               prices alone, one column like the bill's. `-ml-2` puts Remove's
               text on the name's edge. -->
          <ListCell class="self-start">
            <div class="flex min-w-0 flex-col items-start">
              <h3 class="min-w-0 max-w-full text-base font-semibold text-ink-gray-7">
                <span class="truncate">{{ pack.name }}</span>
              </h3>
              <Button
                class="-ml-2 !text-ink-gray-6"
                variant="ghost"
                size="sm"
                label="Remove"
                @click="store.togglePack(pack.value)"
              />
            </div>
          </ListCell>
          <ListCell class="self-start justify-end">
            <p class="text-base font-semibold tabular-nums text-ink-gray-7">
              {{ priceFor(pack, props.region) }}
            </p>
          </ListCell>
        </ListRow>
      </List>
    </div>

    <!-- Pinned to the foot: the bill, then — set apart by space, not a rule —
         the terms 12px over the button they unlock. -->
    <div v-if="inCart.length" class="shrink-0 border-t border-outline-gray-1 px-5 py-4">
      <dl class="space-y-1.5 text-p-sm">
        <div class="flex justify-between gap-3">
          <dt class="text-ink-gray-6">Subtotal</dt>
          <dd class="font-medium tabular-nums text-ink-gray-7">{{ bill.subtotal }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-ink-gray-6">{{ taxRow }}</dt>
          <dd
            class="font-medium tabular-nums"
            :class="bill.exact ? 'text-ink-gray-7' : 'text-ink-gray-6'"
          >
            {{ bill.exact ? bill.tax : 'At checkout' }}
          </dd>
        </div>
      </dl>
      <div
        class="mt-3 flex items-baseline justify-between gap-3 border-t border-outline-gray-2 pt-3"
      >
        <p class="text-p-base font-medium text-ink-gray-8">
          {{ bill.exact ? 'Total' : 'Total before tax' }}
        </p>
        <p class="text-2xl font-semibold tabular-nums text-ink-gray-8">{{ bill.total }}</p>
      </div>

      <div class="mt-6">
        <!-- Checkbox hands `class` to its input, hence the wrapper; `flex`
             so the wrapper doesn't take a full text line's height. -->
        <div v-if="store.signedIn" class="mb-3 flex">
          <Checkbox v-model="agreed" :error="termsError">
            <template #label>
              I agree to the
              <button
                type="button"
                class="underline decoration-outline-gray-3 underline-offset-2 hover:decoration-ink-gray-5"
                @click.prevent.stop="termsOpen = true"
              >
                Starter Pack terms
              </button>
            </template>
          </Checkbox>
        </div>
        <Button
          class="w-full"
          variant="solid"
          size="md"
          :label="store.signedIn ? 'Check out' : 'Sign up to continue'"
          @click="act"
        >
          <template v-if="!store.signedIn" #prefix><IconUser class="size-4" /></template>
        </Button>
      </div>
    </div>

    <PackTermsDialog
      v-if="store.signedIn"
      v-model:open="termsOpen"
      :region="props.region"
      :agreed="agreed"
      @agree="agreed = true"
    />
  </section>
</template>
