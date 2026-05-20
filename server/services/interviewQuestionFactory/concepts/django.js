import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "Django";

export const djangoConcepts = buildTechConcepts(T, [
  { name: "Django MVT pattern", beginner: "Models Views Templates; URLs route to views.", intermediate: "Class-based views generic ListView.", advanced: "ASGI async views with constraints.", mcq: builders.mcq(T, "django", "ORM lives in which layer?", ["Template", "Model", "URLconf"], "Model", "M of MVT.") },
  { name: "Django ORM queries", beginner: "Model.objects.filter get create.", intermediate: "select_related FK; prefetch_related M2M.", advanced: "annotate aggregate F expressions.", coding: builders.coding(T, "N+1 query problem fix?", "prefetch_related or select_related on queryset.", "django-debug-toolbar.", "O(n)", "O(1) queries") },
  { name: "migrations", beginner: "makemigrations migrate apply schema changes.", intermediate: "Squash migrations carefully.", advanced: "Zero-downtime migrations expand-contract.", scenario: builders.scenario(T, "migrations", "Migration conflict on merge.", "Rename migration; fake initial if needed team sync.", "Communication.") },
  { name: "Django REST Framework", beginner: "Serializers validate in/out JSON.", intermediate: "ViewSets routers CRUD quickly.", advanced: "Permission classes per action.", why: "API interviews." },
  { name: "authentication sessions", beginner: "contrib.auth User model.", intermediate: "Session middleware cookies.", advanced: "JWT with djangorestframework-simplejwt.", debug: builders.debug(T, "auth", "CSRF failure on POST.", ["Missing csrf token", "Wrong DB", "No HTTPS"], "Missing csrf token", "csrf_exempt only for APIs with token auth.") },
  { name: "middleware", beginner: "Request/response pipeline order matters.", intermediate: "Custom middleware logging timing.", advanced: "SecurityMiddleware headers.", scenario: builders.scenario(T, "middleware", "CORS blocked frontend.", "django-cors-headers config ALLOWED_ORIGINS.", "Dev vs prod origins.") },
  { name: "admin and management commands", beginner: "Admin registers models CRUD internal.", intermediate: "Custom actions bulk update.", advanced: "Management commands cron ETL.", coding: builders.coding(T, "Custom user model why?", "Email login; extra fields; AUTH_USER_MODEL early.", "Migration pain if late.", "", "—", "—") },
  { name: "caching", beginner: "cache framework Redis backend.", intermediate: "per-view cache_page decorator.", advanced: "Template fragment caching.", why: "Scale reads." },
  { name: "testing Django", beginner: "TestCase client post get.", intermediate: "Factory Boy fixtures.", advanced: "pytest-django markers.", bestPractice: { question: "Fat models skinny views means?", answer: "Business logic in models/services; views orchestrate.", explanation: "Maintainability." } },
  { name: "security OWASP Django", beginner: "Auto escaping templates XSS.", intermediate: "SQL injection prevented by ORM parameterization.", advanced: "Rate limit login; SECRET_KEY rotation.", scenario: builders.scenario(T, "security", "Mass assignment vulnerability.", "Explicit serializer fields not __all__.", "Whitelist fields.") },
  { name: "deployment WSGI ASGI", beginner: "gunicorn uwsgi behind nginx.", intermediate: "collectstatic whitenoise/S3.", advanced: "Celery background tasks.", why: "Production path." },
  { name: "signals", beginner: "pre_save post_save hooks decoupling.", intermediate: "Avoid heavy logic in signals.", advanced: "Transaction.on_commit for emails.", why: "Side effects pattern." },
]);
