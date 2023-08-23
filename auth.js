(()=>{
    const BACKEND_ORIGIN = new URL(window.AUTH_BACKEND).origin;
    if(location.hash != '#auth') return;

    function setToken(token){
        // TODO: Encrypt it with a fixed obscured key.
        localStorage.uid  = token;
    }

    function getToken(){
        return localStorage.uid;
    }

    (link => {
        link.rel = 'stylesheet';
        var urlObj = new URL(document.currentScript.src);
        urlObj.pathname = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1) + 'auth.css'; // Replace 'yourfile.ext' with your filename

        var absoluteURI = urlObj.toString();        
        link.href = absoluteURI;
        document.head.appendChild(link);
    })(document.createElement('link'));

    (async C => {
        /* Target is a wordpress site served to multiple domains
           including a map from the session domain to target website.
        */
        C.className = 'auth';
        C.innerHTML = `<div class="auth">
            <a href="${window.AUTH_BACKEND}?site=${location.hostname}">Login / Register</a>
        </div>`;

        document.body.appendChild(C);
    })(document.createElement('nav'))

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
		).then(r=>r.json()).then(d=>{
            setToken(d.token);
        });
    }


})();
