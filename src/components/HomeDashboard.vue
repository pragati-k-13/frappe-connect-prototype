<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import NewProjectDialog from './NewProjectDialog.vue'
import ProjectRow from './ProjectRow.vue'
import PartnerRow from './PartnerRow.vue'
import IconPlus from '~icons/lucide/plus'
import IconHeart from '~icons/lucide/heart'
import IconComment from '~icons/lucide/message-square'
import { EVENTS, POSTS, RESOURCES } from '../data/home'
import { useConnectStore } from '../stores/connect'

// The signed-in home, built to the attached design.
//
// ⚠️ THE QUIZ AND THE RECOMMENDATION ARE NOT USEFUL TWICE. Everything on the
// landing page below the questions — starter packs explained, success stories,
// a footer CTA back into the quiz — is written for somebody deciding whether to
// buy. A customer with a project under way opened this screen to see the
// project, and was shown the sales pitch they had already accepted.
//
// ⚠️ IMAGES ARE GREY BLOCKS, as the design asks. The guide cards, the
// featured post and the post rows' thumbnails render an empty tinted box at a
// fixed aspect ratio, so dropping real art in later reflows nothing.
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
// more than fit. The rest are on `/connect/partners/saved`.
const SAVED_SHOWN = 3
const saved = computed(() => store.savedPartners)
const savedShown = computed(() => saved.value.slice(0, SAVED_SHOWN))

