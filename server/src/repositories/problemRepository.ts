// Execute\server\src\repositories\problemRepository.ts
import { IBaseRepository } from '../types/repositoryTypes';
import { IProblemDocument } from '../types/problemTypes';
import { Problem } from '../models/problemModel';

export class ProblemRepository implements IBaseRepository<IProblemDocument> {
  async create(data: Partial<IProblemDocument>): Promise<IProblemDocument> {
    const problem = new Problem(data);
    return problem.save();
  }

  async findById(id: string): Promise<IProblemDocument | null> {
    return Problem.findById(id).exec();
  }

  async findAll(): Promise<IProblemDocument[]> {
    return Problem.find().exec();
  }
}