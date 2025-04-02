// Execute\server\src\services\problemService.ts
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
  
    const results = await Promise.all(problem.testcases.map(async (tc) => {
      try {
        // Convert Map to plain object if needed
        const inputObj = tc.input instanceof Map ? Object.fromEntries(tc.input) : tc.input;
        
        // Prepare input values in the correct order
        const inputValues = problem.variables.inputs.map(input => {
          return inputObj[input.name];
        });
  
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
          language,
          version: language === 'javascript' ? '18.15.0' : '3.9.2',
          files: [{
            content: language === 'javascript' 
              ? `${code}\nprocess.stdout.write(JSON.stringify(${problem.variables.output.name}(${inputValues.map(v => JSON.stringify(v)).join(', ')})));`
              : `${code}\nprint(${problem.variables.output.name}(${inputValues.map(v => JSON.stringify(v)).join(', ')}))`
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
  
        // Convert both outputs to string for comparison to handle number/string cases
        return {
          input: inputObj,
          expectedOutput: tc.output,
          actualOutput: parsedOutput,
          passed: JSON.stringify(parsedOutput) === JSON.stringify(tc.output)
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          input: tc.input instanceof Map ? Object.fromEntries(tc.input) : tc.input,
          error: errorMessage
        };
      }
    }));
  
    return results;
  }
}