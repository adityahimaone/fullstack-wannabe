# 🚀 Project Plan: Fullstack Wannabe

## 1. Project Overview & Vision
**Fullstack Wannabe** is an interactive, gamified educational platform and developer sandbox built with **Vite + React + TypeScript** and **shadcn/ui**. It is designed to take aspiring developers from database design to mastering language data structures and building production-ready REST APIs—all within a sleek, responsive dashboard that works seamlessly on both desktop and mobile devices.

Instead of passively watching tutorials, users actively:
1. Build **Entity-Relationship Diagrams (ERDs)** and watch them compile into live **SQL DDL**.
2. Play through a comprehensive **SQL Gamification Arena** using real datasets.
3. Master **Language Properties & Data Structures** (like Go `map`/slices, JS Promises/Array methods, and PHP Collections) in an interactive coding dojo.
4. Follow an interactive **Backend Architecture Flow & Folder Tree Explorer** (from Database Model to REST API Endpoint) across **Go**, **Node.js**, and **PHP**.

---

## 2. Core Modules & Feature Specifications

### Module 1: Interactive ERD & Schema Builder ("Architect Mode")
A visual canvas where users design database architectures and see the underlying SQL generated in real time.

*   **Visual Canvas (Drag-and-Drop & Touch-Friendly):**
    *   Create, rename, and delete **Tables (Entities)**.
    *   Manage **Columns (Attributes)**: Define data types (`INT`, `VARCHAR`, `TEXT`, `BOOLEAN`, `TIMESTAMP`, `UUID`, `DECIMAL`), constraints (`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, `DEFAULT`), and auto-increment rules.
*   **Relationship Connector:**
    *   Draw connection lines between table columns to define relationships:
        *   **One-to-One ($1:1$)**
        *   **One-to-Many ($1:N$)**
        *   **Many-to-Many ($N:M$)** — *Automatically suggests or generates a pivot/junction table!*
    *   Configure `ON DELETE` and `ON UPDATE` actions (`CASCADE`, `SET NULL`, `RESTRICT`).
*   **Real-Time SQL Generator (Live Split-Pane / Drawer on Mobile):**
    *   As nodes and edges are modified on the canvas, an adjacent `shadcn/ui` Tabs & Code viewer updates instantly with raw SQL DDL (`CREATE TABLE`, `ALTER TABLE`, `ADD CONSTRAINT`).
    *   Support dialect switching: **PostgreSQL**, **MySQL**, and **SQLite**.
*   **Dummy Data Seeder:**
    *   A "Seed Table" button that auto-populates the user's custom ERD tables with realistic dummy data (using Faker.js) so they can immediately query their own schema in Module 2.

---

### Module 2: Gamified SQL Playground ("Query Master Arena")
An interactive, story-driven SQL learning game backed by an in-browser SQL engine running against rich dummy datasets.

*   **Interactive SQL Terminal & Live Result Grid:**
    *   Users type raw SQL queries in an editor with syntax highlighting and autocomplete.
    *   **Live Execution:** Executes against an in-browser database (SQLite via WebAssembly or AlaSQL) and displays the resulting table rows in a `shadcn/ui` `Table`, alongside execution time and error messages.
    *   **Visual Query Explainer:** Visually highlights how tables are merged during `JOIN` operations or how rows collapse during `GROUP BY`.
*   **Pre-loaded Dummy Datasets (Themes):**
    *   *E-Commerce Empire:* `users`, `orders`, `order_items`, `products`, `categories`.
    *   *Social Media Network:* `profiles`, `posts`, `comments`, `likes`, `follows`.
    *   *Guild RPG Manager:* `heroes`, `guilds`, `quests`, `inventory`, `loot_drops`.
*   **Comprehensive Curriculum & Progression Levels:**
    *   **World 1: The Basics (`SELECT` & Filtering):** `SELECT *`, `AS`, `DISTINCT`, `WHERE`, `AND`/`OR`/`NOT`, `IN`, `BETWEEN`, `LIKE`.
    *   **World 2: Sorting & Pagination:** `ORDER BY` (`ASC`/`DESC`), `LIMIT`, `OFFSET`.
    *   **World 3: Aggregations & Grouping:** `COUNT()`, `SUM()`, `AVG()`, `MIN()`, `MAX()`, `GROUP BY`, `HAVING`.
    *   **World 4: The Art of the Join:** Visual Venn-diagram challenges for `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `FULL OUTER JOIN`, and multi-table joins.
    *   **World 5: Advanced Sorcery:** Subqueries, CTEs (`WITH`), `CASE WHEN`, and Window Functions (`ROW_NUMBER()`, `RANK()`, `OVER (PARTITION BY ...)`).

---

### Module 3: Language Property & Data Structure Gamification ("Polyglot Dojo")
Before or alongside building APIs, users play interactive mini-games to master core language properties, data transformation, and memory/type mechanics required in real backend engineering.

*   **Interactive Execution & Visual Memory Inspector:**
    *   Users write or complete code snippets to transform input data (often pulled directly from their SQL query results!) into a target output structure.
    *   A live **Memory / State Visualizer** animates how the data structure changes step-by-step.
*   **Stack-Specific Curriculum & Gamified Challenges:**
    *   **🐹 Go (Golang) Arena:**
        *   **Maps (`map[string]interface{}`, `map[int]User`):** Initializing with `make()`, inserting keys, deleting with `delete()`, checking existence with the comma-ok idiom (`val, ok := myMap[key]`), and handling map iteration randomness.
        *   **Slices & Arrays:** `append()`, slicing syntax (`s[low:high]`), capacity vs. length (`len()` vs `cap()`).
        *   **Structs & Pointers:** Struct tags (`json:"name"`), value vs. pointer receivers (`*User` vs `User`), `nil` pointer safety.
        *   **Concurrency Basics:** Goroutines (`go func()`) and Channels (`chan`) for parallel DB fetching.
    *   **🟢 Node.js (TypeScript/JavaScript) Arena:**
        *   **Array & Object Manipulation:** Mastering `.map()`, `.filter()`, `.reduce()`, `.find()`, Object destructuring, and the spread operator (`...`).
        *   **Key-Value & Sets:** `Map`, `Set`, and `Record<K, V>` type safety in TypeScript.
        *   **Async & Promises:** `async`/`await`, `Promise.all()` vs `Promise.allSettled()`, and event-loop execution order puzzles.
    *   **🐘 PHP (Modern PHP 8.x & Laravel) Arena:**
        *   **Associative Arrays & Array Functions:** `array_map()`, `array_filter()`, `array_reduce()`, `isset()`, and null coalescing (`??`).
        *   **Laravel Collections:** Fluent chaining with `collect()`, `->pluck()`, `->groupBy()`, `->mapWithKeys()`, and `->filter()`.
        *   **Modern PHP 8+ Properties:** Constructor property promotion, `readonly` properties, Enums, and `match` expressions.
*   **Gamification Mechanics:**
    *   **"Transform the Payload" Puzzles:** Given a raw database row array, use the language's specific properties (e.g., a Go `map` or Laravel `Collection`) to group orders by `user_id` and calculate totals.
    *   **Bug Hunter Mode:** Spot the `nil` map panic in Go, the unhandled Promise rejection in Node.js, or the N+1 collection loop in PHP.

---

### Module 4: Fullstack REST API Flow & Interactive Folder Tree ("Backend Blueprint")
Bridges the gap between a database schema and a working backend application. Users select a stack (**Go**, **Node.js**, or **PHP**), explore a **Live Recommended Folder Tree**, and walk through the 6-step architectural pipeline.

#### 4.1 Interactive Recommended Folder Tree Explorer
Every step in the pipeline highlights the exact file inside a modern, production-grade directory tree (using a collapsible `shadcn/ui` File Tree sidebar). Clicking any file in the tree opens its code, explains why it lives in that folder, and shows how it imports/connects to other files.

##### 🐹 Go (Golang) — *Standard Go Project Layout + Clean Architecture (Gin/Fiber + GORM)*
```text
my-go-api/
├── cmd/
│   └── api/
│       └── main.go                  # [Entrypoint] Initializes DB, DI, and starts HTTP server
├── internal/                        # Private application code (enforced by Go compiler)
│   ├── config/
│   │   └── database.go              # [Step 1] DB connection pool & GORM setup
│   ├── domain/ (or models/)
│   │   └── user.go                  # [Step 2] Struct definitions, GORM & JSON tags
│   ├── repository/
│   │   └── user_repository.go       # [Step 3] Data Access Layer (GORM queries)
│   ├── service/ (or usecase/)
│   │   └── user_service.go          # [Step 4] Business logic, validation, password hashing
│   ├── handler/ (or controller/)
│   │   └── user_handler.go          # [Step 5] Gin/Fiber HTTP context parsing & JSON responses
│   └── routes/
│       └── routes.go                # [Step 6] Route groups (/api/v1) & Middleware binding
├── pkg/
│   └── response/
│       └── json.go                  # Shared reusable helpers
├── migrations/
│   └── 000001_create_users.up.sql   # [Step 1] Raw SQL migration generated from ERD
└── go.mod
```

##### 🟢 Node.js (TypeScript) — *Feature/Layered Architecture (Express/NestJS + Prisma)*
```text
my-node-api/
├── prisma/
│   ├── schema.prisma                # [Step 1 & 2] Prisma Schema & Data Models from ERD
│   └── migrations/                  # [Step 1] Auto-generated SQL migration history
├── src/
│   ├── config/
│   │   └── db.ts                    # [Step 1] PrismaClient singleton instance
│   ├── modules/
│   │   └── user/
│   │       ├── user.types.ts        # [Step 2] TypeScript interfaces & Zod DTO schemas
│   │       ├── user.repository.ts   # [Step 3] Prisma queries (findUnique, create, include)
│   │       ├── user.service.ts      # [Step 4] Business logic & error throwing
│   │       ├── user.controller.ts   # [Step 5] Express Request/Response handling
│   │       └── user.routes.ts       # [Step 6] Express Router endpoints & Auth middleware
│   ├── middlewares/
│   │   └── error.middleware.ts      # Global error handler
│   └── app.ts                       # Express app setup & route mounting
├── package.json
└── tsconfig.json
```

##### 🐘 PHP (Laravel 11+) — *Modern Laravel + Service/Repository Pattern*
```text
my-laravel-api/
├── app/
│   ├── Models/
│   │   └── User.php                 # [Step 2] Eloquent Model, $fillable, $casts, relations
│   ├── Repositories/
│   │   └── UserRepository.php       # [Step 3] Eloquent queries & data retrieval
│   ├── Services/
│   │   └── UserService.php          # [Step 4] Business logic & DB::transaction()
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   └── UserController.php   # [Step 5] Controller actions (index, store, show)
│   │   ├── Requests/
│   │   │   └── StoreUserRequest.php # [Step 4/5] FormRequest validation rules
│   │   └── Resources/
│   │       └── UserResource.php     # [Step 5] JSON API transformation layer
├── database/
│   ├── migrations/
│   │   └── 2026_01_01_create_users_table.php # [Step 1] Schema::create blueprint
│   └── seeders/
│       └── UserSeeder.php           # Dummy data seeder
├── routes/
│   └── api.php                      # [Step 6] Route::apiResource('users', ...)
└── composer.json
```

#### 4.2 The 6-Step Interactive Pipeline
Users progress through a visual pipeline node-by-node. At each step, the Folder Tree highlights where the file belongs, and the code editor presents an interactive challenge linked directly to their custom ERD schema:

```
[1. DB & Migration] ➔ [2. Model / Entity] ➔ [3. Repository / DAL] ➔ [4. Service / Logic] ➔ [5. Controller / Handler] ➔ [6. Router & REST API]
```

| Step | Layer | Folder Location (Go / Node / PHP) | What the User Learns & Builds |
| :--- | :--- | :--- | :--- |
| **Step 1** | **Database & Migration** | `migrations/` \| `prisma/` \| `database/migrations/` | Translating ERD tables into version-controlled schema migrations and configuring connection pools. |
| **Step 2** | **Model / Struct / Entity** | `internal/domain/` \| `prisma/schema.prisma` \| `app/Models/` | Mapping database tables to code structures, data types, JSON tags, and ORM relationships ($1:N$, $N:M$). |
| **Step 3** | **Repository / Data Access** | `internal/repository/` \| `src/modules/*/repository.ts` \| `app/Repositories/` | Writing clean ORM queries (`FindAll`, `FindByID`, `Preload`/`include`/`with` for eager loading). |
| **Step 4** | **Service / Business Logic** | `internal/service/` \| `src/modules/*/service.ts` \| `app/Services/` | Transforming data using stack properties (Go maps, JS arrays, PHP collections), validating rules, and hashing. |
| **Step 5** | **Controller / Handler** | `internal/handler/` \| `src/modules/*/controller.ts` \| `app/Http/Controllers/` | Parsing HTTP requests, calling the Service layer, and returning proper HTTP status codes (`200`, `201`, `400`, `404`). |
| **Step 6** | **Router & API Testing** | `internal/routes/` \| `src/modules/*/routes.ts` \| `routes/api.php` | Binding HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) and testing live via the built-in **Mock Postman Client**. |

