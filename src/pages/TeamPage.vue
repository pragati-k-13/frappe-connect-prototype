<script setup>
import { computed, ref, watch } from 'vue'
import { Avatar, Badge, Button, Dialog, dialog, Dropdown, FormControl, Switch, TabButtons, toast, Tooltip } from 'frappe-ui'
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
//
// Single-role variant: each person holds exactly one role. `roles` stays an
// array (other screens check `roles.includes`) but always has one entry.

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
    { label: 'Change role', icon: 'lucide-key-round', onClick: () => startRoles(p) },
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
const invite = ref({ name: '', email: '', role: 'member' })
const inviteErrors = ref({})
function startInvite() {
  invite.value = { name: '', email: '', role: 'member' }
  inviteErrors.value = {}
  inviting.value = true
}
function sendInvite() {
  const e = {}
  if (!invite.value.name.trim()) e.name = 'Enter their name'
  if (!/^\S+@\S+\.\S+$/.test(invite.value.email.trim())) e.email = 'Enter a valid email, like name@company.com'
  inviteErrors.value = e
  if (Object.keys(e).length) return
  account.invite({ name: invite.value.name.trim(), email: invite.value.email.trim(), roles: [invite.value.role] })
  inviting.value = false
  toast.success(`Invite sent to ${invite.value.email}`)
}

// ── Member dialog ───────────────────────────────────────────────────────────
// Clicking a row opens the person, as in the FC v2 demo: what they can do and
// the firm, then "Change role" switches the same dialog to a role select.
const memberOpen = ref(false)
const memberMode = ref('view')
const memberFor = ref(null)
const role = ref('')
function openMember(p, mode = 'view') {
  memberFor.value = p
  role.value = p.roles[0]
  memberMode.value = mode
  memberOpen.value = true
}
const startRoles = (p) => openMember(p, 'manage')
const roleOptions = ROLES.map((r) => ({ label: r.label, value: r.key }))
// What each role opens, from ROLES[].desc. One list feeds the member dialog's
// chips and the role dialog's switches, so the two never disagree.
const AREAS = [
  { key: 'leads', label: 'Leads' },
  { key: 'quotes', label: 'Quotes' },
  { key: 'customers', label: 'Customers' },
  { key: 'billing', label: 'Billing' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'team', label: 'Team' },
  { key: 'settings', label: 'Settings' },
]
const ROLE_AREAS = {
  owner: AREAS.map((a) => a.key),
  sales: ['leads', 'quotes', 'customers'],
  finance: ['billing', 'invoices'],
  member: [],
}
const PERMS = Object.fromEntries(
  Object.entries(ROLE_AREAS).map(([k, keys]) => [k, k === 'owner' ? [] : AREAS.filter((a) => keys.includes(a.key)).map((a) => a.label)]),
)

