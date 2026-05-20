import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "Firebase";

export const firebaseConcepts = buildTechConcepts(T, [
  { name: "Firebase Authentication", beginner: "Email Google phone providers.", intermediate: "ID token verify on backend Admin SDK.", advanced: "Custom claims roles RBAC.", mcq: builders.mcq(T, "auth", "Client SDK returns which token?", ["Session cookie only", "ID token JWT", "API key"], "ID token JWT", "Verify server-side.") },
  { name: "Cloud Firestore", beginner: "Document/collection NoSQL model.", intermediate: "Realtime listeners onSnapshot.", advanced: "Offline persistence mobile.", coding: builders.coding(T, "Query posts where authorId==uid?", "where('authorId','==',uid) composite index if sort.", "Index errors link.", "", "—", "—") },
  { name: "security rules", beginner: "rules_version match /databases/{db}/documents.", intermediate: "request.auth.uid ownership checks.", advanced: "Test rules emulator suite.", scenario: builders.scenario(T, "rules", "User reads others private docs.", "Tighten match resource.data.owner == auth.uid.", "Rules not filters.") },
  { name: "Cloud Functions", beginner: "Triggers onWrite HTTPS callable.", intermediate: "Cold starts min instances.", advanced: "Idempotent functions retries.", debug: builders.debug(T, "functions", "Function permission denied.", ["Service account roles", "Disable auth", "Use open rules"], "Service account roles", "IAM.") },
  { name: "Firebase Storage", beginner: "Upload files metadata rules.", intermediate: "Signed URLs temporary access.", advanced: "Virus scan cloud function.", why: "Media apps." },
  { name: "Realtime Database", beginner: "JSON tree legacy; deep paths bad.", intermediate: "Flat structure denormalize.", advanced: "Prefer Firestore for new apps.", why: "Product choice." },
  { name: "Hosting and CDN", beginner: "firebase deploy hosting SPA.", intermediate: "Rewrites to cloud functions.", advanced: "Multi-site targets.", bestPractice: { question: "API keys in client safe?", answer: "Firebase API key not secret; protect with rules/auth.", explanation: "Common misconception." } },
  { name: "FCM push notifications", beginner: "Firebase Cloud Messaging tokens.", intermediate: "Topic subscriptions broadcast.", advanced: "Data vs notification payloads.", scenario: builders.scenario(T, "fcm", "iOS pushes not delivered.", "APNs cert; token refresh; background modes.", "Platform quirks.") },
  { name: "Analytics Crashlytics", beginner: "Crash reports stack traces.", intermediate: "Breadcrumbs user flows.", advanced: "BigQuery export events.", why: "Mobile ops." },
  { name: "cost and quotas", beginner: "Reads writes deletes billed.", intermediate: "Batch writes reduce ops.", advanced: "Denormalize to cut reads.", coding: builders.coding(T, "Pagination Firestore efficiently?", "startAfter cursor not offset.", "No offset support.", "", "—", "—") },
  { name: "emulator suite", beginner: "Local auth firestore functions emulators.", intermediate: "CI integration tests.", advanced: "Import/export seed data.", why: "Dev velocity." },
  { name: "Firebase + web frameworks", beginner: "initializeApp config.", intermediate: "Modular SDK tree-shake v9.", advanced: "App Check attestation abuse.", scenario: builders.scenario(T, "abuse", "Scraping public API.", "App Check + rate limits + rules.", "Defense layers.") },
]);
