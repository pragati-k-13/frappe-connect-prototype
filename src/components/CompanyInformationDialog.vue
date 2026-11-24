<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Button, Checkbox, Dialog, Dropdown, FormControl, FormLabel, MultiSelect, ScrollArea, toast } from 'frappe-ui'
import lumenLogo from '../assets/lumen-digital.svg'
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
//   - Saved as you go, unlike press, which saves only at the end: finding a
//     logo and an incorporation certificate takes time. Every change is kept
//     (`firmProfileDraft`), Continue marks a step done, and reopening goes to
//     the first step not done. So the dialog closes any way (Esc, outside
//     click, ×), and the footer says "Saved" rather than a toast after.
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
// Off while the dialog fills itself on open, so only the owner's own changes
// save.
let ready = false
const saved = ref(false)

watch(open, async (isOpen) => {
  if (!isOpen) return
  ready = false
  const progress = account.edits.firmProfileDraft
  for (const k of Object.keys(draft)) delete draft[k]
  Object.assign(
    draft,
    {
      company_name: account.firmName ?? demoName(account.edits.email) ?? '',
      country: account.edits.country ?? SELECTABLE_COUNTRY,
    },
    // Demo answers first, so a demo clicks straight through; what was saved
    // wins over them. Not once there's progress: then the draft is the whole
    // answer, so the checklist's "left" line and the dialog agree.
    progress
      ? {}
      : {
          ...DEMO_FIRM_PROFILE,
          verticals_served: [...DEMO_FIRM_PROFILE.verticals_served],
          existing_partnerships: [...DEMO_FIRM_PROFILE.existing_partnerships],
        },
    account.edits.firmProfile ?? {},
    progress?.values ?? {},
  )
  // Saved before partnerships became a multiselect: one name, not a list.
  if (typeof draft.existing_partnerships === 'string') draft.existing_partnerships = [draft.existing_partnerships]
  step.value = Math.min(progress?.stepsDone ?? 0, TOTAL - 1)
  submitted[0] = submitted[1] = submitted[2] = false
  saved.value = Boolean(progress)
  await nextTick()
  ready = true
})
function saveProgress(stepsDone = account.edits.firmProfileDraft?.stepsDone ?? 0) {
  account.saveFirmProfileDraft(JSON.parse(JSON.stringify(draft)), stepsDone)
  saved.value = true
}
watch(draft, () => ready && open.value && saveProgress(), { deep: true })

