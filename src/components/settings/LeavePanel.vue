<script setup>
import { computed, ref } from 'vue'
import { Button, SettingsBody, SettingsHeader, dialog } from 'frappe-ui'
import { useConnectStore } from '../../stores/connect'
import { usePartnerAccountStore } from '../../stores/partnerAccount'

// Leaving removes everything: customer links, the partner code, the listing
// and open leads. Partners usually have contracts with customers, so leaving
// waits until that work is wrapped up. The list says what's left.
const store = useConnectStore()
const account = usePartnerAccountStore()
const tried = ref(false)

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
  tried.value = true
  if (left.value.length) return
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
      Leaving removes your customer links, partner code, listing and open leads. Wrap up your work first.
    </p>
    <ul v-if="left.length" class="mt-4 divide-y divide-outline-gray-1">
      <li v-for="item in left" :key="item" class="flex items-start gap-3 py-3">
        <span class="lucide-circle mt-0.5 size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
        <span class="text-base text-ink-gray-8">{{ item }}</span>
      </li>
    </ul>
    <div class="mt-4 space-y-2">
      <Button theme="red" label="Leave the partnership" @click="leave" />
      <p v-if="tried && left.length" class="text-p-sm text-ink-red-7">Wrap up the items above first.</p>
    </div>
  </SettingsBody>
</template>
