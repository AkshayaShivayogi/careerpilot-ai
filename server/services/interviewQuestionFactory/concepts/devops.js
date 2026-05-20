import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "DevOps";

export const devopsConcepts = buildTechConcepts(T, [
  { name: "DevOps culture CALMS", beginner: "Culture automation lean measurement sharing.", intermediate: "Blameless postmortems.", advanced: "Platform team enablement.", mcq: builders.mcq(T, "devops", "Primary goal of DevOps?", ["More meetings", "Faster reliable delivery", "Remove developers"], "Faster reliable delivery", "Collaboration.") },
  { name: "IaC Terraform", beginner: "Declarative desired state plan apply.", intermediate: "State remote S3 locking.", advanced: "Modules reuse DRY.", coding: builders.coding(T, "Prevent terraform state corruption?", "Remote backend lock; no local state team.", "DynamoDB lock.", "", "—", "—") },
  { name: "observability pillars", beginner: "Metrics logs traces.", intermediate: "RED rate errors duration.", advanced: "OpenTelemetry standard.", scenario: builders.scenario(T, "incident", "P1 outage steps?", "Mitigate, comms, timeline, postmortem, action items.", "Incident command.") },
  { name: "SLO SLI error budgets", beginner: "SLI measured; SLO target; budget burn.", intermediate: "Freeze features if budget exhausted.", advanced: "Multi-window burn alerts.", why: "Reliability engineering." },
  { name: "containers orchestration", beginner: "Docker package; K8s orchestrate.", intermediate: "Helm charts deploy.", advanced: "Service mesh istio linkerd.", debug: builders.debug(T, "k8s", "ImagePullBackOff.", ["Wrong tag/registry creds", "CPU low", "DNS always fine"], "Wrong tag/registry creds", "Describe pod.") },
  { name: "GitOps", beginner: "Git single source of truth.", intermediate: "ArgoCD Flux reconcile cluster.", advanced: "PR promotes env branches.", bestPractice: { question: "Immutable infrastructure means?", answer: "Replace servers not SSH patch.", explanation: "Cattle not pets." } },
  { name: "configuration management", beginner: "Ansible ad-hoc playbooks.", intermediate: "Idempotent desired state.", advanced: "Chef Puppet legacy awareness.", why: "Historical breadth." },
  { name: "cloud networking", beginner: "VPC subnets LB security groups.", intermediate: "Zero trust mTLS internal.", advanced: "Hub-spoke transit gateway.", scenario: builders.scenario(T, "network", "Cross-account private access.", "VPC peering endpoints TGW.", "Cloud architect.") },
  { name: "cost optimization FinOps", beginner: "Tag resources owner env.", intermediate: "Rightsize instances schedules.", advanced: "Unit economics per feature.", coding: builders.coding(T, "Autoscale policy?", "CPU/latency/custom metric thresholds cooldown.", "Flapping prevention.", "", "—", "—") },
  { name: "security DevSecOps", beginner: "Shift-left SAST in CI.", intermediate: "Container scan admission.", advanced: "Threat modeling STRIDE.", why: "Security interviews." },
  { name: "disaster recovery", beginner: "RTO RPO definitions.", intermediate: "Backup restore drills quarterly.", advanced: "Multi-region active-active costly.", scenario: builders.scenario(T, "dr", "Region down failover.", "Runbook DNS failover; data replication lag trade.", "Business continuity.") },
  { name: "on-call practices", beginner: "Runbooks alert routing.", intermediate: "Paging policies escalation.", advanced: "Toil reduction automation.", why: "Ops sustainability." },
]);
