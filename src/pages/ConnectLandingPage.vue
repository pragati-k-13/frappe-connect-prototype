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
import { INDUSTRIES, REGIONS, IMPLEMENTATION_TYPES, MAP_REGIONS } from '../data/quiz'
import { STARTER_PACKS, SUCCESS_STORIES } from '../data/partners'

const store = useConnectStore()
const router = useRouter()

const TOTAL = 3
const step = ref(1)
const quizTop = ref(null)
// Set when Continue is pressed with a required branch field still empty.
const branchError = ref(false)

// Region is pre-answered from "where we think you are" so this question costs a
// confirmation instead of a decision. The hint under the chips says so —
// a silently pre-filled answer would be the dishonest version of this.
onMounted(() => store.seedInferredRegion())

const selectedIndustry = computed(() => INDUSTRIES.find((i) => i.value === store.answers.industry))
// All four groups branch — every one has real segments in the directory's
// taxonomy. The branch is required once it's open.
//
// The quiz asks for one segment; the store holds an array, because the results
// filter merges industry and segment into a single multi-select and can widen
// this to several. `[$event]` below is that one answer in the shared shape.
const needsSegment = computed(() => Boolean(selectedIndustry.value?.segments))
const segmentOptions = computed(() =>
  (selectedIndustry.value?.segments ?? []).map((s) => ({ label: s, value: s })),
)

const pickIndustry = (value) => {
  store.answer('industry', value)
  branchError.value = false
}

const canContinue = computed(() => {
  if (step.value === 1) return !needsSegment.value || store.answers.segments.length > 0
  return true
})

const goToResults = () => router.push('/connect/partners')

const next = () => {
  if (step.value === 1 && !canContinue.value) {
    branchError.value = true
    return
  }
  if (step.value === TOTAL) return goToResults()
  step.value += 1
}

const back = () => {
  branchError.value = false
  if (step.value > 1) step.value -= 1
}

