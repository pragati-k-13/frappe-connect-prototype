<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Checkbox, Combobox, Dialog, FormControl, FormLabel, MultiSelect, Progress, ScrollArea, Tooltip, toast } from 'frappe-ui'
import { COUNTRY_OPTIONS_INDIA_ONLY, SELECTABLE_COUNTRY } from '../data/company'
import { usePartnerAccountStore } from '../stores/partnerAccount'

// The checklist's "Fill out company information": three steps, then saved.
//
// ⚠️ COPIED FROM FRAPPE CLOUD (press, `dashboard/src/onboarding/
// onboardingLeftContainer/modal/CompanyInformationModal.vue` and its three
// `CompanyInformationForm…Step.vue`): the same steps, fields, options, copy,
// validation and layout. What differs:
//   - Country is asked in step 1. Press has it from its registration step,
//     which Connect doesn't have; it sets the MRR target and currency.
//   - Files are picked, not uploaded: there is no backend. The name shows as
//     press shows the uploaded file's URL.
//   - Verticals use frappe-ui's MultiSelect, not a native multiple select.
//   - frappe-ui throughout: Progress for the step bar, subtle (filled) fields
//     rather than press's outline ones, and frappe-ui's required marks.
const open = defineModel('open', { type: Boolean, default: false })
const account = usePartnerAccountStore()

const TOTAL = 3
const step = ref(0)
const draft = reactive({})
const submitted = reactive({ 0: false, 2: false })

watch(open, (isOpen) => {
  if (!isOpen) return
  for (const k of Object.keys(draft)) delete draft[k]
  Object.assign(
    draft,
    { company_name: account.firmName ?? '', country: SELECTABLE_COUNTRY, revenue_currency: 'INR', verticals_served: [] },
    account.edits.firmProfile ?? {},
  )
  step.value = 0
  submitted[0] = submitted[2] = false
})

const displayName = computed(() => draft.company_name?.trim() || account.firmName || 'your company')
const title = computed(() => `Tell us more about ${displayName.value}`)
const primaryLabel = computed(() => (step.value === TOTAL - 1 ? 'Save details' : 'Continue'))

// ── Step 1 ──────────────────────────────────────────────────────────────────
const currencyOptions = [
  { label: 'INR (Indian Rupees)', value: 'INR' },
  { label: 'USD (US Dollar)', value: 'USD' },
  { label: 'EUR (Euro)', value: 'EUR' },
]
const rangeOptions = ['1-10', '11-50', '51-200', '201+'].map((v) => ({ label: v, value: v }))
const certifiedOptions = ['0', '1-5', '6-20', '21+'].map((v) => ({ label: v, value: v }))
// Currency follows the country, as in press.
watch(
  () => draft.country,
  (c) => c && (draft.revenue_currency = c === 'India' ? 'INR' : 'USD'),
)
const currencyPrefix = computed(() => ({ USD: '$', EUR: '€' })[draft.revenue_currency] ?? '₹')
const mrrTargetLabel = computed(() => (draft.country === 'India' ? '₹10,000' : '$100'))

const lengthError = (value, label, min, max) => {
  const v = String(value || '').trim()
  if (!v) return `${label} is required.`
  if (v.length < min) return `${label} must be at least ${min} characters.`
  if (v.length > max) return `${label} must be ${max} characters or less.`
  return ''
}
const revenueError = (value) => {
  const v = String(value || '').trim()
  if (!v) return ''
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return 'Annual revenue must be a valid amount.'
  if (v.replace(/\D/g, '').length > 12) return 'Annual revenue must be 12 digits or less.'
  return ''
}
const errors1 = computed(() =>
  submitted[0]
    ? {
        company_name: lengthError(draft.company_name, 'Company name', 2, 140),
        address: lengthError(draft.address, 'Address', 10, 300),
        headquarter_city: lengthError(draft.headquarter_city, 'Headquarter city', 2, 80),
        annual_revenue: revenueError(draft.annual_revenue),
      }
    : {},
)

// ── Step 2 ──────────────────────────────────────────────────────────────────
const verticalOptions = [
  'Manufacturing', 'Retail', 'Services', 'Banking and Finance', 'Distribution and Trading',
  'Hospitality', 'Real Estate', 'Automotive', 'Government', 'Education', 'Healthcare',
  'Non-profit', 'Other',
].map((v) => ({ label: v, value: v }))

// ── Step 3 ──────────────────────────────────────────────────────────────────
const partnershipOptions = ['SAP', 'Odoo', 'Oracle', 'Microsoft'].map((v) => ({ label: v, value: v }))
const PARTNERSHIP_AGREEMENT_LINK = 'https://frappe.io/partners/terms'
const logoHelp =
  'Upload your company logo. This will be displayed on the partner listing — use a square image that is not too large.'
const certificateHelp =
  'Upload your certificate of incorporation or equivalent company registration document. This helps us verify your legal entity before partnership approval.'
