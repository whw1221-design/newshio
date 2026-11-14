import { Router } from 'express';
import { userIdParam } from '../middleware/params.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from '../controllers/userController.js';

const router = Router();

router.get('/get_users', asyncHandler(listUsers));
router.get('/get_user/:id', userIdParam, asyncHandler(getUser));
router.post('/add_user', asyncHandler(addUser));
router.put('/update_user/:id', userIdParam, asyncHandler(updateUser));
router.patch('/update_user/:id', userIdParam, asyncHandler(updateUser));
router.delete('/delete_user/:id', userIdParam, asyncHandler(deleteUser));

export default router;
