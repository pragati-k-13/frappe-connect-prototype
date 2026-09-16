<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge, Button, ScrollArea, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import BookSlotDialog from '../components/BookSlotDialog.vue'
import PackPanel from '../components/PackPanel.vue'
import ProjectPartnerPanel from '../components/ProjectPartnerPanel.vue'
import ProjectStages from '../components/ProjectStages.vue'
import IconArrowRight from '~icons/lucide/arrow-right'
import { logoFor } from '../data/logos'
import { modulesFor } from '../data/modules'
import { PARTNERS } from '../data/partners'
import { ONBOARDING } from '../data/onboarding'
import { DEFAULT_REGION, STARTER_PACKS, marketFor } from '../data/packs'
import { SERVICES, nextStage, serviceOf, stageOf, windowFor } from '../data/project'
import { useConnectStore } from '../stores/connect'
import { useContactPartner } from '../utils/contact'

// SCREEN — one project. Where it stands, who is doing it, and what it wants
// from you next.
//
// ⚠️ THE ORDER OF THIS PAGE IS THE DESIGN. Who → where → what next:
//
//   1  the partner, because "who is doing this" is the question a tracker is
//      opened with most often, and it is one short card
//   2  the progress bar and the stages, which is where you stand
//   3  inside the current stage, the checklist — what is needed from you
//
// The checklist is what the page is FOR, and it is third. That is deliberate:
// it lives inside the stage it belongs to rather than floating above the spine
// as a "next action" panel, because a task with no stage attached to it is a
// demand without a reason. The stage is open by default, so nothing is hidden —
// it is one scroll, not one click.
//
// ⚠️ A project with NO SERVICE has none of this. No partner, no spine, no
// window — so the page shows what it is, what it covers, and one decision. A
// progress bar over an undecided project would be inventing steps nobody has
// agreed to.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()
const { contactPartner } = useContactPartner()

const project = computed(() => store.projectBy(route.params.id))
const service = computed(() => serviceOf(project.value?.service))
const partner = computed(() => PARTNERS.find((p) => p.id === project.value?.partnerId) ?? null)
const pack = computed(() => STARTER_PACKS.find((p) => p.value === project.value?.pack) ?? null)
const stage = computed(() => stageOf(project.value?.service, project.value?.stage))
const timeWindow = computed(() => windowFor(project.value))

const region = computed(
  () => marketFor(store.filters.countries[0]) ?? store.answers.region[0] ?? DEFAULT_REGION,
)

// Whose second checklist column is. The partner's FIRST NAME once there is one
// — "Tridots is doing", not "Tridots Tech Pvt Ltd is doing", because this is a
// sentence about people you are working with — and Frappe before that, which
// during the custom spine's matching stages is literally true.
const otherParty = computed(() => partner.value?.name.split(' ')[0] ?? 'Frappe')

const fmtDate = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// ⚠️ TWO FACTS, AS A FRAGMENT, not four joined by middle dots. This line used
// to read "Starter pack · Started Aug 28 · 60-day validity · 42 days left":
// four facts of four different kinds at one weight, two of which (the service
// and the validity term) were already stated in the panel three inches to the
// right. The one that mattered — the countdown — came last and looked like the
// rest of them.
//
// The dot is gone with them. A two-item list joined by a comma is a sentence
// fragment; three or more joined by dots is a data dump wearing a line of type.
const summary = computed(() => {
  if (!project.value) return null
  const started = `started ${fmtDate(project.value.at)}`
  return service.value
    ? `${service.value.label}, ${started}`
    : started[0].toUpperCase() + started.slice(1)
})

