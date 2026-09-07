<script setup>
import { Button, Dialog } from 'frappe-ui'
import { DialogDescription } from 'reka-ui'
import PackScope from './PackScope.vue'
import { useConnectStore } from '../stores/connect'

// A Starter Pack's detail, over the catalogue.
//
// A dialog rather than a route of its own: you're choosing BETWEEN four packs,
// and a dialog keeps the other three one dismissal away instead of one back
// navigation. The pack still travels in the URL (`?pack=`), so the detail is
// linkable and Back closes it — see `PacksPage`.
const props = defineProps({
  pack: { type: Object, default: null },
  region: { type: String, required: true },
})
const emit = defineEmits(['close'])

const store = useConnectStore()

// ⚠️ THE SEAM. Booking is: pick a pack → sign in → answer the onboarding
// questions → meet the partner Frappe assigns you → pay. Only the first step of
// that gate exists, so this opens the login prompt when signed out and does
// nothing when signed in. Wire the rest here.
const start = () => store.requireLogin()
</script>

<template>
  <Dialog
    :model-value="Boolean(pack)"
    :title="pack?.name"
    size="3xl"
    @update:model-value="!$event && emit('close')"
  >
    <!-- Default slot, not `#body-content` — this version of frappe-ui's Dialog
         exposes only `default`, `title` and `actions`, and the older name fails
         silently. Same trap as `BookSlotDialog`. -->
    <template #default>
      <DialogDescription as-child>
        <p class="text-p-base text-ink-gray-6">{{ pack?.modules }}</p>
      </DialogDescription>

      <div v-if="pack" class="mt-5">
        <PackScope :pack="pack" :region="region" />
      </div>
    </template>

    <template #actions>
      <div class="flex justify-end gap-2">
        <Button variant="ghost" label="Close" @click="emit('close')" />
        <Button variant="solid" label="Get started" @click="start">
          <template #suffix><LucideArrowRight class="size-4" /></template>
        </Button>
      </div>
    </template>
  </Dialog>
</template>
