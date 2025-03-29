import { Request, Response } from 'express';
import { ProblemService } from '../services/problemService';
import { ExecutionResult } from '../types/problemTypes';

export class ProblemController {
  constructor(private problemService: ProblemService) {}

  async addProblem(req: Request, res: Response): Promise<void> {
    try {
      // Validate input variables
      if (!req.body.inputVariables || !Array.isArray(req.body.inputVariables)) {
        res.status(400).json({ message: 'Input variables must be an array' });
        return;
      }

      // Validate test cases
      if (!req.body.testCases || !Array.isArray(req.body.testCases)) {
        res.status(400).json({ message: 'Test cases must be an array' });
        return;
      }

      const problem = await this.problemService.addProblem(req.body);
      res.status(201).json({ message: 'Problem added successfully', problem });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error adding problem', 
        error: (error as Error).message 
      });
    }
  }

  async getProblem(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: 'Invalid problem ID format' });
      return;
    }
    try {
      const problem = await this.problemService.getProblem(id);
      if (!problem) {
        res.status(404).json({ message: 'Problem not found' });
        return;
      }
      res.json(problem);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error fetching problem', 
        error: (error as Error).message 
      });
    }
  }

  async getAllProblems(req: Request, res: Response): Promise<void> {
    try {
      const problems = await this.problemService.getAllProblems();
      res.json(problems);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error fetching problems', 
        error: (error as Error).message 
      });
    }
  }

  async executeCode(req: Request, res: Response): Promise<void> {
    const { problemId, language, version, code } = req.body;
    
    // Validate required fields
    if (!problemId || !language || !version || !code) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    try {
      const result = await this.problemService.executeCode(
        problemId, 
        language, 
        version, 
        code
      );
      
      // Format results for better error display
      const formattedResults = result.results.map(r => ({
        ...r,
        errorType: r.stderr ? this.determineErrorType(r.stderr) : undefined
      }));

      res.json({ 
        ...result, 
        results: formattedResults 
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(errorMessage.includes('Rate limit') ? 429 : 500).json({
        message: errorMessage.includes('Rate limit') ? 
          errorMessage : 'Execution failed',
        error: errorMessage,
      });
    }
  }

  private determineErrorType(stderr: string): ExecutionResult['errorType'] {
    if (stderr.includes('SyntaxError') || stderr.includes('compile error')) {
      return 'syntax';
    }
    if (stderr.includes('Timeout') || stderr.includes('timeout')) {
      return 'timeout';
    }
    if (stderr.includes('MemoryError') || stderr.includes('memory')) {
      return 'memory';
    }
    if (stderr.includes('TypeError') || stderr.includes('type')) {
      return 'type';
    }
    return 'runtime';
  }
}