*   **Built-in Mock API Tester (Mini-Postman):**
    *   Users send simulated `GET /api/v1/users`, `POST /api/v1/users` requests and watch an animated trace light up both the **6-Step Flow Diagram** and the **Folder Tree** (`routes` $\rightarrow$ `controller` $\rightarrow$ `service` $\rightarrow$ `repository` $\rightarrow$ `model` $\rightarrow$ `SQL DB` $\rightarrow$ `JSON Response`).

---

## 3. Technical Architecture, UI Template & Responsive Design

### 3.1 Frontend Tech Stack
*   **Build Tool & Framework:** **Vite.js** + **React 18+** + **TypeScript** (`strict` mode).
*   **UI Component System:** **shadcn/ui** (built on **Radix UI** primitives + **Tailwind CSS**).
    *   *Key shadcn/ui Components Used:*
        *   `Sidebar` & `Sheet` (collapsible navigation and mobile off-canvas drawers).
        *   `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` (IDE-style split panes on desktop).
        *   `Tabs`, `Card`, `Badge`, `Progress`, `Accordion` (for Folder Tree & Quest lists).
        *   `Dialog`, `Drawer` (Vaul-based bottom sheet for mobile table/node editing), `Toast` / `Sonner` (XP & achievement popups).
        *   `Table` (SQL query result grid), `Select`, `Switch`, `Tooltip`.
