(()=>{
    if(location.hash != '#auth') return;
    
    const BACKEND_ORIGIN = new URL(window.AUTH_BACKEND).origin;
    const BACKEND_HOST = new URL(window.AUTH_BACKEND).hostname;

    function renderSessionBar(passOnValue){
        const token = getToken();
        (async C => {
            /* Target is a wordpress site served to multiple domains
               including a map from the session domain to target website.
            */
            C.className = 'auth';
            C.innerHTML = `<div class="auth">${
                token
                    ? `<a href="${window.AUTH_BACKEND}/customer-logout?site=${location.hostname}">Logout</a>`
                    : `<a href="${window.AUTH_BACKEND}?site=${location.hostname}">Login / Register</a>`
            }</div>`;
    
            document.body.appendChild(C);
        })(document.createElement('nav'));
        return passOnValue;    
    }

    function getToken(){
        return getSession().uid;
    }

    async function getSession(forceRefresh=false){
        const session = ()=>{
            try{
                return JSON.parse(localStorage.getItem(BACKEND_HOST));
            }catch{
                return {};
            }
        }
        if(session.uid && !session.data){
            return setSession(session);
        }
        return session;
    }

    async function setSession(session){
        localStorage.setItem(BACKEND_HOST, JSON.stringify(session));
        if(session.uid && session.data){
            return fetch(
                `${BACKEND_ORIGIN}/wp-json/external_session/v1/store/${location.hostname}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': session.uid,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data),
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

    async function isSessionActive(){
        const currentToken = getToken();
        if(!currentToken) return false;
		return fetch(
			`${BACKEND_ORIGIN}/wp-json/external_session/v1/store/${location.hostname}?check=1`,
			{headers: {
				'Authorization': currentToken,
				'Content-Type': 'application/json'
			}}
		)
        .then(r=>r.status == 200)
        .then(ok => {
            if(!ok) setSession({});
            return ok;
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

    const initToken = new URLSearchParams(window.location.search).get('auth');
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
        getSession,
        setSession
    };
})();
