<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Checkbox, Dialog, FormControl, FormLabel, MultiSelect, ScrollArea, Tooltip, toast } from 'frappe-ui'
import { DEMO_FIRM_PROFILE, SELECTABLE_COUNTRY } from '../data/company'
import { usePartnerAccountStore } from '../stores/partnerAccount'

// The checklist's "Fill out company information": three steps, then saved.
//
// ⚠️ COPIED FROM FRAPPE CLOUD (press, `dashboard/src/onboarding/
// onboardingLeftContainer/modal/CompanyInformationModal.vue` and its three
// `CompanyInformationForm…Step.vue`): the same steps, fields, options, copy,
// validation and options. What differs:
//   - Fields are grouped by need, not press's order: step 1 is the required
//     company facts, step 2 everything optional, step 3 the required
//     documents and agreements. A firm in a hurry fills three fields, clicks
//     through step 2 and attaches the documents.
//   - Country isn't asked: it comes from partner sign-up, as press's comes
//     from its registration step. It sets the currency and MRR target.
//   - Files are picked, not uploaded: there is no backend. The name shows as
//     press shows the uploaded file's URL.
//   - Verticals use frappe-ui's MultiSelect, not a native multiple select.
//   - frappe-ui throughout, laid out as frappe-ui's own wizard (the Dialog
//     docs' "New project setup"): its segmented step bar, the Dialog's own
//     title and close, size lg, fields 16px apart, field
//     errors through `:error`. Subtle (filled) fields
//     rather than press's outline ones, and frappe-ui's required marks.
const open = defineModel('open', { type: Boolean, default: false })
const account = usePartnerAccountStore()

const TOTAL = 3
// A firm that just signed up has no name yet: the demo takes it from the work
// email's domain (ravi@brightpath.example → Brightpath).
const demoName = (email) => {
  const d = email?.split('@')[1]?.split('.')[0]
  return d ? d.charAt(0).toUpperCase() + d.slice(1) : null
}
const step = ref(0)
const draft = reactive({})
const submitted = reactive({ 0: false, 1: false, 2: false })

watch(open, (isOpen) => {
  if (!isOpen) return
  for (const k of Object.keys(draft)) delete draft[k]
  Object.assign(
    draft,
    {
      company_name: account.firmName ?? demoName(account.edits.email) ?? '',
      country: account.edits.country ?? SELECTABLE_COUNTRY,
    },
    // Demo answers first, so a demo clicks straight through; what was saved
    // wins over them.
    { ...DEMO_FIRM_PROFILE, verticals_served: [...DEMO_FIRM_PROFILE.verticals_served] },
    account.edits.firmProfile ?? {},
  )
  step.value = 0
  submitted[0] = submitted[1] = submitted[2] = false
})

const displayName = computed(() => draft.company_name?.trim() || account.firmName || 'your company')
const title = computed(() => `Tell us more about ${displayName.value}`)
const primaryLabel = computed(() => (step.value === TOTAL - 1 ? 'Save details' : 'Continue'))

