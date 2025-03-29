import { Router } from 'express';
import { ProblemRepository } from '../repositories/problemRepository';
import { ProblemController } from '../controllers/problemController';
import { ProblemService } from '../services/problemService';

const router = Router();

// Dependency Injection setup
const problemRepository = new ProblemRepository();
const problemServiceInstance = new ProblemService(problemRepository);
const problemController = new ProblemController(problemServiceInstance);

// Routes
router.post('/', problemController.addProblem.bind(problemController));
router.get('/', problemController.getAllProblems.bind(problemController));
router.get('/:id', problemController.getProblem.bind(problemController));
router.post('/execute', problemController.executeCode.bind(problemController));

export default router;