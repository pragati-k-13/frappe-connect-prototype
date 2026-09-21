// How a pack is paid for.
//
// ⚠️ EVERYTHING HERE IS A MOCK, and it is the one part of the app where that
// matters beyond invented numbers: money. Nothing in this prototype talks to a
// payment processor, holds a merchant account or moves a rupee. The sheet these
// providers open is `PaymentSheetDialog`, which is ours, drawn to read like the
// handoff — it collects NO card, UPI or bank details and never should. Whatever
// replaces it is the provider's own hosted sheet, which is the entire reason
// the buyer's credentials never reach this application.
//
// ⚠️ NO BRAND MARKS. The design this came from prints Visa, Mastercard, RuPay
// and UPI logos down the right of each row. Those are trademarks belonging to
// the networks, and a hand-drawn approximation of a payment mark on a checkout
// is worse than no mark at all — it is the one screen where a slightly-wrong
// logo reads as a slightly-wrong merchant. The `networks` string says the same
// thing in words until the real assets are licensed and dropped in.

// The two processors, and what each one is for here. `label` is what the button
// and the sheet say, because the buyer is about to be handed to them by name.
export const PROVIDERS = {
  stripe: {
    value: 'stripe',
    label: 'Stripe',
    // What the sheet says while it pretends to work. Two beats, because a
    // processor that answered instantly would make the state unreviewable.
    blurb: 'Card payments outside India',
  },
  razorpay: {
    value: 'razorpay',
    label: 'Razorpay',
    blurb: 'UPI, RuPay and Indian cards',
  },
}

// ⚠️ The METHOD picks the provider, not the region. A buyer who chooses UPI is
// going to Razorpay whichever market they are in, and one who chooses a card is
// going to Stripe — which is what the two processors are actually for here.
// Region decides the PRICE (see `REGION_PRICING`), and these two facts are
// deliberately kept apart: a Gulf business paying by card and an Indian one
// paying by card meet the same sheet and different totals.
export const PAYMENT_METHODS = [
  {
    value: 'card',
    label: 'Card',
    // Named rather than drawn — see the warning above.
    networks: 'Visa, Mastercard, Amex',
    provider: 'stripe',
    icon: 'card',
  },
  {
    value: 'rupay',
    label: 'RuPay card',
    networks: 'RuPay',
    provider: 'razorpay',
    icon: 'card',
  },
  {
    value: 'upi',
    label: 'UPI',
    networks: 'Any UPI app',
    provider: 'razorpay',
    icon: 'phone',
    // The one method whose mechanics a buyer might not know, and the one the
    // design marks with an info icon. Kept factual: this is how UPI collect
    // requests work, not a claim about what this prototype does.
    hint: 'You approve the payment in your own UPI app. The request expires if nothing approves it.',
  },
]

export const methodBy = (value) => PAYMENT_METHODS.find((m) => m.value === value) ?? null

export const providerFor = (value) => PROVIDERS[methodBy(value)?.provider] ?? null

// ⚠️ There is no payment here and there is nothing to call. The delay exists so
// the processing state is reviewable — a sheet that resolved inside one frame
// can't be designed against. Same reasoning, and roughly the same duration, as
// `AUTH_MS` on the auth screens.
export const PAYMENT_MS = 1800

// The line under the pay button. It is a claim about the ARCHITECTURE rather
// than a reassurance: the provider hosts the sheet, so the details are entered
// on their page and this application never receives them. Keep it true of
// whatever ships — if a build ever collects a card number itself, this line
// comes out first.
export const PAYMENT_ASSURANCE =
  "Authorised on your bank's page. We never see your card or UPI details."
