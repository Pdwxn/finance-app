import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as debtPaymentsController from './debt-payments.controller';

const router = Router();

router.use(authenticate);

router.get('/', debtPaymentsController.getAll);
router.get('/:id', debtPaymentsController.getById);
router.post('/', debtPaymentsController.create);
router.patch('/:id', debtPaymentsController.update);
router.delete('/:id', debtPaymentsController.remove);

export default router;
