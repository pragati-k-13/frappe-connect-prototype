<script setup>
import { computed } from 'vue'
import { Button } from 'frappe-ui'
import IconCheck from '~icons/lucide/check'
import IconArrowRight from '~icons/lucide/arrow-right'
import { isTaskDone } from '../data/project'

// What this stage needs, split by who owes it and by what can be KNOWN.
//
// ⚠️ NOTHING HERE IS TICKED BY HAND, and that is the change. Every row used to
// be a `Checkbox` the customer set themselves — eighteen of them across the
// spine — on the reasoning that it was their own record and a record you cannot
// correct is worse than one you can. The reasoning was wrong in one place and
// it is the place that matters: a tracker whose state is typed in by the person
// being tracked is not tracking anything. It can say a project is finished with
// nothing done.
//
// So a task is now something the product can SEE — a message sent, a dialog
// confirmed, a code taken, a brief broadcast — and the mark beside it is a
// STATUS, not a control. Everything the product cannot see stopped being a task
// and became the stage's one line of `expects`. See the note on `task` in
// `data/project.js`.
//
// ⚠️ THREE KINDS, AND THEY MUST NOT LOOK ALIKE. Tasks carry a mark and, where
// there is one, the control that finishes them. `expects` and the partner's
// work are both prose, because prose cannot be mistaken for a checklist at any
// size — which was already the fix for the partner's half when it was drawn as
// a column of empty rings and read as three more boxes the customer had failed
// to tick.
const props = defineProps({
  // A stage from `data/project.js` — `{ yours, expects, theirs }`.
  stage: { type: Object, required: true },
  // The project, for tasks whose done-ness is derived rather than recorded.
  project: { type: Object, required: true },
  // Facts the page knows and the data layer cannot reach. See `isTaskDone`.
  context: { type: Object, default: () => ({}) },
  // Who the sentence is about. The partner's first name once there is one, and
  // "Frappe" before that — custom work spends two stages being matched, and
  // during them the other side of the table really is Frappe rather than a
  // firm nobody has picked yet.
  otherParty: { type: String, default: 'Frappe' },
})

const emit = defineEmits(['act'])

const isDone = (t) => isTaskDone(t, props.project, props.context)

// What the help button SAYS, by the kind of help it is.
//
// ⚠️ Keyed on the action rather than written on each task, because the label
// describes the KIND and the kinds are few. A task may still override with
// `actionLabel` where its own wording is better.
//
// "Do this" was the first version and it was the button admitting it did not
// know: a control whose label is a pronoun makes the reader press it to find
// out where it goes.
const ACTION_LABELS = {
  message: 'Message',
  scope: 'View scope',
  partners: 'Browse partners',
  packs: 'See the packs',
  hosting: 'Get the code',
  brief: 'Open requirements',
  feedback: 'Rate them',
}

// ⚠️ THE STAGES WHERE FRAPPE CONNECT KNOWS NOTHING, said out loud.
//
// These two are the weeks the partner is actually building, and this product
// does not track what happens inside them: there is no task list a partner
// updates, no percentage, no per-module state. That is a decision rather than a
// gap — partners are unreliable about maintaining that kind of record, and a
// progress bar nobody moves is read as nothing having happened.
const LINE = 'Frappe does not track your partner’s progress — your calls with them do.'
const UNTRACKED = { implementation: LINE, build: LINE }

const notice = computed(() => UNTRACKED[props.stage.key] || null)

// "1 of 2 done" — and it counts ONLY your side. The partner's column has no
// completion state to read, so including it would make the fraction a guess.
const tally = computed(() => {
  const yours = props.stage.yours ?? []
  return { done: yours.filter(isDone).length, total: yours.length }
})

// "Tridots is installing ERPNext on Frappe Cloud, setting up standard user
// roles, and running your data import session."
//
// An Oxford list, assembled here rather than stored as a sentence, so the stage
// data stays a list of facts and only the rendering knows about commas. Every
// fragment is lower-case and completes "X is ___" — see `data/project.js`.
const theirWork = computed(() => {
  const parts = props.stage.theirs ?? []
  if (!parts.length) return null
  if (parts.length === 1) return `${props.otherParty} is ${parts[0]}.`
  return `${props.otherParty} is ${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}.`
})

