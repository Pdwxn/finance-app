import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as categoriesController from './categories.controller';

const router = Router();

router.use(authenticate);

router.get('/', categoriesController.getAll);
router.get('/:id', categoriesController.getById);
router.post('/', categoriesController.create);
router.patch('/:id', categoriesController.update);
router.delete('/:id', categoriesController.remove);

export default router;
