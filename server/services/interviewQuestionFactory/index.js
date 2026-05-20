import { createConceptBank } from "./conceptBank.js";
import { dedupeQuestions, CONTENT_VERSION } from "./utils.js";
import { expandBankToMinimum } from "./bankExpander.js";
import { resolveFactoryTechnology, listResolvableTechnologies } from "./technologyResolver.js";
import { javascriptConcepts } from "./concepts/javascript.js";
import { javaConcepts } from "./concepts/java.js";
import { reactConcepts } from "./concepts/react.js";
import { pythonConcepts } from "./concepts/python.js";
import { sqlConcepts } from "./concepts/sql.js";
import { dsaConcepts } from "./concepts/dsa.js";
import { nodeConcepts } from "./concepts/node.js";
import { mongoConcepts } from "./concepts/mongo.js";
import { springbootConcepts } from "./concepts/springboot.js";
import { cyberConcepts } from "./concepts/cyber.js";
import { expressConcepts } from "./concepts/express.js";
import { nextjsConcepts } from "./concepts/nextjs.js";
import { typescriptConcepts } from "./concepts/typescript.js";
import { htmlConcepts } from "./concepts/html.js";
import { cssConcepts } from "./concepts/css.js";
import { angularConcepts } from "./concepts/angular.js";
import { vueConcepts } from "./concepts/vue.js";
import { djangoConcepts } from "./concepts/django.js";
import { flaskConcepts } from "./concepts/flask.js";
import { phpConcepts } from "./concepts/php.js";
import { laravelConcepts } from "./concepts/laravel.js";
import { mysqlConcepts } from "./concepts/mysql.js";
import { postgresqlConcepts } from "./concepts/postgresql.js";
import { firebaseConcepts } from "./concepts/firebase.js";
import { dockerConcepts } from "./concepts/docker.js";
import { kubernetesConcepts } from "./concepts/kubernetes.js";
import { awsConcepts } from "./concepts/aws.js";
import { linuxConcepts } from "./concepts/linux.js";
import { cicdConcepts } from "./concepts/cicd.js";
import { devopsConcepts } from "./concepts/devops.js";
import {
  oopsConcepts,
  osConcepts,
  dbmsConcepts,
  networksConcepts,
} from "./concepts/fundamentals.js";

/** Isolated banks — no shared generic pools between keys */
const REGISTRY = {
  JavaScript: javascriptConcepts,
  TypeScript: typescriptConcepts,
  HTML: htmlConcepts,
  CSS: cssConcepts,
  React: reactConcepts,
  "Next.js": nextjsConcepts,
  Angular: angularConcepts,
  Vue: vueConcepts,
  Java: javaConcepts,
  "Spring Boot": springbootConcepts,
  Python: pythonConcepts,
  Django: djangoConcepts,
  Flask: flaskConcepts,
  PHP: phpConcepts,
  Laravel: laravelConcepts,
  "Node.js": nodeConcepts,
  Express: expressConcepts,
  MongoDB: mongoConcepts,
  MySQL: mysqlConcepts,
  PostgreSQL: postgresqlConcepts,
  SQL: sqlConcepts,
  Firebase: firebaseConcepts,
  DSA: dsaConcepts,
  Docker: dockerConcepts,
  Kubernetes: kubernetesConcepts,
  AWS: awsConcepts,
  Linux: linuxConcepts,
  "CI/CD": cicdConcepts,
  DevOps: devopsConcepts,
  OOPs: oopsConcepts,
  "Operating Systems": osConcepts,
  DBMS: dbmsConcepts,
  "Computer Networks": networksConcepts,
  cybersecurity: cyberConcepts,
};

export { resolveFactoryTechnology, listResolvableTechnologies, CONTENT_VERSION };

export function listFactoryTechnologies() {
  return Object.keys(REGISTRY).sort();
}

/** Primary API: technology-specific question generation */
export function generateQuestionsByTechnology(technology) {
  const canonical = resolveFactoryTechnology(technology);
  const key = canonical && REGISTRY[canonical] ? canonical : null;
  if (!key) return [];

  const concepts = REGISTRY[key];
  const bank =
    Array.isArray(concepts) && concepts[0]?.question && !concepts[0]?.name
      ? concepts
      : createConceptBank(key, concepts);

  const expanded = expandBankToMinimum(key, dedupeQuestions(bank));
  return expanded.map((item) => ({
    ...item,
    technology: key,
    stream: key,
    contentVersion: CONTENT_VERSION,
  }));
}

/** @deprecated use generateQuestionsByTechnology */
export function generateTechnologyQuestions(technology) {
  return generateQuestionsByTechnology(technology);
}
