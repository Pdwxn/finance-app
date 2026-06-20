import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as expensesController from './expenses.controller';

const router = Router();

router.use(authenticate);

router.get('/', expensesController.getAll);
router.get('/:id', expensesController.getById);
router.post('/', expensesController.create);
router.patch('/:id', expensesController.update);
router.delete('/:id', expensesController.remove);

export default router;
