<script setup>
import { Button } from 'frappe-ui'
import IconBook from '~icons/lucide/book-open'
import IconLifeBuoy from '~icons/lucide/life-buoy'
import IconMessage from '~icons/lucide/message-square'
import IconExternal from '~icons/lucide/arrow-up-right'

// The short list of things somebody running an implementation reaches for, and
// deliberately short.
//
// ⚠️ IT IS NOT A HELP CENTRE. Three entries, each answering a different
// question: how do I learn this (the handbook), how do I ask my partner
// something (the thread), and what if the problem is Frappe rather than the
// partner (support). A fourth would be a link nobody clicks pushing the three
// that matter down the panel.
//
// ⚠️ THE TWO CONTACTS ARE SEPARATE ON PURPOSE. "Contact" as one button is the
// version that sends a complaint about a partner to that partner. The person
// needs to know which of the two they are writing to before they write.
defineProps({
  partner: { type: Object, default: null },
})
const emit = defineEmits(['message'])

// ⚠️ A real, public URL. The handbook is Frappe's own and the whole point of
// linking it is that it is the thing that already exists.
const HANDBOOK = 'https://frappe.io/handbook'
</script>

<template>
  <section>
    <h2 class="text-base font-medium text-ink-gray-8">Help</h2>
    <ul class="mt-3 space-y-2">
      <li>
        <a
          :href="HANDBOOK"
          target="_blank"
          rel="noreferrer"
          class="group flex gap-2.5 rounded-5 px-2 py-2 -mx-2 hover:bg-surface-gray-1"
        >
          <IconBook class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
          <span class="min-w-0">
            <span class="flex items-center gap-1 text-p-base text-ink-gray-8">
              Frappe handbook
              <IconExternal class="size-3.5 text-ink-gray-5" />
            </span>
            <span class="block text-p-sm text-ink-gray-5">
              How Frappe works, and how ERPNext is meant to be run
            </span>
          </span>
        </a>
      </li>
      <li v-if="partner">
        <button
          type="button"
          class="group flex w-full gap-2.5 rounded-5 px-2 py-2 -mx-2 text-left hover:bg-surface-gray-1"
          @click="emit('message')"
        >
          <IconMessage class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
          <span class="min-w-0">
            <span class="block text-p-base text-ink-gray-8">Ask {{ partner.name.split(' ')[0] }}</span>
            <span class="block text-p-sm text-ink-gray-5">
              Anything about the work itself
            </span>
          </span>
        </button>
      </li>
      <li>
        <a
          href="#"
          class="group flex gap-2.5 rounded-5 px-2 py-2 -mx-2 hover:bg-surface-gray-1"
        >
          <IconLifeBuoy class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
          <span class="min-w-0">
            <span class="block text-p-base text-ink-gray-8">Something wrong with the pack?</span>
            <span class="block text-p-sm text-ink-gray-5">
              Frappe, not your partner — scope, billing, or a match that isn't working
            </span>
          </span>
        </a>
      </li>
    </ul>
  </section>
</template>
