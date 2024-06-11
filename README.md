
# sson-connector.js

`sson-connector.js` is a JavaScript library designed to manage secure connections and user authentication between a client-side application and a backend server. This library handles token management, session initialization, and API communication, ensuring a seamless authentication experience for users.

## Features

- Secure token management
- User session initialization and management
- API communication with the backend server
- Error handling for authentication and server issues
- Integration with user interface components

## Usage

### Initialization

To start using `sson-connector.js`, include it in your project and initialize the authentication settings. Here's an example of how to integrate it with a single sign-on (SSO) service using `sson-client.js`.

```html
<script src="path/to/sson-connector.js"></script>
<script src="path/to/sson-client.js"></script>
```

### Configuration

Set up the authentication settings in your application. This includes defining the backend URL and initializing the session.

```javascript
window.AUTH_SETTINGS = {
    backend: 'https://your-backend-url.com/my-account/',
    // Additional settings...
};

// Initialize the session
(async () => {
    await window.AUTH.apiInit();
    await window.AUTH.fetchStatus();
    await window.AUTH.fetchProfile();
    await window.AUTH.fetchSession();
    window.AUTH.renderSessionBar();
})();
```

### Token Management

`sson-connector.js` handles token management securely. Here's an example of how to retrieve and store tokens:

```javascript
let TOKEN = null;

async function apiInit() {
    const initToken = await openIframeAndWaitForMessage(`${window.AUTH_SETTINGS.backend}/external_session/autologin?site=${location.hostname}`);
    if (!initToken) return false;

    return window.AUTH.api({}, null, 'init', initToken)
        .then(({ data: { token } }) => {
            window.AUTH.setSessionStatus({ uid: true });
            TOKEN = token;
            return true;
        });
}

// Fetch session status
async function fetchStatus() {
    return window.AUTH.api({ check: 1 })
        .then(() => window.AUTH.setSessionStatus({ uid: true }).uid)
        .catch(e => {
            if (e.key === window.AUTH.ERRORS.BAD_CREDENTIALS) {
                return false;
            }
            throw e;
        });
}
```

### API Communication

`sson-connector.js` provides functions to communicate with the backend API. Here's an example of fetching user profile data:

```javascript
async function fetchProfile() {
    return window.AUTH.api({ profile: 1 })
        .then(({ data }) => window.AUTH.setSessionStatus({ profile: data }).profile);
}
```

### Error Handling

The library includes error handling mechanisms to manage authentication and server issues:

```javascript
const ERRORS = Object.freeze({
    BAD_CREDENTIALS: 1,
    BAD_SERVER: 2
});

async function api(GET = {}, PUT = null, service = 'store', token = null) {
    if (!token) token = TOKEN;
    if (!token) {
        window.AUTH.killSession();
        throw { key: ERRORS.BAD_CREDENTIALS, message: "Invalid Credentials", source: 'sendSession' };
    }

    const qs = new URLSearchParams(GET).toString();
    return fetch(`${window.AUTH_SETTINGS.backend}/wp-json/external_session/v1/${service}/${location.hostname}?${qs}`, {
        method: PUT ? 'PUT' : 'GET',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        ...(PUT ? { body: JSON.stringify(PUT) } : {}),
    })
    .then(async r => ({ data: await r.json(), status: r.status }))
    .then(r => {
        if (r.status === 403) {
            window.AUTH.killSession();
            throw { key: ERRORS.BAD_CREDENTIALS, message: "Invalid Credentials", source: 'sendSession' };
        }
        if (r.status !== 200) {
            throw { key: ERRORS.BAD_SERVER, message: "Operation Failed", source: { r, GET, PUT, service, token } };
        }
        return r;
    });
}
```

### Example Integration

Here's an example of how to integrate `sson-connector.js` with `sson-client.js`:

```javascript
<script src="path/to/sson-connector.js"></script>
<script src="path/to/sson-client.js"></script>

<script>
window.AUTH_SETTINGS = {
    backend: 'https://your-backend-url.com/my-account/',
    tabs: {
        "notifications": { /* ... */ },
        "planes": { /* ... */ }
    },
    // Additional settings...
};

(async () => {
    await window.AUTH.apiInit();
    await window.AUTH.fetchStatus();
    await window.AUTH.fetchProfile();
    await window.AUTH.fetchSession();
    window.AUTH.renderSessionBar();
})();
</script>
```

## Conclusion

`sson-connector.js` provides a robust solution for managing user authentication and session management in your web applications. By following the examples and guidelines provided in this document, you can integrate it seamlessly with your existing projects.
