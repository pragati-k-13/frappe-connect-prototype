<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'frappe-ui'
import ProjectRow from './ProjectRow.vue'
import IconExternal from '~icons/lucide/arrow-up-right'
import IconPlus from '~icons/lucide/plus'
import { EVENTS, POSTS, RESOURCES } from '../data/home'
import { useConnectStore } from '../stores/connect'

// The signed-in home. What the landing page becomes once the questions have
// been answered.
//
// ⚠️ THE QUIZ AND THE RECOMMENDATION ARE NOT USEFUL TWICE. Everything on the
// landing page below the questions — starter packs explained, success stories,
// a footer CTA back into the quiz — is written for somebody deciding whether to
// buy. A customer with a project under way opened this screen to see the
// project, and was shown the sales pitch they had already accepted.
//
// ⚠️ ONE COLUMN, NOT A GRID OF TILES. Most accounts have one project and almost
// none have more than three — the brief says so and the seed data agrees — so
// the screen is short by nature. A dashboard grid is for filling space that a
// business with one implementation does not have, and the widgets would end up
// padded out to justify their boxes.
//
// ⚠️ THE PROJECTS ARE THE ONLY THING THAT IS THEIRS. Resources, posts and
// events are all Frappe talking, so they sit below the fold in one quieter
// band, in that order: what you read to do the work, what we wrote, where we
// will be. None of them is urgent and none should look it.
const store = useConnectStore()
const router = useRouter()

// ⚠️ NEWEST FIRST, and capped at three. `projects` is the store's own list in
// creation order; the listing screen sorts the same way, and the rail's
// Implementation row is where you go when there are more than fit here.
const projects = computed(() => [...store.projects].sort((a, b) => b.at - a.at))
const shown = computed(() => projects.value.slice(0, 3))

// ⚠️ THE SAME ROW THE LISTING USES. A second, prettier project row on the home
// screen is how the two come to disagree about what "3 things need you" counts.
// It also means the hover mechanics, the stage badge and the queue line are
// right here for free.
const greeting = computed(() => store.viewer.name?.split(' ')[0] ?? '')

// ⚠️ `?new=1`, NOT A SEPARATE ROUTE. `/connect` is the landing page for a
// visitor and this dashboard for a customer — one address, two faces — and
// starting something new is the third: the questions again, without the pitch
// underneath them. See `ConnectLandingPage`, which reads the flag.
const startSomething = () => router.push({ path: '/connect', query: { new: '1' } })
</script>

