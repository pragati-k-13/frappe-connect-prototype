<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge, Button, Dialog, Dropdown, ScrollArea, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import FeedbackDialog from '../components/FeedbackDialog.vue'
import BriefDetailsDialog from '../components/BriefDetailsDialog.vue'
import HirePartnerDialog from '../components/HirePartnerDialog.vue'
import NewProjectDialog from '../components/NewProjectDialog.vue'
import PackScopeDialog from '../components/PackScopeDialog.vue'
import PackTermsDialog from '../components/PackTermsDialog.vue'
import ProjectAbout from '../components/ProjectAbout.vue'
import ProjectBids from '../components/ProjectBids.vue'
import RecommendationView from '../components/RecommendationView.vue'
import ProjectStages from '../components/ProjectStages.vue'
import RatePartnerDialog from '../components/RatePartnerDialog.vue'
import IconCalendar from '~icons/lucide/calendar'
import IconMore from '~icons/lucide/ellipsis'
import { PARTNERS } from '../data/partners'
import { DEFAULT_REGION, STARTER_PACKS, marketFor } from '../data/packs'
import {
  FRAPPE_CLOUD_PARTNER_URL,
  FRAPPE_CLOUD_URL,
  isDraft,
  isStageDone,
  nextStage,
  partnerCodeFor,
  stageOf,
  windowFor,
} from '../data/project'
import { sharedAnswers } from '../data/company'
import { useConnectStore } from '../stores/connect'
import { useContactPartner } from '../utils/contact'

// SCREEN — one project. Where it stands, and what it wants from you next.
//
// ⚠️ THE WORK ON THE LEFT, THE REFERENCE ON THE RIGHT. The column is the
// title, the step you are at, its tasks and the button that moves on. Who the
// partner is, what was bought and where to get help are facts you check, not
// things you do, so they are the rail — `ProjectAbout`.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()
// ⚠️ `messagePartner`, NOT `contactPartner`. This page's partner is the firm
// already building this project, so there are no requirements to collect —
// see the note in `utils/contact.js`.
const { messagePartner } = useContactPartner()

const project = computed(() => store.projectBy(route.params.id))
const partner = computed(() => PARTNERS.find((p) => p.id === project.value?.partnerId) ?? null)
// ⚠️ A LIST. A project holds several packs — they are disjoint modules and
// the recommendation ticks more than one.
const packs = computed(() =>
  (project.value?.packs ?? []).map((v) => STARTER_PACKS.find((p) => p.value === v)).filter(Boolean),
)
const stage = computed(() => stageOf(project.value?.service, project.value?.stage))
const region = computed(() => marketFor(store.company.country) ?? DEFAULT_REGION)

const fmtDate = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

// The one time-sensitive fact, under the title. A pack counts down its
// validity; custom work shows the accepted quote's timeline, and nothing
// before one is accepted.
//
// ⚠️ The colour is never the only signal. The words differ between running,
// urgent and expired, so nothing depends on telling amber from grey.
const when = computed(() => {
  if (project.value?.completedAt)
    return { text: `Completed ${fmtDate(project.value.completedAt)}`, tone: 'text-ink-gray-7' }
  const w = windowFor(project.value)
  if (w) {
    if (w.expired)
      return { text: `Validity expired on ${fmtDate(w.endsAt)}`, tone: 'text-ink-red-7' }
    return {
      text: w.daysLeft === 1 ? '1 day left' : `${w.daysLeft} days left`,
      tone: w.urgent ? 'text-ink-amber-7' : 'text-ink-gray-7',
    }
  }
  const hired = (project.value?.bids ?? []).find((b) => b.partnerId === project.value?.partnerId)
  return hired ? { text: `${hired.weeks} weeks`, tone: 'text-ink-gray-7' } : null
})

const reviewed = computed(() => store.feedback.some((f) => f.projectId === project.value?.id))

// The requirements as they went out — the copy carried in the partners'
// threads, so the business reads exactly what the partners read.
// Before they have been sent, the project's own saved requirements, in the
// same shape.
const brief = computed(() => {
  const sent = store.threads
    .flatMap((t) => t.messages ?? [])
    .find((m) => m.brief?.projectId === project.value?.id)?.brief
  if (sent) return sent
  const own = project.value?.brief
  if (!own?.scope) return null
  const company = project.value.answers ?? store.company
  return {
    ...own,
    modules: project.value.modules ?? {},
    country: company.country,
    employees: company.employees,
    segments: company.segments,
    ...sharedAnswers(company),
  }
})
const briefOpen = ref(false)

