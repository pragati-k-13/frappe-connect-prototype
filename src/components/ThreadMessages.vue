<script setup>
import { computed, ref } from 'vue'
import { Avatar, Badge, Button, Dropdown, toast } from 'frappe-ui'
import IconBuilding from '~icons/lucide/building-2'

// One Connect thread as the partner reads it: the brief, the quote, the
// moment the company shared its details, replies, and the hire. Shared by the
// lead page and a customer's Messages tab, which is the same thread after the
// hire (PARTNER-VIEW-PLAN.md, "Lead to customer").
//
// `fold`: on a customer, the bid before the hire folds into one line, since
// the work after it is what the partner is there for.
const props = defineProps({
  messages: { type: Array, required: true },
  company: { type: Object, default: null },
  project: { type: String, default: '' },
  brief: { type: Object, default: null },
  self: { type: Object, default: null },
  selfLogo: { type: String, default: null },
  authorOf: { type: Function, required: true },
  canReply: { type: Boolean, default: false },
  fold: { type: Boolean, default: false },
})
const emit = defineEmits(['quote', 'read-brief'])

const hiredAt = computed(() => props.messages.findIndex((m) => m.kind === 'hired'))
const expanded = ref(false)
const folded = computed(() => props.fold && hiredAt.value > 0 && !expanded.value)
const shown = computed(() => (folded.value ? props.messages.slice(hiredAt.value) : props.messages))

