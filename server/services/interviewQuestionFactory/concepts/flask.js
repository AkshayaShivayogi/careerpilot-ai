import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "Flask";

export const flaskConcepts = buildTechConcepts(T, [
  { name: "Flask application factory", beginner: "create_app() pattern for config per env.", intermediate: "Blueprints organize routes.", advanced: "Extensions init on app context.", mcq: builders.mcq(T, "flask", "Decorator to register route?", ["@app.route", "@app.model", "@app.db"], "@app.route", "Maps URL to view.") },
  { name: "Jinja2 templates", beginner: "render_template passes context dict.", intermediate: "Template inheritance blocks.", advanced: "Context processors global variables.", scenario: builders.scenario(T, "templates", "XSS in user profile page.", "Autoescape on; sanitize HTML if needed.", "Markup safe only when trusted.") },
  { name: "Flask-SQLAlchemy", beginner: "db.Model classes; db.session commit.", intermediate: "Relationships lazy dynamic.", advanced: "Migrations Flask-Migrate Alembic.", coding: builders.coding(T, "Query users with posts eager load?", "joinedload/selectinload options.", "Avoid N+1.", "O(n)", "O(1) queries") },
  { name: "request context", beginner: "request g current_app proxies.", intermediate: "before_request after_request hooks.", advanced: "Application vs request context.", debug: builders.debug(T, "context", "Working outside of application context.", ["Use app.app_context()", "Delete Flask", "Run sync code"], "Use app.app_context()", "Tests need push context.") },
  { name: "RESTful APIs Flask-RESTful", beginner: "Resource classes methods get post.", intermediate: "Marshmallow schemas validation.", advanced: "OpenAPI via apispec.", why: "Microservice APIs." },
  { name: "authentication Flask-Login", beginner: "login_user logout_user session.", intermediate: "User loader callback.", advanced: "OAuth with Authlib.", scenario: builders.scenario(T, "auth", "Session not persisting.", "SECRET_KEY stable; cookie domain secure settings.", "HTTPS Secure cookie.") },
  { name: "configuration", beginner: "app.config from object/env.", intermediate: "Never commit secrets; use env vars.", advanced: "12-factor app principles.", bestPractice: { question: "Production server for Flask?", answer: "gunicorn/waitress behind reverse proxy not app.run debug.", explanation: "Security." } },
  { name: "error handling", beginner: "@app.errorhandler(404).", intermediate: "JSON errors for API blueprints.", advanced: "Sentry integration.", coding: builders.coding(T, "Centralize API error JSON format?", "Register errorhandlers; custom exception classes.", "Consistent client UX.", "", "—", "—") },
  { name: "testing Flask", beginner: "client = app.test_client().", intermediate: "Fixtures app db session rollback.", advanced: "pytest-flask plugin.", why: "Quality." },
  { name: "CORS and security", beginner: "flask-cors for SPA origins.", intermediate: "CSRF WTForms for server forms.", advanced: "Rate limiting Flask-Limiter.", scenario: builders.scenario(T, "cors", "Frontend can't call API.", "CORS headers allowed origins methods.", "Preflight OPTIONS.") },
  { name: "background tasks", beginner: "Celery + Redis queue long jobs.", intermediate: "RQ simpler alternative.", advanced: "Idempotent tasks with retries.", why: "Async work off request thread." },
  { name: "deployment", beginner: "WSGI entry point app:app.", intermediate: "Docker multi-stage.", advanced: "Health endpoint for k8s.", why: "Ship to prod." },
]);
