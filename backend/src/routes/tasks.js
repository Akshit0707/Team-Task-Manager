import express from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { verifyToken } from '../middleware/auth.js';
import { isProjectMember, isProjectAdmin } from '../middleware/rbac.js';
import {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getMyTasks,
  getDashboardStats,
} from '../controllers/taskController.js';

const router = express.Router();
router.use(verifyToken);

router.get('/my', getMyTasks);

router.get('/dashboard', getDashboardStats);

router.get(
  '/projects/:projectId/tasks',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    queryValidator('status')
      .optional()
      .isIn(['todo', 'in_progress', 'review', 'done'])
      .withMessage('Invalid status'),
    queryValidator('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority'),
    queryValidator('assigneeId')
      .optional()
      .isUUID()
      .withMessage('Invalid assignee ID'),
    queryValidator('overdue')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('Invalid overdue value'),
  ],
  isProjectMember,
  getProjectTasks
);

router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task ID'),
  ],
  getTaskById
);

router.post(
  '/projects/:projectId/tasks',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Task title is required')
      .isLength({ min: 3 })
      .withMessage('Task title must be at least 3 characters'),
    body('description')
      .optional()
      .trim(),
    body('assigneeId')
      .optional()
      .isUUID()
      .withMessage('Invalid assignee ID'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid due date format'),
  ],
  isProjectMember,
  createTask
);

router.put(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Task title must be at least 3 characters'),
    body('description')
      .optional()
      .trim(),
    body('assigneeId')
      .optional()
      .isUUID()
      .withMessage('Invalid assignee ID'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid due date format'),
  ],
  updateTask
);

router.patch(
  '/:id/status',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task ID'),
    body('status')
      .isIn(['todo', 'in_progress', 'review', 'done'])
      .withMessage('Invalid status'),
  ],
  updateTaskStatus
);

router.delete(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid task ID'),
  ],
  deleteTask
);

export default router;