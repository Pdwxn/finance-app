import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as cardChargesController from './card-charges.controller';

const router = Router();

router.use(authenticate);

router.get('/', cardChargesController.getAll);
router.get('/:id', cardChargesController.getById);
router.post('/', cardChargesController.create);
router.patch('/:id', cardChargesController.update);
router.delete('/:id', cardChargesController.remove);

export default router;