// The countdown, lifted out of that line and given its own.
//
// ⚠️ It also SAYS WHAT THE DEADLINE IS FOR, which the bare term never did.
// "60-day validity" is the contract's name for the window; "42 days left to use
// the pack's 70 hours" is what the window means to the person reading it, and
// it costs the same line. The hours are real on both paths — a pack's `hours`
// and the onboarding program's three.
//
// Null for custom work and for an undecided project: no window has been agreed,
// and there is nothing honest to count down.
const countdown = computed(() => {
  const w = timeWindow.value
  if (!w) return null
  const hours = pack.value
    ? `the pack's ${pack.value.hours} hours`
    : `your ${ONBOARDING.totalHours} hours`
  // ⚠️ THREE STATES, not one line with a word swapped. A window running out and
  // a window that has run out are different facts and want different sentences:
  // the first is a countdown you can still act on, the second is a thing that
  // has happened to you, and the tail changes with it — "to use" becomes "were
  // not used", because they weren't.
  //
  // ⚠️ The colour is never the only signal. The words differ in all three
  // states, so nothing here depends on telling amber from grey.
  if (w.expired) {
    return {
      lead: 'Validity expired',
      tail: `on ${fmtDate(w.endsAt)} — ${hours} were not used`,
      tone: 'text-ink-red-7',
    }
  }
  return {
    lead: w.daysLeft === 1 ? '1 day left' : `${w.daysLeft} days left`,
    tail: `to use ${hours}`,
    tone: w.urgent ? 'text-ink-amber-7' : 'text-ink-gray-8',
  }
})

// ── No partner yet ──────────────────────────────────────────────────────────
// What the Partner panel says while it is empty.
//
// ⚠️ IT DESCRIBES THE PANEL, not the stage. The first version described the
// stage — "Frappe is matching you with partners who do this work, you pick from
// the ones who respond" — and on a custom project that put THREE accounts of
// the same process on one screen: this one, the stage's blurb ("Frappe puts
// your requirements in front of partners who do this kind of work"), and the
// stage's own sentence ("Frappe is matching you with partners in your
// industry, and passing on your requirements"). The stage is the right place
// for all of that. What only this panel can say is why it is empty and what
// fills it.
//
// ⚠️ The three services fill it differently, which is the other half of why
// this is not one string. Custom work is the only one where YOU choose; on a
// pack and on guided onboarding Frappe assigns, and promising a choice that
// never arrives is worse than saying nothing. `pick` gates the directory link
// on the same fact.
const awaitingPartner = computed(() => {
  if (project.value?.service === 'custom') {
    return { body: 'A partner joins here once you pick one of the firms that respond.', pick: true }
  }
  if (project.value?.service === 'onboarding') {
    return { body: 'A certified consultant joins here once Frappe assigns one.', pick: false }
  }
  return { body: 'A partner joins here once Frappe assigns one.', pick: false }
})

// What an undecided project covers, for the aside. The same module catalogue
// the estimate modal prices, so the two agree on what "Finance" contains.
const scopeRows = computed(() =>
  Object.entries(project.value?.modules ?? {}).flatMap(([app, keys]) => modulesFor(app, keys)),
)

