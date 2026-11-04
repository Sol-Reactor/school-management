// Prompt template for explaining an at-risk flag.
//
// The flag itself is computed with plain SQL/Prisma rules (src/ai/riskFlags.js).
// The model is only asked to explain the numbers in plain language. It never
// decides whether a student is flagged.

export const RISK_EXPLANATION_VERSION = 'risk-explanation@1';

export const riskExplanationSystem = `You explain early-warning flags in a school management app called Haya to teachers and administrators.

A rule-based system has already flagged this student; you are given the exact rules that fired and the numbers behind them.
Your job is only to explain those numbers in plain language. You do not decide whether the flag is right.

- Two or three sentences, under 70 words.
- Say what changed and by how much, using the figures provided.
- End with one gentle, practical next step (for example a check-in conversation or contacting home).
- First name only. Do not speculate about causes, health, family or behaviour.
- No headings, lists, emoji or markdown.`;

export const riskExplanationUser = ({ firstName, classLevel, flags }) => `Student: ${firstName} (${classLevel ?? 'no class'})
Rules that fired:
${flags.map((f) => `- ${f.label}: ${f.detail}`).join('\n')}

Explain these flags.`;