// ── A draft ─────────────────────────────────────────────────────────────────
// Editable and deletable until it starts — see `isDraft`.
const draft = computed(() => isDraft(project.value))
const editing = ref(false)
const deleting = ref(false)

const saveDraft = (details) => {
  store.updateDraft(project.value.id, details)
  editing.value = false
  toast.success('Draft saved')
}

// Starting it. Booking goes through the checkout, which turns this draft into
// the pack project (`bookingFor`); sharing makes it custom work in place.
const bookDraft = () => {
  store.bookPacksFor(project.value.id, project.value.packs)
  router.push({ name: 'checkout' })
}

const shareDraft = () => {
  const result = store.broadcastBrief(project.value.id)
  if (!result) return
  toast.success(`Sent to ${result.sent} ${result.sent === 1 ? 'partner' : 'partners'}`, {
    description: 'Their quotes arrive in Messages and on this page.',
  })
}

const deleteDraft = () => {
  const name = project.value.name
  if (!store.deleteDraft(project.value.id)) return
  deleting.value = false
  router.push('/connect/projects')
  toast.success(`${name} deleted`)
}

const menu = computed(() => [
  ...(draft.value
    ? [
        { label: 'Edit draft', icon: 'lucide-pencil', onClick: () => (editing.value = true) },
        { label: 'Delete draft', icon: 'lucide-trash-2', onClick: () => (deleting.value = true) },
      ]
    : []),
])

// ── Acting on a task ────────────────────────────────────────────────────────
const rating = ref(false)
const feedback = ref(false)
const termsOpen = ref(false)
const scopeOpen = ref(false)
const openScope = () => (scopeOpen.value = true)

// ⚠️ ONE-WAY, AND RECORDED BY THE ACT. Completion is written by the thing that
// completed it — a box ticked in consent, a link followed, a code copied, a
// dialog confirmed — never by a hand on a status mark.
const tick = (key) => store.completeTask(project.value.id, key)
const tickByAction = (action) => {
  const task = (stage.value?.yours ?? []).find((t) => t.action === action)
  if (task) tick(task.key)
}

const copyCode = async (task) => {
  // ⚠️ Needs a partner: the code is what bills the site to THEM.
  if (!partner.value) return toast.info('Hire a partner first')
  const code = partnerCodeFor(project.value, partner.value)
  try {
    await navigator.clipboard.writeText(code)
    toast.success('Referral code copied', { description: code })
  } catch {
    toast.info(`Your referral code is ${code}`, {
      description: 'Your browser blocked the clipboard. Copy it from here.',
    })
  }
  tick(task.key)
}

// ⚠️ The task's `action` names a KIND, not a handler. Adding a kind to
// `data/project.js` without a case below leaves the button inert, so the
// default says so rather than swallowing the press.
const act = (task) => {
  if (!project.value) return
  switch (task.action) {
    case 'terms':
      return tick(task.key)
    case 'fc-login':
      window.open(FRAPPE_CLOUD_URL, '_blank', 'noopener')
      return tick(task.key)
    case 'copy-code':
      return copyCode(task)
    case 'fc-link':
      window.open(FRAPPE_CLOUD_PARTNER_URL, '_blank', 'noopener')
      return tick(task.key)
  }
  toast.info('Not built yet')
}

const termsAgreed = computed(() => (project.value?.done ?? []).includes('agree-terms'))

// ── Hiring, on custom work ──────────────────────────────────────────────────
// ⚠️ TWO REFS, NOT ONE. The record stays until another Hire replaces it, so the
// dialog's title does not empty out while it fades.
const chosen = ref(null)
const hiring = ref(false)
const chosenBid = computed(
  () => (project.value?.bids ?? []).find((b) => b.partnerId === chosen.value?.id) ?? null,
)

const choose = (partnerRecord) => {
  chosen.value = partnerRecord
  hiring.value = true
}

