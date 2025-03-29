// server/src/services/problemService.ts
import axios from 'axios';
import { IBaseRepository } from '../types/repositoryTypes';
import { IProblemDocument, IInputVariable, ExecutionResult, ITestCase, OutputType, VariableType } from '../types/problemTypes';

interface PistonResponse {
  run: {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
    output: string;
  };
}

export class ProblemService {
  private problemRepository: IBaseRepository<IProblemDocument>;
  private readonly PISTON_API_URL = 'https://emkc.org/api/v2/piston';
  private readonly RATE_LIMIT_DELAY = 250;

  constructor(problemRepository: IBaseRepository<IProblemDocument>) {
    this.problemRepository = problemRepository;
  }

  async addProblem(problemData: Partial<IProblemDocument>): Promise<IProblemDocument> {
    const updatedData = { ...problemData };
    if (updatedData.inputVariables && updatedData.boilerplates) {
      updatedData.boilerplates = updatedData.boilerplates.map((boilerplate) => ({
        ...boilerplate,
        code: this.generateBoilerplate(
          boilerplate.language,
          updatedData.inputVariables || [],
          boilerplate.version,
          updatedData.outputType || 'string'
        ),
      }));
    }
    return this.problemRepository.create(updatedData);
  }

  async getProblem(id: string): Promise<IProblemDocument | null> {
    return this.problemRepository.findById(id);
  }

  async getAllProblems(): Promise<IProblemDocument[]> {
    return this.problemRepository.findAll();
  }

  async executeCode(
    problemId: string,
    language: string,
    version: string,
    code: string
  ): Promise<{ results: ExecutionResult[]; allPassed: boolean }> {
    const problem = await this.getProblem(problemId);
    if (!problem) throw new Error('Problem not found');

    const results: ExecutionResult[] = [];
    let allPassed = true;

    for (const [index, testCase] of problem.testCases.entries()) {
      const startTime = Date.now();
      const result = await this.executeTestCase(
        problem,
        language,
        version,
        code,
        testCase
      );
      const executionTime = Date.now() - startTime;

      const expected = problem.outputType.includes('[]') 
        ? testCase.expectedOutput.split(',').map(v => v.trim()).join(',')
        : testCase.expectedOutput;
      const actual = problem.outputType.includes('[]') 
        ? result.actualOutput.split(',').map(v => v.trim()).join(',')
        : result.actualOutput;

      const passed = actual === expected && !result.stderr;

      results.push({
        ...result,
        executionTime,
        passed,
      });

      if (!passed) allPassed = false;

      if (index < problem.testCases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
      }
    }

    return { results, allPassed };
  }

