// Shared by the two auth screens, so the sign-up and log-in forms can't drift
// into disagreeing about what a valid email is — which is the failure you get
// the moment the same check is written out twice.

// ⚠️ Deliberately loose. The only thing worth rejecting on the client is a
// typo the person can see for themselves: no @, nothing before it, nothing
// after it, no dot in the domain. Everything past that (does the domain
// resolve, does the mailbox exist) is the verification email's job, and a
// stricter pattern here only ever rejects addresses that are actually fine.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmail = (value) => EMAIL.test(value.trim())

// ⚠️ There is no auth here and there is nothing to call. The delay exists so
// the pending state is reviewable — a button that swaps to "Creating account"
// and back inside one frame can't be designed against. Same reasoning, and the
// same duration, as `LoginDialog`. A real build replaces the timer with the
// round trip and keeps everything else.
export const AUTH_MS = 1400
