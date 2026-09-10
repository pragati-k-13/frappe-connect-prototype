<script setup>
// SCREENS 2–4 — the Frappe Connect landing page.
//
// Frappe Connect deliberately does NOT open on a listing. The hero is a
// three-question qualifier, and the partner list is what you get for finishing
// it. Everything below the fold (starter packs, success stories, footer CTA)
// exists to give someone who isn't ready to answer a reason to stay — and
// every one of those sections routes back into the same quiz.

import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Radio, RadioGroup, ScrollArea, Select } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import DottedWorldMap from '../components/DottedWorldMap.vue'
import FilterChip from '../components/FilterChip.vue'
import { useConnectStore } from '../stores/connect'
import { INDUSTRIES, GEO_CHOICES, IMPLEMENTATION_TYPES } from '../data/quiz'
import { SUCCESS_STORIES } from '../data/partners'
// Pack pricing is per region now. This table has no region to read — the quiz
// asks for one, but a visitor can skip it — so it quotes the default, India,
// and says so in the line above it.
import { STARTER_PACKS, priceFor, pricingFor, DEFAULT_REGION } from '../data/packs'

const store = useConnectStore()
const router = useRouter()

const TOTAL = 3
const step = ref(1)
const quizTop = ref(null)
// Location is pre-answered from "where we think you are" so this question costs
// a confirmation instead of a decision. The hint under the chips says so —
// a silently pre-filled answer would be the dishonest version of this.
onMounted(() => store.seedInferredGeo())

const selectedIndustry = computed(() => INDUSTRIES.find((i) => i.value === store.answers.industry))
// All four groups branch — every one has real segments in the directory's
// taxonomy. The branch is OPTIONAL: picking an industry is a complete answer to
// this step, and the segment narrows it further if you want it to.
//
// How "no segment" is stored is the part worth reading. `answers.industry` does
// not filter anything — partners are tagged at the SEGMENT level, so `segments`
// is the whole constraint (see `stores/connect.js`). Left empty, "Services"
// would therefore mean "no constraint at all", and Continue would land you on
// the same unfiltered listing as Skip.
//
// So picking an industry selects EVERY segment in it. The results filter unions
// segments ("any of these"), so a group's full set is exactly what that group
// means as a filter, and the answer now does what the visitor thinks it does.
// Picking one segment from the Select narrows that set to the one.
const segmentsOf = (value) => INDUSTRIES.find((i) => i.value === value)?.segments ?? []

// ⚠️ No partner count beside each option, and that was a decision rather than an
// omission. One was built and taken out: the numbers are derived from the mock's
// thirteen partners over an INVENTED partner→segment mapping, eleven of the
// thirty-five segments come out at zero, and a bare number here has no obvious
// referent — this question is about the visitor's own industry, so "Education 3"
// doesn't read as "three partners" the way "India 71" does one question later,
// where the question itself is about partners. Labelling it ("3 partners") would
// have fixed the ambiguity; it wasn't worth 14 repetitions of the word for a
// figure this soft.
const segmentOptions = computed(() =>
  segmentsOf(store.answers.industry).map((s) => ({ label: s, value: s })),
)

// ⚠️ The Select shows a value only when ONE segment is held. Any other length
// is the implicit "whole industry" set written below, which is not a choice the
// visitor made in this control — rendering `segments[0]` there would show
// "Aviation Industry" as picked the moment someone chose Services.
const chosenSegment = computed(() =>
  store.answers.segments.length === 1 ? store.answers.segments[0] : undefined,
)

const pickIndustry = (value) => {
  // Order matters: `answer('industry')` clears `segments` (changing industry
  // must drop a segment picked under the old one), so the full set goes in
  // after it.
  store.answer('industry', value)
  const segments = segmentsOf(value)
  if (segments.length) store.answer('segments', segments)
}

