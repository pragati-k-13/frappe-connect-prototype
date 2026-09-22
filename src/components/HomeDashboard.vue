<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button, Tooltip } from 'frappe-ui'
import IconPlus from '~icons/lucide/plus'
import IconChevron from '~icons/lucide/chevron-right'
import IconProject from '~icons/lucide/binoculars'
import IconHeart from '~icons/lucide/heart'
import IconComment from '~icons/lucide/message-square'
import { EVENTS, FEATURED_GUIDE, GUIDE_CARDS, GUIDE_ROWS } from '../data/home'
import { serviceOf, stageOf, windowFor } from '../data/project'
import { useConnectStore } from '../stores/connect'

// The signed-in home, built to the attached design.
//
// ⚠️ THE QUIZ AND THE RECOMMENDATION ARE NOT USEFUL TWICE. Everything on the
// landing page below the questions — starter packs explained, success stories,
// a footer CTA back into the quiz — is written for somebody deciding whether to
// buy. A customer with a project under way opened this screen to see the
// project, and was shown the sales pitch they had already accepted.
//
// ⚠️ IMAGES ARE GREY BLOCKS, as the design asks. Everything that would carry a
// photograph — the two guide cards, the featured guide, the two rows' thumbnails
// and the event cards — renders an empty tinted box at a fixed aspect ratio, so
// dropping real art in later reflows nothing.
const store = useConnectStore()
const router = useRouter()

// ⚠️ TIME OF DAY, and it is the one thing on this screen that changes without
// anybody doing anything. The design says "Good morning"; the hour decides
// which of the three it is, because a product that says good morning at
// midnight is a product that was built in the morning.
const greeting = computed(() => {
  const h = new Date().getHours()
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const name = store.viewer.name?.split(' ')[0]
  return name ? `${part}, ${name}` : part
})

const projects = computed(() => [...store.projects].sort((a, b) => b.at - a.at))

// ⚠️ ACTIVE, NOT ALL. A project that has gone live is not something you "have"
// in the sense this line means, so the count is what still wants you — and it
// can differ from the number of rows below, which is correct: the rows are
// everything, the sentence is what is outstanding.
const active = computed(() =>
  projects.value.filter((p) => p.stage !== 'live' && p.stage !== 'custom-live'),
)

const countLine = computed(() => {
  const n = active.value.length
  if (!n) return 'Nothing under way yet'
  return `You have ${n} active ${n === 1 ? 'project' : 'projects'}`
})

// The three facts on a project card.
//
// ⚠️ DERIVED PER SERVICE, and the design shows one case — "0 shortlisted, 0
// quotes, 8-12 weeks", which is a custom project out for quotes. A starter pack
// has no shortlist and no quotes, so printing those labels with zeroes against
// one would be three facts about a flow it is not in. Each card prints what its
// own project has, and a project with no service yet prints none.
const factsFor = (project) => {
  if (project.service === 'custom') {
    const bids = project.bids ?? []
    const facts = [
      `${bids.filter((b) => b.state === 'shortlisted').length} shortlisted`,
      `${bids.length} ${bids.length === 1 ? 'quote' : 'quotes'}`,
    ]
    const chosen = bids.find((b) => b.partnerId === project.partnerId)
    if (chosen) facts.push(`${chosen.weeks} weeks`)
    return facts
  }
  if (project.service === 'pack') {
    const w = windowFor(project)
    return [
      ...(w ? [`${w.daysLeft} days left`] : []),
      project.partnerId ? 'Partner assigned' : 'Awaiting a partner',
    ]
  }
  return []
}

const badgeFor = (project) => stageOf(project.service, project.stage) ?? null
const serviceFor = (project) => serviceOf(project.service)

// ⚠️ `?new=1`, NOT A SEPARATE ROUTE. `/connect` is the landing page for a
// visitor and this dashboard for a customer, and starting something new is the
// third face: the questions again, without the pitch underneath them. See
// `ConnectLandingPage`, which reads the flag.
const startSomething = () => router.push({ path: '/connect', query: { new: '1' } })
</script>

