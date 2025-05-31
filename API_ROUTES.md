# API Routes Documentation

## Authentication Routes (`/api/auth`)

### POST `/api/auth/`
- **Purpose**: Authenticate a user and create them if they don't exist
- **Middleware**: `verifyPrivyToken`
- **Request Body**:
  ```json
  {
    "email": "string (optional)",
    "name": "string (optional)", 
    "username": "string (required for new user creation)"
  }
  ```
- **Response**: User object with authentication status

## User Routes (`/api/users`)

### PUT `/api/users/me`
- **Purpose**: Update the authenticated user's information
- **Middleware**: `verifyPrivyToken`
- **Request Body**:
  ```json
  {
    "email": "string (optional)",
    "name": "string (optional)",
    "username": "string (optional)"
  }
  ```
- **Response**: Updated user object

### GET `/api/users/username/:username`
- **Purpose**: Get a user by their username
- **Middleware**: `verifyPrivyToken`
- **Parameters**: 
  - `username`: Required username string
- **Response**: User object if found

## Controller Responsibilities

### AuthController
- Handles authentication logic
- User creation during authentication
- Validates auth tokens

### UserController  
- Manages user data operations
- User updates and retrieval
- Username validation and uniqueness checks 