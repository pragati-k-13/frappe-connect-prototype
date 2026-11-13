<script setup>
import { computed } from 'vue'
import InlineInput from './InlineInput.vue'
import { ANSWER_MAX, STORY_MAX } from '../data/partners'
// Imported rather than written as `<LucideHandshake />` tags, because the rows
// are a data list and the icon has to travel with the row.
import IconStory from '~icons/lucide/book-open'
import IconWhy from '~icons/lucide/unplug'
import IconTogether from '~icons/lucide/wrench'

// SCREEN 6, third section — "In their words". Everything here is the partner's
// own account, which is what the title says, and what sets it apart from
// "Featured by Frappe" below it, which Frappe writes.
//
// The two prompts every partner answers come first, then the firm's story, in
// the same grid so the section has one shape and one right edge (no year: the
// story can say when it started). The prompts are the directory's, not the
// partner's, so they live here rather than in the data. All three are
// required: a partner can't publish with any of them empty, so the client view
// never has a gap.
//
// ⚠️ Every story and answer is invented. See `FOUNDING` and `VISION` in
// `data/partners.js`.
const props = defineProps({
  partner: { type: Object, required: true },
  // The partner's own page in edit mode: everything edits in place.
  editable: { type: Boolean, default: false },
  // Keys of the required fields left empty at the last Publish:
  // 'story', 'why', 'together'.
  errors: { type: Array, default: () => [] },
})
const emit = defineEmits(['change'])

const story = computed(() => props.partner.founding?.story ?? [])
const vision = computed(() => props.partner.vision ?? { why: '', together: { text: '' } })

const rows = computed(() => [
  { key: 'why', icon: IconWhy, question: 'Why work with us and who should work with us', answer: vision.value.why },
  { key: 'together', icon: IconTogether, question: 'How we’ll work together', answer: vision.value.together?.text ?? '' },
  { key: 'story', icon: IconStory, question: 'How we got here' },
])

// ── Editing ──────────────────────────────────────────────────────────────────
// The story edits as one text; a blank line starts a new paragraph.
const storyText = computed(() => story.value.join('\n\n'))
function setStory(text) {
  const next = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  emit('change', { founding: { ...(props.partner.founding ?? {}), story: next } })
}
function setAnswer(key, text) {
  const v = vision.value
  emit('change', { vision: key === 'why' ? { ...v, why: text } : { ...v, together: { ...v.together, text } } })
}
const missing = (key) => props.errors.includes(key)
</script>

<template>
  <section v-if="editable || story.length">
    <h2 class="text-base font-semibold text-ink-gray-8">In their words</h2>

    <!-- Question left, answer right. Rules between rows are list structure:
         they're what makes two long answers read as two answers. -->
    <dl class="mt-4 divide-y divide-outline-gray-1">
      <div
        v-for="row in rows"
        :key="row.key"
        class="grid gap-x-6 gap-y-3 py-6 first:pt-0 last:pb-0 sm:grid-cols-[1fr_1.9fr]"
        :data-invalid="missing(row.key) || undefined"
      >
        <dt class="flex items-start gap-2.5">
          <span
            class="grid size-6 shrink-0 place-items-center rounded-3 bg-surface-gray-2 text-ink-gray-7"
            aria-hidden="true"
          >
            <component :is="row.icon" class="size-4" />
          </span>
          <!-- A step darker than the answer: these are the directory's own
               prompts, and they're the column you scan down. -->
          <span class="text-base font-medium leading-6 text-ink-gray-7">{{ row.question }}</span>
        </dt>
        <dd v-if="editable" class="min-w-0">
          <InlineInput
            v-if="row.key === 'story'"
            multiline
            boxed
            :error="missing(row.key) && !storyText.trim() ? 'Required' : ''"
            :rows="7"
            :max="STORY_MAX"
            :model-value="storyText"
            label="How we got here"
            placeholder="Where you started and what it taught you"
            @commit="setStory"
          />
          <InlineInput
            v-else
            multiline
            boxed
            :error="missing(row.key) && !row.answer?.trim() ? 'Required' : ''"
            :rows="4"
            :max="ANSWER_MAX"
            :model-value="row.answer"
            :label="row.question"
            placeholder="Answer in your own words"
            @commit="setAnswer(row.key, $event)"
          />
        </dd>
        <dd v-else-if="row.key === 'story'" class="min-w-0 space-y-4">
          <p v-for="(para, i) in story" :key="i" class="text-p-base text-ink-gray-6">{{ para }}</p>
        </dd>
        <dd v-else class="min-w-0">
          <p class="text-p-base text-ink-gray-6">{{ row.answer }}</p>
        </dd>
      </div>
    </dl>
  </section>
</template>
