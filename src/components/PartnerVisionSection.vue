<script setup>
import { computed } from 'vue'
import { Avatar, Badge, Tooltip } from 'frappe-ui'
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
})

const vision = computed(() => props.partner.vision)

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
    <figure class="mt-8">
      <div class="flex items-center gap-3">
        <span
          class="select-none translate-y-[0.1em] font-serif text-12xl leading-[0.42] text-ink-gray-3"
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <span class="flex-1 border-t border-outline-gray-1" />
      </div>

      <div class="mt-4 flex items-start justify-between gap-6">
        <div class="min-w-0 flex-1">
          <blockquote class="max-w-prose text-p-base text-ink-gray-6">
            {{ vision.quote }}
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
        <Avatar class="size-16 shrink-0" />
      </div>

      <div class="mt-4 flex items-center gap-3">
        <span class="flex-1 border-t border-outline-gray-1" />
        <span
          class="select-none translate-y-[0.1em] font-serif text-12xl leading-[0.42] text-ink-gray-3"
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
               the first two lines of its answer. -->
          <span class="text-base font-medium leading-6 text-ink-gray-6">{{ row.question }}</span>
        </dt>

        <dd class="min-w-0">
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
