<script setup>
import { Avatar, Badge, Button, SettingsBody, SettingsHeader } from 'frappe-ui'
import { useConnectStore } from '../../stores/connect'

// The account is one person in this mock, so the list is the viewer. Invite
// is inert: there is nobody on the other end to receive it.
const store = useConnectStore()
</script>

<template>
  <SettingsHeader title="Users">
    <template #actions>
      <Button variant="solid" label="Invite">
        <template #prefix><LucidePlus class="size-4" /></template>
      </Button>
    </template>
  </SettingsHeader>
  <SettingsBody>
    <div class="divide-y divide-outline-gray-1">
      <div class="grid grid-cols-[1fr_8rem] items-center py-2.5">
        <div class="flex min-w-0 items-center gap-3">
          <Avatar size="lg" :label="store.viewer.name" />
          <div class="min-w-0">
            <div class="truncate text-base text-ink-gray-8">{{ store.viewer.name }}</div>
            <div class="truncate text-sm text-ink-gray-5">{{ store.viewer.email }}</div>
          </div>
        </div>
        <Badge theme="gray" variant="solid" label="Admin" />
      </div>
    </div>
  </SettingsBody>
</template>