*   **Icons & Animations:** `lucide-react` + `framer-motion` (for XP level-ups, pipeline flow pulses, and memory visualizer transitions).
*   **ERD & Flow Engine:** `@xyflow/react` (React Flow) with custom `shadcn/ui`-styled nodes and touch-pinch/pan support.
*   **In-Browser SQL & Code Execution:** `sql.js` (SQLite WASM) or `alasql` + custom AST/sandboxed runners for Go/Node/PHP property challenges.

### 3.2 Responsive Mobile & Desktop Strategy
Because developer tools (ERD builders, SQL terminals, and multi-panel IDEs) can feel cramped on smaller screens, **Fullstack Wannabe** uses an adaptive layout pattern:

| Feature / View | 🖥️ Desktop Experience (`lg:` / `xl:`) | 📱 Mobile & Tablet Experience (`< md:`) |
| :--- | :--- | :--- |
| **Dashboard Shell** | Persistent collapsible `shadcn/ui` left `Sidebar` with XP progress bar, active stack badge, and module switcher. | Top compact `Header` with hamburger `Sheet` drawer + sticky **Bottom Navigation Bar** (`ERD`, `SQL`, `Dojo`, `API Flow`). |
| **Module 1: ERD Builder** | Side-by-side `ResizablePanelGroup`: Interactive Canvas on the left (70%), live SQL DDL & Table Inspector on the right (30%). | Full-screen touch-enabled Canvas with pinch-to-zoom. Floating Action Button (FAB) opens a bottom `Drawer` to edit tables/columns or view live SQL. |
| **Module 2: SQL Arena** | 3-pane IDE layout: Quest & Schema list (left), SQL Editor (top-right), Live Result `Table` (bottom-right). | Segmented `Tabs` bar (`[🎯 Quest]` \| `[💻 SQL Editor]` \| `[📊 Results]`) with a quick-insert SQL keyword bar (`SELECT`, `JOIN`, `GROUP BY`, `WHERE`) above the mobile keyboard. |
| **Module 3: Polyglot Dojo** | Split screen: Code Challenge editor on the left, Live Memory/Map Visualizer & Console on the right. | Stacked vertical cards with interactive tap-to-fill code blocks (optional typing or tap-tokens mode for easy mobile play). |
| **Module 4: Backend Flow & Folder Tree** | 3-column IDE: Interactive **Folder Tree** (left), **6-Step Pipeline & Code Editor** (center), **Mini-Postman API Tester** (right). | Horizontal scrollable **6-Step Stepper** at the top; collapsible **Folder Tree Drawer** (`Sheet`) toggled via a file path breadcrumb button (`internal/domain/user.go`). |