const time = (at) => {
  const d = new Date(at)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
const plain = (html) => {
  const el = document.createElement('div')
  el.innerHTML = html ?? ''
  return el.textContent.trim()
}
// Says it copied only once it has.
const copy = (text, done) =>
  navigator.clipboard
    ? navigator.clipboard.writeText(text).then(() => toast.success(done), () => toast.error('Couldn’t copy'))
    : toast.error('Couldn’t copy')
const messageMenu = (m) => [
  { label: 'Copy text', icon: 'lucide-copy', onClick: () => copy(plain(m.body), 'Copied') },
  { label: 'Copy link', icon: 'lucide-link', onClick: () => copy(`${window.location.href.split('#')[0]}#msg-${m.id}`, 'Link copied') },
]
</script>

<template>
  <div>
    <p v-if="!folded && hiredAt < 0 && messages[0]?.kind === 'brief'" class="mt-6 text-center text-p-sm text-ink-gray-5">
      Sent to you and the other partners who match
    </p>
    <div v-if="folded" class="mt-6 flex justify-center">
      <Button :label="`Show ${hiredAt} earlier messages`" @click="expanded = true" />
    </div>
    <template v-for="m in shown" :key="m.id">
      <!-- The moment the company became known. -->
      <p v-if="m.kind === 'shared'" class="mt-6 text-center text-p-sm text-ink-gray-5">
        <span class="text-ink-gray-7">{{ company?.name }}</span>
        is interested in your quote and shared their contact details · {{ time(m.at) }}
      </p>
      <!-- The hire request, and what became of it. -->
      <p v-else-if="m.kind === 'hire-sent'" class="mt-6 text-center text-p-sm text-ink-gray-5">
        You asked <span class="text-ink-gray-7">{{ company?.name }}</span> to confirm the hire · {{ time(m.at) }}
      </p>
      <p v-else-if="m.kind === 'hire-withdrawn'" class="mt-6 text-center text-p-sm text-ink-gray-5">
        Hire request withdrawn · {{ time(m.at) }}
      </p>
      <p v-else-if="m.kind === 'hire-declined'" class="mt-6 text-center text-p-sm text-ink-gray-5">
        <span class="text-ink-gray-7">{{ company?.name }}</span> declined the hire request · {{ time(m.at) }}
      </p>
      <p v-else-if="m.kind === 'hired-other'" class="mt-6 text-center text-p-sm text-ink-gray-5">
        <template v-if="m.request">Hire request closed · </template>
        <span class="text-ink-gray-7">{{ company?.name ?? 'The business' }}</span> hired another partner · {{ time(m.at) }}
      </p>
      <!-- The hire: the business agreed to the terms in Connect. -->
      <p v-else-if="m.kind === 'hired'" class="mt-6 text-center text-p-sm text-ink-gray-5">
        <span class="text-ink-gray-7">{{ company?.name }}</span> hired you · {{ time(m.at) }}
      </p>

      <div v-else :id="`msg-${m.id}`" class="mt-5 flex items-start gap-3">
        <Avatar
          v-if="m.from === 'you' && selfLogo"
          :image="selfLogo"
          :label="self?.name"
          size="xl"
          shape="square"
          class="fc-logo-avatar mt-0.5 shrink-0"
        />
        <Avatar v-else-if="m.from === 'you'" :label="self?.name" size="xl" shape="square" class="mt-0.5 shrink-0" />
        <Avatar v-else-if="company" :label="company.contact" size="xl" class="mt-0.5 shrink-0" />
        <Avatar v-else size="xl" shape="square" class="mt-0.5 shrink-0" aria-hidden="true">
          <IconBuilding class="size-full text-ink-gray-5" />
        </Avatar>
        <!-- A reply, as Helpdesk draws one: a full-width card with who and
             when on its header row, and its own actions on the right. -->
        <div v-if="m.kind === 'text'" class="min-w-0 flex-1 rounded-5 border border-outline-gray-2">
          <div class="flex items-center gap-1.5 py-1 pl-3 pr-1">
            <span class="truncate text-p-sm font-medium text-ink-gray-8">{{ authorOf(m) }}</span>
            <span class="text-p-sm text-ink-gray-5">·</span>
            <span class="shrink-0 text-p-sm text-ink-gray-5">{{ time(m.at) }}</span>
            <div class="ml-auto flex shrink-0 items-center">
              <Button
                v-if="canReply"
                variant="ghost"
                icon="lucide-reply"
                aria-label="Reply to this message"
                tooltip="Reply"
                @click="emit('quote', plain(m.body))"
              />
              <Dropdown :options="messageMenu(m)" align="end">
                <Button variant="ghost" icon="lucide-ellipsis" aria-label="More actions" />
              </Dropdown>
            </div>
          </div>
          <div class="fc-message px-3 pb-3 text-p-base text-ink-gray-8" v-html="m.body" />
        </div>

        <div v-else class="min-w-0 flex-1">
          <p class="flex flex-wrap items-baseline gap-x-1.5 text-p-sm">
            <span class="font-medium text-ink-gray-8">{{ authorOf(m) }}</span>
            <span class="text-ink-gray-5">·</span>
            <span class="text-ink-gray-5">{{ time(m.at) }}</span>
          </p>

          <div v-if="m.kind === 'brief' && brief" class="mt-1.5 w-full rounded-5 border border-outline-gray-2 p-3.5">
            <p class="text-p-base font-medium text-ink-gray-8">{{ project }}</p>
            <p class="mt-1.5 line-clamp-2 whitespace-pre-line text-p-base leading-relaxed text-ink-gray-7">{{ brief.scope }}</p>
            <Button class="mt-3" label="Read brief" @click="emit('read-brief')" />
          </div>

          <div v-else-if="m.kind === 'bid'" class="mt-1.5 w-full rounded-5 border border-outline-gray-2 p-3.5">
            <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p class="text-p-lg font-semibold tabular-nums text-ink-gray-9">{{ m.bid.price }}</p>
              <p class="text-p-base text-ink-gray-6">about {{ m.bid.weeks }} weeks</p>
            </div>
            <p class="mt-2 text-p-base leading-relaxed text-ink-gray-7">{{ m.bid.note }}</p>
            <!-- Once they're interested, the line under the quote says so. -->
            <Badge v-if="!company" class="mt-3" theme="gray" label="Waiting on their decision" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
