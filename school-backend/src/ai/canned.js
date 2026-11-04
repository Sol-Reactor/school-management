// Canned responses for demo accounts: built from the same real numbers, with no
// API call, so visitors can try the feature without spending API credits.

const fmt = (n) => (n == null ? 'n/a' : `${Math.round(n)}%`);

export const cannedProgressSummary = (s) => {
  const best = s.subjects[0];
  const weakest = s.subjects.at(-1);
  const att = s.attendance;
  const attNote =
    att.termRatePercent == null
      ? 'No attendance has been recorded yet.'
      : att.last14DaysPercent != null && att.previous14DaysPercent != null && att.last14DaysPercent + 5 < att.previous14DaysPercent
        ? `Attendance has slipped recently (${fmt(att.last14DaysPercent)} over the last two weeks, down from ${fmt(att.previous14DaysPercent)}), which is worth a gentle check-in.`
        : `Attendance is ${fmt(att.termRatePercent)} for the term, a solid base for learning.`;

  const subjectsNote =
    best && weakest && best.subject !== weakest.subject
      ? `${s.firstName} is strongest in ${best.subject} (average ${fmt(best.averagePercent)}), while ${weakest.subject} (${fmt(weakest.averagePercent)}) is the clearest area to build on.`
      : best
        ? `${s.firstName}'s results so far average ${fmt(best.averagePercent)} in ${best.subject}.`
        : `${s.firstName} has no graded work yet.`;

  const declining = s.subjects.find((x) => x.trend === 'declining');
  const suggestions = [
    weakest && `Set a short weekly practice routine for ${weakest.subject}, focusing on the topics from the most recent assessment.`,
    declining && declining.subject !== weakest?.subject
      ? `Review the last ${declining.subject} assessment together to see what changed since earlier in the term.`
      : best && `Keep the momentum in ${best.subject} with an extension task or a chance to explain the work to others.`,
    att.last14DaysPercent != null && att.last14DaysPercent < 90 && 'Check in about recent absences and agree a plan to catch up on missed lessons.',
  ].filter(Boolean);

  return `${subjectsNote} ${attNote} Overall, ${s.firstName}'s average across all assessments is ${fmt(s.overallAveragePercent)}.

Suggestions:
${suggestions.slice(0, 3).map((t) => `- ${t}`).join('\n')}`;
};

const listJoin = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

export const cannedRiskExplanation = ({ firstName, flags }) => {
  const labels = listJoin(flags.map((f) => f.label.toLowerCase()));
  const numbers = flags.map((f) => f.detail).join('; ');
  return `${firstName} was flagged for ${labels}. The numbers behind it: ${numbers}. A short, supportive check-in this week, and a note home if the pattern continues, would help understand what's going on.`;
};

/** Streams canned text in small chunks so the demo shows the same streaming UX. */
export const streamCanned = async (text, onText, { signal, delayMs = 18 } = {}) => {
  const chunks = text.match(/\S+\s*/g) ?? [text];
  for (const chunk of chunks) {
    if (signal?.aborted) return;
    onText(chunk);
    await new Promise((r) => setTimeout(r, delayMs));
  }
};
