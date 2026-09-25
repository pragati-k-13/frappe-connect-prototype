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

    <div class="mt-4 grid gap-x-10 gap-y-6 sm:grid-cols-2">
      <div>
        <h3 class="text-p-base font-medium text-ink-gray-8">Included</h3>
        <ul class="mt-2 space-y-1.5">
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

      <div>
        <h3 class="text-p-base font-medium text-ink-gray-8">Not included</h3>
        <ul class="mt-2 space-y-1.5">
          <li
            v-for="item in PACK_ADD_ONS"
            :key="item.label"
            class="flex gap-2 text-p-base text-ink-gray-6"
          >
            <IconX class="mt-1 size-3.5 shrink-0 text-ink-gray-5" />
            <span class="min-w-0">
              {{ item.label }}
              <span v-if="item.hint" class="block text-p-sm text-ink-gray-6">
                {{ item.hint }}
              </span>
            </span>
          </li>
        </ul>
        <p class="mt-2 text-p-sm text-ink-gray-6">Each can be bought against a pack.</p>
      </div>
    </div>
  </section>
</template>
