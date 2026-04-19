import axe, { AxeResults, RunOptions, Spec } from 'axe-core';

export const MC_AXE_CONFIG: Spec = {
  reporter: 'v2'
};

export const MC_AXE_RUN_OPTIONS: RunOptions = {
  resultTypes: ['violations'],
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
};

export async function runAxe(target: Element | Document = document): Promise<AxeResults> {
  axe.configure(MC_AXE_CONFIG);
  return axe.run(target as Element, MC_AXE_RUN_OPTIONS);
}

export function formatAxeViolations(results: AxeResults): string {
  if (!results.violations.length) return 'No axe violations';
  return results.violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `  - ${n.target.join(' ')}\n    ${n.failureSummary ?? ''}`).join('\n');
      return `[${v.impact ?? 'issue'}] ${v.id}: ${v.help} (${v.helpUrl})\n${nodes}`;
    })
    .join('\n\n');
}

export function expectNoAxeViolations(results: AxeResults): void {
  if (results.violations.length) {
    const message = formatAxeViolations(results);
    throw new Error(`axe-core found ${results.violations.length} violation(s):\n\n${message}`);
  }
}
