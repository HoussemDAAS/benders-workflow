# Architecture Overview

This project is a full-stack web application designed for workflow management. It follows a classic client-server architecture.

## Tech Stack

- **Frontend**: React (with TypeScript), Vite, ReactFlow for workflow visualization.
- **Backend**: Node.js with Express.js framework.
- **Database**: MongoDB with Mongoose ODM.

## Project Structure

The repository is organized into two main parts: a `server` directory for the backend code and a `src` directory for the frontend code.

### Frontend (`src/`)

The frontend is a single-page application (SPA) built with React and Vite.

-   `src/components`: Contains reusable React components used across the application.
-   `src/pages`: Represents the different pages of the application.
-   `src/services`: Handles API communication with the backend.
-   `src/hooks`: Custom React hooks for business logic.
-   `src/context`: React context for global state management.
-   `src/nodes`: Custom nodes for the ReactFlow-based workflow editor.

### Backend (`server/`)

The backend is a Node.js/Express application that provides a RESTful API for the frontend.

-   `server/src/models`: Mongoose schemas for the database models.
-   `server/src/routes`: Defines the API endpoints.
-   `server/src/config`: Contains configuration files, like database connection settings.
-   `server/src/scripts`: Scripts for database management (seeding, migration).
-   `server/index.js`: The entry point for the backend server. 