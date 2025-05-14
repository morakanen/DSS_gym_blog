import { Router } from 'express';
import { testDatabase } from '../controllers/test.controller.js';

const router = Router();

router.get("/test-db", testDatabase);

export default router;