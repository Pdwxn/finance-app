import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as investmentTransactionsController from './investment-transactions.controller';

const router = Router();

router.use(authenticate);

router.get('/', investmentTransactionsController.getAll);
router.get('/:id', investmentTransactionsController.getById);
router.post('/', investmentTransactionsController.create);
router.patch('/:id', investmentTransactionsController.update);
router.delete('/:id', investmentTransactionsController.remove);

export default router;
