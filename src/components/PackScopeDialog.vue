<script setup>
import { Button, Dialog } from 'frappe-ui'
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
defineProps({
  open: { type: Boolean, default: false },
  pack: { type: Object, default: null },
})
const emit = defineEmits(['update:open'])
</script>

<template>
  <Dialog
    :model-value="open"
    :title="pack?.name ?? 'What this covers'"
    size="3xl"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <div v-if="pack">
        <p class="text-p-base text-ink-gray-6">
          {{ pack.hours }} hours · {{ pack.validity }} to deliver
        </p>

        <div class="mt-5">
          <PackScope :pack="pack" />
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
