<script setup>
import { computed } from 'vue'
import { Button } from 'frappe-ui'
import { FRAPPE_CLOUD_DOCS_URL } from '../data/project'
import IconCopy from '~icons/lucide/copy'
import IconExternal from '~icons/lucide/arrow-up-right'
import IconCheck from '~icons/lucide/check'
import IconHelp from '~icons/lucide/circle-help'

// Custom work once a partner is hired: the project's three moments on one
// line — hired, built, live — with the one optional thing to do hanging off
// the middle.
//
// ⚠️ A PATH, NOT A CHECKLIST. While the partner builds there is almost
// nothing for the business to do, and three optional hosting rows made that
// look like work. The path says where the project is and how it ends: the
// partner marks it live, the business confirms. That confirmation used to be
// a banner that appeared out of nowhere at the end; it is the last step here,
// visible from the day you hire.
//
// ⚠️ ONE LINE A STEP: a sentence on the left, its date on the right. No
// subtext under steps.
//
// ⚠️ THE HOSTING TASKS ARE ONE. Logging in to Frappe Cloud and copying the
// code are steps toward linking, and all three happen on Frappe Cloud, where
// this product can't see which you've done. So it's one optional task with
// the code beside it, and it doesn't say your site is on Frappe Cloud:
// hosting is the business's choice (see the hire terms).
const props = defineProps({
  project: { type: Object, required: true },
  partner: { type: Object, required: true },
  code: { type: String, default: '' },
})
const emit = defineEmits(['setup', 'copy', 'confirm', 'not-yet'])

const fmt = (ms) => (ms ? new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')
const name = computed(() => props.partner.name)
const done = computed(() => !!props.project.completedAt)
// Built once it's marked live — and still built after it's confirmed, when
// the store clears `liveAt`.
const built = computed(() => !!props.project.liveAt || done.value)
const builtAt = computed(() => props.project.liveAt ?? props.project.completedAt)
const live = computed(() => !!props.project.liveAt && !done.value)

// Each step: `state` is done / now / next; `text` the title; `sub` the line
// under it; `date` on the right.
const steps = computed(() => [
  {
    key: 'hired',
    state: 'done',
    text: `You hired ${name.value}`,
    sub: `Terms agreed. You pay ${name.value} directly`,
    date: fmt(props.project.termsAt),
  },
  {
    key: 'build',
    state: built.value ? 'done' : 'now',
    // Generic: the header says who's building it.
    text: built.value ? 'Implementation complete' : 'Implementation ongoing',
    // While there's still a site to set up, the line is the hosting task.
    sub: done.value ? `By ${name.value}` : `Let ${name.value} manage your hosting`,
    hosting: !done.value,
    date: built.value ? fmt(builtAt.value) : '',
  },
  {
    key: 'live',
    state: done.value ? 'done' : live.value ? 'now' : 'next',
    text: done.value ? 'Live' : live.value ? `${name.value} marked it live` : 'Going live',
    sub: done.value
      ? 'You confirmed it’s working'
      : live.value
        ? 'Check your site, then confirm it’s working'
        : `You confirm once ${name.value} marks it live`,
    date: done.value ? fmt(props.project.completedAt) : live.value ? fmt(props.project.liveAt) : '',
  },
])
</script>

<template>
  <!-- `pr-6`: the dates and "Optional" end where the Message button’s text
       does in the card above (16px padding plus the ghost button’s 8px). -->
  <ol class="pl-4 pr-6">
    <li v-for="(s, i) in steps" :key="s.key" class="relative pb-14 pl-13 last:pb-0">
      <!-- The line to the next step, from under this marker. -->
      <span
        v-if="i < steps.length - 1"
        class="absolute bottom-1.5 left-5 top-7.5 w-px bg-surface-gray-5"
        aria-hidden="true"
      />
      <!-- ⚠️ THE MARKERS SIT IN A 40px COLUMN UNDER THE PARTNER'S LOGO, so the
           step text starts where the partner's name does (`px-4` matches the
           card's padding; 40px column + 12px gap = `pl-13`).
           Done: a dark green 20px disc with a bold white check, the check small inside it. Now: a plain
           mid-gray dot. Next: a faint ring. -->
      <span class="absolute left-2.5 top-px grid size-5 place-items-center" aria-hidden="true">
        <span v-if="s.state === 'done'" class="grid size-5 place-items-center rounded-full bg-surface-green-8 text-white">
          <IconCheck class="size-3 stroke-[3]" />
        </span>
        <span v-else-if="s.state === 'now'" class="size-2 rounded-full bg-surface-gray-8" />
        <span v-else class="size-2 rounded-full ring-1 ring-inset ring-outline-gray-6" />
      </span>
      <span class="sr-only">{{ s.state === 'done' ? 'Done:' : s.state === 'now' ? 'Now:' : 'Next:' }}</span>

      <div class="flex items-baseline justify-between gap-4">
        <!-- Every step the same: 15px (`text-md`), semibold, gray-7. The
             marker says which one is now. -->
        <p class="text-pretty text-md font-semibold text-ink-gray-7">
          {{ s.text }}
        </p>
        <span v-if="s.date" class="shrink-0 text-sm text-ink-gray-5">{{ s.date }}</span>
      </div>
      <!-- The line under every step: `text-p-base`, gray-6, 4px below. On the
           build step, while there's a site to set up, it's the hosting task,
           marked Optional at the right. -->
      <div class="mt-1 flex items-baseline justify-between gap-4">
        <p class="text-pretty text-p-base text-ink-gray-6">{{ s.sub }}</p>
        <span v-if="s.hosting" class="shrink-0 text-sm text-ink-gray-5">Optional</span>
      </div>

      <!-- The hosting task's actions: Copy code (the toast shows the code),
           Set up (opens Frappe Cloud) and the docs.
           ⚠️ COPY CODE IS SOLID WHILE THEY BUILD — the one thing the page
           offers then — and steps down to subtle once the live step has its
           own solid answer, so there's never two. -->
      <div v-if="s.hosting" class="mt-3 flex flex-wrap gap-2">
        <Button
          :variant="live ? 'subtle' : 'solid'"
          label="Copy code"
          :aria-label="`Copy partner code ${code}`"
          @click="emit('copy')"
        >
          <template #prefix><IconCopy class="size-4" /></template>
        </Button>
        <Button label="Set up" @click="emit('setup')">
          <template #suffix><IconExternal class="size-4" /></template>
        </Button>
        <Button label="Docs" :href="FRAPPE_CLOUD_DOCS_URL" target="_blank">
          <template #prefix><IconHelp class="size-4" /></template>
        </Button>
      </div>

      <!-- Marked live: the business's answer. The one solid button on the
           page, and only now. -->
      <div v-if="s.key === 'live' && s.state === 'now'" class="mt-3 flex gap-2">
        <Button variant="solid" label="Yes, it’s live" @click="emit('confirm')" />
        <Button label="Not yet" @click="emit('not-yet')" />
      </div>
    </li>
  </ol>
</template>
