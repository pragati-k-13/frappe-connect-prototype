<script setup>
import { computed, ref, watch } from 'vue'
import { Avatar, Badge, Button, Checkbox, Dialog, dialog, Dropdown, FormControl, TabButtons, toast, Tooltip } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PageIntro from '../components/PageIntro.vue'
import { firmFor } from '../data/partnership'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { ROLES, ROLE_LABEL } from '../data/partnerAccount'
import { longDate } from '../data/partnership'

// SCREEN — Team: everyone at the firm, each with at least one role, and the
// roles themselves. Shaped like Frappe Cloud's team page (People and Roles).
// Who counts toward the consultants criterion shows on the People tab. A page
// rather than a Settings tab, because adding a colleague is one task whether
// they need a certificate, a role, or both. See PARTNER-VIEW-PLAN.md §5.
//
// Employees take exams on Frappe School themselves; the firm only LINKS a
// certificate here. No applying, paying or reimbursing in Connect.
//
// Below the intro, the layout is copied from the FC v2 demo's Teams page
// (frappe-cloud-v2 CentralSettingsPage.vue): one control row with search on the
// left and the tabs plus Invite on the right, 60px rows, and the same cell
// markup. The frappe-patterns skill's team-and-roles note lists what changed.

const store = useConnectStore()
const account = usePartnerAccountStore()
const isOwner = computed(() => store.partnerRole === 'owner')

const owners = computed(() => account.team.filter((p) => p.roles.includes('owner')).length)

const STATUS = {
  certified: null,
  expiring: { label: 'Expiring', theme: 'amber' },
  expired: { label: 'Expired', theme: 'red' },
}

const tab = ref('people')
const query = ref('')
const people = computed(() => {
  const q = query.value.trim().toLowerCase()
  return account.team.filter((p) => !q || p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q))
})
// One search box serves both tabs; a query typed for people means nothing for roles.
watch(tab, () => (query.value = ''))
const roleList = computed(() => {
  const q = query.value.trim().toLowerCase()
  return ROLES.filter((r) => !q || r.label.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q))
})
const TABS = [
  { label: 'People', value: 'people' },
  { label: 'Roles', value: 'roles' },
]
const access = (p) => p.roles.map((r) => ROLE_LABEL[r]).join(', ')
const membersOf = (role) => account.team.filter((p) => p.roles.includes(role))

