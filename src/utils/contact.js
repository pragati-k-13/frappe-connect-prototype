import { useRouter } from 'vue-router'
import { useConnectStore } from '../stores/connect'
import { useAuthGate } from './auth'

// Contact, from every surface that shows a partner: the listing row, the
// profile header, the pricing cards, the estimate dialog. All four used to
// raise the same "not built yet" toast; the messages screen exists now, so they
// all do the same real thing instead.
//
// ⚠️ TWO GATES NOW, not one. It used to open the thread and navigate, full
// stop. What sits in front of that is the inquiry — see
// `ContactPartnerDialog`: a partner cannot be contacted without requirements
// to quote against, so Contact collects them (or picks the project that
// already holds them) and sends them with the message.
//
// ⚠️ Gated on the account first. A thread belongs to an account — a signed-out
// visitor has nowhere to put it and nowhere to come back to. `requireAccount`
// holds the action, sends them to sign-up carrying `?next=`, and runs it once
// they're back, so pressing Contact while signed out still ends in the
// conversation rather than back on the listing having to press it again.
//
// ⚠️ The held action outlives the component that armed it — the store's note on
// `pendingAction` is explicit that anything component-local is unsafe to hold.
// Both things this closure touches are app-level singletons (the Pinia store
// and the router), not component state, so it survives the unmount.
export function useContactPartner() {
  const store = useConnectStore()
  const router = useRouter()
  const { requireAccount } = useAuthGate()

  const openThread = (partnerId) => router.push({ name: 'messages', query: { thread: partnerId } })

  // The directory's Contact: a firm you are not working with yet.
  const contactPartner = (partner, prefill = null) =>
    requireAccount(() => {
      // ⚠️ ALREADY SENT — straight into the thread, no inquiry. A dialog here
      // would collect nothing that isn't in the conversation it is standing in
      // front of.
      //
      // ⚠️ The test is `requirementsSentTo`, NOT "does a thread exist". An open
      // conversation with no scope in it is precisely what this gate is for:
      // the `exploring` persona is seeded with four discovery threads, and
      // testing for the thread made the dialog unreachable on all four while
      // leaving those partners with the questions they were already asking.
      // See the getter.
      if (store.requirementsSentTo(partner.id)) return openThread(partner.id)
      store.openInquiry(partner.id, prefill)
    })

  // The project page's Message: the firm already building this project.
  //
  // ⚠️ NOT gated, and that is not an oversight. You are on a project's own page
  // with a partner assigned to it — the requirements are the thing the page is
  // about, and a pack has a published fixed scope rather
  // than requirements a partner estimates. Asking "which modules are you
  // interested in?" of someone whose implementation is at kickoff is the
  // product forgetting what it already knows.
  //
  // ⚠️ `openThread` here, which CREATES the thread if there isn't one. The
  // client persona is seeded with four projects and no conversations, so this
  // is the ordinary case rather than the edge.
  const messagePartner = (partner) => requireAccount(() => openThread(store.openThread(partner)))

  return { contactPartner, messagePartner }
}
