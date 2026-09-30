<script setup>
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import { INCLUDED_IN_ALL, PACK_ADD_ONS } from '../data/packs'

// What every pack includes, and the add-ons none of them do — true of all
// packs, so printed once rather than inside each pack's scope. The four things
// no fixed scope can hold are not here: they are the case for custom work, and
// `PackFitTests` carries them. Shared by the recommendation screen and the
// Starter Packs page.
</script>

<template>
  <section>
    <h2 class="text-lg font-semibold text-ink-gray-8">True of every pack</h2>

    <!-- Two halves of one card: a shared frame, split by a rule — stacked on
         a phone, side by side from `sm`. -->
    <div
      class="mt-4 grid divide-y divide-outline-gray-1 rounded-6 border border-outline-gray-1 sm:grid-cols-2 sm:divide-x sm:divide-y-0"
    >
      <div class="p-4">
        <h3 class="text-p-base font-medium text-ink-gray-8">Included</h3>
        <ul class="mt-3 space-y-1.5">
          <li
            v-for="item in INCLUDED_IN_ALL"
            :key="item"
            class="flex gap-2 text-p-base text-ink-gray-6"
          >
            <IconCheck class="mt-1 size-3.5 shrink-0 text-ink-gray-5" />
            {{ item }}
          </li>
        </ul>
      </div>

      <div class="p-4">
        <h3 class="text-p-base font-medium text-ink-gray-8">Not included, available as add-ons</h3>
        <ul class="mt-3 space-y-1.5">
          <li
            v-for="item in PACK_ADD_ONS"
            :key="item.label"
            class="flex gap-2 text-p-base text-ink-gray-6"
          >
            <IconX class="mt-1 size-3.5 shrink-0 text-ink-gray-5" />
            <!-- The hint joins the line as a clause: "…beyond Day 1, covered
                 by an AMC". -->
            <span class="min-w-0">
              {{ item.hint ? `${item.label}, ${item.hint[0].toLowerCase()}${item.hint.slice(1)}` : item.label }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