// ── Role dialog ─────────────────────────────────────────────────────────────
// Clicking a role opens it, as in FC v2: Permissions and Members tabs sharing
// one grid cell so the dialog never resizes. Connect's four roles are built in,
// so permissions show read-only. Members can move a teammate into the role;
// with one role each, that replaces the role they had.
const roleOpen = ref(false)
const roleFor = ref(null)
const roleTab = ref('permissions')
const addId = ref('')
function openRole(r) {
  roleFor.value = r
  roleTab.value = 'permissions'
  addId.value = ''
  roleOpen.value = true
}
// Everyone not already in this role, with the role they'd leave. The last owner
// can't be moved out: the firm needs one.
const addableOptions = computed(() =>
  account.team
    .filter((p) => !p.roles.includes(roleFor.value?.key))
    .filter((p) => !(p.roles.includes('owner') && owners.value === 1))
    .map((p) => ({ label: `${p.name} · ${ROLE_LABEL[p.roles[0]]}`, value: p.id })),
)
function addToRole() {
  const p = account.team.find((x) => x.id === addId.value)
  if (!p) return
  account.setRoles(p.id, [roleFor.value.key])
  toast.success(`${p.name} is now ${ROLE_LABEL[roleFor.value.key]}`)
  addId.value = ''
}
const memberRoles = computed(() => ROLES.filter((r) => memberFor.value?.roles.includes(r.key)))
const roleError = computed(() =>
  memberFor.value?.roles.includes('owner') && role.value !== 'owner' && owners.value === 1
    ? 'Your firm needs an owner. Make someone else owner first.'
    : '',
)
function saveRoles() {
  if (roleError.value) return
  account.setRoles(memberFor.value.id, [role.value])
  memberFor.value = account.team.find((p) => p.id === memberFor.value.id) ?? memberFor.value
  memberMode.value = 'view'
  toast.success('Role updated')
}
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
          <ListRow v-for="r in roleList" :key="r.key" @click="openRole(r)">
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
        <FormControl v-model="invite.role" type="select" label="Role" :options="roleOptions" />
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

      <!-- View mode: one row per role, as FC v2 shows one per server: where
           (the whole firm), the role, then what it allows as short chips -->
      <div v-if="memberMode === 'view' && memberFor" class="rounded-6 border border-outline-gray-2">
        <div v-for="r in memberRoles" :key="r.key" class="flex items-center gap-3 border-b border-outline-alpha-gray-1 px-3 py-2.5 last:border-b-0">
          <span class="grid size-6 shrink-0 place-items-center rounded-1 bg-surface-gray-2">
            <span class="lucide-building-2 size-3.5 text-ink-gray-5" aria-hidden="true" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm text-ink-gray-8">{{ firmFor(store.partnerTier).name }}</div>
            <div class="text-xs text-ink-gray-5">{{ r.label }}</div>
          </div>
          <div class="flex shrink-0 flex-wrap justify-end gap-1">
            <span v-if="r.key === 'owner'" class="rounded-4 bg-surface-amber-2 px-1.5 py-0.5 text-2xs font-medium text-ink-amber-8">Full access</span>
            <span v-for="p in PERMS[r.key]" :key="p" class="rounded-4 bg-surface-gray-2 px-1.5 py-0.5 text-2xs text-ink-gray-6">{{ p }}</span>
            <span v-if="r.key === 'member'" class="text-xs text-ink-gray-5">View only</span>
          </div>
        </div>
      </div>

      <!-- Change mode: one role per person, so a single select -->
      <div v-else-if="memberMode === 'manage'" class="space-y-3">
        <FormControl v-model="role" type="select" label="Role" :options="roleOptions" />
        <p v-if="roleError" class="text-p-sm text-ink-red-7">{{ roleError }}</p>
      </div>

      <template #actions>
        <div v-if="memberMode === 'view'" class="flex justify-end">
          <Button v-if="isOwner" variant="subtle" icon-left="lucide-shield" label="Change role" @click="memberMode = 'manage'" />
        </div>
        <div v-else class="flex justify-end gap-2">
          <Button icon-left="lucide-arrow-left" label="Back" @click="memberMode = 'view'" />
          <Button variant="solid" label="Save" :disabled="role === memberFor?.roles[0] || !!roleError" @click="saveRoles" />
        </div>
      </template>
    </Dialog>
    <!-- ── Role: what it opens, and who has it ─────────────────────────────── -->
    <Dialog v-model:open="roleOpen">
      <template #title>
        <div class="flex items-center gap-2">
          <span class="text-xl font-semibold text-ink-gray-9">{{ roleFor?.label }}</span>
          <Tooltip v-if="roleFor?.key === 'owner'" text="This role has access to everything.">
            <span class="lucide-shield size-3.5 text-ink-gray-5" />
          </Tooltip>
        </div>
      </template>
      <div v-if="roleFor">
        <TabButtons
          v-model="roleTab"
          :options="[{ label: 'Permissions', value: 'permissions' }, { label: 'Members', value: 'members' }]"
          class="mb-4"
        />

        <!-- Both panels share the same grid cell so the dialog never resizes -->
        <div class="grid">
          <!-- Permissions tab -->
          <div class="col-start-1 row-start-1 space-y-4" :class="{ 'invisible pointer-events-none': roleTab !== 'permissions' }">
            <div>
              <div class="mb-2 text-sm text-ink-gray-5">Important</div>
              <div class="flex items-center justify-between rounded-6 border border-outline-gray-2 bg-surface-base px-3 py-2.5">
                <div>
                  <div class="text-sm text-ink-gray-8">Full access</div>
                  <div class="text-xs text-ink-gray-5">Everything, including the team and settings</div>
                </div>
                <div class="pointer-events-none opacity-40">
                  <Switch :model-value="roleFor.key === 'owner'" />
                </div>
              </div>
            </div>
            <div>
              <div class="mb-2 text-sm text-ink-gray-5">General</div>
              <div class="divide-y divide-outline-alpha-gray-1 overflow-hidden rounded-6 border border-outline-gray-2 bg-surface-base">
                <div v-for="a in AREAS" :key="a.key" class="flex items-center justify-between px-3 py-2.5">
                  <span class="text-sm text-ink-gray-8">{{ a.label }}</span>
                  <div class="pointer-events-none opacity-40">
                    <Switch :model-value="ROLE_AREAS[roleFor.key].includes(a.key)" />
                  </div>
                </div>
              </div>
            </div>
            <p class="text-p-xs text-ink-gray-5">Built-in role — permissions can’t be changed.</p>
          </div>

          <!-- Members tab -->
          <div class="col-start-1 row-start-1" :class="{ 'invisible pointer-events-none': roleTab !== 'members' }">
            <div v-if="membersOf(roleFor.key).length" class="divide-y divide-outline-alpha-gray-1">
              <div v-for="m in membersOf(roleFor.key)" :key="m.id" class="flex items-center gap-2 py-2.5">
                <Avatar :label="m.name" size="sm" class="shrink-0" />
                <span class="min-w-0 flex-1 truncate text-sm text-ink-gray-8">{{ m.name }}</span>
                <span class="shrink-0 text-xs text-ink-gray-5">{{ m.invited ? 'Invited' : m.email }}</span>
              </div>
            </div>
            <p v-else class="py-6 text-center text-p-sm text-ink-gray-5">No one has this role yet.</p>

            <!-- Add an existing teammate directly, no invite -->
            <div v-if="isOwner" class="mt-3 border-t border-outline-alpha-gray-1 pt-3">
              <template v-if="addableOptions.length">
                <div class="flex items-end gap-2">
                  <div class="min-w-0 flex-1">
                    <FormControl v-model="addId" type="select" label="Team member" placeholder="Choose…" :options="addableOptions" />
                  </div>
                  <Button class="shrink-0" variant="subtle" label="Add" :disabled="!addId" @click="addToRole" />
                </div>
              </template>
              <p v-else class="text-center text-p-xs text-ink-gray-5">Everyone on the team already has this role.</p>
              <p class="mt-1.5 text-p-xs text-ink-gray-5">
                {{ owners === 1 && roleFor.key !== 'owner'
                  ? 'Adding someone replaces their current role. The last owner can’t be moved.'
                  : 'Each person has one role, so adding someone here replaces their current one.' }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <template #actions>
        <div class="flex justify-end gap-2">
          <Button label="Close" @click="roleOpen = false" />
        </div>
      </template>
    </Dialog>
  </ConnectShell>
</template>
