# Software Architecture Design Document
## Prov-Suggest: Anonymous Suggestion Management System

---

## 1. Executive Summary

**Prov-Suggestion-Box** is a modern, full-stack web application built for internal organizational use that enables anonymous suggestion submission and management. The system provides role-based access control, real-time updates, and comprehensive admin management capabilities, all secured through Microsoft Entra ID integration.

### Key Features
- **Anonymous Suggestion Submission** with category-based organization
- **Role-based Access Control** (Admin/User roles)
- **Real-time Updates** via polling mechanism
- **Microsoft Entra ID Authentication** for enterprise security
- **Dynamic Category Management** with visual indicators
- **Comprehensive Admin Dashboard** with statistics and management tools

---

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Form Management**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Authentication**: NextAuth.js 4.24.11

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes (RESTful)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Microsoft Entra ID (Azure AD)
- **Session Management**: JWT tokens
- **Validation**: Zod schemas

### Infrastructure
- **Hosting**: Vercel (Serverless)
- **Database**: MongoDB Atlas (Cloud)
- **Authentication Provider**: Microsoft Entra ID
- **CDN**: Vercel Edge Network

---

## 3. System Architecture

### 3.1 High-Level Architecture

The system follows a three-tier architecture:

**Client Layer (Browser)**
- React UI components
- Authentication session management
- Real-time user interface

**Application Layer (Vercel/Next.js)**
- API Routes for business logic
- Authentication handler
- Serverless functions

**External Services**
- MongoDB Atlas for data persistence
- Microsoft Entra ID for authentication

### 3.2 Application Layers

**Presentation Layer**
- Form Components (SuggestionForm, CategoryManagement)
- Dashboard Components (SuggestionDashboard, Statistics)
- List Components (SuggestionList, SuggestionCard)

**Application Layer**
- API Routes (RESTful endpoints)
- Authentication Handler (NextAuth.js)
- Real-time Polling (5-second intervals)

**Data Access Layer**
- Mongoose ODM for database operations
- Model Layer (User, Suggestion, Category, Comment, Upvote)
- Database Connection (MongoDB Atlas)

**External Services**
- MongoDB Atlas (Cloud database)
- Microsoft Entra ID (Authentication provider)

---

## 4. Component Architecture

### 4.1 Frontend Components

#### Core Components
- **SuggestionForm.tsx** - Main suggestion submission form
- **SuggestionList.tsx** - Paginated list with filtering/sorting
- **SuggestionCard.tsx** - Individual suggestion display
- **SuggestionDashboard.tsx** - Statistics dashboard
- **CommentSection.tsx** - Comments and admin notes
- **CategoryManagement.tsx** - Admin category CRUD operations
- **CharacterCounter.tsx** - Reusable character limit component
- **AuthProvider.tsx** - Authentication context wrapper

#### Component Responsibilities
- **SuggestionForm**: Handles suggestion creation with validation
- **SuggestionList**: Manages pagination, filtering, and sorting
- **SuggestionCard**: Displays individual suggestions with admin controls
- **SuggestionDashboard**: Shows real-time statistics and metrics
- **CommentSection**: Manages comments and internal admin notes
- **CategoryManagement**: Admin interface for category management

### 4.2 API Architecture

#### API Routes Structure
- **/api/auth/[...nextauth]/route.ts** - NextAuth.js handler
- **/api/suggestions/route.ts** - GET (list), POST (create)
- **/api/suggestions/[id]/route.ts** - GET, PUT, DELETE (individual)
- **/api/suggestions/[id]/comments/route.ts** - Comments CRUD
- **/api/suggestions/[id]/upvote/route.ts** - Upvote management
- **/api/suggestions/stats/route.ts** - Statistics endpoint
- **/api/suggestions/check-changes/route.ts** - Polling endpoint
- **/api/categories/route.ts** - GET (list), POST (create)
- **/api/categories/[id]/route.ts** - GET, PUT, DELETE (individual)
- **/api/admin/create-admin/route.ts** - Admin account creation
- **/api/admin/seed-categories/route.ts** - Default categories seeding

---

## 5. Data Architecture

### 5.1 Database Schema

#### User Model
- **email**: string (Unique identifier)
- **password**: string (Empty for OAuth users)
- **name**: string (Optional display name)
- **role**: 'user' | 'admin' (Role-based access)
- **createdAt**: Date
- **updatedAt**: Date

#### Suggestion Model
- **title**: string (Maximum 200 characters)
- **content**: string (Maximum 2000 characters)
- **category**: ObjectId (Reference to Category)
- **status**: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed'
- **isAnonymous**: boolean (Default: true)
- **submittedBy**: ObjectId (Reference to User, optional)
- **adminNotes**: string (Maximum 1000 characters, optional)
- **createdAt**: Date
- **updatedAt**: Date

#### Category Model
- **name**: string (Maximum 50 characters)
- **description**: string (Maximum 200 characters, optional)
- **color**: string (Hex color code)
- **isActive**: boolean (Enable/disable categories)
- **createdAt**: Date
- **updatedAt**: Date

