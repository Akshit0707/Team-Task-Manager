import { query } from '../config/db.js';

export const isGlobalAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
  next();
};

export const isProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const result = await query(
      `SELECT pm.id, pm.role, p.owner_id FROM project_members pm
       JOIN projects p ON pm.project_id = p.id
       WHERE pm.project_id = $1 AND pm.user_id = $2
       UNION
       SELECT NULL, 'owner', p.id FROM projects p
       WHERE p.id = $1 AND p.owner_id = $2`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.',
      });
    }

    req.projectRole = result.rows[0].role;
    next();
  } catch (error) {
    console.error('isProjectMember error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking project membership',
    });
  }
};

export const isProjectAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    if (req.user.role === 'admin') {
      return next();
    }

    const result = await query(
      `SELECT pm.role FROM project_members pm
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND pm.role = 'admin'
       UNION
       SELECT 'owner' FROM projects p
       WHERE p.id = $1 AND p.owner_id = $2`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Project admin role required.',
      });
    }

    next();
  } catch (error) {
    console.error('isProjectAdmin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking project admin status',
    });
  }
};