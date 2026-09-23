// How a pack is paid for.
//
// ⚠️ EVERYTHING HERE IS A MOCK, and it is the one part of the app where that
// matters beyond invented numbers: money. Nothing in this prototype talks to a
// payment processor, holds a merchant account or moves a rupee. The page this
// opens is `StripeCheckoutPage`, which is ours, drawn to read like Stripe's own
// hosted page — it collects NO card, UPI or bank details and never should.
// Whatever replaces it is Stripe's hosted Checkout, which is the entire reason
// the buyer's credentials never reach this application.
//
// ⚠️ NO BRAND MARKS. The design this came from prints Visa, Mastercard, RuPay
// and UPI logos down the right of each row. Those are trademarks belonging to
// the networks, and a hand-drawn approximation of a payment mark on a checkout
// is worse than no mark at all — it is the one screen where a slightly-wrong
// logo reads as a slightly-wrong merchant. The `networks` string says the same
// thing in words until the real assets are licensed and dropped in.

// ⚠️ ONE PROCESSOR. This carried Stripe and Razorpay, split by method — cards
// to Stripe, UPI and RuPay to Razorpay — on the reasoning that UPI is an Indian
// rail and Razorpay is the Indian gateway. Stripe settles UPI itself, so the
// second processor bought nothing but a second integration and a second
// merchant account, and the buyer met a name that changed depending on which
// button they pressed. `provider` is gone from the methods with it: every
// method goes to the same place, and a field that always holds one value is a
// choice nobody is making.
export const PROVIDER = {
  value: 'stripe',
  label: 'Stripe',
  // What the page says while it pretends to work. Two beats, because a
  // processor that answered instantly would make the state unreviewable.
  blurb: 'Cards and UPI',
}

// ⚠️ THE METHOD DOES NOT PICK A PROCESSOR any more — it picks the rail Stripe
// settles on, which is a fact about the buyer's bank rather than about us.
// Region decides the PRICE (see `REGION_PRICING`) and these two facts stay
// apart: a Gulf business paying by card and an Indian one paying by card meet
// the same page and different totals.
//
// ⚠️ RuPay is a card network, not a method. It sat here as a third row only
// because it routed to the other processor; with one processor it is one of the
// networks named on the card row, which is what it always was.
export const PAYMENT_METHODS = [
  {
    value: 'card',
    label: 'Card',
    // Named rather than drawn — see the warning above.
    networks: 'Visa, Mastercard, RuPay, Amex',
    icon: 'card',
  },
  {
    value: 'upi',
    label: 'UPI',
    networks: 'Any UPI app',
    icon: 'phone',
    // The one method whose mechanics a buyer might not know, and the one the
    // design marks with an info icon. Kept factual: this is how UPI collect
    // requests work, not a claim about what this prototype does.
    hint: 'You approve the payment in your own UPI app. The request expires if nothing approves it.',
  },
]

export const methodBy = (value) => PAYMENT_METHODS.find((m) => m.value === value) ?? null

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
