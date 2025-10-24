// Disable theme switching: force single mode (default variables in :root)
(function(){
  try{
    // Ensure we don't apply light theme ever
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.style.display = 'none';
  }catch(e){/* no-op */}
})();
