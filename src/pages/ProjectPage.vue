<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Alert, Avatar, Button, Dialog, Dropdown, ScrollArea, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import BriefDetailsDialog from '../components/BriefDetailsDialog.vue'
import HirePartnerDialog from '../components/HirePartnerDialog.vue'
import NewProjectDialog from '../components/NewProjectDialog.vue'
import PackScopeDialog from '../components/PackScopeDialog.vue'
import PackTermsDialog from '../components/PackTermsDialog.vue'
import ProjectAbout from '../components/ProjectAbout.vue'
import ProjectBids from '../components/ProjectBids.vue'
import HiredPath from '../components/HiredPath.vue'
import { logoFor } from '../data/logos'
import PackSetupTasks from '../components/PackSetupTasks.vue'
import PackWelcomeDialog from '../components/PackWelcomeDialog.vue'
import BookSlotDialog from '../components/BookSlotDialog.vue'
import WriteReviewDialog from '../components/WriteReviewDialog.vue'
import IconMore from '~icons/lucide/ellipsis'
import { PARTNERS, implementerFor, isFrappe } from '../data/partners'
import { DEFAULT_REGION, STARTER_PACKS, checkoutFor, marketFor } from '../data/packs'
import {
  FRAPPE_CLOUD_PARTNER_URL,
  FRAPPE_CLOUD_URL,
  isDraft,
  isStageDone,
  partnerCodeFor,
  stageOf,
  windowFor,
} from '../data/project'
import { appsInUse, sharedAnswers } from '../data/company'
import { budgetLabel, timelineLabel } from '../data/custom'
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
// The partner on custom work, `FRAPPE_TEAM` on a Starter Pack — Frappe
// implements packs itself.
const partner = computed(() => implementerFor(project.value?.partnerId))
// ⚠️ A REVIEW IS OF A PARTNER, and is published on their profile. Frappe has
// neither, so a pack project never asks for one.
const reviewable = computed(() => Boolean(partner.value) && !isFrappe(partner.value))
// ⚠️ A LIST. A project holds several packs — they are disjoint modules and
// the recommendation ticks more than one.
// Only on a project that BOUGHT them: an unshared project still carries the
// packs it was recommended (`createProject`), which are not a purchase and
// would hide its budget and requirements in the rail.
const packs = computed(() =>
  project.value?.service === 'pack'
    ? (project.value.packs ?? []).map((v) => STARTER_PACKS.find((p) => p.value === v)).filter(Boolean)
    : [],
)
const stage = computed(() => stageOf(project.value?.service, project.value?.stage))
const region = computed(() => marketFor(store.company.country) ?? DEFAULT_REGION)

// ── Arriving from payment ───────────────────────────────────────────────────
// Checkout lands here with `?paid=1`: the dialog opens once, and the flag is
// dropped so a reload or Back does not open it again.
const paidOpen = ref(false)
// The welcome dialog's first step on arrival from payment (`?paid=1`), or
// straight to the company questions from the task.
const welcomeStart = ref(1)
const kickoffOpen = ref(false)
onMounted(() => {
  if (!route.query.paid) return
  welcomeStart.value = 1
  paidOpen.value = true
  const { paid, ...query } = route.query
  router.replace({ query })
})
// The "Pay upfront" task's line: what was paid and when, priced by the same
// function as the basket and the processor's page.
const receipt = computed(() => {
  if (project.value?.service !== 'pack' || !packs.value.length) return null
  const total = checkoutFor(packs.value, region.value).total
  const on = project.value.at ? ` on ${fmtDate(project.value.at)}` : ''
  return `${total} paid to Frappe${on}. A receipt was sent to your email.`
})
// ⚠️ Inert, and saying so: a prototype has no invoice to render.
const downloadInvoice = () =>
  toast.info('Invoices are not built yet', {
    id: 'invoice',
    description: 'This is where the tax invoice would download.',
  })

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

const reviewed = computed(() => Boolean(partner.value && store.myReviewOf(partner.value.id)))

