import axios from 'axios';
import { IProblem } from '../models/problem';
import { IProblemRepository } from '../repositories/IProblemRepository';
import { IProblemService } from './IProblemService';
import { generateBoilerplate } from '../utils/boilerplate';

export class ProblemService implements IProblemService {
  constructor(private repository: IProblemRepository) {}

  async getProblems(): Promise<IProblem[]> {
    return this.repository.findAll();
  }

  async getProblem(slug: string): Promise<IProblem> {
    const problem = await this.repository.findBySlug(slug);
    if (!problem) throw new Error('Problem not found');
    if (Object.keys(problem.boilerplates).length === 0) {
      problem.boilerplates = {
        javascript: generateBoilerplate(problem, 'javascript'),
        python: generateBoilerplate(problem, 'python')
      };
    }
    return problem;
  }

  async addProblem(problem: IProblem): Promise<IProblem> {
    return this.repository.create(problem);
  }

  async runCode(slug: string, code: string, language: string): Promise<any[]> {
    const problem = await this.repository.findBySlug(slug);
    if (!problem) throw new Error('Problem not found');

    const delayMs = 200;
    const results = [];

    for (const [index, tc] of problem.testcases.entries()) {
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      try {
        const inputObj = tc.input instanceof Map ? Object.fromEntries(tc.input) : tc.input;

        // Use stored type information to prepare inputs
        const inputValues = problem.variables.inputs.map(input => {
          const value = inputObj[input.name];
          switch (input.type) {
            case 'integer':
              return typeof value === 'string' ? parseInt(value) : value;
            case 'string':
              return value;
            case 'array':
              if (input.subtype === 'integer' && Array.isArray(value)) {
                return value.map(v => typeof v === 'string' ? parseInt(v) : v);
              }
              return value;
            default:
              return value;
          }
        });

        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
          language,
          version: language === 'javascript' ? '18.15.0' : '3.9.2',
          files: [{
            content: `${code}\nprocess.stdout.write(JSON.stringify(${problem.variables.output.name}(${inputValues.map(v => JSON.stringify(v)).join(', ')})));`
          }],
          stdin: '',
          args: [],
          compile_timeout: 10000,
          run_timeout: 3000
        });

        const output = response.data.run.stdout;
        let parsedOutput;
        try {
          parsedOutput = JSON.parse(output);
        } catch {
          parsedOutput = output.trim();
        }

        let expectedOutput = tc.output;
        switch (problem.variables.output.type) {
          case 'integer':
            expectedOutput = typeof tc.output === 'string' ? parseInt(tc.output) : tc.output;
            break;
          case 'string':
            expectedOutput = tc.output;
            break;
          case 'array':
            if (problem.variables.output.subtype === 'integer' && Array.isArray(tc.output)) {
              expectedOutput = tc.output.map(v => typeof v === 'string' ? parseInt(v) : v);
            }
            break;
          case 'boolean':
            expectedOutput = typeof tc.output === 'string' ? tc.output.toLowerCase() === 'true' : tc.output;
            break;
        }

        results.push({
          input: inputObj,
          expectedOutput: expectedOutput,
          actualOutput: parsedOutput,
          passed: parsedOutput === expectedOutput 
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          input: tc.input instanceof Map ? Object.fromEntries(tc.input) : tc.input,
          error: errorMessage
        });
      }
    }

    return results;
  }
}