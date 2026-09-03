<script setup>
import { computed } from 'vue'
import { Badge, Tooltip } from 'frappe-ui'
import { APPS } from '../data/partners'
import { useConnectStore } from '../stores/connect'

// SCREEN 6, second section — the About / Services and Expertise card.
//
// One outlined card split into two columns, per the design. Not two cards:
// these are the two halves of "who are they, and do they do what I need?", and
// a single frame is what says they're read together.
const props = defineProps({
  partner: { type: Object, required: true },
})

const store = useConnectStore()

// The chips are frappe-ui `Badge` — its own stories use it for row tags, and
// `<Badge>+2</Badge>` is its overflow pattern too. `md`: 20px tall, 12px text,
// and a 10px icon slot, which is what the match check sits in.
//
// ⚠️ Badge is `rounded-full`, so these render as pills rather than the
// 6px-radius rectangles the design draws. That's the design system's shape for
// a tag, so it wins over the mock — flagging it in case the Figma tag library
// says otherwise.
const CHIP = { theme: 'gray', variant: 'subtle', size: 'md' }

// ⚠️ Best guess at the expansion — the design shows the label and an info
// icon, not the tooltip's copy. One line to correct.
const PMM_HELP = 'Partner Maturity Model level, 1 to 5.'

// The design shows five industry chips and a `+2`. Same cap here, and the
// overflow chip carries the rest in a tooltip rather than just a number, which
// is what the listing row's "+2 more" already does.
const CHIP_LIMIT = 5

const appLabel = (value) => APPS.find((a) => a.value === value)?.label ?? value

// A chip is checked when it answers something the visitor actually asked.
// Nothing is checked if they skipped the quiz, which is correct: there is no
// requirement to match against.
const wantsIndustry = (name) => store.answers.segments.includes(name)
const wantsApp = (value) => store.filters.app === value

// `app` keys back into APPS for the display label, the same way the Frappe
// apps row does — no second list of certification names to keep in sync.
const certifications = computed(() =>
  props.partner.certifications.map((c) => {
    const label = appLabel(c.app)
    return {
      ...c,
      label,
      // The screen-reader sentence is assembled, so the article has to agree:
      // "an ERPNext certification", "a Framework certification". App labels are
      // product names, so the initial letter is a good enough test.
      article: /^[AEIOU]/i.test(label) ? 'an' : 'a',
    }
  }),
)

const industries = computed(() => props.partner.industries)
const apps = computed(() => props.partner.apps.map((v) => ({ value: v, label: appLabel(v) })))

// Matches float to the front. The cap means the checked chips are the ones
// that must survive it — a partner matching an industry that got truncated
// into "+2" would be hiding the one fact the visitor came for.
const shownIndustries = computed(() =>
  [...industries.value].sort((a, b) => Number(wantsIndustry(b)) - Number(wantsIndustry(a))),
)
const industryOverflow = computed(() => shownIndustries.value.slice(CHIP_LIMIT))

// Address is real or absent — never invented. See `data/partners.js`.
const address = computed(() => props.partner.address ?? props.partner.city)
</script>