// The requirements as they went out — the copy carried in the partners'
// threads, so the business reads exactly what the partners read.
// Before they have been sent, the project's own saved requirements, in the
// same shape.
const brief = computed(() => {
  const sent = store.threads
    .flatMap((t) => t.messages ?? [])
    .findLast((m) => m.brief?.projectId === project.value?.id)?.brief
  // ⚠️ A PACK'S ANSWERS COME AFTER ITS SNAPSHOT: the booking card is written
  // at checkout, and the company questions are asked once paid. So the live
  // answers go over it — the ones a pack asks, and nothing it no longer does.
  if (sent && project.value?.service === 'pack') {
    const company = project.value.answers ?? store.company
    return {
      ...sent,
      employees: company.employees,
      segments: company.segments,
      apps: appsInUse(company),
      focus: company.focus ?? '',
    }
  }
  // The project's current apps ride along, as `briefOf` does, so reading and
  // editing show the same apps.
  if (sent) return { ...sent, projectApps: [...(project.value?.apps ?? sent.projectApps ?? [])] }
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
    // This project's starting point, when it has its own — see `emptyBrief`.
    ...(own.operations ? { operations: own.operations } : {}),
    ...(own.problems?.length ? { problems: [...own.problems] } : {}),
  }
})
const briefOpen = ref(false)
const detailsOpen = ref(false)
const canReview = computed(() => Boolean(reviewable.value && project.value?.completedAt && !reviewed.value))

// The header's facts: how many apps, the budget, the deadline. Short — the
// full answers are in Details.
const SHORT_TIMELINE = { now: 'As soon as possible', quarter: '3 months', half: '6 months', none: 'No deadline' }
const facts = computed(() => {
  const p = project.value
  if (!p) return []
  const b = brief.value ?? p.brief ?? {}
  const apps = (p.apps ?? []).length
  return [
    apps && { icon: 'lucide-layout-grid', text: `${apps} ${apps === 1 ? 'app' : 'apps'}` },
    b.budget && budgetLabel(b.budget) && { icon: 'lucide-wallet', text: budgetLabel(b.budget) },
    b.timeline && { icon: 'lucide-calendar', text: SHORT_TIMELINE[b.timeline] ?? timelineLabel(b.timeline) },
  ].filter(Boolean)
})

// ── A draft ─────────────────────────────────────────────────────────────────
// Editable and deletable until it starts — see `isDraft`.
const draft = computed(() => isDraft(project.value))
const editing = ref(false)
const deleting = ref(false)

const saveDraft = (details) => {
  store.updateDraft(project.value.id, details)
  editing.value = false
  toast.success('Saved')
}

const deleteDraft = () => {
  const name = project.value.name
  if (!store.deleteDraft(project.value.id)) return
  deleting.value = false
  router.push(store.projectHome)
  toast.success(`${name} deleted`)
}

// The name is edited in place in the sidebar — see `ProjectAbout`.
const rename = (name) => {
  store.renameProject(project.value.id, name)
  toast.success('Project renamed')
}

// ⚠️ EVERY PROJECT ACTION IN ONE MENU, the bar's •••, on every stage. Edit
// first; New project in its own group, because the rail has no "Projects" row
// to hang a + on and people who open this menu to edit find it here (Search
// offers it too); Delete last, red, and only before the requirements have gone
// to partners — after that there are people relying on them.
// ⚠️ NO "DRAFT" IN THE COPY. It is the code's name for a project nobody has
// been sent yet, not a word the business uses for it.
const menu = computed(() => [
  {
    group: 'edit',
    hideLabel: true,
    options: [
      draft.value && { label: 'Edit', icon: 'lucide-pencil', onClick: () => (editing.value = true) },
      sent.value && { label: 'Edit', icon: 'lucide-pencil', onClick: () => (briefOpen.value = true) },
    ].filter(Boolean),
  },
  { group: 'new', hideLabel: true, options: [{ label: 'New project', icon: 'lucide-plus', onClick: () => store.openNewProject() }] },
  {
    group: 'delete',
    hideLabel: true,
    options: draft.value
      ? [{ label: 'Delete project', icon: 'lucide-trash-2', theme: 'red', onClick: () => (deleting.value = true) }]
      : [],
  },
])

