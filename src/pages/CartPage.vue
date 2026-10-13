<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ConnectShell from '../components/ConnectShell.vue'
import PackBasket from '../components/PackBasket.vue'
import { Button } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import IconCheck from '~icons/lucide/check'
import IconHours from '~icons/lucide/clock'
import IconModules from '~icons/lucide/boxes'
import IconBag from '~icons/lucide/shopping-bag'
import {
  STARTER_PACKS,
  packModules,
  priceFor,
  marketFor,
  DEFAULT_REGION,
} from '../data/packs'
import { appLogo } from '../data/apps'
import { useConnectStore } from '../stores/connect'
import { basketReturnTo, useBasketReturn } from '../utils/auth'

// SCREEN — the cart. The basket reviewed before paying.
//
// ⚠️ ONLY WHAT IS IN THE CART. The packs are line items, each with its price
// and a Remove, rules between rows only. Nothing is added from here — not
// even an upgrade: adding happens on the catalogue and the pack pages, where
// the scope and the choice between Core and Core + Manufacturing are laid
// out. "Starter Packs" in the crumb is the way back.
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

// One check for every reason: they're a list of what you get, and three
// different pictures made three different kinds of thing out of it.
const WHY = [
  'Implemented by Frappe’s own team',
  'Fixed price, fixed scope',
  minDays === maxDays ? `Live in ${minDays} days` : `Live in ${minDays} to ${maxDays} days`,
]
</script>

<template>
  <ConnectShell root-label="Starter Packs" root-to="/connect/packs" crumb="Cart" :auth-cta="false">
    <!-- The cart and its rail as ONE centred block, the rail close beside the
         list — unlike the catalogue, whose rail sits at the page's edge.
         64px between them: the line items are unframed, so their prices run
         to the column's edge and the gap is all the air beside the rail. -->
    <div class="w-full px-5 py-8 lg:px-8">
      <div class="mx-auto grid max-w-[1000px] gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div class="min-w-0" :class="!inCart.length && 'lg:col-span-2'">
          <!-- Only over line items: empty, the empty state's words are the
               heading. -->
          <h1 v-if="inCart.length" class="text-2xl font-semibold text-ink-gray-8">Your cart</h1>

          <!-- ── Empty: the page is the empty state ────────────────────
               The drawer's bag and words (PackCartPanel), unframed, with the
               words as the page's heading and one way out: back to the
               catalogue, where the packs and the choice between Core and Core
               + Manufacturing are laid out. Nothing is added from here.
               Centred in the page: 7rem is the shell's 48px bar and this
               block's py-8, top and bottom. -->
          <div
            v-if="!inCart.length"
            class="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center gap-3 text-center"
          >
            <IconBag class="size-6 text-ink-gray-5" aria-hidden="true" />
            <h1 class="text-lg font-medium text-ink-gray-7">No packs added</h1>
            <Button
              class="mt-1"
              variant="solid"
              size="sm"
              label="Explore Starter Packs"
              :route="{ name: 'packs' }"
            />
          </div>

          <!-- ── In the cart: line items ─────────────────────────────── -->
          <template v-else>
            <!-- frappe-ui's List, feed mode: logo, content, trailing. Static
                 rows (they carry their own Remove), so no hover surface and
                 no content inset; dividers start at the text edge. -->
            <List class="mt-1 [--list-gap:0.75rem]">
              <ListRow
                v-for="pack in inCart"
                :key="pack.value"
                :value="pack.value"
                class="py-4 sm:py-5"
              >
                <!-- `self-start` on each cell: List centres cells in the row,
                     and the logo, name and price should share a top edge. -->
                <ListCell class="self-start">
                  <img :src="appLogo(pack.apps[0])" alt="" class="size-8 object-contain" />
                </ListCell>
                <!-- The anchor beside the total: the name a step up, then the
                     pack's facts with the catalogue card's own icons, one
                     lane — so the row reads as the card it was chosen from. -->
                <ListCell class="self-start">
                  <div class="min-w-0">
                    <h2 class="text-lg font-semibold text-ink-gray-7">{{ pack.name }}</h2>
                    <p class="mt-2 flex items-start gap-2 text-p-sm text-ink-gray-6">
                      <IconModules class="mt-0.5 size-4 shrink-0" />
                      {{ packModules(pack) }}
                    </p>
                    <p class="mt-1 flex items-center gap-2 text-p-sm text-ink-gray-6">
                      <IconHours class="size-4 shrink-0" />
                      {{ pack.hours }} hrs of effort
                    </p>
                  </div>
                </ListCell>
                <!-- Price and Remove share the right edge. Remove is the
                     quiet one: small, gray, no icon — not a rival to the
                     name. `-mr-2` puts its text on the price's edge. -->
                <ListCell class="self-start justify-end">
                  <div class="flex flex-col items-end">
                    <p class="text-lg font-semibold tabular-nums text-ink-gray-7">
                      {{ priceFor(pack, region) }}
                    </p>
                    <Button
                      class="-mr-2 mt-1 !text-ink-gray-6"
                      variant="ghost"
                      size="sm"
                      label="Remove"
                      @click="store.togglePack(pack.value)"
                    />
                  </div>
                </ListCell>
              </ListRow>
            </List>
          </template>
        </div>

        <!-- The rail only once there is something to pay for. Empty, the line
             items' own empty state says it; a ₹0 total over a disabled Sign up
             beside it was a second "nothing here", and the pitch beside an
             empty cart sold to someone already here. The catalogue keeps its
             empty basket — see PackBasket. Empty, the page takes the rail's
             column too: nothing is added from here, so nothing shifts. -->
        <aside v-if="inCart.length" class="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <PackBasket :packs="store.packs" :region="region" require-terms @checkout="checkout" />

          <div class="rounded-6 border border-outline-gray-2 p-4">
            <h2 class="text-p-base font-medium text-ink-gray-8">Why Starter Packs?</h2>
            <ul class="mt-3 space-y-3">
              <li
                v-for="item in WHY"
                :key="item"
                class="flex items-center gap-2.5 text-p-sm text-ink-gray-7"
              >
                <IconCheck class="size-4 shrink-0 text-ink-gray-6" />
                {{ item }}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </ConnectShell>
</template>
