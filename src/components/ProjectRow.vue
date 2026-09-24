<script setup>
import { computed } from 'vue'
import { Avatar, Badge } from 'frappe-ui'
import IconProject from '~icons/lucide/briefcase-business'
import { logoFor } from '../data/logos'
import { PARTNERS } from '../data/partners'
import { serviceOf, stageOf, stageWork } from '../data/project'

// One project in the Projects list.
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

// The second line: what kind of work, and who is doing it. Both facts or one —
// a project with no service has neither, and the line simply isn't there.
//
// ⚠️ "No partner yet" rather than nothing, and only once a SERVICE is chosen.
// Before that, there is no reason to expect a partner and naming their absence
// reads as a warning about a step that has not come up yet.

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
  if (!w || props.project.completedAt) return null
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

const facts = computed(() => {
  if (!service.value) return [{ text: 'Scoped, but not yet booked with anyone.' }]
  return [
    { text: service.value.label },
    { text: partner.value?.name ?? 'No partner yet' },
    attention.value?.mine ? { text: attention.value.text, tone: 'text-ink-gray-8' } : null,
  ].filter(Boolean)
})

// When the project was created, relative — the list is ordered by it, so this
// is the figure that explains the order. `Intl` rather than a hand-rolled
// ladder: it says "yesterday" and "last week" the way a person would.
const DAY = 24 * 60 * 60 * 1000
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const created = computed(() => {
  const days = Math.round((props.project.at - Date.now()) / DAY)
  const text =
    Math.abs(days) < 7
      ? rtf.format(days, 'day')
      : Math.abs(days) < 30
        ? rtf.format(Math.round(days / 7), 'week')
        : Math.abs(days) < 365
          ? rtf.format(Math.round(days / 30), 'month')
          : rtf.format(Math.round(days / 365), 'year')
  return {
    text: text[0].toUpperCase() + text.slice(1),
    full: new Date(props.project.at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }
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
        <IconProject class="size-4" />
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
               grey "Draft" beside it is the honest version: nothing has started.
               See `isDraft`. -->
          <Badge
            v-if="project.completedAt"
            variant="subtle"
            theme="green"
            size="sm"
            label="Completed"
            class="shrink-0"
          />
          <Badge
            v-else-if="stage"
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
            label="Draft"
            class="shrink-0"
          />
        </div>

        <!-- ⚠️ ONE LINE UNDER THE TITLE, not two. Service, partner, anything
             that needs you read as one run of facts — no timeline, which is on
             the project itself; the
             "Waiting on Tridots" that had a line of its own repeated the
             partner's name and described the normal state, so it is gone.
             What needs YOU stays, in the darker ink — it is the one part worth
             stopping for. -->
        <p class="mt-1 flex flex-wrap items-center gap-x-1.5 text-p-base text-ink-gray-6">
          <template v-for="(fact, i) in facts" :key="fact.text">
            <span v-if="i" class="text-ink-gray-4" aria-hidden="true">·</span>
            <span :class="fact.tone">{{ fact.text }}</span>
          </template>
        </p>
      </div>
      <!-- On the title's line, quiet: it explains the order, it is not a
           reason to open the row. -->
      <time
        class="mt-1 shrink-0 text-sm text-ink-gray-5"
        :datetime="new Date(project.at).toISOString()"
        :title="`Created ${created.full}`"
      >
        {{ created.text }}
      </time>
    </div>
  </article>
</template>
