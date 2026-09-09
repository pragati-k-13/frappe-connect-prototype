<script setup>
// The frame both auth screens sit in, and the only thing they share.
//
// ⚠️ NOT `ConnectShell`. That shell is the signed-in app — sidebar, breadcrumb,
// an account CTA in the top bar — and every one of those is either irrelevant
// on an auth screen or a link back to the screen you're already on. A page
// whose entire job is one decision gets a frame with nothing else in it.
//
// The mark at the foot is the only chrome. It says whose sign-in page this is,
// which is the one thing a page with no navigation still has to answer.
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface-base">
    <!-- `flex-1` + `items-center` centres the form in whatever height is left
         after the footer, so the two screens — three fields and one — sit at
         the same optical height rather than one riding higher than the other. -->
    <main class="flex flex-1 items-center justify-center px-6 py-16">
      <!-- 400px: wide enough that "United Arab Emirates" doesn't truncate in
           the country menu, narrow enough that a three-field form still reads
           as one column rather than a page. -->
      <div class="w-full max-w-[400px]">
        <h1 class="text-4xl font-semibold text-ink-gray-8">{{ title }}</h1>
        <slot />
      </div>
    </main>

    <!-- The same mark as the rail on frappe.io/partners, at the same 24px, so
         the seam between the website and the app doesn't restate the brand in a
         second size. Decorative beside its own wordmark, hence `aria-hidden`. -->
    <footer class="flex items-center justify-center gap-2 pb-10">
      <span
        class="flex size-6 items-center justify-center rounded-4 bg-gray-900 text-xs font-bold text-white"
        aria-hidden="true"
      >
        F
      </span>
      <span class="text-lg font-medium text-ink-gray-7">Frappe</span>
    </footer>
  </div>
</template>
