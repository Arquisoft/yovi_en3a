# YOVI_en3a - Game Y at UniOvi

[![Release — Test, Build, Publish, Deploy](https://github.com/arquisoft/yovi_en3a/actions/workflows/release-deploy.yml/badge.svg)](https://github.com/arquisoft/yovi_en3a/actions/workflows/release-deploy.yml) 
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_en3a&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_en3a)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_en3a&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_en3a)

This project is a template with some basic functionality for the ASW labs.

# About

This repository contains the project for the [software architecture curse](https://arquisoft.github.io/) in Uniovi, developing Game y.

The development of the game follows [these](https://docs.google.com/document/d/1VKKkNxAdRo5Eo8VpZHr3fQ3owIvBvZ_6fKDch0N8m3U/edit?tab=t.0#heading=h.knuq2aw7zapd) requirements.

The project is deployed [here](https://yovi-en3a.duckdns.org/), the documentation can be found [here](https://arquisoft.github.io/yovi_en3a/). 

Go to the [wiki](https://github.com/Arquisoft/yovi_en3a/wiki) for more information about the development.

# Developers

| Contributor               | Git Account        | Contact Email               |
|---------------------------|--------------------|-----------------------------|
| Daniel Onís Fabián        | [Daniel Onís](https://github.com/danielof26)        | UO293946@uniovi.es          |
| Sergio Seijo Martínez     | [Sergio Seijo](https://github.com/SSergio0-UO)       | UO300084@uniovi.es          |
| Martín Almoina Iglesias   | [Martín Almoina](https://github.com/Martin-Almoina)     | UO300717@uniovi.es          |
| Gonzalo García Castro     | [Gonzalo García](https://github.com/UO294665)     | UO294665@uniovi.es          |
| Daniel Álvarez Menéndez   | [Daniel Álvarez](https://github.com/Daniel299778)     | UO299778@uniovi.es          |

## Project Structure

The project is divided into six components, each in its own directory:

- `webapp/`: A frontend application built with React, Vite, and TypeScript.
- `users/`: A backend service for managing users, built with Node.js and Express.
- `gamey/`: A Rust game engine and bot service.
- `gamemanageer/` : service in charge of the logic of matches.
- `gatewayservice/` : A single entry point for the system acting as an API Gateway.
- `docs/`: Architecture documentation sources following Arc42 template.

Each component has its own `package.json` file with the necessary scripts to run and test the application.

## Basic Features

- **User Registration**: The web application provides a simple form to register new users.
- **User Service**: The user service receives the registration request, and register the user storing it in the db.
- **GameY**: At the moment the standard mode of gamey can be played choosing 3 diffrenet dificulty levels and 4 board sizes.


## Running the Project

You can run this project using Docker (recommended) or locally without Docker.

### With Docker

This is the easiest way to get the project running. You need to have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.

1. **Build and run the containers:**
    From the root directory of the project, run:

```bash
docker-compose up --build
```

This command will build the Docker images for the containgers and start them.