function menu(p) {
  return [
    { label: 'Link certificate', icon: 'lucide-badge-check', onClick: () => startLink(p) },
    { label: 'Change roles', icon: 'lucide-key-round', onClick: () => startRoles(p) },
    {
      label: 'Remove',
      icon: 'lucide-trash-2',
      theme: 'red',
      onClick: () => {
        if (p.roles.includes('owner') && owners.value === 1) {
          toast.error('Hand ownership to someone else first')
          return
        }
        dialog.danger({
          title: `Remove ${p.name}?`,
          message: 'They lose access to your firm in Connect. You can invite them again any time.',
          confirmLabel: 'Remove',
          onConfirm: () => {
            account.removePerson(p.id)
            toast.success(`Removed ${p.name} from the team`)
          },
        })
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
const invite = ref({ name: '', email: '', roles: ['member'] })
const inviteErrors = ref({})
function startInvite() {
  invite.value = { name: '', email: '', roles: ['member'] }
  inviteErrors.value = {}
  inviting.value = true
}
function sendInvite() {
  const e = {}
  if (!invite.value.name.trim()) e.name = 'Enter their name'
  if (!/^\S+@\S+\.\S+$/.test(invite.value.email.trim())) e.email = 'Enter a valid email, like name@company.com'
  if (!invite.value.roles.length) e.roles = 'Pick at least one role'
  inviteErrors.value = e
  if (Object.keys(e).length) return
  account.invite({ ...invite.value, name: invite.value.name.trim(), email: invite.value.email.trim() })
  inviting.value = false
  toast.success(`Invite sent to ${invite.value.email}`)
}

// ── Member dialog ───────────────────────────────────────────────────────────
// Clicking a row opens the person, as in the FC v2 demo: what they can do and
// their certificate, then "Manage roles" switches the same dialog to editing.
const memberOpen = ref(false)
const memberMode = ref('view')
const memberFor = ref(null)
const roles = ref([])
function openMember(p, mode = 'view') {
  memberFor.value = p
  roles.value = [...p.roles]
  memberMode.value = mode
  memberOpen.value = true
}
const startRoles = (p) => openMember(p, 'manage')
const memberRoles = computed(() => ROLES.filter((r) => memberFor.value?.roles.includes(r.key)))
const roleError = computed(() => {
  if (!roles.value.length) return 'Pick at least one role'
  return memberFor.value?.roles.includes('owner') && !roles.value.includes('owner') && owners.value === 1
    ? 'Your firm needs an owner. Make someone else owner first.'
    : ''
})
function saveRoles() {
  if (roleError.value) return
  account.setRoles(memberFor.value.id, [...roles.value])
  memberFor.value = account.team.find((p) => p.id === memberFor.value.id) ?? memberFor.value
  memberMode.value = 'view'
  toast.success('Roles updated')
}
const toggleRole = (list, r, on) => (on ? [...new Set([...list, r])] : list.filter((x) => x !== r))
</script>

<template>
  <ConnectShell root-label="Team">
    <div class="fc-page-list py-8">
      <PageIntro :title="`People at ${firmFor(store.partnerTier).name}`" />

      <!-- One row: search on the left, then the tabs and Invite on the right -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <FormControl
          v-model="query"
          class="w-full shrink-0 sm:w-64 [&_input]:w-full"
          type="text"
          size="sm"
          :placeholder="tab === 'people' ? 'Search people' : 'Search roles'"
        >
          <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
        </FormControl>
        <div class="flex shrink-0 items-center gap-3">
          <TabButtons v-model="tab" :options="TABS" />
          <!-- Kept in place on Roles (invisible) so the tabs don't shift when you switch. -->
          <Button
            v-if="isOwner"
            variant="subtle"
            size="sm"
            label="Invite"
            icon-left="lucide-plus"
            :class="tab !== 'people' && 'invisible'"
            :aria-hidden="tab !== 'people'"
            :tabindex="tab !== 'people' ? -1 : 0"
            @click="startInvite"
          />
        </div>
      </div>

      <!-- ── People ─────────────────────────────────────────────────────── -->
      <div v-if="tab === 'people'" class="mt-4 flow-root">
        <EmptyState v-if="!people.length" icon="lucide-users" :title="`No one matches “${query.trim()}”`" />
        <List
          v-else
          class="-mx-3 mt-3 list-row-px-3"
          :columns="{ base: ['minmax(0,1fr)', '3rem'], sm: ['minmax(0,2fr)', '11rem', 'minmax(0,2fr)', '3rem'] }"
          :row-height="60"
        >
          <ListHeader>
            <ListHeaderCell>Member</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Certificate</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Roles</ListHeaderCell>
            <ListHeaderCell><span class="sr-only">Actions</span></ListHeaderCell>
          </ListHeader>
          <ListRows :items="people" v-slot="{ item }">
            <ListRow @click="openMember(item)">
              <!-- Member: avatar + name + email -->
              <ListCell>
                <div class="flex min-w-0 items-center gap-3">
                  <Avatar :label="item.name" size="md" class="shrink-0" />
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span class="truncate text-sm font-medium text-ink-gray-9">{{ item.name }}</span>
                      <Badge v-if="item.invited" theme="amber" variant="subtle" label="Invited" />
                    </div>
                    <div class="truncate text-xs text-ink-gray-5">{{ item.email }}</div>
                    <!-- Below sm the Certificate and Roles columns fold in here. -->
                    <div class="truncate text-xs text-ink-gray-5 sm:hidden">
                      {{ item.cert ? `${item.cert.name}${STATUS[item.status] ? `, ${STATUS[item.status].label.toLowerCase()}` : ''}` : 'Not certified' }}
                      · {{ access(item) }}
                    </div>
                  </div>
                </div>
              </ListCell>
              <ListCell class="hidden sm:flex">
                <span v-if="!item.cert" class="text-xs text-ink-gray-5">Not certified</span>
                <div v-else class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="truncate text-sm font-medium text-ink-gray-9">{{ item.cert.name }}</span>
                    <Badge v-if="STATUS[item.status]" :theme="STATUS[item.status].theme" variant="subtle" :label="STATUS[item.status].label" />
                  </div>
                  <div class="truncate text-xs text-ink-gray-5">
                    <template v-if="!item.cert.full">Doesn’t count toward tier</template>
                    <template v-else-if="item.status === 'expired'">Expired {{ longDate(item.cert.expires) }}</template>
                    <template v-else>Until {{ longDate(item.cert.expires) }}</template>
                  </div>
                </div>
              </ListCell>
              <!-- Roles: chips -->
              <ListCell class="hidden sm:flex">
                <div class="flex flex-wrap gap-1">
                  <template v-for="r in item.roles" :key="r">
                    <Badge v-if="r === 'owner'" theme="green" variant="subtle">
                      <template #prefix><span class="lucide-crown size-3" aria-hidden="true" /></template>
                      Owner
                    </Badge>
                    <span v-else class="inline-flex items-center gap-1 rounded-3 bg-surface-gray-2 px-2 py-0.5 text-xs text-ink-gray-7">
                      {{ ROLE_LABEL[r] }}
                    </span>
                  </template>
                </div>
              </ListCell>
              <!-- More menu -->
              <ListCell class="justify-end">
                <Dropdown v-if="isOwner" :options="menu(item)" align="end">
                  <button class="grid size-7 place-items-center rounded-1 text-ink-gray-5 hover:bg-surface-gray-3 hover:text-ink-gray-7" :aria-label="`Actions for ${item.name}`" @click.stop>
                    <span class="lucide-ellipsis-vertical size-4" aria-hidden="true" />
                  </button>
                </Dropdown>
              </ListCell>
            </ListRow>
          </ListRows>
        </List>
      </div>

      <!-- ── Roles: what each is for, and who has it ─────────────────────── -->
      <div v-else class="mt-4 flow-root">
        <EmptyState v-if="!roleList.length" icon="lucide-key-round" :title="`No roles match “${query.trim()}”`" />
        <List
          v-else
          class="-mx-3 mt-3 list-row-px-3"
          :columns="{ base: ['minmax(0,1fr)'], sm: ['minmax(0,2fr)', 'minmax(0,1fr)'] }"
          :row-height="60"
        >
          <ListHeader>
            <ListHeaderCell>Role</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Members</ListHeaderCell>
          </ListHeader>
          <ListRow v-for="r in roleList" :key="r.key">
            <!-- Role: icon + name + description -->
            <ListCell>
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="grid size-8 shrink-0 place-items-center rounded-4"
                  :class="r.key === 'owner' ? 'bg-surface-amber-2' : 'bg-surface-gray-2'"
                >
                  <Tooltip v-if="r.key === 'owner'" text="This role has access to everything.">
                    <span class="lucide-shield size-4 text-ink-amber-8" aria-hidden="true" />
                  </Tooltip>
                  <span v-else class="lucide-user size-4 text-ink-gray-6" aria-hidden="true" />
                </span>
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium text-ink-gray-9">{{ r.label }}</div>
                  <div class="text-xs text-ink-gray-5 sm:truncate">{{ r.desc }}</div>
                </div>
              </div>
            </ListCell>
            <!-- Members: stacked avatars (below sm the description gets the row) -->
            <ListCell class="hidden sm:flex">
              <div class="flex -space-x-1.5">
                <Tooltip v-for="m in membersOf(r.key).slice(0, 4)" :key="m.id" :text="m.name">
                  <Avatar :label="m.name" size="sm" :aria-label="m.name" class="ring-2 ring-[var(--surface-base)]" />
                </Tooltip>
                <span
                  v-if="membersOf(r.key).length > 4"
                  class="inline-flex size-7 items-center justify-center rounded-full bg-surface-gray-3 text-xs font-medium text-ink-gray-7 ring-2 ring-[var(--surface-base)]"
                >
                  +{{ membersOf(r.key).length - 4 }}
                </span>
                <span v-if="!membersOf(r.key).length" class="text-xs text-ink-gray-5">No one yet</span>
              </div>
            </ListCell>
          </ListRow>
        </List>
      </div>
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
    <Dialog v-model:open="inviting" title="Invite">
      <form class="space-y-4" @submit.prevent="sendInvite">
        <FormControl v-model="invite.name" label="Name" required :error="inviteErrors.name" />
        <FormControl v-model="invite.email" type="email" label="Email" placeholder="name@company.com" required :error="inviteErrors.email" />
        <fieldset>
          <legend class="text-sm text-ink-gray-6">Roles</legend>
          <div class="mt-2 space-y-2">
            <Checkbox
              v-for="(label, r) in ROLE_LABEL"
              :key="r"
              :label="label"
              :model-value="invite.roles.includes(r)"
              @update:model-value="(on) => (invite.roles = toggleRole(invite.roles, r, on))"
            />
          </div>
          <p v-if="inviteErrors.roles" class="mt-2 text-p-sm text-ink-red-7">{{ inviteErrors.roles }}</p>
        </fieldset>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="inviting = false" />
          <Button variant="solid" type="submit" label="Send invite" />
        </div>
      </form>
    </Dialog>

    <!-- ── Member: view roles and certificate, manage roles in one dialog ── -->
    <Dialog v-model:open="memberOpen">
      <template #title>
        <div class="flex items-center gap-3">
          <Avatar :label="memberFor?.name || ''" size="lg" />
          <div>
            <div class="text-xl font-semibold text-ink-gray-9">{{ memberFor?.name }}</div>
            <div class="text-sm font-normal text-ink-gray-5">{{ memberFor?.email }}</div>
          </div>
        </div>
      </template>

      <!-- View mode: what they can do, and their certificate -->
      <div v-if="memberMode === 'view' && memberFor" class="rounded-4 border border-outline-gray-2">
        <div v-for="r in memberRoles" :key="r.key" class="flex items-center gap-3 border-b border-outline-alpha-gray-1 px-3 py-2.5 last:border-b-0">
          <span class="grid size-6 shrink-0 place-items-center rounded-1" :class="r.key === 'owner' ? 'bg-surface-amber-2' : 'bg-surface-gray-2'">
            <span class="size-3.5" :class="r.key === 'owner' ? 'lucide-shield text-ink-amber-8' : 'lucide-user text-ink-gray-5'" aria-hidden="true" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm text-ink-gray-8">{{ r.label }}</div>
            <div class="text-xs text-ink-gray-5">{{ r.desc }}</div>
          </div>
        </div>
        <div class="flex items-center gap-3 px-3 py-2.5">
          <span class="grid size-6 shrink-0 place-items-center rounded-1 bg-surface-gray-2">
            <span class="lucide-badge-check size-3.5 text-ink-gray-5" aria-hidden="true" />
          </span>
          <div class="min-w-0 flex-1">
            <template v-if="memberFor.cert">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm text-ink-gray-8">{{ memberFor.cert.name }} certificate</span>
                <Badge v-if="STATUS[memberFor.status]" :theme="STATUS[memberFor.status].theme" variant="subtle" :label="STATUS[memberFor.status].label" />
              </div>
              <div class="text-xs text-ink-gray-5">
                <template v-if="!memberFor.cert.full">Doesn’t count toward tier</template>
                <template v-else-if="memberFor.status === 'expired'">Expired {{ longDate(memberFor.cert.expires) }}</template>
                <template v-else>Until {{ longDate(memberFor.cert.expires) }}</template>
              </div>
            </template>
            <div v-else class="text-sm text-ink-gray-8">Not certified</div>
          </div>
          <Button v-if="isOwner && !memberFor.cert" variant="ghost" size="sm" label="Link certificate" @click="memberOpen = false; startLink(memberFor)" />
        </div>
      </div>

      <!-- Manage mode: role checkboxes -->
      <div v-else-if="memberMode === 'manage'" class="space-y-3">
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
      </div>

      <template #actions>
        <div v-if="memberMode === 'view'" class="flex justify-end">
          <Button v-if="isOwner" variant="subtle" icon-left="lucide-shield" label="Manage roles" @click="memberMode = 'manage'" />
        </div>
        <div v-else class="flex justify-end gap-2">
          <Button icon-left="lucide-arrow-left" label="Back" @click="memberMode = 'view'" />
          <Button variant="solid" label="Save" @click="saveRoles" />
        </div>
      </template>
    </Dialog>
  </ConnectShell>
</template>
