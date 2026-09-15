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
  <!-- ⚠️ Mounted at the ROOT, like the toaster above and for a related reason:
       the company questions appear over whatever screen the auth gate
       interrupted — the listing, a profile, the pack catalogue, the confirm
       screen — so they cannot belong to any one page. It renders nothing until
       `store.companyPrompt` is set; see `hasErrand` for which sign-ups get the
       dialog and which get the full screen. -->
  <CompanySignupDialog />
  <DemoSwitch />
</template>

<script setup>
import { ToastProvider } from 'frappe-ui'
import CompanySignupDialog from './components/CompanySignupDialog.vue'
import DemoSwitch from './components/DemoSwitch.vue'
</script>
