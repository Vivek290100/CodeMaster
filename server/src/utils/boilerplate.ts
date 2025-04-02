import { IProblem } from '../models/problem';

export function generateBoilerplate(problem: IProblem, language: string): string {
  const inputs = problem.variables.inputs.map(i => i.name).join(', ');
  const funcName = problem.slug.replace(/-/g, '_');

  switch (language) {
    case 'javascript':
      return `function ${funcName}(${inputs}) {\n    // Your code here\n}`;
    case 'python':
      return `def ${funcName}(${inputs}):\n    # Your code here`;
    default:
      return '';
  }
}