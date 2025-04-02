// Execute\server\src\controllers\problemController.ts
import { Request, Response } from 'express';
import { IProblemService } from '../services/IProblemService';

export class ProblemController {
  constructor(private problemService: IProblemService) {}

  async getProblems(req: Request, res: Response) {
    const problems = await this.problemService.getProblems();
    res.json(problems);
  }

  async getProblem(req: Request, res: Response) {
    try {
      
      const problem = await this.problemService.getProblem(req.params.slug);
      res.json(problem);
    } catch (error) {
      const err = error as Error;
      res.status(404).json({ message: err.message });
    }
  }

  async addProblem(req: Request, res: Response) {
    const problem = await this.problemService.addProblem(req.body);
    res.status(201).json(problem);
  }

  async runCode(req: Request, res: Response) {
    try {
      console.log("wwwwwww",req.body,req.params.slug);
      
      const { code, language } = req.body;
      const results = await this.problemService.runCode(req.params.slug, code, language);
      res.json(results);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ message: err.message });
    }
  }
}