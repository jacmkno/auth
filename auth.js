/*
  TODO: HttpOnly token.
  1. On JS load:
     - Check if the token is on a scoped variable, otherwise check in the session data if it is supposed to be on the client site server (if uid is set) an recover it from there if possible
     - On session init store the token in the scoped variable and send it to the server, store a fixed string as stored token in session data.
  2. On getToken, get the token from the scoped variable only, nothing more.
  3. Client site server is expected to have a "session-start" end point that will claim, return the token, and store it associated to a client's site session managed through an HttpOnly cookie.
  4.!!! Instead of recovering the token from the client site when if is expected to be there, first try to simply open an iframe to the backendsite and try getting an init token directly from the access site.
        In this case the access site should only allow being used as an IFRAME on the designated URL for getting an init temporary token or possible a real token directly if it is not going to be passed through any autologged channels.
 */

(async ()=>{
    if(location.hash != '#auth') return;
    
    const BACKEND_ORIGIN = new URL(window.AUTH_BACKEND).origin;
    const BACKEND_HOST = new URL(window.AUTH_BACKEND).hostname;

    function renderSessionBar(passOnValue){
        const session = (()=>{
            try{
                return JSON.parse(localStorage.getItem(BACKEND_HOST));
            }catch{
                return {};
            }
        })();

        (async C => {
            /* Target is a wordpress site served to multiple domains
               including a map from the session domain to target website.
            */
            C.className = 'auth';
            C.innerHTML = `<div class="auth">${
                session.profile
                    ? `<a href="${window.AUTH_BACKEND}?site=${location.hostname}">${session.profile.display_name}</a> | <a href="${window.AUTH_BACKEND}/customer-logout?site=${location.hostname}">Logout</a>`
                    : `<a href="${window.AUTH_BACKEND}?site=${location.hostname}">Login / Register</a>`
            }</div>`;
    
            document.body.appendChild(C);
        })(document.createElement('nav'));
        return passOnValue;    
    }

    function getToken(){
        try{
            return JSON.parse(localStorage.getItem(BACKEND_HOST)).uid;
        }catch{
            return null;
        }
    }

    async function getSession(forceRefresh=false){
        const session = (()=>{
            try{
                return JSON.parse(localStorage.getItem(BACKEND_HOST));
            }catch{
                return {};
            }
        })();
        if(session.uid && !session.data){
            return setSession(session);
        }else if(!session.uid){
            return setSession({});
        }
        return session;
    }

    async function setSession(session){
        localStorage.setItem(BACKEND_HOST, JSON.stringify(session));
        if(session.uid && session.data){
            return fetch(
                `${BACKEND_ORIGIN}/wp-json/external_session/v1/store/${location.hostname}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': session.uid,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(session.data),
                }
            )
            .then(r => [r.json(), r])
            .then(([data, r]) =>
                r.status == 200
                    ? session
                    : (()=>{ throw {message: "Failed to save", response: r}; })()
            );
        }else if(session.uid){
            await fetch(
                `${BACKEND_ORIGIN}/wp-json/external_session/v1/store/${location.hostname}`,
                {headers: {
                    'Authorization': session.uid,
                    'Content-Type': 'application/json'
                }}
            )
            .then(r => [r.json(), r.status])
            .then(([d, status]) =>
                status == 200
                    ? session.data = d
                    : (()=>{ throw r; })()
            ).catch(e => {
                delete session.uid;
            });
            localStorage.setItem(BACKEND_HOST, JSON.stringify(session));
            renderSessionBar();            
        }
        return session;
    }

    async function isSessionActive(profile=false){
        const currentToken = getToken();
        if(!currentToken) {
            renderSessionBar();
            return false;
        }
		return fetch(
			`${BACKEND_ORIGIN}/wp-json/external_session/v1/store/${location.hostname}?${profile?'profile':'check'}=1`,
			{headers: {
				'Authorization': currentToken,
				'Content-Type': 'application/json'
			}}
		)
        .then(async r => {
            const ok = r.status == 200;
            if(!ok) {
                await setSession({});
                return false;
            }
            
            const session = await getSession();
            if(!session.uid) return false;

            if(profile){
                return r.json().then(async profileData => {
                    localStorage.setItem(BACKEND_HOST, JSON.stringify({
                        ...session, profile:profileData
                    }));
                    return profileData;
                });
            }else if(!session.profile){
                return !!isSessionActive(true);
            }else{
                return true;
            }
        })
        .then(renderSessionBar);
    }

    (link => {
        link.rel = 'stylesheet';
        var urlObj = new URL(document.currentScript.src);
        urlObj.pathname = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1) + 'auth.css'; // Replace 'yourfile.ext' with your filename

        var absoluteURI = urlObj.toString();        
        link.href = absoluteURI;
        document.head.appendChild(link);
    })(document.createElement('link'));

    const initToken = await (async () => {
        let rt = new URLSearchParams(window.location.search).get('auth');
        if(!rt) rt = await openIframeAndWaitForMessage(`${BACKEND_ORIGIN}/external_session/autologin?site=${location.hostname}`);
        return rt;
    })();
    
    if(initToken){
        var url = new URL(window.location.href);
        url.searchParams.delete('auth');
        history.pushState(null, null, url.toString());
		fetch(
			`${BACKEND_ORIGIN}/wp-json/external_session/v1/init/${location.hostname}`,
			{headers: {
				'Authorization': initToken,
				'Content-Type': 'application/json'
			}}
		)
        .then(r=>r.json())
        .then(d=>setSession({uid: d.token}));
    }else{
        isSessionActive();
    }

    window.AUTH = {
        getToken,
        isSessionActive,
        getSession,
        setSession
    };
})();


function openIframeAndWaitForMessage(url) {
    return new Promise((resolve, reject) => {
      // Create the iframe element
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.id = 'myIframe';
      iframe.style.display = 'none'; // Hide the iframe
  
      // Append the iframe to the document body
      document.body.appendChild(iframe);
  
      // Function to handle the message event
      const messageHandler = (event) => {
        if (event.source !== iframe.contentWindow) {
            return;
        }  
        // Resolve the promise with the received message
        if(event.data.length){
            resolve(event.data);
        }else{
            reject(false);
        }

  
        // Remove the iframe
        document.body.removeChild(iframe);
  
        // Remove the message event listener
        window.removeEventListener('message', messageHandler);
      };
  
      // Add the message event listener
      window.addEventListener('message', messageHandler);
  
      // Set a timeout to remove the iframe after 5 seconds
      setTimeout(() => {
        // Reject the promise if it hasn't been resolved yet
        reject(false);
  
        // Remove the iframe
        try{
            document.body.removeChild(iframe);
        }catch(e){}
  
        try{
            // Remove the message event listener
            window.removeEventListener('message', messageHandler);
        }catch(e){}
      }, 5000);
    });
}