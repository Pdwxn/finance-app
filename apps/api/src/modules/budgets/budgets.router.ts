import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as budgetsController from './budgets.controller';

const router = Router();

router.use(authenticate);

router.get('/period', budgetsController.getByPeriod);
router.get('/', budgetsController.getAll);
router.get('/:id', budgetsController.getById);
router.post('/', budgetsController.create);
router.patch('/:id', budgetsController.update);
router.delete('/:id', budgetsController.remove);

export default router;
