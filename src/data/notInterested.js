// The reasons a business can give when it isn't taking a partner's work
// forward. `label` is the chip in `NotInterestedDialog`; `short` is how it
// reads in the status line both sides see. Each has to be fair to say to the
// partner directly.
export const NOT_INTERESTED_REASONS = [
  { value: 'budget', label: 'Over our budget', short: 'over budget' },
  { value: 'timeline', label: "Timeline doesn't work", short: "timeline doesn't work" },
  { value: 'other-partner', label: 'Went with another partner', short: 'went with another partner' },
  { value: 'fit', label: 'Not the right fit', short: 'not the right fit' },
  { value: 'on-hold', label: 'Project on hold', short: 'project on hold' },
]

// "over budget, timeline doesn't work" — in the chips' order. Empty when none
// were picked, and the line then ends at "isn't taking this forward".
export const reasonsLine = (values = []) =>
  NOT_INTERESTED_REASONS.filter((r) => values.includes(r.value))
    .map((r) => r.short)
    .join(', ')
