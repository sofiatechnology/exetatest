# EXETATEST

![alt text](EXETATEST.png)
**EXETATEST** is the backend API for an exam preparation platform built for students preparing for the **State Examination (Examen d'État)** in the **Democratic Republic of the Congo**. It powers a mobile app that helps students study, practice with quizzes, and prepare for one of the most important academic milestones in their lives.


The API is built with **NestJS** and **Sequelize**, designed to be fast, simple, and easy to learn from — making it both a real product and a teaching resource for developers who want to learn how to build a production-style backend feature by feature.

---

## Why This Project Matters

The State Examination is a defining moment for every Congolese student finishing secondary school. Passing it determines access to university, scholarships, and future career paths. Yet many students prepare with limited resources: outdated textbooks, scarce past papers, little access to structured practice, and almost no digital tools designed specifically for their curriculum.

EXETATEST exists to close that gap.

- **Accessibility first.** Many students study on low-end phones with unreliable internet. The API is built with offline sync support and aggressive caching so the app stays usable even with a weak connection.
- **Built around the real curriculum.** Subjects, courses, and questions are organized the way students actually encounter them in the DRC education system, not adapted from a foreign syllabus.
- **Free and open.** Quality exam prep shouldn't depend on what a family can afford. Keeping this project open source means schools, teachers, and independent developers across the country can build on it, host it, or extend it without barriers.
- **A tool for the community, not just a product.** Teachers can contribute questions and courses. Developers can contribute code. Former students who passed the exam can give back by improving the platform for the next generation.

In a country where access to quality educational technology is still rare, this project is an attempt to put a serious, well-built study tool directly in the hands of the students who need it most.

---

## What It Does

- Authenticated dashboards for both students and admins
- Quiz and test items (questions, courses, sections) organized by subject
- Custom test sets and invitations between users
- Profile management and admin-side content management
- Offline sync support so students can keep studying without a stable connection
- Passwordless OTP login via email — no passwords to forget or leak
- Cached, speed-optimized REST endpoints built for low-bandwidth environments

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS v10 |
| ORM | Sequelize v6 (sequelize-typescript) |
| Language | TypeScript v5 |
| Database | PostgreSQL |
| Auth | JWT + OTP (passwordless) |
| Email | Resend (default) + Nodemailer / SMTP fallback |
| Validation | class-validator / class-transformer |
| Config | @nestjs/config / dotenv |

---

## Project Structure

```
src/
  auth/          # OTP + JWT authentication
  email/         # Email service and templates
  models/        # Sequelize models
  users/         # User profiles
  item/          # Quiz items
  item-course/   # Courses linked to items
  item-question/ # Questions linked to items
  common/        # Guards, decorators, filters, interceptors
scripts/         # Seed scripts and SQL
```

Each feature module follows the same shape: `dto/`, `*.controller.ts`, `*.service.ts`, `*.module.ts`. Controllers handle routing only; business logic lives in services.

---

## Getting Started

### Prerequisites

- Node.js (LTS)
- PostgreSQL
- A Resend API key and verified sender domain for OTP emails

### Setup

```bash
git clone https://github.com/your-org/exetatest.git
cd exetatest
npm install
cp .env.example .env
```

Fill in your `.env` file with your database and email credentials, then run:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

### Running Tests

```bash
npm run lint
npm run build
```

---

## API Overview

| Method | Route | Description |
|---|---|---|
| POST | `/auth/otp/send` | Send a one-time login code by email |
| POST | `/auth/otp/verify` | Verify the code and receive a JWT |
| GET | `/auth/profile` | Get the authenticated user's profile |
| GET | `/users/profile` | Get current user profile |
| PATCH | `/users/profile` | Update current user profile |

Swagger documentation is kept up to date with every change and is available at `/api` once the server is running.

---

## How to Contribute

This project grows through community effort, and contributions of every kind are welcome, not just code.

### Ways to Contribute

- **Code.** Fix bugs, build new features, improve performance, or help refactor existing modules. The codebase is intentionally kept simple and readable, so it's a good place to start even if you're early in your backend journey.
- **Exam content.** Teachers, tutors, and former students can contribute subjects, courses, and quiz questions that reflect the real State Examination curriculum.
- **Translations.** Help make the platform and its content accessible in more local languages.
- **Documentation.** Improve setup guides, write tutorials, or document features for other contributors.
- **Testing and feedback.** Try the app with real students, report bugs, and suggest improvements based on how it's actually used in the field.

### Contribution Workflow

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Follow the existing module pattern (`dto/`, controller, service, module) for any new feature.
4. Keep business logic in services, not controllers.
5. Run `npm run lint` and `npm run build` and fix any errors before opening a pull request.
6. Update Swagger docs for any endpoint you add or change.
7. Open a pull request describing what changed and why.

### Code Style

- Favor clarity over cleverness. This project is meant to be read and learned from.
- Avoid introducing new major dependencies without discussion — open an issue first if you think one is needed.
- Keep each endpoint minimal and fast; this app is used by students on low-end devices and slow connections.

### Reporting Issues

If you find a bug, have a feature request, or want to propose new exam content, please open an issue with as much detail as possible: what you expected, what happened instead, and steps to reproduce if relevant.

---

## License

This project is open source. See the `LICENSE` file for details.

---

## A Note to Contributors

If you're a student who once sat for the State Exam, a teacher who knows the curriculum inside out, or a developer who just wants to build something that matters, your contribution can directly help a student preparing for one of the biggest tests of their life. That's the whole point of this project.
