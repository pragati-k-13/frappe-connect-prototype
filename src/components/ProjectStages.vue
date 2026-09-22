<script setup>
import { computed } from 'vue'
import { Progress } from 'frappe-ui'
import ProjectChecklist from './ProjectChecklist.vue'
import { stageProgress, stagesFor, visibleTasks } from '../data/project'

// Where the project has got to, and what the stage it is at wants.
//
// ⚠️ AN INDICATOR AND ONE OPEN STAGE, not five accordions. Every stage used to
// be a disclosure in a vertical spine: the current one open, the other four
// collapsed rows with a chevron that appeared on hover. Four of the five rows
// were doors nobody opens — a stage behind you holds a checklist you have
// already ticked, one ahead holds one you cannot act on yet — so the spine
// became what it was always summarising, and the stage you are at prints its
// checklist underneath with nothing to open.
//
// ⚠️ THE INDICATOR IS `Progress`, NOT A HAND-DRAWN STEPPER. What stood here was
// a flex row of ringed dots, hairline connectors and five truncated captions,
// with a `sr-only`/`not-sr-only` dance to drop the captions on a phone: about
// sixty lines reimplementing a component the design system ships. `intervals`
// with `intervalCount` set to the spine's length gives the segmented bar
// directly, and `label` plus the `hint` slot put the stage's name and its
// position on the line above it.
//
// ⚠️ WHAT THAT COSTS: the names of the OTHER stages. The old row captioned all
// five, on the argument that what is coming is worth knowing. A segmented bar
// cannot carry five labels, and the trade is worth taking — the caption row was
// five columns of about 60px on a phone, where "Implementation" alone needs 95,
// which is why it was hidden there anyway. What is coming is still on the
// button under the checklist, which names the next stage.
//
// The spine is per-service (`stagesFor`): custom work opens with two stages a
// pack never has — writing requirements and choosing a firm — because a pack
// arrives with a partner already assigned. Neither is forced into the other's
// shape.
const props = defineProps({
  project: { type: Object, required: true },
  // Whose second column is. See `ProjectChecklist`.
  otherParty: { type: String, default: 'Frappe' },
  // Facts the page knows that the data layer cannot reach — see `isTaskDone`.
  context: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['act'])

const stages = computed(() => stagesFor(props.project.service))
const progress = computed(() => stageProgress(props.project.service, props.project.stage))
const currentIndex = computed(() => progress.value?.index ?? 0)
const current = computed(() => stages.value[currentIndex.value] ?? null)

// ⚠️ THE STAGE YOU ARE AT COUNTS AS FILLED. `intervalCount` segments, and
// `Progress` fills `round(value / 100 * intervalCount)` of them — so the value
// is the current stage's ONE-BASED position, which lights the segment you are
// standing on rather than the one behind you. An empty bar on stage one would
// say the project had not started, and it has.
const percent = computed(() =>
  stages.value.length ? ((currentIndex.value + 1) / stages.value.length) * 100 : 0,
)

// ⚠️ CONDITIONAL TASKS ARE FILTERED HERE, before anything renders or counts
// them. See `visibleTasks` — the checklist is handed a stage whose `yours` is
// already the list that applies to this project.
const stageForProject = computed(() =>
  current.value ? { ...current.value, yours: visibleTasks(current.value, props.project) } : null,
)
</script>

<template>
  <section v-if="stages.length && current">
    <!-- ⚠️ NO "Progress" HEADING. `label` on the bar names the stage, which is
         the more useful of the two, and a heading saying "Progress" over a
         progress bar is the caption every generic page puts above every block. -->
    <Progress
      :value="percent"
      :label="current.label"
      :intervals="true"
      :interval-count="stages.length"
      size="md"
    >
      <!-- The count, in the slot the component keeps for it. It is not a
           repetition of the bar: the segments say how far, this says how far
           out of how many, and the second is the one you can say out loud. -->
      <template #hint>
        <span class="text-p-sm tabular-nums text-ink-gray-5">
          Step {{ currentIndex + 1 }} of {{ stages.length }}
        </span>
      </template>
    </Progress>

    <!-- ── The stage you are at ────────────────────────────────────────────
         ⚠️ NO BLURB. Every stage carried a sentence describing itself —
         "Replies come back as quotes. Approve the ones worth talking to, pass
         on the rest." — above a checklist whose first two rows are "Go through
         the replies" and "Approve at least one". The list is the description,
         and it is the version people actually read. -->
    <!-- ⚠️ ONLY WHEN THERE IS SOMETHING IN IT. "Choosing a partner" has no
         visible task until a partner is hired — the Replies list below is the
         stage — and an empty checklist block left 20px of nothing under the
         bar, which reads as a section that failed to load. -->
    <div
      v-if="stageForProject?.yours?.length || stageForProject?.expects || stageForProject?.theirs?.length"
      class="mt-5"
    >
      <ProjectChecklist
        :stage="stageForProject"
        :project="project"
        :context="context"
        :other-party="otherParty"
        @act="emit('act', $event)"
      />
    </div>
  </section>
</template>
