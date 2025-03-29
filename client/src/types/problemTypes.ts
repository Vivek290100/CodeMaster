export type VariableType = 'integer' | 'float' | 'string' | 'boolean' | 'object';
export type OutputType = VariableType | `${VariableType}[]` | `${VariableType}[][]`;

export interface InputVariable {
  name: string;
  type: VariableType;
  isArray: boolean;
}

export interface TestCase {
  inputs: { [key: string]: string };
  expectedOutput: string;
  isSample: boolean;
}

export interface Boilerplate {
  language: string;
  version: string;
  code: string;
}

export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  inputVariables: InputVariable[];
  testCases: TestCase[];
  supportedLanguages: string[];
  boilerplates: Boilerplate[];
  timeLimit?: number;
  memoryLimit?: number;
  outputType: OutputType;
}

export interface ExecutionResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  stderr: string;
  isSample: boolean;
  executionTime?: number;
  errorType?: 'syntax' | 'runtime' | 'timeout' | 'type' | 'memory';
}