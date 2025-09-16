# Text Comparison Application

## Overview

This is a full-stack web application built for comparing and editing text documents. The application allows users to upload original documents, create modified versions, and compare them side-by-side with advanced diff visualization. It's designed specifically for handling code configuration files and structured text data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server components:

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Build Process**: esbuild for production bundling

## Key Components

### Data Storage Solutions
- **Database**: PostgreSQL (configured for Neon Database service)
- **ORM**: Drizzle ORM with schema-first approach
- **Connection Pooling**: Neon serverless connection pooling with WebSocket support

### Authentication and Authorization
- Currently no authentication system is implemented
- Session management infrastructure is present (connect-pg-simple) but not actively used

### Text Processing Features
- **Diff Engine**: diff-match-patch library for precise text comparison
- **Code Alignment**: Custom text formatting utilities for structured data
- **Region Management**: Advanced text region selection and categorization system
- **Multiple Comparison Modes**: Side-by-side, top-bottom, and edit-only views

### Database Schema
- **Original Documents**: Stores source documents with backup/versioning support
- **Modified Documents**: Stores edited versions linked to original documents
- **Region Data**: JSON storage for text region metadata and categorizations

## Data Flow

1. **Document Upload**: Users create original documents through a modal interface
2. **Document Selection**: Users select an original document and optionally load a modified version
3. **Text Editing**: Real-time editing in the comparison view with synchronized scrolling
4. **Diff Generation**: Live comparison using diff-match-patch with HTML rendering
5. **Save Operations**: Modified documents are saved with optional region metadata
6. **Backup System**: Automatic backup creation when applying changes to original documents

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Library**: @neondatabase/serverless for database connectivity

### UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Noto Sans KR for Korean text support

### Development Tools
- **Replit Integration**: Special plugins for Replit development environment
- **Hot Reload**: Vite HMR with custom error overlay
- **Code Quality**: TypeScript strict mode with comprehensive type checking

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with Express.js backend
- **Hot Reload**: Real-time updates for both frontend and backend code
- **Environment Variables**: DATABASE_URL required for database connection

### Production Build
- **Frontend**: Vite builds to static assets in `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Deployment**: Single Node.js process serving both static files and API endpoints

### Environment Configuration
- **Database**: Requires PostgreSQL connection string via DATABASE_URL
- **Build Process**: Supports both development and production modes
- **Static Assets**: Served directly by Express in production

The application is designed to handle structured text comparison workflows, with particular emphasis on code configuration files and technical documentation. The architecture supports real-time collaboration features and can be extended with authentication and user management systems.