// ── Editing sent requirements ───────────────────────────────────────────────
// Custom work whose requirements went out and that has no partner yet. See
// docs/edit-requirements.md. Locked once hired.
const sent = computed(
  () =>
    project.value?.service === 'custom' &&
    !project.value.partnerId &&
    store.threads.some((t) => t.messages.some((m) => m.kind === 'brief' && m.brief?.projectId === project.value.id)),
)
const hiredName = computed(() => (project.value?.partnerId ? PARTNERS.find((p) => p.id === project.value.partnerId)?.name : ''))
const onRequirementsSaved = ({ sent: n }) => toast.success(`Sent to ${n} ${n === 1 ? 'partner' : 'partners'}`)

// ── Acting on a task ────────────────────────────────────────────────────────
const rating = ref(false)
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
    toast.success('Partner code copied', { description: code })
  } catch {
    toast.info(`Your partner code is ${code}`, {
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
      // On a pack the terms are read before they are agreed: the dialog
      // records the agreement. The custom spine ticks in place.
      if (project.value.service === 'pack') return (termsOpen.value = true)
      return tick(task.key)
    case 'company':
      welcomeStart.value = 2
      return (paidOpen.value = true)
    case 'kickoff':
      return (kickoffOpen.value = true)
    case 'fc-login':
      window.open(FRAPPE_CLOUD_URL, '_blank', 'noopener')
      return tick(task.key)
    case 'copy-code':
      return copyCode(task)
    case 'invoice':
      return downloadInvoice()
    case 'fc-link':
      window.open(FRAPPE_CLOUD_PARTNER_URL, '_blank', 'noopener')
      return tick(task.key)
  }
  toast.info('Not built yet')
}

// The company task's line once answered: size, industry, what they use.
const companySummary = computed(() => {
  const c = store.company
  if (!c.employees) return null
  const apps = (c.apps ?? []).map((a) => (a === 'Something else' && c.appsOther ? c.appsOther : a))
  const parts = [`${c.employees} employees`, ...(c.segments ?? [])]
  return `${parts.join(', ')}${apps.length ? `. Uses ${apps.join(', ')}` : ''}.`
})

// The company task's answers, saved to the account and the task ticked — which
// unlocks the kickoff.
const saveCompanyAnswers = (answers) => {
  store.saveCompany({ ...store.company, ...answers })
  tick('company')
  paidOpen.value = false
  toast.success('Saved')
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

// Fixed when the dialog opens, so the footer doesn't change while it fades
// out after a decline clears the request.
const chosenFromRequest = ref(false)
const choose = (partnerRecord) => {
  chosen.value = partnerRecord
  chosenFromRequest.value = project.value?.hireRequest === partnerRecord.id
  hiring.value = true
}

// ⚠️ THE TERMS AND THE HIRE ARE ONE ACT. `HirePartnerDialog` collects the
// agreement before the commitment, and `termsAt` records that it happened.
const hire = () => {
  if (!chosen.value) return
  // ⚠️ HIRING SHARES YOUR DETAILS. Hire is on every quote now, not only on
  // the ones whose details went out, so a hire from a quote that never had
  // them shares them first — the firm cannot start without knowing who you are.
  const bid = (project.value.bids ?? []).find((b) => b.partnerId === chosen.value.id)
  if (bid && bid.state !== 'shortlisted') store.setBidState(project.value.id, bid.partnerId, 'shortlisted')
  store.choosePartner(project.value.id, chosen.value.id)
  // ⚠️ HIRING ENDS THE STAGE, so it moves on by itself. The stage has no tasks
  // of its own — the hire was all of it — and leaving somebody on an empty step
  // with a "Confirm and continue" button asks them to confirm what they just did.
  store.advanceStage(project.value.id)
  toast.success(`${chosen.value.name} is your partner`)
}

const recordWhy = (why) => store.setChooseReason(project.value.id, why)

// ── A partner asking to be hired ────────────────────────────────────────────
// When the business agreed outside Connect, the partner sends the hire here,
// since this is where the terms are agreed. Review opens the same hire dialog.
const requester = computed(() =>
  project.value?.hireRequest && !project.value.partnerId ? PARTNERS.find((p) => p.id === project.value.hireRequest) ?? null : null,
)
const requestedAt = computed(() => {
  const at = project.value?.hireRequestAt
  if (!at) return ''
  const d = new Date(at)
  return new Date().toDateString() === d.toDateString()
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})
// From the hire dialog's Decline request. Undo rather than a confirmation:
// declining only clears the request, and the partner stays in Interested.
const declineRequest = () => {
  const { id, name } = requester.value
  const projectId = project.value.id
  store.declineHire(projectId)
  toast(`Declined ${name}’s request`, {
    id: `decline-${id}`,
    action: { label: 'Undo', onClick: () => store.requestHire(projectId, id) },
  })
}

// ── Moving on ───────────────────────────────────────────────────────────────
// Optional tasks do not hold the step up — see `isStageDone`. Packs only:
// custom work has no step to finish, see the hired state below.
const yoursDone = computed(() => isStageDone(stage.value, project.value))

// ── Custom work, once hired ─────────────────────────────────────────────────
// ⚠️ NO STEPPER. Custom work is two states, not two steps: choosing among
// quotes, then a partner doing the work. A bar that filled up the moment you
// hired read as "done" just as the work began.
// One optional hosting task now (see `HiredPath`): it opens Frappe Cloud's
// partner screen, where the code is entered.
const setUpHosting = () => {
  window.open(FRAPPE_CLOUD_PARTNER_URL, '_blank', 'noopener')
  tick('custom-fc-link')
}

// ⚠️ THE PARTNER SAYS WHEN IT IS DONE; THE BUSINESS CONFIRMS. Moving the
// customer to Live on the partner's side sets `liveAt`. There is no button for
// the business to end the project on its own: it used to sit under three
// optional tasks, enabled the moment you hired, and one press closed a
// seven-week engagement on day one and asked for a public review of work that
// had not started.
const confirmLive = () => {
  store.completeProject(project.value.id)
  toast.success('Project completed')
  if (reviewable.value) rating.value = true
}
const notLiveYet = () => {
  store.notLiveYet(project.value.id)
  toast.success(`Note sent to ${partner.value?.name ?? 'your partner'}`)
}

// The project ends when the business says the work is done, and that is the
// moment the public review is asked for.
const shareSiteUrl = (url) => {
  store.shareSiteUrl(project.value.id, url)
  toast.success(`Site URL shared with ${partner.value?.name ?? 'your partner'}`)
}

// A pack's own way to finish. Custom work finishes through `confirmLive`.
const complete = () => {
  store.completeProject(project.value.id)
  toast.success('Project completed')
  if (reviewable.value) rating.value = true
}
</script>

<template>
  <!-- `flush`, because the rail is part of the CHROME rather than a card in the
       page: it runs the full height beside the content with its own scroll. -->
  <ConnectShell
    flush
    :root-label="store.projectListInRail ? 'All projects' : (project?.name ?? 'Project')"
    root-to="/connect/projects"
    :crumb="store.projectListInRail ? (project?.name ?? 'Project') : null"
  >
    <!-- The name alone: with one to three projects the rail lists them and
         has no list page to go back to. Past that, "All projects /" returns. -->
    <!-- The •••, on every project, whatever its stage. -->
    <template v-if="project" #action>
      <Dropdown :options="menu" align="end">
        <Button variant="subtle" aria-label="Project actions">
          <template #icon><IconMore class="size-4" /></template>
        </Button>
      </Dropdown>
    </template>
    <div class="flex min-h-0 min-w-0 flex-1">
      <ScrollArea class="min-h-0 min-w-0 flex-1">
        <!-- The started project's column brings its own padding
             (`fc-page-read`); the missing-project state and a draft keep the
             page's. -->
        <div class="w-full pb-10 pt-8" :class="!project ? 'px-5 lg:px-8' : ''">
          <!-- An id that names nothing: a forwarded or stale link should land
               somewhere it can be recovered from. -->
          <div v-if="!project" class="py-20 text-center">
            <p class="text-lg font-medium text-ink-gray-8">No such project</p>
            <p class="mx-auto mt-1 max-w-sm text-p-base text-ink-gray-6">
              This link doesn't match any of your projects.
            </p>
            <Button class="mt-4" variant="solid" label="Go to projects" :route="store.projectHome" />
          </div>

          <!-- ⚠️ `fc-page-read`, 720px and centred — the app's width for a page
               read top to bottom, which names a project — so body copy does
               not stretch across a wide pane beside the rail. Every stage has
               the rail, the unshared one included. -->
          <div v-else class="fc-page-list mx-auto w-full">
            <!-- ⚠️ THE PAGE'S ANCHOR: the project's name, large, with what was
                 asked for as an icon and a word or two each. Everything else
                 the rail used to hold is one click away in Details. -->
            <header class="mb-14 flex flex-wrap items-start gap-4">
              <div class="min-w-0 flex-1">
                <h1 class="text-pretty text-4xl font-semibold text-ink-gray-9">{{ project.name }}</h1>
                <ul v-if="facts.length" class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-base text-ink-gray-6">
                  <li v-for="f in facts" :key="f.icon" class="inline-flex items-center gap-1.5">
                    <span :class="f.icon" class="size-4 shrink-0" aria-hidden="true" />
                    {{ f.text }}
                  </li>
                </ul>
              </div>
              <Button class="mt-0.5" label="Details" @click="detailsOpen = true" />
            </header>
            <!-- Was a button in the rail: once the work is done, the review is
                 the one thing left to ask, so it sits under the name. -->
            <Alert
              v-if="canReview"
              class="mb-6"
              :title="`How was working with ${partner.name}?`"
              :primary-action="{ label: 'Write a review', onClick: () => (rating = true) }"
            />

            <!-- ⚠️ A STARTER PACK IS ONE LIST, not stages behind a progress bar
                 — see `PACK_STAGES`. Custom work keeps its stages. -->
            <template v-if="stage && project.service === 'pack'">
              <!-- No heading: the list opens the column on its own. The space
                   above it is the column's padding; the first row brings none
                   of its own (see `PackSetupTasks`). -->
              <div>
                <div>
                  <PackSetupTasks
                    :tasks="stage.yours"
                    :project="project"
                    :receipt="receipt"
                    :company-summary="companySummary"
                    :implementer="partner?.name ?? 'Frappe'"
                    @act="act"
                    @share-url="shareSiteUrl"
                  />
                </div>
              </div>
              <!-- Hidden until every task is done: before then it is a button
                   nobody can use. Frappe can close the project from its
                   side too; this is the customer's way to. -->
              <div v-if="yoursDone && !project.completedAt" class="mt-6">
                <Button variant="solid" label="Mark as complete" @click="complete" />
              </div>
            </template>

            <!-- ⚠️ ONE BRANCH FOR NOTHING-SENT AND CHOOSING, so the first send
                 doesn't swap in a second table: a separate branch remounted
                 it five seconds after Send and dropped its filter and sort. -->
            <template v-else-if="stage || draft">
              <div>
                <!-- frappe-ui Alert, as the partner side's link requests use. -->
                <Alert
                  v-if="requester"
                  class="mb-6"
                  :title="`${requester.name} asked you to confirm the hire${requestedAt ? ` · ${requestedAt}` : ''}`"
                  :primary-action="{ label: 'Review', onClick: () => choose(requester) }"
                />

                <!-- The quotes, while nobody is hired. Once somebody is, the
                     decision is made and the partner leads the page. -->
                <!-- Keyed by project: one instance across the first send, a fresh
                     sort and filter on the next project. -->
                <ProjectBids v-if="!project.partnerId" :key="project.id" :project="project" @choose="choose" />

                <template v-else-if="partner">
                  <!-- ⚠️ THE PAGE'S ANCHOR: who is doing it, on a fill, the name
                     larger than anything below. "Working with X" says who, and
                     stays the same at every stage; the path below says where
                     things stand, so the two never repeat each other. -->
                  <div class="flex items-center gap-3 rounded-6 bg-surface-gray-1 p-4">
                    <Avatar
                      :image="logoFor(partner.id)"
                      :label="partner.name"
                      size="2xl"
                      shape="square"
                      class="fc-logo-avatar shrink-0"
                    />
                    <p class="min-w-0 flex-1 text-pretty text-xl font-semibold text-ink-gray-8">
                      Working with {{ partner.name }}
                    </p>
                    <!-- The partner profile's Message icon, so the action looks
                         the same wherever it appears. -->
                    <Button variant="ghost" label="Message" @click="messagePartner(partner)">
                      <template #prefix><span class="lucide-message-square size-4" aria-hidden="true" /></template>
                    </Button>
                  </div>

                  <!-- Hired, built, live — and the business's part in it. See
                       `HiredPath`. It replaces the "marked live" banner and the
                       three hosting tasks. -->
                  <HiredPath
                    class="mt-10"
                    :project="project"
                    :partner="partner"
                    :code="partnerCodeFor(project, partner) ?? ''"
                    @setup="setUpHosting"
                    @copy="copyCode({ key: 'custom-fc-code' })"
                    @confirm="confirmLive"
                    @not-yet="notLiveYet"
                  />
                </template>
              </div>
            </template>


          </div>
        </div>
      </ScrollArea>

    </div>

    <PackTermsDialog
      v-model:open="termsOpen"
      :region="region"
      :agreed="termsAgreed"
      @agree="tick('agree-terms')"
    />
    <PackScopeDialog v-model:open="scopeOpen" :packs="packs" />
    <BookSlotDialog
      v-if="partner"
      :open="kickoffOpen"
      :partner="partner"
      :booked="project?.kickoffAt ?? null"
      :title="project?.kickoffAt ? 'Reschedule your kickoff call' : 'Schedule your kickoff call'"
      :description="`${isFrappe(partner) ? 'Frappe’s team' : partner.name} walks through your requirements with you and plans the implementation.`"
      @close="kickoffOpen = false"
      @book="(slot) => store.requestKickoff(project.id, slot.at)"
    />
    <PackWelcomeDialog
      v-model:open="paidOpen"
      :start="welcomeStart"
      :asks-company="!(project?.done ?? []).includes('company')"
      :packs="packs"
      :implementer="partner?.name ?? 'Frappe'"
      @save="saveCompanyAnswers"
      @invoice="downloadInvoice"
    />
    <WriteReviewDialog v-model:open="rating" :project="project" :partner="partner" />
    <NewProjectDialog
      :open="editing"
      :draft="draft ? project : null"
      @close="editing = false"
      @create="saveDraft"
    />
    <!-- ⚠️ CONFIRMED, because it cannot be undone. -->
    <Dialog
      v-model="deleting"
      title="Delete this project?"
      :message="`${project?.name ?? 'This project'} and its requirements will be deleted. This can't be undone.`"
      size="sm"
      :actions="[
        { label: 'Cancel', onClick: ({ close }) => close() },
        { label: 'Delete', variant: 'solid', theme: 'red', onClick: deleteDraft },
      ]"
    />
    <!-- The rail's content, Rename included, behind Details. Requirements
         closes it first, so two dialogs never stack. -->
    <Dialog v-model="detailsOpen" title="Project" size="md">
      <template #default>
        <ProjectAbout
          v-if="project"
          class="-mx-5 -mb-5"
          without-asked
          :project="project"
          :packs="packs"
          :partner="partner"
          :region="region"
          :has-brief="Boolean(brief)"
          :brief="brief"
          :can-review="canReview"
          :when="project?.completedAt && project.service === 'pack' ? when : null"
          @scope="detailsOpen = false; openScope()"
          @requirements="detailsOpen = false; briefOpen = true"
          @message="messagePartner(partner)"
          @review="detailsOpen = false; rating = true"
          @rename="rename"
        />
      </template>
    </Dialog>
    <BriefDetailsDialog
      v-model:open="briefOpen"
      :brief="brief"
      :editable="sent"
      :lock-note="project?.service === 'custom' && hiredName ? `Hired. Changes go through ${hiredName} now` : ''"
      own
      :project-id="project?.id ?? null"
      @saved="onRequirementsSaved"
    />
    <HirePartnerDialog
      v-model:open="hiring"
      :partner="chosen"
      :bid="chosenBid"
      :from-request="chosenFromRequest"
      @decline="declineRequest"
      @hire="hire"
      @why="recordWhy"
    />
  </ConnectShell>
</template>
