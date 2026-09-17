<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Button,
  Dialog,
  Divider,
  MultiSelect,
  Progress,
  Select,
  Textarea,
  Tooltip,
} from 'frappe-ui'
// Reached for directly because frappe-ui's `Dialog` renders `message` only as
// the FALLBACK content of its default slot — so any dialog with a body of its
// own loses the description, and the underlying primitive then warns that
// `aria-describedby` is missing. reka-ui is frappe-ui's own dialog dependency,
// not a new one. Same reasoning as `EstimateQuoteDialog` and `BookSlotDialog`,
// except that here the description is the VISIBLE subtitle rather than an
// `sr-only` twin of it: the line under the title says exactly what a screen
// reader needs to hear, so saying it twice would be the two drifting apart.
import { DialogDescription } from 'reka-ui'
import CompanyQuestions from './CompanyQuestions.vue'
import { COMPANY_STEPS, companyErrors, companyPayload, emptyCompanyForm } from '../data/company'
import { APPS, PARTNERS } from '../data/partners'
import { MODULES, modulesFor } from '../data/modules'
import { projectApps } from '../data/project'
import { inquirySentFeedback, projectCreatedToast } from '../feedback'
import { useConnectStore } from '../stores/connect'

// CONTACT, for a signed-in business owner. The one door between pressing
// Contact anywhere in the app and a conversation existing.
//
// ⚠️ THE POINT OF IT: you cannot contact a partner without requirements. A
// partner reading "hi, can you help us?" has nothing to quote against, so the
// first reply is always the same three questions — which apps, which modules,
// how big — and the conversation starts a day later than it looks like it did.
// This asks them at the moment they matter and sends the answers with the
// inquiry.
//
// ⚠️ IT DOES NOT SEND ANYONE TO THE PROJECTS PAGE. The requirements ARE a
// project, and this creates one on send. Redirecting someone who pressed
// Contact to "first, go and create a project" is the friction this replaces —
// they came here to talk to a firm, not to file paperwork, and the paperwork is
// a by-product of what they already told us.
//
// THREE SHAPES. The account's state picks one:
//
//   no company    a 3-STEP WIZARD. Who you are, what you need, what you want
//                 built. The requirements step is the third of the three.
//   no project    the questions alone. "First, define your project
//                 requirements."
//   has one       the summary. "Contact <partner>", requirements read-only.
//
// ⚠️ THE WIZARD IS WHY THIS FILE ASKS ABOUT COMPANIES AT ALL. Pressing Contact
// while signed out ends at sign-up, and the screen that lands you back used to
// run the held Contact action and THEN open `CompanySignupDialog` — two modals,
// stacked, the company one trapped behind the one it was supposed to precede.
// Both were right to exist and neither could go first while they were separate
// dialogs, so they stopped being separate: the company questions are every step
// of this one but the last. `openCompanyPrompt` now declines to open the standalone
// dialog while an inquiry is on screen, and the FIELDS are shared rather than
// copied — see `CompanyQuestions`.
//
// ⚠️ Every other errand still meets the standalone dialog. Saving a partner and
// booking a pack have no third step to put the questions in front of.
//
// ⚠️ "Has a project" means `store.inquiryProjects` — custom and undecided work
// only. A pack and a guided onboarding are bought as a fixed scope, so they are
// not requirements anyone is asking a partner to estimate; see the getter.
//
// ⚠️ Mounted at the APP ROOT (`App.vue`), not on a page, for the same reason
// `CompanySignupDialog` is: Contact is pressed from a listing row, a profile
// header, two pricing cards and the estimate modal, and a dialog owned by any
// one of those cannot open over the others.
const store = useConnectStore()
const router = useRouter()

const partner = computed(() => PARTNERS.find((p) => p.id === store.inquiryFor) ?? null)
const open = computed(() => Boolean(partner.value))

