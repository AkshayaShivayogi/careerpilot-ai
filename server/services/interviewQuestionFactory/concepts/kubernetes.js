import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "Kubernetes";

export const kubernetesConcepts = buildTechConcepts(T, [
  { name: "pods and deployments", beginner: "Pod smallest unit; Deployment manages replicas.", intermediate: "Rolling update maxUnavailable.", advanced: "PodDisruptionBudget availability.", mcq: builders.mcq(T, "k8s", "Object to scale stateless app?", ["Pod", "Deployment", "ConfigMap"], "Deployment", "ReplicaSet under hood.") },
  { name: "services networking", beginner: "ClusterIP internal; LoadBalancer external.", intermediate: "DNS core-dns service discovery.", advanced: "Headless service StatefulSet.", coding: builders.coding(T, "Expose deployment port 8080?", "Service selector matching pod labels targetPort.", "Labels critical.", "", "—", "—") },
  { name: "ConfigMap and Secrets", beginner: "Mount env or volumes config.", intermediate: "Secrets base64 not encryption at rest alone.", advanced: "External Secrets Operator vault.", scenario: builders.scenario(T, "config", "Wrong config in prod.", "Separate namespaces; helm values; sealed secrets.", "GitOps review.") },
  { name: "ingress controllers", beginner: "Ingress routes HTTP host/path to services.", intermediate: "TLS cert-manager Let's Encrypt.", advanced: "Gateway API future.", debug: builders.debug(T, "ingress", "404 from ingress.", ["Path rule mismatch", "Delete deployment", "No pods"], "Path rule mismatch", "kubectl describe ingress.") },
  { name: "namespaces RBAC", beginner: "Namespaces isolate resources.", intermediate: "Role RoleBinding least privilege.", advanced: "OPA Gatekeeper policies.", why: "Multi-tenant clusters." },
  { name: "health probes", beginner: "liveness restart; readiness traffic.", intermediate: "startupProbe slow containers.", advanced: "Probe timeouts vs app init.", scenario: builders.scenario(T, "probe", "CrashLoopBackOff.", "Check logs; liveness too aggressive; missing deps.", "Describe pod events.") },
  { name: "resources requests limits", beginner: "requests schedule; limits cap.", intermediate: "OOMKilled exceeds memory limit.", advanced: "VPA HPA autoscaling.", coding: builders.coding(T, "HPA on CPU 70%?", "metrics-server; Deployment target CPU utilization.", "Needs requests set.", "", "—", "—") },
  { name: "StatefulSets volumes", beginner: "Stable pod names PVC per pod.", intermediate: "Ordered deploy scale.", advanced: "Databases operators pattern.", why: "Stateful workloads." },
  { name: "kubectl debugging", beginner: "logs describe exec get events.", intermediate: "ephemeral debug containers.", advanced: "kubectl debug node issues.", bestPractice: { question: "Never run as root in container because?", answer: "Escalation risk; use securityContext runAsNonRoot.", explanation: "Pod security." } },
  { name: "Helm charts", beginner: "Templates values.yaml release.", intermediate: "Chart dependencies subcharts.", advanced: "Helmfile gitops.", scenario: builders.scenario(T, "deploy", "Rollback bad release.", "helm rollback revision; history.", "Atomic releases.") },
  { name: "network policies", beginner: "Deny all default; allow specific labels.", intermediate: "Egress control exfiltration.", advanced: "CNI must support NP.", why: "Zero trust." },
  { name: "cluster upgrades", beginner: "Control plane vs node pools.", intermediate: "Drain cordon nodes maintenance.", advanced: "Blue/green node groups.", why: "SRE interviews." },
]);
