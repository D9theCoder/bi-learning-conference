# Bi-Learning

This repository contains the source code and other data access for the paper:

- **Title:** -
- **Authors:** Kevin Purnomo, Spits Warnars Harco Leslie Hendric, Kelvin
- **Status:** Final Draft

---

## Overview

This project implements a web-based one-to-one mathematics tutoring platform designed for high school students. The platform integrates gamification elements to enhance student engagement and motivation in learning mathematics.

Key features include:
- **One-to-One Tutoring System:** Personalized mathematics courses with individual tutor-student interactions
- **Gamification Elements:** Achievements, rewards, power-ups, daily tasks, and progress tracking
- **Assessment System:** Interactive assessments with multiple question types and attempt tracking
- **Course Management:** Structured lessons, course content, and completion tracking
- **Student Progress Monitoring:** Attendance tracking, final scores, and activity logging

---

## Repository Structure

```
bi-learning-conference/
├── app/
│   ├── Models/              # Eloquent models (User, Course, Assessment, etc.)
│   ├── Http/
│   │   ├── Controllers/     # Application controllers
│   │   ├── Middleware/      # HTTP middleware
│   │   └── Requests/        # Form request validation
│   ├── Services/            # Business logic services
│   │   ├── AchievementProgressService.php
│   │   ├── DailyTaskGeneratorService.php
│   │   └── GamificationService.php
│   └── Providers/           # Service providers
├── config/
│   └── gamification.php     # Gamification configuration
├── database/
│   ├── migrations/          # Database schema migrations
│   ├── factories/           # Model factories for testing
│   └── seeders/             # Database seeders
├── resources/
│   ├── js/                  # Main Frontend Files (Inertia.js + React)
│   ├── css/                 # Stylesheets
│   └── views/               # Blade templates
├── routes/
│   └── web.php              # Web routes
├── tests/
│   └── Feature/             # Feature tests
├── diagrams/                # System diagrams (ERD, Use Case, and Methodology)
└── public/                  # Public assets
```

---

## Prerequisites

### System Requirements
- **PHP** 8.2+
- **Composer** 2.x
- **Node.js** 18+ and npm
- **MySQL** 8.0+ or other compatible database (e.g., PostgreSQL, SQLite)
- **Laravel Herd** (recommended) or any PHP development environment

### Required PHP Extensions
- BCMath, Ctype, Fileinfo, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML, pdo_pgsql (if using PostgreSQL)

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/D9theCoder/bi-learning-conference.git
   cd bi-learning-conference
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install JavaScript dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure your database** in `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=your_port
   DB_DATABASE=your_database
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

6. **Run database migrations and seeders**
   ```bash
   php artisan migrate:fresh --seed
   ```

7. **Build frontend assets**
   ```bash
   npm run build
   ```

---

## Usage

### Development Server

Start the development server:
```bash
php artisan serve
```

For frontend hot-reloading during development:
```bash
npm run dev
```

### Running Tests

Execute the test suite using Pest:
```bash
php artisan test
```

### Code Quality

Run linting:
```bash
npm run lint
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend Framework | Laravel 12 |
| Frontend | Inertia.js with React |
| Database | MySQL |
| Authentication | Laravel Fortify |
| Authorization | Spatie Laravel Permission |
| Testing | Pest PHP |
| Build Tool | Vite |

---

## Database Schema

The system uses the following core entities:

- **Users** - Students, tutors, and administrators
- **Courses** - Mathematics course definitions
- **Lessons** - Individual lesson content within courses
- **Assessments** - Quizzes and evaluations
- **Achievements** - Gamification badges and milestones
- **Rewards** - Points and incentives system
- **Daily Tasks** - Daily engagement activities
- **Power-ups** - Special abilities for assessments

For the complete Entity-Relationship Diagram, see [diagrams/ERD.png](diagrams/ERD.png).

---

## Data Access

The database structure and sample data are available through Laravel migrations and seeders located in the `/database` directory. To populate the database with sample data:

```bash
php artisan migrate:fresh --seed
```

> **Note:** Due to privacy considerations, actual student data from the study is not included in this repository. The seeders provide synthetic data for demonstration and testing purposes.


---

## Authors & Contact

For questions or collaborations, please contact:

| Author | Contribution | Email |
|--------|--------------|-------|
| **Kevin Purnomo** | Developed the platform architecture, implemented the platform, and wrote the manuscript | kevinpurnomo06@gmail.com / kevin.purnomo@binus.ac.id |
| **Spits Warnars Harco Leslie Hendric** | Supervised the research methodology and implementation and reviewed the final manuscript | spits.hendric@binus.ac.id |
| **Kelvin** | Supervised the literature review and background research | kelvin007@binus.ac.id |