// Continue is disabled until the current step has an answer. Skip sits beside it
// and stays enabled, so the step is never a trap: not answering is a supported
// move, it just isn't this button's move.
//
// The SEGMENT IS OPTIONAL. Picking an industry is enough to move on, and there
// is no error for leaving the segment empty — the Select's "Pick a segment"
// placeholder is the whole prompt.
//
// ⚠️ This step used to keep Continue enabled and then REFUSE the press, raising
// "Pick a segment, or skip the question." An enabled button that doesn't do the
// thing is worse than a disabled one, and the sentence only repeated the
// placeholder in red after you'd been rejected once. Both are gone: the button
// is disabled when there is nothing, enabled when there is something, and it
// always does what it says.
//
// ⚠️ Worth knowing what the enabled state buys on step 1: `answers.industry`
// does NOT filter. The directory's taxonomy is two levels, partners are tagged
// at the segment level, and `segments` is the whole constraint — see
// `stores/connect.js`. So continuing with an industry and no segment reaches
// the same unfiltered listing that Skip does. That's fine and intended; the
// answer is still recorded, and the results page's own segment filter is where
// someone narrows it. Don't "fix" this by requiring the segment.
const hasAnswer = computed(() => {
  if (step.value === 1) return Boolean(store.answers.industry)
  // ⚠️ BOTH halves. The geo question holds a region in `answers.region` and a
  // country in `filters.countries`, and either one on its own is a complete
  // answer — the India chip writes only the second. Checking `region` alone
  // disabled Continue for anyone whose inferred location seeded a country,
  // which is the default path for most visitors.
  if (step.value === 2) {
    return store.answers.region.length > 0 || store.filters.countries.length > 0
  }
  return Boolean(store.answers.implementation)
})

const goToResults = () => router.push('/connect/partners')

const next = () => {
  if (step.value === TOTAL) return goToResults()
  step.value += 1
}

const back = () => {
  if (step.value > 1) step.value -= 1
}

// Skip clears the answer for this step rather than leaving a stale one behind —
// otherwise skipping after going Back would silently keep the old choice.
const skip = () => {
  const key = { 1: 'industry', 2: 'region', 3: 'implementation' }[step.value]
  store.skip(key)
  if (step.value === TOTAL) return goToResults()
  step.value += 1
}

