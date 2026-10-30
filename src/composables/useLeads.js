import { ref } from 'vue'
import { partnerThreads } from '../data/partnerView'

// The partner's leads, shared by the list and the lead page (and the rail's
// count), so a reply sent on the page shows on the list when you go back.
// One copy for the whole demo; it resets on reload like the rest of it.
//
// A lead is a Connect brief: its thread, stage, owner and probability. See
// `data/partnerView.js` for the seed.

const leads = ref(partnerThreads())

export const CLOSED = ['Won', 'Lost', 'Junk', 'Closed']
export const isClosed = (t) => CLOSED.includes(t.stage)
export const needsReply = (t) => !isClosed(t) && t.messages.at(-1)?.from === 'them'
export const theirLast = (t) => [...t.messages].reverse().find((m) => m.from === 'them')?.at ?? 0
export const lastAt = (t) => t.messages.at(-1)?.at ?? 0
// Who the other side is, as far as this partner knows. Until shortlisting the
// honest answer is nobody in particular.
export const companyName = (t) => t.company?.name ?? 'Anonymous company'
// The stage, with colour only where it says the lead is finished.
export const stageTheme = (stage) => ({ Won: 'green', Lost: 'red', Junk: 'gray', Closed: 'gray' })[stage] ?? 'blue'

export const useLeads = () => leads

// The list's rows in the order it last showed them, so previous and next on a
// lead page step to the row above and below rather than through the seed.
export const queue = ref([])