// "Company profile", as the checklist step and its button say.
const title = 'Company profile'
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
        company_name: lengthError(draft.company_name, 'Legal company name', 2, 140),
        address: lengthError(draft.address, 'Registered address', 10, 300),
        headquarter_city: lengthError(draft.headquarter_city, 'Head office city', 2, 80),
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
// The limits checkLogo and checkDoc enforce, said before the upload rather
// than in a hover tooltip. Once a file is attached, its row replaces this.
const logoHelp = 'Square image, under 5 MB. Shown on your listing.'
const certificateHelp = 'PDF or image, under 10 MB.'
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
// ── Uploads ─────────────────────────────────────────────────────────────────
// Empty, an Upload button over the limits. Attached, the file itself: a
// thumbnail (the logo) or file icon, its name and size, and Replace / Remove
// in a menu. frappe-ui's FileUploader has no look of its own and posts to a
// Frappe server; the demo keeps the file in the browser.
const fileInputs = reactive({})
const fileError = reactive({ company_logo: '', incorporation_certificate: '' })
// A picked logo shows from the file; the demo's own logo is Lumen's mark.
const logoPreview = ref(null)
const uploads = computed(() => [
  {
    key: 'company_logo',
    label: 'Company logo',
    accept: 'image/*',
    help: logoHelp,
    check: checkLogo,
    thumb: draft.company_logo ? logoPreview.value ?? lumenLogo : null,
    required: 'Company logo is required.',
  },
  {
    key: 'incorporation_certificate',
    label: 'Certificate of incorporation',
    accept: 'application/pdf,image/*',
    help: certificateHelp,
    check: checkDoc,
    thumb: null,
    required: 'Certificate of incorporation is required.',
  },
])
function pick(e, u) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  fileError[u.key] = u.check(file) ?? ''
  if (fileError[u.key]) return
  draft[u.key] = file.name
  draft[`${u.key}_size`] = file.size
  if (u.key === 'company_logo') logoPreview.value = URL.createObjectURL(file)
}
function removeFile(u) {
  draft[u.key] = null
  draft[`${u.key}_size`] = null
  if (u.key === 'company_logo') logoPreview.value = null
}
function fileActions(u) {
  return [
    { label: 'Replace', icon: 'lucide-refresh-cw', onClick: () => fileInputs[u.key]?.click() },
    { group: 'Remove', hideLabel: true, options: [{ label: 'Remove', icon: 'lucide-trash-2', theme: 'red', onClick: () => removeFile(u) }] },
  ]
}
function fileSize(bytes) {
  if (!bytes) return ''
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
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
  saveProgress(Math.max(account.edits.firmProfileDraft?.stepsDone ?? 0, step.value + 1))
  step.value += 1
}
function save() {
  account.saveFirmProfile({ ...draft, name: draft.company_name.trim(), country: draft.country })
  toast.success('Company profile saved')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" size="lg" :title="title">
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
        <FormControl v-model="draft.company_name" label="Legal company name" required size="sm" :error="errors1.company_name" />
        <FormControl v-model="draft.address" label="Registered address" required size="sm" :error="errors1.address" />
        <FormControl v-model="draft.headquarter_city" label="Head office city" required size="sm" :error="errors1.headquarter_city" />
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="No. of employees" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <FormControl v-model="draft.employee_range" type="select" size="sm" placeholder="Select" :options="rangeOptions" />
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
            <FormLabel label="Industries you serve" />
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
            <FormLabel label="ERP projects completed" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <FormControl v-model="draft.erp_implementations_range" type="select" size="sm" placeholder="Select" :options="rangeOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="Other partnerships" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <MultiSelect v-model="draft.existing_partnerships" class="w-full" size="sm" placeholder="Select" :options="partnershipOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <FormLabel label="Frappe-certified employees" />
            <span class="text-xs text-ink-gray-5">Optional</span>
          </div>
          <FormControl v-model="draft.certified_employees_range" type="select" size="sm" placeholder="Select" :options="certifiedOptions" />
        </div>
        <button type="submit" class="hidden" />
      </form>

      <!-- ── Step 3: documents and agreements, all required ───────────────── -->
      <form v-show="step === 2" class="flex flex-col gap-4" novalidate @submit.prevent="primary">
        <div v-for="u in uploads" :key="u.key" class="flex flex-col gap-1.5">
          <FormLabel :label="u.label" required />
          <input
            :ref="(el) => (fileInputs[u.key] = el)"
            type="file"
            :accept="u.accept"
            class="hidden"
            @change="pick($event, u)"
          />
          <div v-if="draft[u.key]" class="flex items-center gap-3 rounded-6 border border-outline-gray-2 p-2">
            <img v-if="u.thumb" :src="u.thumb" alt="" class="size-8 shrink-0 rounded-4 object-cover" />
            <span v-else class="flex size-8 shrink-0 items-center justify-center rounded-4 bg-surface-gray-2">
              <span class="lucide-file-text size-4 text-ink-gray-5" aria-hidden="true" />
            </span>
            <div class="flex min-w-0 flex-1 flex-col gap-1">
              <p class="truncate text-base text-ink-gray-8">{{ draft[u.key] }}</p>
              <p v-if="draft[`${u.key}_size`]" class="text-p-sm text-ink-gray-6">{{ fileSize(draft[`${u.key}_size`]) }}</p>
            </div>
            <Dropdown
              :options="fileActions(u)"
              :button="{ icon: 'lucide-more-horizontal', variant: 'ghost', 'aria-label': `More for ${u.label}` }"
              align="end"
            />
          </div>
          <template v-else>
            <div><Button label="Upload" icon-left="lucide-upload" @click="fileInputs[u.key]?.click()" /></div>
            <p class="text-p-sm text-ink-gray-6">{{ u.help }}</p>
          </template>
          <!-- frappe-ui's field error, as FormControl draws it (a Button has
               no :error). -->
          <p v-if="fileError[u.key] || errors3[u.key]" class="text-p-sm text-ink-red-5">
            {{ fileError[u.key] || u.required }}
          </p>
        </div>

        <div class="mt-1 flex flex-col gap-3">
          <Checkbox
            v-model="draft.agreed_to_due_diligence"
            label="I agree to Frappe’s due diligence checks"
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
              <a :href="PARTNERSHIP_AGREEMENT_LINK" target="_blank" rel="noopener noreferrer" class="underline">partnership agreement</a>
              <!-- The label slot drops frappe-ui's own mark; this is its markup. -->
              <span class="ml-1 select-none text-ink-red-5" aria-hidden="true">*</span>
              <span class="sr-only">(required)</span>
            </template>
          </Checkbox>
        </div>
      </form>
      </div>
    </ScrollArea>

    <!-- Back sits next to the main action, on the right. Left, that what's
         been filled in is kept. -->
    <template #actions>
      <div class="flex w-full items-center justify-end gap-2">
        <p v-if="saved" class="mr-auto flex items-center gap-1 text-sm text-ink-gray-5" role="status">
          <span class="lucide-check size-4" aria-hidden="true" />
          Saved
        </p>
        <Button v-if="step > 0" variant="subtle" size="sm" label="Back" @click="step -= 1" />
        <Button variant="solid" size="sm" :label="primaryLabel" @click="primary" />
      </div>
    </template>
  </Dialog>
</template>

