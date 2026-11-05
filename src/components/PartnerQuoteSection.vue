<script setup>
import { computed } from 'vue'
import { Avatar, Button } from 'frappe-ui'

// The leadership quote, optional, and the last thing on the profile: it closes
// the partner's own account with a voice instead of opening with one. Same
// treatment it had at the top of "Partner vision": bracketed by quote marks and
// rules, the author's photo, name and role. A quote can only be published with
// all three (see the quote dialog on the partner's own page).
const props = defineProps({
  partner: { type: Object, required: true },
  // The partner's own page in edit mode: a pencil opens the quote dialog, and
  // with no quote yet there's a button to add one.
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['edit'])

const vision = computed(() => (props.partner.vision?.quote ? props.partner.vision : null))
</script>

<template>
  <section v-if="vision">
    <figure class="group relative">
      <!-- On the top rule's right end, clear of the author's photo. -->
      <Button
        v-if="editable"
        class="absolute right-0 top-2 z-10 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        icon-left="lucide-pencil"
        aria-label="Edit quote"
        @click="emit('edit')"
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
            {{ vision.quote }}
          </blockquote>
          <figcaption class="mt-5">
            <p class="text-p-base font-medium text-ink-gray-7">{{ vision.author.name }}</p>
            <p class="mt-0.5 text-p-base text-ink-gray-6">{{ vision.author.role }}</p>
          </figcaption>
        </div>

        <!-- A quote needs its author's photo to be published. -->
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
  </section>
  <Button v-else-if="editable" label="Add a quote" icon-left="lucide-quote" @click="emit('edit')" />
</template>
