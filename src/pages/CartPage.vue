<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ConnectShell from '../components/ConnectShell.vue'
import PackBasket from '../components/PackBasket.vue'
import { Button } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import IconBag from '~icons/lucide/shopping-bag'
import PackMark from '../components/PackMark.vue'
import {
  STARTER_PACKS,
  packModules,
  priceFor,
  marketFor,
  DEFAULT_REGION,
  packStepsFor,
  SESSIONS_PER_PACK,
} from '../data/packs'
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

// What happens after paying, not why to buy: someone in the cart has already
// decided. The catalogue's steps, titles only — see `packStepsFor`.
const steps = computed(() => packStepsFor(region.value))
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
          <h1 v-if="inCart.length" class="text-lg font-semibold text-ink-gray-7">Your cart</h1>

          <!-- ── Empty: the page is the empty state ────────────────────
               A gray bag over a few words, unframed, with the
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
            <List class="mt-1 [--list-gap:1rem]">
              <ListRow
                v-for="pack in inCart"
                :key="pack.value"
                :value="pack.value"
                class="py-4 sm:py-5"
              >
                <!-- `self-start` on each cell: List centres cells in the row,
                     and the logo, name and price should share a top edge. -->
                <!-- ⚠️ THE ROW IS THE PAGE'S ANCHOR. A package in a gray box —
                     the sidebar's mark for packs, see `PackMark` — is the
                     heaviest shape in the column, and the name and price step
                     up together. -->
                <ListCell class="self-start">
                  <PackMark :pack="pack" />
                </ListCell>
                <ListCell class="self-start">
                  <div class="min-w-0">
                    <h2 class="text-xl font-semibold text-ink-gray-8">{{ pack.name }}</h2>
                    <!-- No icons: the box is the row's picture, and these
                         lines say what they are. -->
                    <p class="mt-1.5 text-p-sm text-ink-gray-6">{{ packModules(pack) }}</p>
                    <p class="mt-1 text-p-sm text-ink-gray-6">
                      {{ pack.hours }} hrs within {{ SESSIONS_PER_PACK }} sessions
                    </p>
                  </div>
                </ListCell>
                <!-- Price and Remove share the right edge. Remove is the
                     quiet one: small, gray, no icon — not a rival to the
                     name. `-mr-2` puts its text on the price's edge. -->
                <ListCell class="self-start justify-end">
                  <div class="flex flex-col items-end">
                    <p class="text-xl font-semibold tabular-nums text-ink-gray-8">
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
            <h2 class="text-p-base font-medium text-ink-gray-8">How it works</h2>
            <!-- A line, not numbers: one dot per step on the first line of its
                 text, joined by a 1px rule that runs from the first dot to
                 the last — order without reading as a numbered list. The rule
                 is each step's own, reaching down to the next step's dot
                 (10px into the line + the 8px gap), so none follows the last. -->
            <ol class="mt-3 space-y-2">
              <li
                v-for="(step, i) in steps"
                :key="step.key"
                class="flex gap-2.5 text-p-sm text-ink-gray-6"
              >
                <span class="relative w-4 shrink-0" aria-hidden="true">
                  <span
                    v-if="i < steps.length - 1"
                    class="absolute -bottom-[18px] left-[7.5px] top-[10px] border-l border-outline-gray-3"
                  />
                  <span class="absolute left-[5px] top-[7px] size-1.5 rounded-full bg-current text-ink-gray-4" />
                </span>
                {{ step.title }}
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  </ConnectShell>
</template>
