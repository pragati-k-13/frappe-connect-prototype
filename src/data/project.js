// The implementation itself: the stages it moves through, and what it is called.
//
// ⚠️ INVENTED, and the only invented thing in the booking flow. The scope
// document describes what is delivered, not how the work is tracked, so these
// five stages are the prototype's own model. They are named after the beats the
// rest of the product already talks about — the introductory call, kickoff, and
// the Day 1 go-live the exclusions mention — rather than a generic funnel
// (Demo / Proposal / Won), which is what a CRM calls its own progress and says
// nothing to the business that bought a pack.
export const PROJECT_STAGES = [
  { key: 'confirmed', label: 'Confirmed', theme: 'blue' },
  { key: 'intro-call', label: 'Intro call', theme: 'blue' },
  { key: 'kickoff', label: 'Kickoff', theme: 'orange' },
  { key: 'implementation', label: 'Implementation', theme: 'orange' },
  { key: 'live', label: 'Live', theme: 'green' },
]

// Falls back to the first stage rather than to nothing: a project always has a
// stage, and an unknown key is a bug in the caller, not a state to render.
export const stageOf = (key) => PROJECT_STAGES.find((s) => s.key === key) ?? PROJECT_STAGES[0]

// What the project is called wherever it is listed. The pack names the work and
// the company names whose it is; without a company (a demo viewer who never
// filled in onboarding) the pack alone still reads as a project.
export const projectName = (pack, company) =>
  company ? `${pack.name} implementation for ${company}` : `${pack.name} implementation`
