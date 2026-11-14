import { Router } from 'express';
import {
  orderIdParam,
  orderProductParam,
  orderUserParam,
} from '../middleware/params.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addOrder,
  deleteOrder,
  getOrder,
  getOrdersByProduct,
  getOrdersByUser,
  listOrders,
  updateOrder,
} from '../controllers/orderController.js';

const router = Router();

router.get('/get_orders', asyncHandler(listOrders));
router.get('/get_orders/uid/:uid', orderUserParam, asyncHandler(getOrdersByUser));
router.get('/get_orders/pid/:pid', orderProductParam, asyncHandler(getOrdersByProduct));
router.get('/get_order/:id', orderIdParam, asyncHandler(getOrder));
router.post('/add_order', asyncHandler(addOrder));
router.put('/update_order/:id', orderIdParam, asyncHandler(updateOrder));
router.patch('/update_order/:id', orderIdParam, asyncHandler(updateOrder));
router.delete('/delete_order/:id', orderIdParam, asyncHandler(deleteOrder));

export default router;
