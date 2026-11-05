<script setup>
import { computed, ref } from 'vue'
import { Avatar, Badge, Button, TextInput, Tooltip } from 'frappe-ui'
import InlineInput from './InlineInput.vue'
// Imported rather than written as `<LucideHandshake />` tags, because the rows
// are a data list and the icon has to travel with the row. `~icons/lucide/*`
// is the same virtual module the auto-resolver uses, so these are the same
// icons at the same 1.5 stroke width.
import IconWhy from '~icons/lucide/unplug'
import IconTogether from '~icons/lucide/wrench'
import IconSuccess from '~icons/lucide/rocket'

// SCREEN 6, third section — "Partner vision".
//
// A leadership quote, then the same three questions every partner in the
// directory answers. The questions are fixed and live here rather than in the
// data: they're the directory's prompts, not the partner's copy, and a partner
// who reworded them would break the comparison the section exists to support.
const props = defineProps({
  partner: { type: Object, required: true },
  // The partner's own page in edit mode: answers and tags edit in place, the
  // quote and its author open a dialog (`edit-quote`).
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['change', 'edit-quote'])
// A firm that hasn't answered yet still gets the three prompts to fill in.
const EMPTY = { quote: '', author: { name: '', role: '' }, why: '', together: { text: '', tags: [] }, success: { text: '', tags: [] } }

const vision = computed(() => props.partner.vision ?? (props.editable ? EMPTY : null))

const rows = computed(() => {
  const v = vision.value
  if (!v) return []
  return [
    {
      key: 'why',
      icon: IconWhy,
      question: 'Why work with us and who should work with us',
      answer: v.why,
      tags: [],
    },
    {
      key: 'together',
      icon: IconTogether,
      question: 'How we’ll work together',
      answer: v.together.text,
      tags: v.together.tags ?? [],
    },
    {
      key: 'success',
      icon: IconSuccess,
      question: 'How we define a successful implementation',
      answer: v.success.text,
      tags: v.success.tags ?? [],
    },
  ]
})

// A tag is a bare string, or `{ label, hint }` when it carries the info icon.
const asTag = (t) => (typeof t === 'string' ? { label: t, hint: null } : t)

// ── Editing ──────────────────────────────────────────────────────────────────
// Each change goes up as the whole vision, so the page stores one object.
function setAnswer(key, text) {
  const v = vision.value
  emit('change', key === 'why' ? { ...v, why: text } : { ...v, [key]: { ...v[key], text } })
}
const newTag = ref({})
function addTag(key) {
  const label = (newTag.value[key] ?? '').trim()
  newTag.value[key] = ''
  const v = vision.value
  if (!label || v[key].tags.some((t) => asTag(t).label === label)) return
  emit('change', { ...v, [key]: { ...v[key], tags: [...v[key].tags, label] } })
}
function removeTag(key, label) {
  const v = vision.value
  emit('change', { ...v, [key]: { ...v[key], tags: v[key].tags.filter((t) => asTag(t).label !== label) } })
}
</script>

<template>
  <section v-if="vision">
    <h2 class="text-base font-semibold text-ink-gray-8">Partner vision</h2>

    <!-- ── The quote ────────────────────────────────────────────────────
         Bracketed rather than boxed: an opening mark with a rule running off
         to the right, and a closing mark with a rule running back to the left.
         The two rules do the work a card border would, without adding a frame
         to a page that has one already.

         Real typographic quotes rather than an icon — they're set in the same
         face as the quote itself, so the weight matches. `aria-hidden` because
         `<blockquote>` already says this is a quotation; a screen reader
         announcing "left double quotation mark" adds nothing. -->
    <figure class="group relative mt-8">
      <!-- On the top rule's right end, clear of the author's photo. -->
      <Button
        v-if="editable"
        class="absolute right-0 top-2 z-10 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        icon-left="lucide-pencil"
        aria-label="Edit vision quote"
        @click="emit('edit-quote')"
      >
        Edit
      </Button>
      <!-- ⚠️ `translate-y-[0.27em]`, and the figure is measured rather than
           eyeballed. `items-center` centres the BOX, and a quote mark's box is
           nothing like its ink: Georgia sets “ and ” up near cap height, so the
           painted marks sat 9.5px above the rule on a 56px glyph even though
           the boxes were perfectly centred. Canvas
           `measureText().actualBoundingBoxAscent/Descent` against a
           zero-width baseline probe puts the ink centre 0.17em above the rule,
           on top of the 0.1em that was already here — hence 0.27em, and hence
           the same value on both marks, since the two glyphs share their
           vertical metrics.
           Re-measure if the face or `text-12xl` ever changes; this number
           belongs to Georgia at this size and nothing else. -->
      <div class="flex items-center gap-3">
        <span
          class="select-none translate-y-[0.27em] font-serif text-12xl leading-[0.42] text-ink-gray-3"
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <span class="flex-1 border-t border-outline-gray-1" />
      </div>

      <!-- In edit mode the quote and its author are one block with a pencil
           that shows on hover or focus: four fields, one of them a photo, so
           they edit together in a dialog. -->
      <div class="mt-4 flex items-start justify-between gap-6">
        <div class="min-w-0 flex-1">
          <blockquote class="max-w-prose text-p-base text-ink-gray-6">
            {{ vision.quote || (editable ? 'Add a quote from your leadership' : '') }}
          </blockquote>
          <figcaption class="mt-5">
            <p class="text-p-base font-medium text-ink-gray-7">{{ vision.author.name }}</p>
            <p class="mt-0.5 text-p-base text-ink-gray-6">{{ vision.author.role }}</p>
          </figcaption>
        </div>

        <!-- ⚠️ No photo, and no initial either. A portrait is the one asset
             that can't be stood in for: a placeholder face on a real person's
             name is worse than no face, and a letter reads as their monogram
             rather than as a gap. `Avatar` with neither `image` nor `label`
             holds the space as a plain circle. Add `:image` when the real
             ones arrive. -->
        <Avatar class="size-16 shrink-0" :image="vision.author.photo" />
      </div>

      <div class="mt-4 flex items-center gap-3">
        <span class="flex-1 border-t border-outline-gray-1" />
        <!-- Same 0.27em as the opening mark — see the note above. -->
        <span
          class="select-none translate-y-[0.27em] font-serif text-12xl leading-[0.42] text-ink-gray-3"
          aria-hidden="true"
        >
          &rdquo;
        </span>
      </div>
    </figure>

    <!-- ── The three questions ──────────────────────────────────────────
         Question left, answer right. Rules between rows are list structure,
         the same as the partner listing — they're what makes three long
         answers read as three answers. -->
    <dl class="mt-10 divide-y divide-outline-gray-1">
      <div
        v-for="row in rows"
        :key="row.key"
        class="grid gap-x-6 gap-y-3 py-6 sm:grid-cols-[1fr_1.9fr]"
      >
        <dt class="flex items-start gap-2.5">
          <span
            class="grid size-6 shrink-0 place-items-center rounded-3 bg-surface-gray-2 text-ink-gray-7"
            aria-hidden="true"
          >
            <component :is="row.icon" class="size-3.5" />
          </span>
          <!-- `leading-6` so a heading that wraps to two lines sits level with
               the first two lines of its answer.
               `ink-7`, a step darker than the answer beside it in `ink-6`: these
               are the directory's own prompts, the same three for every partner,
               and they're the column you scan down. At the same ink as the
               answers the two halves of the row read as one block of grey. -->
          <span class="text-base font-medium leading-6 text-ink-gray-7">{{ row.question }}</span>
        </dt>

        <dd v-if="editable" class="min-w-0">
          <InlineInput
            multiline
            :rows="4"
            :model-value="row.answer"
            :label="row.question"
            placeholder="Answer in your own words"
            @commit="setAnswer(row.key, $event)"
          />
          <!-- `why` carries no tags in the directory, so only the other two
               offer them. -->
          <div v-if="row.key !== 'why'" class="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge v-for="t in row.tags.map(asTag)" :key="t.label" theme="gray" variant="subtle" size="md">
              {{ t.label }}
              <template #suffix>
                <button
                  type="button"
                  class="lucide-x size-3 rounded-full text-ink-gray-5 hover:text-ink-gray-8 focus-visible:focus-ring"
                  :aria-label="`Remove ${t.label}`"
                  @click="removeTag(row.key, t.label)"
                />
              </template>
            </Badge>
            <TextInput
              v-model="newTag[row.key]"
              class="w-32"
              size="sm"
              variant="ghost"
              placeholder="Add tag"
              :aria-label="`Add a tag to ${row.question}`"
              @keydown.enter.prevent="addTag(row.key)"
              @blur="addTag(row.key)"
            />
          </div>
        </dd>
        <dd v-else class="min-w-0">
          <p class="text-p-base text-ink-gray-6">{{ row.answer }}</p>
          <div v-if="row.tags.length" class="mt-3 flex flex-wrap gap-1.5">
            <!-- Label through the default slot rather than the `label` prop,
                 so the optional `#suffix` can sit beside it. A named slot has
                 to be a direct child of the component — nesting it inside a
                 `v-if` template would hand Badge no suffix at all — so the
                 condition goes on the slot template itself. -->
            <Badge
              v-for="t in row.tags.map(asTag)"
              :key="t.label"
              theme="gray"
              variant="subtle"
              size="md"
            >
              {{ t.label }}
              <template v-if="t.hint" #suffix>
                <Tooltip :text="t.hint">
                  <LucideInfo class="size-2.5" />
                </Tooltip>
              </template>
            </Badge>
          </div>
        </dd>
      </div>
    </dl>
  </section>
</template>
