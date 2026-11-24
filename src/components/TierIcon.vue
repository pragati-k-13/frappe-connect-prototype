<script setup>
import { computed, useId } from 'vue'
import { Badge, Tooltip } from 'frappe-ui'

// The partner tier seal, lifted from Frappe's own "Frappe Partner Badges" set
// (SVG/gold|silver|bronze.svg). All three badges carry an identical seal in
// their corner and differ only in fill, so the geometry below is shared and the
// colour is the only thing that varies. The fills are the artwork's own values.
//
// The full horizontal lockups live in `src/assets/tiers/` for anywhere the
// wordmark version is wanted. Those lockups crop the seal at the badge's top
// edge; the viewBox here is the seal's own bounds, so it renders whole.
//
// Gold is the promoted tier and renders as a labelled badge; silver and bronze
// render as the seal alone with a tooltip. That keeps the row scannable — a
// label on every partner would flatten the hierarchy the tiers exist to show.
const props = defineProps({
  // 'gold' | 'silver' | 'bronze', or null for a partner outside the programme.
  // Not required, and null renders nothing: there is no fourth tier to draw, so
  // an untiered partner's row simply carries no seal. 'beginner' renders
  // nothing too, on purpose: Frappe's badge set has no Beginner seal, and a
  // Beginner isn't listed anywhere a seal would show.
  tier: { type: String, default: null },
  // Every tier as a labelled badge, not only Gold: for the one place the tier
  // is the point (the Partnership header) rather than a mark in a row.
  labelled: { type: Boolean, default: false },
  size: { type: String, default: 'sm' },
  // With `xl`: the seal settles in, its check draws left to right, then a
  // metallic sheen crosses it once. For the approval moment only.
  celebrate: { type: Boolean, default: false },
})
const uid = useId()

const TIERS = {
  gold: { label: 'Gold Partner', name: 'Gold', theme: 'amber', fill: '#E79913' },
  silver: { label: 'Silver Partner', name: 'Silver', theme: 'gray', fill: '#7C7C7C' },
  bronze: { label: 'Bronze Partner', name: 'Bronze', theme: 'gray', fill: '#B86E47' },
}

// No fallback. An unknown tier used to render as bronze, which quietly turned a
// data error — or a partner with no tier at all — into a badge claiming a level
// they don't hold.
const spec = computed(() => TIERS[props.tier] ?? null)
// The seal alone: row-sized by default; `xl` for a moment where the tier is
// the whole message (the approval dialog), where its label sits beside it and
// a tooltip would only repeat it.
const sealClass = computed(() => (props.size === 'xl' ? 'size-14' : 'size-3.5'))
const asBadge = computed(() => Boolean(spec.value) && (props.labelled || props.tier === 'gold'))

// Traced from the badge set — do not hand-edit; re-lift from the SVGs instead.
const SCALLOP = 'M164.095 -9.8327C164.565 -10.351 165.38 -10.351 165.851 -9.8327L169.263 -6.07316C169.588 -5.71617 170.095 -5.59096 170.548 -5.75646L175.317 -7.49933C175.975 -7.73962 176.696 -7.36097 176.872 -6.68335L178.147 -1.76842C178.268 -1.3017 178.66 -0.954769 179.137 -0.890857L184.17 -0.217797C184.864 -0.125003 185.327 0.545561 185.168 1.22724L184.012 6.17162C183.903 6.64112 184.088 7.13031 184.482 7.40899L188.625 10.3438C189.196 10.7484 189.295 11.5573 188.837 12.0868L185.516 15.928C185.201 16.2927 185.138 16.8121 185.357 17.2417L187.662 21.7659C187.979 22.3897 187.69 23.1515 187.039 23.4077L182.313 25.2656C181.865 25.442 181.568 25.8726 181.562 26.3547L181.5 31.4319C181.492 32.1319 180.882 32.6722 180.186 32.5962L175.138 32.0453C174.659 31.993 174.196 32.2361 173.967 32.6603L171.553 37.1273C171.22 37.7432 170.429 37.9382 169.848 37.5476L165.634 34.714C165.234 34.4449 164.711 34.4449 164.311 34.714L160.098 37.5476C159.517 37.9382 158.726 37.7432 158.393 37.1273L155.979 32.6603C155.75 32.2361 155.286 31.993 154.807 32.0453L149.759 32.5962C149.064 32.6722 148.454 32.1319 148.445 31.4319L148.384 26.3547C148.378 25.8726 148.081 25.442 147.632 25.2656L142.906 23.4077C142.255 23.1515 141.966 22.3897 142.284 21.7659L144.589 17.2417C144.808 16.8121 144.745 16.2927 144.429 15.928L141.109 12.0868C140.651 11.5573 140.749 10.7484 141.32 10.3438L145.464 7.40899C145.857 7.13031 146.043 6.64112 145.933 6.17162L144.778 1.22724C144.618 0.54556 145.081 -0.125003 145.775 -0.217797L150.808 -0.890857C151.286 -0.954769 151.677 -1.3017 151.798 -1.76842L153.073 -6.68335C153.249 -7.36097 153.97 -7.73962 154.628 -7.49933L159.397 -5.75646C159.85 -5.59096 160.358 -5.71617 160.682 -6.07316L164.095 -9.8327Z'
const CHECK = 'M171.908 8.17383C172.432 7.56654 173.35 7.50017 173.957 8.02441C174.565 8.54906 174.632 9.46673 174.108 10.0742L163.337 22.5449C163.065 22.8606 162.669 23.0444 162.252 23.0488C161.835 23.053 161.436 22.8774 161.157 22.5674L156.055 16.8984C155.519 16.3019 155.566 15.3835 156.162 14.8467C156.759 14.3099 157.678 14.3581 158.215 14.9541L162.214 19.3975L171.908 8.17383Z'
</script>

