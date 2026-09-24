<script setup>
import { computed, ref, watch } from 'vue'
import { Button, Dialog, TabButtons } from 'frappe-ui'
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
    <template #default>
      <div v-if="shown">
        <TabButtons v-if="list.length > 1" v-model="current" class="mb-4" :options="tabs" />
        <p class="text-p-base text-ink-gray-6">
          {{ shown.hours }} hours · {{ shown.validity }} to deliver
        </p>

        <div class="mt-5">
          <PackScope :key="shown.value" :pack="shown" />
        </div>

        <!-- ⚠️ "Open the full pack page" WAS HERE AND ITS REASON HAS GONE. It
             existed for the reader who wanted the terms as well, which lived on
             that page and not in here. The terms are on the recommendation
             screen now and the pack page has been stripped to the scope, the
             price and a basket button, so the link offered a second copy of
             what this dialog is already showing, one navigation away from the
             purchase it was built to keep you inside. The page is still there
             and the catalogue still links to it, which is the right door for
             reading a pack on its own. -->
        <div class="mt-6">
          <Button variant="solid" label="Done" @click="emit('update:open', false)" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
