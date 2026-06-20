import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { sync } from './sync.controller';

const router = Router();

router.use(authenticate);
router.post('/', sync);

export default router;
