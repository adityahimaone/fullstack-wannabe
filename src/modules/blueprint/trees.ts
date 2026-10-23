import type { CodeLanguage } from '@/lib/prism';
import type { Stack } from '@/lib/progress';
import type { ErdSchema } from '@/modules/erd/types';
import { migrationSql, pascal, type Ctx } from './ctx';

export interface StackFile {
  path: string;
  step: number;
  language: CodeLanguage;
  note: string;
  code: (ctx: Ctx, schema: ErdSchema) => string;
}

export interface StepMeta {
  step: number;
  name: string;
  short: string;
  teaches: string;
  detail: string;
}

export const STEPS: StepMeta[] = [
  {
    step: 1,
    name: 'Database & Migration',
    short: 'Migration',
    teaches: 'Version-controlled schema, connection pool',
    detail:
      'The ERD becomes a migration file that runs in order, is reversible, and is the only way the schema ever changes. Connection pooling is configured here, not scattered through the app.',
  },
  {
    step: 2,
    name: 'Model / Entity',
    short: 'Model',
    teaches: 'Table → struct/class, tags, relations',
    detail:
      'A model maps one table to one code structure. Column names, JSON keys and ORM relations are declared once, here — everything above this layer speaks in models, not rows.',
  },
  {
    step: 3,
    name: 'Repository / DAL',
    short: 'Repository',
    teaches: 'Queries, eager loading, no business rules',
    detail:
      'The only layer allowed to write queries. It answers "give me rows" and nothing else — no validation, no HTTP, no email. Swapping the ORM should only touch this folder.',
  },
  {
    step: 4,
    name: 'Service / Business Logic',
    short: 'Service',
    teaches: 'Rules, transactions, hashing, errors',
    detail:
      'Where decisions live: is this email unique, is this transition allowed, what happens on failure. Services know nothing about HTTP status codes — they throw typed errors.',
  },
  {
    step: 5,
    name: 'Controller / Handler',
    short: 'Controller',
    teaches: 'Parse HTTP, call service, shape response',
    detail:
      'Thin by design: read the request, validate input, call one service method, map the result to a status code and body. If a controller has an if-statement about business rules, it is in the wrong place.',
  },
  {
    step: 6,
    name: 'Router & REST API',
    short: 'Router',
    teaches: 'Verbs, prefixes, middleware, contracts',
    detail:
      'Routes are the public contract: GET /users, POST /users, GET /users/:id. The router binds verbs to handlers and attaches auth/logging middleware — it contains no logic of its own.',
  },
];

const base = (ctx: Ctx) => ctx.table.replace(/s$/, '') || ctx.table;
const goName = (n: string) => (n === 'id' ? 'ID' : pascal(n).replace(/Id$/, 'ID'));

function goFields(ctx: Ctx) {
  return ctx.fields
    .map((f) => `\t${goName(f.name)} ${f.go} \`gorm:"column:${f.name}" json:"${f.name}"\``)
    .join('\n');
}

function tsFields(ctx: Ctx) {
  return ctx.fields.map((f) => `  ${f.camel}: ${f.ts}${f.nullable ? ' | null' : ''};`).join('\n');
}

function prismaFields(ctx: Ctx) {
  return ctx.fields
    .map((f) => `  ${f.camel.padEnd(10)} ${f.prisma}${f.nullable ? '?' : ''}  @map("${f.name}")`)
    .join('\n');
}

function phpFillable(ctx: Ctx) {
  return ctx.fields.map((f) => `'${f.name}'`).join(', ');
}

function zodFields(ctx: Ctx) {
  return ctx.fields
    .map((f) => {
      const base =
        f.raw === 'INT' || f.raw === 'BIGINT' || f.raw === 'DECIMAL'
          ? 'z.number()'
          : f.raw === 'BOOLEAN'
            ? 'z.boolean()'
            : f.raw === 'TIMESTAMP' || f.raw === 'DATE'
              ? 'z.coerce.date()'
              : f.raw === 'JSON'
                ? 'z.record(z.unknown())'
                : 'z.string().min(1)';
      return `  ${f.camel}: ${base}${f.nullable ? '.optional()' : ''},`;
    })
    .join('\n');
}