// Skip clears the answer for this step rather than leaving a stale one behind —
// otherwise skipping after going Back would silently keep the old choice.
const skip = () => {
  const key = { 1: 'industry', 2: 'region', 3: 'implementation' }[step.value]
  store.skip(key)
  branchError.value = false
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
                <span class="shrink-0 text-p-sm tabular-nums text-ink-gray-5">{{ step }} / {{ TOTAL }}</span>
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
                      <Select
                        :model-value="store.answers.segments[0] ?? undefined"
                        :options="segmentOptions"
                        required
                        placeholder="Pick a segment"
                        size="md"
                        class="w-full"
                        :error="branchError ? 'Pick a segment, or skip the question.' : undefined"
                        @update:model-value="store.answer('segments', [$event]); branchError = false"
                      />
                    </div>
                  </Transition>
                </template>
              </RadioGroup>

              <div class="mt-5 flex items-center justify-between">
                <Button variant="solid" label="Continue" @click="next" />
<Button variant="ghost" label="Skip" @click="skip" />
              </div>
            </fieldset>

            <!-- Q2 — region. Pre-answered from inferred location. -->
            <fieldset v-else-if="step === 2" key="2" class="w-full">
              <div class="flex items-baseline justify-between gap-4">
                <legend class="text-p-base font-semibold text-ink-gray-9">
                  Where is your company based?
                </legend>
                <span class="shrink-0 text-p-sm tabular-nums text-ink-gray-5">{{ step }} / {{ TOTAL }}</span>
              </div>

              <!-- mt-3 against the radio steps' mt-1.5: chips have no internal
                   top padding, so the larger margin lands on the same visual
                   gap below the question. -->
              <div class="mt-3 flex flex-wrap gap-2">
                <FilterChip
                  v-for="r in REGIONS"
                  :key="r.value"
                  :label="r.label"
                  :count="r.count"
                  :selected="store.answers.region.includes(r.value)"
                  @toggle="store.toggleRegion(r.value)"
                />
              </div>

              <div class="mt-5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Button variant="solid" label="Continue" @click="next" />
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
                <span class="shrink-0 text-p-sm tabular-nums text-ink-gray-5">{{ step }} / {{ TOTAL }}</span>
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
                  <Button variant="solid" label="Find partners" @click="next" />
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
      <div class="fc-map-panel flex min-w-0 flex-col rounded-7 bg-surface-gray-1 p-6 lg:p-8">
        <!-- Map centred in whatever height the panel gets, counts pinned to the
             bottom — so a tall panel reads as composed rather than padded. -->
        <!-- The region answer is pre-seeded from inferred location before the
             quiz starts, so without this guard the map would emphasise India
             while you're still on question 1 — highlighting an answer nothing
             on screen has asked for yet. It holds until the region question is
             actually reached, then stays lit for the rest of the quiz. -->
        <div class="flex flex-1 items-center">
          <DottedWorldMap
            :highlight="step >= 2 ? store.answers.region : []"
            class="mx-auto w-full"
          />
        </div>
        <!-- Grouped, not spread across the panel: `justify-between` made these
             read as six separate facts rather than one — the network's size,
             which is the only claim they make.
             The column gap comes from a container query on the panel, not a
             viewport breakpoint — see `.fc-stats` in index.css. What decides
             whether six fit on one line is how wide this panel is, and the
             panel is at its narrowest exactly where the viewport is widest
             enough to go two-column. -->
        <dl class="fc-stats mx-auto mt-8">
          <!-- Left, not centred. The label is the wider line in every pair, so
               centring hangs each number in the middle of its own label and the
               row loses the shared baseline down its left edge. -->
          <div v-for="r in MAP_REGIONS" :key="r.label" class="text-left">
            <dt class="sr-only">{{ r.label }}</dt>
            <dd class="text-xl font-medium tabular-nums text-ink-gray-9">{{ r.count }}</dd>
            <dd class="mt-0.5 text-p-sm text-ink-gray-6">{{ r.label }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- ── Starter packs ─────────────────────────────────────────────── -->
    <!-- Everything below the hero shares one 800px column, the same cap the
         results screen uses — so the reading width is constant from here to the
         partner list. Only the hero opts out (1600px), because the map needs
         the width and is the reason this screen is wide at all.
         No dividers between them either — vertical space does the separating. -->
    <section class="px-5 py-12 lg:px-10">
      <div class="mx-auto w-full max-w-[800px]">
        <h2 class="text-p-lg font-semibold text-ink-gray-9">
          Starter packs are your fastest way to get started
        </h2>
        <p class="mt-1.5 max-w-2xl text-p-base text-ink-gray-6">
          Fixed scope, fixed price, delivered by any certified partner. Pick one now or let the
          questions above narrow it down for you.
        </p>

        <ScrollArea
          orientation="horizontal"
          class="mt-5 rounded-6 border border-outline-gray-2"
        >
          <table class="w-full min-w-[640px] border-collapse text-p-base">
            <thead>
              <tr class="bg-surface-gray-1">
                <th scope="col" class="w-40 px-4 py-3 text-left text-p-sm font-medium uppercase tracking-wide text-ink-gray-5">
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
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">Modules</th>
                <td v-for="p in STARTER_PACKS" :key="p.value" class="px-4 py-3.5 text-center text-ink-gray-8">
                  {{ p.modules }}
                </td>
              </tr>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">Total hours</th>
                <td v-for="p in STARTER_PACKS" :key="p.value" class="px-4 py-3.5 text-center tabular-nums text-ink-gray-8">
                  {{ p.hours }}
                </td>
              </tr>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">Validity</th>
                <td v-for="p in STARTER_PACKS" :key="p.value" class="px-4 py-3.5 text-center text-ink-gray-8">
                  {{ p.validity }}
                </td>
              </tr>
              <tr class="border-t border-outline-gray-2">
                <th scope="row" class="px-4 py-3.5 text-left font-normal text-ink-gray-7">Cost</th>
                <td v-for="p in STARTER_PACKS" :key="p.value" class="px-4 py-3.5 text-center font-medium tabular-nums text-ink-gray-9">
                  {{ p.cost }}
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
              <p class="mt-3 text-p-sm font-medium uppercase tracking-wide text-ink-gray-5">{{ s.tag }}</p>
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
          Three questions, about thirty seconds. We'll narrow 156 certified partners down to the ones
          who've done your kind of project.
        </p>
        <div class="mt-5">
          <Button variant="solid" size="md" label="Find a partner" @click="restartQuiz" />
        </div>
      </div>
    </section>
  </ConnectShell>
</template>
