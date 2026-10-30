<script setup>
import { computed } from 'vue'
import { Button, SettingsBody, SettingsHeader, dialog } from 'frappe-ui'
import { useConnectStore } from '../../stores/connect'
import { usePartnerAccountStore } from '../../stores/partnerAccount'

// Leaving removes everything: customer links, the partner code, the listing
// and open leads. Partners usually have contracts with customers, so leaving
// waits until that work is wrapped up. The list says what's left.
const store = useConnectStore()
const account = usePartnerAccountStore()

const linked = computed(() => account.customers.filter((c) => c.stage !== 'churned' && (c.linked || c.sites.length)))
const partnerPays = computed(() => account.customers.filter((c) => c.billing === 'partner'))
const running = computed(() => account.customers.filter((c) => c.source === 'connect' && c.stage === 'onboarding'))
const openLeads = computed(() => (store.partnerTier === 'beginner' ? 0 : 2))

const left = computed(() =>
  [
    linked.value.length && `${linked.value.length} customers still linked: unlink them, or they move to another partner`,
    partnerPays.value.length && `${partnerPays.value.length} customers on Partner pays: switch them back first`,
    openLeads.value && `${openLeads.value} open leads: close them with a reason`,
    running.value.length && `${running.value.length} Connect project still running`,
  ].filter(Boolean),
)

function leave() {
  dialog.danger({
    title: 'Leave the partnership?',
    message: 'Your listing comes down and your partner code stops working.',
    confirmLabel: 'Leave',
  })
}
</script>

<template>
  <SettingsHeader title="Leave the partnership" />
  <SettingsBody>
    <p class="text-p-base text-ink-gray-7">
      Leaving removes your customer links, partner code, listing and open leads.
    </p>
    <!-- Leaving waits until this is empty, so the button only shows then. -->
    <template v-if="left.length">
      <p class="mt-6 text-sm text-ink-gray-5">Still to wrap up</p>
      <ul class="mt-2 divide-y divide-outline-gray-1">
        <li v-for="item in left" :key="item" class="py-3 text-base text-ink-gray-8">{{ item }}</li>
      </ul>
    </template>
    <Button v-else class="mt-4" theme="red" label="Leave" @click="leave" />
  </SettingsBody>
</template>
