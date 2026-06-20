import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as goalsController from './goals.controller';

const router = Router();

router.use(authenticate);

router.get('/', goalsController.getAll);
router.get('/:id', goalsController.getById);
router.post('/', goalsController.create);
router.patch('/:id', goalsController.update);
router.delete('/:id', goalsController.remove);

export default router;
