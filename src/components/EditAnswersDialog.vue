<script setup>
import { reactive, ref, watch } from 'vue'
import { Button, Dialog, toast } from 'frappe-ui'
import CompanyQuestions from './CompanyQuestions.vue'
import { COMPANY_STEPS, companyErrors, companyPayload, emptyCompanyForm } from '../data/company'
import { useConnectStore } from '../stores/connect'

// The intake's questions again, for correcting one of them.
//
// ⚠️ A DIALOG RATHER THAN A TRIP BACK TO THE LANDING PAGE, which is what
// "Change my answers" used to do. That redirect dropped somebody out of a
// purchase onto a marketing page — hero, packs table, success stories — and
// made them walk three steps to fix one field. The recommendation stays on
// screen behind this, and re-runs underneath the moment it is saved.
//
// ⚠️ NOT STEPPED, and that is the difference between the two surfaces rather
// than an inconsistency. The intake is stepped because it is a first encounter
// and three questions at once is a form nobody starts. This is a CORRECTION:
// the person already knows which answer is wrong, and a three-step wizard to
// reach it is a wall around a single field.
const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open'])

const store = useConnectStore()

const form = reactive(emptyCompanyForm())
const tried = ref(false)

// ⚠️ RE-SEEDED ON EVERY OPEN. A draft that survived a cancel would hand the next
// open whatever was abandoned last time, and the point of Cancel is that it
// leaves the answers alone.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    Object.assign(form, emptyCompanyForm(), {
      country: store.company.country,
      employees: store.company.employees,
      segments: [...(store.company.segments ?? [])],
      apps: [...(store.company.apps ?? [])],
      appsOther: store.company.appsOther ?? '',
      operations: store.company.operations ?? '',
      problems: [...(store.company.problems ?? [])],
    })
    tried.value = false
  },
  { immediate: true },
)

const save = () => {
  tried.value = true
  if (Object.keys(companyErrors(form)).length) return
  store.saveCompany(companyPayload(form))
  // ⚠️ THE BASKET IS CLEARED so the recommendation can re-seed it. Someone who
  // corrects their industry and finds the old industry's pack still ticked has
  // been given an answer to a question they withdrew.
  store.setPacks([])
  store.seedRecommendedPacks()
  emit('update:open', false)
  toast.success('Answers updated')
}
</script>

<template>
  <Dialog
    :model-value="open"
    title="Your answers"
    size="lg"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <!-- ⚠️ THE SAME FIELDS COMPONENT THE INTAKE USES, rendered three times
           rather than copied once. Two surfaces asking the same questions from
           two blocks of markup is how one of them comes to ask for a segment
           while the other asks for an industry. -->
      <div class="space-y-6">
        <div v-for="step in COMPANY_STEPS" :key="step">
          <CompanyQuestions
            :step="step"
            :form="form"
            :errors="tried ? companyErrors(form) : {}"
          />
        </div>
      </div>

      <div class="mt-6 flex items-center gap-2">
        <Button variant="solid" label="Save answers" @click="save" />
        <Button variant="ghost" label="Cancel" @click="emit('update:open', false)" />
      </div>
    </template>
  </Dialog>
</template>
