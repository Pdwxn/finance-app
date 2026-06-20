import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as cardPaymentsController from './card-payments.controller';

const router = Router();

router.use(authenticate);

router.get('/', cardPaymentsController.getAll);
router.get('/:id', cardPaymentsController.getById);
router.post('/', cardPaymentsController.create);
router.patch('/:id', cardPaymentsController.update);
router.delete('/:id', cardPaymentsController.remove);

export default router;
