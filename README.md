# YOVI_en3a — Game Y at UniOvi

[![Release — Test, Build, Publish, Deploy](https://github.com/arquisoft/yovi_en3a/actions/workflows/release-deploy.yml/badge.svg)](https://github.com/arquisoft/yovi_en3a/actions/workflows/release-deploy.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_en3a&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_en3a)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_en3a&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_en3a)

## Table of Contents

- [Overview](#overview)
- [Team Members](#team-members)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup & Deployment](#setup--deployment)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Monitoring & Observability](#monitoring--observability)
- [Performance Testing](#performance-testing)
- [Live Deployment](#live-deployment)

## Overview

YOVI is a strategy board game application developed as a capstone project for the Software Architecture course (2025/2026) at the University of Oviedo. Players compete against AI bots of different difficulty levels on a hexagonal board, following the rules of the Game Y.

The system is built as a microservices architecture, with a Rust game engine for board logic and bot AI, Node.js/Express backend services, a React frontend, and MongoDB for persistence. The application supports multiple game modes, match history, player statistics, and a global ranking.

The full requirements specification can be found [here](https://docs.google.com/document/d/1VKKkNxAdRo5Eo8VpZHr3fQ3owIvBvZ_6fKDch0N8m3U/edit?tab=t.0#heading=h.knuq2aw7zapd).

## Team Members

| Contributor | GitHub | Contact |
| :--- | :--- | :--- |
| Daniel Onís Fabián | [![danielof26](https://img.shields.io/badge/UO293946-danielof26-337ab7)](https://github.com/danielof26) | UO293946@uniovi.es |
| Sergio Seijo Martínez | [![SSergio0-UO](https://img.shields.io/badge/UO300084-SSergio0--UO-a4c639)](https://github.com/SSergio0-UO) | UO300084@uniovi.es |
| Martín Almoina Iglesias | [![Martin-Almoina](https://img.shields.io/badge/UO300717-Martin--Almoina-c9513e)](https://github.com/Martin-Almoina) | UO300717@uniovi.es |
| Gonzalo García Castro | [![ggarciacastro](https://img.shields.io/badge/UO294665-ggarciacastro-e27e3a)](https://github.com/ggarciacastro) | UO294665@uniovi.es |
| Daniel Álvarez Menéndez | [![Daniel299778](https://img.shields.io/badge/UO299778-Daniel299778-c0a030)](https://github.com/Daniel299778) | UO299778@uniovi.es |

## Features

- **Multiple Game Modes**: Standard, Master, Fortune, Tabu, Holey and WhyNot — each with different board rules and mechanics.
- **Difficulty Levels**: Three bot difficulties — random, beginner and medium — powered by the Rust game engine.
- **Board Sizes**: Choose from 4 different board sizes to adjust the game length and complexity.
- **User Management**: Registration and login with bcrypt password hashing and JWT-based authentication.
- **Player Statistics**: Track wins, losses, win rate and games played per user.
- **Global Ranking**: Leaderboard sorted by wins or win rate, showing the top 20 players.
- **Match History**: Full history of past games per user, including result, bot, board size and game type.
- **API Documentation**: Interactive Swagger/OpenAPI docs available at `/api-docs` via the gateway.

## Architecture

YOVI uses a microservices architecture where all client traffic passes through a single API Gateway.

- **`webapp/`**: React + TypeScript frontend. Communicates exclusively with the gateway.
- **`gatewayservice/`**: Single entry point for the system. Routes requests to the appropriate service, handles JWT authentication and CORS.
- **`users/`**: Manages user accounts, authentication, statistics, ranking and match history. Exposes Prometheus metrics at `/metrics`.
- **`gamemanager/`**: Controls match lifecycle — creating games, applying moves, checking win conditions, and delegating bot moves to the game engine. Exposes Prometheus metrics at `/metrics`.
- **`gamey/`**: Rust game engine. Implements board logic, win detection and bot AI for all game modes and difficulty levels.
- **`docs/`**: Architecture documentation following the Arc42 template.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express |
| Game Engine | Rust |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (jsonwebtoken), bcrypt |
| API Gateway | Express + Axios |
| Monitoring | Prometheus (`express-prom-bundle`), Grafana |
| API Docs | Swagger UI (`swagger-ui-express`) |
| Testing | Vitest, Supertest, Nock, Playwright (E2E) |
| Performance | Gatling |
| CI/CD | GitHub Actions |
| Containerization | Docker, Docker Compose |

## Setup & Deployment

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (LTS) and npm
- [Rust](https://www.rust-lang.org/) (stable toolchain)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGO_USER=your_mongo_user
MONGO_PASS=your_mongo_password
JWT_SECRET=your_jwt_secret
```

### Running with Docker Compose (Recommended)

```bash
docker compose up --build
```

Once running, the application is available at:

- **Webapp**: http://localhost:8080
- **Swagger Docs**: http://localhost:8000/api-docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:9091

To stop:

```bash
docker compose down
```

### Manual Setup

1. Start a MongoDB instance locally or via Docker:
```bash
docker run -d -p 27017:27017 mongo:6
```

2. Build the Rust game engine:
```bash
cd gamey && cargo build
```

3. Start each Node.js service (users, gamemanager, gatewayservice):
```bash
cd <service> && npm install && npm start
```

4. Start the frontend:
```bash
cd webapp && npm install && npm run dev
```

## Testing & Quality Assurance

- **Continuous Integration**: GitHub Actions runs all tests automatically on every push and pull request.
- **Unit & Integration Tests**: Each service has its own test suite using Vitest and Supertest. HTTP calls to external services are intercepted with Nock to isolate tests.
- **End-to-End Tests**: Playwright simulates real user interactions against the full application stack.
- **Rust Tests**: The game engine is tested with Cargo's built-in test framework and llvm-cov for coverage.
- **Code Quality**: SonarCloud analyzes every build for code smells, bugs, security vulnerabilities and coverage.

## Monitoring & Observability

- **Prometheus**: Scrapes metrics from the `users` and `game-manager` services every 5 seconds. Metrics include HTTP request duration, rate and error count.
- **Grafana**: Dashboards available at `/grafana/` (production) or `http://localhost:9091` (local) showing RED metrics (Rate, Errors, Duration) per service.
- **API Documentation**: Swagger UI available at `/api-docs` via the gateway.

## Performance Testing

Load tests are implemented with [Gatling](https://gatling.io/) and cover the main user flows: registration, login, bot API simulation, and ranking/stats queries. Results are stored in `docs/load-testing/`.

To run the load tests:

```bash
cd gatling && ./bin/gatling.sh
```

## Live Deployment

The application is deployed at: **https://yovi-en3a.duckdns.org**

- Grafana dashboard: https://yovi-en3a.duckdns.org/grafana/
- API docs: https://yovi-en3a.duckdns.org/api-docs/
- Architecture docs: https://arquisoft.github.io/yovi_en3a/
- Wiki: https://github.com/Arquisoft/yovi_en3a/wiki