// "Finance, Sales, Purchase, Inventory, Manufacturing and HR." The section's
// subtitle used to say "What this project covers." above a row of pills; the
// sentence covers both jobs, so the subtitle went with the pills.
const scopeLine = computed(() => {
  const names = scopeRows.value.map((m) => m.label)
  if (!names.length) return ''
  if (names.length === 1) return `${names[0]}.`
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}.`
})

// ── Acting on a task ────────────────────────────────────────────────────────
const booking = ref(false)

// ⚠️ The task's `action` names a KIND, not a handler — the data layer knows a
// task needs a slot booked, and this is the screen that knows what booking a
// slot looks like here. Adding a kind to `data/project.js` without a case
// below leaves the button inert, so the default says so rather than swallowing
// the press.
const act = (task) => {
  if (!project.value) return
  if (task.action === 'book-slot') {
    // ⚠️ Needs a partner, and the custom spine has tasks that run before there
    // is one. Nothing today reaches this without a partner, but the guard is
    // what stops the dialog being opened on `null` the first time one does.
    if (!partner.value) return toast.info('No partner on this project yet')
    return (booking.value = true)
  }
  if (task.action === 'message') {
    if (!partner.value) return toast.info('No partner on this project yet')
    return contactPartner(partner.value)
  }
  if (task.action === 'partners') return router.push('/connect/partners')
  if (task.action === 'packs') return router.push('/connect/packs')
  if (task.action === 'scope') {
    // For a pack, the scope is the panel already standing beside this page, so
    // the honest answer is to say where it is rather than open a second copy
    // of it in a dialog.
    if (pack.value) {
      return toast.info('The full scope is in the panel', {
        description: `Everything the ${pack.value.name} pack covers, beside this page.`,
      })
    }
    return toast.info('Editing scope is not built yet', {
      description: 'This is where you would change what the project covers.',
    })
  }
  toast.info('Not built yet')
}

// Requesting a slot RECORDS it on the project, which is the change that made
// `BookSlotDialog` worth wiring up: before this it emitted only `close` and the
// request vanished into a toast. The stage can now say what it is waiting for.
//
// ⚠️ It does NOT advance the stage, and it ticks the task rather than the
// stage moving on. Requesting is not attending — the two pack stages either
// side (`confirmed`, `intro-call`) are separated by exactly that difference.
const onBooked = (slot) => {
  store.recordSlot(project.value.id, slot)
  const task = stage.value?.yours?.find((t) => t.action === 'book-slot')
  if (task && !project.value.done.includes(task.key)) store.toggleTask(project.value.id, task.key)
}

const toggleTask = (key) => store.toggleTask(project.value.id, key)

// ⚠️ Advancing is the CUSTOMER saying their side is done, not the system
// deciding. It is offered once every one of your tasks is ticked, and it is an
// offer rather than an automatic move: finishing your last task and having the
// page jump out from under you is worse than pressing a button that says what
// it will do.
const yoursDone = computed(() => {
  const yours = stage.value?.yours ?? []
  return yours.length > 0 && yours.every((t) => project.value.done.includes(t.key))
})

// Where "Everything on my side is done" goes next, so the button can name it.
// Null on the last stage, where the button is not offered at all — it used to
// appear there and toast "That was the last stage", which is a control
// admitting it had nothing to do.
const next = computed(() => nextStage(project.value?.service, project.value?.stage))

// ⚠️ The label NAMES THE DESTINATION and the toast repeats it back in the past
// tense: "Move to Implementation" → "Moved to Implementation". It used to read
// "Everything on my side is done", which is a description of a state rather
// than an action, and it produced a toast that shared not one word with it — so
// nothing confirmed that the thing you pressed was the thing that happened. The
// caption underneath ("Moves the project to the next stage") was repair work
// for a label that should have said so itself, and it is gone.
const advance = () => {
  const moved = store.advanceStage(project.value.id)
  if (moved) toast.success(`Moved to ${moved.label}`)
}

const chooseService = (value) => {
  store.chooseService(project.value.id, value)
  // A pack is the one service that needs a second choice — WHICH pack — and
  // the catalogue is where that is made. The others have nothing left to pick.
  if (value === 'pack') router.push('/connect/packs')
}
</script>

<template>
  <!-- `flush`, because the pack panel is part of the CHROME rather than a card
       in the page: it runs the full height beside the content with its own
       scroll. Same frame the Confirmed and Messages screens use. -->
  <ConnectShell
    flush
    root-label="Implementation"
    root-to="/connect/projects"
    :crumb="project?.name ?? 'Project'"
  >
    <div class="flex min-h-0 min-w-0 flex-1">
      <ScrollArea class="min-h-0 min-w-0 flex-1">
        <div class="w-full px-5 py-8 lg:px-8">
          <!-- An id that names nothing. Same shape as the Confirmed screen's,
               and the same reasoning: a forwarded or stale link should land
               somewhere it can be recovered from. -->
          <div v-if="!project" class="py-20 text-center">
            <p class="text-p-lg font-medium text-ink-gray-8">No such project</p>
            <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
              This link doesn't name anything you're tracking.
            </p>
            <Button
              class="mt-4"
              variant="solid"
              label="See what's under way"
              route="/connect/projects"
            />
          </div>

          <!-- ⚠️ Capped at 700px and centred, rather than filling the column.
               The pane can carry a fixed 352px panel at the right, so on a wide
               window the rest runs past 900px and every line of body copy
               stretches across it. `mx-auto` keeps the block off the panel's
               edge instead of leaving all the slack on one side. -->
          <div v-else class="mx-auto w-full max-w-[700px]">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 class="text-lg font-semibold text-ink-gray-8">{{ project.name }}</h1>
              <Badge
                v-if="stage"
                variant="subtle"
                :theme="stage.theme"
                size="sm"
                :label="stage.label"
              />
            </div>
            <p class="mt-1 text-p-base text-ink-gray-6">{{ summary }}</p>

            <!-- The only time-sensitive thing on the page, so it gets a line
                 rather than fourth place in a list of four. The number carries
                 the weight; what it is for stays quiet beside it. -->
            <!-- ⚠️ `gap-x-1` on a flex, not a space between the two spans.
                 Vue's compiler condenses the whitespace between elements on
                 their own lines to nothing, so the two ran together as
                 "42 days leftto use the pack's 70 hours". Same trap the
                 Confirmed screen's activity feed hit and solved the same way. -->
            <p v-if="countdown" class="mt-3 flex flex-wrap items-baseline gap-x-1 text-p-base">
              <span class="font-medium" :class="countdown.tone">{{ countdown.lead }}</span>
              <span class="text-ink-gray-6">{{ countdown.tail }}</span>
            </p>

            <!-- ── No service yet ──────────────────────────────────────────
                 The whole screen for an undecided project: one decision, with
                 the three ways of making it. No progress bar, no stages, no
                 partner — none of them exist yet, and drawing any of them
                 would be the page inventing a commitment.

                 ⚠️ Three rows rather than three cards. They are a list of
                 options to read down, not things to compare feature by
                 feature — the packs page already does the comparison, and
                 these rows link into it. -->
            <section v-if="!project.service" class="mt-8">
              <h2 class="text-base font-medium text-ink-gray-8">Choose how to implement</h2>
              <p class="mt-1 text-p-base text-ink-gray-6">
                Nothing starts, and no timeline runs, until this is decided.
              </p>

              <ul
                class="mt-4 divide-y divide-outline-gray-1 rounded-6 border border-outline-gray-1"
              >
                <li
                  v-for="s in SERVICES"
                  :key="s.value"
                  class="flex items-center gap-4 px-4 py-3.5"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-p-base font-medium text-ink-gray-8">{{ s.label }}</p>
                    <p class="mt-0.5 text-p-sm text-ink-gray-6">{{ s.summary }}</p>
                  </div>
                  <Button
                    class="shrink-0"
                    variant="subtle"
                    size="sm"
                    label="Choose"
                    @click="chooseService(s.value)"
                  >
                    <template #suffix><IconArrowRight class="size-3.5" /></template>
                  </Button>
                </li>
              </ul>
            </section>

            <template v-else>
              <!-- ⚠️ The partner USED TO OPEN THIS COLUMN, as a bordered card
                   with a logo, a tier badge, four facts and two buttons. It was
                   the heaviest thing on the page and the least actionable, and
                   it pushed the checklist — the reason anyone opens a project —
                   below it as unbordered grey text.

                   It lives in the rail now, beside the pack, because both are
                   the same kind of thing: reference you check, not work you do.
                   Below `lg` there is no rail, so this copy stands in — placed
                   HERE, above the stages, and not with the pack panel at the
                   foot of the page, because "who is doing this" is a question
                   you ask before you read the stages and not after. -->
              <div class="-mx-5 mt-6 border-y border-outline-gray-1 lg:hidden">
                <ProjectPartnerPanel
                  :partner="partner"
                  :awaiting="awaitingPartner"
                  @message="contactPartner(partner)"
                  @book="booking = true"
                />
              </div>

              <!-- ── Where, and what next ─────────────────────────────────
                   ⚠️ `mt-8` now, not `mt-10`. The 40px was separating the spine
                   from a partner card that is no longer above it — with the
                   card gone the column runs title → summary → countdown →
                   spine, and those are closer to one subject than the old
                   arrangement was. -->
              <div class="mt-8">
                <ProjectStages
                  :project="project"
                  :other-party="otherParty"
                  @toggle="toggleTask"
                  @act="act"
                />
              </div>

              <!-- ⚠️ Appears only when YOUR side of the current stage is
                   complete AND there is a stage to move to. An always-present
                   "Next stage" button would be an invitation to skip work; an
                   automatic jump the moment the last box is ticked moves the
                   page out from under the hand that ticked it.

                   The label names the destination and the toast repeats it —
                   "Move to Implementation" → "Moved to Implementation". No
                   caption: the label says what it does. -->
              <div v-if="yoursDone && next" class="mt-6">
                <Button variant="solid" :label="`Move to ${next.label}`" @click="advance" />
              </div>

              <!-- Below `lg` the panel stacks under the page instead of beside
                   it: a 352px column next to a 352px column is not a layout.
                   `-mx-5` cancels the page padding so its rules run edge to
                   edge. -->
              <div v-if="pack" class="-mx-5 mt-10 border-t border-outline-gray-1 lg:hidden">
                <PackPanel heading="Booked service" :pack="pack" :region="region" />
              </div>
            </template>

            <!-- The scope, for a project with no pack behind it. A pack IS its
                 scope and gets the panel; everything else carries a module
                 list, and an undecided project usually has nothing else. -->
            <section v-if="!pack && scopeRows.length" class="mt-10">
              <h2 class="text-base font-medium text-ink-gray-8">Scope</h2>
              <!-- ⚠️ A SENTENCE, not a row of pills. The pills were the only
                   fully-round shape in the app and they appeared exactly here,
                   which made them an orphan vocabulary rather than a device —
                   a border and a radius wrapped around six single words.
                   Naming six modules is what a comma is for. -->
              <p class="mt-2 text-p-base text-ink-gray-7">{{ scopeLine }}</p>
            </section>
          </div>
        </div>
      </ScrollArea>

      <!-- The pack, in full, beside the page. Only for a pack project — there
           is no equivalent document for custom work, and the onboarding
           program's own page is a click away on the landing screen. -->
      <!-- ⚠️ The rail now stands for ANY project with a service, not only a
           pack. It used to be `v-if="pack"`, which was right while the pack was
           the only reference material on the screen; the partner moved in
           beside it, and an onboarding or a custom project has a partner
           without having a pack.

           Two panels, no divider between them: each carries its own sticky
           header strip, and those headers are what say where one ends and the
           next begins. A rule as well would be a second answer to a question
           already answered — see "No dividers between a page's own sections"
           in DESIGN-NOTES.

           Partner first. It is the shorter panel and the more often asked
           question, and the pack below it is long enough to scroll. -->
      <aside
        v-if="project?.service"
        class="hidden w-[352px] shrink-0 flex-col border-l border-outline-gray-1 lg:flex"
      >
        <ScrollArea class="min-h-0 flex-1">
          <ProjectPartnerPanel
            :partner="partner"
            :awaiting="awaitingPartner"
            @message="contactPartner(partner)"
            @book="booking = true"
          />
          <PackPanel v-if="pack" heading="Booked service" :pack="pack" :region="region" />
        </ScrollArea>
      </aside>
    </div>

    <BookSlotDialog
      v-if="partner"
      :open="booking"
      :partner="partner"
      @book="onBooked"
      @close="booking = false"
    />
  </ConnectShell>
</template>
