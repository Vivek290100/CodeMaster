import { IProblem } from '../models/problem';

export interface IProblemService {
  getProblems(): Promise<IProblem[]>;
  getProblem(slug: string): Promise<IProblem>;
  addProblem(problem: IProblem): Promise<IProblem>;
  runCode(slug: string, code: string, language: string): Promise<{ passed: boolean; output: any }[]>;
}