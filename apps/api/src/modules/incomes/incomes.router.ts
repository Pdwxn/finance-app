import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as incomesController from './incomes.controller';

const router = Router();

router.use(authenticate);

router.get('/', incomesController.getAll);
router.get('/:id', incomesController.getById);
router.post('/', incomesController.create);
router.patch('/:id', incomesController.update);
router.delete('/:id', incomesController.remove);

export default router;