<template>
  <div class="mx-auto w-full max-w-[760px] px-5 py-8 lg:px-10">
    <!-- ── Greeting ──────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-lg font-semibold text-ink-gray-9">{{ greeting }}</h1>
        <p class="mt-0.5 text-p-base text-ink-gray-6">{{ countLine }}</p>
      </div>
      <!-- ⚠️ AN ICON BUTTON, AND THE ONLY CONTROL IN THE HEADER. The design
           puts a `+` here rather than a labelled button, which works because it
           is the one thing this screen starts. The tooltip carries the label a
           `+` cannot, and `aria-label` carries it for anyone not hovering. -->
      <Tooltip text="Start something new">
        <Button variant="subtle" aria-label="Start something new" @click="startSomething">
          <IconPlus class="size-4" />
        </Button>
      </Tooltip>
    </div>

    <!-- ── Projects ──────────────────────────────────────────────────── -->
    <ul v-if="projects.length" class="mt-5 space-y-3">
      <li v-for="p in projects" :key="p.id">
        <RouterLink
          :to="{ name: 'project', params: { id: p.id } }"
          class="flex items-center gap-3 rounded-6 border border-outline-gray-2 p-4 transition-colors hover:bg-surface-gray-1"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-5 bg-surface-gray-2 text-ink-gray-6"
            aria-hidden="true"
          >
            <IconProject class="size-5" />
          </span>

          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="truncate text-p-base font-medium text-ink-gray-8">{{ p.name }}</span>
              <Badge
                v-if="badgeFor(p)"
                variant="subtle"
                size="sm"
                :theme="badgeFor(p).theme"
                :label="badgeFor(p).label"
              />
            </span>
            <span class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span v-for="fact in factsFor(p)" :key="fact" class="text-p-sm text-ink-gray-6">
                {{ fact }}
              </span>
              <span v-if="!factsFor(p).length" class="text-p-sm text-ink-gray-5">
                {{ serviceFor(p)?.label ?? 'No service yet' }}
              </span>
            </span>
          </span>

          <IconChevron class="size-4 shrink-0 text-ink-gray-5" />
        </RouterLink>
      </li>
    </ul>

    <!-- The account that signed up and has not started anything. The only
         place on this screen where the three questions are the answer. -->
    <div v-else class="mt-5 rounded-6 border border-outline-gray-2 px-4 py-8 text-center">
      <p class="text-p-base text-ink-gray-7">Nothing under way</p>
      <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
        Answer three questions and we will say which of the two services fits, and what it costs.
      </p>
      <Button class="mt-4" variant="solid" label="Get a recommendation" @click="startSomething" />
    </div>

    <!-- ── Resources ─────────────────────────────────────────────────── -->
    <section class="mt-12">
      <h2 class="text-base font-medium text-ink-gray-8">Resources</h2>

      <!-- Two cards: image, date, title. -->
      <div class="mt-3 grid gap-4 sm:grid-cols-2">
        <a
          v-for="card in GUIDE_CARDS"
          :key="card.title"
          :href="card.href"
          target="_blank"
          rel="noreferrer"
          class="group overflow-hidden rounded-6 border border-outline-gray-2"
        >
          <!-- ⚠️ A GREY BLOCK, as asked. The aspect ratio holds the card's
               height steady whatever eventually goes in it. -->
          <span class="block aspect-[16/9] bg-surface-gray-2" aria-hidden="true" />
          <span class="block p-4">
            <span class="block text-p-sm text-ink-gray-5">{{ card.at }}</span>
            <span class="mt-1 block text-p-base text-ink-gray-8 group-hover:underline">
              {{ card.title }}
            </span>
          </span>
        </a>
      </div>

      <!-- The featured one: wide image, title, standfirst, byline. -->
      <a :href="FEATURED_GUIDE.href" target="_blank" rel="noreferrer" class="group mt-8 block">
        <span class="block aspect-[3/1] rounded-6 bg-surface-gray-2" aria-hidden="true" />
        <span class="mt-4 block text-lg font-semibold text-ink-gray-9 group-hover:underline">
          {{ FEATURED_GUIDE.title }}
        </span>
        <span class="mt-1 block max-w-[62ch] text-p-base leading-relaxed text-ink-gray-6">
          {{ FEATURED_GUIDE.body }}
        </span>
        <span class="mt-2 flex items-center gap-2 text-p-sm text-ink-gray-5">
          By Frappe
          <span aria-hidden="true">·</span>
          <span class="uppercase tracking-wide">{{ FEATURED_GUIDE.tag }}</span>
        </span>
      </a>

      <!-- And the rows, thumbnail on the right. -->
      <ul class="mt-6 divide-y divide-outline-gray-1">
        <li v-for="row in GUIDE_ROWS" :key="row.title">
          <a
            :href="row.href"
            target="_blank"
            rel="noreferrer"
            class="group flex items-start gap-4 py-5"
          >
            <span class="min-w-0 flex-1">
              <span class="block text-p-base font-medium text-ink-gray-8 group-hover:underline">
                {{ row.title }}
              </span>
              <span class="mt-0.5 block text-p-base text-ink-gray-6">{{ row.body }}</span>
              <span class="mt-2 flex items-center gap-2 text-p-sm text-ink-gray-5">
                By Frappe
                <span aria-hidden="true">·</span>
                <span class="uppercase tracking-wide">{{ row.tag }}</span>
              </span>
              <!-- ⚠️ INVENTED FIGURES. They are in the design so they are here,
                   and they assert engagement nobody measured — the partners
                   page dropped the same counts off its success stories for that
                   reason. See the note in `data/home.js`. -->
              <span class="mt-2 flex items-center gap-4 text-p-sm text-ink-gray-5">
                <span class="flex items-center gap-1">
                  <IconHeart class="size-3.5" />
                  {{ row.likes }}
                </span>
                <span class="flex items-center gap-1">
                  <IconComment class="size-3.5" />
                  {{ row.comments }}
                </span>
              </span>
            </span>
            <span
              class="block aspect-[16/9] w-[160px] shrink-0 rounded-5 bg-surface-gray-2"
              aria-hidden="true"
            />
          </a>
        </li>
      </ul>
    </section>

    <!-- ── Events ────────────────────────────────────────────────────── -->
    <section class="mt-12">
      <h2 class="text-base font-medium text-ink-gray-8">
        Upcoming events you might be interested in
      </h2>
      <div class="mt-3 grid gap-4 sm:grid-cols-2">
        <a
          v-for="e in EVENTS"
          :key="e.title"
          :href="e.href"
          target="_blank"
          rel="noreferrer"
          class="group overflow-hidden rounded-6 border border-outline-gray-2"
        >
          <span class="block aspect-[16/9] bg-surface-gray-2" aria-hidden="true" />
          <span class="block p-4">
            <span class="block text-p-sm text-ink-gray-5">{{ e.at }} · {{ e.where }}</span>
            <span class="mt-1 block text-p-base text-ink-gray-8 group-hover:underline">
              {{ e.title }}
            </span>
          </span>
        </a>
      </div>
    </section>
  </div>
</template>
