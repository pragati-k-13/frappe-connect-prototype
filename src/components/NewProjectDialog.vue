<script setup>
import { computed, ref, watch } from 'vue'
import { Button, Checkbox, Dialog, TextInput } from 'frappe-ui'
import { MODULES, moduleHours } from '../data/modules'

// Starting a project before deciding how to have it built.
//
// ⚠️ This is the ONLY door that produces a project with no service. Every other
// way in — booking a pack — arrives with the service and the partner already
// settled, which means without this dialog the "no service yet" state would be
// unreachable and the tracker would never have to handle it. It does handle it,
// because businesses write down what they want long before they work out who
// is building it.
//
// Two questions and no more. A name, and what it covers. Everything else the
// project will eventually carry — service, partner, stages, a price — is
// decided later BY the tracker, and asking for any of it here would be asking
// someone to choose before they have seen the options.
const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'create'])

const name = ref('')
const picked = ref([])

// ⚠️ ERPNext only, and that isn't a shortcut — it is the catalogue's own shape.
// `data/modules.js` carries no CRM list (starter packs are ERP work) and does
// not break the Frappe HR app into modules either, so `modulesFor` returns an
// empty list for both. Offering an app with nothing under it reads as a bug.
const APP = 'erpnext'
const modules = MODULES[APP] ?? []

// Cleared on open rather than on close: a dialog that empties itself while it
// is animating out shows the reader their answers being wiped.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    name.value = ''
    picked.value = []
  },
)

const toggle = (key) =>
  (picked.value = picked.value.includes(key)
    ? picked.value.filter((k) => k !== key)
    : [...picked.value, key])

// The estimate the picker adds up to, in hours. Real: it is the same
// `moduleHours` the quote modal prices, so a project made here and estimated
// later reports the same number.
//
// ⚠️ Hours, not money. A price needs a partner's rate and there is no partner
// yet — quoting one here would be the screen inventing a figure at the exact
// moment it has least to go on.
const hours = computed(() =>
  modules.filter((m) => picked.value.includes(m.key)).reduce((n, m) => n + moduleHours(m), 0),
)

// The scope is OPTIONAL and the name is not. A project you cannot name is a
// project you cannot find in the list tomorrow; a project whose modules are
// undecided is most of them on day one.
const valid = computed(() => name.value.trim().length > 0)

const create = () => {
  if (!valid.value) return
  emit('create', {
    name: name.value,
    // ⚠️ The app, recorded alongside the modules rather than left to be
    // inferred from their keys. A project's `apps` is the answer nothing else
    // holds — an app with no module catalogue behind it — so a project that
    // never said which app it was in reads as one with no app at all wherever
    // that field is shown, which is now the inquiry dialog's own summary.
    // Empty when nothing was picked: this dialog never asks the question
    // directly, so ERPNext is only true here if an ERPNext module is.
    apps: picked.value.length ? [APP] : [],
    // Keyed by app, matching every other module scope in the app — see
    // `store.defaultScope` and `EstimateQuoteDialog`.
    modules: picked.value.length ? { [APP]: [...picked.value] } : {},
  })
}
</script>

<template>
  <Dialog :model-value="open" title="New project" @update:model-value="!$event && emit('close')">
    <!-- Default slot, not `#body-content`: this version of frappe-ui's Dialog
         exposes only `default`, `title` and `actions`. `#body-content` is the
         older API and fails silently. -->
    <template #default>
      <div class="space-y-5">
        <div>
          <TextInput
            v-model="name"
            label="What are you building?"
            size="md"
            placeholder="ERP rollout"
            @keyup.enter="create"
          />
        </div>

        <div>
          <div class="flex items-baseline justify-between gap-3">
            <span class="text-sm text-ink-gray-6">What does it cover?</span>
            <!-- ⚠️ "Optional" stated, not implied by the absence of a required
                 mark. This is the one field someone will stall on — it is a
                 question about a system they have not bought yet — and the
                 cheapest way past it is to say out loud that it can be left. -->
            <span class="shrink-0 text-p-sm text-ink-gray-5">Optional</span>
          </div>

          <ul class="mt-2 grid grid-cols-2 gap-x-4 gap-y-2.5">
            <li v-for="m in modules" :key="m.key">
              <Checkbox
                :model-value="picked.includes(m.key)"
                :label="m.label"
                size="sm"
                @update:model-value="toggle(m.key)"
              />
            </li>
          </ul>

          <!-- The running total, and only once something is picked: a standing
               "0 hrs" is a number that has never meant anything. -->
          <p v-if="hours" class="mt-3 text-p-sm text-ink-gray-6">
            About {{ hours }} hrs of work, on the standard scope.
            <span class="text-ink-gray-5">A partner's own estimate may differ.</span>
          </p>
        </div>
      </div>
    </template>

    <template #actions>
      <div class="flex justify-end gap-2">
        <Button variant="subtle" label="Cancel" @click="emit('close')" />
        <Button variant="solid" label="Create project" :disabled="!valid" @click="create" />
      </div>
    </template>
  </Dialog>
</template>