// Below-the-fold CTAs return to the quiz rather than jumping past it — the
// listing stays behind the questions no matter which path you take in.
const restartQuiz = () => {
  step.value = 1
  quizTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <ConnectShell>
    <!-- ── Hero: the qualifier ───────────────────────────────────────── -->
    <!-- The qualifier owns the first screen: 100vh minus the 3rem top bar, so
         the question and the map are the only things visible and everything
         below the fold has to be scrolled to deliberately. -->
    <section
      ref="quizTop"
      class="mx-auto grid w-full max-w-[1600px] gap-8 px-5 py-10 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-14 lg:px-10 lg:pb-8 lg:pt-4"
    >
      <!-- 460px is the narrowest column that keeps the headline on one line at
           its 18px size (it measures 410px) with room to spare. Centred, then
           biased upward by the bottom padding so the block sits above the
           optical middle rather than dead centre. -->
      <div class="flex min-w-0 flex-col justify-center lg:pb-24">
        <h1 class="text-2xl font-semibold text-ink-gray-9">
          Work with certified partners with vast expertise
        </h1>
        <p class="mt-2 max-w-md text-p-base leading-relaxed text-ink-gray-6">
          Frappe builds innovative products and our global network of partners help businesses
          implement them smoothly.
        </p>

        <!-- The gap between the intro and the question. Big enough to read as a
             break — the copy above is the pitch, this is the form — but it was
             36px, which on the short questions left the whole block floating in
             the middle of the column. -->
        <div class="relative mt-6">
          <Transition name="step" mode="out-in">
            <!-- Q1 — industry, with the one branching follow-up -->
            <fieldset v-if="step === 1" key="1" class="w-full">
              <div class="flex items-baseline justify-between gap-4">
                <legend class="text-p-base font-semibold text-ink-gray-9">
                  Which industry do you work in?
                </legend>
                <span class="shrink-0 text-p-sm tabular-nums text-ink-gray-5">
                  {{ step }} / {{ TOTAL }}
                </span>
              </div>

              <RadioGroup
                class="mt-1.5 -ml-3"
                :model-value="store.answers.industry ?? undefined"
                padded
                size="md"
                aria-label="Industry"
                @update:model-value="pickIndustry"
              >
                <!-- The branching follow-up opens directly under the row that
                     asked for it, as a sibling of the Radio rather than a child
                     — a Radio row is itself a `role="radio"` button, so nesting
                     an interactive control inside one would be invalid and the
                     click would toggle the radio. Indented to the label, not
                     fenced off with a rule. -->
                <template v-for="opt in INDUSTRIES" :key="opt.value">
                  <Radio :value="opt.value" :label="opt.label" />

                  <Transition name="branch">
                    <div
                      v-if="opt.segments && store.answers.industry === opt.value"
                      class="pb-1 pl-9 pt-1"
                    >
                      <!-- `w-full` is what widens this at all — frappe-ui's
                           Select trigger is `inline-flex`, so left alone it
                           shrink-wraps its content and any max-width only caps
                           it. Full width, no cap: it's the answer to the radio
                           it hangs off, and a control narrower than the option
                           above it read as a detail rather than a question. The
                           `pl-9` on the wrapper still holds its left edge under
                           the label, so "full" means the rest of the column. -->
                      <!-- "All segments" rather than "Pick a segment": with an
                           industry chosen, every one of its segments is already
                           in the filter, so an empty-looking control is not an
                           unanswered question — it's the widest answer. The old
                           placeholder read as a prompt for something still
                           required, which it isn't.

                           No partner count on the options — see the note on
                           `segmentOptions`. -->
                      <Select
                        :model-value="chosenSegment"
                        :options="segmentOptions"
                        placeholder="All segments"
                        size="md"
                        class="w-full"
                        @update:model-value="store.answer('segments', [$event])"
                      />
                    </div>
                  </Transition>
                </template>
              </RadioGroup>

              <div class="mt-5 flex items-center justify-between">
                <Button variant="solid" label="Continue" :disabled="!hasAnswer" @click="next" />
                <Button variant="ghost" label="Skip" @click="skip" />
              </div>
            </fieldset>

            <!-- Q2 — location. Pre-answered from inferred location.

                 ⚠️ Asked about the PARTNER, not about the visitor. It used to
                 read "Where is your company based?", which asked for a fact
                 about them and then quietly used it as a filter on somebody
                 else — and the answer to that question can only be one place,
                 while this control takes several. Reframed, the multi-answer
                 shape stops being odd: an implementation can be run from
                 anywhere, and what the visitor is actually deciding is how far
                 they're willing to look.

                 "can", not "should" or "would you like": this is a constraint
                 the visitor sets, and ticking three regions means all three are
                 acceptable rather than ranked. Their own region is pre-ticked
                 from inferred location, which under this framing is a sensible
                 default rather than a guess about them — see
                 `seedInferredGeo`. -->
            <fieldset v-else-if="step === 2" key="2" class="w-full">
              <div class="flex items-baseline justify-between gap-4">
                <legend class="text-p-base font-semibold text-ink-gray-9">
                  Where can your partner be based?
                </legend>
                <span class="shrink-0 text-p-sm tabular-nums text-ink-gray-5">
                  {{ step }} / {{ TOTAL }}
                </span>
              </div>

              <!-- mt-3 against the radio steps' mt-1.5: chips have no internal
                   top padding, so the larger margin lands on the same visual
                   gap below the question. -->
              <!-- India is a chip of its own here, and a COUNTRY rather than a
                   region — most visitors are in it, and asking them to find
                   themselves inside "Asia" is a worse question. The results
                   filter puts the same answer where it belongs taxonomically,
                   as the first country under Asia; `toggleGeo` is what lets one
                   chip row hold both granularities. See `GEO_CHOICES`. -->
              <div class="mt-3 flex flex-wrap gap-2">
                <FilterChip
                  v-for="c in GEO_CHOICES"
                  :key="c.region ?? c.country"
                  :label="c.label"
                  :count="c.count"
                  :selected="
                    c.country
                      ? store.filters.countries.includes(c.country)
                      : store.answers.region.includes(c.region)
                  "
                  @toggle="store.toggleGeo(c)"
                />
              </div>

              <div class="mt-5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Button variant="solid" label="Continue" :disabled="!hasAnswer" @click="next" />
                  <Button variant="subtle" label="Back" @click="back" />
                </div>
                <Button variant="ghost" label="Skip" @click="skip" />
              </div>
            </fieldset>

            <!-- Q3 — implementation shape. Decides packs vs. custom scoping. -->
            <fieldset v-else key="3" class="w-full">
              <div class="flex items-baseline justify-between gap-4">
                <legend class="text-p-base font-semibold text-ink-gray-9">
                  What kind of implementation are you looking for?
                </legend>
                <span class="shrink-0 text-p-sm tabular-nums text-ink-gray-5">
                  {{ step }} / {{ TOTAL }}
                </span>
              </div>

              <RadioGroup
                class="mt-1.5 -ml-3"
                :model-value="store.answers.implementation ?? undefined"
                padded
                size="md"
                aria-label="Implementation type"
                @update:model-value="store.answer('implementation', $event)"
              >
                <Radio
                  v-for="opt in IMPLEMENTATION_TYPES"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                />
              </RadioGroup>

              <div class="mt-5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Button
                    variant="solid"
                    label="Find partners"
                    :disabled="!hasAnswer"
                    @click="next"
                  />
                  <Button variant="subtle" label="Back" @click="back" />
                </div>
                <Button variant="ghost" label="Skip" @click="skip" />
              </div>
            </fieldset>
          </Transition>
        </div>
      </div>

      <!-- Map: a stable frame beside the changing question. Its hubs light up
           for whichever region is currently answered. -->
      <!-- Just the map. There used to be a row of labelled counts pinned to the
           bottom of this panel — "90 Asia, 32 Middle East, …" — and they were
           the same numbers the geo question's own chips carry a few hundred
           pixels to the left, on screen at the same time. One of the two had to
           go, and it wasn't the one attached to the control you answer with. -->
      <div class="flex min-w-0 flex-col justify-center rounded-7 bg-surface-gray-1 p-6 lg:p-8">
        <!-- The region answer is pre-seeded from inferred location before the
             quiz starts, so without this guard the map would emphasise Asia
             while you're still on question 1 — highlighting an answer nothing
             on screen has asked for yet. It holds until the region question is
             actually reached, then stays lit for the rest of the quiz. -->
        <DottedWorldMap
          :highlight="step >= 2 ? [...store.answers.region, ...store.filters.countries] : []"
          class="mx-auto w-full"
        />
      </div>
    </section>

    <!-- ── Starter packs ─────────────────────────────────────────────── -->
    <!-- Everything below the hero shares one 800px column, the same cap the
         results screen uses — so the reading width is constant from here to the
         partner list. Only the hero opts out (1600px), because the map needs
         the width and is the reason this screen is wide at all.
         No dividers between them either — vertical space does the separating.

         ⚠️ `id` is a link target, not decoration: the estimate modal's "What's
         in a starter pack?" links to `/connect#starter-packs`, and the router's
         `scrollBehavior` resolves the hash to this element. Renaming it breaks
         that link silently — the page still loads, just at the top. -->
    <section id="starter-packs" class="scroll-mt-8 px-5 py-12 lg:px-10">
      <div class="mx-auto w-full max-w-[800px]">
        <h2 class="text-p-lg font-semibold text-ink-gray-9">
          Starter packs are your fastest way to get started
        </h2>
        <p class="mt-1.5 max-w-2xl text-p-base text-ink-gray-6">
          Fixed scope, fixed price, delivered by any certified partner. Pick one now or let the
          questions above narrow it down for you. Prices for India, before
          {{ pricingFor(DEFAULT_REGION).tax }}.
        </p>

        <ScrollArea orientation="horizontal" class="mt-5 rounded-6 border border-outline-gray-2">
          <table class="w-full min-w-[640px] border-collapse text-p-base">
            <thead>
              <tr class="bg-surface-gray-1">
                <th
                  scope="col"
                  class="w-40 px-4 py-3 text-left text-p-sm font-medium uppercase tracking-wide text-ink-gray-5"
                >
                  <span class="sr-only">Attribute</span>
                </th>
                <th
                  v-for="pack in STARTER_PACKS"
                  :key="pack.value"
                  scope="col"
                  class="px-4 py-3 text-center text-p-sm font-medium uppercase tracking-wide text-ink-gray-6"
                >
                  {{ pack.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">
                  Modules
                </th>
                <td
                  v-for="p in STARTER_PACKS"
                  :key="p.value"
                  class="px-4 py-3.5 text-center text-ink-gray-8"
                >
                  {{ p.modules }}
                </td>
              </tr>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">
                  Total hours
                </th>
                <td
                  v-for="p in STARTER_PACKS"
                  :key="p.value"
                  class="px-4 py-3.5 text-center tabular-nums text-ink-gray-8"
                >
                  {{ p.hours }}
                </td>
              </tr>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">
                  Validity
                </th>
                <td
                  v-for="p in STARTER_PACKS"
                  :key="p.value"
                  class="px-4 py-3.5 text-center text-ink-gray-8"
                >
                  {{ p.validity }}
                </td>
              </tr>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">Cost</th>
                <td
                  v-for="p in STARTER_PACKS"
                  :key="p.value"
                  class="px-4 py-3.5 text-center font-medium tabular-nums text-ink-gray-9"
                >
                  {{ priceFor(p, DEFAULT_REGION) }}
                </td>
              </tr>
            </tbody>
          </table>
        </ScrollArea>

        <div class="mt-4">
          <Button variant="subtle" label="Explore partners" @click="restartQuiz" />
        </div>
      </div>
    </section>

    <!-- ── Success stories ───────────────────────────────────────────── -->
    <section class="px-5 py-12 lg:px-10">
      <div class="mx-auto w-full max-w-[800px]">
        <h2 class="text-p-lg font-semibold text-ink-gray-9">Success stories</h2>
        <ul class="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <li v-for="s in SUCCESS_STORIES" :key="s.id">
            <a href="#" class="group block">
              <div
                class="h-[132px] rounded-6 transition-opacity group-hover:opacity-90"
                :style="{ backgroundImage: `linear-gradient(135deg, ${s.art[0]}, ${s.art[1]})` }"
                role="img"
                :aria-label="`Cover image for: ${s.title}`"
              />
              <p class="mt-3 text-p-sm font-medium uppercase tracking-wide text-ink-gray-5">
                {{ s.tag }}
              </p>
              <p class="mt-1 text-p-base leading-snug text-ink-gray-8 group-hover:underline">
                {{ s.title }}
              </p>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <!-- ── Footer CTA — back into the quiz ───────────────────────────── -->
    <section class="bg-surface-gray-1 px-5 py-14 lg:px-10">
      <div class="mx-auto w-full max-w-[800px] text-center">
        <h2 class="text-xl font-semibold text-ink-gray-9">Ready to find your partner?</h2>
        <p class="mx-auto mt-2 max-w-md text-p-base text-ink-gray-6">
          Three questions, about thirty seconds. We'll narrow 156 certified partners down to the
          ones who've done your kind of project.
        </p>
        <div class="mt-5">
          <Button variant="solid" size="md" label="Find a partner" @click="restartQuiz" />
        </div>
      </div>
    </section>
  </ConnectShell>
</template>
