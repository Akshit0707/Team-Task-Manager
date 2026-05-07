import { validationResult } from 'express-validator';
import { query } from '../config/db.js';

export const createTask = async (req, res) => {
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
    const { title, description, assigneeId, priority, dueDate } = req.body;
    const userId = req.user.id;

    if (assigneeId) {
      const assigneeResult = await query(
        `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2
         UNION
         SELECT id FROM projects WHERE id = $1 AND owner_id = $2`,
        [projectId, assigneeId]
      );

      if (assigneeResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assignee is not a member of this project',
        });
      }
    }

    const result = await query(
      `INSERT INTO tasks (title, description, project_id, assignee_id, created_by, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, description, project_id, assignee_id, created_by, status, priority, due_date, created_at, updated_at`,
      [title, description || null, projectId, assigneeId || null, userId, 'todo', priority || 'medium', dueDate || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: result.rows[0],
      },
    });
  } catch (error) {
    console.error('createTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating task',
    });
  }
};

export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assigneeId, overdue } = req.query;

    let sql = `SELECT 
      t.id, t.title, t.description, t.project_id, t.assignee_id, 
      t.created_by, t.status, t.priority, t.due_date, t.created_at, t.updated_at,
      u.name as assignee_name,
      cb.name as created_by_name
     FROM tasks t
     LEFT JOIN users u ON t.assignee_id = u.id
     LEFT JOIN users cb ON t.created_by = cb.id
     WHERE t.project_id = $1`;

    const params = [projectId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      sql += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      sql += ` AND t.priority = $${paramCount}`;
      params.push(priority);
    }

    if (assigneeId) {
      paramCount++;
      sql += ` AND t.assignee_id = $${paramCount}`;
      params.push(assigneeId);
    }

    if (overdue === 'true') {
      sql += ` AND t.due_date < CURRENT_DATE AND t.status != 'done'`;
    }

    sql += ` ORDER BY t.due_date ASC, t.created_at DESC`;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Project tasks retrieved successfully',
      data: {
        tasks: result.rows,
      },
    });
  } catch (error) {
    console.error('getProjectTasks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving tasks',
    });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        t.id, t.title, t.description, t.project_id, t.assignee_id, 
        t.created_by, t.status, t.priority, t.due_date, t.created_at, t.updated_at,
        u.name as assignee_name, u.email as assignee_email,
        cb.name as created_by_name, cb.email as created_by_email
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users cb ON t.created_by = cb.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task retrieved successfully',
      data: {
        task: result.rows[0],
      },
    });
  } catch (error) {
    console.error('getTaskById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving task',
    });
  }
};

export const updateTask = async (req, res) => {
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

    const { id } = req.params;
    const { title, description, assigneeId, priority, dueDate } = req.body;
    const userId = req.user.id;

    const taskResult = await query(
      `SELECT t.*, p.owner_id FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const task = taskResult.rows[0];
    const projectId = task.project_id;

    const isAuthorized = userId === task.assignee_id || 
                        userId === task.created_by || 
                        userId === task.owner_id ||
                        req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only assignee, creator, or admin can update this task.',
      });
    }

    if (assigneeId && assigneeId !== task.assignee_id) {
      const assigneeCheckResult = await query(
        `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2
         UNION
         SELECT id FROM projects WHERE id = $1 AND owner_id = $2`,
        [projectId, assigneeId]
      );

      if (assigneeCheckResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assignee is not a member of this project',
        });
      }
    }

    const result = await query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           assignee_id = COALESCE($3, assignee_id),
           priority = COALESCE($4, priority),
           due_date = COALESCE($5, due_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, title, description, project_id, assignee_id, created_by, status, priority, due_date, created_at, updated_at`,
      [title || null, description || null, assigneeId || null, priority || null, dueDate || null, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: result.rows[0],
      },
    });
  } catch (error) {
    console.error('updateTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating task',
    });
  }
};

export const updateTaskStatus = async (req, res) => {
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

    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      `UPDATE tasks 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, title, description, project_id, assignee_id, created_by, status, priority, due_date, created_at, updated_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: {
        task: result.rows[0],
      },
    });
  } catch (error) {
    console.error('updateTaskStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating task status',
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const taskResult = await query(
      `SELECT t.*, p.owner_id FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const task = taskResult.rows[0];
    const isAuthorized = userId === task.created_by || 
                        userId === task.owner_id || 
                        req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project admin or task creator can delete this task.',
      });
    }

    await query('DELETE FROM tasks WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('deleteTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting task',
    });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority } = req.query;

    let sql = `SELECT 
      t.id, t.title, t.description, t.project_id, t.assignee_id, 
      t.created_by, t.status, t.priority, t.due_date, t.created_at, t.updated_at,
      p.name as project_name,
      cb.name as created_by_name
     FROM tasks t
     JOIN projects p ON t.project_id = p.id
     LEFT JOIN users cb ON t.created_by = cb.id
     WHERE t.assignee_id = $1`;

    const params = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      sql += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      sql += ` AND t.priority = $${paramCount}`;
      params.push(priority);
    }

    sql += ` ORDER BY t.due_date ASC, t.priority DESC, t.created_at DESC`;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'My tasks retrieved successfully',
      data: {
        tasks: result.rows,
      },
    });
  } catch (error) {
    console.error('getMyTasks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving tasks',
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM tasks WHERE assignee_id = $1`,
      [userId]
    );

    const total = parseInt(totalResult.rows[0].total);

    const statusResult = await query(
      `SELECT status, COUNT(*) as count FROM tasks 
       WHERE assignee_id = $1 
       GROUP BY status`,
      [userId]
    );

    const byStatus = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    statusResult.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    const overdueResult = await query(
      `SELECT COUNT(*) as overdue FROM tasks 
       WHERE assignee_id = $1 
       AND due_date < CURRENT_DATE 
       AND status != 'done'`,
      [userId]
    );

    const overdue = parseInt(overdueResult.rows[0].overdue);

    const myTasksResult = await query(
      `SELECT COUNT(*) as my_tasks FROM tasks 
       WHERE assignee_id = $1 
       AND status != 'done'`,
      [userId]
    );

    const myTasks = parseInt(myTasksResult.rows[0].my_tasks);

    return res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        stats: {
          totalTasks: total,
          byStatus,
          overdueTasks: overdue,
          myTasks,
        },
      },
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard stats',
    });
  }
};