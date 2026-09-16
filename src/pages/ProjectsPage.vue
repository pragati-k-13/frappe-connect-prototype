<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, ScrollArea } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import NewProjectDialog from '../components/NewProjectDialog.vue'
import ProjectRow from '../components/ProjectRow.vue'
import IconPlus from '~icons/lucide/plus'
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
    <!-- The top bar's trailing control. New project belongs there rather than
         in the page: it is the one thing this screen does that isn't opening a
         row, and in the page it would sit either above the list (competing with
         the heading) or below it (below the fold, on an account with four
         projects). -->
    <template #action>
      <Button variant="ghost" class="-mr-2" label="New project" @click="startNew">
        <template #prefix><IconPlus class="size-4" /></template>
      </Button>
    </template>

    <!-- 800 and `py-8`, matching the partner list and the pack catalogue. This
         app has one measure for a listing and this is it. -->
    <div class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
      <!-- ── Empty ───────────────────────────────────────────────────────
           ⚠️ Two doors, and the order is the argument. Most people arrive here
           with a rough idea and no decision, so "New project" is the solid one
           — write down what you want, decide how to build it later. Browsing
           packs is the subtle one beside it, for someone who already knows they
           want a fixed scope.

           The old flow had only the second door, which meant the only way to
           have a project was to buy something. -->
      <div v-if="!ordered.length" class="py-20 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">Nothing under way</p>
        <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
          A project is what you want built. Start one now and decide how to have it implemented — a
          starter pack, guided onboarding, or a partner of your own — when you are ready.
        </p>
        <div class="mt-4 flex items-center justify-center gap-2">
          <Button variant="solid" label="New project" @click="startNew" />
          <Button variant="subtle" label="See the packs" route="/connect/packs" />
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