// The firm by its first word, which is how a person refers to a company they
// are mid-sentence about — "a question for Tridots", not "a question for Tridots
// Tech". Same derivation as `ProjectRow`'s own sentence about the other party.
const firstName = computed(() => partner.value?.name.split(' ')[0] ?? '')

// ── The wizard ──────────────────────────────────────────────────────────────

// Does this account still owe us the company answers?
//
// ⚠️ `store.company.name`, NOT `viewer.company`. The viewer carries a company
// name from the moment the app boots (the demo's "Northwind"), so testing it
// would say yes for an account that has answered nothing. `company.name` is
// written by `saveCompany` and by nothing else, which makes it the record of
// having actually been asked.
const needsCompany = computed(() => !store.company.name.trim())

const company = reactive(emptyCompanyForm())

// The company questions are steps 1..`COMPANY_STEPS`; the LAST step is the
// requirements. Without the wizard there is only ever that last one, and `step`
// is pinned there so every reader below can ask the same question ("are we on
// the last?") whichever shape is showing.
//
// ⚠️ Derived, not a literal. The company questions went from two steps to three
// — step 1 was carrying the identity fields, the ladder and the systems
// follow-up all at once — and a hard-coded 3 here would have left this wizard
// showing two of them and a bar that never filled.
const STEPS = COMPANY_STEPS + 1
const step = ref(STEPS)

const wizard = computed(() => needsCompany.value)

// ⚠️ `Progress` with `intervals`, not a hand-rolled row of bars: `intervalCount`
// renders exactly this — three equal segments, `space-x-1` apart, filled ones in
// `surface-gray-10` and the rest in `surface-gray-2`. `value` is a percentage,
// and `filledIntervalCount` rounds it against the count, so thirds land on whole
// segments.
const progress = computed(() => (step.value / STEPS) * 100)

// ── Which project ───────────────────────────────────────────────────────────
const projects = computed(() => store.inquiryProjects)
const defining = computed(() => projects.value.length === 0)

const form = reactive({ projectId: null, apps: [], modules: [], message: '' })

// ⚠️ A PICKER ONLY WHEN THERE IS A CHOICE. With one project its name is a line
// of text; a select holding a single option is a control that cannot do
// anything, and it invites a press that opens a menu with one item in it.
const picking = computed(() => projects.value.length > 1)

const project = computed(() => projects.value.find((p) => p.id === form.projectId) ?? null)

const projectOptions = computed(() => projects.value.map((p) => ({ label: p.name, value: p.id })))

// ── The questions, when there is no project ─────────────────────────────────

// All eleven apps, multi-select. A business wanting ERPNext AND Drive says so
// in one inquiry rather than picking the one it thinks we would rather hear.
const APP_OPTIONS = APPS.map((a) => ({ label: a.label, value: a.value }))

// ⚠️ Only some apps break into modules — ERPNext and Helpdesk, as
// `data/modules.js` stands. So the modules question is asked ONLY about the
// apps that have a catalogue behind them, and disappears entirely for an
// inquiry about Drive alone: that inquiry's requirement IS the app, and a
// required field with nothing in its menu is a dead end dressed as a question.
//
// ⚠️ Derived from `MODULES` rather than listed here. The catalogue gains and
// loses apps — CRM was in it and came out, Frappe HR never went in — and a
// hard-coded list of "the apps with modules" is a second copy of that fact
// which would go quietly wrong the day the first one changed.
const catalogued = computed(() => form.apps.filter((a) => (MODULES[a] ?? []).length))

// ⚠️ Values are `app:key`, not `key`. The store holds modules keyed BY app, so
// a flat list of module keys cannot be written back — and two apps are free to
// name a module the same thing. The prefix is what makes the answer reversible.
const MODULE_OPTIONS = computed(() => {
  const groups = catalogued.value.map((app) => ({
    group: APPS.find((a) => a.value === app)?.label ?? app,
    key: app,
    options: MODULES[app].map((m) => ({ label: m.label, value: `${app}:${m.key}` })),
  }))
  // Grouped only when the group heading says something. One app, and every
  // option sits under one heading repeating the answer given above it.
  return groups.length > 1 ? groups : (groups[0]?.options ?? [])
})

