<script setup>
import { computed, ref, watch } from 'vue'
import { Button, Dialog, ScrollArea, TabButtons } from 'frappe-ui'
import PackScope from './PackScope.vue'

// What THIS pack covers, module by module.
//
// ⚠️ THE QUESTION THIS ANSWERS IS "IS PAYMENT RECONCILIATION IN THIS OR NOT",
// and until now the only place to find out was the pack's own page — a
// navigation away from the screen where the money is decided, from which the
// way back is the browser's Back button. A fixed scope IS the contract, so
// reading it should not cost leaving the purchase.
//
// ⚠️ ONE LIST NOW, AND IT USED TO BE THREE. The other two were what ships with
// every pack and what no pack ever covers, printed here on the argument that
// somebody comparing two packs in two visits should not have to remember that
// the exclusions did not change. That argument is backwards: the fix for a list
// that never changes is not to repeat it under every heading, it is to put it
// where it is read once. Both now sit on the recommendation screen, under the
// packs they qualify. What is left in here is the only part that differs by
// pack, which is what opening a pack's own dialog should mean.
//
// ⚠️ `PackScope` is the pack page's own component, not a summary of it. A
// shorter "key points" version was the obvious thing to build and it is the
// wrong one: a scope document paraphrased is a scope document that can disagree
// with the contract.
const props = defineProps({
  open: { type: Boolean, default: false },
  pack: { type: Object, default: null },
  // A basket: the dialog shows one pack at a time, with tabs to switch.
  // Takes precedence over `pack`.
  packs: { type: Array, default: () => [] },
  // Offer a way on to the pack's own page, `/connect/packs/:id`. Only the
  // catalogue asks for it; elsewhere the dialog is the whole of the detail.
  fullPage: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open'])

const list = computed(() => (props.packs.length ? props.packs : [props.pack].filter(Boolean)))
const current = ref(null)
// Reset on open, not on close, so the content does not swap while fading out.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) current.value = list.value[0]?.value ?? null
  },
  { immediate: true },
)
const shown = computed(() => list.value.find((p) => p.value === current.value) ?? list.value[0])
const tabs = computed(() => list.value.map((p) => ({ label: p.name, value: p.value })))
</script>

<template>
  <Dialog
    :model-value="open"
    :title="list.length > 1 ? 'Scope of work' : (shown?.name ?? 'What this covers')"
    size="3xl"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <!-- The facts line sits UNDER THE TITLE, in the header, for one pack: it
         is about the pack the title names, and below the header's 24px it read
         as the first line of the scope. With tabs it follows the tab it
         describes instead. -->
    <template v-if="list.length === 1 && shown" #title>
      <h3 class="text-2xl-semibold leading-6 text-ink-gray-8">{{ shown.name }}</h3>
      <p class="mt-1.5 text-p-base text-ink-gray-6">
        {{ shown.hours }} hours · {{ shown.validity }} to deliver
      </p>
    </template>
    <template #default>
      <!-- frappe-ui's overlay scrollbar, which fades in while scrolling and
           reserves no gutter, in place of the platform bar down the panel.
           `fc-scroll-dialog` hands it the body's height; see index.css. The
           negative margin puts the bar in the panel's side padding, and the
           viewport's padding gives the content its width back. -->
      <!-- The tabs stay put above it, like the title. -->
      <TabButtons v-if="shown && list.length > 1" v-model="current" class="mb-4 shrink-0" :options="tabs" />
      <ScrollArea v-if="shown" class="fc-scroll-dialog -mr-4" viewport-class="pr-4">
        <p v-if="list.length > 1" class="mb-5 text-p-base text-ink-gray-6">
          {{ shown.hours }} hours · {{ shown.validity }} to deliver
        </p>
        <PackScope :key="shown.value" :pack="shown" />
      </ScrollArea>
    </template>
    <template v-if="fullPage && shown" #actions>
      <div class="flex justify-end">
        <Button
          variant="subtle"
          label="View full page"
          :route="{ name: 'pack', params: { id: shown.value } }"
        >
          <template #suffix><LucideArrowRight class="size-4" /></template>
        </Button>
      </div>
    </template>
  </Dialog>
</template>
