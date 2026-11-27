<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, FormControl, ScrollArea, Select, Textarea } from 'frappe-ui'
import NewProjectDialog from './NewProjectDialog.vue'
import BriefSummary from './BriefSummary.vue'
import { useScrollFade } from '../lib/scrollFade'
import { PARTNERS } from '../data/partners'
import { briefComplete, briefErrors, budgetBandsFor, scopeHint } from '../data/custom'
import { requirementsSentToast } from '../feedback'
import { useConnectStore } from '../stores/connect'

// CONTACT, for a signed-in business owner. The one door between pressing
// Contact anywhere in the app and a conversation existing.
//
// ⚠️ THE POINT OF IT: you cannot contact a partner without requirements. A
// partner reading "hi, can you help us?" has nothing to quote against, so this
// sends the project's brief with the first message.
//
// ⚠️ THE SAME BRIEF A BROADCAST SENDS, and the company with it. What you need
// built, the budget band, the timeline and the industry, as the same card in
// the partner's thread. Unlike a broadcast, the company goes too: the business
// chose this firm, so there is no Interested step to hold it back for. See
// `sendBrief`.
//
// TWO SHAPES:
//
//   no project    `NewProjectDialog` with a partner: the project's questions,
//                 then the brief, as one dialog that ends in Send.
//   a project     "Contact <partner>". The brief read-only when it is complete,
//                 drawn by `BriefSummary` — the requirements dialog's own read
//                 view, so what you check here is what the partner reads. When
//                 it is not complete, its two required answers asked here and
//                 saved to the project, so the next firm is not asked again.
//
// ⚠️ A LONG DESCRIPTION SCROLLS THE BODY, never the dialog: the title and Send
// stay put, and the bottom edge fades while there is more (`useScrollFade`).
// Not clamped — this is the last look before it is sent, so all of it shows.
//
// ⚠️ "A project" means `store.inquiryProjects` — custom and undecided work
// only. A pack is bought as a fixed scope, so it is not requirements anyone is
// asking a partner to estimate; see the getter.
//
// ⚠️ Mounted at the APP ROOT (`App.vue`), not on a page: Contact is pressed from
// a listing row, a profile header, two pricing cards and the estimate modal,
// and a dialog owned by any one of those cannot open over the others.
const store = useConnectStore()
const router = useRouter()

const partner = computed(() => PARTNERS.find((p) => p.id === store.inquiryFor) ?? null)


// ── Which project ───────────────────────────────────────────────────────────
const projects = computed(() => store.inquiryProjects)

const creatingFirst = computed(() => Boolean(partner.value) && projects.value.length === 0)

// The partner as last shown, kept through the close. Both dialogs draw their
// title and body from it, so letting it go null while one fades out emptied
// it — or, in `NewProjectDialog`, flashed the plain New project steps.
const shownPartner = ref(null)
watch(partner, (p) => {
  if (p) shownPartner.value = p
})
const open = computed(() => Boolean(partner.value) && projects.value.length > 0)

// ⚠️ NO NOTE FIELD, matching the new-project flow: the brief is the message.
const form = reactive({ projectId: null, scope: '', budget: '' })

// ⚠️ A PICKER ONLY WHEN THERE IS A CHOICE. With one project its name is a line
// of text; a select holding a single option is a control that cannot do
// anything.
const picking = computed(() => projects.value.length > 1)

const project = computed(() => projects.value.find((p) => p.id === form.projectId) ?? null)

const projectOptions = computed(() => projects.value.map((p) => ({ label: p.name, value: p.id })))

// ── The brief ───────────────────────────────────────────────────────────────
const saved = computed(() => (project.value ? store.briefOf(project.value.id) : null))

// ⚠️ Asked only when the project cannot yet be sent. A complete brief is a
// decision with consequences elsewhere — twelve firms may already be quoting
// against it — so it is read-only here, with Manage beside it.
const asking = computed(() => Boolean(saved.value) && !briefComplete(saved.value))

// The brief as `sendBrief` will send it, company answers included.
const preview = computed(() => (project.value ? store.briefPreview(project.value.id) : null))
const companyName = computed(
  () => (project.value?.answers ?? store.company).name || store.company.name || store.viewer.company || '',
)

const scroller = ref(null)
const { more, remeasure } = useScrollFade(scroller)
watch([() => form.projectId, asking], remeasure)

// Edit leaves for the project; only shown when there is a finished brief to
// change — an unfinished one is being written right here.
const actions = computed(() => [
  ...(asking.value ? [] : [{ label: 'Edit', variant: 'subtle', onClick: () => manage() }]),
  { label: 'Send requirements', variant: 'solid', iconLeft: 'lucide-message-square', onClick: () => send() },
])

const bands = computed(() =>
  budgetBandsFor((project.value?.answers ?? store.company).country),
)

const hint = computed(() => scopeHint(form.scope))

// Seeded from the project on open and whenever the picker moves, so a
// half-written brief on the project is finished here rather than started again.
watch(
  () => form.projectId,
  () => {
    form.scope = saved.value?.scope ?? ''
    form.budget = saved.value?.budget ?? ''
  },
)

