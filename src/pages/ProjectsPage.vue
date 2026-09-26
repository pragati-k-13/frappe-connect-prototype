<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, ScrollArea } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import NewProjectDialog from '../components/NewProjectDialog.vue'
import ProjectRow from '../components/ProjectRow.vue'
import { useAuthGate } from '../utils/auth'
import { useConnectStore } from '../stores/connect'

// SCREEN — Projects. Everything the account is tracking.
//
// ⚠️ A LIST, not a single project, and that is the decision this screen is
// built around. A business routinely has more than one thing on — a starter
// pack running while a custom piece is being scoped, a project finished
// months before either — and a single-project screen would have had to pick one
// of them to be "the" project and hide the rest.
//
// It is also the rail's "Projects" row, which was inert until now. The
// row exists in `ConnectShell` for exactly this destination.
const store = useConnectStore()
const router = useRouter()
const { requireAccount } = useAuthGate()

const projects = computed(() => store.projects)

// ⚠️ Newest FIRST, which is the opposite of the order the store holds them in.
// The store appends, because that is what a log does; a list of live work is
// read from the top, and the thing you started most recently is the thing you
// are most likely to be coming back to.
const ordered = computed(() => [...projects.value].reverse())

const creating = ref(false)

// Gated, like every other control that writes to an account. Signed out, this
// sends them to sign up carrying `?next=` back here, and the dialog opens once
// they land — see `holdUntilLogin`.
const startNew = () => requireAccount(() => (creating.value = true))

// Straight into the project it made. A new project is one decision away from
// being useful and the list has nothing to add — leaving the reader on the
// index to find the row they just created is a step that exists only because
// the code was easier to write that way.
const create = (details) => {
  creating.value = false
  router.push(`/connect/projects/${store.createProject(details)}`)
}
</script>

<template>
  <ConnectShell root-label="Projects" root-to="/connect/projects">
    <!-- ⚠️ NO TOP-BAR ACTION, and that part still holds. New project lived here
         as the bar's trailing control on the grounds that it was the one thing
         on this screen that isn't opening a row; it sits on the list's own
         header line instead, where it is next to the thing it adds to rather
         than in the chrome above it. The bar is where you are, not what you can
         do to it. See the note on that row for why the button itself came back.
    -->
    <!-- 800 and `py-8`, matching the partner list and the pack catalogue. This
         app has one measure for a listing and this is it. -->
    <div class="fc-page-list py-8">
      <!-- ── Empty ───────────────────────────────────────────────────────
           ⚠️ ONE DOOR. It had two — New project beside a subtle "See the packs"
           — and the second was answering a question this screen isn't asking.
           An empty state has one job: get the first thing made. A second button
           pointing at a catalogue turns that into a choice between starting and
           shopping, and the catalogue already has its own place in the rail.

           ⚠️ Worth knowing what the pack door was FOR, before it comes back: the
           flow once had only that one, which meant the only way to have a
           project was to buy something. Starting without buying is now the
           default rather than the alternative, so the alternative stopped
           needing to be argued for here. -->
      <div v-if="!ordered.length" class="py-20 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">Nothing under way</p>
        <!-- ⚠️ ONE SENTENCE, and it took four lines to work out which one. The
             version this replaces spent two of those lines naming the
             services on offer, which is a menu — and a menu in an empty state
             is a decision demanded before anything exists to decide about.

             What is left is the only thing neither the heading nor the button
             says: that you can start without having chosen. That is the whole
             reason this screen has a New project button at all. -->
        <p class="mx-auto mt-1.5 max-w-xs text-p-base text-ink-gray-6">
          A project is what you want built. How it gets built is a later decision.
        </p>
        <div class="mt-4">
          <Button variant="solid" label="New project" @click="startNew" />
        </div>
      </div>

      <template v-else>
        <!-- ⚠️ NO `<h1>`, and that is the second version of this screen. The
             first opened with "Projects" — which the top bar already
             says, in the same words, forty pixels above it. The other two
             listings in this app (partners, packs) carry a headline because
             neither top bar names what the list is FOR; this one does.

             What is left is the only thing a header can say that the rows
             cannot: how many there are, and which end is the new end. -->
        <!-- ⚠️ THE SECOND DOOR IS BACK, and the note above the template is the
             argument it lost. "Starting a project is not something you come
             here to do" was true of a tracker whose projects all arrived from
             somewhere else — a booking, an inquiry — but this list is now the
             index of everything, reached from a rail row called Projects, and a
             screen that lists a kind of thing and cannot make one is a screen
             with a hole in it. The empty state has always had this button; it
             disappeared the moment the first project existed, which is the one
             moment it starts being needed regularly.

             ⚠️ NOT THE HOME SCREEN'S `+`, deliberately. That one opens the
             three questions and ends in a recommendation; this one opens
             `NewProjectDialog` and ends in a project with no service yet. Two
             different gestures, so two different shapes: an icon there, a named
             button here. If they are ever meant to be one thing, that is a
             decision about the flow, not about this row.

             `subtle`, not `solid`: the empty state's button is the only thing
             on the screen and earns the fill; here it sits above a list whose
             rows are what the reader came for. -->
        <div class="flex items-center justify-between gap-4">
          <p class="text-p-sm text-ink-gray-5">
            {{ ordered.length }} {{ ordered.length === 1 ? 'project' : 'projects' }}, newest first
          </p>
          <Button variant="subtle" size="sm" label="New project" @click="startNew" />
        </div>

        <div class="mt-4">
          <ProjectRow v-for="p in ordered" :key="p.id" :project="p" />
        </div>
      </template>
    </div>

    <NewProjectDialog :open="creating" @close="creating = false" @create="create" />
  </ConnectShell>
</template>
