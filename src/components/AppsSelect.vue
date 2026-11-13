<script setup>
import { computed, useAttrs } from 'vue'
import { Avatar, MultiSelect } from 'frappe-ui'
import { PROJECT_APPS } from '../data/partners'
import { appLogo } from '../data/apps'

// Which apps a project or lead is about, the same list everywhere it's asked:
// creating a project, contacting a partner, adding a lead, and correcting it
// on a lead. Attributes (label, error, variant, …) pass through to MultiSelect.
defineOptions({ inheritAttrs: false })
const model = defineModel({ type: Array, default: () => [] })
const options = PROJECT_APPS.map((a) => ({ label: a.label, value: a.value }))
// `variant="ghost"` (a side panel row) sits flat until hovered, as Select does.
const attrs = useAttrs()
const ghost = computed(() => attrs.variant === 'ghost')
</script>

<template>
  <!-- No search for nine apps, and no "Select All": every app at once isn't
       a real answer. -->
  <MultiSelect v-model="model" v-bind="$attrs" :options="options" hide-search>
    <!-- Each app's own mark; one without artwork gets Avatar's initial. -->
    <template #item-prefix="{ item }">
      <Avatar size="xs" shape="square" :image="appLogo(item.value) ?? undefined" :label="item.label" />
    </template>
    <template #footer />
    <!-- The picks by name, not "2 selected": the answer should be readable
         without opening the list. -->
    <template #trigger="{ open, selectedOptions, setOpen }">
      <button
        type="button"
        :data-state="open ? 'open' : 'closed'"
        :aria-label="$attrs['aria-label'] ?? $attrs.label"
        class="flex h-7 w-full cursor-pointer items-center justify-between gap-2 rounded-4 px-2 text-left text-base transition-colors hover:bg-surface-gray-3 data-[state=open]:focus-ring"
        :class="ghost ? 'bg-transparent' : 'bg-surface-gray-2'"
        @click="setOpen(!open)"
      >
        <span class="truncate" :class="selectedOptions.length ? 'text-ink-gray-8' : 'text-ink-gray-4'">
          {{ selectedOptions.length ? selectedOptions.map((o) => o.label).join(', ') : ($attrs.placeholder ?? 'Select') }}
        </span>
        <!-- The chevron takes the text's color, as Select's does. -->
        <span
          class="lucide-chevron-down size-4 shrink-0"
          :class="selectedOptions.length ? 'text-ink-gray-8' : 'text-ink-gray-4'"
          aria-hidden="true"
        />
      </button>
    </template>
  </MultiSelect>
</template>