<template>
  <div class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
    <!-- ⚠️ A NAME, NOT A WELCOME MESSAGE. "Welcome back, Meera" is a sentence
         that says nothing on the second reading and gets in the way on the
         hundredth; the first name alone is the smallest thing that makes the
         screen feel addressed rather than issued. -->
    <h1 class="text-2xl font-semibold text-ink-gray-8">
      {{ greeting ? `Hello, ${greeting}` : 'Your implementation' }}
    </h1>

    <!-- ── Projects ──────────────────────────────────────────────────── -->
    <section class="mt-8">
      <div class="flex items-baseline justify-between gap-4">
        <!-- ⚠️ SINGULAR, PLURAL, OR NEITHER. "Your projects" over an empty
             state is a heading for a list that is not there; the empty state
             below says what is going on and needs no label above it. -->
        <h2 v-if="shown.length" class="text-base font-medium text-ink-gray-8">
          {{ projects.length === 1 ? 'Your project' : 'Your projects' }}
        </h2>
        <span v-else />
        <RouterLink
          v-if="projects.length > shown.length"
          to="/connect/projects"
          class="shrink-0 text-p-sm text-ink-gray-6 underline hover:text-ink-gray-8"
        >
          All {{ projects.length }}
        </RouterLink>
      </div>

      <ul v-if="shown.length" class="mt-2">
        <ProjectRow v-for="p in shown" :key="p.id" :project="p" />
      </ul>

      <!-- ⚠️ A REAL STATE, and the one this screen is least likely to be
           designed for: an account that signed up and has not started
           anything. It is the only place on the home screen where the three
           questions are the answer, so it gets the solid button. -->
      <div
        v-else
        class="mt-2 rounded-6 border border-outline-gray-2 px-4 py-8 text-center"
      >
        <p class="text-p-base text-ink-gray-7">Nothing under way</p>
        <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
          Answer three questions and we will say which of the two services fits, and what it
          costs.
        </p>
        <Button class="mt-4" variant="solid" label="Get a recommendation" @click="startSomething" />
      </div>

      <!-- Quiet, because a business with a project under way is usually not
           starting a second one — but it is the only route back to the
           questions once the landing page has become this screen. -->
      <button
        v-if="shown.length"
        type="button"
        class="mt-4 flex items-center gap-1.5 text-p-base text-ink-gray-6 hover:text-ink-gray-8"
        @click="startSomething"
      >
        <IconPlus class="size-4" />
        Start something new
      </button>
    </section>

    <!-- ── Frappe's half ─────────────────────────────────────────────────
         ⚠️ ONE BAND, THREE BLOCKS, and a rule above it. Everything below this
         line is Frappe talking rather than the customer's own work, and the
         single stroke says that once instead of three cards each announcing
         themselves. -->
    <div class="mt-12 border-t border-outline-gray-2 pt-8">
      <div class="grid gap-10 sm:grid-cols-2">
        <!-- Resources -->
        <section>
          <h2 class="text-base font-medium text-ink-gray-8">Resources</h2>
          <ul class="mt-3 space-y-3">
            <li v-for="r in RESOURCES" :key="r.title">
              <a
                :href="r.href"
                target="_blank"
                rel="noreferrer"
                class="group block"
              >
                <span class="flex items-center gap-1 text-p-base font-medium text-ink-gray-8 group-hover:underline">
                  {{ r.title }}
                  <IconExternal class="size-3.5 shrink-0 text-ink-gray-5" />
                </span>
                <span class="mt-0.5 block text-p-sm leading-relaxed text-ink-gray-6">
                  {{ r.body }}
                </span>
              </a>
            </li>
          </ul>
        </section>

        <!-- Events -->
        <!-- ⚠️ TWO, and the site lists six. The other four are Frappe Yatra
             dates from May and June — months past. See `data/home.js`. -->
        <section>
          <h2 class="text-base font-medium text-ink-gray-8">Upcoming events</h2>
          <ul class="mt-3 space-y-3">
            <li v-for="e in EVENTS" :key="e.title">
              <a :href="e.href" target="_blank" rel="noreferrer" class="group block">
                <span class="flex items-center gap-1 text-p-base font-medium text-ink-gray-8 group-hover:underline">
                  {{ e.title }}
                  <IconExternal class="size-3.5 shrink-0 text-ink-gray-5" />
                </span>
                <!-- ⚠️ The DATE leads the second line. An events list is read
                     for when before what, and the city is the third fact
                     rather than the second. -->
                <span class="mt-0.5 block text-p-sm leading-relaxed text-ink-gray-6">
                  {{ e.at }} · {{ e.body }}
                </span>
                <span class="block text-p-sm text-ink-gray-5">{{ e.where }}</span>
              </a>
            </li>
          </ul>
        </section>
      </div>

      <!-- Blog -->
      <section class="mt-10">
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="text-base font-medium text-ink-gray-8">From the Frappe blog</h2>
          <a
            href="https://frappe.io/blog"
            target="_blank"
            rel="noreferrer"
            class="shrink-0 text-p-sm text-ink-gray-6 underline hover:text-ink-gray-8"
          >
            All posts
          </a>
        </div>
        <!-- Rows with a rule between them, the shape every list in this app
             uses. The date is a column so three of them read down. -->
        <ul class="mt-2 divide-y divide-outline-gray-1">
          <li v-for="post in POSTS" :key="post.href">
            <a
              :href="post.href"
              target="_blank"
              rel="noreferrer"
              class="group flex items-baseline justify-between gap-4 py-3"
            >
              <span class="min-w-0">
                <span class="block text-p-base text-ink-gray-8 group-hover:underline">
                  {{ post.title }}
                </span>
                <span class="mt-0.5 block text-p-sm text-ink-gray-5">{{ post.author }}</span>
              </span>
              <span class="shrink-0 text-p-sm tabular-nums text-ink-gray-5">{{ post.at }}</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
