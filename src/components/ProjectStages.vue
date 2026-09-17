<script setup>
import { computed, ref, watch } from 'vue'
import ProjectChecklist from './ProjectChecklist.vue'
import IconCheck from '~icons/lucide/check'
import IconChevronDown from '~icons/lucide/chevron-down'
import { stageProgress, stagesFor } from '../data/project'

// Where the project has got to, and what each stage wants.
//
// ⚠️ ONE COMPONENT, not a progress bar plus a separate "current stage" block.
// They were two at first and it put the same stage name on the screen twice,
// six inches apart, with the bar saying "3 of 5" and the block saying "Kickoff"
// — two halves of one sentence that a reader has to assemble. The bar is the
// summary of this list, so it sits on top of it and they share a source.
//
// The spine is per-service (`stagesFor`), so a guided onboarding shows its
// three sessions and a starter pack shows its five stages. Neither is forced
// into the other's shape.
const props = defineProps({
  project: { type: Object, required: true },
  // Whose second column is. See `ProjectChecklist`.
  otherParty: { type: String, default: 'Frappe' },
})

const emit = defineEmits(['toggle', 'act'])

const stages = computed(() => stagesFor(props.project.service))
const progress = computed(() => stageProgress(props.project.service, props.project.stage))
const currentIndex = computed(() => progress.value?.index ?? 0)

// Which stage's detail is open. The current one, until the reader says
// otherwise — the stage you are at is the one you came to read.
//
// ⚠️ One at a time, accordion-style, rather than several. The open stage is
// tall (a checklist of up to six items and two columns), and two open at once
// pushes the second one's heading off the screen — at which point the list has
// stopped being a list you can scan.
const open = ref(props.project.stage)
// Following the project rather than set once: the demo switcher moves the stage
// from outside this component, and an accordion still showing the stage you
// LEFT is the page disagreeing with its own progress bar.
watch(
  () => props.project.stage,
  (stage) => (open.value = stage),
)

const toggle = (key) => (open.value = open.value === key ? null : key)

// Three states, and they are positional rather than stored: everything before
// the current index is done, everything after is still to come. Nothing has to
// remember to mark a stage complete when the project moves past it.
const stateOf = (index) =>
  index < currentIndex.value ? 'done' : index === currentIndex.value ? 'current' : 'todo'

const tallyFor = (stage) => {
  const yours = stage.yours ?? []
  if (!yours.length) return null
  return {
    done: yours.filter((t) => props.project.done.includes(t.key)).length,
    total: yours.length,
  }
}
</script>

<template>
  <section v-if="stages.length">
    <!-- ⚠️ THERE WAS AN INTERVAL BAR HERE and deleting it is the point of
         this section's second draft. Three things were rendering one fact: the
         bar, the "Step 3 of 5" beside it, and the list below — which already
         shows position, completion and what is left, with a tick on every stage
         behind you and a ring on the one you are at. The list IS the bar, drawn
         vertically and legibly. Keeping both meant a reader checking their
         progress twice to learn it once.
         (The bar also filled `surface-gray-10`, a near-black, while the stage
         badge in the page header says the same thing in blue, orange or green —
         two colour languages for one fact.) -->
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="text-base font-medium text-ink-gray-8">Progress</h2>
      <p class="shrink-0 text-p-sm text-ink-gray-5">
        Step {{ progress.step }} of {{ progress.total }}
      </p>
    </div>

    <!-- ── The stages ──────────────────────────────────────────────────── -->
    <ol class="mt-4">
      <li
        v-for="(stage, i) in stages"
        :key="stage.key"
        class="fc-stage-row group relative flex gap-3"
        :class="i === stages.length - 1 ? '' : 'pb-5'"
      >
        <!-- The connector. Same idiom as the Confirmed screen's activity feed,
             and the same trap avoided: `bg-[var(--outline-gray-2)]`, NOT
             `bg-outline-gray-2` — the `outline-*` scale is BORDER-ONLY and the
             background class compiles to nothing without erroring. See
             FRAPPE-UI-NOTES.md.

             ⚠️ It runs SOLID through completed stages and stays the same
             hairline through the rest. Colouring the travelled part would be a
             third signal for a fact the mark and the bar already carry twice. -->
        <span
          class="absolute bottom-0 left-[11px] top-6 w-px bg-[var(--outline-gray-2)] group-last:hidden"
          aria-hidden="true"
        />

        <!-- One 22px column for every mark, so the connector runs straight
             through them rather than kinking around a larger current one. -->
        <span
          class="relative z-10 mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full"
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
          <!-- The current stage's mark is a filled dot inside a ring: the ring
               is what separates "here" from the flat circles of the stages
               still to come. -->
          <span
            v-else-if="stateOf(i) === 'current'"
            class="size-2 rounded-full bg-surface-gray-7"
          />
        </span>

        <div class="min-w-0 flex-1">
          <!-- The whole row is the control, not a chevron at the end of it: a
               22px target at the far right of a 650px row is a worse thing to
               hit than the row itself, and the row has nothing else in it to
               click. -->
          <button
            type="button"
            class="flex w-full items-baseline gap-2 rounded-4 text-left"
            :aria-expanded="open === stage.key"
            @click="toggle(stage.key)"
          >
            <span
              class="text-p-base"
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

            <!-- The fraction rides on the collapsed row, so a reader scanning
                 the spine can see which stage has something outstanding
                 without opening any of them. Only where there is a checklist;
                 the onboarding's closing stage has one item and no partner
                 column, and "0 of 1 done" beside "Done" reads as a
                 contradiction. -->
            <span
              v-if="tallyFor(stage) && stateOf(i) !== 'todo'"
              class="shrink-0 text-p-sm text-ink-gray-5"
            >
              {{ tallyFor(stage).done }}/{{ tallyFor(stage).total }}
            </span>

            <span class="min-w-0 flex-1" />
            <!-- ⚠️ Revealed on hover, not standing on every row. Five chevrons
                 down the right edge — four of them on stages nobody is going to
                 open — is an affordance used as decoration, and the whole row is
                 the control anyway.

                 The hiding lives in `index.css` rather than in a Tailwind
                 variant, and inside `@media (hover: hover)`: a touch screen has
                 no hover to reveal it with, so there the chevrons simply stay.
                 It is also the one place a specificity fight was likely — a
                 `group-hover:opacity-100` has to out-order a media-query'd
                 `opacity-0`, and which wins depends on Tailwind's emit order.
                 A named rule decides it outright. -->
            <IconChevronDown
              class="fc-stage-chevron size-4 shrink-0 text-ink-gray-5 transition-all duration-150"
              :class="open === stage.key ? 'rotate-180' : ''"
              :data-open="open === stage.key"
              aria-hidden="true"
            />
          </button>

          <div v-if="open === stage.key" class="pb-1 pt-2">
            <p class="text-p-base text-ink-gray-6">{{ stage.blurb }}</p>
            <ProjectChecklist
              class="mt-4"
              :stage="stage"
              :done="project.done"
              :requested-slot="project.slot"
              :other-party="otherParty"
              :readonly="stateOf(i) !== 'current'"
              @toggle="emit('toggle', $event)"
              @act="emit('act', $event)"
            />
          </div>
        </div>
      </li>
    </ol>
  </section>
</template>