// ── Step 2's options and checks (step 1 is three text fields) ──────────────
const currencyOptions = [
  { label: 'INR (Indian Rupees)', value: 'INR' },
  { label: 'USD (US Dollar)', value: 'USD' },
  { label: 'EUR (Euro)', value: 'EUR' },
]
const rangeOptions = ['1-10', '11-50', '51-200', '201+'].map((v) => ({ label: v, value: v }))
const certifiedOptions = ['0', '1-5', '6-20', '21+'].map((v) => ({ label: v, value: v }))
// Currency follows the country from sign-up, as in press.
watch(open, (isOpen) => {
  if (isOpen && !draft.revenue_currency) draft.revenue_currency = draft.country === 'India' ? 'INR' : 'USD'
})
const currencyPrefix = computed(() => ({ USD: '$', EUR: '€' })[draft.revenue_currency] ?? '₹')

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
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return 'Enter a valid amount.'
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
  <Dialog v-model:open="open" size="lg" :title="title" :dismissible="false">
    <!-- frappe-ui's wizard step bar, as in its Dialog docs: one segment per
         step, done ones dark. No step count; the bar shows it. -->
    <div class="mb-5 flex items-center gap-1.5" aria-hidden="true">
      <span
        v-for="i in TOTAL"
        :key="i"
        class="h-1 flex-1 rounded-full transition-colors"
        :class="i - 1 <= step ? 'bg-surface-gray-10' : 'bg-surface-gray-3'"
      />
    </div>

    <!-- The repo's dialog scroll (`fc-scroll-dialog`, as in AddLeadDialog):
         the header stays put and only the fields scroll, on frappe-ui's
         scrollbar. The inner min height keeps the three steps one height,
         as in press. -->
    <ScrollArea class="fc-scroll-dialog -mr-4 sm:-mr-6" viewport-class="pr-4 sm:pr-6">
      <div class="min-h-[400px] px-px">
      <!-- One column on every step: at this width two-column rows wrapped
           their labels. Grouped by topic, 5 / 6 / 4 rows. -->
      <!-- ── Step 1: the company. The three required facts first. ──────── -->
      <form v-show="step === 0" class="flex flex-col gap-4" novalidate @submit.prevent="primary">
        <FormControl v-model="draft.company_name" label="Registered company" required size="sm" :error="errors1.company_name" />
        <FormControl v-model="draft.address" label="Address" required size="sm" placeholder="Company's registered address" :error="errors1.address" />
        <FormControl v-model="draft.headquarter_city" label="Headquarter city" required size="sm" placeholder="Headquarter city" :error="errors1.headquarter_city" />
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="No. of employees" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <FormControl v-model="draft.employee_range" type="select" size="sm" placeholder="Select a range" :options="rangeOptions" />
        </div>
        <!-- Amount and currency under one label. -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="Annual revenue" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <div class="flex items-start gap-2">
            <div class="relative min-w-0 flex-1">
              <span class="pointer-events-none absolute left-3 top-3.5 z-10 -translate-y-1/2 text-sm text-ink-gray-6">{{ currencyPrefix }}</span>
              <FormControl v-model="draft.annual_revenue" size="sm" placeholder="Amount" class="[&_input]:pl-7" :error="errors1.annual_revenue" />
            </div>
            <!-- The select is w-full itself, so its width comes from here. -->
            <div class="w-48 shrink-0">
              <FormControl v-model="draft.revenue_currency" type="select" size="sm" aria-label="Revenue currency" :options="currencyOptions" />
            </div>
          </div>
        </div>
        <button type="submit" class="hidden" />
      </form>

      <!-- ── Step 2: experience, all optional ────────────────────────────── -->
      <form v-show="step === 1" class="flex flex-col gap-4" novalidate @submit.prevent="primary">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="Verticals served" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <MultiSelect v-model="draft.verticals_served" class="w-full" size="sm" placeholder="Select" :options="verticalOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="No. of customers" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <FormControl v-model="draft.customer_count_range" type="select" size="sm" placeholder="Select" :options="rangeOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="No. of ERPNext customers" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <FormControl v-model="draft.erpnext_customer_count_range" type="select" size="sm" placeholder="Select" :options="rangeOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="No. of ERP implementations" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <FormControl v-model="draft.erp_implementations_range" type="select" size="sm" placeholder="Select" :options="rangeOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="Existing partnerships" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <FormControl v-model="draft.existing_partnerships" type="select" size="sm" placeholder="Select" :options="partnershipOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="No. of certified employees" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <FormControl v-model="draft.certified_employees_range" type="select" size="sm" placeholder="Select" :options="certifiedOptions" />
        </div>
        <button type="submit" class="hidden" />
      </form>

      <!-- ── Step 3: documents and agreements, all required ───────────────── -->
      <form v-show="step === 2" class="flex flex-col gap-4" novalidate @submit.prevent="primary">
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-1">
            <FormLabel label="Company logo" required />
            <Tooltip :text="logoHelp"><span class="lucide-circle-help size-3 text-ink-gray-5" aria-hidden="true" /></Tooltip>
          </div>
          <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="pick($event, 'company_logo', 'logo', checkLogo)" />
          <Button class="w-full !justify-start" :label="draft.company_logo ? 'Replace logo' : 'Upload logo'" @click="logoInput.click()" />
          <p v-if="draft.company_logo" class="truncate text-xs text-ink-gray-6">{{ draft.company_logo }}</p>
          <!-- frappe-ui's field error, as FormControl draws it (a Button has
               no :error). -->
          <p v-if="fileError.logo || errors3.company_logo" class="text-p-sm text-ink-red-5">
            {{ fileError.logo || 'Company logo is required.' }}
          </p>
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-1">
            <FormLabel label="Incorporation certificate" required />
            <Tooltip :text="certificateHelp"><span class="lucide-circle-help size-3 text-ink-gray-5" aria-hidden="true" /></Tooltip>
          </div>
          <input ref="certInput" type="file" accept="application/pdf,image/*" class="hidden" @change="pick($event, 'incorporation_certificate', 'cert', checkDoc)" />
          <Button class="w-full !justify-start" :label="draft.incorporation_certificate ? 'Replace document' : 'Attach document'" @click="certInput.click()" />
          <p v-if="draft.incorporation_certificate" class="truncate text-xs text-ink-gray-6">{{ draft.incorporation_certificate }}</p>
          <p v-if="fileError.cert || errors3.incorporation_certificate" class="text-p-sm text-ink-red-5">
            {{ fileError.cert || 'Incorporation certificate is required.' }}
          </p>
        </div>

        <div class="mt-1 flex flex-col gap-3">
          <Checkbox
            v-model="draft.agreed_to_due_diligence"
            label="I shall abide by the due diligence"
            required
            :error="errors3.due_diligence ? 'Due diligence confirmation is required.' : ''"
          />
          <Checkbox
            v-model="draft.agreed_to_partnership_agreement"
            required
            :error="errors3.partnership_agreement ? 'Partnership agreement acceptance is required.' : ''"
          >
            <template #label>
              I accept the
              <a :href="PARTNERSHIP_AGREEMENT_LINK" target="_blank" rel="noopener noreferrer" class="underline">Partnership agreement</a>
              <!-- The label slot drops frappe-ui's own mark; this is its markup. -->
              <span class="ml-1 select-none text-ink-red-5" aria-hidden="true">*</span>
              <span class="sr-only">(required)</span>
            </template>
          </Checkbox>
        </div>
      </form>
      </div>
    </ScrollArea>

    <!-- Back sits next to the main action, on the right. -->
    <template #actions>
      <div class="flex w-full justify-end gap-2">
        <Button v-if="step > 0" variant="subtle" size="sm" label="Back" @click="step -= 1" />
        <Button variant="solid" size="sm" :label="primaryLabel" @click="primary" />
      </div>
    </template>
  </Dialog>
</template>

