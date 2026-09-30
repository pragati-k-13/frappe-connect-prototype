<script setup>
import { computed } from 'vue'
import { Button, Dialog } from 'frappe-ui'
import PartnerCriteriaFields from './PartnerCriteriaFields.vue'
import { useConnectStore } from '../stores/connect'

// Narrowing who a brief reaches.
//
// ⚠️ A DIALOG, because these are a DETOUR. They were a section of the
// recommendation screen — ten chips under three sub-headings, sitting above the
// send button and below two questions that had not been answered yet — which
// made a screen with one thing to do look like a screen with fifteen, and
// offered to refine a search before the thing being searched for was written.
//
// ⚠️ IT WRITES STRAIGHT TO THE STORE — or, given a draft project's `brief`,
// reports each change as `patch` for the draft to keep — with no Apply. There is
// nothing to commit: every toggle is reversible, the count at the top moves
// with it, and the screen behind shows the same number. An Apply button would
// only introduce a state where the dialog and the page disagree.
const props = defineProps({
  open: { type: Boolean, default: false },
  // Someone else's requirements and answers — a draft project's. Changes are
  // then reported as `patch` instead of written to the account's.
  brief: { type: Object, default: null },
  answers: { type: Object, default: null },
})
const emit = defineEmits(['update:open', 'patch'])

const store = useConnectStore()
const brief = computed(() => props.brief ?? store.brief)
// A draft's brief reports up; the account's is written here.
const save = (patch) => (props.brief ? emit('patch', patch) : store.saveBrief(patch))

const clear = () => save({ cities: [], tiers: [], workStyle: '', timeline: '' })

const count = computed(
  () =>
    brief.value.cities.length +
    brief.value.tiers.length +
    (brief.value.workStyle ? 1 : 0) +
    (brief.value.timeline ? 1 : 0),
)
</script>

<template>
  <Dialog
    :model-value="open"
    title="Edit criteria"
    @update:model-value="emit('update:open', $event)"
  >
    <template #default>
      <PartnerCriteriaFields :brief="brief" :answers="answers" @patch="save" />

      <div class="mt-4 flex items-center gap-2">
        <Button variant="solid" label="Done" @click="emit('update:open', false)" />
        <Button v-if="count" variant="ghost" label="Clear" @click="clear" />
      </div>
    </template>
  </Dialog>
</template>
