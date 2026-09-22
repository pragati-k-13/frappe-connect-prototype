<script setup>
import { computed } from 'vue'
import { Button, Checkbox } from 'frappe-ui'
import IconArrowRight from '~icons/lucide/arrow-right'

// What this stage needs, split by who owes it.
//
// ⚠️ A CHECKLIST AND A SENTENCE, not two lists, and the difference in KIND is
// the whole design. Your side is checkboxes: you did them, you record them, and
// you can untick one you recorded wrongly. The partner's side is a line of
// prose, because it is context rather than work you can act on.
//
// It was two parallel lists first — a checkbox on your side, an open ring on
// theirs. At 14px an empty circle beside an empty square does not read as a
// different KIND of thing: the partner's work scanned as three more boxes YOU
// had left unticked, which is the opposite of the point. Prose cannot be
// mistaken for a checklist at any size, and it needs no "Tridots is doing"
// heading above it either, since a sentence names its own subject. Two
// problems, one fix.
//
// The partner's half exists at all because most of a project is spent WAITING,
// and a stage showing "0 of 0 done" and nothing else reads as a screen that has
// stopped working.
const props = defineProps({
  // A stage from `data/project.js` — `{ yours, theirs, ... }`.
  stage: { type: Object, required: true },
  // Task keys already ticked, flat across the whole spine.
  done: { type: Array, default: () => [] },
  // Who the sentence is about. The partner's first name once there is one, and
  // "Frappe" before that — custom work spends two stages being matched, and
  // during them the other side of the table really is Frappe rather than a
  // firm nobody has picked yet.
  otherParty: { type: String, default: 'Frappe' },
  // Past stages render their checklist for reference but nothing is tickable:
  // the stage is over, and offering to change its record invites a click that
  // means nothing.
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'act'])

const isDone = (key) => props.done.includes(key)

// What the help button SAYS, by the kind of help it is.
//
// ⚠️ Keyed on the action rather than written on each task, because the label
// describes the KIND and the kinds are few — every `book-slot` task in every
// spine opens the same dialog, and three tasks spelling that out three times is
// three chances for one of them to say something else. A task may still
// override with `actionLabel` where its own wording is better.
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
  terms: 'Read the terms',
  feedback: 'Rate them',
}

// ⚠️ THE STAGES WHERE FRAPPE CONNECT KNOWS NOTHING, said out loud.
//
// These two are the weeks the partner is actually building, and this product
// does not track what happens inside them: there is no task list a partner
// updates, no percentage, no per-module state. That is a decision rather than a
// gap — partners are unreliable about maintaining that kind of record, and a
// progress bar nobody moves is read as nothing having happened.
//
// So the stage says where progress really lives. The alternative was an empty
// stage that looks broken, or an invented milestone list that looks informed
// and isn't, and a product that admits the limit is more trustworthy than one
// that papers over it with a spinner.
const LINE = 'Frappe does not track your partner’s progress — your calls with them do.'
const UNTRACKED = { implementation: LINE, build: LINE }

// ⚠️ A SECOND KIND OF NOTICE used to be passed in here — a line the page set
// when every task in a stage was blocked on somebody else. It was only ever
// used by "Choosing a partner", whose tasks are gone; the Replies list says it
// now, in the section it is about. What is left is the fact about the STAGE.
const notice = computed(() => UNTRACKED[props.stage.key] || null)

// "2 of 3 done" — and it counts ONLY your side. The partner's column has no
// completion state to read (nothing here knows whether they have finished), so
// including it would make the fraction a guess.
const tally = computed(() => {
  const yours = props.stage.yours ?? []
  return { done: yours.filter((t) => isDone(t.key)).length, total: yours.length }
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
        <!-- ⚠️ "Needed from you" STAYS, and the critique that flagged it as
             passive was right about the grammar and wrong about the fix. It was
             passive next to "Tridots is doing", where the two headings wanted
             to be parallel — but that pairing is gone now the partner's half is
             a sentence, and on its own this is the plainest possible label for
             a list of checkboxes. Rewriting it to match a heading that no
             longer exists would only have made it worse. -->
        <h4 class="text-p-sm font-medium text-ink-gray-7">Needed from you</h4>
        <!-- The fraction, not a progress bar: three items do not need a bar,
             and there is already one at the top of the page measuring the
             thing that actually has distance in it. -->
        <span class="shrink-0 text-p-sm text-ink-gray-5">
          {{ tally.done }} of {{ tally.total }} done
        </span>
      </div>

      <ul class="mt-2 space-y-2.5">
        <!-- ⚠️ Stacks below `sm`. Side by side on a phone, the button held its
             width and squeezed the label into three lines of two words —
             "Review the / partners / who respond" — which is the row's most
             important text losing to its least. The button drops under the
             label instead, indented to it. -->
        <li
          v-for="t in stage.yours"
          :key="t.key"
          class="flex flex-col items-start gap-1.5 sm:flex-row sm:gap-3"
        >
          <div class="min-w-0 flex-1">
            <Checkbox
              :model-value="isDone(t.key)"
              :label="t.label"
              :disabled="readonly"
              size="sm"
              @update:model-value="emit('toggle', t.key)"
            />
            <!-- ⚠️ Indented to the label, not to the checkbox. `Checkbox` sets
                 its own `gap-2` beside a control whose box is 14px at `sm`, so
                 22px is where the label's first character lands. A hint
                 starting under the box reads as a second, unlabelled row. -->
            <!-- ⚠️ The slot REPLACES the hint on a booking task once there is
                 one. The hint tells you what to do; the slot says what you
                 did, and keeping both would leave instructions standing under
                 a task that is finished. -->
            <p v-if="t.hint" class="ms-[22px] mt-0.5 text-p-sm text-ink-gray-5">
              {{ t.hint }}
            </p>
          </div>

          <!-- The help. A task that can be finished ON THIS SCREEN says so and
               offers the control; one you do elsewhere is a plain tick you come
               back and record. Hidden once done — the offer is spent — and on a
               past stage, where it would be inviting you back into work that is
               over. -->
          <Button
            v-if="t.action && !isDone(t.key) && !readonly"
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

    <!-- ── Theirs ──────────────────────────────────────────────────────── -->
    <!-- ⚠️ Rendered only when there is something in it. The custom spine's
         first stage has no other side — you are writing requirements and
         nobody has seen them yet — and a sentence claiming activity that has
         not started is worse than silence.

         No heading, no marks, no indent matching the checkboxes above: every
         one of those was what made the old version read as a second checklist.
         What separates it now is that it is a sentence. -->
    <p v-if="theirWork" class="text-p-base text-ink-gray-6">{{ theirWork }}</p>
  </div>
</template>
