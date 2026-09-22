<script setup>
import IconBook from '~icons/lucide/book-open'
import IconLifeBuoy from '~icons/lucide/life-buoy'
import IconFeedback from '~icons/lucide/message-square-quote'
import IconMessage from '~icons/lucide/message-square'
import IconExternal from '~icons/lucide/arrow-up-right'

// The short list of things somebody running an implementation reaches for, and
// deliberately short.
//
// ⚠️ IT IS NOT A HELP CENTRE. Three entries, each answering a different
// question: how do I learn this (the handbook), how do I ask my partner
// something (the thread), and what if the problem is Frappe rather than the
// partner (support).
//
// ⚠️ A FOURTH NOW, AND THE NOTE ABOVE ARGUED AGAINST ONE — "a link nobody
// clicks pushing the three that matter down the panel". That is the right test
// and Give feedback passes it, because it is not a fourth way to get help. The
// three above are for a person who needs something; this is for a person who
// has something to say, and there is nowhere else in the product to say it
// except when Frappe asks — at a partner, at go-live, at the recommendation.
// Feedback you can only give when asked is feedback about the questions.
//
// ⚠️ THE TWO CONTACTS ARE SEPARATE ON PURPOSE. "Contact" as one button is the
// version that sends a complaint about a partner to that partner. The person
// needs to know which of the two they are writing to before they write.
//
// ⚠️ NO DESCRIPTIONS. Each row carried a second line explaining itself — "How
// Frappe works, and how ERPNext is meant to be run" under "Frappe handbook" —
// which is forty words of caption on a list of three links whose labels already
// say where they go. It doubled the block's height and taught nothing. The
// labels carry the distinction instead, which is the only thing that needed
// carrying: the third one says whose problem it is for.
defineProps({
  partner: { type: Object, default: null },
})
const emit = defineEmits(['message', 'feedback'])

// ⚠️ A real, public URL. The handbook is Frappe's own and the whole point of
// linking it is that it is the thing that already exists.
const HANDBOOK = 'https://frappe.io/handbook'
</script>

<template>
  <section>
    <h2 class="text-base font-medium text-ink-gray-8">Help</h2>
    <ul class="mt-2 space-y-0.5">
      <li>
        <a
          :href="HANDBOOK"
          target="_blank"
          rel="noreferrer"
          class="-mx-2 flex items-center gap-2.5 rounded-5 px-2 py-1.5 hover:bg-surface-gray-1"
        >
          <IconBook class="size-4 shrink-0 text-ink-gray-6" />
          <span class="flex min-w-0 items-center gap-1 text-p-base text-ink-gray-8">
            Frappe handbook
            <IconExternal class="size-3.5 shrink-0 text-ink-gray-5" />
          </span>
        </a>
      </li>
      <li v-if="partner">
        <button
          type="button"
          class="-mx-2 flex w-full items-center gap-2.5 rounded-5 px-2 py-1.5 text-left hover:bg-surface-gray-1"
          @click="emit('message')"
        >
          <IconMessage class="size-4 shrink-0 text-ink-gray-6" />
          <span class="min-w-0 truncate text-p-base text-ink-gray-8">
            Ask {{ partner.name.split(' ')[0] }}
          </span>
        </button>
      </li>
      <li>
        <a
          href="#"
          class="-mx-2 flex items-center gap-2.5 rounded-5 px-2 py-1.5 hover:bg-surface-gray-1"
        >
          <IconLifeBuoy class="size-4 shrink-0 text-ink-gray-6" />
          <!-- ⚠️ The label names WHOSE problem it is, which is the one thing a
               caption under it used to do and the reason this row exists apart
               from the one above. -->
          <span class="min-w-0 text-p-base text-ink-gray-8">Contact Frappe</span>
        </a>
      </li>
      <li>
        <button
          type="button"
          class="-mx-2 flex w-full items-center gap-2.5 rounded-5 px-2 py-1.5 text-left hover:bg-surface-gray-1"
          @click="emit('feedback')"
        >
          <IconFeedback class="size-4 shrink-0 text-ink-gray-6" />
          <!-- ⚠️ "Give feedback", not "Send feedback" or "Feedback". The verb
               is the reader's rather than the product's — they are giving
               something, unasked — and a bare noun would sit in a list of four
               verbs-and-destinations reading as a section heading. -->
          <span class="min-w-0 text-p-base text-ink-gray-8">Give feedback</span>
        </button>
      </li>
    </ul>
  </section>
</template>
