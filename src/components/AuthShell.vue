<script setup>
// The frame both auth screens sit in, and the only thing they share.
//
// ⚠️ NOT `ConnectShell`. That shell is the signed-in app — sidebar, breadcrumb,
// an account CTA in the top bar — and every one of those is either irrelevant
// on an auth screen or a link back to the screen you're already on. A page
// whose entire job is one decision gets a frame with nothing else in it.
//
// Measured off `MinimalAuthShell` in frappe-cloud-v2, which is the same screen
// one product over: 391px column, `pt-[16vh]` rather than vertical centring,
// and a `text-xl` (17px) heading. Sign-in is a small, quiet page — at anything
// larger it reads as a landing page that happens to have inputs.
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <main class="flex min-h-screen flex-col bg-surface-base px-4">
    <!-- Top-weighted, not centred. Centring puts a one-field log-in halfway
         down a tall window with nothing above it; a fixed fraction from the top
         keeps both screens starting in the same place whatever they hold. -->
    <section class="mx-auto w-full max-w-[391px] pt-[16vh]">
      <h1 class="text-xl font-semibold text-ink-gray-8">{{ title }}</h1>
      <slot />
    </section>

    <!-- The same mark as the rail on frappe.io/partners, at the same 24px, so
         the seam between the website and the app doesn't restate the brand in a
         second size. Decorative beside its own wordmark, hence `aria-hidden`. -->
    <footer class="mt-auto flex items-center justify-center gap-2 pb-10">
      <span
        class="flex size-6 items-center justify-center rounded-4 bg-gray-900 text-xs font-bold text-white"
        aria-hidden="true"
      >
        F
      </span>
      <span class="text-sm font-semibold text-ink-gray-7">Frappe</span>
    </footer>
  </main>
</template>
