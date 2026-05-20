import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "Laravel";

export const laravelConcepts = buildTechConcepts(T, [
  { name: "Eloquent ORM", beginner: "Model maps table; find where create.", intermediate: "Eager load with() prevents N+1.", advanced: "Scopes global/local query reuse.", mcq: builders.mcq(T, "laravel", "Migration command?", ["php artisan migrate", "composer install", "npm run dev"], "php artisan migrate", "Version schema.") },
  { name: "routing and controllers", beginner: "routes/web.php Route::get.", intermediate: "Route model binding implicit.", advanced: "Route caching production.", coding: builders.coding(T, "API resource controller REST?", "Route::apiResource generates index store etc.", "Convention.", "", "—", "—") },
  { name: "middleware", beginner: "Kernel registers auth cors.", intermediate: "Middleware groups web api.", advanced: "Terminate middleware after response.", scenario: builders.scenario(T, "middleware", "419 CSRF token mismatch.", "Verify @csrf in form; Sanctum SPA config.", "Session domain.") },
  { name: "Blade templates", beginner: "@extends @section @yield.", intermediate: "Components slots props.", advanced: "Blade to string mail.", why: "Server-rendered UI." },
  { name: "validation FormRequest", beginner: "rules() array validates input.", intermediate: "authorize() gate per request.", advanced: "Custom rule objects.", debug: builders.debug(T, "validation", "Mass assignment fillable guarded.", ["$fillable whitelist", "Disable DB", "Use raw SQL only"], "$fillable whitelist", "Guarded $guarded.") },
  { name: "queues and jobs", beginner: "dispatch Job to redis/database queue.", intermediate: "Failed jobs table retry.", advanced: "Horizon monitors workers.", scenario: builders.scenario(T, "queue", "Emails not sending prod.", "Supervisor workers running; failed_jobs inspect.", "Async decoupling.") },
  { name: "Sanctum Passport API auth", beginner: "Sanctum SPA cookie or token.", intermediate: "Passport OAuth2 servers.", advanced: "Token abilities scopes.", why: "API auth interviews." },
  { name: "service container", beginner: "app()->make() resolves bindings.", intermediate: "Interface binding in ServiceProvider.", advanced: "Contextual binding.", bestPractice: { question: "Fat controllers anti-pattern fix?", answer: "Form requests, actions/services, skinny controllers.", explanation: "Laravel best practices." } },
  { name: "events and listeners", beginner: "Event::dispatch decoupled reactions.", intermediate: "Queued listeners async.", advanced: "Model events creating/updating.", coding: builders.coding(T, "Cache config route in prod?", "php artisan config:cache route:cache.", "Deploy script.", "", "—", "—") },
  { name: "testing Laravel", beginner: "Feature tests HTTP endpoints.", intermediate: "RefreshDatabase trait.", advanced: "Pest parallel.", why: "CI pipelines." },
  { name: "deployment Forge Vapor", beginner: "env APP_KEY config cache.", intermediate: "Octane Swoole long-lived.", advanced: "Zero-downtime deploy hooks.", scenario: builders.scenario(T, "deploy", "Storage logs not writable.", "chmod storage bootstrap/cache; correct user.", "Permissions classic.") },
  { name: "Laravel security", beginner: "Bcrypt hashing; CSRF default web.", intermediate: "Policy gates authorization.", advanced: "Rate limit login Route::middleware throttle.", why: "Prod readiness." },
]);
