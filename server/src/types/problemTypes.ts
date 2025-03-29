// server/src/types/problemTypes.ts
import { Document } from 'mongoose';

export type VariableType = 'integer' | 'float' | 'string' | 'boolean' | 'object';
export type OutputType = VariableType | `${VariableType}[]` | `${VariableType}[][]`;

export interface IInputVariable {
  name: string;
  type: VariableType;
  isArray: boolean;
}

export interface ITestCase {
  inputs: { [key: string]: string };
  expectedOutput: string;
  isSample: boolean;
  _id?: string;
}

export interface IBoilerplate {
  language: string;
  version: string;
  code: string;
}

export interface IProblemDocument extends Document {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  inputVariables: IInputVariable[];
  testCases: ITestCase[];
  supportedLanguages: string[];
  boilerplates: IBoilerplate[];
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