<template>
  <!-- `overflow-hidden` so the column rule and the header rules stop at the
       card's rounded corners instead of running into them. -->
  <section class="overflow-hidden rounded-5 border border-outline-gray-2 bg-surface-base">
    <div class="grid sm:grid-cols-2">
      <!-- ── About ───────────────────────────────────────────────────────── -->
      <!-- The split is a border on the left column, so it collapses to a
           horizontal rule when the two stack below `sm`. -->
      <div class="border-outline-gray-2 sm:border-r">
        <h2
          class="flex items-center gap-2 border-b border-outline-gray-2 px-4 py-3 text-base font-medium text-ink-gray-8"
        >
          <LucideInfo class="size-4 shrink-0 text-ink-gray-6" />
          About
        </h2>

        <!-- `<dl>` because every row here is a label and its value. The rules
             go on the pairs inside the padding, which is what insets them from
             the column edges — the header's rule spans the full width, these
             don't. -->
        <dl class="divide-y divide-outline-gray-1 px-4">
          <div class="py-3.5">
            <dt class="flex items-center gap-1.5 text-p-sm text-ink-gray-7">
              PMM
              <Tooltip :text="PMM_HELP">
                <LucideInfo class="size-3.5 shrink-0 text-ink-gray-6" />
              </Tooltip>
            </dt>
            <dd class="mt-1.5 text-p-base tabular-nums text-ink-gray-8">{{ partner.pmm }}</dd>
          </div>

          <div v-if="partner.certifications.length" class="py-3.5">
            <dt class="text-p-sm text-ink-gray-7">Certified members</dt>
            <!-- How many of the team hold each Frappe certification, count
                 first: the number is the answer here, and leading with it lets
                 the column be scanned down rather than read chip by chip.
                 Highest first — see `data/partners.js`. -->
            <dd class="mt-1.5 flex flex-wrap gap-1.5">
              <Badge v-for="c in certifications" :key="c.app" v-bind="CHIP">
                <span class="tabular-nums">{{ c.members }}</span>
                {{ c.label }}
                <!-- "2 ERPNext" is scannable but says nothing on its own, so
                     the full sentence is what a screen reader gets. -->
                <span class="sr-only">
                  {{ c.members === 1 ? 'member holds' : 'members hold' }}
                  {{ c.article }} {{ c.label }} certification
                </span>
              </Badge>
            </dd>
          </div>

          <div v-if="partner.accolades.length" class="py-3.5">
            <dt class="text-p-sm text-ink-gray-7">Accolades</dt>
            <dd class="mt-1.5 flex flex-wrap gap-2">
              <!-- `w-fit`: the box hugs its title rather than spanning the
                   column, so two accolades sit side by side. -->
              <div
                v-for="a in partner.accolades"
                :key="`${a.title}-${a.year}`"
                class="flex w-fit items-start gap-2 rounded-4 bg-surface-gray-2 px-3 py-2"
              >
                <LucideTrophy class="mt-0.5 size-4 shrink-0 text-ink-amber-7" aria-hidden="true" />
                <div class="min-w-0">
                  <p class="text-p-sm font-medium text-ink-gray-8">{{ a.title }}</p>
                  <p class="text-p-xs tabular-nums text-ink-gray-6">{{ a.year }}</p>
                </div>
              </div>
            </dd>
          </div>

          <div class="py-3.5">
            <dt class="text-p-sm text-ink-gray-7">Address</dt>
            <!-- The one long-form value in the card, so it's the only one that
                 gets a reading line-height. -->
            <dd class="mt-1.5 text-p-base leading-6 text-ink-gray-6">{{ address }}</dd>
          </div>
        </dl>
      </div>

      <!-- ── Services and Expertise ──────────────────────────────────────── -->
      <div class="border-t border-outline-gray-2 sm:border-t-0">
        <h2
          class="flex items-center gap-2 border-b border-outline-gray-2 px-4 py-3 text-base font-medium text-ink-gray-8"
        >
          <LucideBriefcase class="size-4 shrink-0 text-ink-gray-6" />
          Services and Expertise
        </h2>

        <dl class="divide-y divide-outline-gray-1 px-4">
          <div class="py-3.5">
            <dt class="text-p-sm text-ink-gray-7">Countries served</dt>
            <dd class="mt-1.5 flex flex-wrap gap-1.5">
              <Badge v-for="c in partner.countries" :key="c" v-bind="CHIP" :label="c" />
            </dd>
          </div>

          <div class="py-3.5">
            <dt class="text-p-sm text-ink-gray-7">Industries served</dt>
            <dd class="mt-1.5 flex flex-wrap gap-1.5">
              <Badge
                v-for="i in shownIndustries.slice(0, CHIP_LIMIT)"
                :key="i"
                v-bind="CHIP"
                :label="i"
              >
                {{ i }}
                <!-- The check is the only thing separating a matched chip from
                     an unmatched one, so it needs a text equivalent rather
                     than an aria-hidden glyph on its own. -->
                <template v-if="wantsIndustry(i)" #suffix>
                  <LucideCheck class="size-3" aria-hidden="true" />
                  <span class="sr-only">— matches your answers</span>
                </template>
              </Badge>
              <!-- The rest by name, not just a count: "+2" alone asks the
                   visitor to take it on trust that their industry isn't in
                   there. -->
              <Tooltip v-if="industryOverflow.length" :text="industryOverflow.join(', ')">
                <Badge v-bind="CHIP" :label="`+${industryOverflow.length}`" />
              </Tooltip>
            </dd>
          </div>

          <div class="py-3.5">
            <dt class="text-p-sm text-ink-gray-7">Frappe apps</dt>
            <dd class="mt-1.5 flex flex-wrap gap-1.5">
              <Badge v-for="a in apps" :key="a.value" v-bind="CHIP" :label="a.label">
                {{ a.label }}
                <template v-if="wantsApp(a.value)" #suffix>
                  <LucideCheck class="size-3" aria-hidden="true" />
                  <span class="sr-only">— matches your answers</span>
                </template>
              </Badge>
            </dd>
          </div>

          <div v-if="partner.migrations.length" class="py-3.5">
            <dt class="text-p-sm text-ink-gray-7">Migration</dt>
            <dd class="mt-1.5 flex flex-wrap gap-1.5">
              <Badge v-for="m in partner.migrations" :key="m" v-bind="CHIP" :label="m" />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>
