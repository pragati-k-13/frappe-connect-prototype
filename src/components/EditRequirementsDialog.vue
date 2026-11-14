<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Dialog, FormControl, ScrollArea, Textarea } from 'frappe-ui'
import AppsSelect from './AppsSelect.vue'
import PartnerCriteriaFields from './PartnerCriteriaFields.vue'
import { briefErrors, budgetBandsFor } from '../data/custom'
import { PARTNERS } from '../data/partners'
import { useConnectStore } from '../stores/connect'

// Editing requirements that have already been sent. The same fields a draft
// edits on its own page (budget, description, who they're looking for and
// when), in a dialog, because once sent the requirements live in threads, not
// on an editable page. See docs/edit-requirements.md.
//
// Company facts (size, how they run today, what they want fixed) are not here:
// they belong to Settings and are shared by every project.
const props = defineProps({
  open: { type: Boolean, default: false },
  projectId: { type: String, default: null },
})
// `cancel` lets the page go back to where Edit was opened from — the
// requirements view — rather than dropping the person on the page.
const emit = defineEmits(['update:open', 'saved', 'cancel'])

const store = useConnectStore()
// Held from the moment the dialog opens, so its text doesn't change while it
// fades out after the caller has already let go of the project.
const id = ref(null)
const project = computed(() => store.projects.find((p) => p.id === id.value) ?? null)
const count = ref(0)

const form = reactive({})
const tried = ref(false)
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen || !props.projectId) return
    id.value = props.projectId
    count.value = store.requirementsRecipients(props.projectId).length
    for (const k of Object.keys(form)) delete form[k]
    Object.assign(form, JSON.parse(JSON.stringify(store.briefOf(props.projectId))))
    // Older requirements can miss a criteria list; the fields expect arrays.
    for (const k of ['cities', 'tiers', 'regions', 'countries']) form[k] = form[k] ?? []
    form.projectApps = [...(store.projects.find((p) => p.id === props.projectId)?.apps ?? [])]
    tried.value = false
  },
)

const answers = computed(() => project.value?.answers ?? store.company)
const bands = computed(() => budgetBandsFor(answers.value.country))
const check = () => ({
  ...briefErrors({ scope: form.scope ?? '', budget: form.budget ?? '' }),
  ...(form.projectApps?.length ? {} : { apps: 'Pick at least one app' }),
})
const errors = computed(() => (tried.value ? check() : {}))

const requester = computed(() =>
  project.value?.hireRequest ? PARTNERS.find((p) => p.id === project.value.hireRequest) : null,
)
// Tall enough for the whole description, so the field doesn't scroll inside
// the dialog's own scroll area.
const rows = computed(() => {
  const text = form.scope ?? ''
  const lines = text.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 58)), 0)
  return Math.min(Math.max(lines + 1, 6), 16)
})
const label = computed(() =>
  requester.value
    ? 'Decline request and send'
    : `Send to ${count.value} ${count.value === 1 ? 'partner' : 'partners'}`,
)

function save() {
  tried.value = true
  if (Object.keys(check()).length) return
  const result = store.updateRequirements(id.value, { ...form })
  emit('update:open', false)
  // Nothing changed: the editor just closes, and nothing is posted.
  if (result) emit('saved', result)
}
</script>

<template>
  <Dialog
    :model-value="open"
    title="Edit requirements"
    size="md"
    @update:model-value="emit('update:open', $event)"
  >
    <template #default>
      <!-- frappe-ui's scrollbar, as in `BriefDetailsDialog`; the notice and the
           buttons stay pinned at the foot. -->
      <ScrollArea class="fc-scroll-dialog -mr-4 sm:-mr-6" viewport-class="pr-4 sm:pr-6">
        <form novalidate class="space-y-4" @submit.prevent="save">
          <FormControl
            v-model="form.budget"
            type="select"
            label="Your budget"
            placeholder="Select a range"
            required
            :options="bands"
            :error="errors.budget"
          />
          <AppsSelect v-model="form.projectApps" label="Apps" placeholder="Select" required :error="errors.apps" />
          <Textarea v-model="form.scope" label="Description" :rows="rows" required :error="errors.scope" />
          <PartnerCriteriaFields
            v-if="form.cities && form.tiers"
            :brief="form"
            :answers="answers"
            :total="false"
            :counts="false"
            @patch="Object.assign(form, $event)"
          />
        </form>
      </ScrollArea>
    </template>
    <template #actions>
      <!-- What saving does, before it happens. Who it goes to is on the button
           ("Send to 12 partners"), so the line says only what the button
           can't: what it asks of partners who quoted, and the hire request it
           declines. -->
      <div class="space-y-1 text-p-sm text-ink-gray-6">
        <p>Partners who quoted will confirm or update their quote.</p>
        <p v-if="requester">Saving declines {{ requester.name }}’s hire request. They can send a new one.</p>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <Button variant="subtle" size="sm" label="Cancel" @click="emit('update:open', false); emit('cancel')" />
        <Button variant="solid" size="sm" :label="label" @click="save" />
      </div>
    </template>
  </Dialog>
</template>