// `app:key` -> the module's own label, so the trigger's summary reads the
// catalogue rather than title-casing a key ('hr' is not 'Hr').
const MODULE_LABELS = computed(() =>
  Object.fromEntries(
    Object.entries(MODULES).flatMap(([app, list]) => list.map((m) => [`${app}:${m.key}`, m.label])),
  ),
)

const APP_LABELS = Object.fromEntries(APPS.map((a) => [a.value, a.label]))

// Back to the store's shape: `{ erpnext: ['finance', ...] }`.
const pickedModules = computed(() =>
  form.modules.reduce((acc, value) => {
    const [app, key] = value.split(':')
    acc[app] = [...(acc[app] ?? []), key]
    return acc
  }, {}),
)

// ⚠️ Un-picking an app drops its modules with it. Without this, picking ERPNext,
// ticking three modules, then changing the answer to Drive alone still sends
// three ERPNext modules — an answer to a question no longer on the screen. Same
// rule as `CompanySignupDialog`'s "Something else" field.
watch(
  () => form.apps,
  (apps) => {
    form.modules = form.modules.filter((v) => apps.includes(v.split(':')[0]))
  },
)

// ── What the summary reads, when there is one ──────────────────────────────
const shownApps = computed(() =>
  project.value
    ? projectApps(project.value).map((v) => APPS.find((a) => a.value === v)?.label ?? v)
    : [],
)

const shownModules = computed(() =>
  project.value
    ? Object.entries(project.value.modules ?? {}).flatMap(([app, keys]) =>
        modulesFor(app, keys).map((m) => m.label),
      )
    : [],
)

// ── Open, validate, send ───────────────────────────────────────────────────

// ⚠️ Errors stay quiet until the first press, then update live — the rule every
// form in this app uses. A disabled button leaves someone hunting for the field
// that is stopping them with nothing to click and nothing to read; pressing it
// and being shown the messages answers that in one gesture.
const tried = ref(false)

// Reset on OPEN rather than on close: a dialog that empties itself while it is
// animating out shows the reader their answers being wiped.
//
// The newest project is the default — it is the one they were last thinking
// about — and `inquiryProjects` is already newest-first.
watch(open, (isOpen) => {
  if (!isOpen) return
  tried.value = false
  step.value = wizard.value ? 1 : STEPS
  Object.assign(company, emptyCompanyForm())
  form.projectId = projects.value[0]?.id ?? null
  form.message = ''
  // Prefilled from wherever this was opened, when that surface already knows
  // the answers — the estimate modal, whose rows the visitor has just been
  // ticking against a price. Nothing else sets it.
  const pre = store.inquiryPrefill
  form.apps = pre?.apps ? [...pre.apps] : []
  form.modules = pre?.modules ? [...pre.modules] : []
})

// Step 1's rules are the company's, and they live with the questions
// (`companyErrors`) so this dialog and the standalone one cannot disagree about
// what a valid answer is.
//
// ⚠️ The company steps AFTER the first validate NOTHING, deliberately — see the
// note on `companyErrors`.
const errors = computed(() => {
  if (!tried.value) return {}
  if (step.value === 1) return companyErrors(company)
  if (step.value !== STEPS || !defining.value) return {}
  const e = {}
  if (!form.apps.length) e.apps = 'Select at least one app'
  // Required only while the question is being asked at all — see `catalogued`.
  if (catalogued.value.length && !form.modules.length) {
    e.modules = 'Select at least one module'
  }
  return e
})

// Forward. Each step clears `tried` behind it, so arriving on a step never opens
// with errors about a question that has not been asked yet.
const next = () => {
  tried.value = true
  if (Object.keys(errors.value).length) return
  tried.value = false
  step.value += 1
}

const back = () => {
  tried.value = false
  step.value -= 1
}

const close = () => store.closeInquiry()

