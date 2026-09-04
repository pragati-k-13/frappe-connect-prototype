<template>
  <!-- ⚠️ `ToastProvider` must come FIRST, before the app content. vue-sonner's
       toaster is a pure subscriber: it only ever sees toasts published after it
       subscribes, and it never seeds from the existing queue. Mounted after
       `RouterView`, anything toasted from a child's `setup()` or `onMounted()`
       is published to zero subscribers and silently dropped.

       Mounted here rather than in `ConnectShell` because the marketing page
       (screen 1) has no app chrome, and one provider has to cover every screen.
       Exactly one, too — it has no dedup guard, so a second copy renders every
       toast twice. -->
  <ToastProvider />
  <RouterView />
  <DemoSwitch />
</template>

<script setup>
import { ToastProvider } from 'frappe-ui'
import DemoSwitch from './components/DemoSwitch.vue'
</script>