// ⚠️ THE NEW PROJECT DIALOG, the same one the projects list opens. It asks the
// landing's questions and saves a draft, so there is one way to start a project
// whichever screen it is started from.
const creating = ref(false)
const startSomething = () => (creating.value = true)
// Events lead with the date, split so the day can be the large figure.
const eventDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`)
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  }
}

// `ListRow` links only through `to`, a router location, so rows that go off
// site open from the click.
const openLink = (href) => window.open(href, '_blank', 'noreferrer')

const [featured, ...posts] = POSTS

const create = (details) => {
  creating.value = false
  router.push(`/connect/projects/${store.createProject(details)}`)
}
</script>

<template>
  <div class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
    <!-- ── Greeting ──────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-ink-gray-8">{{ greeting }}</h1>
        <p class="mt-0.5 text-p-base text-ink-gray-6">{{ countLine }}</p>
      </div>
      <!-- Only once there is a list to add to: with no projects, the empty
           state's button below is the one thing this screen asks for. -->
      <Button v-if="projects.length" variant="subtle" label="New project" @click="startSomething">
        <template #prefix><IconPlus class="size-4" /></template>
      </Button>
    </div>

    <!-- ── Projects ──────────────────────────────────────────────────── -->
    <!-- Cards, side by side: `ProjectRow` in its card form, so the facts a
         project shows are the same here as on the Projects list. Two across,
         the same grid as Resources below; one column on a phone. -->
    <div v-if="projects.length" class="mt-5 grid gap-3 sm:grid-cols-2">
      <ProjectRow v-for="p in projects" :key="p.id" :project="p" card />
    </div>

    <!-- The account that signed up and has not started anything. The line
         under the greeting already says nothing is under way, so this only
         says what to do about it. -->
    <div v-else class="mt-5 flex flex-col items-start gap-4">
      <p class="max-w-md text-p-base text-ink-gray-7">
        Answer a few questions and we will recommend Starter Packs or a custom implementation.
      </p>
      <Button variant="solid" label="New project" @click="startSomething" />
    </div>

    <!-- ── Saved partners ────────────────────────────────────────────── -->
    <!-- Hidden when empty: the bookmark on each partner is how this fills,
         and an empty section here would be a hint about a control on another
         screen. -->
    <section v-if="saved.length" class="mt-20">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-base font-medium text-ink-gray-8">Saved partners</h2>
        <Button
          v-if="saved.length > SAVED_SHOWN"
          variant="subtle"
          size="sm"
          label="View all"
          :route="{ name: 'saved-partners' }"
        />
      </div>
      <!-- The directory's own rows, compact: Save still works; Contact and
           the comparison line stay on the full list. -->
      <div class="mt-1">
        <PartnerRow v-for="p in savedShown" :key="p.id" :partner="p" compact />
      </div>
    </section>

    <!-- ── Resources ─────────────────────────────────────────────────── -->
    <!-- Two cards: image, date, title. -->
    <section class="mt-16">
      <h2 class="text-base font-medium text-ink-gray-8">Resources</h2>
      <div class="mt-3 grid gap-4 sm:grid-cols-2">
        <a
          v-for="card in RESOURCES"
          :key="card.title"
          :href="card.href"
          target="_blank"
          rel="noreferrer"
          class="overflow-hidden rounded-6 border border-outline-gray-1 transition-colors hover:border-outline-gray-2"
        >
          <span class="block aspect-[5/2] bg-surface-gray-2" aria-hidden="true" />
          <span class="block px-2.5 py-2">
            <span class="block text-p-sm text-ink-gray-5">{{ card.at }}</span>
            <span class="mt-1 block text-p-base font-medium text-ink-gray-7">
              {{ card.title }}
            </span>
          </span>
        </a>
      </div>
    </section>

    <!-- ── Blog ──────────────────────────────────────────────────────── -->
    <section class="mt-16">
      <h2 class="text-base font-medium text-ink-gray-8">Blog</h2>

      <!-- One frappe-ui `List`, opened from the click like the events below,
           so every post shares one hover. The featured post is its first row,
           one cell across both columns: wide image, title, standfirst, byline.
           The rest follow with the thumbnail on the right. -->
      <List
        divider="full"
        :columns="['minmax(0,1fr)', '160px']"
        class="-mx-3 mt-3 [--list-gap:1rem]"
      >
        <ListRow class="pb-5 pt-3" @click="openLink(featured.href)">
          <ListCell class="col-span-full">
            <span class="w-full min-w-0 text-left">
              <span class="block aspect-[5/1] rounded-6 bg-surface-gray-2" aria-hidden="true" />
              <span class="mt-4 block text-p-lg font-semibold text-ink-gray-7">
                {{ featured.title }}
              </span>
              <span class="mt-1 block max-w-[62ch] text-p-base leading-relaxed text-ink-gray-6">
                {{ featured.body }}
              </span>
              <span class="mt-2 flex items-center gap-2 text-p-sm text-ink-gray-5">
                By Frappe
                <span class="text-ink-gray-4" aria-hidden="true">·</span>
                <span>{{ featured.tag }}</span>
              </span>
            </span>
          </ListCell>
        </ListRow>
        <ListRow v-for="post in posts" :key="post.title" class="py-5" @click="openLink(post.href)">
          <ListCell class="self-start">
            <span class="min-w-0 text-left">
              <span class="block text-p-lg font-medium text-ink-gray-7">{{ post.title }}</span>
              <span class="mt-0.5 block text-p-base text-ink-gray-6">{{ post.body }}</span>
              <span class="mt-2 flex items-center gap-2 text-p-sm text-ink-gray-5">
                By Frappe
                <span class="text-ink-gray-4" aria-hidden="true">·</span>
                <span>{{ post.tag }}</span>
              </span>
              <!-- ⚠️ INVENTED FIGURES. See the note on `POSTS` in `data/home.js`. -->
              <span class="mt-2 flex items-center gap-4 text-p-sm text-ink-gray-5">
                <span class="flex items-center gap-1">
                  <IconHeart class="size-3.5" />
                  {{ post.likes }}
                </span>
                <span class="flex items-center gap-1">
                  <IconComment class="size-3.5" />
                  {{ post.comments }}
                </span>
              </span>
            </span>
          </ListCell>
          <ListCell class="self-start">
            <span
              class="block aspect-[16/9] w-full rounded-5 bg-surface-gray-2"
              aria-hidden="true"
            />
          </ListCell>
        </ListRow>
      </List>
    </section>

    <!-- ── Events ────────────────────────────────────────────────────── -->
    <!-- Date-led rows: the date is what tells an event from a post, so it
         takes the leading column at a fixed width. -->
    <section class="mt-16">
      <h2 class="text-base font-medium text-ink-gray-8">
        Upcoming events you might be interested in
      </h2>
      <!-- frappe-ui's `List`, opened from the click (see `openLink`). `-mx-3`
           pulls the text back onto the heading's edge past the 12px a
           clickable row pads for its hover fill. -->
      <List divider="full" :columns="['40px', 'minmax(0,1fr)', 'auto']" class="-mx-3 mt-1">
        <ListRow v-for="e in EVENTS" :key="e.title" class="py-4" @click="openLink(e.href)">
          <ListCell>
            <span class="flex w-full flex-col items-center">
              <span class="text-xs font-medium uppercase text-ink-gray-6">
                {{ eventDate(e.date).month }}
              </span>
              <span class="text-xl font-semibold leading-none text-ink-gray-8">
                {{ eventDate(e.date).day }}
              </span>
            </span>
          </ListCell>
          <ListCell>
            <span class="min-w-0 text-left">
              <span class="block text-lg font-medium text-ink-gray-7">{{ e.title }}</span>
              <span class="mt-0.5 block text-p-base text-ink-gray-6">{{ e.where }}</span>
            </span>
          </ListCell>
          <ListCell class="justify-end">
            <span class="text-p-sm text-ink-gray-5">{{ e.time }}</span>
          </ListCell>
        </ListRow>
      </List>
    </section>

    <NewProjectDialog :open="creating" @close="creating = false" @create="create" />
  </div>
</template>
