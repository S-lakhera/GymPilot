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
  const failedQueries = [];

  for (const item of queriesToAudit) {
    try {
      const [rows] = await pool.query(item.sql);

      if (!Array.isArray(rows) || rows.length === 0) {
        failedQueries.push({ name: item.name, error: 'Empty EXPLAIN plan returned' });
        console.error(`❌ Failed EXPLAIN for "${item.name}": Empty plan returned`);
        continue;
      }

      for (const r of rows) {
        // Detect MySQL vs TiDB execution plan formats
        const isMySQL = r.type !== undefined || r.select_type !== undefined;
        const isTiDB = !isMySQL && (
          r.task !== undefined ||
          r['operator info'] !== undefined ||
          r['access object'] !== undefined ||
          (typeof r.id === 'string' && (r.id.includes('_') || r.id.includes('Scan') || r.id.includes('Reader')))
        );

        let tableName = '-';
        let planType = '-';
        let selectedKey = 'NONE';
        let candidateKeys = null;
        let rowCount = '-';
        let filteredPercent = '-';
        let extraInfo = '-';
        let isScan = false;
        let hasFilesort = false;
        let hasTempTable = false;
        let isUnsupported = false;

        if (isMySQL) {
          tableName = r.table || '-';
          planType = r.type || '-';
          selectedKey = r.key && r.key !== 'NULL' ? r.key : 'NONE';
          candidateKeys = r.possible_keys && r.possible_keys !== 'NULL' ? r.possible_keys : null;
          rowCount = r.rows !== null && r.rows !== undefined ? r.rows : '-';
          filteredPercent = r.filtered ? `${r.filtered}%` : '-';
          extraInfo = r.Extra || '-';

          // Actual index usage determined from selected key, not candidate keys
          isScan = r.type === 'ALL' && (r.rows > 2 || r.rows === null);
          hasFilesort = Boolean(r.Extra && r.Extra.includes('Using filesort'));
          hasTempTable = Boolean(r.Extra && r.Extra.includes('Using temporary'));
        } else if (isTiDB) {
          tableName = r['access object'] || r.id || '-';
          planType = r.id || '-';
          const opInfo = `${r['operator info'] || ''} ${r['access object'] || ''}`;
          const usesIndex = Boolean(r.id && (r.id.includes('Index') || r.id.includes('Point_Get') || opInfo.includes('index')));

          selectedKey = usesIndex ? (r['access object'] || 'INDEX') : 'NONE';
          candidateKeys = null;
          rowCount = r.estRows !== null && r.estRows !== undefined ? r.estRows : '-';
          filteredPercent = '-';
          extraInfo = `${r.task || ''}${r['operator info'] ? `: ${r['operator info']}` : ''}` || '-';

          isScan = Boolean(r.id && (r.id.includes('TableFullScan') || r.id.includes('TableReader')) && !opInfo.includes('index'));
          hasFilesort = Boolean(r.id && (r.id.includes('Sort') || r.id.includes('TopN')));
          hasTempTable = false; // TiDB operators pipeline grouping/sorts through HashAgg / StreamAgg / TopN
        } else {
          // Unsupported plan format
          isUnsupported = true;
          tableName = r.table || r.id || '-';
          planType = 'UNSUPPORTED';
          extraInfo = 'Unrecognized EXPLAIN output schema';
        }

        // Determine granular status
        let status = '✅ OPTIMAL';
        if (isUnsupported) {
          status = '❌ UNSUPPORTED';
        } else if (isScan) {
          status = candidateKeys ? '⚠️ SCAN (INDEX_BYPASSED)' : '⚠️ SCAN (NO_INDEX)';
        } else if (hasTempTable && hasFilesort) {
          status = '⚠️ TEMP_FILESORT';
        } else if (hasFilesort) {
          status = '⚠️ FILESORT';
        } else if (hasTempTable) {
          status = '⚠️ TEMPTABLE';
        }

        resultsTable.push({
          Query: item.name.substring(0, 36),
          Table: tableName.substring(0, 20),
          Type: planType.substring(0, 16),
          Key: selectedKey !== 'NONE' ? selectedKey : (candidateKeys ? `(${candidateKeys})` : 'NONE'),
          Rows: rowCount,
          Filtered: filteredPercent,
          Extra: extraInfo.substring(0, 32),
          Status: status,
        });

        // Record all observed scans regardless of whether candidate indexes exist
        if (isScan) {
          if (candidateKeys) {
            issuesFound.push({
              query: item.name,
              table: tableName,
              reason: `Full Table Scan (type=ALL, examined=${rowCount} rows; selected_key=NONE, candidate_keys=${candidateKeys})`,
              recommendation: `Query bypassed candidate index (${candidateKeys}). At low row counts MySQL cost optimizer prefers full scan; ensure index is used as table grows or test with query index hints.`,
            });
          } else {
            issuesFound.push({
              query: item.name,
              table: tableName,
              reason: `Full Table Scan without index (type=ALL, examined=${rowCount} rows; selected_key=NONE)`,
              recommendation: `Add index on ${tableName} supporting WHERE/JOIN predicates`,
            });
          }
        }

        // Record temporary table use separately
        if (hasTempTable) {
          issuesFound.push({
            query: item.name,
            table: tableName,
            reason: `Temporary table required for query execution`,
            recommendation: `Query groups/orders by expression; evaluate if covering composite index or schema pre-aggregation can eliminate temporary table.`,
          });
        }

        // Record filesort ordering work separately
        if (hasFilesort) {
          issuesFound.push({
            query: item.name,
            table: tableName,
            reason: `Filesort required for ordering`,
            recommendation: `Index does not cover ORDER BY; evaluate composite index including sort columns if query operates on large datasets.`,
          });
        }

        // Record unsupported formats
        if (isUnsupported) {
          issuesFound.push({
            query: item.name,
            table: tableName,
            reason: `Unsupported plan output format from database engine`,
            recommendation: `Verify database engine compatibility and supported EXPLAIN output columns.`,
          });
        }
      }
    } catch (err) {
      failedQueries.push({ name: item.name, error: err.message });
      console.error(`❌ Failed EXPLAIN for "${item.name}":`, err.message);
    }
  }

  console.table(resultsTable);

  console.log('\n========================================================================');
  console.log('📊 Summary of Query & Index Audit Findings:');
  console.log('========================================================================\n');

  if (failedQueries.length > 0) {
    console.log(`❌ ${failedQueries.length} query audit(s) FAILED to execute:`);
    for (const f of failedQueries) {
      console.log(`  • [${f.name}]: ${f.error}`);
    }
    console.log('');
  }

  if (issuesFound.length === 0 && failedQueries.length === 0) {
    console.log('🎉 Outstanding! All operational queries across Attendance, Coaching, Workouts, Notifications, Subscriptions, and Payments utilize efficient index lookups with 0 full-table scans.');
  } else {
    if (issuesFound.length > 0) {
      console.log(`⚠️  Identified ${issuesFound.length} optimization opportunities:`);
      for (const issue of issuesFound) {
        console.log(`  • [${issue.query}] on "${issue.table}":`);
        console.log(`    - Issue: ${issue.reason}`);
        console.log(`    - Proposed Fix: ${issue.recommendation}\n`);
      }
    }
  }

  await pool.end();

  if (failedQueries.length > 0) {
    process.exit(1);
  }
}

runExplainAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
