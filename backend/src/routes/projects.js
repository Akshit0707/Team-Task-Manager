import express from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { verifyToken } from '../middleware/auth.js';
import {
  isProjectAdmin,
  isProjectMember,
  isGlobalAdmin,
} from '../middleware/rbac.js';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getMembers,
} from '../controllers/projectController.js';
import {
  getProjectTasks,
  createTask,
} from '../controllers/taskController.js';

const router = express.Router();
router.use(verifyToken);

router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required').isLength({ min: 3 }),
    body('description').optional().trim(),
  ],
  createProject
);

router.get('/', getAllProjects);

router.get('/:projectId',
  [param('projectId').isUUID().withMessage('Invalid project ID')],
  isProjectMember,
  getProjectById
);

router.put('/:projectId',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('name').optional().trim().isLength({ min: 3 }),
    body('description').optional().trim(),
    body('status').optional().isIn(['active', 'archived']),
  ],
  isProjectAdmin,
  updateProject
);

router.delete('/:projectId',
  [param('projectId').isUUID().withMessage('Invalid project ID')],
  isProjectAdmin,
  deleteProject
);

router.get('/:projectId/members',
  [param('projectId').isUUID().withMessage('Invalid project ID')],
  isProjectMember,
  getMembers
);

router.post('/:projectId/members',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['admin', 'member']),
  ],
  isProjectAdmin,
  addMember
);

router.delete('/:projectId/members/:memberId',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    param('memberId').isUUID().withMessage('Invalid member ID'),
  ],
  isProjectAdmin,
  removeMember
);

// ── Project task routes ──────────────────────────────────────────────────────

router.get('/:projectId/tasks',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    queryValidator('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
    queryValidator('priority').optional().isIn(['low', 'medium', 'high']),
    queryValidator('assigneeId').optional().isUUID(),
    queryValidator('overdue').optional().isIn(['true', 'false']),
  ],
  isProjectMember,
  getProjectTasks
);

router.post('/:projectId/tasks',
  [
    param('projectId').isUUID().withMessage('Invalid project ID'),
    body('title').trim().notEmpty().withMessage('Task title is required').isLength({ min: 3 }),
    body('description').optional().trim(),
    body('assigneeId').optional().isUUID().withMessage('Invalid assignee ID'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601(),
  ],
  isProjectMember,
  createTask
);

export default router;