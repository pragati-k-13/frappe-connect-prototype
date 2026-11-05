import { reactive } from 'vue'

// Which partners aren't taking new work. A partner sets it on their own Public
// profile; clients never see the setting, only its effect: the firm leaves
// every place a client finds partners (the directory, its suggestions,
// recommendations, a brief's recipients). Where a client already has the firm
// (a saved partner, a shared profile link) it stays, without Contact, since
// every conversation in Connect starts with the client reaching out.
//
// A reactive set rather than a field on `PARTNERS`, so the partner's switch
// and the client's lists read the same answer in one session of the demo.
const paused = reactive(new Set())

export const takingWork = (partner) => !paused.has(partner?.id)
export const setTakingWork = (id, on) => (on ? paused.delete(id) : paused.add(id))
