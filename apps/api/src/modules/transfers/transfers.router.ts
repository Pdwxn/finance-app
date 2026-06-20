import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as transfersController from './transfers.controller';

const router = Router();

router.use(authenticate);

router.get('/', transfersController.getAll);
router.get('/:id', transfersController.getById);
router.post('/', transfersController.create);
router.patch('/:id', transfersController.update);
router.delete('/:id', transfersController.remove);

export default router;
