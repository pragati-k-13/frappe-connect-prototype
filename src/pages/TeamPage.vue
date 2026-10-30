<script setup>
import { computed, ref } from 'vue'
import { Avatar, Badge, Button, Checkbox, Dialog, Dropdown, FormControl, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { ROLE_LABEL } from '../data/partnerAccount'
import { TIERS, longDate, nextTier, standingFor } from '../data/partnership'

// SCREEN — Team: everyone at the firm in one list. Who counts toward the
// consultants criterion, and who can sign in with what role. A page rather
// than a Settings tab, because adding a colleague is one task whether they
// need a certificate, access, or both. See PARTNER-VIEW-PLAN.md §5.
//
// Employees take exams on Frappe School themselves; the firm only LINKS a
// certificate here. No applying, paying or reimbursing in Connect.

const store = useConnectStore()
const account = usePartnerAccountStore()
const isOwner = computed(() => store.partnerRole === 'owner')

const standing = computed(() => standingFor(store.partnerTier, store.partnershipState))
const counting = computed(() => account.team.filter((p) => p.counts).length)
// What the count is measured against: the current tier's floor, or Bronze's
// for a Beginner.
const needed = computed(() =>
  store.partnerTier === 'beginner' ? TIERS.bronze.consultants : (nextTier(standing.value.tier) ?? TIERS.gold).consultants,
)
const owners = computed(() => account.team.filter((p) => p.roles.includes('owner')).length)

const STATUS = {
  certified: null,
  expiring: { label: 'Expiring', theme: 'amber' },
  expired: { label: 'Expired', theme: 'red' },
}

const access = (p) => (p.roles.length ? p.roles.map((r) => ROLE_LABEL[r]).join(', ') : 'No access')

function menu(p) {
  return [
    { label: 'Link certificate', icon: 'lucide-badge-check', onClick: () => startLink(p) },
    { label: 'Change access', icon: 'lucide-key-round', onClick: () => startRoles(p) },
    {
      label: 'Remove',
      icon: 'lucide-trash-2',
      theme: 'red',
      onClick: () => {
        if (p.roles.includes('owner') && owners.value === 1) {
          toast.error('Hand ownership to someone else first')
          return
        }
        account.removePerson(p.id)
        toast.success(`${p.name} removed`)
      },
    },
  ]
}

// ── Link a certificate ──────────────────────────────────────────────────────
// Connect looks the certificate up and shows the match before saving. In this
// prototype the lookup is faked: an ID under 6 characters finds nothing, one
// starting with "SW" is already claimed by another partner, anything else
// matches the person.
const linking = ref(false)
const linkFor = ref(null)
const certInput = ref('')
const certError = ref('')
const found = ref(null)

function startLink(p) {
  linkFor.value = p
  certInput.value = ''
  certError.value = ''
  found.value = null
  linking.value = true
}
function lookUp() {
  const v = certInput.value.trim()
  found.value = null
  if (v.length < 6) return (certError.value = 'No certificate matches that ID or email')
  if (/^sw/i.test(v)) return (certError.value = 'Another partner already counts this certificate. Your partner managers can help.')
  certError.value = ''
  found.value = { name: 'ERPNext', full: true, holder: linkFor.value.name, issued: '2026-10-18', expires: '2028-10-18' }
}
function saveLink() {
  account.linkCertificate(linkFor.value.id, found.value)
  linking.value = false
  toast.success(`${linkFor.value.name} is certified`)
}

// ── Invite and access ───────────────────────────────────────────────────────
const inviting = ref(false)
const invite = ref({ name: '', email: '', roles: [] })
const inviteErrors = ref({})
function startInvite() {
  invite.value = { name: '', email: '', roles: [] }
  inviteErrors.value = {}
  inviting.value = true
}
function sendInvite() {
  const e = {}
  if (!invite.value.name.trim()) e.name = 'Enter their name'
  if (!/^\S+@\S+\.\S+$/.test(invite.value.email.trim())) e.email = 'Enter a valid email, like name@company.com'
  inviteErrors.value = e
  if (Object.keys(e).length) return
  account.invite({ ...invite.value, name: invite.value.name.trim(), email: invite.value.email.trim() })
  inviting.value = false
  toast.success(invite.value.roles.length ? `Invite sent to ${invite.value.email}` : `${invite.value.name} added`)
}

const roling = ref(false)
const roleFor = ref(null)
const roles = ref([])
function startRoles(p) {
  roleFor.value = p
  roles.value = [...p.roles]
  roling.value = true
}
const roleError = computed(() =>
  roleFor.value?.roles.includes('owner') && !roles.value.includes('owner') && owners.value === 1
    ? 'Your firm needs an owner. Make someone else owner first.'
    : '',
)
function saveRoles() {
  if (roleError.value) return
  account.setRoles(roleFor.value.id, [...roles.value])
  roling.value = false
  toast.success('Access updated')
}
const toggleRole = (list, r, on) => (on ? [...new Set([...list, r])] : list.filter((x) => x !== r))
</script>

<template>
  <ConnectShell root-label="Team">
    <div class="fc-page-list py-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm text-ink-gray-5">Certified consultants</p>
          <p class="mt-1 text-2xl-semibold tabular-nums text-ink-gray-9">{{ counting }}</p>
          <p class="mt-1.5 text-sm text-ink-gray-5">
            {{ store.partnerTier === 'beginner' ? 'Bronze' : (nextTier(standing.tier) ?? TIERS.gold).label }} needs
            {{ needed }}. Only full ERPNext or Framework certificates count.
          </p>
        </div>
        <Button v-if="isOwner" variant="solid" label="Add person" @click="startInvite" />
      </div>

      <List
        class="-mx-3 mt-6 list-row-px-3"
        :columns="{ base: ['minmax(0,1fr)', 'auto'], sm: ['minmax(0,1fr)', '11rem', '8rem', 'auto'] }"
        :row-height="60"
      >
        <ListHeader>
          <ListHeaderCell>Person</ListHeaderCell>
          <ListHeaderCell class="hidden sm:flex">Certificate</ListHeaderCell>
          <ListHeaderCell class="hidden sm:flex">Access</ListHeaderCell>
          <ListHeaderCell><span class="sr-only">Actions</span></ListHeaderCell>
        </ListHeader>
        <ListRows :items="account.team" v-slot="{ item }">
          <ListRow>
            <ListCell class="min-w-0 gap-3">
              <Avatar :label="item.name" size="md" />
              <span class="min-w-0">
                <span class="block truncate text-base text-ink-gray-8">{{ item.name }}</span>
                <span class="mt-1 block truncate text-sm text-ink-gray-5">
                  {{ item.invited && item.roles.length ? 'Invited' : item.email }}
                </span>
              </span>
            </ListCell>
            <ListCell class="hidden min-w-0 sm:flex">
              <span v-if="!item.cert" class="text-sm text-ink-gray-5">Not certified</span>
              <span v-else class="min-w-0">
                <span class="flex items-center gap-2">
                  <span class="truncate text-sm text-ink-gray-7">{{ item.cert.name }}</span>
                  <Badge v-if="STATUS[item.status]" :theme="STATUS[item.status].theme" variant="subtle" size="sm" :label="STATUS[item.status].label" />
                </span>
                <span class="mt-1 block truncate text-sm text-ink-gray-5">
                  <template v-if="!item.cert.full">Doesn’t count toward tier</template>
                  <template v-else-if="item.status === 'expired'">Expired {{ longDate(item.cert.expires) }}</template>
                  <template v-else>Until {{ longDate(item.cert.expires) }}</template>
                </span>
              </span>
            </ListCell>
            <ListCell class="hidden text-sm text-ink-gray-7 sm:flex">{{ access(item) }}</ListCell>
            <ListCell>
              <Dropdown v-if="isOwner" :options="menu(item)" align="end">
                <Button variant="ghost" icon="lucide-ellipsis" :aria-label="`Actions for ${item.name}`" />
              </Dropdown>
            </ListCell>
          </ListRow>
        </ListRows>
      </List>
    </div>

    <!-- ── Link a certificate ───────────────────────────────────────────── -->
    <Dialog v-model:open="linking" :title="`Link a certificate for ${linkFor?.name ?? ''}`">
      <div class="space-y-4">
        <FormControl
          v-model="certInput"
          label="Certificate ID, or the email they took the exam with"
          :error="certError"
          @keydown.enter.prevent="lookUp"
        />
        <div v-if="found" class="rounded-6 border border-outline-gray-1 p-3">
          <p class="text-base text-ink-gray-8">{{ found.name }} certification</p>
          <p class="mt-1 text-sm text-ink-gray-5">
            {{ found.holder }} · Issued {{ longDate(found.issued) }} · Until {{ longDate(found.expires) }}
          </p>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="linking = false" />
          <Button v-if="!found" variant="solid" label="Look up" @click="lookUp" />
          <Button v-else variant="solid" label="Link certificate" @click="saveLink" />
        </div>
      </div>
    </Dialog>

    <!-- ── Add person ───────────────────────────────────────────────────── -->
    <Dialog v-model:open="inviting" title="Add person">
      <form class="space-y-4" @submit.prevent="sendInvite">
        <FormControl v-model="invite.name" label="Name" required :error="inviteErrors.name" />
        <FormControl v-model="invite.email" type="email" label="Email" placeholder="name@company.com" required :error="inviteErrors.email" />
        <fieldset>
          <legend class="text-sm text-ink-gray-6">Connect access</legend>
          <div class="mt-2 space-y-2">
            <Checkbox
              v-for="(label, r) in ROLE_LABEL"
              :key="r"
              :label="label"
              :model-value="invite.roles.includes(r)"
              @update:model-value="(on) => (invite.roles = toggleRole(invite.roles, r, on))"
            />
          </div>
          <p class="mt-2 text-p-sm text-ink-gray-5">Leave all unticked to list someone without access.</p>
        </fieldset>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="inviting = false" />
          <Button variant="solid" type="submit" :label="invite.roles.length ? 'Send invite' : 'Add'" />
        </div>
      </form>
    </Dialog>

    <!-- ── Change access ────────────────────────────────────────────────── -->
    <Dialog v-model:open="roling" :title="`Access for ${roleFor?.name ?? ''}`">
      <div class="space-y-4">
        <div class="space-y-2">
          <Checkbox
            v-for="(label, r) in ROLE_LABEL"
            :key="r"
            :label="label"
            :model-value="roles.includes(r)"
            @update:model-value="(on) => (roles = toggleRole(roles, r, on))"
          />
        </div>
        <p v-if="roleError" class="text-p-sm text-ink-red-7">{{ roleError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="roling = false" />
          <Button variant="solid" label="Save" @click="saveRoles" />
        </div>
      </div>
    </Dialog>
  </ConnectShell>
</template>