<template>
  <Badge v-if="asBadge" :theme="spec.theme" variant="subtle" :size="size" :label="spec.name">
    <template #prefix>
      <svg viewBox="140.65 -10.52 48.64 48.64" class="size-full" aria-hidden="true">
        <path :d="SCALLOP" :fill="spec.fill" />
        <rect width="23.2542" height="23.2542" transform="translate(153.444 3.73389)" :fill="spec.fill" />
        <path :d="CHECK" fill="white" />
      </svg>
    </template>
  </Badge>

  <!-- `xl`: the seal on a soft halo of its own colour, so it carries the
       weight of the moment without growing past the dialog's scale. -->
  <span
    v-else-if="spec && size === 'xl'"
    class="grid size-24 shrink-0 place-items-center rounded-full"
    :style="{ backgroundColor: `color-mix(in srgb, ${spec.fill} 12%, transparent)` }"
  >
  <svg
    viewBox="140.65 -10.52 48.64 48.64"
    :class="[sealClass, 'shrink-0', celebrate && 'tier-seal--celebrate']"
    aria-hidden="true"
  >
    <defs v-if="celebrate">
      <clipPath :id="`${uid}-seal`"><path :d="SCALLOP" /></clipPath>
      <!-- The check's reveal: a rect that grows from the check's left edge. -->
      <clipPath :id="`${uid}-check`"><rect class="tier-seal-reveal" x="155" y="7" width="21" height="17" /></clipPath>
      <linearGradient :id="`${uid}-sheen`" x1="0" x2="1">
        <stop offset="0" stop-color="white" stop-opacity="0" />
        <stop offset="0.5" stop-color="white" stop-opacity="0.85" />
        <stop offset="1" stop-color="white" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path :d="SCALLOP" :fill="spec.fill" />
    <rect width="23.2542" height="23.2542" transform="translate(153.444 3.73389)" :fill="spec.fill" />
    <path :d="CHECK" fill="white" :clip-path="celebrate ? `url(#${uid}-check)` : undefined" />
    <g v-if="celebrate" :clip-path="`url(#${uid}-seal)`">
      <rect class="tier-seal-sheen" x="122" y="-12" width="20" height="52" :fill="`url(#${uid}-sheen)`" />
    </g>
  </svg>
  </span>
  <Tooltip v-else-if="spec" :text="spec.label">
    <svg
      viewBox="140.65 -10.52 48.64 48.64"
      :class="[sealClass, 'shrink-0']"
      role="img"
      :aria-label="spec.label"
    >
      <path :d="SCALLOP" :fill="spec.fill" />
      <rect width="23.2542" height="23.2542" transform="translate(153.444 3.73389)" :fill="spec.fill" />
      <path :d="CHECK" fill="white" />
    </svg>
  </Tooltip>
</template>

<style scoped>
/* The approval moment: seen once, so it may carry a little delight. Settle
   (420ms), then the check draws (360ms), then one bright sheen (900ms). Strong
   ease-out throughout; scale from 0.85, never 0. */
.tier-seal--celebrate {
  transform-origin: center;
  animation: tier-seal-settle 420ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
.tier-seal--celebrate .tier-seal-reveal {
  transform-box: fill-box;
  transform-origin: left center;
  animation: tier-seal-draw 360ms cubic-bezier(0.23, 1, 0.32, 1) 260ms both;
}
.tier-seal--celebrate .tier-seal-sheen {
  animation: tier-seal-sheen 900ms cubic-bezier(0.77, 0, 0.175, 1) 650ms both;
}
@keyframes tier-seal-settle {
  from {
    opacity: 0;
    transform: scale(0.85) rotate(-12deg);
  }
}
@keyframes tier-seal-draw {
  from {
    transform: scaleX(0);
  }
}
@keyframes tier-seal-sheen {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(72px);
  }
}
/* Reduced motion: the seal fades in whole, check drawn; no sheen. */
@media (prefers-reduced-motion: reduce) {
  .tier-seal--celebrate {
    animation: tier-seal-fade 200ms ease both;
  }
  .tier-seal--celebrate .tier-seal-reveal {
    animation: none;
  }
  .tier-seal--celebrate .tier-seal-sheen {
    animation: none;
    opacity: 0;
  }
}
@keyframes tier-seal-fade {
  from {
    opacity: 0;
  }
}
</style>