// ⚠️ THE TERMS AND THE HIRE ARE ONE ACT. `HirePartnerDialog` collects the
// agreement before the commitment, and `termsAt` records that it happened.
const hire = () => {
  if (!chosen.value) return
  store.choosePartner(project.value.id, chosen.value.id)
  // ⚠️ HIRING ENDS THE STAGE, so it moves on by itself. The stage has no tasks
  // of its own — the hire was all of it — and leaving somebody on an empty step
  // with a "Confirm and continue" button asks them to confirm what they just did.
  store.advanceStage(project.value.id)
  toast.success(`${chosen.value.name} is your partner`)
}

const recordWhy = (why) => store.setChooseReason(project.value.id, why)

// ── Moving on ───────────────────────────────────────────────────────────────
// Optional tasks do not hold the step up — see `isStageDone`.
const yoursDone = computed(() => isStageDone(stage.value, project.value))
const next = computed(() => nextStage(project.value?.service, project.value?.stage))

// ⚠️ ALWAYS SHOWN WHILE THERE IS A NEXT STEP, disabled until the required
// tasks are done. A button that appears only once it works hides what the step
// is waiting for.
const advance = () => {
  const moved = store.advanceStage(project.value.id)
  if (moved) toast.success(`Moved to ${moved.label}`)
}

const finishSetup = () => {
  store.finishSetup(project.value.id)
  toast.success('Setup done')
}

// The project ends when the business says the work is done, and that is the
// moment the public review is asked for.
const complete = () => {
  store.completeProject(project.value.id)
  toast.success('Project completed')
  if (partner.value) rating.value = true
}
</script>

