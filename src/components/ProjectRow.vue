<script setup>
import { computed } from 'vue'
import { Avatar } from 'frappe-ui'
import IconProject from '~icons/lucide/briefcase-business'
import IconPack from '~icons/lucide/package'
import IconQuotes from '~icons/lucide/users'
import IconShortlisted from '~icons/lucide/bookmark-check'
import { logoFor } from '../data/logos'
import { PARTNERS } from '../data/partners'
import { serviceOf } from '../data/project'

// One project in the Projects list.
//
// ⚠️ The MARK says what KIND of project this is, not who is on it: the
// package for a Starter Pack, the briefcase for everything else — the same two
// icons the rail uses for packs and projects. It used to be the partner's logo
// when there was one, which put another company's brand at the head of the
// customer's own project and made the row pass for a partner listing. The
// partner is on the facts line instead, with a small logo before the name.
//
// ⚠️ `fc-partner-row` / `fc-partner-row-body` are borrowed from `PartnerRow`,
// and the names now undersell what they do: the rules in `index.css` are
// generic listing mechanics — a rule under every row, hidden either side of a
// hovered one, dropped on the last — and nothing in them is about partners.
// Reusing them is what keeps the two listings in this app behaving identically;
// duplicating them under a second name is what would let them drift.
const props = defineProps({
  project: { type: Object, required: true },
  // A bordered card instead of a listing row, for the home screen. Same
  // mark, title, facts and date in one line; the Projects list keeps rows.
  card: { type: Boolean, default: false },
})

const partner = computed(() => PARTNERS.find((p) => p.id === props.project.partnerId) ?? null)
const logo = computed(() => (partner.value ? logoFor(partner.value.id) : null))
const service = computed(() => serviceOf(props.project.service))

// The second line: who is doing the work. What KIND of work is the mark's
// job, so it is not said again here; a project with no service has neither.
//
// ⚠️ "No partner yet" rather than nothing, and only once a SERVICE is chosen.
// Before that, there is no reason to expect a partner and naming their absence
// reads as a warning about a step that has not come up yet.

const mark = computed(() => (props.project.service === 'pack' ? IconPack : IconProject))
// The mark is now the only place the service is named, so it carries the name
// as a tooltip and for screen readers. A project with no service has none.
const markLabel = computed(() => service.value?.label ?? 'Draft')

// ⚠️ CHOOSING A PARTNER gets figures instead: how many quotes are in and how
// many are shortlisted, each with its own icon like the partner list's facts.
// It is the one stage where the row has something to count, and "No partner
// yet" was only restating the stage.
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const choosing = computed(
  () => props.project.service === 'custom' && props.project.stage === 'choosing',
)

const facts = computed(() => {
  if (!service.value) return [{ text: 'Scoped, but not yet booked with anyone.' }]
  if (choosing.value) {
    const bids = props.project.bids ?? []
    return [
      { text: plural(bids.length, 'quote'), icon: IconQuotes },
      {
        text: `${bids.filter((b) => b.state === 'shortlisted').length} shortlisted`,
        icon: IconShortlisted,
      },
    ]
  }
  return [{ text: partner.value?.name ?? 'No partner yet', logo: logo.value }]
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
  <!-- A card for a grid, half the listing's width: mark, title, facts, and
       the date last. The listing row's one-line anatomy put the date beside
       the title, which at this width left the name a few words before it
       truncated. `mt-auto` on the date pins it to the foot, so two cards of
       different heights still end on one line. -->
  <article
    v-if="card"
    class="relative flex flex-col rounded-6 border border-outline-gray-1 p-4 transition-[border-color,box-shadow] hover:border-transparent hover:shadow-sm"
  >
    <span
      class="grid size-10 shrink-0 place-items-center rounded-4 bg-surface-gray-2 text-ink-gray-5"
      role="img"
      :aria-label="markLabel"
      :title="markLabel"
    >
      <component :is="mark" class="size-4" />
    </span>
    <!-- The whole card is the link, by the same stretched-anchor idiom as the
         row below. Two lines before it clips, since the name now has the
         card's width to itself. -->
    <h3 class="mt-3 line-clamp-2 text-lg font-medium text-ink-gray-7">
      <RouterLink
        :to="`/connect/projects/${project.id}`"
        class="after:absolute after:inset-0 after:content-['']"
      >
        {{ project.name }}
      </RouterLink>
    </h3>
    <p
      class="mt-1 flex flex-wrap items-center gap-y-1 text-p-sm text-ink-gray-6"
      :class="choosing ? 'gap-x-4' : 'gap-x-1.5'"
    >
      <template v-for="(fact, i) in facts" :key="fact.text">
        <span v-if="i && !choosing" class="text-ink-gray-4" aria-hidden="true">·</span>
        <span class="flex items-center" :class="fact.icon ? 'gap-1' : 'gap-1.5'">
          <component :is="fact.icon" v-if="fact.icon" class="size-3.5 shrink-0 text-ink-gray-6" />
          <Avatar
            v-else-if="fact.logo"
            :image="fact.logo"
            label=""
            size="xs"
            shape="square"
            class="fc-logo-avatar !p-0"
          />
          {{ fact.text }}
        </span>
      </template>
    </p>
    <time
      class="mt-auto pt-3 text-sm text-ink-gray-5"
      :datetime="new Date(project.at).toISOString()"
      :title="`Created ${created.full}`"
    >
      {{ created.text }}
    </time>
  </article>
  <article
    v-else
    class="fc-partner-row group relative -mx-3 rounded-4 px-3 transition-colors hover:bg-surface-gray-1"
  >
    <div class="fc-partner-row-body flex items-start gap-3 border-b border-outline-gray-1 py-5">
      <span
        class="grid size-10 shrink-0 place-items-center rounded-4 bg-surface-gray-2 text-ink-gray-5"
        role="img"
        :aria-label="markLabel"
        :title="markLabel"
      >
        <component :is="mark" class="size-4" />
      </span>

      <div class="min-w-0 flex-1">
        <!-- No stage badge: where a project stands is on the project itself.
             The row is a way into it. -->
        <h3 class="min-w-0 text-lg font-medium text-ink-gray-7">
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

        <!-- ⚠️ ONE LINE UNDER THE TITLE: service and partner. What is
             outstanding lives on the project itself, not in the index. -->
        <p
          class="mt-1 flex flex-wrap items-center text-p-sm text-ink-gray-6"
          :class="choosing ? 'gap-x-4' : 'gap-x-1.5'"
        >
          <template v-for="(fact, i) in facts" :key="fact.text">
            <span v-if="i && !choosing" class="text-ink-gray-4" aria-hidden="true">·</span>
            <span class="flex items-center" :class="fact.icon ? 'gap-1' : 'gap-1.5'">
              <component
                :is="fact.icon"
                v-if="fact.icon"
                class="size-3.5 shrink-0 text-ink-gray-6"
              />
              <Avatar
                v-else-if="fact.logo"
                :image="fact.logo"
                label=""
                size="xs"
                shape="square"
                class="fc-logo-avatar !p-0"
              />
              {{ fact.text }}
            </span>
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
