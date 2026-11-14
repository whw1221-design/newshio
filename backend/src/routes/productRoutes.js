import { Router } from 'express';
import { productIdParam } from '../middleware/params.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../controllers/productController.js';

const router = Router();

router.get('/get_products', asyncHandler(listProducts));
router.get('/get_product/:id', productIdParam, asyncHandler(getProduct));
router.post('/add_product', asyncHandler(addProduct));
router.put('/update_product/:id', productIdParam, asyncHandler(updateProduct));
router.patch('/update_product/:id', productIdParam, asyncHandler(updateProduct));
router.delete('/delete_product/:id', productIdParam, asyncHandler(deleteProduct));

export default router;
