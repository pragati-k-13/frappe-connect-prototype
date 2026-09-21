// One icon per pack fact, and ONE definition of that mapping — the same
// arrangement, and the same reason, as `scopeIcons.js`.
//
// The catalogue row, the pack page and the booking panel all print price,
// effort and validity. As three local maps they were three chances for the
// same fact to arrive under a different mark on the screen either side of it.
import IconPrice from '~icons/lucide/circle-dollar-sign'
import IconEffort from '~icons/lucide/hourglass'
import IconDelivery from '~icons/lucide/calendar'

export const FACT_ICONS = {
  price: IconPrice,
  effort: IconEffort,
  delivery: IconDelivery,
}
