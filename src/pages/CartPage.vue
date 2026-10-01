<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ConnectShell from '../components/ConnectShell.vue'
import PackBasket from '../components/PackBasket.vue'
import { Button } from 'frappe-ui'
import IconTeam from '~icons/lucide/users-round'
import IconPrice from '~icons/lucide/receipt-text'
import IconDelivery from '~icons/lucide/calendar-check'
import IconPack from '~icons/lucide/box'
import IconRemove from '~icons/lucide/trash-2'
import IconAdd from '~icons/lucide/plus'
import { STARTER_PACKS, priceFor, marketFor, DEFAULT_REGION } from '../data/packs'
import { useConnectStore } from '../stores/connect'
import { basketReturnTo, useBasketReturn } from '../utils/auth'

// SCREEN — the cart. The basket reviewed before paying.
//
// ⚠️ TWO GROUPS, NOT ONE CHECKLIST. The packs in the cart are line items in a
// frame, each with its price and a Remove; the rest sit unframed below with an
// Add. A list of four checkboxes read as the catalogue again — a cart is the
// things you are buying, set apart from the things you are not. No scope links:
// the packs were read on the catalogue.
//
// ⚠️ OPEN TO EVERYONE, and the gate is its button: a visitor signs up from here
// and returns to it with the basket kept; a customer goes on to pay.
const store = useConnectStore()
const router = useRouter()
useBasketReturn()

// Same region rule as the catalogue — see `PacksPage`.
const region = computed(
  () => marketFor(store.filters.countries[0]) ?? store.answers.region[0] ?? DEFAULT_REGION,
)

const inCart = computed(() => STARTER_PACKS.filter((p) => store.packs.includes(p.value)))
const notInCart = computed(() => STARTER_PACKS.filter((p) => !store.packs.includes(p.value)))

const checkout = () => {
  if (!store.packs.length) return
  if (!store.signedIn) {
    return router.push({ name: 'signup', query: { next: basketReturnTo('/connect/packs/cart') } })
  }
  router.push({ name: 'checkout' })
}

// Read off the packs, so a new delivery window can't leave this line stale.
const days = STARTER_PACKS.map((p) => p.validityDays)
const [minDays, maxDays] = [Math.min(...days), Math.max(...days)]

const WHY = [
  { icon: IconTeam, label: 'Implemented by Frappe’s own team' },
  { icon: IconPrice, label: 'Fixed price, fixed scope' },
  {
    icon: IconDelivery,
    label: minDays === maxDays ? `Live in ${minDays} days` : `Live in ${minDays} to ${maxDays} days`,
  },
]
</script>

<template>
  <ConnectShell root-label="Starter Packs" root-to="/connect/packs" crumb="Cart">
    <!-- The cart and its rail as ONE centred block, the rail close beside the
         list — unlike the catalogue, whose rail sits at the page's edge. -->
    <div class="w-full px-5 py-8 lg:px-8">
      <div class="mx-auto grid max-w-[1000px] gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold text-ink-gray-8">Your cart</h1>

          <!-- ── In the cart: line items ─────────────────────────────── -->
          <div class="mt-6 rounded-6 border border-outline-gray-2">
            <p v-if="!inCart.length" class="px-5 py-8 text-p-base text-ink-gray-6">
              Your cart is empty. Add a pack below.
            </p>
            <ul v-else class="divide-y divide-outline-gray-1">
              <li v-for="pack in inCart" :key="pack.value" class="flex items-start gap-4 p-4 sm:p-5">
                <div class="hidden size-12 shrink-0 place-items-center rounded-4 bg-surface-gray-2 sm:grid">
                  <IconPack class="size-5 text-ink-gray-7" />
                </div>
                <div class="min-w-0 flex-1">
                  <h2 class="text-lg font-medium text-ink-gray-8">{{ pack.name }}</h2>
                  <p class="mt-1 text-p-sm text-ink-gray-6">
                    {{ pack.hours }} hrs of effort, delivered in {{ pack.validity }}
                  </p>
                  <Button
                    class="-ml-2 mt-2"
                    variant="ghost"
                    size="sm"
                    label="Remove"
                    @click="store.togglePack(pack.value)"
                  >
                    <template #prefix><IconRemove class="size-3.5" /></template>
                  </Button>
                </div>
                <p class="shrink-0 text-lg font-medium tabular-nums text-ink-gray-8">
                  {{ priceFor(pack, region) }}
                </p>
              </li>
            </ul>
          </div>

          <!-- ── Not in the cart: one tap to add ──────────────────────── -->
          <section v-if="notInCart.length" class="mt-12">
            <h2 class="text-base font-semibold text-ink-gray-8">Add a pack</h2>
            <ul class="mt-2 divide-y divide-outline-gray-1">
              <li
                v-for="pack in notInCart"
                :key="pack.value"
                class="flex items-center gap-4 py-3"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-p-base font-medium text-ink-gray-8">{{ pack.name }}</p>
                  <p class="text-p-sm text-ink-gray-6">
                    {{ pack.hours }} hrs of effort, delivered in {{ pack.validity }}
                  </p>
                </div>
                <p class="shrink-0 text-p-base tabular-nums text-ink-gray-7">
                  {{ priceFor(pack, region) }}
                </p>
                <Button variant="subtle" label="Add" @click="store.togglePack(pack.value)">
                  <template #prefix><IconAdd class="size-4" /></template>
                </Button>
              </li>
            </ul>
          </section>
        </div>

        <aside class="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <PackBasket :packs="store.packs" :region="region" @checkout="checkout" />

          <div class="rounded-6 border border-outline-gray-2 p-4">
            <h2 class="text-p-base font-medium text-ink-gray-8">Why Starter Packs?</h2>
            <ul class="mt-3 space-y-3">
              <li
                v-for="item in WHY"
                :key="item.label"
                class="flex items-center gap-2.5 text-p-sm text-ink-gray-7"
              >
                <component :is="item.icon" class="size-4 shrink-0 text-ink-gray-6" />
                {{ item.label }}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </ConnectShell>
</template>