// ── Open, validate, send ───────────────────────────────────────────────────

// ⚠️ Errors stay quiet until the first press, then update live — the rule every
// form in this app uses.
const tried = ref(false)

const errors = computed(() =>
  tried.value && asking.value ? briefErrors({ scope: form.scope, budget: form.budget }) : {},
)

// Reset on OPEN rather than on close: a dialog that empties itself while it is
// animating out shows the reader their answers being wiped. The newest project
// is the default — `inquiryProjects` is already newest-first.
watch(open, (isOpen) => {
  if (!isOpen) return
  tried.value = false
  form.projectId = projects.value[0]?.id ?? null
  const b = project.value ? store.briefOf(project.value.id) : null
  form.scope = b?.scope ?? ''
  form.budget = b?.budget ?? ''
})

const close = () => store.closeInquiry()

// No project yet: `NewProjectDialog` asks for it and for the brief as one flow,
// and this makes the project and sends in the same gesture. The estimate
// modal's ticks ride along as its modules — the visitor has just decided which
// modules count, against a rate and a figure. `app:key`, the shape
// `EstimateQuoteDialog` hands across.
const createAndSend = (details) => {
  const to = partner.value
  if (!to) return
  const modules = (store.inquiryPrefill?.modules ?? []).reduce((acc, value) => {
    const [app, key] = value.split(':')
    acc[app] = [...(acc[app] ?? []), key]
    return acc
  }, {})
  const id = store.createProject({
    ...details,
    modules: Object.keys(modules).length ? modules : details.modules,
  })
  const thread = store.sendBrief({ partnerId: to.id, projectId: id })
  close()
  requirementsSentToast(to, () => router.push({ name: 'messages', query: { thread } }))
}

// Leaving to edit the project. Closes the dialog rather than stacking a page
// behind it — and drops the typed note, which is the cost of choosing to go and
// change the thing the note was about.
const manage = () => {
  const to = `/connect/projects/${form.projectId}`
  close()
  router.push(to)
}

// ⚠️ STAYS WHERE IT IS. Someone comparing three firms sends the same
// requirements to all three, and being thrown into a thread after each one
// makes that three round trips back to the listing. The toast carries the way
// in for the person who does want to read it.
const send = () => {
  if (!partner.value || !project.value) return
  tried.value = true
  if (Object.keys(errors.value).length) return

  const to = partner.value
  const thread = store.sendBrief({
    partnerId: to.id,
    projectId: project.value.id,
    brief: asking.value ? { scope: form.scope, budget: form.budget } : null,
  })
  close()
  requirementsSentToast(to, () => router.push({ name: 'messages', query: { thread } }))
}
</script>

<template>
  <NewProjectDialog
    :open="creatingFirst"
    :partner="shownPartner"
    @close="close"
    @create="createAndSend"
  />

  <!-- The requirements dialog's shape: frappe-ui's own title, a ScrollArea
       body, and the footer from `actions`, pinned under it. -->
  <Dialog
    :open="open"
    size="md"
    :title="shownPartner ? `Contact ${shownPartner.name}` : ''"
    :actions="project ? actions : []"
    @update:open="!$event && close()"
  >
    <template v-if="shownPartner && project" #default>
      <ScrollArea
        ref="scroller"
        class="fc-scroll-dialog -my-1 -ml-1 -mr-4 sm:-mr-6"
        :class="{ 'fc-scroll-more': more }"
        viewport-class="py-1 pl-1 pr-4 sm:pr-6"
      >
        <form novalidate @submit.prevent="send">
          <!-- The PICKER, and only when there is something to pick. -->
          <Select
            v-if="picking"
            v-model="form.projectId"
            class="mb-6"
            label="Project"
            :options="projectOptions"
          />

          <BriefSummary v-if="!asking" :brief="preview" own :company-name="companyName" />

          <!-- The brief, when the project cannot be sent yet. The same two
               questions, labels and live hint as the recommendation's custom
               half, so a brief written here and one written there are the
               same brief. -->
          <div v-else class="space-y-4">
            <FormControl
              v-model="form.budget"
              type="select"
              label="Your budget"
              placeholder="Select a range"
              required
              :options="bands"
              :error="errors.budget"
            />
            <div>
              <Textarea
                v-model="form.scope"
                label="What do you want built?"
                placeholder="What do you make or sell, who are your customers, how does it run today, what keeps going wrong, and what must it connect to or prove?"
                :rows="5"
                required
                :error="errors.scope"
              />
              <p
                class="mt-1.5 text-p-sm leading-relaxed"
                :class="{
                  'text-ink-gray-5': hint.tone === 'neutral',
                  'text-ink-amber-7': hint.tone === 'warn',
                  'text-ink-green-7': hint.tone === 'good',
                }"
              >
                {{ hint.text }}
              </p>
            </div>
          </div>
        </form>
      </ScrollArea>
    </template>
  </Dialog>
</template>
