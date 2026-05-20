import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "PHP";

export const phpConcepts = buildTechConcepts(T, [
  { name: "PHP types and strict mode", beginner: "declare(strict_types=1) enforces param types.", intermediate: "Scalar type hints return types.", advanced: "Union types PHP 8+.", mcq: builders.mcq(T, "php", "Superglobal for POST data?", ["$_GET", "$_POST", "$_SERVER"], "$_POST", "Form submissions.") },
  { name: "OOP in PHP", beginner: "Classes interfaces traits abstract.", intermediate: "Late static binding static::class.", advanced: "Readonly properties PHP 8.1.", coding: builders.coding(T, "Dependency injection in PHP?", "Constructor type-hint interfaces; container PSR-11.", "Testability.", "", "—", "—") },
  { name: "error handling exceptions", beginner: "try/catch; Throwable base.", intermediate: "Custom exception hierarchy.", advanced: "set_exception_handler production.", debug: builders.debug(T, "errors", "White screen production.", ["display_errors off log errors", "Delete vendor", "Ignore"], "display_errors off log errors", "Check error_log.") },
  { name: "sessions and cookies", beginner: "session_start $_SESSION.", intermediate: "session_regenerate_id on login.", advanced: "Secure httponly samesite cookies.", scenario: builders.scenario(T, "session", "Session fixation attack.", "Regenerate ID post-auth; strict mode.", "Security interview.") },
  { name: "PDO database access", beginner: "Prepared statements prevent SQL injection.", intermediate: "PDO fetch modes associative.", advanced: "Transactions beginTransaction commit.", why: "Every PHP backend role." },
  { name: "Composer autoloading", beginner: "composer.json PSR-4 autoload.", intermediate: "Semantic versioning caret constraints.", advanced: "Private packagist satis.", coding: builders.coding(T, "Avoid autoload performance issues?", "composer dump-autoload -o classmap authoritative.", "Prod optimize.", "", "—", "—") },
  { name: "PHP-FPM and nginx", beginner: "php-fpm pool workers handle requests.", intermediate: "pm.max_children tuning memory.", advanced: "Opcache JIT PHP 8.", scenario: builders.scenario(T, "perf", "502 bad gateway.", "Check fpm slow log; worker exhaustion.", "Scale workers.") },
  { name: "security OWASP PHP", beginner: "htmlspecialchars output encoding.", intermediate: "CSRF tokens in forms.", advanced: "Password_hash PASSWORD_DEFAULT.", why: "Web security." },
  { name: "namespaces and PSR", beginner: "Namespaces avoid class collisions.", intermediate: "PSR-7 HTTP messages interoperability.", advanced: "PSR-15 middleware.", bestPractice: { question: "Why avoid mysql_* deprecated?", answer: "PDO prepared statements safer maintained API.", explanation: "Legacy removal." } },
  { name: "testing PHPUnit", beginner: "assertEquals unit tests.", intermediate: "Mockery for dependencies.", advanced: "Pest expressive syntax.", why: "CI quality." },
  { name: "attributes PHP 8", beginner: "#[Route] metadata reflection.", intermediate: "Replace docblock annotations.", advanced: "Custom attributes validation.", scenario: builders.scenario(T, "modern", "Migrate annotations to attributes.", "Gradual framework support.", "PHP evolution.") },
  { name: "async PHP RoadRunner", beginner: "Traditional PHP request per process.", intermediate: "RoadRunner/Swoole long-running workers awareness.", advanced: "When not to use — complexity.", why: "Senior PHP breadth." },
]);
