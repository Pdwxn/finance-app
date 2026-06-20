import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as accountsController from './accounts.controller';

const router = Router();

router.use(authenticate);

router.get('/', accountsController.getAll);
router.get('/:id', accountsController.getById);
router.post('/', accountsController.create);
router.patch('/:id', accountsController.update);
router.delete('/:id', accountsController.remove);

export default router;