function tsSample(ctx: Ctx) {
  return ctx.fields
    .map((f) =>
      f.raw === 'BOOLEAN'
        ? `${f.camel}: true`
        : f.raw === 'INT' || f.raw === 'BIGINT' || f.raw === 'DECIMAL'
          ? `${f.camel}: 1`
          : f.raw === 'TIMESTAMP' || f.raw === 'DATE'
            ? `${f.camel}: new Date()`
            : `${f.camel}: "sample"`,
    )
    .join(', ');
}

function phpBlueprintColumn(ctx: Ctx) {
  return ctx.fields
    .map((f) => {
      const nullable = f.nullable ? '->nullable()' : '';
      switch (f.raw) {
        case 'INT':
          return `            $table->integer('${f.name}')${nullable};`;
        case 'BIGINT':
          return `            $table->bigInteger('${f.name}')${nullable};`;
        case 'BOOLEAN':
          return `            $table->boolean('${f.name}')->default(false);`;
        case 'TEXT':
          return `            $table->text('${f.name}')${nullable};`;
        case 'TIMESTAMP':
          return `            $table->timestamp('${f.name}')${nullable};`;
        case 'DATE':
          return `            $table->date('${f.name}')${nullable};`;
        case 'DECIMAL':
          return `            $table->decimal('${f.name}', ${f.precision ?? 10}, ${f.scale ?? 2})${nullable};`;
        case 'UUID':
          return `            $table->uuid('${f.name}')${nullable};`;
        case 'JSON':
          return `            $table->json('${f.name}')${nullable};`;
        default:
          return `            $table->string('${f.name}', ${f.length ?? 255})${nullable};`;
      }
    })
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* GO — Standard layout + clean architecture                           */
/* ------------------------------------------------------------------ */
function goFiles(): StackFile[] {
  return [
    {
      path: 'migrations/000001_create_{table}.up.sql',
      step: 1,
      language: 'sql',
      note: 'Migrations are the only sanctioned way to change a schema. Up and down, in order, committed to git — never a manual ALTER in production.',
      code: (_ctx, schema) => migrationSql(schema, _ctx),
    },
    {
      path: 'internal/config/database.go',
      step: 1,
      language: 'go',
      note: 'One place opens the pool. Handlers and repositories never call sql.Open — they receive a *gorm.DB that is already pooled and configured.',
      code: () => `package config

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDatabase() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is required")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("database connection failed: ", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("pool setup failed: ", err)
	}
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db
}`,
    },
    {
      path: 'internal/domain/{base}.go',
      step: 2,
      language: 'go',
      note: 'The entity lives in internal/ so the compiler stops any other module importing it. Struct tags carry the mapping: gorm for the column, json for the wire.',
      code: (ctx) => `package domain

import "time"

// ${ctx.model} maps the ${ctx.table} table.
type ${ctx.model} struct {
	${goName(ctx.pk)} ${ctx.pkGo} \`gorm:"primaryKey" json:"${ctx.pk}"\`
${goFields(ctx)}
${ctx.hasTimestamps ? '\tCreatedAt time.Time `json:"created_at"`\n\tUpdatedAt time.Time `json:"updated_at"`' : ''}
}

func (${ctx.model}) TableName() string { return "${ctx.table}" }`,
    },
    {
      path: 'internal/repository/{base}_repository.go',
      step: 3,
      language: 'go',
      note: 'Data access only. The interface is declared here and consumed by the service, which is what makes the service testable with a fake repository.',
      code: (ctx) => `package repository

import (
	"context"

	"gorm.io/gorm"

	"my-go-api/internal/domain"
)

type ${ctx.model}Repository interface {
	FindAll(ctx context.Context) ([]domain.${ctx.model}, error)
	FindByID(ctx context.Context, id ${ctx.pkGo}) (*domain.${ctx.model}, error)
	Create(ctx context.Context, m *domain.${ctx.model}) error
	Update(ctx context.Context, m *domain.${ctx.model}) error
	Delete(ctx context.Context, id ${ctx.pkGo}) error
}

type ${base(ctx)}Repository struct {
	db *gorm.DB
}

func New${ctx.model}Repository(db *gorm.DB) ${ctx.model}Repository {
	return &${base(ctx)}Repository{db: db}
}

func (r *${base(ctx)}Repository) FindAll(ctx context.Context) ([]domain.${ctx.model}, error) {
	var rows []domain.${ctx.model}
	err := r.db.WithContext(ctx).Order("${ctx.pk} ASC").Find(&rows).Error
	return rows, err
}

func (r *${base(ctx)}Repository) FindByID(ctx context.Context, id ${ctx.pkGo}) (*domain.${ctx.model}, error) {
	var row domain.${ctx.model}
	if err := r.db.WithContext(ctx).First(&row, id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *${base(ctx)}Repository) Create(ctx context.Context, m *domain.${ctx.model}) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *${base(ctx)}Repository) Update(ctx context.Context, m *domain.${ctx.model}) error {
	return r.db.WithContext(ctx).Save(m).Error
}

func (r *${base(ctx)}Repository) Delete(ctx context.Context, id ${ctx.pkGo}) error {
	return r.db.WithContext(ctx).Delete(&domain.${ctx.model}{}, id).Error
}`,
    },
    {
      path: 'internal/service/{base}_service.go',
      step: 4,
      language: 'go',
      note: 'Business rules and typed errors. Notice there is no gin.Context here — that is the test: if it mentions HTTP, it belongs a layer up.',
      code: (ctx) => `package service

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"my-go-api/internal/domain"
	"my-go-api/internal/repository"
)

var (
	Err${ctx.model}NotFound = errors.New("${base(ctx)} not found")
	ErrInvalidInput   = errors.New("invalid input")
)

type ${ctx.model}Service struct {
	repo repository.${ctx.model}Repository
}

func New${ctx.model}Service(repo repository.${ctx.model}Repository) *${ctx.model}Service {
	return &${ctx.model}Service{repo: repo}
}

func (s *${ctx.model}Service) List(ctx context.Context) ([]domain.${ctx.model}, error) {
	return s.repo.FindAll(ctx)
}

func (s *${ctx.model}Service) Get(ctx context.Context, id ${ctx.pkGo}) (*domain.${ctx.model}, error) {
	row, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, Err${ctx.model}NotFound
		}
		return nil, err
	}
	return row, nil
}

func (s *${ctx.model}Service) Create(ctx context.Context, in domain.${ctx.model}) (*domain.${ctx.model}, error) {
	// validation belongs here, not in the handler
	if err := s.repo.Create(ctx, &in); err != nil {
		return nil, err
	}
	return &in, nil
}`,
    },
    {
      path: 'internal/handler/{base}_handler.go',
      step: 5,
      language: 'go',
      note: 'HTTP in, HTTP out. Bind, call one service method, translate the typed error into a status code. No queries, no rules.',
      code: (ctx) => `package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"my-go-api/internal/domain"
	"my-go-api/internal/service"
	"my-go-api/pkg/response"
)

type ${ctx.model}Handler struct {
	svc *service.${ctx.model}Service
}

func New${ctx.model}Handler(svc *service.${ctx.model}Service) *${ctx.model}Handler {
	return &${ctx.model}Handler{svc: svc}
}

func (h *${ctx.model}Handler) List(c *gin.Context) {
	rows, err := h.svc.List(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	response.OK(c, rows)
}

func (h *${ctx.model}Handler) Show(c *gin.Context) {
	parsed, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid_id", "id must be numeric")
		return
	}
	row, err := h.svc.Get(c.Request.Context(), ${ctx.pkGo}(parsed))
	if err != nil {
		if errors.Is(err, service.Err${ctx.model}NotFound) {
			response.Error(c, http.StatusNotFound, "not_found", err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	response.OK(c, row)
}

func (h *${ctx.model}Handler) Create(c *gin.Context) {
	var in domain.${ctx.model}
	if err := c.ShouldBindJSON(&in); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	row, err := h.svc.Create(c.Request.Context(), in)
	if err != nil {
		response.Error(c, http.StatusUnprocessableEntity, "unprocessable", err.Error())
		return
	}
	response.Created(c, row)
}`,
    },
    {
      path: 'internal/routes/routes.go',
      step: 6,
      language: 'go',
      note: 'The composition root of the HTTP layer: build repository → service → handler, then bind verbs. Dependency injection happens here, once.',
      code: (ctx) => `package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"my-go-api/internal/handler"
	"my-go-api/internal/repository"
	"my-go-api/internal/service"
)

func Register(r *gin.Engine, db *gorm.DB) {
	repo := repository.New${ctx.model}Repository(db)
	svc := service.New${ctx.model}Service(repo)
	h := handler.New${ctx.model}Handler(svc)

	api := r.Group("/api/v1")
	{
		${ctx.table} := api.Group("/${ctx.table}")
		{
			${ctx.table}.GET("", h.List)
			${ctx.table}.GET("/:id", h.Show)
			${ctx.table}.POST("", h.Create)
		}
	}
}`,
    },
    {
      path: 'pkg/response/json.go',
      step: 0,
      language: 'go',
      note: 'Shared, boring, reused everywhere. A single response envelope means every endpoint fails the same way — which is what clients actually need.',
      code: () => `package response

import "github.com/gin-gonic/gin"

type Envelope struct {
	Data any \`json:"data,omitempty"\`
	Error *APIError \`json:"error,omitempty"\`
}

type APIError struct {
	Code    string \`json:"code"\`
	Message string \`json:"message"\`
}

func OK(c *gin.Context, data any) {
	c.JSON(200, Envelope{Data: data})
}

func Created(c *gin.Context, data any) {
	c.JSON(201, Envelope{Data: data})
}

func Error(c *gin.Context, status int, code, message string) {
	c.JSON(status, Envelope{Error: &APIError{Code: code, Message: message}})
}`,
    },
    {
      path: 'cmd/api/main.go',
      step: 0,
      language: 'go',
      note: 'cmd/ holds entrypoints. main.go wires config and routes, then serves — nothing else lives here.',
      code: () => `package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"my-go-api/internal/config"
	"my-go-api/internal/routes"
)

func main() {
	db := config.ConnectDatabase()

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	routes.Register(r, db)

	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}`,
    },
    {
      path: 'go.mod',
      step: 0,
      language: 'go',
      note: 'Module path defines the import prefix used across internal/.',
      code: () => `module my-go-api

go 1.23

require (
	github.com/gin-gonic/gin v1.10.0
	gorm.io/driver/postgres v1.5.9
	gorm.io/gorm v1.25.12
)`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* NODE — modular Express + Prisma                                     */
/* ------------------------------------------------------------------ */
function nodeFiles(): StackFile[] {
  return [
    {
      path: 'prisma/schema.prisma',
      step: 1,
      language: 'text',
      note: 'Prisma owns the schema and the migration history. `prisma migrate dev` diffs this file into SQL — it is the source of truth, not the database.',
      code: (ctx) => `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ${ctx.model} {
  ${ctx.pk}        ${ctx.pkRaw === 'INT' ? 'Int' : 'BigInt'}     @id @default(autoincrement())
${prismaFields(ctx)}

  @@map("${ctx.table}")
}`,
    },
    {
      path: 'src/config/db.ts',
      step: 1,
      language: 'typescript',
      note: 'One PrismaClient instance for the process. Creating a client per request exhausts connections — a classic Node mistake.',
      code: () => `import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

export const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'query' }],
});

prisma.$on('query', (e) => {
  if (e.duration > 150) logger.warn('slow query', { sql: e.query, ms: e.duration });
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});`,
    },
    {
      path: 'src/modules/{base}/{base}.types.ts',
      step: 2,
      language: 'typescript',
      note: 'Types and validation live together. Zod gives you runtime safety at the boundary and TypeScript types for free — no duplicated interfaces.',
      code: (ctx) => `import { z } from 'zod';

export const create${ctx.model}Schema = z.object({
${zodFields(ctx)}
});

export const update${ctx.model}Schema = create${ctx.model}Schema.partial();

export type Create${ctx.model}Input = z.infer<typeof create${ctx.model}Schema>;
export type Update${ctx.model}Input = z.infer<typeof update${ctx.model}Schema>;

export interface ${ctx.model} {
  ${ctx.pk}: ${ctx.pkTs};
${tsFields(ctx)}
}`,
    },
    {
      path: 'src/modules/{base}/{base}.repository.ts',
      step: 3,
      language: 'typescript',
      note: 'Every Prisma call lives in this file. Services never import prisma directly, so the data layer stays swappable and mockable.',
      code: (ctx) => `import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';

export class ${ctx.model}Repository {
  findAll() {
    return prisma.${base(ctx)}.findMany({ orderBy: { ${ctx.pk}: 'asc' } });
  }

  findById(id: ${ctx.pkTs}) {
    return prisma.${base(ctx)}.findUnique({ where: { ${ctx.pk}: id } });
  }

  create(data: Prisma.${ctx.model}CreateInput) {
    return prisma.${base(ctx)}.create({ data });
  }

  update(id: ${ctx.pkTs}, data: Prisma.${ctx.model}UpdateInput) {
    return prisma.${base(ctx)}.update({ where: { ${ctx.pk}: id }, data });
  }

  delete(id: ${ctx.pkTs}) {
    return prisma.${base(ctx)}.delete({ where: { ${ctx.pk}: id } });
  }
}

export const ${base(ctx)}Repository = new ${ctx.model}Repository();`,
    },
    {
      path: 'src/modules/{base}/{base}.service.ts',
      step: 4,
      language: 'typescript',
      note: 'Rules, transactions and typed errors. This layer never sees req or res — it can be called from a CLI, a queue worker, or a test.',
      code: (ctx) => `import { NotFoundError } from '../../lib/errors';
import { ${base(ctx)}Repository } from './${base(ctx)}.repository';
import type { Create${ctx.model}Input, Update${ctx.model}Input } from './${base(ctx)}.types';

export class ${ctx.model}Service {
  constructor(private readonly repo = ${base(ctx)}Repository) {}

  async list() {
    return this.repo.findAll();
  }

  async get(id: ${ctx.pkTs}) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('${ctx.model}', String(id));
    return row;
  }

  async create(input: Create${ctx.model}Input) {
    return this.repo.create(input as never);
  }

  async update(id: ${ctx.pkTs}, input: Update${ctx.model}Input) {
    await this.get(id);
    return this.repo.update(id, input as never);
  }

  async remove(id: ${ctx.pkTs}) {
    await this.get(id);
    return this.repo.delete(id);
  }
}

export const ${base(ctx)}Service = new ${ctx.model}Service();`,
    },
    {
      path: 'src/modules/{base}/{base}.controller.ts',
      step: 5,
      language: 'typescript',
      note: 'Parse → validate → call service → respond. The try/catch only forwards to the global error middleware; it never builds error JSON itself.',
      code: (ctx) => `import type { NextFunction, Request, Response } from 'express';
import { ${base(ctx)}Service } from './${base(ctx)}.service';
import { create${ctx.model}Schema, update${ctx.model}Schema } from './${base(ctx)}.types';

export const ${base(ctx)}Controller = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await ${base(ctx)}Service.list();
      res.json({ data: rows });
    } catch (err) {
      next(err);
    }
  },

  show: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const row = await ${base(ctx)}Service.get(Number(req.params.id));
      res.json({ data: row });
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = create${ctx.model}Schema.parse(req.body);
      const row = await ${base(ctx)}Service.create(input);
      res.status(201).json({ data: row });
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = update${ctx.model}Schema.parse(req.body);
      const row = await ${base(ctx)}Service.update(Number(req.params.id), input);
      res.json({ data: row });
    } catch (err) {
      next(err);
    }
  },

  destroy: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ${base(ctx)}Service.remove(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};`,
    },
    {
      path: 'src/modules/{base}/{base}.routes.ts',
      step: 6,
      language: 'typescript',
      note: 'A feature-scoped router: mount it once in app.ts and the whole module is exposed. Auth middleware goes here, per-route or per-router.',
      code: (ctx) => `import { Router } from 'express';
import { ${base(ctx)}Controller } from './${base(ctx)}.controller';

export const ${base(ctx)}Router = Router();

${base(ctx)}Router.get('/', ${base(ctx)}Controller.list);
${base(ctx)}Router.get('/:id', ${base(ctx)}Controller.show);
${base(ctx)}Router.post('/', ${base(ctx)}Controller.create);
${base(ctx)}Router.put('/:id', ${base(ctx)}Controller.update);
${base(ctx)}Router.delete('/:id', ${base(ctx)}Controller.destroy);`,
    },
    {
      path: 'src/app.ts',
      step: 0,
      language: 'typescript',
      note: 'Express app assembly: global middleware first, then route mounting, then the error handler last — order matters.',
      code: (ctx) => `import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { ${base(ctx)}Router } from './modules/${base(ctx)}/${base(ctx)}.routes';
import { errorHandler } from './middlewares/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? [] }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1/${ctx.table}', ${base(ctx)}Router);

app.use(errorHandler);`,
    },
    {
      path: 'src/middlewares/error.middleware.ts',
      step: 0,
      language: 'typescript',
      note: 'The single place that turns any thrown error into an HTTP response. Zod, domain and unknown errors all land here.',
      code: () => `import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.headers['x-request-id'] ?? crypto.randomUUID();

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: { code: 'validation_error', message: 'Invalid input', fields: err.flatten().fieldErrors },
      requestId,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
      requestId,
    });
  }

  logger.error('unhandled error', { err, requestId });
  return res.status(500).json({
    error: { code: 'internal_error', message: 'Something went wrong' },
    requestId,
  });
}`,
    },
    {
      path: 'package.json',
      step: 0,
      language: 'json',
      note: 'Scripts are the developer interface: dev, build, migrate, test. Keep them honest.',
      code: () => `{
  "name": "my-node-api",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "migrate": "prisma migrate dev",
    "test": "vitest run"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "helmet": "^8.0.0",
    "zod": "^3.24.0"
  }
}`,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* PHP — Laravel 11 + service/repository                               */
/* ------------------------------------------------------------------ */
function phpFiles(): StackFile[] {
  return [
    {
      path: 'database/migrations/2026_01_01_000000_create_{table}_table.php',
      step: 1,
      language: 'php',
      note: 'Laravel migrations are timestamped classes with up() and down(). The filename order is the execution order.',
      code: (ctx) => `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('${ctx.table}', function (Blueprint $table) {
            $table->id();
${phpBlueprintColumn(ctx)}
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('${ctx.table}');
    }
};`,
    },
    {
      path: 'app/Models/{model}.php',
      step: 2,
      language: 'php',
      note: 'Eloquent models declare mass-assignment and casting. $fillable is a security boundary — never use $guarded = [].',
      code: (ctx) => `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class ${ctx.model} extends Model
{
    use HasFactory;

    protected $table = '${ctx.table}';

    protected $fillable = [${phpFillable(ctx)}];

    protected $casts = [
${ctx.fields
  .filter((f) => ['BOOLEAN', 'DECIMAL', 'JSON', 'TIMESTAMP', 'DATE'].includes(f.raw))
  .map((f) => `        '${f.name}' => '${f.raw === 'BOOLEAN' ? 'boolean' : f.raw === 'DECIMAL' ? 'float' : f.raw === 'JSON' ? 'array' : 'datetime'}',`)
  .join('\n')}
    ];
}`,
    },
    {
      path: 'app/Repositories/{model}Repository.php',
      step: 3,
      language: 'php',
      note: 'Eloquent queries isolated behind a class. When a query gets expensive you optimise it here, and no controller changes.',
      code: (ctx) => `<?php

namespace App\\Repositories;

use App\\Models\\${ctx.model};
use Illuminate\\Database\\Eloquent\\Collection;

class ${ctx.model}Repository
{
    public function all(): Collection
    {
        return ${ctx.model}::query()->orderBy('${ctx.pk}')->get();
    }

    public function find(int $id): ?${ctx.model}
    {
        return ${ctx.model}::query()->find($id);
    }

    public function create(array $data): ${ctx.model}
    {
        return ${ctx.model}::query()->create($data);
    }

    public function update(${ctx.model} $model, array $data): ${ctx.model}
    {
        $model->fill($data)->save();
        return $model->refresh();
    }

    public function delete(${ctx.model} $model): void
    {
        $model->delete();
    }
}`,
    },
    {
      path: 'app/Services/{model}Service.php',
      step: 4,
      language: 'php',
      note: 'Business rules, transactions, exceptions. Constructor injection is resolved by Laravel’s container automatically.',
      code: (ctx) => `<?php

namespace App\\Services;

use App\\Models\\${ctx.model};
use App\\Repositories\\${ctx.model}Repository;
use Illuminate\\Database\\Eloquent\\Collection;
use Illuminate\\Database\\Eloquent\\ModelNotFoundException;
use Illuminate\\Support\\Facades\\DB;

class ${ctx.model}Service
{
    public function __construct(
        private readonly ${ctx.model}Repository $repository,
    ) {}

    public function list(): Collection
    {
        return $this->repository->all();
    }

    public function find(int $id): ${ctx.model}
    {
        return $this->repository->find($id)
            ?? throw new ModelNotFoundException('${ctx.model} ${ctx.pk} not found');
    }

    public function create(array $data): ${ctx.model}
    {
        return DB::transaction(fn () => $this->repository->create($data));
    }

    public function update(int $id, array $data): ${ctx.model}
    {
        $model = $this->find($id);
        return DB::transaction(fn () => $this->repository->update($model, $data));
    }

    public function delete(int $id): void
    {
        $this->repository->delete($this->find($id));
    }
}`,
    },
    {
      path: 'app/Http/Controllers/Api/V1/{model}Controller.php',
      step: 5,
      language: 'php',
      note: 'A thin controller: authorize, delegate, return a Resource. Laravel resolves the service through the container.',
      code: (ctx) => `<?php

namespace App\\Http\\Controllers\\Api\\V1;

use App\\Http\\Controllers\\Controller;
use App\\Http\\Requests\\Store${ctx.model}Request;
use App\\Http\\Resources\\${ctx.model}Resource;
use App\\Services\\${ctx.model}Service;
use Illuminate\\Http\\JsonResponse;

class ${ctx.model}Controller extends Controller
{
    public function __construct(
        private readonly ${ctx.model}Service $service,
    ) {}

    public function index(): JsonResponse
    {
        return ${ctx.model}Resource::collection($this->service->list())->response();
    }

    public function store(Store${ctx.model}Request $request): JsonResponse
    {
        $model = $this->service->create($request->validated());

        return ${ctx.model}Resource::make($model)
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): JsonResponse
    {
        return ${ctx.model}Resource::make($this->service->find($id))->response();
    }

    public function update(Store${ctx.model}Request $request, int $id): JsonResponse
    {
        return ${ctx.model}Resource::make(
            $this->service->update($id, $request->validated())
        )->response();
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return response()->json(null, 204);
    }
}`,
    },
    {
      path: 'routes/api.php',
      step: 6,
      language: 'php',
      note: 'api.php is loaded with the /api prefix automatically. Group by version so v2 can live beside v1.',
      code: (ctx) => `<?php

use App\\Http\\Controllers\\Api\\V1\\${ctx.model}Controller;
use Illuminate\\Support\\Facades\\Route;

Route::prefix('v1')->group(function () {
    Route::apiResource('${ctx.table}', ${ctx.model}Controller::class);
});`,
    },
    {
      path: 'app/Http/Requests/Store{model}Request.php',
      step: 0,
      language: 'php',
      note: 'FormRequests validate before the controller runs. A failed validation never reaches your business logic.',
      code: (ctx) => `<?php

namespace App\\Http\\Requests;

use Illuminate\\Foundation\\Http\\FormRequest;

class Store${ctx.model}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
${ctx.fields
  .map((f) => {
    const rules =
      f.raw === 'BOOLEAN'
        ? "'boolean'"
        : f.raw === 'INT' || f.raw === 'BIGINT'
          ? "'integer'"
          : f.raw === 'DECIMAL'
            ? "'numeric'"
            : f.raw === 'TIMESTAMP' || f.raw === 'DATE'
              ? "'date'"
              : `'string', 'max:${f.length ?? 255}'`;
    return `            '${f.name}' => ['${f.nullable ? 'nullable' : 'required'}', ${rules}],`;
  })
  .join('\n')}
        ];
    }
}`,
    },
    {
      path: 'app/Http/Resources/{model}Resource.php',
      step: 0,
      language: 'php',
      note: 'The transformation layer between Eloquent and JSON. It is your API contract — the database can change without breaking clients.',
      code: (ctx) => `<?php

namespace App\\Http\\Resources;

use Illuminate\\Http\\Request;
use Illuminate\\Http\\Resources\\Json\\JsonResource;

class ${ctx.model}Resource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            '${ctx.pk}' => $this->${ctx.pk},
${ctx.fields.map((f) => `            '${f.name}' => $this->${f.name},`).join('\n')}
        ];
    }
}`,
    },
    {
      path: 'composer.json',
      step: 0,
      language: 'json',
      note: 'Autoloading plus scripts. `php artisan serve` for dev, `php artisan migrate` for schema.',
      code: () => `{
  "name": "my/laravel-api",
  "require": {
    "php": "^8.3",
    "laravel/framework": "^11.0"
  },
  "scripts": {
    "dev": "php artisan serve",
    "migrate": "php artisan migrate",
    "test": "php artisan test"
  }
}`,
    },
  ];
}

/**
 * Blueprint only generates server-side layers. The Frontend TS track lives in the
 * Dojo, so it resolves to Node.js here rather than silently falling through to PHP.
 */
export function blueprintStack(stack: Stack): 'go' | 'node' | 'php' {
  return stack === 'frontend' ? 'node' : stack;
}

export function stackFiles(stack: Stack): StackFile[] {
  switch (blueprintStack(stack)) {
    case 'go':
      return goFiles();
    case 'php':
      return phpFiles();
    default:
      return nodeFiles();
  }
}

/** Resolve `{table}` / `{base}` placeholders in a path. */
export function resolvePath(path: string, ctx: Ctx): string {
  return path.replace(/\{table\}/g, ctx.table).replace(/\{base\}/g, base(ctx)).replace(/\{model\}/g, ctx.model);
}

export function resolveCode(file: StackFile, ctx: Ctx, schema: ErdSchema): string {
  return file.code(ctx, schema);
}

export function samplePayload(ctx: Ctx) {
  return `{ ${tsSample(ctx)} }`;
}