---

## 4. User Journey (How It All Connects)

1.  **Design (ERD Builder):** On desktop or phone, the user creates a `users` table and an `orders` table, connecting them via `user_id` ($1:N$). They inspect the generated `CREATE TABLE` SQL.
2.  **Populate & Query (SQL Arena):** With one click, the user seeds dummy data into their schema and completes quests using `SELECT`, `INNER JOIN`, and `GROUP BY` to analyze their tables.
3.  **Master the Language (Polyglot Dojo):** The user switches to the **Language Property Arena**, selects **Go**, **Node.js**, or **PHP**, and completes gamified challenges on `map[string]User`, `.reduce()`, or Laravel `Collection->groupBy()` using their `users` and `orders` data.
4.  **Explore the Folder Tree & Build the API (Backend Blueprint):** The user opens the **Fullstack Flow**, explores the industry-standard folder tree (`internal/handler` in Go, `src/modules` in Node, or `app/Http/Controllers` in PHP), and completes the 6 steps from Migration to Router.
5.  **Test & Celebrate:** They fire a `GET /api/v1/users` request in the built-in Mini-Postman client, watch the request animate through the folder tree and pipeline, and unlock the **"Fullstack Architect"** badge!

---

## 5. Implementation Roadmap (Phased Approach)

### Phase 1: Dashboard Shell & Module 1 (ERD Canvas + Live SQL)
*   [ ] Initialize Vite + React + TypeScript project with Tailwind CSS and **shadcn/ui** dashboard layout (Desktop Sidebar + Mobile Bottom Nav & Drawers).
*   [ ] Build the interactive ERD visual builder (Add/Edit Table, Columns, PK/FK constraints, $1:1$, $1:N$, $N:M$ relationships).
*   [ ] Implement real-time SQL DDL generator (PostgreSQL, MySQL, SQLite) and 1-click Dummy Data Seeder.

