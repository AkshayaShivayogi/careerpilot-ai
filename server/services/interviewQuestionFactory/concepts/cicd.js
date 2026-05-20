import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "CI/CD";

export const cicdConcepts = buildTechConcepts(T, [
  { name: "CI vs CD pipeline", beginner: "CI integrates frequently; CD deploys automatically.", intermediate: "Continuous delivery manual gate prod.", advanced: "Continuous deployment fully automated.", mcq: builders.mcq(T, "cicd", "CI primarily validates?", ["Marketing", "Code changes on merge", "DNS"], "Code changes on merge", "Tests build artifacts.") },
  { name: "GitHub Actions workflows", beginner: "on push pull_request triggers jobs.", intermediate: "Matrix builds multiple versions.", advanced: "Reusable workflows secrets.", coding: builders.coding(T, "Cache npm in GHA?", "actions/cache with lockfile key.", "Faster CI.", "", "—", "—") },
  { name: "pipeline stages", beginner: "lint test build deploy order.", intermediate: "Fail fast parallelize independent jobs.", advanced: "DAG dependencies needs.", scenario: builders.scenario(T, "pipeline", "Flaky test blocks releases.", "Quarantine; retry policy; fix root cause.", "Quality gate.") },
  { name: "artifact management", beginner: "Store build outputs docker images jars.", intermediate: "Immutable tags sha not latest.", advanced: "SBOM supply chain.", debug: builders.debug(T, "artifacts", "Wrong version deployed.", ["Promote same artifact", "Rebuild different commit", "Skip tests"], "Promote same artifact", "Traceability.") },
  { name: "deployment strategies", beginner: "Rolling blue-green canary.", intermediate: "Feature flags decouple deploy release.", advanced: "Automated rollback metrics.", why: "Release engineering." },
  { name: "secrets in CI", beginner: "GitHub secrets masked logs.", intermediate: "OIDC cloud deploy without long keys.", advanced: "Vault dynamic credentials.", bestPractice: { question: "Never commit secrets because?", answer: "Scan with gitleaks; rotate if leaked.", explanation: "Git history permanent." } },
  { name: "test gates", beginner: "Unit integration e2e pyramid.", intermediate: "Coverage thresholds quality.", advanced: "Contract tests microservices.", coding: builders.coding(T, "Parallelize Jest in CI?", "shard --shard=1/4 workers.", "Wall clock speed.", "", "—", "—") },
  { name: "infrastructure as code CI", beginner: "terraform plan on PR comment.", intermediate: "Policy checkov tfsec.", advanced: "Atlantis apply workflow.", scenario: builders.scenario(T, "iac", "Drift detected prod.", "Schedule plan; enforce IaC only changes.", "Manual snowflake.") },
  { name: "database migrations CI", beginner: "Run migrations before traffic shift.", intermediate: "Backward compatible expand-contract.", advanced: "Shadow validate.", why: "Safe releases." },
  { name: "monitoring deployments", beginner: "Smoke tests post deploy.", intermediate: "Canary analysis error rate.", advanced: "SLO burn alerts rollback.", why: "SRE loop." },
  { name: "monorepo CI", beginner: "Path filters run affected packages.", intermediate: "Nx turborepo cache.", advanced: "CODEOWNERS review scope.", scenario: builders.scenario(T, "monorepo", "CI 2 hours every PR.", "Affected detection remote cache.", "Developer experience.") },
  { name: "compliance audit", beginner: "Signed commits required.", intermediate: "Approval environments prod.", advanced: "SOC2 evidence collection.", why: "Enterprise." },
]);
