import { IProblem } from '../models/problem';

export interface IProblemRepository {
  findAll(): Promise<IProblem[]>;
  findBySlug(slug: string): Promise<IProblem | null>;
  create(problem: IProblem): Promise<IProblem>;
}