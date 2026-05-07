import bcryptjs from 'bcryptjs';
import { query } from './db.js';

const seed = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    // Create admin user
    const hashedAdminPassword = await bcryptjs.hash('Admin123!', 10);
    const adminResult = await query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email`,
      ['Admin User', 'admin@demo.com', hashedAdminPassword, 'admin']
    );
    const adminId = adminResult.rows[0].id;
    console.log('✓ Admin user created:', adminResult.rows[0].email);

    // Create member users
    const hashedMemberPassword = await bcryptjs.hash('Member123!', 10);
    const member1Result = await query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email`,
      ['John Doe', 'john@demo.com', hashedMemberPassword, 'member']
    );
    const member1Id = member1Result.rows[0].id;
    console.log('✓ Member user created:', member1Result.rows[0].email);

    const member2Result = await query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email`,
      ['Jane Smith', 'jane@demo.com', hashedMemberPassword, 'member']
    );
    const member2Id = member2Result.rows[0].id;
    console.log('✓ Member user created:', member2Result.rows[0].email);

    console.log('');

    // Create projects
    const project1Result = await query(
      `INSERT INTO projects (name, description, owner_id, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name`,
      ['Website Redesign', 'Redesign company website with new branding', adminId, 'active']
    );
    const project1Id = project1Result.rows[0].id;
    console.log('✓ Project created:', project1Result.rows[0].name);

    const project2Result = await query(
      `INSERT INTO projects (name, description, owner_id, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name`,
      ['Mobile App Development', 'Build iOS and Android mobile apps', adminId, 'active']
    );
    const project2Id = project2Result.rows[0].id;
    console.log('✓ Project created:', project2Result.rows[0].name);

    console.log('');

    // Assign members to projects
    await query(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES ($1, $2, $3)`,
      [project1Id, member1Id, 'admin']
    );
    console.log('✓ John assigned to Website Redesign (admin)');

    await query(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES ($1, $2, $3)`,
      [project1Id, member2Id, 'member']
    );
    console.log('✓ Jane assigned to Website Redesign (member)');

    await query(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES ($1, $2, $3)`,
      [project2Id, member1Id, 'member']
    );
    console.log('✓ John assigned to Mobile App Development (member)');

    await query(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES ($1, $2, $3)`,
      [project2Id, member2Id, 'admin']
    );
    console.log('✓ Jane assigned to Mobile App Development (admin)');

    console.log('');

    // Create sample tasks
    const tasks = [
      {
        title: 'Design mockups',
        description: 'Create UI mockups for landing page',
        projectId: project1Id,
        assigneeId: member1Id,
        createdBy: adminId,
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-05-20',
      },
      {
        title: 'Setup development environment',
        description: 'Configure Docker and development tools',
        projectId: project1Id,
        assigneeId: member2Id,
        createdBy: adminId,
        status: 'todo',
        priority: 'high',
        dueDate: '2026-05-15',
      },
      {
        title: 'Backend API implementation',
        description: 'Build REST APIs for user management',
        projectId: project2Id,
        assigneeId: member1Id,
        createdBy: adminId,
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-05-25',
      },
      {
        title: 'Code review',
        description: 'Review pull requests from team',
        projectId: project2Id,
        assigneeId: member2Id,
        createdBy: adminId,
        status: 'review',
        priority: 'medium',
        dueDate: '2026-05-18',
      },
      {
        title: 'Deploy to production',
        description: 'Deploy final version to production server',
        projectId: project1Id,
        assigneeId: null,
        createdBy: adminId,
        status: 'done',
        priority: 'medium',
        dueDate: '2026-05-30',
      },
    ];

    for (const task of tasks) {
      await query(
        `INSERT INTO tasks (title, description, project_id, assignee_id, created_by, status, priority, due_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          task.title,
          task.description,
          task.projectId,
          task.assigneeId,
          task.createdBy,
          task.status,
          task.priority,
          task.dueDate,
        ]
      );
      console.log(`✓ Task created: ${task.title}`);
    }

    console.log('\n✅ Database seed completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();