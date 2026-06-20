import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as investmentsController from './investments.controller';

const router = Router();

router.use(authenticate);

router.get('/', investmentsController.getAll);
router.get('/:id', investmentsController.getById);
router.post('/', investmentsController.create);
router.patch('/:id', investmentsController.update);
router.delete('/:id', investmentsController.remove);

export default router;
