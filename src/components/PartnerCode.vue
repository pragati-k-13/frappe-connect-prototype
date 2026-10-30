<script setup>
import { Button, toast } from 'frappe-ui'

// The partner code with Copy and Share. One component because it appears on
// Partnership now and on Customers later (see the plan), and both must match.
//
// Share copies a short message with the code and Frappe's own how-to, rather
// than steps written here that could drift from Frappe Cloud's screens.
const props = defineProps({
  code: { type: String, required: true },
  firm: { type: String, required: true },
})

const HOW_TO =
  'https://docs.frappe.io/partner-guide/frequently-asked-questions/how-to-link-partner-code-to-customer-account'

async function copy(text, done) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(done)
  } catch {
    toast.error('Couldn’t copy. Select the code and copy it instead.')
  }
}
const copyCode = () => copy(props.code, 'Code copied')
const share = () =>
  copy(
    `To link your Frappe Cloud account with ${props.firm}, enter our partner code ${props.code} in Frappe Cloud. How: ${HOW_TO}`,
    'Message copied',
  )
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <code class="rounded-4 bg-surface-gray-2 px-3 py-1.5 font-mono text-base text-ink-gray-8">
      {{ code }}
    </code>
    <Button icon="lucide-copy" aria-label="Copy code" tooltip="Copy code" @click="copyCode" />
    <Button label="Share" @click="share" />
  </div>
</template>
