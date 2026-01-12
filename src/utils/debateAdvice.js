export function buildDebateAdviceText(debateInsights) {
  if (!debateInsights) return '';

  // Human-in-the-loop gate: only use debate advice once approved.
  if (!debateInsights.approved) return '';

  const consensus = debateInsights?.consensus || debateInsights?.result?.consensus || null;
  if (!consensus) return '';

  const summary = (
    debateInsights.approvedText ||
    consensus.summary ||
    consensus.direction ||
    ''
  ).trim();
  if (!summary) return '';

  return [
    '---',
    'Design guidance (from multi-agent debate):',
    summary,
    '---'
  ].join('\n');
}
