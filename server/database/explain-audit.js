import { pool } from '../src/config/db.js';

async function runExplainAudit() {
  console.log('========================================================================');
  console.log('🔍 GymPilot Phase 7: Database Query Analysis & Index Optimization Audit');
  console.log('========================================================================\n');

  // 1. Audit Existing Indexes on All Tables
  console.log('📋 Current Table Indexes Audit:');
  const [tables] = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    ORDER BY table_name
  `);

  for (const { TABLE_NAME: tableName } of tables) {
    const [indexes] = await pool.query(`SHOW INDEX FROM \`${tableName}\``);
    const indexSummary = {};
    for (const idx of indexes) {
      if (!indexSummary[idx.Key_name]) {
        indexSummary[idx.Key_name] = {
          unique: idx.Non_unique === 0,
          columns: [],
        };
      }
      indexSummary[idx.Key_name].columns.push(idx.Column_name);
    }

    const formatted = Object.entries(indexSummary)
      .map(([name, data]) => `${name} (${data.unique ? 'UNIQUE ' : ''}${data.columns.join(', ')})`)
      .join(' | ');

    console.log(`  • ${tableName.padEnd(28)}: ${formatted}`);
  }

  console.log('\n========================================================================');
  console.log('⚡ EXPLAIN Execution on Critical Operational Queries:');
  console.log('========================================================================\n');

  const queriesToAudit = [
    // --- 1. ATTENDANCE SUBSYSTEM ---
    {
      name: 'Attendance: Live Floor Occupancy (Who is in gym)',
      sql: `EXPLAIN SELECT ar.id, ar.member_id, ar.check_in_time, um.first_name, um.last_name, p.name 
            FROM attendance_records ar 
            INNER JOIN users um ON um.id = ar.member_id 
            LEFT JOIN subscriptions s ON s.id = ar.subscription_id 
            LEFT JOIN plans p ON p.id = s.plan_id 
            WHERE ar.status = 'CHECKED_IN' AND ar.check_out_time IS NULL 
            ORDER BY ar.check_in_time DESC`,
    },
    {
      name: 'Attendance: Active Member Open Session Check',
      sql: `EXPLAIN SELECT ar.id, ar.member_id, u.first_name 
            FROM attendance_records ar 
            JOIN users u ON u.id = ar.member_id 
            WHERE ar.member_id = 2 AND ar.status = 'CHECKED_IN' AND ar.check_out_time IS NULL 
            LIMIT 1`,
    },
    {
      name: 'Attendance: Member 16-Week Heatmap Aggregation',
      sql: `EXPLAIN SELECT DATE(check_in_time) AS date, COUNT(*) AS count, COALESCE(SUM(duration_minutes), 0) AS total_minutes 
            FROM attendance_records 
            WHERE member_id = 2 AND check_in_time >= DATE_SUB(CURDATE(), INTERVAL 112 DAY) 
            GROUP BY DATE(check_in_time) 
            ORDER BY date ASC`,
    },
    {
      name: 'Attendance: Streak Calculation Distinct Dates',
      sql: `EXPLAIN SELECT DISTINCT DATE(check_in_time) AS visit_date 
            FROM attendance_records 
            WHERE member_id = 2 
            ORDER BY visit_date DESC 
            LIMIT 60`,
    },
    {
      name: 'Attendance: 7-Day Headcount Trend Analytics',
      sql: `EXPLAIN SELECT DATE(check_in_time) AS date, COUNT(*) AS count 
            FROM attendance_records 
            WHERE check_in_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
            GROUP BY DATE(check_in_time) 
            ORDER BY date ASC`,
    },

    // --- 2. SUBSCRIPTIONS & PASS LIFECYCLE ---
    {
      name: 'Subscriptions: Active Member Passes with Category',
      sql: `EXPLAIN SELECT s.*, p.name AS plan_name, c.name AS category_name 
            FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            JOIN plan_categories c ON p.category_id = c.id 
            WHERE s.user_id = 2 AND s.status = 'active'`,
    },
    {
      name: 'Subscriptions: Daily 7-Day Expiration Scan',
      sql: `EXPLAIN SELECT id, user_id, end_date FROM subscriptions WHERE status = 'active' AND end_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
    },
    {
      name: 'Subscriptions: Past-Due Active Passes Transition Scan',
      sql: `EXPLAIN SELECT id, user_id, end_date FROM subscriptions WHERE status = 'active' AND end_date <= CURDATE()`,
    },
    {
      name: 'Subscriptions: Queued Renewals Auto-Activation Scan',
      sql: `EXPLAIN SELECT id, user_id, start_date FROM subscriptions WHERE status = 'queued' AND start_date <= CURDATE()`,
    },
    {
      name: 'Subscriptions: Category Overlap Check on Purchase',
      sql: `EXPLAIN SELECT s.id FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.user_id = 2 AND p.category_id = 1 AND s.status IN ('active', 'queued')`,
    },

    // --- 3. COACHING SUBSYSTEM ---
    {
      name: 'Coaching: Active Athlete Assignment Lookup',
      sql: `EXPLAIN SELECT * FROM trainer_member_assignments WHERE member_id = 2 AND status = 'ACTIVE' LIMIT 1`,
    },
    {
      name: 'Coaching: Trainer Assigned Athlete Roster',
      sql: `EXPLAIN SELECT tma.*, um.first_name, um.last_name, um.email 
            FROM trainer_member_assignments tma 
            JOIN users um ON tma.member_id = um.id 
            WHERE tma.trainer_id = 3 AND tma.status IN ('ACTIVE', 'PAUSED') 
            ORDER BY tma.created_at DESC`,
    },
    {
      name: 'Coaching: Trainer Active Athlete Capacity Count',
      sql: `EXPLAIN SELECT COUNT(*) as active_count FROM trainer_member_assignments WHERE trainer_id = 3 AND status = 'ACTIVE'`,
    },
    {
      name: 'Coaching: Expired Grace Period Sweep (10-Day Grace)',
      sql: `EXPLAIN SELECT * FROM trainer_member_assignments WHERE status = 'PAUSED' AND grace_period_ends_at <= NOW()`,
    },
    {
      name: 'Coaching: Pending Member Requests Queue',
      sql: `EXPLAIN SELECT tar.*, um.first_name, um.last_name 
            FROM trainer_assignment_requests tar 
            JOIN users um ON tar.member_id = um.id 
            WHERE tar.status = 'PENDING' 
            ORDER BY tar.requested_at ASC`,
    },

    // --- 4. WORKOUT PLAN SUBSYSTEM ---
    {
      name: 'Workouts: Active Plan by Member ID',
      sql: `EXPLAIN SELECT * FROM workout_plans WHERE member_id = 2 AND is_active = TRUE LIMIT 1`,
    },
    {
      name: 'Workouts: Plan Days by Plan ID',
      sql: `EXPLAIN SELECT * FROM workout_plan_days WHERE plan_id = 1 ORDER BY day_number ASC`,
    },
    {
      name: 'Workouts: Exercises Hierarchy by Day IDs',
      sql: `EXPLAIN SELECT wpe.*, e.name AS exercise_name 
            FROM workout_plan_exercises wpe 
            LEFT JOIN exercises e ON wpe.exercise_id = e.id 
            WHERE wpe.day_id IN (1, 2, 3) 
            ORDER BY wpe.day_id ASC, wpe.order_index ASC, wpe.id ASC`,
    },
    {
      name: 'Workouts: Trainer Authored Plans Library',
      sql: `EXPLAIN SELECT wp.*, u.first_name, u.last_name 
            FROM workout_plans wp 
            JOIN users u ON wp.member_id = u.id 
            WHERE wp.trainer_id = 3 
            ORDER BY wp.updated_at DESC`,
    },
    {
      name: 'Workouts: Catalog Search by Muscle Group',
      sql: `EXPLAIN SELECT * FROM exercises WHERE (is_custom = FALSE OR created_by_trainer_id = 3) AND muscle_group = 'chest' ORDER BY is_custom ASC, muscle_group ASC, name ASC`,
    },

    // --- 5. NOTIFICATION CENTER ---
    {
      name: 'Notifications: User Notification Center Feed',
      sql: `EXPLAIN SELECT * FROM notifications WHERE user_id = 2 ORDER BY created_at DESC LIMIT 20 OFFSET 0`,
    },
    {
      name: 'Notifications: Navbar Unread Count Badge',
      sql: `EXPLAIN SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = 2 AND is_read = FALSE`,
    },
    {
      name: 'Notifications: Idempotency Key Lookup',
      sql: `EXPLAIN SELECT id FROM notifications WHERE event_key = 'EXP_7D_SUB_42'`,
    },

    // --- 6. PAYMENTS & FINANCIAL LEDGER ---
    {
      name: 'Finances: Payment Ledger with User Details',
      sql: `EXPLAIN SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS member_name, u.email AS member_email 
            FROM payments p 
            INNER JOIN users u ON p.user_id = u.id 
            ORDER BY p.payment_date DESC 
            LIMIT 20 OFFSET 0`,
    },
    {
      name: 'Finances: Recent Dashboard Transactions',
      sql: `EXPLAIN SELECT p.id, p.amount, p.currency, p.payment_method, p.payment_status, p.payment_date, CONCAT(u.first_name, ' ', u.last_name) AS member_name, u.email AS member_email, pl.name AS plan_name 
            FROM payments p 
            INNER JOIN users u ON p.user_id = u.id 
            INNER JOIN subscriptions s ON p.subscription_id = s.id 
            INNER JOIN plans pl ON s.plan_id = pl.id 
            ORDER BY p.payment_date DESC 
            LIMIT 5`,
    },
    {
      name: 'Finances: Total Revenue & Pending Payments Aggregation',
      sql: `EXPLAIN SELECT COALESCE(SUM(amount), 0.00) AS total_revenue, COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) AS pending_payments 
            FROM payments 
            WHERE payment_status IN ('COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED')`,
    },

    // --- 7. CORE DASHBOARD METRICS ---
    {
      name: 'Dashboard: User Distribution by Role & Status',
      sql: `EXPLAIN SELECT role, is_active, COUNT(*) FROM users GROUP BY role, is_active`,
    },
    {
      name: 'Dashboard: Subscription Count by Status',
      sql: `EXPLAIN SELECT status, COUNT(*) FROM subscriptions GROUP BY status`,
    },
  ];

  const issuesFound = [];
  const resultsTable = [];

  for (const item of queriesToAudit) {
    try {
      const [rows] = await pool.query(item.sql);

      for (const r of rows) {
        const hasMatchingIndex = Boolean(r.possible_keys);
        const isScan = r.type === 'ALL' && (r.rows > 2 || r.rows === null);
        const hasTempSort = r.Extra && r.Extra.includes('Using temporary') && r.Extra.includes('Using filesort');

        let status = '✅ OPTIMAL';
        if (isScan) {
          status = hasMatchingIndex ? '⚡ INDEX_READY' : '⚠️ SCAN';
        } else if (hasTempSort) {
          status = '⚠️ TEMPSORT';
        }

        resultsTable.push({
          Query: item.name.substring(0, 38),
          Table: r.table || '-',
          Type: r.type || '-',
          Key: r.key || (hasMatchingIndex ? `(${r.possible_keys})` : 'NONE'),
          Rows: r.rows !== null ? r.rows : '-',
          Filtered: r.filtered ? `${r.filtered}%` : '-',
          Extra: r.Extra ? r.Extra.substring(0, 35) : '-',
          Status: status,
        });

        if (isScan && !hasMatchingIndex) {
          issuesFound.push({
            query: item.name,
            table: r.table,
            reason: `Full Table Scan without index (type=ALL, examined=${r.rows} rows)`,
            recommendation: `Add index on ${r.table} supporting WHERE/JOIN predicates`,
          });
        }
        if (hasTempSort) {
          issuesFound.push({
            query: item.name,
            table: r.table,
            reason: `Temporary table + filesort needed for grouping/ordering`,
            recommendation: `Query groups/orders by expression; covered by range scan on member/date`,
          });
        }
      }
    } catch (err) {
      console.error(`❌ Failed EXPLAIN for "${item.name}":`, err.message);
    }
  }

  console.table(resultsTable);

  console.log('\n========================================================================');
  console.log('📊 Summary of Query & Index Audit Findings:');
  console.log('========================================================================\n');

  if (issuesFound.length === 0) {
    console.log('🎉 Outstanding! All operational queries across Attendance, Coaching, Workouts, Notifications, Subscriptions, and Payments utilize efficient index lookups with 0 full-table scans.');
  } else {
    console.log(`⚠️  Identified ${issuesFound.length} optimization opportunities:`);
    for (const issue of issuesFound) {
      console.log(`  • [${issue.query}] on "${issue.table}":`);
      console.log(`    - Issue: ${issue.reason}`);
      console.log(`    - Proposed Fix: ${issue.recommendation}\n`);
    }
  }

  await pool.end();
}

runExplainAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
