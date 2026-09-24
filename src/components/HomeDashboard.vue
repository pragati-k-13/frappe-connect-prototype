<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, Button } from 'frappe-ui'
import NewProjectDialog from './NewProjectDialog.vue'
import ProjectRow from './ProjectRow.vue'
import TierIcon from './TierIcon.vue'
import IconPlus from '~icons/lucide/plus'
import IconHeart from '~icons/lucide/heart'
import IconComment from '~icons/lucide/message-square'
import { logoFor } from '../data/logos'
import { EVENTS, FEATURED_GUIDE, GUIDE_CARDS, GUIDE_ROWS } from '../data/home'
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

// ⚠️ ACTIVE, NOT ALL. A completed project is not something you "have" in the
// sense this line means. The rows below are everything; the sentence is what
// is still under way.
// Drafts are not under way either — nothing has started.
const active = computed(() => projects.value.filter((p) => p.service && !p.completedAt))

const countLine = computed(() => {
  const n = active.value.length
  if (!n) return 'Nothing under way yet'
  return `You have ${n} active ${n === 1 ? 'project' : 'projects'}`
})

// Saved partners: the first few, newest first, and "View all" once there are
// more than fit. The home screen is a way back to them, not the list itself —
// the rows here carry only who they are, and the full `PartnerRow`s live on
// `/connect/partners/saved`.
const SAVED_SHOWN = 3
const saved = computed(() => store.savedPartners)
const savedShown = computed(() => saved.value.slice(0, SAVED_SHOWN))

// ⚠️ THE NEW PROJECT DIALOG, the same one the projects list opens. It asks the
// landing's questions and saves a draft, so there is one way to start a project
// whichever screen it is started from.
const creating = ref(false)
const startSomething = () => (creating.value = true)
const create = (details) => {
  creating.value = false
  router.push(`/connect/projects/${store.createProject(details)}`)
}
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
      <Button variant="subtle" label="New project" @click="startSomething">
        <template #prefix><IconPlus class="size-4" /></template>
      </Button>
    </div>

    <!-- ── Projects ──────────────────────────────────────────────────── -->
    <!-- ⚠️ THE PROJECTS LIST'S OWN ROWS, not cards: the same `ProjectRow`, so
         a project reads the same on the home screen as on its list. -->
    <div v-if="projects.length" class="mt-4">
      <ProjectRow v-for="p in projects" :key="p.id" :project="p" />
    </div>

    <!-- The account that signed up and has not started anything. The only
         place on this screen where the three questions are the answer. -->
    <div v-else class="mt-5 rounded-6 border border-outline-gray-2 px-4 py-8 text-center">
      <p class="text-p-base text-ink-gray-7">Nothing under way</p>
      <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
        Answer a few questions and we will recommend Starter Packs or a custom implementation.
      </p>
      <Button class="mt-4" variant="solid" label="New project" @click="startSomething" />
    </div>

    <!-- ── Saved partners ────────────────────────────────────────────── -->
    <!-- Hidden when empty: the bookmark on each partner is how this fills,
         and an empty section here would be a hint about a control on another
         screen. -->
    <section v-if="saved.length" class="mt-12">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-base font-medium text-ink-gray-8">Saved partners</h2>
        <Button
          v-if="saved.length > SAVED_SHOWN"
          variant="ghost"
          size="sm"
          :label="`View all ${saved.length}`"
          :route="{ name: 'saved-partners' }"
        />
      </div>
      <div class="mt-3 grid gap-3 sm:grid-cols-3">
        <RouterLink
          v-for="p in savedShown"
          :key="p.id"
          :to="{ name: 'partner', params: { id: p.id } }"
          class="flex items-center gap-3 rounded-6 border border-outline-gray-2 p-3 transition-colors hover:bg-surface-gray-1"
        >
          <!-- The same mark as the directory row: logo if there is one,
               initials on the brand colour if not. -->
          <Avatar
            v-if="logoFor(p.id)"
            :image="logoFor(p.id)"
            :label="`${p.name} logo`"
            size="2xl"
            shape="square"
            class="fc-logo-avatar"
          />
          <span
            v-else
            class="flex size-10 shrink-0 items-center justify-center rounded-4 text-xs font-semibold text-white"
            :style="{ backgroundColor: p.color }"
            aria-hidden="true"
          >
            {{ p.initials }}
          </span>
          <span class="min-w-0">
            <span class="flex items-center gap-1.5">
              <span class="truncate text-p-base font-medium text-ink-gray-8">{{ p.name }}</span>
              <TierIcon :tier="p.tier" />
            </span>
            <span class="mt-0.5 block truncate text-p-sm text-ink-gray-6">{{ p.city }}</span>
          </span>
        </RouterLink>
      </div>
    </section>

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
          <span>{{ FEATURED_GUIDE.tag }}</span>
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
                <span>{{ row.tag }}</span>
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

    <NewProjectDialog :open="creating" @close="creating = false" @create="create" />
  </div>
</template>