### Phase 2: Module 2 (Gamified SQL Playground)
*   [ ] Integrate the in-browser SQL engine and pre-loaded datasets.
*   [ ] Build the SQL Editor (with mobile quick-keyword bar), Result Table grid, and Visual Join/Group Explainer.
*   [ ] Implement Worlds 1–5 SQL Quests (`SELECT`, `WHERE`, `GROUP BY`, `HAVING`, `JOIN`, Subqueries) with XP, streaks, and level-up toasts.

### Phase 3: Module 3 (Language Property & Data Structure Gamification)
*   [ ] Build the **Polyglot Dojo** with interactive challenges and visual memory/data-structure state inspectors.
*   [ ] Add curated challenge tracks for **Go** (`map`, slices, structs, pointers), **Node.js** (`Array.map/filter/reduce`, `Map/Set`, `Promise.all`), and **PHP** (Associative arrays, Laravel `Collections`, `match`).

### Phase 4: Module 4 (Fullstack Flow, Folder Tree Explorer & Mini-Postman)
*   [ ] Build the **Interactive Folder Tree Explorer** showcasing best-practice architectures for **Go (Clean/Standard Layout)**, **Node.js (Modular Prisma/Express)**, and **PHP (Laravel Service/Repo)**.
*   [ ] Connect the 6-Step Pipeline (`Migration` $\rightarrow$ `Model` $\rightarrow$ `Repository` $\rightarrow$ `Service` $\rightarrow$ `Controller` $\rightarrow$ `Router`) dynamically to the user's ERD schema.
*   [ ] Build the **Mini-Postman REST API Tester** with live visual request tracing across both the Folder Tree and Pipeline nodes.