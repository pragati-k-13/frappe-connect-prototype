<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ConnectShell from '../components/ConnectShell.vue'
import PackBasket from '../components/PackBasket.vue'
import { Button } from 'frappe-ui'
import IconCheck from '~icons/lucide/check'
import IconAdd from '~icons/lucide/plus'
import IconBag from '~icons/lucide/shopping-bag'
import { STARTER_PACKS, packConflicts, priceFor, marketFor, DEFAULT_REGION } from '../data/packs'
import { appLogo } from '../data/apps'
import { useConnectStore } from '../stores/connect'
import { basketReturnTo, useBasketReturn } from '../utils/auth'

// SCREEN — the cart. The basket reviewed before paying.
//
// ⚠️ TWO GROUPS, NOT ONE CHECKLIST. The packs in the cart are line items, each
// with its price and a Remove; the rest sit below under "Other packs", each
// with what adding it does — Add, Upgrade or Switch to this, which is why the
// heading names the packs and not one action. Neither is framed — rules between rows only, and the heading is what
// sets the two apart. A list of four checkboxes read as the catalogue again — a
// cart is the things you are buying, set apart from the things you are not. No
// scope links: the packs were read on the catalogue.
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

// What adding a pack does to the cart, said on its button — the catalogue's
// words. Core and the pack that contains it can't both be in: adding one takes
// the other out (`togglePack`), so that is "Upgrade" from Core and "Switch to
// this" back to it, never a silent swap.
const addLabel = (pack) => {
  const replaces = packConflicts(pack.value).find((v) => store.packs.includes(v))
  if (!replaces) return 'Add'
  return pack.supersedes?.includes(replaces) ? 'Upgrade' : 'Switch to this'
}

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
          <h1 v-if="inCart.length" class="text-2xl font-semibold text-ink-gray-8">Review your cart</h1>

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
            <div class="mt-1">
              <ul class="divide-y divide-outline-gray-1">
                <li
                  v-for="pack in inCart"
                  :key="pack.value"
                  class="flex items-start gap-3 py-4 sm:py-5"
                >
                  <!-- The pack's app logo, in a fixed slot so names line up. -->
                  <img :src="appLogo(pack.apps[0])" alt="" class="size-8 shrink-0 object-contain" />
                  <div class="min-w-0 flex-1">
                    <h2 class="text-base font-semibold text-ink-gray-7">{{ pack.name }}</h2>
                    <p class="mt-1 text-p-sm text-ink-gray-6">{{ pack.hours }} hrs of effort</p>
                  </div>
                  <!-- Price and Remove share the right edge. Remove is the
                       quiet one: small, gray, no icon — not a rival to the
                       name. `-mr-2` puts its text on the price's edge. -->
                  <div class="flex shrink-0 flex-col items-end">
                    <p class="text-base font-semibold tabular-nums text-ink-gray-7">
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
                </li>
              </ul>
            </div>

            <!-- ── Not in the cart: one tap to add ──────────────────────── -->
            <section v-if="notInCart.length" class="mt-12">
              <h2 class="text-base font-semibold text-ink-gray-8">Other packs</h2>
              <ul class="mt-2 divide-y divide-outline-gray-1">
                <li
                  v-for="pack in notInCart"
                  :key="pack.value"
                  class="flex items-center justify-between gap-4 py-3"
                >
                  <!-- The price rides in the subtext, beside the hours: these
                       are offers, not lines on the bill, so it isn't a column. -->
                  <div class="min-w-0">
                    <p class="text-p-base font-semibold text-ink-gray-7">{{ pack.name }}</p>
                    <p class="text-p-sm tabular-nums text-ink-gray-6">
                      {{ priceFor(pack, region) }} · {{ pack.hours }} hrs of effort
                    </p>
                  </div>
                  <div class="flex shrink-0 justify-end">
                    <Button
                      variant="subtle"
                      :label="addLabel(pack)"
                      @click="store.togglePack(pack.value)"
                    >
                      <template v-if="addLabel(pack) === 'Add'" #prefix>
                        <IconAdd class="size-4" />
                      </template>
                    </Button>
                  </div>
                </li>
              </ul>
            </section>
          </template>
        </div>

        <!-- The rail only once there is something to pay for. Empty, the line
             items' own empty state says it; a ₹0 total over a disabled Sign up
             beside it was a second "nothing here", and the pitch beside an
             empty cart sold to someone already here. The catalogue keeps its
             empty basket — see PackBasket. Empty, the page takes the rail's
             column too: nothing is added from here, so nothing shifts. -->
        <aside v-if="inCart.length" class="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <PackBasket :packs="store.packs" :region="region" @checkout="checkout" />

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