// Leaving to edit the project. Closes the dialog rather than stacking a page
// behind it — and drops the typed note, which is the cost of choosing to go and
// change the thing the note was about.
const manage = () => {
  const to = `/connect/projects/${form.projectId}`
  close()
  router.push(to)
}

// ⚠️ STAYS WHERE IT IS. Sending used to be the same gesture as opening the
// conversation, because Contact WAS "open the thread" — there was nothing to
// send. There is now, and the two have come apart: someone comparing three
// firms wants to send the same requirements to all three, and being thrown into
// a thread after each one makes that three round trips back to the listing. The
// toast carries the way in for the person who does want to read it.
// Both endings bank the company answers first. The wizard is the only place
// they are collected on this path, and a project named from
// `this.company.name` (see `inquiryName`) has to be able to read them — so they
// are saved BEFORE the project is made, not after.
//
// ⚠️ A no-op outside the wizard: `companyPayload` of an untouched form would
// overwrite a real company with empty strings.
const bankCompany = () => {
  if (!wizard.value) return
  store.saveCompany(companyPayload(company))
}

// Requirements, written down and kept — no message, no conversation, no partner
// told anything.
//
// ⚠️ It is on the SAME footing as Send, not a cancel dressed up. Someone three
// steps into defining what they want has produced something worth keeping even
// if they decide they would rather not approach this firm today, and the
// alternative on offer used to be a button that threw it away. Which is also
// why it does not navigate: they were reading a partner's profile, and the
// toast says where the project went.
const saveOnly = () => {
  tried.value = true
  if (Object.keys(errors.value).length) return
  bankCompany()
  const made = store.saveRequirements({ apps: form.apps, modules: pickedModules.value })
  close()
  projectCreatedToast(made)
}

const send = () => {
  if (!partner.value) return
  tried.value = true
  if (Object.keys(errors.value).length) return

  bankCompany()
  const to = partner.value
  const {
    thread,
    project: made,
    created,
  } = store.sendInquiry({
    partnerId: to.id,
    projectId: defining.value ? null : form.projectId,
    apps: form.apps,
    modules: pickedModules.value,
    message: form.message,
  })
  close()
  // ⚠️ `created` decides whether there are two toasts or one. Picking a project
  // that already existed made nothing — announcing a creation there would be
  // the app taking credit for a row that has been sitting in Implementation for
  // a week. See `inquirySentFeedback`.
  inquirySentFeedback({
    partner: to,
    project: made,
    created,
    open: () => router.push({ name: 'messages', query: { thread } }),
  })
}
</script>

