<script setup>
import { computed, ref, watch } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from 'reka-ui'
import { Button, TextInput } from 'frappe-ui'
import IconCheck from '~icons/lucide/check'
import IconCircleDashed from '~icons/lucide/circle-dashed'
import IconChevronDown from '~icons/lucide/chevron-down'
import { isTaskDone } from '../data/project'

// A Starter Pack's setup, as one list of tasks in the order they have to
// happen.
//
// ⚠️ AN ACCORDION, ONE ROW OPEN AT A TIME. Each row is its title until opened;
// the task in hand opens by itself, and opening another closes it. frappe-ui
// ships no accordion, so this is reka-ui's — the primitive frappe-ui's own
// components are built on — with `type="single"`, which is what closes the
// others.
//
// ⚠️ ANY ROW CAN BE READ, ONLY THE CURRENT ONE CAN BE DONE. Later rows open to
// show what is coming, with their button disabled: the order is real (there is
// no plan to choose before there is a login), and a button that works out of
// order would let the list say something happened that could not have.
const props = defineProps({
  tasks: { type: Array, required: true },
  project: { type: Object, required: true },
})
const emit = defineEmits(['act', 'share-url'])

const isDone = (t) => isTaskDone(t, props.project)

// The task in hand: the first one not done. -1 once all are.
const currentIndex = computed(() => props.tasks.findIndex((t) => !isDone(t)))
const currentKey = computed(() => props.tasks[currentIndex.value]?.key)

// Follows the task in hand: finishing one opens the next.
const open = ref(currentKey.value)
watch(currentKey, (key) => (open.value = key))

const url = ref(props.project.siteUrl ?? '')
const share = () => {
  if (url.value.trim()) emit('share-url', url.value)
}
</script>

<template>
  <AccordionRoot v-model="open" type="single" collapsible class="divide-y divide-outline-gray-1">
    <AccordionItem v-for="(t, i) in tasks" :key="t.key" :value="t.key" class="group">
      <AccordionHeader as="div">
        <!-- ⚠️ `items-start` and a 20px title line, with the mark and chevron
             nudged 2px down, so both sit on the FIRST line when a title wraps
             on a phone rather than centred between two. -->
        <AccordionTrigger
          class="flex w-full items-start gap-2.5 py-5 text-left group-data-[state=open]:pb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
        >
          <span
            v-if="isDone(t)"
            class="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-surface-gray-8"
            aria-hidden="true"
          >
            <IconCheck class="size-2.5 text-ink-base [stroke-width:3]" />
          </span>
          <!-- Filled for done, in the solid button's own gray-8 so the page
               keeps one dark; dashed for everything still to do. The open row
               already says which task is in hand. -->
          <IconCircleDashed v-else class="mt-0.5 size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />

          <span
            class="min-w-0 flex-1 text-base font-medium leading-5"
            :class="isDone(t) ? 'text-ink-gray-5 line-through' : 'text-ink-gray-7'"
          >
            {{ t.label }}
          </span>

          <IconChevronDown
            class="mt-0.5 size-4 shrink-0 text-ink-gray-5 motion-safe:transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </AccordionTrigger>
      </AccordionHeader>

      <AccordionContent class="fc-accordion-content overflow-hidden">
        <!-- `pl-[26px]` is the mark's 16px plus its 10px gap, so the body sits
             under the title rather than under the mark. -->
        <div class="pb-5 pl-[26px]">
          <p class="text-p-base text-ink-gray-6">{{ t.hint }}</p>

          <template v-if="!isDone(t) && t.cta">
            <form
              v-if="t.action === 'site-url'"
              class="mt-3 flex max-w-md gap-2"
              novalidate
              @submit.prevent="share"
            >
              <TextInput
                v-model="url"
                class="flex-1"
                inputmode="url"
                placeholder="northwind.frappe.cloud"
                :disabled="i !== currentIndex"
                aria-label="Site URL"
              />
              <Button
                variant="solid"
                type="submit"
                :label="t.cta"
                :disabled="i !== currentIndex || !url.trim()"
              />
            </form>
            <Button
              v-else
              class="mt-3"
              variant="solid"
              :label="t.cta"
              :disabled="i !== currentIndex"
              @click="emit('act', t)"
            />
          </template>

          <!-- The terms stay readable once agreed; nothing else has anything
               to reopen. -->
          <Button
            v-else-if="isDone(t) && t.action === 'terms'"
            class="mt-3"
            variant="subtle"
            label="View terms"
            @click="emit('act', t)"
          />
          <p v-else-if="isDone(t) && t.action === 'site-url' && project.siteUrl" class="mt-1 text-p-base text-ink-gray-8">
            {{ project.siteUrl }}
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