<template>
  <!-- `flush`, because the rail is part of the CHROME rather than a card in the
       page: it runs the full height beside the content with its own scroll. -->
  <ConnectShell
    flush
    root-label="Projects"
    root-to="/connect/projects"
    :crumb="project?.name ?? 'Project'"
  >
    <div class="flex min-h-0 min-w-0 flex-1">
      <ScrollArea class="min-h-0 min-w-0 flex-1">
        <div class="w-full px-5 py-8 lg:px-8">
          <!-- An id that names nothing: a forwarded or stale link should land
               somewhere it can be recovered from. -->
          <div v-if="!project" class="py-20 text-center">
            <p class="text-lg font-medium text-ink-gray-8">No such project</p>
            <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
              This link doesn't match any of your projects.
            </p>
            <Button class="mt-4" variant="solid" label="Go to projects" route="/connect/projects" />
          </div>

          <!-- ⚠️ Capped at 700px and centred, so body copy does not stretch
               across a wide pane beside the rail. A draft has no rail — the
               recommendation carries its own — so it takes the recommendation
               screen's 1080px. -->
          <div v-else class="mx-auto w-full" :class="draft ? 'max-w-[1080px]' : 'max-w-[700px]'">
            <!-- ⚠️ THE TITLE IS THE RAIL'S HEADING on a started project — the
                 name heads the facts about it, and the column opens on the
                 work. A draft has no rail, and below `lg` the rail stacks at
                 the foot of the page, so both keep the title here. -->
            <div class="flex items-start justify-between gap-4" :class="draft ? '' : 'lg:hidden'">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h1 class="text-lg font-semibold text-ink-gray-8">{{ project.name }}</h1>
                  <Badge v-if="draft" variant="subtle" theme="gray" size="md" label="Draft" />
                </div>
                <p v-if="when" class="mt-2 flex items-center gap-1.5 text-base" :class="when.tone">
                  <IconCalendar class="size-4 shrink-0 text-ink-gray-6" aria-hidden="true" />
                  {{ when.text }}
                </p>
              </div>
              <Dropdown v-if="menu.length" :options="menu" align="end">
                <Button variant="subtle" aria-label="Project actions">
                  <template #icon><IconMore class="size-4" /></template>
                </Button>
              </Dropdown>
            </div>

            <template v-if="stage">
              <div class="mt-10" :class="draft ? '' : 'lg:mt-0'">
                <ProjectStages :project="project" @act="act" @terms="termsOpen = true" />
              </div>

              <!-- ⚠️ THE QUOTES, WHILE CHOOSING AND NOBODY IS HIRED YET. Once
                   somebody is, the decision is made and the partner is in the
                   rail; a comparison table would be a control for a choice
                   already taken. -->
              <div
                v-if="project.stage === 'choosing' && project.broadcast && !project.partnerId"
                class="mt-6"
              >
                <ProjectBids :project="project" @choose="choose" />
              </div>

              <!-- ⚠️ NOT ON A STEP WITHOUT TASKS. Choosing a partner is the one,
                   and hiring moves it on by itself — see `hire`. -->
              <div v-if="next && stage.yours?.length" class="mt-4">
                <Button
                  variant="solid"
                  label="Continue"
                  :disabled="!yoursDone"
                  @click="advance"
                />
              </div>
              <!-- The last step's Continue finishes setup: the project is then
                   under way until the business says the work is done. -->
              <div v-else-if="!next && !project.setupDoneAt" class="mt-4">
                <Button
                  variant="solid"
                  label="Continue"
                  :disabled="!yoursDone"
                  @click="finishSetup"
                />
              </div>
              <div v-else-if="!project.completedAt" class="mt-4">
                <Button variant="solid" label="Mark as complete" @click="complete" />
              </div>
            </template>
            <!-- ⚠️ A DRAFT IS ITS RECOMMENDATION: the recommendation screen,
                 driven by this project's answers, basket and requirements.
                 Booking or sharing is what starts it. -->
            <RecommendationView
              v-else
              class="mt-8"
              :answers="project.answers ?? store.company"
              :brief="project.brief ?? {}"
              :packs="project.packs ?? []"
              :show-feedback="false"
              @toggle-pack="store.toggleDraftPack(project.id, $event)"
              @update-brief="store.updateDraftBrief(project.id, $event)"
              @checkout="bookDraft"
              @share="shareDraft"
              @edit-answers="editing = true"
            >
              <template #header="{ headline }">
                <h2 class="text-xl font-semibold text-ink-gray-9">{{ headline }}</h2>
              </template>
            </RecommendationView>

            <!-- Below `lg` there is no rail, so the reference stacks under the
                 work. `-mx-5` cancels the page padding so its rules run edge to
                 edge. -->
            <div v-if="!draft" class="-mx-5 mt-10 border-t border-outline-gray-1 lg:hidden">
              <ProjectAbout
                :project="project"
                :packs="packs"
                :partner="partner"
                :region="region"
                @scope="openScope"
                :has-brief="Boolean(brief)"
                @requirements="briefOpen = true"
                :can-review="Boolean(project?.completedAt && !reviewed)"
                :when="project?.completedAt ? when : null"
                @message="messagePartner(partner)"
                @review="rating = true"
                @feedback="feedback = true"
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      <aside
        v-if="project && !draft"
        class="hidden w-[352px] shrink-0 flex-col border-l border-outline-gray-1 lg:flex"
      >
        <ScrollArea class="min-h-0 flex-1">
          <ProjectAbout
            :project="project"
            :packs="packs"
            :partner="partner"
            :region="region"
            @scope="openScope"
            :has-brief="Boolean(brief)"
            @requirements="briefOpen = true"
            :can-review="Boolean(project?.completedAt && !reviewed)"
            :when="project?.completedAt ? when : null"
            @message="messagePartner(partner)"
            @review="rating = true"
            @feedback="feedback = true"
          />
        </ScrollArea>
      </aside>
    </div>

    <PackTermsDialog
      v-model:open="termsOpen"
      :region="region"
      :agreed="termsAgreed"
      @agree="tick('agree-terms')"
    />
    <PackScopeDialog v-model:open="scopeOpen" :packs="packs" />
    <RatePartnerDialog v-model:open="rating" :project="project" :partner="partner" />
    <FeedbackDialog v-model:open="feedback" />
    <NewProjectDialog
      :open="editing"
      :draft="draft ? project : null"
      @close="editing = false"
      @create="saveDraft"
    />
    <!-- ⚠️ CONFIRMED, because it cannot be undone. -->
    <Dialog
      v-model="deleting"
      title="Delete draft?"
      :message="`${project?.name ?? 'This draft'} and its requirements will be deleted.`"
      size="sm"
      :actions="[{ label: 'Delete', variant: 'solid', theme: 'red', onClick: deleteDraft }]"
    />
    <BriefDetailsDialog v-model:open="briefOpen" :brief="brief" own />
    <HirePartnerDialog
      v-model:open="hiring"
      :partner="chosen"
      :bid="chosenBid"
      @hire="hire"
      @why="recordWhy"
    />
  </ConnectShell>
</template>
