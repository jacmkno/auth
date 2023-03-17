# auth
A multipurpose authentication vanilla JS library that can be easily embeded on any website.

## Overview

The software is designed as a modular system with separate components for authentication, user management, and role-based access control. The system will be embedded as a library in client-side web applications, and will support various OAuth providers for authentication, as well as an email/password provider with email verification.

## Component Diagram

```svg
<svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
  <g>
    <rect x="10" y="10" width="620" height="460" rx="10" fill="#fff" stroke="#000" stroke-width="2"/>
    <text x="320" y="50" font-size="24" text-anchor="middle">Authentication System</text>
    
    <rect x="50" y="100" width="220" height="100" fill="#f8f8f8" stroke="#000" stroke-width="1"/>
    <text x="160" y="145" font-size="16" text-anchor="middle">OAuth Providers</text>
    
    <rect x="370" y="100" width="220" height="100" fill="#f8f8f8" stroke="#000" stroke-width="1"/>
    <text x="480" y="145" font-size="16" text-anchor="middle">Email/Password Provider</text>
    
    <rect x="50" y="250" width="220" height="100" fill="#f8f8f8" stroke="#000" stroke-width="1"/>
    <text x="160" y="295" font-size="16" text-anchor="middle">User Management</text>
    
    <rect x="370" y="250" width="220" height="100" fill="#f8f8f8" stroke="#000" stroke-width="1"/>
    <text x="480" y="295" font-size="16" text-anchor="middle">Role-based Access Control</text>
    
    <line x1="270" y1="150" x2="370" y2="150" stroke="#000" stroke-width="1"/>
    <line x1="270" y1="150" x2="270" y2="250" stroke="#000" stroke-width="1"/>
    <line x1="270" y1="250" x2="370" y2="250" stroke="#000" stroke-width="1"/>
    <line x1="150" y1="200" x2="220" y2="200" stroke="#000" stroke-width="1"/>
    <line x1="400" y1="200" x2="470" y2="200" stroke="#000" stroke-width="1"/>
  </g>
</svg>
```

## Sequence Diagram

```svg
<svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
  <g>
    <rect x="10" y="10" width="620" height="460" rx="10" fill="#fff" stroke="#000" stroke-width="2"/>
    <text x="320" y="50" font-size="24" text-anchor="middle">Authentication Sequence Diagram</text>
    
    <rect x="60" y="100" width="240" height="60" fill="#f8f8f8" stroke="#000" stroke-width="1"/>
    <text x="180" y="130" font-size="16" text-anchor="middle">Client</text>
    
    <rect x="340" y="100" width="240" height="60" fill="#f8f8f8" stroke="#000" stroke-width="1"/>
    <text x="460" y="130" font-size="16" text-anchor="middle">Authentication System</text>
    
    <rect x="60" y="220" width="240" height="60" fill="#f8f8f8" stroke="#000" stroke-width="1"/>
    <text x="180" y="250" font-size="16" text-anchor="middle">Email/Password Provider</text>
    
    <rect x="340" y="220" width="240" height="60" fill="#f8f8f8" stroke="#000" stroke-width="1"/>
    <text x="460" y="250" font-size="16" text-anchor="middle">OAuth Providers</text>
    
    <line x1="180" y1="160" x2="180" y2="220" stroke="#000" stroke-width="1"/>
    <line x1="460" y1="160" x2="460" y2="220" stroke="#000" stroke-width="1"/>
    <line x1="180" y1="280" x2="180" y2="340" stroke="#000" stroke-width="1"/>
    <line x1="460" y1="280" x2="460" y2="340" stroke="#000" stroke-width="1"/>
    <line x1="110" y1="130" x2="180" y2="130" stroke="#000" stroke-width="1"/>
    <line x1="180" y1="190" x2="110" y2="190" stroke="#000" stroke-width="1"/>
    <line x1="400" y1="130" x2="460" y2="130" stroke="#000" stroke-width="1"/>
    <line x1="460" y1="190" x2="400" y2="190" stroke="#000" stroke-width="1"/>
  </g>
</svg>
```

## Email/Password Provider

The email/password provider will allow users to create an account with an email and password, and then log in to the system with those credentials. The provider will also support email verification to ensure that users have access to the email address associated with their account. Here's an example code snippet for the email/password provider:

```javascript
// Define the email/password provider
class EmailPasswordProvider {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async register(email, password) {
    const response = await fetch(`${this.apiUrl}/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to register user');
    }

    return response.json();
  }

  async login(email, password) {
    const response = await fetch(`${this.apiUrl}/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to log in user');
    }

    return response.json();
  }

  async verifyEmail(email, token) {
    const response = await fetch(`${this.apiUrl}/verify-email`, {
      method: 'POST',
      body: JSON.stringify({ email, token }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to verify email address');
    }

    return response.json();
  }
}
```

## Backend Interface

The backend interface will define the API endpoints and response format that the client-side library will use to communicate with the server. Here's an example code snippet for the backend interface:

```javascript
// Define the backend interface
class BackendInterface {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async getCurrentUser() {
    const response = await fetch(`${this.apiUrl}/users/current`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return response.json();
  }

  async logout() {
    const response = await fetch(`${this.apiUrl}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to log out user');
    }

    return response.json();
  }

  async getRoles() {
    const response = await fetch(`${this.apiUrl}/roles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to get roles');
    }

    return response.json();
  }
}
```

## Demo Backend

The demo backend is a simple implementation of the backend interface that uses localStorage to store user data. It includes a mini library to override the `fetch` function and capture and respond to fetch requests to simulate API responses. Here's an example code snippet for the demo backend:

## File Structure
<code>
your-library/
├── dist/
│   ├── your-library.js
│   └── your-library.min.js
├── src/
│   ├── index.js
│   ├── auth/
│   │   ├── auth.js
│   │   ├── providers/
│   │   │   ├── email.js
│   │   │   ├── facebook.js
│   │   │   └── google.js
│   │   └── utils/
│   │       ├── email-verification.js
│   │       ├── password-reset.js
│   │       └── user-roles.js
│   └── ui/
│       ├── ui.js
│       ├── components/
│       │   ├── login-form.js
│       │   ├── registration-form.js
│       │   └── user-menu.js
│       └── utils/
│           └── dom-helpers.js
├── tests/
│   ├── auth/
│   │   ├── auth.test.js
│   │   ├── providers/
│   │   │   ├── email.test.js
│   │   │   ├── facebook.test.js
│   │   │   └── google.test.js
│   │   └── utils/
│   │       ├── email-verification.test.js
│   │       ├── password-reset.test.js
│   │       └── user-roles.test.js
│   └── ui/
│       ├── ui.test.js
│       ├── components/
│       │   ├── login-form.test.js
│       │   ├── registration-form.test.js
│       │   └── user-menu.test.js
│       └── utils/
│           └── dom-helpers.test.js
├── examples/
│   └── index.html
├── node_modules/
│   └── ...
├── .eslintrc.js
├── .gitignore
├── package.json
├── README.md
└── webpack.config.js
</code>
