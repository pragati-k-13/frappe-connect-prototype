<script setup>
import { computed } from 'vue'

// SCREEN 6, closing section — "How <partner> began".
//
// The founding story, and ONLY the founding story. Values, mission and working
// style all live in the Partner vision section above, which already asks every
// partner the same three questions about them; saying any of it twice on one
// page would make both sections read as filler. This one is strictly
// historical — when the firm started, what it was reacting to, where that got
// it — and it stops there.
//
// ⚠️ Every word of the copy is invented. See the warning on `FOUNDING` in
// `data/partners.js`.
//
// ── Why it looks nothing like the sections above it ──────────────────────
// Every other section on this profile is a specification: full 800px width, a
// 14px semibold label, and content laid out to be SCANNED — chips, rules,
// two-column question-and-answer, a table of packs. That is right for
// everything a visitor is comparing partners on.
//
// This one is not being compared. It's the partner's own account of themselves
// and the only thing to do with it is read it, so what marks it out is the
// SHAPE, not the type: a single column pulled in to 600px against the page's
// 800, and no frame, icon, chip or rule anywhere in it. Everything else on the
// page runs the full width and is built out of parts; this is one narrow
// column of prose, and that's what tells you the register has changed.
//
// The body is `text-p-base text-ink-gray-6`, the same as every other paragraph
// in the app. It was briefly set a step larger (`p-lg`, `ink-gray-7`) on the
// theory that a section meant to be read should be sized up — it read as
// shouting rather than as talking, and the narrowed column was already saying
// it on its own.
//
// The heading is 16px against the other sections' 14px, and deliberately still
// under the 17px of the partner's name in the header: this is the biggest
// heading in the body of the page, and it is still not the page's title.
const props = defineProps({
  partner: { type: Object, required: true },
})

const founding = computed(() => props.partner.founding)
</script>

<template>
  <!-- Owns its top margin rather than taking one from a wrapper, for the same
       reason `PartnerMarketplaceSection` does: this section can be absent, and
       an empty `<div class="mt-24">` still collapses its margins through itself
       and leaves the 96px gap behind. -->
  <section v-if="founding" class="mx-auto mt-24 max-w-[600px]">
    <!-- The one checkable fact in the section, stated plainly and once. The
         prose deliberately keeps the date vague ("the mid-2000s", "a decade
         in") so there's a single place a reader has to trust, and a single
         place to correct. -->
    <p class="text-p-sm text-ink-gray-5">Founded {{ founding.year }} in {{ partner.city }}</p>

    <!-- "How they got started", not "How <partner> began". Every other heading
         on this page is a noun-phrase label — About, Pricing, Reviews — and
         this one is the section that isn't a label, so it's allowed to sound
         like a person introducing the thing. "They" rather than the name: the
         name is in the breadcrumb, the h1, the tagline and the sentence
         immediately below, and stating it a fifth time is the formal register
         the heading is trying to get out of. -->
    <h2 class="mt-2 text-lg font-semibold text-ink-gray-8">How they got started</h2>

    <!-- `space-y-4` — 16px against the paragraph's own 21px line spacing, which
         is enough to separate them at this size. -->
    <div class="mt-4 space-y-4">
      <p v-for="(para, i) in founding.story" :key="i" class="text-p-base text-ink-gray-6">
        {{ para }}
      </p>
    </div>
  </section>
</template>
