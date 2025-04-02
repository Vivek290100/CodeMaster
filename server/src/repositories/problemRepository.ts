import { IProblem, Problem } from '../models/problem';
import { IProblemRepository } from './IProblemRepository';

export class ProblemRepository implements IProblemRepository {
  async findAll(): Promise<IProblem[]> {
    return Problem.find({}, 'title slug difficulty');
  }

  async findBySlug(slug: string): Promise<IProblem | null> {
    return Problem.findOne({ slug });
  }

  async create(problem: IProblem): Promise<IProblem> {
    const newProblem = new Problem(problem);
    return newProblem.save();
  }
}