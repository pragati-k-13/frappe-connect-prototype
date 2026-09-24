<script setup>
import { Button, Checkbox } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import IconCheck from '~icons/lucide/check'
import IconCircleDashed from '~icons/lucide/circle-dashed'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconCopy from '~icons/lucide/copy'
import { isTaskDone } from '../data/project'

// What the stage you are at needs from you, one row per task.
//
// ⚠️ ONE ROW SHAPE FOR EVERY TASK: a status mark, the title with its
// description 4px under it, and the control that finishes it on the right.
// The mark is a STATUS, not a control — a dashed ring ahead, a tick behind —
// with one exception. Agreeing to the terms is consent, performed here, so that
// row's mark is a real checkbox.
const props = defineProps({
  // Tasks from `data/project.js` — `{ key, label, hint?, action?, optional? }`.
  tasks: { type: Array, required: true },
  project: { type: Object, required: true },
  // Facts the page knows and the data layer cannot reach. See `isTaskDone`.
  context: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['act', 'terms'])

const isDone = (t) => isTaskDone(t, props.project, props.context)

// What the button SAYS, by the kind of help it is. Keyed on the action rather
// than written on each task, because the label describes the kind.
const ACTION_LABELS = {
  'fc-login': 'Log in',
  'fc-link': 'Link',
}
</script>

<template>
  <List divider="full">
    <ListRow v-for="t in tasks" :key="t.key" class="py-5">
      <!-- The mark sits on the title's line, not the row's middle. -->
      <ListCell class="h-4 self-start">
        <Checkbox
          v-if="t.action === 'terms' && !isDone(t)"
          :id="`task-${t.key}`"
          size="md"
          :aria-labelledby="`task-${t.key}-label`"
          :model-value="false"
          @update:model-value="emit('act', t)"
        />
        <IconCheck v-else-if="isDone(t)" class="size-4 text-ink-gray-8" aria-hidden="true" />
        <IconCircleDashed v-else class="size-4 text-ink-gray-5" aria-hidden="true" />
      </ListCell>

      <ListCell>
        <div class="min-w-0">
          <p :id="`task-${t.key}-label`" class="text-base font-medium text-ink-gray-8">
            <template v-if="t.action === 'terms'">
              Agree to
              <button
                type="button"
                class="font-medium underline underline-offset-4"
                @click="emit('terms', t)"
              >
                Terms and conditions
              </button>
              <span v-if="!isDone(t)" class="ms-1 text-ink-red-5" aria-hidden="true">*</span>
            </template>
            <template v-else>{{ t.label }}</template>
            <span v-if="t.optional" class="ms-1 font-normal text-ink-gray-5">· Optional</span>
            <span class="sr-only">{{ isDone(t) ? ', done' : ', not done yet' }}</span>
          </p>
          <p v-if="t.hint" class="mt-1 text-p-base text-ink-gray-6">{{ t.hint }}</p>
        </div>
      </ListCell>

      <!-- The control that finishes it. Hidden once done — the offer is spent. -->
      <ListCell class="justify-end">
        <template v-if="!isDone(t)">
          <Button
            v-if="t.action === 'copy-code'"
            size="sm"
            variant="ghost"
            aria-label="Copy referral code"
            @click="emit('act', t)"
          >
            <template #icon><IconCopy class="size-4" /></template>
          </Button>
          <Button
            v-else-if="ACTION_LABELS[t.action]"
            size="sm"
            variant="subtle"
            :label="ACTION_LABELS[t.action]"
            @click="emit('act', t)"
          >
            <template #suffix><IconChevronRight class="size-3.5" /></template>
          </Button>
        </template>
      </ListCell>
    </ListRow>
  </List>
</template>
