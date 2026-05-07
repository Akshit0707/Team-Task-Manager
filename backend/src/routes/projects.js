import express from 'express';
import { body, param } from 'express-validator';
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

const router = express.Router();

router.use(verifyToken);

router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Project name is required')
      .isLength({ min: 3 })
      .withMessage('Project name must be at least 3 characters'),
    body('description')
      .optional()
      .trim(),
  ],
  createProject
);

router.get('/', getAllProjects);

router.get(
  '/:projectId',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
  ],
  isProjectMember,
  getProjectById
);

router.put(
  '/:projectId',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Project name must be at least 3 characters'),
    body('description')
      .optional()
      .trim(),
    body('status')
      .optional()
      .isIn(['active', 'archived'])
      .withMessage('Invalid project status'),
  ],
  isProjectAdmin,
  updateProject
);

router.delete(
  '/:projectId',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
  ],
  isProjectAdmin,
  deleteProject
);

router.get(
  '/:projectId/members',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
  ],
  isProjectMember,
  getMembers
);

router.post(
  '/:projectId/members',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn(['admin', 'member'])
      .withMessage('Invalid role'),
  ],
  isProjectAdmin,
  addMember
);

router.delete(
  '/:projectId/members/:memberId',
  [
    param('projectId')
      .isUUID()
      .withMessage('Invalid project ID'),
    param('memberId')
      .isUUID()
      .withMessage('Invalid member ID'),
  ],
  isProjectAdmin,
  removeMember
);

export default router;