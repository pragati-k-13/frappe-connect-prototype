<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, ScrollArea } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import NewProjectDialog from '../components/NewProjectDialog.vue'
import ProjectRow from '../components/ProjectRow.vue'
import { useAuthGate } from '../utils/auth'
import { useConnectStore } from '../stores/connect'

// SCREEN — Implementation. Everything the account is tracking.
//
// ⚠️ A LIST, not a single project, and that is the decision this screen is
// built around. A business routinely has more than one thing on — a starter
// pack running while a custom piece is being scoped, an onboarding finished
// months before either — and a single-project screen would have had to pick one
// of them to be "the" project and hide the rest.
//
// It is also the rail's "Implementation" row, which was inert until now. The
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
  <ConnectShell root-label="Implementation" root-to="/connect/projects">
    <!-- ⚠️ NO TOP-BAR ACTION, and the gap it leaves is worth knowing about. This
         screen used to carry New project as the bar's trailing control, on the
         grounds that it was the one thing here that isn't opening a row.

         With it gone, the only New project button left is the EMPTY STATE's —
         so an account that already has one project has no way to start a second
         from this screen. That is survivable because starting a project is no
         longer something you come here to do: an inquiry makes one
         (`ContactPartnerDialog`), and so does booking a pack. The tracker
         tracks. But if a second door is ever wanted back, this is where it
         went, and the note below it is the argument for the bar over the page.
    -->
    <!-- 800 and `py-8`, matching the partner list and the pack catalogue. This
         app has one measure for a listing and this is it. -->
    <div class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
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
             version this replaces spent two of those lines naming the three
             services — "a starter pack, guided onboarding, or a partner of your
             own" — which is a menu, and a menu in an empty state is a decision
             demanded before anything exists to decide about.

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
             first opened with "Implementation" — which the top bar already
             says, in the same words, forty pixels above it. The other two
             listings in this app (partners, packs) carry a headline because
             neither top bar names what the list is FOR; this one does.

             What is left is the only thing a header can say that the rows
             cannot: how many there are, and which end is the new end. -->
        <p class="text-p-sm text-ink-gray-5">
          {{ ordered.length }} {{ ordered.length === 1 ? 'project' : 'projects' }}, newest first
        </p>

        <div class="mt-4">
          <ProjectRow v-for="p in ordered" :key="p.id" :project="p" />
        </div>
      </template>
    </div>

    <NewProjectDialog :open="creating" @close="creating = false" @create="create" />
  </ConnectShell>
</template>
