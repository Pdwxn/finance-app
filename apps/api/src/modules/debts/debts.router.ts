import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as debtsController from './debts.controller';

const router = Router();

router.use(authenticate);

router.get('/', debtsController.getAll);
router.get('/:id', debtsController.getById);
router.post('/', debtsController.create);
router.patch('/:id', debtsController.update);
router.delete('/:id', debtsController.remove);

export default router;
