import { validationResult } from 'express-validator';
import { query } from '../config/db.js';

export const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const { name, description } = req.body;
    const ownerId = req.user.id;

    const projectResult = await query(
      `INSERT INTO projects (name, description, owner_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, owner_id, status, created_at`,
      [name, description || null, ownerId, 'active']
    );

    const project = projectResult.rows[0];

    await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [project.id, ownerId, 'admin']
    );

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project,
      },
    });
  } catch (error) {
    console.error('createProject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating project',
    });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.owner_id, 
        p.status, 
        p.created_at,
        COUNT(pm.id) as member_count,
        CASE WHEN p.owner_id = $1 THEN 'owner' 
             ELSE pm.role END as user_role
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.owner_id = $1 OR p.id IN (
         SELECT project_id FROM project_members WHERE user_id = $1
       )
       GROUP BY p.id, pm.role
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: {
        projects: result.rows,
      },
    });
  } catch (error) {
    console.error('getAllProjects error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving projects',
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;

    const projectResult = await query(
      `SELECT id, name, description, owner_id, status, created_at
       FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const project = projectResult.rows[0];

    const membersResult = await query(
      `SELECT pm.id, pm.user_id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at`,
      [projectId]
    );

    return res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: {
        project: {
          ...project,
          members: membersResult.rows,
        },
      },
    });
  } catch (error) {
    console.error('getProjectById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving project',
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const { projectId } = req.params;
    const { name, description, status } = req.body;

    const result = await query(
      `UPDATE projects 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING id, name, description, owner_id, status, created_at`,
      [name || null, description || null, status || null, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: result.rows[0],
      },
    });
  } catch (error) {
    console.error('updateProject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating project',
    });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await query(
      `DELETE FROM projects WHERE id = $1 RETURNING id`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('deleteProject error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting project',
    });
  }
};

export const addMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const { projectId } = req.params;
    const { email, role } = req.body;

    const userResult = await query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userId = userResult.rows[0].id;

    const existingResult = await query(
      `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    const result = await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, user_id, role, joined_at`,
      [projectId, userId, role || 'member']
    );

    return res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        member: result.rows[0],
      },
    });
  } catch (error) {
    console.error('addMember error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error adding member',
    });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    const result = await query(
      `DELETE FROM project_members 
       WHERE id = $1 AND project_id = $2
       RETURNING id`,
      [memberId, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('removeMember error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error removing member',
    });
  }
};

export const getMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await query(
      `SELECT pm.id, pm.user_id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at`,
      [projectId]
    );

    return res.status(200).json({
      success: true,
      message: 'Project members retrieved successfully',
      data: {
        members: result.rows,
      },
    });
  } catch (error) {
    console.error('getMembers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving members',
    });
  }
};