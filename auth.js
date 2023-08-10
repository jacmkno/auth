(()=>{
    if(location.hash != '#auth') return;

    (link => {
        console.log('XXXX:', link);
        link.rel = 'stylesheet';
        var urlObj = new URL(document.currentScript.src);
        urlObj.pathname = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1) + 'auth.css'; // Replace 'yourfile.ext' with your filename

        var absoluteURI = urlObj.toString();        
        link.href = absoluteURI;
        document.head.appendChild(link);
    })(document.createElement('link'));

    (async C => {
        console.log('ZZZZ:', C);
        C.className = 'auth';
        C.innerText = 'Session tools...';
        document.body.appendChild(C);
    })(document.createElement('nav'))

})();
