import express from 'express';
import { ProblemController } from '../controllers/problemController';
import { ProblemService } from '../services/problemService';
import { ProblemRepository } from '../repositories/problemRepository';

const router = express.Router();
const repository = new ProblemRepository();
const service = new ProblemService(repository);
const controller = new ProblemController(service);

router.get('/', controller.getProblems.bind(controller));
router.get('/:slug', controller.getProblem.bind(controller));
router.post('/', controller.addProblem.bind(controller));
router.post('/:slug/run', controller.runCode.bind(controller));

export default router;