const errors3 = computed(() =>
  submitted[2]
    ? {
        company_logo: !draft.company_logo,
        incorporation_certificate: !draft.incorporation_certificate,
        due_diligence: !draft.agreed_to_due_diligence,
        partnership_agreement: !draft.agreed_to_partnership_agreement,
      }
    : {},
)
const logoInput = ref(null)
const certInput = ref(null)
const fileError = reactive({ logo: '', cert: '' })
function pick(e, key, which, check) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  fileError[which] = check(file) ?? ''
  if (!fileError[which]) draft[key] = file.name
}
const checkLogo = (f) =>
  !f.type.startsWith('image/') ? 'Upload an image file.' : f.size > 5 * 1024 * 1024 ? 'Logo must be under 5 MB.' : null
const checkDoc = (f) =>
  !(f.type === 'application/pdf' || f.type.startsWith('image/'))
    ? 'Upload a PDF or image file.'
    : f.size > 10 * 1024 * 1024
      ? 'File size must be under 10 MB.'
      : null

// ── Moving through ──────────────────────────────────────────────────────────
function primary() {
  if (step.value === 0) {
    submitted[0] = true
    if (Object.values(errors1.value).some(Boolean)) return
  }
  if (step.value === 2) {
    submitted[2] = true
    if (Object.values(errors3.value).some(Boolean)) return
    return save()
  }
  step.value += 1
}
function save() {
  account.saveFirmProfile({ ...draft, name: draft.company_name.trim(), country: draft.country })
  toast.success('Company details updated')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" size="2xl" :dismissible="false" :show-close-button="false">
    <div class="mb-5">
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <!-- No step count: the segmented Progress under the title shows it. -->
          <h3 class="truncate text-2xl-semibold leading-6 text-ink-gray-8">{{ title }}</h3>
        </div>
        <Button variant="ghost" icon="lucide-x" aria-label="Close" class="-mr-1" @click="open = false" />
      </div>
      <!-- frappe-ui's Progress, one segment per step, where press draws its
           own bar. -->
      <Progress class="mt-4" size="sm" :intervals="TOTAL" :value="((step + 1) / TOTAL) * 100" />
    </div>

    <!-- The repo's dialog scroll (`fc-scroll-dialog`, as in AddLeadDialog):
         the header stays put and only the fields scroll, on frappe-ui's
         scrollbar. The inner min height keeps the three steps one height,
         as in press. -->
    <ScrollArea class="fc-scroll-dialog -mr-4 sm:-mr-6" viewport-class="pr-4 sm:pr-6">
      <div class="min-h-[360px] px-px">
      <!-- ── Step 1 ─────────────────────────────────────────────────────── -->
      <form v-show="step === 0" class="flex flex-col gap-5" novalidate @submit.prevent="primary">
        <FormControl v-model="draft.company_name" label="Registered company" required size="sm" :class="{ 'fc-has-error': errors1.company_name }" />
        <p v-if="errors1.company_name" class="-mt-3 text-sm text-ink-red-4">{{ errors1.company_name }}</p>

        <FormControl v-model="draft.address" label="Address" required size="sm" placeholder="Company's registered address" :class="{ 'fc-has-error': errors1.address }" />
        <p v-if="errors1.address" class="-mt-3 text-sm text-ink-red-4">{{ errors1.address }}</p>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-5">
            <FormControl v-model="draft.headquarter_city" label="Headquarter city" required size="sm" placeholder="Headquarter city" :class="{ 'fc-has-error': errors1.headquarter_city }" />
            <p v-if="errors1.headquarter_city" class="-mt-3 text-sm text-ink-red-4">{{ errors1.headquarter_city }}</p>
          </div>
          <!-- India only for now, as on every form that asks: see
               `COUNTRY_OPTIONS_INDIA_ONLY`. -->
          <Combobox v-model="draft.country" label="Country" required size="sm" trigger="button" placeholder="Select a country" :options="COUNTRY_OPTIONS_INDIA_ONLY" />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-ink-gray-6">Annual revenue</span>
              <span class="text-xs text-ink-gray-5">Optional</span>
            </div>
            <div class="relative">
              <span class="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-ink-gray-6">{{ currencyPrefix }}</span>
              <FormControl v-model="draft.annual_revenue" size="sm" placeholder="Amount" :class="['[&_input]:pl-7', { 'fc-has-error': errors1.annual_revenue }]" />
            </div>
            <p v-if="errors1.annual_revenue" class="text-sm text-ink-red-4">{{ errors1.annual_revenue }}</p>
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-ink-gray-6">Revenue currency</span>
              <span class="text-xs text-ink-gray-5">Optional</span>
            </div>
            <FormControl v-model="draft.revenue_currency" type="select" size="sm" :options="currencyOptions" />
            <p class="text-xs leading-4 text-ink-gray-5">Partner MRR target for this country: {{ mrrTargetLabel }}.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-ink-gray-6">No. of employees</span>
              <span class="text-xs text-ink-gray-5">Optional</span>
            </div>
            <FormControl v-model="draft.employee_range" type="select" size="sm" placeholder="Select a range" :options="rangeOptions" />
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-ink-gray-6">No. of certified employees</span>
              <span class="text-xs text-ink-gray-5">Optional</span>
            </div>
            <FormControl v-model="draft.certified_employees_range" type="select" size="sm" placeholder="Select" :options="certifiedOptions" />
          </div>
        </div>
        <button type="submit" class="hidden" />
      </form>

      <!-- ── Step 2 ─────────────────────────────────────────────────────── -->
      <form v-show="step === 1" class="flex flex-col gap-5" novalidate @submit.prevent="primary">
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-ink-gray-6">Verticals served</span>
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <MultiSelect v-model="draft.verticals_served" class="w-full" size="sm" placeholder="Select" :options="verticalOptions" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-ink-gray-6">No. of customers</span>
              <span class="text-xs text-ink-gray-5">Optional</span>
            </div>
            <FormControl v-model="draft.customer_count_range" type="select" size="sm" placeholder="Select" :options="rangeOptions" />
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-ink-gray-6">No. of ERPNext customers</span>
              <span class="text-xs text-ink-gray-5">Optional</span>
            </div>
            <FormControl v-model="draft.erpnext_customer_count_range" type="select" size="sm" placeholder="Select" :options="rangeOptions" />
          </div>
        </div>
      </form>

      <!-- ── Step 3 ─────────────────────────────────────────────────────── -->
      <form v-show="step === 2" class="flex min-h-[360px] flex-col gap-5" novalidate @submit.prevent="primary">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-ink-gray-6">Existing Partnerships</span>
              <span class="text-xs text-ink-gray-5">Optional</span>
            </div>
            <FormControl v-model="draft.existing_partnerships" type="select" size="sm" placeholder="Select" :options="partnershipOptions" />
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-ink-gray-6">No. of ERP implementations</span>
              <span class="text-xs text-ink-gray-5">Optional</span>
            </div>
            <FormControl v-model="draft.erp_implementations_range" type="select" size="sm" placeholder="Select" :options="rangeOptions" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1">
              <FormLabel label="Company logo" required />
              <Tooltip :text="logoHelp"><span class="lucide-circle-help size-3 text-ink-gray-5" aria-hidden="true" /></Tooltip>
            </div>
            <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="pick($event, 'company_logo', 'logo', checkLogo)" />
            <Button class="w-full !justify-start" :label="draft.company_logo ? 'Replace logo' : 'Upload logo'" @click="logoInput.click()" />
            <p v-if="draft.company_logo" class="mt-1 truncate text-xs text-ink-gray-6">{{ draft.company_logo }}</p>
            <p v-if="fileError.logo" class="mt-1 text-sm text-ink-red-4">{{ fileError.logo }}</p>
            <p v-if="errors3.company_logo" class="text-sm text-ink-red-4">Company logo is required.</p>
          </div>
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1">
              <FormLabel label="Incorporation certificate" required />
              <Tooltip :text="certificateHelp"><span class="lucide-circle-help size-3 text-ink-gray-5" aria-hidden="true" /></Tooltip>
            </div>
            <input ref="certInput" type="file" accept="application/pdf,image/*" class="hidden" @change="pick($event, 'incorporation_certificate', 'cert', checkDoc)" />
            <Button class="w-full !justify-start" :label="draft.incorporation_certificate ? 'Replace document' : 'Attach document'" @click="certInput.click()" />
            <p v-if="draft.incorporation_certificate" class="mt-1 truncate text-xs text-ink-gray-6">{{ draft.incorporation_certificate }}</p>
            <p v-if="fileError.cert" class="mt-1 text-sm text-ink-red-4">{{ fileError.cert }}</p>
            <p v-if="errors3.incorporation_certificate" class="text-sm text-ink-red-4">Incorporation certificate is required.</p>
          </div>
        </div>

        <div class="mt-1 flex flex-col gap-3">
          <Checkbox v-model="draft.agreed_to_due_diligence" label="I shall abide by the due diligence" required />
          <p v-if="errors3.due_diligence" class="-mt-2 text-sm text-ink-red-4">Due diligence confirmation is required.</p>
          <Checkbox v-model="draft.agreed_to_partnership_agreement" required>
            <template #label>
              I accept the
              <a :href="PARTNERSHIP_AGREEMENT_LINK" target="_blank" rel="noopener noreferrer" class="underline">Partnership agreement</a>
              <!-- The label slot drops frappe-ui's own mark; this is its markup. -->
              <span class="ml-1 select-none text-ink-red-5" aria-hidden="true">*</span>
              <span class="sr-only">(required)</span>
            </template>
          </Checkbox>
          <p v-if="errors3.partnership_agreement" class="-mt-2 text-sm text-ink-red-4">Partnership agreement acceptance is required.</p>
        </div>
      </form>
      </div>
    </ScrollArea>

    <template #actions>
      <div class="flex justify-end">
        <div class="flex items-center gap-2">
          <Button v-if="step > 0" variant="subtle" size="sm" label="Back" @click="step -= 1" />
          <Button variant="solid" size="sm" :label="primaryLabel" @click="primary" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.fc-has-error :deep(input),
.fc-has-error :deep(button) {
  border-color: var(--outline-red-3);
}
</style>
