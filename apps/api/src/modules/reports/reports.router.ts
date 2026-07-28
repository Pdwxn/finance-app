import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as reportsController from './reports.controller';

const router = Router();

router.use(authenticate);

router.get('/', reportsController.getAll);
router.get('/unread/count', reportsController.getUnreadCount);
router.get('/:id', reportsController.getById);
router.post('/generate', reportsController.generate);
router.delete('/:id', reportsController.remove);

export default router;