#### Comment Model
- **suggestion**: ObjectId (Reference to Suggestion)
- **author**: ObjectId (Reference to User)
- **content**: string (Maximum 5000 characters)
- **isInternal**: boolean (Admin-only notes)
- **createdAt**: Date
- **updatedAt**: Date

#### Upvote Model
- **suggestion**: ObjectId (Reference to Suggestion)
- **user**: ObjectId (Reference to User)
- **createdAt**: Date

### 5.2 Data Relationships

- User (1) to (0..n) Suggestion
- User (1) to (0..n) Comment
- User (1) to (0..n) Upvote
- Category (1) to (0..n) Suggestion
- Suggestion (1) to (0..n) Comment
- Suggestion (1) to (0..n) Upvote

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

1. Client sends login request to Next.js application
2. Next.js redirects user to Microsoft Entra ID
3. User authenticates with Entra ID
4. Entra ID returns JWT token to Next.js
5. Next.js creates or updates user in database
6. Session established with role-based permissions

### 6.2 Authorization Levels

#### User Role Permissions

**User Role:**
- Submit suggestions
- View suggestions
- Upvote suggestions
- Add comments

**Admin Role:**
- All user permissions
- Manage categories
- Update suggestion status
- Add admin notes
- Delete suggestions
- View all comments (including internal notes)

---

## 7. Real-time Features

### 7.1 Polling Architecture

The system implements a 5-second polling mechanism:

1. Client sends poll request every 5 seconds
2. API server queries database for suggestion count
3. Server returns count to client
4. Client compares with current count
5. If changes detected, client requests full data
6. Server queries complete suggestion data
7. Client updates UI with new data

### 7.2 Performance Optimizations

- **Connection Pooling**: MongoDB connection caching
- **Efficient Queries**: Aggregation pipelines for upvote counts
- **Selective Updates**: Only fetch data when changes detected
- **Client-side Caching**: React state management for UI stability

---

## 8. Deployment Architecture

### 8.1 Vercel Deployment

**Vercel Platform Components:**
- Edge Functions: Static assets and SSR
- Serverless Functions: API routes and authentication
- CDN Cache: Assets, images, and fonts

**External Services:**
- MongoDB Atlas: Cloud database with replica sets
- Microsoft Entra ID: OAuth 2.0, JWT tokens, user information

### 8.2 Environment Configuration

#### Required Environment Variables
- **MONGODB_URI**: MongoDB Atlas connection string
- **AZURE_AD_CLIENT_ID**: Microsoft Entra ID client ID
- **AZURE_AD_CLIENT_SECRET**: Microsoft Entra ID client secret
- **AZURE_AD_TENANT_ID**: Microsoft Entra ID tenant ID
- **AUTH_SECRET**: JWT secret key
- **NEXTAUTH_URL**: Application URL for authentication

---

## 9. Security Considerations

### 9.1 Authentication Security
- **OAuth 2.0 Flow**: Secure Microsoft Entra ID integration
- **JWT Tokens**: Stateless session management
- **Role-based Access**: Granular permission system
- **Session Validation**: Server-side session verification

### 9.2 Data Security
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Protection**: React's built-in XSS prevention
- **CSRF Protection**: NextAuth.js CSRF tokens

### 9.3 Infrastructure Security
- **HTTPS Only**: Vercel automatic SSL certificates
- **Environment Variables**: Secure secret management
- **Database Security**: MongoDB Atlas network restrictions
- **API Rate Limiting**: Vercel function limits

---

## 10. Performance & Scalability

### 10.1 Performance Optimizations
- **Serverless Architecture**: Auto-scaling with Vercel
- **Edge Caching**: Global CDN distribution
- **Database Indexing**: Optimized MongoDB queries
- **Connection Pooling**: Efficient database connections
- **Client-side Optimization**: React optimization patterns

### 10.2 Scalability Considerations
- **Horizontal Scaling**: Vercel serverless functions
- **Database Scaling**: MongoDB Atlas auto-scaling
- **Caching Strategy**: Multi-layer caching approach
- **Load Distribution**: Global edge network

---

## 11. Monitoring & Maintenance

### 11.1 Application Monitoring
- **Vercel Analytics**: Performance and usage metrics
- **Error Tracking**: Built-in error logging
- **Database Monitoring**: MongoDB Atlas monitoring
- **Authentication Logs**: NextAuth.js session tracking

### 11.2 Maintenance Procedures
- **Database Backups**: MongoDB Atlas automated backups
- **Security Updates**: Regular dependency updates
- **Performance Monitoring**: Continuous performance tracking
- **User Management**: Admin user creation and management

---

## 12. Future Enhancements

### 12.1 Planned Features
- **Email Notifications**: Status change notifications
- **Advanced Analytics**: Detailed reporting dashboard
- **File Attachments**: Support for suggestion attachments
- **Mobile App**: React Native mobile application

### 12.2 Technical Improvements
- **WebSocket Integration**: Real-time updates without polling
- **Advanced Caching**: Redis integration for better performance
- **Microservices**: Service decomposition for better scalability
- **CI/CD Pipeline**: Automated testing and deployment

---
