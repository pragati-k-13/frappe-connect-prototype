<script setup>
import { Button, toast } from 'frappe-ui'

// The partner code with a copy icon: the code alone. A business that came
// through Connect gets the how-to on its own project page; anyone else hears
// it from the partner. Used in the Customers header and its empty state.
const props = defineProps({ code: { type: String, required: true } })

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    toast.success('Code copied')
  } catch {
    toast.error('Couldn’t copy. Select the code and copy it instead.')
  }
}
</script>

<template>
  <div class="flex items-center gap-1">
    <code class="select-all rounded-4 bg-surface-gray-2 px-2.5 py-1 font-mono text-base text-ink-gray-8">{{ code }}</code>
    <Button variant="ghost" icon="lucide-copy" aria-label="Copy code" tooltip="Copy code" @click="copy" />
  </div>
</template>
