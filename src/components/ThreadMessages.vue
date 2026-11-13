<script setup>
import { computed, ref } from 'vue'
import { Avatar, Badge, Button, Dropdown, toast } from 'frappe-ui'
import IconBuilding from '~icons/lucide/building-2'
import DescriptionText from './DescriptionText.vue'
import { awaitingRequote, changeLine, isUpdate, quoteStanding } from '../data/messages'

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
  brief: { type: Object, default: null },
  self: { type: Object, default: null },
  selfLogo: { type: String, default: null },
  authorOf: { type: Function, required: true },
  canReply: { type: Boolean, default: false },
  fold: { type: Boolean, default: false },
})
const emit = defineEmits(['quote', 'read-brief', 'confirm-quote', 'new-quote'])

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
// The brief is a message like any other: what the business wrote is its text.
const briefOf = (m) => m.brief ?? props.brief
const textOf = (m) => (m.kind === 'brief' ? (briefOf(m)?.scope ?? '') : plain(m.body))

// The newest update, while it still waits on this partner's answer: it carries
// "Quote still stands" and "Send new quote". See docs/edit-requirements.md.
const answering = computed(() =>
  props.canReply && awaitingRequote(props.messages) ? props.messages.findLast(isUpdate) : null,
)
const standing = (m) => quoteStanding(props.messages, props.messages.indexOf(m))
const messageMenu = (m) => [
  { label: 'Copy text', icon: 'lucide-copy', onClick: () => copy(textOf(m), 'Copied') },
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
      <!-- An update is an event in the thread, said like the others; the card
           under it is what the business sent. -->
      <p v-if="isUpdate(m)" class="mt-6 text-center text-p-sm text-ink-gray-5">
        <span class="text-ink-gray-7">Requirements updated</span> · {{ changeLine(m) }} · {{ time(m.at) }}
      </p>
      <p v-if="m.kind === 'confirmed'" class="mt-6 text-center text-p-sm text-ink-gray-5">
        You confirmed your quote · {{ time(m.at) }}
      </p>
      <p v-else-if="m.kind === 'shared'" class="mt-6 text-center text-p-sm text-ink-gray-5">
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
        <!-- The brief takes the same shape: what the business wrote, in full,
             with the requirements they picked as a row under it. -->
        <div
          v-if="m.kind === 'text' || (m.kind === 'brief' && briefOf(m))"
          class="min-w-0 flex-1 rounded-5 border border-outline-gray-2"
        >
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
                @click="emit('quote', textOf(m))"
              />
              <Dropdown :options="messageMenu(m)" align="end">
                <Button variant="ghost" icon="lucide-ellipsis" aria-label="More actions" />
              </Dropdown>
            </div>
          </div>
          <div v-if="m.kind === 'brief'" class="px-3 pb-3">
            <DescriptionText :text="briefOf(m).scope" :prev="m.prev?.scope ?? null" :rewritten="m.rewritten" />
            <div class="mt-2.5 flex flex-wrap items-center gap-2">
              <Button
                variant="subtle"
                size="sm"
                icon-left="lucide-file-text"
                label="Requirements"
                @click="emit('read-brief', { brief: m.brief ?? null, previous: m.prev ?? null })"
              />
              <template v-if="answering === m">
                <span class="flex-1" />
                <Button variant="subtle" size="sm" label="Quote still stands" @click="emit('confirm-quote')" />
                <Button variant="subtle" size="sm" label="Send new quote" @click="emit('new-quote')" />
              </template>
            </div>
          </div>
          <div v-else class="fc-message px-3 pb-3 text-p-base text-ink-gray-8" v-html="m.body" />
        </div>

        <div v-else class="min-w-0 flex-1">
          <p class="flex flex-wrap items-baseline gap-x-1.5 text-p-sm">
            <span class="font-medium text-ink-gray-8">{{ authorOf(m) }}</span>
            <span class="text-ink-gray-5">·</span>
            <span class="text-ink-gray-5">{{ time(m.at) }}</span>
          </p>

          <div v-if="m.kind === 'bid'" class="mt-1.5 w-full rounded-5 border border-outline-gray-2 p-3.5">
            <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p class="text-p-lg font-semibold tabular-nums text-ink-gray-9">{{ m.bid.price }}</p>
              <p class="text-p-base text-ink-gray-6">about {{ m.bid.weeks }} weeks</p>
            </div>
            <p class="mt-2 text-p-base leading-relaxed text-ink-gray-7">{{ m.bid.note }}</p>
            <!-- An outdated or replaced quote says so first; otherwise, until
                 they're interested, the line under the quote says it waits. -->
            <Badge
              v-if="standing(m)"
              class="mt-3"
              theme="gray"
              :label="standing(m) === 'replaced' ? 'Replaced' : 'Quoted before the requirements changed'"
            />
            <Badge v-else-if="!company" class="mt-3" theme="gray" label="Waiting on their decision" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
