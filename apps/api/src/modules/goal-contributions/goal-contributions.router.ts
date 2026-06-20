import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as goalContributionsController from './goal-contributions.controller';

const router = Router();

router.use(authenticate);

router.get('/', goalContributionsController.getAll);
router.get('/:id', goalContributionsController.getById);
router.post('/', goalContributionsController.create);
router.patch('/:id', goalContributionsController.update);
router.delete('/:id', goalContributionsController.remove);

export default router;