<template>
  <!-- ⚠️ `lg` (512px), the Dialog's own default, where `CompanySignupDialog`
       steps down to `md`. That one is a column of single-line fields and short
       options, which at 512 sat in a lot of empty space. This one holds a
       two-column summary — a label column and a list of module names that runs
       to four or five items — and at 448px "Manufacturing, Stock, Accounts,
       Inventory" wraps to three lines against a 144px label column. -->
  <!-- ⚠️ SEALED while the wizard is running: no close button, no click-away, no
       Escape. Frappe assigns the partner off the company answers, so an account
       that started the questions and walked out of them is an account nothing
       can be matched for — the same reason `CompanySignupDialog` has never had
       an ×. The single-step shapes keep theirs: those ask for nothing the
       account owes us, and a form you opened by pressing Contact should be
       closeable.
       ⚠️ It does mean steps 1 and 2 have no way out at all — no ×, and Back on
       step 1 would be a cancel by another name. Deliberate, and the one thing to
       revisit first if it bites: a Cancel on step 1 is a two-line change. -->
  <Dialog
    :open="open"
    size="lg"
    :dismissible="!wizard"
    :show-close-button="!wizard"
    @update:open="!$event && close()"
  >
    <template v-if="partner" #title>
      <div>
        <!-- ⚠️ Three titles, and which one shows is the whole design.
             In the WIZARD the title is the errand and nothing else — "Contact
             Tridots Tech" — because the thing being justified is no longer the
             dialog but each step of it, and the step says that for itself below
             the bar. A heading that changed three times on the way through would
             read as three different dialogs.
             Without it, and with no project, the title is not about the partner
             at all: it says what is about to be asked and WHY, because a form
             that appears between a press and its result has to justify itself in
             its first line. "First," is doing real work there — it promises this
             is a step on the way to the thing, not a diversion from it.
             With a project there is nothing to justify: the requirements exist,
             so the title is the errand and the subtitle says what is sent. -->
        <h3 class="text-2xl font-semibold text-ink-gray-9">
          {{
            defining && !wizard
              ? 'First, define your project requirements'
              : `Contact ${partner.name}`
          }}
        </h3>
        <DialogDescription v-if="!wizard" class="mt-1 text-p-base text-ink-gray-5">
          {{
            defining
              ? 'This will help Partners to calculate an estimated cost'
              : 'Share your project requirements to get a cost estimate'
          }}
        </DialogDescription>

        <!-- ⚠️ The bar belongs to the WIZARD only. `CompanySignupDialog`'s own
             note argues a stepper over two steps is chrome describing itself,
             and that still holds — what changes at three is that the end stops
             being guessable from the button labels. Someone answering questions
             about their company on the way to contacting a firm needs to know
             how much of this there is.
             `Progress` with `intervals` renders it: one segment per step,
             filled ones dark. No custom bar.
             `md` is a 4px rule — `sm`'s 2px read as a hairline rather than as a
             thing with parts, and the segment you have filled is the point.
             ⚠️ No `label`. The prop renders VISIBLY above the bar ("Step 1 of
             4"), which the design doesn't carry — the segments say the same
             thing and the sentence below says which step this is. The cost is
             that the bar's accessible value falls back to a bare percentage;
             hiding a label visually would mean overriding the component's
             internals, which is a bigger decision than this bar deserves. -->
        <Progress
          v-else
          class="mt-3"
          size="md"
          :value="progress"
          intervals
          :interval-count="STEPS"
        />
        <!-- The step's own sentence, under the bar. It is the description in the
             wizard's shapes — the title is fixed, so this is the line that says
             what is being asked. -->
        <DialogDescription v-if="wizard" class="mt-4 text-p-base font-medium text-ink-gray-8">
          {{
            step === STEPS
              ? 'Define your project requirements to share with Partners'
              : 'First, please tell us more about your company'
          }}
        </DialogDescription>
      </div>
    </template>

    <template v-if="partner" #default>
      <!-- ⚠️ The submit handler follows the STEP. Return finishing the form is
           the rule every dialog in this app keeps, and on the company steps what
           Return should finish is the step, not the inquiry — a company name
           typed and Return pressed must not send anything to a partner. -->
      <form novalidate @submit.prevent="step === STEPS ? send() : next()">
        <!-- ── Every step but the last: the company ──────────────────────── -->
        <CompanyQuestions v-if="step !== STEPS" :step="step" :form="company" :errors="errors" />

        <!-- ── The questions ─────────────────────────────────────────────── -->
        <div v-else-if="defining" class="space-y-4">
          <MultiSelect
            v-model="form.apps"
            label="Which Frappe apps are you interested in?"
            placeholder="Select"
            required
            :options="APP_OPTIONS"
            :error="errors.apps"
          >
            <!-- ⚠️ The comma list, not the stock "3 selected". `MultiSelect`
                 collapses two or more picks to a count so the trigger's width
                 cannot balloon — the right default for a filter, where the
                 picks are a query someone is narrowing and the menu is a click
                 away. Here they are an ANSWER, on a form whose next question
                 depends on it, and an answer that reads "2 selected" has to be
                 reopened to be checked. This slot exists for exactly that; the
                 label is still capped by the trigger's own truncation. -->
            <template #summary="{ summary }">
              {{ form.apps.length > 1 ? form.apps.map((v) => APP_LABELS[v]).join(', ') : summary }}
            </template>
          </MultiSelect>

          <!-- Only for apps with a module catalogue behind them — see
               `catalogued`. Drive alone, and the inquiry is one question. -->
          <MultiSelect
            v-if="catalogued.length"
            v-model="form.modules"
            label="Which modules are you interested in?"
            placeholder="Select"
            required
            :options="MODULE_OPTIONS"
            :error="errors.modules"
          >
            <template #summary="{ summary }">
              {{
                form.modules.length > 1
                  ? form.modules.map((v) => MODULE_LABELS[v]).join(', ')
                  : summary
              }}
            </template>
          </MultiSelect>
        </div>

        <!-- ── The summary ───────────────────────────────────────────────── -->
        <div v-else-if="step === STEPS">
          <!-- READ-ONLY, with the way out beside it rather than in it. Scope is
               a decision with consequences elsewhere — an estimate is priced
               off it, a project's stages are tracked against it — so editing it
               belongs on the project, not in a dialog whose job is to send. The
               link is what stops that being a dead end. -->

          <!-- The PICKER, and only when there is something to pick. A control
               cannot be a row of the list below — it has a trigger, a menu and a
               focus ring — so this sits above it, and the list drops its name
               row because the picker is already showing the name.
               ⚠️ Manage stays visible here rather than appearing on hover: this
               row is already interactive, and a control that hides beside
               another control reads as part of it. -->
          <div v-if="picking" class="flex items-center justify-between gap-3">
            <Select
              v-model="form.projectId"
              class="min-w-0 flex-1"
              label="Project"
              :options="projectOptions"
            />
            <Tooltip text="Manage project">
              <Button
                class="shrink-0 self-end"
                variant="ghost"
                size="sm"
                aria-label="Manage project"
                @click="manage"
              >
                <template #icon><LucideArrowUpRight class="size-4" /></template>
              </Button>
            </Tooltip>
          </div>

          <dl :class="picking ? 'mt-4 space-y-2' : 'space-y-2'">
            <!-- ⚠️ THE NAME IS A ROW OF THE LIST, not a field above it. It used
                 to be a label-over-value pair with a Manage button beside it,
                 which made the one fact that is plain text look like a control
                 someone had disabled — three facts about the project, one of
                 them set in a different shape for no reason a reader could name.
                 Same `dt`/`dd` as the other two, and the column lines up.

                 ⚠️ `group` + `opacity`, NOT `v-if`: the button keeps its space
                 at all times, so revealing it cannot reflow the name beside it,
                 and an element that is only transparent is still in the tab
                 order — which `group-focus-within` is what makes usable. Same
                 rule as the per-message actions in `MessagesPage`. -->
            <div v-if="!picking" class="group flex gap-6 text-p-base">
              <dt class="w-32 shrink-0 text-ink-gray-5">Project name</dt>
              <dd class="flex min-w-0 items-center gap-1 font-medium text-ink-gray-8">
                <span class="min-w-0">{{ project?.name }}</span>
                <Tooltip text="Manage project">
                  <Button
                    class="-my-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                    variant="ghost"
                    size="sm"
                    aria-label="Manage project"
                    @click="manage"
                  >
                    <template #icon><LucideArrowUpRight class="size-4" /></template>
                  </Button>
                </Tooltip>
              </dd>
            </div>

            <div class="flex gap-6 text-p-base">
              <dt class="w-32 shrink-0 text-ink-gray-5">Frappe apps</dt>
              <dd class="font-medium text-ink-gray-8">
                {{ shownApps.join(', ') || 'Not specified yet' }}
              </dd>
            </div>
            <!-- ⚠️ The row shows even when it is empty, reading "Not specified
                 yet" rather than being dropped. A project whose scope was left
                 undecided — `NewProjectDialog` asks for modules and says they
                 are optional — is exactly the project a partner will ask about
                 first, and a missing row hides that from the one person who can
                 fix it, two inches from the link that lets them. -->
            <div class="flex gap-6 text-p-base">
              <dt class="w-32 shrink-0 text-ink-gray-5">Modules</dt>
              <dd class="font-medium text-ink-gray-8">
                {{ shownModules.join(', ') || 'Not specified yet' }}
              </dd>
            </div>
          </dl>

          <!-- ⚠️ A rule here, against this app's own "no dividers between a
               page's own sections" rule, because this is not two sections of
               one thing. Above it is a record of what has already been decided
               and is about to be sent; below it is an empty field waiting for
               something to be typed. The stroke is the edge between reading and
               writing, and space alone did not carry it: the summary's own
               label column made the note look like a third row of the list. -->
          <Divider class="my-5" />
        </div>

        <!-- The one part of an inquiry written in the sender's own words, and
             the only optional field in either shape. It goes to the thread as
             its own message rather than into the requirements card — a sentence
             a person wrote, quoted inside a summary, reads as a form field.
             ⚠️ Named for the firm, and by its first word: this is the message to
             THEM, and the placeholder says what it is for so the field is not a
             box someone stalls in front of. -->
        <Textarea
          v-if="step === STEPS"
          v-model="form.message"
          :class="defining ? 'mt-4' : ''"
          :label="`Additional message for ${firstName} (Optional)`"
          :rows="3"
          placeholder="e.g. what caught your eye about them, or a specific question"
        />

        <!-- ⚠️ FOUR FOOTERS, one per state, and each one is the shape of what
             that state can actually do.

             Step 1 has one move: forward. Full width, because a lone button
             floated right in a modal reads as the lesser of two options with the
             other one missing.

             Step 2 can go back, and its questions are optional — so Continue is
             a step, not a commitment.

             Step 3 ends the wizard, and it ends it two ways: send the
             requirements to this firm, or keep them. Both produce a project, so
             neither is a cancel — see `saveOnly`.

             Without the wizard the requirements form keeps its Cancel, because
             there is something to abandon and nothing yet to keep; and the
             summary has nothing to abandon at all — everything in it was decided
             before the dialog opened — so it gets one full-width action. -->
        <div v-if="step === 1" class="mt-8">
          <Button class="w-full" variant="solid" size="sm" label="Continue" type="submit" />
        </div>

        <!-- Every company step after the first: Back and Continue on one line.
             `step < STEPS` rather than a list of numbers, so a fourth company
             question would need no change here. -->
        <div v-else-if="step < STEPS" class="mt-8 flex items-center justify-end gap-2">
          <Button variant="subtle" size="sm" label="Back" @click="back">
            <template #prefix><LucideChevronLeft class="size-4" /></template>
          </Button>
          <Button variant="solid" size="sm" label="Continue" type="submit" />
        </div>

        <!-- ⚠️ Back on the LEFT and the two endings on the right, against the
             all-right-aligned footers elsewhere in this app. Back is not a third
             option for finishing — it is the way out of the step — and sat in a
             row of three it becomes the button people press by accident when
             they meant Save. -->
        <div v-else-if="wizard" class="mt-8 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" label="Back" @click="back">
            <template #prefix><LucideChevronLeft class="size-4" /></template>
          </Button>
          <div class="flex items-center gap-2">
            <Button variant="subtle" size="sm" label="Save without sending" @click="saveOnly" />
            <Button variant="solid" size="sm" label="Send inquiry" type="submit">
              <template #prefix><LucideSend class="size-4" /></template>
            </Button>
          </div>
        </div>

        <div v-else-if="defining" class="mt-8 flex justify-end gap-2">
          <Button variant="subtle" size="sm" label="Save without sending" @click="saveOnly" />
          <Button variant="solid" size="sm" label="Send inquiry" type="submit">
            <template #prefix><LucideSend class="size-4" /></template>
          </Button>
        </div>

        <div v-else class="mt-8">
          <Button class="w-full" variant="solid" size="sm" label="Send inquiry" type="submit">
            <template #prefix><LucideSend class="size-4" /></template>
          </Button>
        </div>
      </form>
    </template>
  </Dialog>
</template>
