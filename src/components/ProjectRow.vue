<script setup>
import { computed } from 'vue'
import { Avatar, Badge } from 'frappe-ui'
import IconFolder from '~icons/lucide/folder'
import { logoFor } from '../data/logos'
import { PARTNERS } from '../data/partners'
import { serviceOf, stageOf, stageWork, windowFor } from '../data/project'

// One project in the Implementation list.
//
// ⚠️ The MARK is the fastest thing in the row, so it carries the fact the row
// is most often scanned for: whether this work has someone on it. A partner's
// logo means yes; the neutral folder means the project is still yours alone.
// Custom work spends two stages in that second state and a project with no
// service never leaves it.
//
// ⚠️ `fc-partner-row` / `fc-partner-row-body` are borrowed from `PartnerRow`,
// and the names now undersell what they do: the rules in `index.css` are
// generic listing mechanics — a rule under every row, hidden either side of a
// hovered one, dropped on the last — and nothing in them is about partners.
// Reusing them is what keeps the two listings in this app behaving identically;
// duplicating them under a second name is what would let them drift.
const props = defineProps({
  project: { type: Object, required: true },
})

const partner = computed(() => PARTNERS.find((p) => p.id === props.project.partnerId) ?? null)
const logo = computed(() => (partner.value ? logoFor(partner.value.id) : null))
const service = computed(() => serviceOf(props.project.service))
const stage = computed(() => stageOf(props.project.service, props.project.stage))
const work = computed(() => stageWork(props.project))
const window = computed(() => windowFor(props.project))

// The second line: what kind of work, and who is doing it. Both facts or one —
// a project with no service has neither, and the line simply isn't there.
//
// ⚠️ "No partner yet" rather than nothing, and only once a SERVICE is chosen.
// Before that, there is no reason to expect a partner and naming their absence
// reads as a warning about a step that has not come up yet.
const subtitle = computed(() => {
  if (!service.value) return null
  return [service.value.label, partner.value?.name ?? 'No partner yet'].join(' · ')
})

// The partner's first name, or Frappe while nobody is assigned — the same rule
// the project page uses for the sentence naming the other side.
const otherParty = computed(() => partner.value?.name.split(' ')[0] ?? 'Frappe')

// ⚠️ THE THIRD LINE ANSWERS "DOES THIS WANT ME?", and it used to answer "how
// far along is it?" — `Step 3 of 5`. That is a progress report: four of them in
// a column tell you where four projects stand and nothing about which one to
// open. The stage badge already says where a project is; what is outstanding is
// the only thing a row can add that the badge cannot, and it is what turns this
// index into a queue rather than a status board.
//
// Three states, and the middle one is why the partner's half of every stage
// exists at all: most of a project is spent waiting, and a row that goes quiet
// without saying what it is waiting FOR reads as a row where nothing is
// happening.
const attention = computed(() => {
  const w = work.value
  if (!w) return null
  if (w.outstanding) {
    const plural = w.outstanding === 1
    return {
      text: `${w.outstanding} thing${plural ? '' : 's'} need${plural ? 's' : ''} you`,
      mine: true,
    }
  }
  if (w.waitingOn) return { text: `Waiting on ${otherParty.value}`, mine: false }
  return null
})

// The countdown alone. The window's own name ("60-day validity") belongs on the
// project's page, where there is room to say what the window is FOR; in a row it
// only made the number harder to read.
// ⚠️ The same three states the project page uses, and the same `urgent` flag
// behind them — a window is not "running out" on one screen and fine on the
// other. It reads quieter here than there: in a row this is the half of the
// line that is NOT the reason to open it, right up until it goes amber.
const countdown = computed(() => {
  const w = window.value
  if (!w) return null
  if (w.expired) return { text: 'Validity expired', tone: 'text-ink-red-7' }
  const days = w.daysLeft === 1 ? '1 day left' : `${w.daysLeft} days left`
  return { text: days, tone: w.urgent ? 'text-ink-amber-7' : 'text-ink-gray-5' }
})
</script>

<template>
  <article
    class="fc-partner-row group relative -mx-3 rounded-4 px-3 transition-colors hover:bg-surface-gray-1"
  >
    <div class="fc-partner-row-body flex items-start gap-3 border-b border-outline-gray-1 py-5">
      <Avatar
        v-if="logo"
        :image="logo"
        :label="`${partner.name} logo`"
        size="2xl"
        shape="square"
        class="fc-logo-avatar"
      />
      <!-- No partner: a neutral mark at the same 40px and 8px radius, so the
           rows stay in one column. Deliberately NOT the partner's initials
           placeholder — there is no partner to stand in for. -->
      <span
        v-else
        class="grid size-10 shrink-0 place-items-center rounded-4 bg-surface-gray-2 text-ink-gray-5"
        aria-hidden="true"
      >
        <IconFolder class="size-4" />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 class="min-w-0 text-lg font-medium text-ink-gray-8">
            <!-- The whole row is the link. `after:inset-0` on the anchor
                 stretches its hit area over the `relative` article, which is
                 what makes the row clickable without nesting anything inside a
                 second interactive element. Same idiom as `PartnerRow`. -->
            <RouterLink
              :to="`/connect/projects/${project.id}`"
              class="after:absolute after:inset-0 after:content-['']"
            >
              {{ project.name }}
            </RouterLink>
          </h3>
          <!-- ⚠️ The badge says the stage, and a project with no service has
               none to say — so it is absent rather than reading "Not started",
               which would be a stage name for a spine that does not exist. The
               grey "No service yet" beside it is the honest version. -->
          <Badge
            v-if="stage"
            variant="subtle"
            :theme="stage.theme"
            size="sm"
            :label="stage.label"
            class="shrink-0"
          />
          <Badge
            v-else
            variant="subtle"
            theme="gray"
            size="sm"
            label="No service yet"
            class="shrink-0"
          />
        </div>

        <p v-if="subtitle" class="mt-0.5 text-p-sm text-ink-gray-6">{{ subtitle }}</p>
        <p v-else class="mt-0.5 text-p-sm text-ink-gray-6">
          Scoped, but not yet booked with anyone.
        </p>

        <!-- ⚠️ The two halves are NOT the same weight, which is the point of
             the line. What the project wants from you is the reason to open the
             row; the countdown is background. Rendering both in `ink-gray-5` —
             which is what the old `Step 3 of 5 · 42 days left` did — makes the
             reader parse two equal facts to find the one that is actionable. -->
        <p v-if="attention || countdown" class="mt-2 flex flex-wrap items-center gap-x-2 text-p-sm">
          <span v-if="attention" :class="attention.mine ? 'text-ink-gray-8' : 'text-ink-gray-6'">
            {{ attention.text }}
          </span>
          <span v-if="attention && countdown" class="text-ink-gray-4" aria-hidden="true">·</span>
          <span v-if="countdown" :class="countdown.tone">{{ countdown.text }}</span>
        </p>
      </div>
    </div>
  </article>
</template>
