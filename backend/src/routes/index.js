import { Router } from 'express';
import productRoutes from './productRoutes.js';
import userRoutes from './userRoutes.js';
import orderRoutes from './orderRoutes.js';

const router = Router();

router.use(productRoutes);
router.use(userRoutes);
router.use(orderRoutes);

export default router;
