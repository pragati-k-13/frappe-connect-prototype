<script setup>
// The frame both auth screens sit in, and the only thing they share.
//
// ⚠️ NOT `ConnectShell`. That shell is the signed-in app — sidebar, breadcrumb,
// an account CTA in the top bar — and every one of those is either irrelevant
// on an auth screen or a link back to the screen you're already on. A page
// whose entire job is one decision gets a frame with nothing else in it.
//
// The mark is the real one, lifted from frappe.io itself — a rounded square at
// rx 6.29/32, not the circle the sibling repo files under `providers/`. Its own
// corner radius is baked into the artwork, so no CSS rounding on the img.
//
// Measured off `MinimalAuthShell` in frappe-cloud-v2, which is the same screen
// one product over: 391px column, top-weighted rather than vertically centred,
// and a `text-xl` (17px) heading. Sign-in is a small, quiet page — at anything
// larger it reads as a landing page that happens to have inputs.
//
// ⚠️ The one number that isn't theirs is the top padding: 10vh, not their 16vh.
// Their auth screens are two fields; this flow ends on an onboarding step with
// eight, and at 16vh that one sat low enough on a laptop to push its own footer
// off the bottom. One value for all four, because a column that starts at a
// different height on each step is worse than one that starts slightly high.
import frappeMark from '../assets/frappe.svg'

defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <main class="flex min-h-screen flex-col bg-surface-base px-4">
    <!-- Top-weighted, not centred. Centring puts a one-field log-in halfway
         down a tall window with nothing above it; a fixed fraction from the top
         keeps both screens starting in the same place whatever they hold. -->
    <section class="mx-auto w-full max-w-[391px] pt-[10vh]">
      <!-- Optional, and only the onboarding step uses it. The three screens
           before it are a form and nothing else; a mark above every one of them
           would be decoration repeated four times. -->
      <slot name="mark" />
      <h1 class="text-xl font-semibold text-ink-gray-8">{{ title }}</h1>
      <slot />
    </section>

    <!-- The same mark as the rail on frappe.io/partners, at the same 24px, so
         the seam between the website and the app doesn't restate the brand in a
         second size. Decorative beside its own wordmark, hence the empty alt. -->
    <footer class="mt-auto flex items-center justify-center gap-2 pb-10">
      <img :src="frappeMark" alt="" class="size-6" />
      <span class="text-sm font-semibold text-ink-gray-7">Frappe</span>
    </footer>
  </main>
</template>
