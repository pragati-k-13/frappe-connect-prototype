<script setup>
import { computed, ref } from 'vue'
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  dialog,
  Dropdown,
  FormControl,
  SettingsBody,
  SettingsHeader,
  TextInput,
  toast,
  Tooltip,
} from 'frappe-ui'
import { List, ListCell, ListRow, ListRows } from 'frappe-ui/list'
import { useConnectStore } from '../../stores/connect'
import { usePartnerAccountStore } from '../../stores/partnerAccount'
import { ROLES, ROLE_LABEL } from '../../data/partnerAccount'

// PANEL — Users, in the partner Settings dialog. Everyone at the firm and their
// one role. Copied from Frappe CRM's Settings → Users (crm/frontend/src/
// components/Settings/Users.vue): a row per person with the role as a dropdown
// button that saves on pick, a locked button when a role can't change, and
// Remove in a "more" menu. CRM's frame is hand-built from before frappe-ui had
// SettingsDialog and List; here it uses them. Certificates live on Partnership.
//
// Everyone can open it; only owners change anything. Single-role variant of the
// team pattern: `roles` stays a one-item array for the screens that read it.

const store = useConnectStore()
const account = usePartnerAccountStore()
const isOwner = computed(() => store.partnerRole === 'owner')
const owners = computed(() => account.team.filter((p) => p.roles.includes('owner')).length)
const isLastOwner = (p) => p.roles.includes('owner') && owners.value === 1

const role = (p) => ROLES.find((r) => r.key === p.roles[0]) ?? ROLES[ROLES.length - 1]

// CRM shows search only once the list is long enough to need it.
const query = ref('')
const people = computed(() => {
  const q = query.value.trim().toLowerCase()
  return account.team.filter((p) => !q || p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q))
})

function roleOptions(p) {
  return ROLES.map((r) => ({
    label: r.label,
    icon: r.icon,
    description: r.desc,
    selected: p.roles[0] === r.key,
    onClick: () => setRole(p, r.key),
  }))
}
function setRole(p, key) {
  if (p.roles[0] === key) return
  account.setRoles(p.id, [key])
  toast.success(`${p.name} has been granted ${ROLE_LABEL[key]} access`)
}

function moreOptions(p) {
  return [{ label: 'Remove', icon: 'lucide-trash-2', theme: 'red', onClick: () => remove(p) }]
}
function remove(p) {
  if (isLastOwner(p)) return toast.error('Make someone else owner first')
  dialog.danger({
    title: `Remove ${p.name}?`,
    message: 'They lose access to your firm in Connect. You can invite them again any time.',
    confirmLabel: 'Remove',
    onConfirm: () => {
      account.removePerson(p.id)
      toast.success(`Removed ${p.name} from the team`)
    },
  })
}

// ── Invite ──────────────────────────────────────────────────────────────────
const inviting = ref(false)
const invite = ref({ name: '', email: '', role: 'member' })
const errors = ref({})
const roleSelect = ROLES.map((r) => ({ label: r.label, value: r.key }))
function startInvite() {
  invite.value = { name: '', email: '', role: 'member' }
  errors.value = {}
  inviting.value = true
}
function sendInvite() {
  const e = {}
  if (!invite.value.name.trim()) e.name = 'Enter their name'
  if (!/^\S+@\S+\.\S+$/.test(invite.value.email.trim())) e.email = 'Enter a valid email, like name@company.com'
  errors.value = e
  if (Object.keys(e).length) return
  account.invite({ name: invite.value.name.trim(), email: invite.value.email.trim(), roles: [invite.value.role] })
  inviting.value = false
  toast.success(`Invite sent to ${invite.value.email.trim()}`)
}
</script>

<template>
  <!-- Own header row, as in frappe-ui's Users story: the default slot aligns the title to the button's top, not its center -->
  <SettingsHeader>
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-ink-gray-8">Users</h2>
      <Button v-if="isOwner" variant="solid" label="Invite" icon-left="lucide-plus" @click="startInvite" />
    </div>
  </SettingsHeader>
  <SettingsBody>
    <TextInput v-if="account.team.length > 10" v-model="query" type="search" placeholder="Search users" class="mb-3">
      <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
    </TextInput>

    <List :columns="['minmax(0,1fr)', 'auto', 'auto']" :row-height="56">
      <ListRows :items="people" v-slot="{ item }">
        <ListRow>
          <ListCell>
            <div class="flex min-w-0 items-center gap-3">
              <Avatar :label="item.name" size="xl" class="shrink-0" />
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="truncate text-p-base text-ink-gray-8">{{ item.name }}</span>
                  <Badge v-if="item.invited" theme="amber" variant="subtle" label="Invited" />
                </div>
                <div class="truncate text-p-sm text-ink-gray-5">{{ item.email }}</div>
              </div>
            </div>
          </ListCell>

          <!-- Role: a dropdown for owners, locked for the last owner, text for everyone else -->
          <ListCell class="justify-end">
            <template v-if="isOwner">
              <Tooltip v-if="isLastOwner(item)" text="A firm needs at least one owner">
                <Button :label="role(item).label" :icon-left="role(item).icon" />
              </Tooltip>
              <Dropdown
                v-else
                :options="roleOptions(item)"
                :button="{ label: role(item).label, iconLeft: role(item).icon, iconRight: 'lucide-chevron-down' }"
                align="end"
              />
            </template>
            <span v-else class="inline-flex items-center gap-1.5 text-base text-ink-gray-7">
              <span :class="[role(item).icon, 'size-4 text-ink-gray-5']" aria-hidden="true" />
              {{ role(item).label }}
            </span>
          </ListCell>

          <ListCell class="justify-end">
            <Dropdown
              v-if="isOwner"
              :options="moreOptions(item)"
              :button="{ icon: 'lucide-more-horizontal', variant: 'ghost', 'aria-label': `More for ${item.name}` }"
              align="end"
            />
          </ListCell>
        </ListRow>
      </ListRows>
    </List>
  </SettingsBody>

  <Dialog v-model:open="inviting" title="Invite">
    <form class="space-y-4" novalidate @submit.prevent="sendInvite">
      <FormControl v-model="invite.name" label="Name" required :error="errors.name" />
      <FormControl v-model="invite.email" type="email" label="Email" placeholder="name@company.com" required :error="errors.email" />
      <FormControl v-model="invite.role" type="select" label="Role" :options="roleSelect" />
      <div class="flex justify-end gap-2 pt-2">
        <Button label="Cancel" @click="inviting = false" />
        <Button variant="solid" type="submit" label="Send invite" />
      </div>
    </form>
  </Dialog>
</template>
