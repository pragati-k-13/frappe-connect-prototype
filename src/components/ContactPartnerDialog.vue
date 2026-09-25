<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Dialog, FormControl, Select, Textarea } from 'frappe-ui'
// Reached for directly because frappe-ui's `Dialog` renders `message` only as
// the FALLBACK content of its default slot — so any dialog with a body of its
// own loses the description, and the underlying primitive then warns that
// `aria-describedby` is missing. reka-ui is frappe-ui's own dialog dependency,
// not a new one. Same reasoning as `EstimateQuoteDialog`.
import { DialogDescription } from 'reka-ui'
import NewProjectDialog from './NewProjectDialog.vue'
import { PARTNERS } from '../data/partners'
import {
  briefComplete,
  briefErrors,
  budgetBandsFor,
  budgetLabel,
  scopeHint,
  timelineLabel,
} from '../data/custom'
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
//   a project     "Contact <partner>". The brief read-only when it is complete;
//                 when it is not, its two required answers asked here and
//                 saved to the project, so the next firm is not asked again.
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
  requirementsSentToast(
    to,
    () => router.push({ name: 'messages', query: { thread } }),
    store.projects.find((p) => p.id === id),
  )
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

  <Dialog :open="open" size="md" @update:open="!$event && close()">
    <template v-if="shownPartner" #title>
      <div>
        <h3 class="text-2xl font-semibold text-ink-gray-9">Contact {{ shownPartner.name }}</h3>
        <!-- What sending hands over, said before it is sent: the company goes
             with the brief. `pr-8` clears the ×, which the title slot does not
             reserve room for. -->
        <DialogDescription class="mt-1 pr-8 text-p-base text-ink-gray-5">
          Your requirements and company details are shared with them.
        </DialogDescription>
      </div>
    </template>

    <template v-if="shownPartner && project" #default>
      <form novalidate @submit.prevent="send">
        <!-- The PICKER, and only when there is something to pick. Manage stays
             visible beside it: this row is already interactive, and a control
             that hides beside another control reads as part of it. -->
        <div v-if="picking" class="flex items-center justify-between gap-3">
          <Select
            v-model="form.projectId"
            class="min-w-0 flex-1"
            label="Project"
            :options="projectOptions"
          />
          <Button class="shrink-0 self-end" variant="ghost" size="sm" label="Manage" @click="manage">
            <template #suffix><LucideArrowUpRight class="size-4" /></template>
          </Button>
        </div>

        <dl :class="picking ? 'mt-4 space-y-2' : 'space-y-2'">
          <!-- ⚠️ `group` + `opacity`, NOT `v-if`, for Manage: the button keeps
               its space, so revealing it cannot reflow the name beside it, and
               it stays in the tab order. -->
          <div v-if="!picking" class="group flex gap-6 text-p-base">
            <dt class="w-32 shrink-0 text-ink-gray-5">Project</dt>
            <dd class="flex min-w-0 items-center gap-1 font-medium text-ink-gray-8">
              <span class="min-w-0">{{ project.name }}</span>
              <Button
                class="-my-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                variant="ghost"
                size="sm"
                label="Manage"
                @click="manage"
              >
                <template #suffix><LucideArrowUpRight class="size-4" /></template>
              </Button>
            </dd>
          </div>

          <!-- The brief as the partner will read it: the same three facts the
               card in their thread leads with. `line-clamp-3`, not a cut
               string — the scope is whatever somebody typed. -->
          <template v-if="!asking">
            <div class="flex gap-6 text-p-base">
              <dt class="w-32 shrink-0 text-ink-gray-5">What you need</dt>
              <dd class="line-clamp-3 min-w-0 whitespace-pre-line text-ink-gray-8">
                {{ saved.scope }}
              </dd>
            </div>
            <div class="flex gap-6 text-p-base">
              <dt class="w-32 shrink-0 text-ink-gray-5">Budget</dt>
              <dd class="font-medium text-ink-gray-8">{{ budgetLabel(saved.budget) }}</dd>
            </div>
            <div v-if="saved.timeline" class="flex gap-6 text-p-base">
              <dt class="w-32 shrink-0 text-ink-gray-5">Timeline</dt>
              <dd class="font-medium text-ink-gray-8">{{ timelineLabel(saved.timeline) }}</dd>
            </div>
          </template>
        </dl>

        <!-- ── The brief, when the project cannot be sent yet ─────────────
             The same two questions, labels and live hint as the
             recommendation's custom half, so a brief written here and one
             written there are the same brief. -->
        <div v-if="asking" class="mt-5 space-y-4">
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

        <div class="mt-8">
          <Button class="w-full" variant="solid" size="sm" label="Send requirements" type="submit">
            <template #prefix><LucideSend class="size-4" /></template>
          </Button>
        </div>
      </form>
    </template>
  </Dialog>
</template>
