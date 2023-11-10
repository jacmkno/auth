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

    const ERRORS = Object.freeze({
        BAD_CREDENTIALS: 1,
        BAD_SERVER: 2
    });
    
    let TOKEN = null;
    
    const BACKEND_ORIGIN = new URL(window.AUTH_SETTINGS.backend).origin;
    const BACKEND_HOST = new URL(window.AUTH_SETTINGS.backend).hostname;

    function renderSessionBar(passOnValue){
        const session = getLocalSession();

        (async C => {
            /* Target is a wordpress site served to multiple domains
                including a map from the session domain to target website.
            */
            C.className = 'auth';

            ((N)=>{
                // Auth Options
                N.className = 'auth';
                N.innerHTML = session.profile
                    ? `<a href="${window.AUTH_SETTINGS.backend}?site=${location.hostname}">${session.profile.display_name}</a> 
                        | <a href="${window.AUTH_SETTINGS.backend}/customer-logout?site=${location.hostname}">Logout</a>
                        ${ window.AUTH_SETTINGS.renderTools 
                            ? `| <a bttools href>Tools</a>`
                            : ''
                        }
                        `
                    : `<a href="${window.AUTH_SETTINGS.backend}?site=${location.hostname}">Login / Register</a>`;
                N.querySelector('A[bttools]').addEventListener('click', e => {
                  e.preventDefault();
                  window.AUTH.showTools();
                });
                C.appendChild(N);
            })(C.querySelector(':scope > div.auth') || document.createElement('div'))
            

            const _r = window.AUTH_SETTINGS.renderTopMenu;
            if(_r) ((N)=>{
                N.className = 'authcli';
                C.appendChild(N);
                const html = _r(session, N);
                if(html) N.innerHTML = html;
            })(C.querySelector('div.authcli') || document.createElement('div'));

            document.body.appendChild(C);
        })(document.querySelector('nav.auth') || document.createElement('nav'));
        return passOnValue;    
    }

    function getLocalSession(){
        try{
            return JSON.parse(localStorage.getItem(BACKEND_HOST));
        }catch{
            return {};
        }
    }

    function setLocalSession(session){
        localStorage.setItem(BACKEND_HOST, JSON.stringify(session));
    }

    function setSessionStatus(values){
        const S = getLocalSession();
        Object.entries(values).forEach(([k,v])=>{
            if(!v && S[k] !== undefined){
                delete S[k];
            } else if(v){
                S[k] = v;
            }
        });
        setLocalSession(S);
        return S;
    }

    async function api(GET = {}, PUT = null, service='store', token=null){
        if(!token) token = TOKEN;
        if(!token){
            killSession();
            throw { key:ERRORS.BAD_CREDENTIALS, message: "Invalid Credentials", source: 'sendSession' };
        }

        const qs = (qs => qs.length ? '?' + qs : '')(new URLSearchParams(GET).toString());
        return fetch(
            BACKEND_ORIGIN + `/wp-json/external_session/v1/${service}/` + location.hostname + (qs), {
                method: PUT ? 'PUT' : 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                ...(PUT ? {body:JSON.stringify(PUT)} : {}),
            }
        )
        .then(async r => ({data: await r.json(), status: r.status}))
        .then(r => {
            if(r.status == 403) {
                killSession();
                throw { key:ERRORS.BAD_CREDENTIALS, message: "Invalid Credentials", source: 'sendSession' };
            }
            if(r.status != 200){
                throw { key: ERRORS.BAD_SERVER, message: "Operation Failed", source: {r, GET, PUT, service, token} };
            }
            return r;
        });
    }

    async function apiInit(){
        const initToken = await (async () => {
            let rt = new URLSearchParams(window.location.search).get('auth');
            if(rt) {
                var url = new URL(window.location.href);
                url.searchParams.delete('auth');
                history.pushState(null, null, url.toString());    
            } else {
                rt = await openIframeAndWaitForMessage(`${BACKEND_ORIGIN}/external_session/autologin?site=${location.hostname}`).catch(e=>null);
            }
            return rt;
        })();

        if(!initToken) return false;

        return api({}, null, 'init', initToken)
            .then(({data:{token}}) => {
                setSessionStatus({uid:true});
                TOKEN = token;
                return true;
            });
    }

    async function killSession(){
        setLocalSession({});
        TOKEN = null;
        renderSessionBar();
    }
    
    async function sendSession(){
        const session = getLocalSession();
        return api({}, session.data || {}).then(r => session);
    }

    async function fetchSession(){
        return api().then(({data}) => {
            const session = {...getLocalSession(), data};
            localStorage.setItem(BACKEND_HOST, JSON.stringify(session));
            return session;
        });
    }

    async function fetchProfile(){
        return api({profile:1}).then(
            ({data}) => setSessionStatus({profile:data}).profile
        );
    }

    async function fetchStatus(){
        return api({check:1}).then(
            r => setSessionStatus({uid:true}).uid
        ).catch(e => {
            if(e.key == ERRORS.BAD_CREDENTIALS){
                return false;
            }
            throw e;
        });
    }

    async function getSessionData(){
        return getLocalSession().data;
    }

    async function updateSessionData(data){
        setSessionStatus({data});
        return sendSession();
    }


    (link => {
        link.rel = 'stylesheet';
        var urlObj = new URL(document.currentScript.src);
        urlObj.pathname = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1) + 'auth.css'; // Replace 'yourfile.ext' with your filename

        var absoluteURI = urlObj.toString();        
        link.href = absoluteURI;
        document.head.appendChild(link);
    })(document.createElement('link'));

    renderSessionBar();
    
    apiInit()
        .then(fetchStatus)
        .then(ok => !ok && (()=>{ throw null; })())
        .then(()=>Promise.all([
            fetchProfile(), 
            fetchSession()
        ]))
        .catch(e => {
            if(e) {
                console.log('ERROR:', e);
                alert(JSON.stringify(e));
            }
        }).finally(renderSessionBar);

    function showTools(){
        const session = getLocalSession();
        document.body.appendChild((w=>{
            w.className = 'auth-tools-wrap auth';
            w.innerHTML = `
                <div class="auth-tools"></div>
                <button close tx-icon>close</button>
            `;
            const at = w.querySelector('auth-tools');
            const rt = window.AUTH_SETTINGS.renderTools(session, at);
            if(rt) at.innerHTML = rt;
            const close = e => {
                e.stopPropagation();
                if(w.parentNode) w.parentNode.removeChild(w);
                document.body.removeEventListener('click', close);
            }
            setTimeout(()=>{
                w.querySelector('button[close]').addEventListener('click', close);
                document.body.appendChild(w);
                document.body.addEventListener('click', close);                
            }, 50);
            return w;
        })(document.createElement('div')));
    }
    
    window.AUTH = {
        renderSessionBar,
        getLocalSession,
        setLocalSession,
        setSessionStatus,
        api,
        apiInit,
        sendSession,
        fetchSession,
        fetchProfile,
        fetchStatus,
        killSession,
        showTools,
        DATA: {
            get: getSessionData,
            set: updateSessionData
        }
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
