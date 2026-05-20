import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "MySQL";

export const mysqlConcepts = buildTechConcepts(T, [
  { name: "InnoDB vs MyISAM", beginner: "InnoDB transactions FK row-level locking default.", intermediate: "MyISAM table-level locks legacy.", advanced: "Always InnoDB for OLTP.", mcq: builders.mcq(T, "mysql", "Default storage engine modern MySQL?", ["MyISAM", "InnoDB", "Memory"], "InnoDB", "ACID compliance.") },
  { name: "indexes and EXPLAIN", beginner: "B-tree indexes speed WHERE/JOIN.", intermediate: "EXPLAIN ANALYZE reads plan.", advanced: "Covering indexes avoid table lookup.", coding: builders.coding(T, "Slow query on user_id filter?", "Index user_id; verify EXPLAIN uses index.", "Cardinality matters.", "O(log n)", "O(1)") },
  { name: "JOIN types", beginner: "INNER JOIN matching rows; LEFT keeps left all.", intermediate: "Avoid Cartesian product missing ON.", advanced: "Semi-join subquery optimizations.", scenario: builders.scenario(T, "join", "Report query 10x slower after growth.", "Add composite index; rewrite subquery join.", "Profile slow log.") },
  { name: "transactions isolation", beginner: "START TRANSACTION COMMIT ROLLBACK.", intermediate: "REPEATABLE READ default InnoDB.", advanced: "Gap locks phantom reads.", debug: builders.debug(T, "locks", "Deadlock found try restarting.", ["Consistent lock order", "Disable indexes", "Use MyISAM"], "Consistent lock order", "SHOW ENGINE INNODB STATUS.") },
  { name: "normalization", beginner: "3NF reduce redundancy.", intermediate: "Denormalize read-heavy reporting carefully.", advanced: "Star schema for analytics separate.", why: "Schema design interviews." },
  { name: "replication", beginner: "Primary-replica async replication.", intermediate: "Read replicas scaling reads.", advanced: "Group Replication HA.", scenario: builders.scenario(T, "replica", "Replica lag breaks read-your-writes.", "Route session to primary; monitor Seconds_Behind_Master.", "UX consistency.") },
  { name: "partitioning", beginner: "Range/list/hash partitions large tables.", intermediate: "Prune partitions in queries.", advanced: "Not a substitute for indexes.", coding: builders.coding(T, "Pagination deep page OFFSET slow?", "Keyset pagination WHERE id > last.", "Avoid large OFFSET.", "O(1) page", "O(1)") },
  { name: "stored procedures", beginner: "PROCEDURE in DB vs app logic debate.", intermediate: "Migrations harder with heavy SP.", advanced: "Prefer app-layer for testability.", why: "Architecture opinions." },
  { name: "backup and recovery", beginner: "mysqldump logical backup.", intermediate: "Percona XtraBackup physical hot.", advanced: "PITR binlog coordinates.", bestPractice: { question: "Before destructive migration?", answer: "Backup + test restore + rollback plan.", explanation: "Ops safety." } },
  { name: "JSON columns MySQL", beginner: "JSON type functions JSON_EXTRACT.", intermediate: "Functional indexes on paths.", advanced: "Validate schema at app layer.", scenario: builders.scenario(T, "json", "Query JSON attribute slow.", "Generated column index; or normalize.", "Trade-offs.") },
  { name: "connection pooling", beginner: "Too many connections exhaust memory.", intermediate: "ProxySQL connection pool.", advanced: "App-side pool sizing formula.", why: "Scale interviews." },
  { name: "security grants", beginner: "GRANT least privilege per app user.", intermediate: "No root from app.", advanced: "TLS in transit; encrypt at rest.", why: "Compliance." },
]);
