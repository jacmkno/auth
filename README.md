
# auth.js

A JavaScript library to let a compatible Single Sign On Service manage your site's user sessions including authentication, registration, profiles management and storage in general, so you can focus on the features you want to provide your users with.

## Features

- Secure token management
- User session initialization and management
- API communication with the backend server
- Integration with user interface components

## Configuration and Usage
To use auth.js effectively, you need to provide specific authentication settings. These settings should be defined in a configuration script that initializes necessary parameters for auth.js to function correctly. This configuration should be loaded before auth.js is included in your HTML file.

### Authentication Settings
Set up the window.AUTH_SETTINGS object with the required settings before loading the auth.js script. This configuration object the includes the backend API URL and user session UI components.


### Example Configuration Structure
Define the window.AUTH_SETTINGS object in your configuration script as follows:

```javascript
<script>
window.AUTH_SETTINGS = {
    backend: 'https://your-backend.com/api-url/',
    tabs: {
        "dashboard": {
            label: 'Dashboard',
            title: 'User Dashboard'
        },
        "settings": {
            label: 'Settings',
            title: 'Account Settings'
        }
    },
    renderTopMenu(S, c) {
        return S.profile?'<p>logged in</p>':'<p>logged out</p>';
    },
    renderTools(S, c, tab) {
        return `<p>${tab.title} content goes here.</p>`;
    }
};
</script>
```

### Initialization

Simply include the `auth.js` script in your HTML file after defining your auth settings:

```html
<script>
    // Your authetication settings or settings file.
</script>
<script src="/auth.js"></script>
```

Ensure your configuration settings are loaded before auth.js. Define your settings in a script tag or a separate configuration file.


## The Session Object

The session object (`S`) contains the available information about the session:

- `.profile`: Indicates the user is logged in and contains the user profile data. This is managed by the single sign-on service and cannot be modified by the application.
- `.data`: An object that can store anything needed for the application. This is where you can store application-specific data.
- `.access`: The access level assigned to the user. Users could buy licenses for different features on your site.

### Profile Structure:

```javascript
{
    name: 'John Doe',
    email: 'john.doe@example.com'
    // other user profile data
}
```

### Connector Operations

While the client does not need to call these functions directly for basic setup, here are examples of how these functions might be called in more advanced scenarios:

#### Storing Session Data:

```javascript
(async () => {
    const sessionData = { key: 'value' };
    const currentSession = window.AUTH.getLocalSession();
    window.AUTH.setLocalSession({ ...currentSession, data: sessionData });
    await window.AUTH.sendSession();
    console.log('Updated session data sent to backend');
})();
```


#### Fetching Products:
Deprecated: Fetches all products listed on the the external service. The idea was for the external service to handle this kind information, but we are fousing on authentication for now.
```javascript
(async () => {
    const products = await window.AUTH.fetchProducts();
    console.log(products); // Handle the fetched products data
})();
```

## Configuration Functions

### renderTopMenu(S, c)
Renders the session tools for a logged in user. Can interact with the DOM container directly on `c` or return HTML.

- `S`: The session object containing session information.
- `c`: The container element where the top menu will be rendered.

### renderTools(S, c, tab)
Renders the session tools for a logged in user. Can interact with the DOM container directly on `c` or return HTML.

- `S`: The session object containing session information.
- `c`: The container element where the tools will be rendered.
- `tab`: The currently active tab object, which includes a title to display the tab's content.

### The tabs object
The session tools are handled as tabs with a `label` for the tab button and a `title` for the content area. You can implement your own render function to call from renderTools.
```
{
    label: 'Dashboard',
    title: 'User Dashboard',
    render(S, c) {
        return '<p>Some content</p>';
    }
}
```

# Backend API Documentation

This document outlines the backend requirements for a SSO service to be compatible with `auth.js`.

## Endpoints

### 1. /external_session/autologin (GET)
- **Description**: Retrieves a session initialization token if the user is logged in or false other wise.
- **CORS**: Allows third party sites to load as IFRAME and allows same site cookie headers
- **Request**:
  - Method: GET
  - Parameters: site (current site hostname)
- **Response (if logged in)**:
  - Body: HTML with javascript that does a postMessage to the parent window with the initialization token as data.
- **Response (if logged out)**:
  - Body: HTML with javascript that does a postMessage to the parent window with `false` adata.

### 2. /external_session/v1/store (GET, PUT)
- **Description**: Manages session data storage and retrieval.
- **Request**:
  - Method: GET or PUT
  - Headers: Authorization token
  - Body (PUT only): JSON containing session data to be stored.
  - **GET Parameters**:
    - `profile=1`: Fetches user profile information.
    - `products=1`: Fetches product information (deprecated).
    - `check=1`: Checks session status.
    - Otherwise: Gets the session data (without PUT).
  - **PUT Data**:
      Without profile/products/check GET params, stores the data in the session.
- **Response GET**:
  According to GET params, JSON with the requested data.
- **Response PUT**:
  The session data in JSON.
- **Response Status**:
    - Invalid credentials: 403

### 3. /external_session/v1/init/{site-domain} (GET, PUT)
- **Description**: Exchanges an initialization token for an actual session token.
- **Request**:
  - Method: GET
  - Headers: Authorization token
- **Response JSON**: `{"token": "Session token"}`
- **Response Status**:
    - Invalid credentials: 403

