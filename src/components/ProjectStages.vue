<script setup>
import { computed } from 'vue'
import ProjectChecklist from './ProjectChecklist.vue'
import IconCheck from '~icons/lucide/check'
import { stageProgress, stagesFor } from '../data/project'

// Where the project has got to, and what the stage it is at wants.
//
// ⚠️ AN INDICATOR AND ONE OPEN STAGE, not five accordions. Every stage used to
// be a disclosure in a vertical spine: the current one open, the other four
// collapsed rows with a chevron that appeared on hover. It cost more than it
// returned.
//
// Four of the five rows were doors nobody opens. A stage behind you holds a
// checklist you have already ticked, rendered read-only; a stage ahead holds
// one you cannot act on yet. The reader's question on this page is "where am I
// and what do I owe", and the answer to the first half was spread down 300px of
// rows whose only job was to say "not this one".
//
// So the spine became what it was always summarising — a progress indicator,
// horizontal, five marks and their names — and the stage you are at prints its
// blurb and checklist underneath, with nothing to open.
//
// ⚠️ WHAT THAT GIVES UP: a past or future stage's detail is no longer readable
// here. That is the trade, and it is why the indicator still names every stage
// rather than only counting them — what is coming is worth knowing; the ticks
// inside a finished stage are not.
//
// The spine is per-service (`stagesFor`): custom work opens with two stages a
// pack never has — writing requirements and choosing a firm — because a pack
// arrives with a partner already assigned. Neither is forced into the other's
// shape.
const props = defineProps({
  project: { type: Object, required: true },
  // Whose second column is. See `ProjectChecklist`.
  otherParty: { type: String, default: 'Frappe' },
})

const emit = defineEmits(['toggle', 'act'])

const stages = computed(() => stagesFor(props.project.service))
const progress = computed(() => stageProgress(props.project.service, props.project.stage))
const currentIndex = computed(() => progress.value?.index ?? 0)
const current = computed(() => stages.value[currentIndex.value] ?? null)

// Three states, and they are positional rather than stored: everything before
// the current index is done, everything after is still to come. Nothing has to
// remember to mark a stage complete when the project moves past it.
const stateOf = (index) =>
  index < currentIndex.value ? 'done' : index === currentIndex.value ? 'current' : 'todo'
</script>

<template>
  <section v-if="stages.length && current">
    <h2 class="text-base font-medium text-ink-gray-8">Progress</h2>

    <!-- ── The indicator ───────────────────────────────────────────────────
         ⚠️ NO "Step 1 of 5" beside the heading any more. Five marks with one
         of them ringed IS the count, and the sentence was the third rendering
         of a fact this section has twice been caught printing more than once —
         the draft before last deleted an interval bar for the same reason.

         Every column is `flex-1`, so the marks are evenly spaced and the
         connector between two of them can be a line from this mark's centre to
         the next one's. The first and last marks sit half a column in from the
         edges, which is what makes the row read as a scale rather than as a
         rule with dots on it. -->
    <ol class="mt-5 flex">
      <li
        v-for="(stage, i) in stages"
        :key="stage.key"
        class="relative flex min-w-0 flex-1 flex-col items-center"
      >
        <!-- Same trap as the activity feed's connector: `bg-[var(--outline-gray-2)]`,
             NOT `bg-outline-gray-2` — the `outline-*` scale is BORDER-ONLY and
             the background class compiles to nothing without erroring. See
             FRAPPE-UI-NOTES.md.

             ⚠️ One hairline the whole way, not a coloured run behind the
             stages already travelled. The marks say what is done; colouring
             the line would be a second voice saying it. -->
        <span
          v-if="i < stages.length - 1"
          class="absolute left-1/2 top-[11px] h-px w-full bg-[var(--outline-gray-2)]"
          aria-hidden="true"
        />

        <!-- The three marks are unchanged from the vertical spine: a tick
             behind you, a filled dot inside a ring where you are, a flat
             circle ahead. The ring is what separates "here" from "coming". -->
        <span
          class="relative z-10 grid size-[22px] shrink-0 place-items-center rounded-full"
          :class="
            {
              done: 'bg-surface-gray-7 text-ink-white',
              current: 'bg-surface-gray-2 ring-2 ring-outline-gray-3',
              todo: 'bg-surface-gray-2',
            }[stateOf(i)]
          "
          aria-hidden="true"
        >
          <IconCheck v-if="stateOf(i) === 'done'" class="size-3" />
          <span v-else-if="stateOf(i) === 'current'" class="size-2 rounded-full bg-surface-gray-7" />
        </span>

        <!-- ⚠️ Hidden below `sm`, where five names across a phone would be five
             columns of about 60px — "Implementation" alone needs 95. The
             current stage is named under the indicator there instead, so the
             marks still have something to be about. `sr-only` rather than
             `hidden`, so the list a screen reader hears is the same list at
             every width. -->
        <span
          class="sr-only mt-2 max-w-full truncate px-1 text-center text-p-sm sm:not-sr-only"
          :class="
            stateOf(i) === 'current'
              ? 'font-medium text-ink-gray-8'
              : stateOf(i) === 'done'
                ? 'text-ink-gray-7'
                : 'text-ink-gray-5'
          "
        >
          {{ stage.label }}
        </span>
      </li>
    </ol>

    <!-- ── The stage you are at ────────────────────────────────────────────
         ⚠️ It does NOT repeat the stage's name above `sm`: the indicator has
         just said it, in the one mark that is ringed, and the same name twice
         six inches apart was the exact fault that merged this component's two
         halves in the first place. Below `sm` the indicator's labels are gone,
         so the name appears here and nowhere else. -->
    <div class="mt-6">
      <p class="text-base font-medium text-ink-gray-8 sm:hidden">{{ current.label }}</p>
      <!-- `mt-1` only below `sm`, where the name line above it exists. -->
      <p class="mt-1 text-p-base text-ink-gray-6 sm:mt-0">{{ current.blurb }}</p>

      <!-- Never read-only now. The only checklist rendered is the current
           stage's, and that is the one you can act on — the `readonly` case
           existed for the four stages this section no longer opens. -->
      <ProjectChecklist
        class="mt-4"
        :stage="current"
        :done="project.done"

        :other-party="otherParty"
        @toggle="emit('toggle', $event)"
        @act="emit('act', $event)"
      />
    </div>
  </section>
</template>
