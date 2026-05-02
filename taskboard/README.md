# 📋 TaskBoard

A full-stack task management web application built as part of a Web Technology course assignment.

> **Live App:** [https://your-app.vercel.app](https://your-app.vercel.app)  
> **GitHub:** [https://github.com/your-username/taskboard](https://github.com/your-username/taskboard)

---

## ✨ Features

- 🔐 **User Authentication** — Secure signup and login using JWT stored in httpOnly cookies
- ✅ **CRUD Operations** — Create, read, update, and delete tasks
- 🗄️ **Database Connectivity** — PostgreSQL database accessed through Prisma ORM
- 🌐 **Client–Server Interaction** — React frontend communicates with Next.js API routes
- 🚀 **Deployed** — Live on Vercel

---

## 🛠️ Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Framework    | Next.js 14 (App Router)                 |
| Frontend     | React, Tailwind CSS                     |
| Backend      | Next.js API Routes                      |
| ORM          | Prisma                                  |
| Database     | PostgreSQL (Supabase)                   |
| Auth         | JWT (`jose`), Password hashing (`bcryptjs`) |
| Deployment   | Vercel                                  |

---

## 📁 Project Structure

```
taskboard/
├── prisma/
│   └── schema.prisma          # Database models (User, Task)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # Login page
│   │   │   └── signup/        # Signup page
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/     # POST — login user
│   │   │   │   ├── logout/    # POST — logout user
│   │   │   │   ├── me/        # GET  — get current user
│   │   │   │   └── signup/    # POST — register user
│   │   │   └── tasks/
│   │   │       ├── route.js   # GET (all tasks), POST (create)
│   │   │       └── [id]/
│   │   │           └── route.js  # PUT (update), DELETE
│   │   ├── dashboard/         # Main dashboard (protected)
│   │   ├── globals.css
│   │   ├── layout.jsx
│   │   └── page.jsx           # Landing page
│   ├── lib/
│   │   ├── auth.js            # JWT helper functions
│   │   └── prisma.js          # Prisma client singleton
│   └── middleware.js          # Route protection
├── .env.example               # Environment variable template
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint            | Description              | Auth Required |
|--------|---------------------|--------------------------|:-------------:|
| POST   | `/api/auth/signup`  | Register a new user      | No            |
| POST   | `/api/auth/login`   | Login user               | No            |
| POST   | `/api/auth/logout`  | Logout (clear cookie)    | No            |
| GET    | `/api/auth/me`      | Get current user info    | Yes           |
| GET    | `/api/tasks`        | Get all tasks for user   | Yes           |
| POST   | `/api/tasks`        | Create a new task        | Yes           |
| PUT    | `/api/tasks/:id`    | Update a task            | Yes           |
| DELETE | `/api/tasks/:id`    | Delete a task            | Yes           |

---

## 🗃️ Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   // Hashed with bcryptjs
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("todo")    // todo | in-progress | done
  priority    String   @default("medium")  // low | medium | high
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18 or higher
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/taskboard.git
cd taskboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```env
# Supabase → Settings → Database → Connection Pooling (port 6543)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase → Settings → Database → URI (port 5432)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# A long random secret string (min 32 chars)
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 4. Push the database schema to Supabase

```bash
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🚀 Deployment on Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Under **Environment Variables**, add:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
4. Click **Deploy**

> Prisma generates its client automatically during the Vercel build via the `postinstall` script.

---


