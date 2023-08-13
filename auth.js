(()=>{
    if(location.hash != '#auth') return;

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
            <a href="https://access.activisual.net/wp-login.php?site=${location.hostname}">Login</a>
            <a href="https://access.activisual.net/wp-login.php?action=register&site=${location.hostname}">Register</a>
        </div>`;

        document.body.appendChild(C);
    })(document.createElement('nav'))

})();
