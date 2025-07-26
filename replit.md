# ERP Inmobiliario - Real Estate Management System

## Overview

This is a comprehensive Enterprise Resource Planning (ERP) system specifically designed for real estate development companies. The application manages the complete lifecycle of real estate projects from planning to delivery, including project management, permit tracking, budget control, calendar scheduling, document management, and user administration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Tailwind CSS for styling with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **File Uploads**: Multer middleware for handling file uploads

### Project Structure
- **Monorepo Structure**: Single repository with separated client, server, and shared code
- **Client**: React frontend located in `/client` directory
- **Server**: Express backend located in `/server` directory  
- **Shared**: Common types and schemas in `/shared` directory
- **Full-stack TypeScript**: Consistent type safety across the entire application

## Key Components

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following main entities:
- **Users**: User accounts with role-based access (operativo, admin roles)
- **Projects**: Real estate development projects with status tracking
- **Permits**: Regulatory permits and approvals with status monitoring
- **Budget Categories & Items**: Financial tracking and cost management
- **Documents**: File storage and document management
- **Calendar Events**: Activity scheduling and deadline tracking
- **Sessions**: User session storage for authentication

### Authentication System
- **Provider**: Replit Auth integration for secure authentication
- **Session Management**: PostgreSQL-backed sessions with automatic cleanup
- **Authorization**: Role-based access control throughout the application
- **Security**: HTTPS-only cookies, secure session handling

### Real Estate Business Logic
The system implements specialized workflows for real estate development:
- **Project Lifecycle**: Tracks projects through phases (planeacion, diseño, tramites, construccion, ventas, entrega)
- **Project Types**: Supports different development types (residencial, industrial, comercial, usos_mixtos)
- **Permit Management**: Handles regulatory approvals with status tracking
- **Budget Control**: Comprehensive financial planning and cost tracking
- **Document Organization**: Structured file management for project documentation

## Data Flow

### Client-Server Communication
- **API Layer**: RESTful API endpoints with consistent error handling
- **Data Fetching**: TanStack Query handles caching, background updates, and optimistic updates
- **Real-time Updates**: Query invalidation for immediate UI updates after mutations
- **Error Handling**: Centralized error handling with user-friendly notifications

### File Management
- **Upload Process**: Multer handles multipart form uploads with 50MB size limits
- **Storage**: Local filesystem storage (can be extended to cloud storage)
- **Security**: File type validation and secure file serving

### State Management
- **Server State**: TanStack Query manages all server-side data
- **Client State**: React useState and useContext for local UI state
- **Form State**: React Hook Form for complex form management
- **Caching Strategy**: Infinite stale time with manual invalidation for data consistency

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components for accessibility
- **chart.js**: Data visualization for dashboards and reports
- **wouter**: Lightweight client-side routing

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **Vite**: Fast development server and optimized builds
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Authentication & Security
- **passport**: Authentication middleware
- **openid-client**: OpenID Connect client for Replit Auth
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Replit Integration**: Optimized for Replit development environment
- **Hot Reloading**: Vite provides instant feedback during development
- **Environment Variables**: Database URL and authentication secrets via environment variables
- **Development Server**: Express serves both API and static assets in development

### Production Build
- **Frontend Build**: Vite builds optimized React application to `/dist/public`
- **Backend Build**: ESBuild bundles server code to `/dist/index.js`
- **Static Assets**: Express serves built frontend files in production
- **Database Migrations**: Drizzle Kit handles schema migrations

### Infrastructure Requirements
- **Database**: PostgreSQL instance (Neon serverless recommended)
- **Environment Variables**: 
  - `DATABASE_URL`: PostgreSQL connection string
  - `SESSION_SECRET`: Session encryption key
  - `REPL_ID`: Replit workspace identifier
  - `ISSUER_URL`: OpenID Connect issuer URL

### Scalability Considerations
- **Database Connection Pooling**: Neon serverless handles connection scaling
- **Session Storage**: PostgreSQL-backed sessions scale with database
- **File Storage**: Local storage can be replaced with cloud solutions (S3, CloudFlare R2)
- **Caching**: TanStack Query provides client-side caching, can be extended with Redis