defineExpose({ tally })
</script>
<template>
  <div class="space-y-5">
    <!-- ⚠️ ABOVE the checklist, not below it, and in the same grey as the
         partner's sentence. Read after the tasks it would sound like an excuse
         for a short list; read before them it explains why the list is short.
         See `UNTRACKED`. -->
    <p v-if="notice" class="text-p-base leading-relaxed text-ink-gray-6">{{ notice }}</p>

    <!-- ── Yours ───────────────────────────────────────────────────────── -->
    <section v-if="stage.yours?.length">
      <div class="flex items-baseline justify-between gap-3">
        <h4 class="text-p-sm font-medium text-ink-gray-7">Needed from you</h4>
        <span class="shrink-0 text-p-sm text-ink-gray-5">
          {{ tally.done }} of {{ tally.total }} done
        </span>
      </div>

      <ul class="mt-2 space-y-2.5">
        <!-- ⚠️ Stacks below `sm`. Side by side on a phone, the button held its
             width and squeezed the label into three lines of two words, which
             is the row's most important text losing to its least. -->
        <li
          v-for="t in stage.yours"
          :key="t.key"
          class="flex flex-col items-start gap-1.5 sm:flex-row sm:gap-3"
        >
          <div class="flex min-w-0 flex-1 gap-2">
            <!-- ⚠️ A MARK, NOT A CONTROL — no input, no label element, nothing
                 to press. It was a `Checkbox` and the whole point of this pass
                 is that it no longer is: the state is the product's answer, not
                 the customer's claim. Same 14px box and 22px text offset so the
                 rows sit where they always did.
                 A filled tick behind you, an empty box ahead: the difference in
                 FILL rather than in shape, so a row that is waiting still reads
                 as a row rather than as a gap. -->
            <span
              class="mt-[3px] grid size-3.5 shrink-0 place-items-center rounded-[3px]"
              :class="
                isDone(t)
                  ? 'bg-surface-gray-7 text-ink-white'
                  : 'border border-[var(--outline-gray-3)]'
              "
              aria-hidden="true"
            >
              <IconCheck v-if="isDone(t)" class="size-2.5" />
            </span>
            <div class="min-w-0">
              <p class="text-base" :class="isDone(t) ? 'text-ink-gray-5' : 'text-ink-gray-7'">
                {{ t.label }}
                <span class="sr-only">{{ isDone(t) ? ' — done' : ' — not done yet' }}</span>
              </p>
              <p v-if="t.hint && !isDone(t)" class="mt-0.5 text-p-sm text-ink-gray-5">
                {{ t.hint }}
              </p>
            </div>
          </div>

          <!-- The control that FINISHES it, which is now the only way it gets
               finished. Hidden once done — the offer is spent. -->
          <Button
            v-if="t.action && !isDone(t)"
            class="ms-[22px] shrink-0 sm:ms-0"
            variant="subtle"
            size="sm"
            :label="t.actionLabel ?? ACTION_LABELS[t.action] ?? 'Open'"
            @click="emit('act', t)"
          >
            <template #suffix><IconArrowRight class="size-3.5" /></template>
          </Button>
        </li>
      </ul>
    </section>

    <!-- ── What the stage wants that nobody here can see ────────────────── -->
    <!-- ⚠️ PROSE, AND THAT IS THE POINT. These were checkboxes — have your data
         ready, keep strictly to the scope, nominate a champion — and not one of
         them was knowable to this screen, so every tick was a claim. As a
         sentence they say the same thing and promise nothing. -->
    <p v-if="stage.expects" class="text-p-base leading-relaxed text-ink-gray-6">
      Yours away from here: {{ stage.expects }}
    </p>

    <!-- ── Theirs ──────────────────────────────────────────────────────── -->
    <!-- ⚠️ Rendered only when there is something in it. The custom spine's
         first stage has no other side — you are writing requirements and
         nobody has seen them yet — and a sentence claiming activity that has
         not started is worse than silence. -->
    <p v-if="theirWork" class="text-p-base text-ink-gray-6">{{ theirWork }}</p>
  </div>
</template>