  private async executeTestCase(
    problem: IProblemDocument,
    language: string,
    version: string,
    code: string,
    testCase: ITestCase
  ): Promise<Omit<ExecutionResult, 'passed' | 'executionTime'>> {
    const inputsMap = new Map(Object.entries(testCase.inputs || {}));
    const inputValues = problem.inputVariables.map((variable) =>
      inputsMap.get(variable.name) || ''
    );
    const stdin = inputValues.join('\n');

    try {
      const response = await axios.post<PistonResponse>(
        `${this.PISTON_API_URL}/execute`,
        {
          language,
          version,
          files: [{ content: code }],
          stdin,
          run_timeout: problem.timeLimit || 3000,
          compile_timeout: 10000,
        },
        { timeout: 15000 }
      );

      const { run, compile } = response.data;

      if (compile?.stderr) {
        return {
          input: JSON.stringify(testCase),
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          stderr: compile.stderr,
          isSample: testCase.isSample,
        };
      }

      return {
        input: JSON.stringify(testCase),
        expectedOutput: testCase.expectedOutput,
        actualOutput: run.stdout.trim(),
        stderr: run.stderr || (run.code !== 0 ? `Exit code ${run.code}` : ''),
        isSample: testCase.isSample,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          input: JSON.stringify(testCase),
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          stderr: error.message,
          isSample: testCase.isSample,
        };
      }
      throw error;
    }
  }

  private validateOutputType(output: string, expectedType: OutputType): string | null {
    if (!output) return 'No output produced';
    
    try {
      if (expectedType.includes('[]')) {
        const values = output.split(',').map(v => v.trim());
        const baseType = expectedType.replace('[]', '') as VariableType;
        for (const value of values) {
          switch (baseType) {
            case 'integer': if (!/^-?\d+$/.test(value)) return `Expected integer, got ${value}`; break;
            case 'float': if (!/^-?\d*\.?\d+$/.test(value)) return `Expected float, got ${value}`; break;
            case 'boolean': if (!/^(true|false)$/.test(value.toLowerCase())) return `Expected boolean, got ${value}`; break;
            case 'string': break;
            case 'object': return 'Object arrays not supported in this format';
          }
        }
      } else {
        switch (expectedType) {
          case 'integer': if (!/^-?\d+$/.test(output)) return `Expected integer, got ${output}`; break;
          case 'float': if (!/^-?\d*\.?\d+$/.test(output)) return `Expected float, got ${output}`; break;
          case 'boolean': if (!/^(true|false)$/.test(output.toLowerCase())) return `Expected boolean, got ${output}`; break;
          case 'string': break;
          case 'object': return 'Objects not supported in this format';
        }
      }
      return null;
    } catch (e) {
      return `Invalid output format: ${(e as Error).message}`;
    }
  }

  private generateBoilerplate(
    language: string,
    inputVariables: IInputVariable[],
    version: string,
    outputType: OutputType
  ): string {
    const params = inputVariables.map((v) => v.name).join(', ');
    
    switch (language) {
      case 'javascript':
        return `function solution(${params}) {
  // Write your solution here
  return ${this.getDefaultReturnValue('javascript', outputType)};
}

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const lines = [];
rl.on('line', (line) => {
  lines.push(line);
}).on('close', () => {
  const args = lines.map((line, i) => {
    const { type, isArray } = ${JSON.stringify(inputVariables)}[i] || {};
    if (!type) return line;
    if (isArray) return line.split(',').map(x => parseValue(x.trim(), type));
    return parseValue(line, type);
  });
  const result = solution(...args.slice(0, ${inputVariables.length}));
  console.log(${outputType.includes('[]') ? 'result.join(",")' : 'result'});
});

function parseValue(value, type) {
  switch (type) {
    case 'integer': return parseInt(value) || 0;
    case 'float': return parseFloat(value) || 0;
    case 'boolean': return value.toLowerCase() === 'true';
    case 'string': return value;
    default: return value;
  }
}`;
      case 'python':
        return `def solution(${params}):
    # Write your solution here
    return ${this.getDefaultReturnValue('python', outputType)}

import sys
lines = sys.stdin.read().strip().split('\\n')
args = [${inputVariables.map((v, i) => 
  v.isArray ? 
    `[parse_value(x, '${v.type}') for x in lines[${i}].split(',')]` : 
    `parse_value(lines[${i}], '${v.type}')`
).join(', ')}]
result = solution(*args[:${inputVariables.length}])
print(${outputType.includes('[]') ? '",".join(map(str, result))' : 'result'})

def parse_value(value, type):
    if type == 'integer': return int(value)
    if type == 'float': return float(value)
    if type == 'boolean': return value.lower() == 'true'
    if type == 'string': return value
    return value`;
      case 'cpp':
        return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

${outputType.includes('[]') ? `vector<${this.mapTypeToCpp(outputType.replace('[]', ''))}>` : this.mapTypeToCpp(outputType)} solution(${inputVariables.map(v => 
  v.isArray ? `vector<${this.mapTypeToCpp(v.type)}> ${v.name}` : `${this.mapTypeToCpp(v.type)} ${v.name}`
).join(', ')}) {
    // Write your solution here
    return ${this.getDefaultReturnValue('cpp', outputType)};
}

int main() {
    vector<string> inputs;
    string line;
    while (getline(cin, line)) if (!line.empty()) inputs.push_back(line);
    
    ${inputVariables.map((v, i) => 
      v.isArray ? 
        `vector<${this.mapTypeToCpp(v.type)}> ${v.name};\n` +
        `if (${i} < inputs.size()) {\n` +
        `  stringstream ss(inputs[${i}]);\n` +
        `  string x;\n` +
        `  while (getline(ss, x, ',')) ${v.name}.push_back(${v.type === 'string' ? 'x' : `parseValue(x, "${v.type}")`});\n` +
        `}` : 
        `${this.mapTypeToCpp(v.type)} ${v.name} = ${i} < inputs.size() ? ${v.type === 'string' ? 'inputs[i]' : `parseValue(inputs[${i}], "${v.type}")`} : ${this.getDefaultReturnValue('cpp', v.type)};`
    ).join('\n')}
    
    auto result = solution(${inputVariables.map(v => v.name).join(', ')});
    ${outputType.includes('[]') ? 
      `for (size_t i = 0; i < result.size(); ++i) {
        cout << result[i] << (i < result.size() - 1 ? "," : "");
      }` : 
      `cout << result;`
    }
    cout << endl;
    return 0;
}

${this.mapTypeToCpp(outputType)} parseValue(const string& value, const string& type) {
    stringstream ss(value);
    if (type == "integer") { int v; ss >> v; return v; }
    if (type == "float") { float v; ss >> v; return v; }
    if (type == "boolean") { return value == "true"; }
    if (type == "string") { return value; }
    return {};
}`;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private mapTypeToCpp(type: string): string {
    switch (type) {
      case 'integer': return 'int';
      case 'float': return 'float';
      case 'string': return 'string';
      case 'boolean': return 'bool';
      default: return 'string';
    }
  }

  private getDefaultReturnValue(language: string, outputType: OutputType): string {
    switch (language) {
      case 'javascript':
      case 'python':
        if (outputType.includes('[]')) return '[]';
        switch (outputType) {
          case 'integer': return '0';
          case 'float': return '0.0';
          case 'string': return '""';
          case 'boolean': return 'false';
          default: return 'null';
        }
      case 'cpp':
        if (outputType.includes('[]')) return `vector<${this.mapTypeToCpp(outputType.replace('[]', ''))}>()`;
        switch (outputType) {
          case 'integer': return '0';
          case 'float': return '0.0f';
          case 'string': return '""';
          case 'boolean': return 'false';
          default: return '""';
        }
      default:
        return '';
    }
  }
}