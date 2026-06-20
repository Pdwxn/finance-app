import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as creditCardsController from './credit-cards.controller';

const router = Router();

router.use(authenticate);

router.get('/', creditCardsController.getAll);
router.get('/:id', creditCardsController.getById);
router.post('/', creditCardsController.create);
router.patch('/:id', creditCardsController.update);
router.delete('/:id', creditCardsController.remove);

export default router;
