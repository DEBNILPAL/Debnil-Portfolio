document.addEventListener('DOMContentLoaded',function(){hideLoadingScreen();initializeNavigation();initializeTypingEffect();initSkills(document);initProjectFilters();initTechOrbit();initSpaRouter();});

function hideLoadingScreen(){
  const ls=document.getElementById('loading-screen');
  if(ls){ ls.style.display='none'; }

}

// ------- Tech orbit around profile photo -------
function initTechOrbit(){
  const container = document.querySelector('.profile-image');
  const img = document.getElementById('profile-img');
  const orbit = document.querySelector('.tech-orbit');
  if(!container || !img || !orbit) return;

  function updateOrbit(){
    const imgW = img.clientWidth || img.naturalWidth || 240;
    const imgBorder = 2; // matches CSS border on image
    const padding = 8;   // matches CSS padding on .profile-image
    const extra = 18;    // keep icons just outside circumference
    const radius = (imgW/2) + imgBorder + extra; // px
    orbit.style.setProperty('--orbitR', radius + 'px');
    // Optionally keep container large enough (not required for translate)
  }

  if(img.complete){ updateOrbit(); } else { img.addEventListener('load', updateOrbit, {once:true}); }
  window.addEventListener('resize', updateOrbit);
}

function initializeNavigation(){
  const navToggle=document.getElementById('nav-toggle');
  const navMenu=document.getElementById('nav-menu');
  if(navToggle&&navMenu){
    function setMenu(open){
      navMenu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      navToggle.setAttribute('aria-expanded', open? 'true':'false');
    }
    navToggle.setAttribute('aria-expanded','false');
    navToggle.addEventListener('click',()=>{
      const open = !navMenu.classList.contains('open');
      setMenu(open);
    });
    // Close when a link is clicked (mobile)
    navMenu.addEventListener('click',(e)=>{
      const link = e.target.closest('.nav-link');
      if(link){ setMenu(false); }
    });
    // Close on Escape
    document.addEventListener('keydown',(e)=>{
      if(e.key==='Escape'){ setMenu(false); }
    });
    // Close on resize to desktop
    window.addEventListener('resize',()=>{
      if(window.innerWidth>900){ setMenu(false); }
    });
  }
}

function initializeTypingEffect(){const typingText=document.getElementById('typing-text');if(!typingText)return;const texts=['Deep Learning Engineer','Machine Learning Practitioner','AI + Cybersecurity Explorer','Competitive Programmer','Space Tech + ML Integrator'];let i=0,j=0,del=false;function type(){const t=texts[i];typingText.textContent=t.slice(0,j);if(!del&&j<t.length){j++;setTimeout(type,100);}else if(!del&&j===t.length){del=true;setTimeout(type,1200);}else if(del&&j>0){j--;setTimeout(type,40);}else{del=false;i=(i+1)%texts.length;setTimeout(type,300);} } type();}

function initSkills(root){
  const scope = root || document;
  const skillsData={'ai-ml':[ {name:'Python',level:90,icon:'fab fa-python'},{name:'Scikit-learn',level:85,icon:'fas fa-robot'},{name:'Pandas/NumPy',level:88,icon:'fas fa-chart-line'},{name:'ML Ops (Docker)',level:75,icon:'fab fa-docker'},{name:'FastAPI',level:78,icon:'fas fa-bolt'},{name:'Data Visualization',level:80,icon:'fas fa-chart-bar'} ],'deep-learning':[ {name:'PyTorch',level:88,icon:'fas fa-fire'},{name:'TensorFlow/Keras',level:80,icon:'fas fa-microchip'},{name:'CNNs',level:85,icon:'fas fa-images'},{name:'RNN/LSTM',level:75,icon:'fas fa-wave-square'},{name:'Transformers',level:78,icon:'fas fa-project-diagram'},{name:'Computer Vision',level:82,icon:'fas fa-camera'} ],'cybersecurity':[ {name:'Network Security',level:75,icon:'fas fa-network-wired'},{name:'Cryptography',level:72,icon:'fas fa-user-secret'},{name:'Threat Modeling',level:70,icon:'fas fa-shield-alt'},{name:'Anomaly Detection',level:80,icon:'fas fa-radiation'},{name:'Secure Dev Practices',level:78,icon:'fas fa-lock'},{name:'Linux/CLI',level:82,icon:'fas fa-terminal'} ],'competitive-programming':[ {name:'C++',level:85,icon:'fas fa-code'},{name:'Data Structures',level:88,icon:'fas fa-sitemap'},{name:'Graph Algorithms',level:82,icon:'fas fa-project-diagram'},{name:'Dynamic Programming',level:80,icon:'fas fa-chess-knight'},{name:'Number Theory',level:76,icon:'fas fa-superscript'},{name:'Problem Solving',level:90,icon:'fas fa-brain'} ]};

  const grid=scope.querySelector('#skills-grid');
  const catContainer=scope.querySelector('.skills-categories');
  const cats=[...scope.querySelectorAll('.skill-category')];
  if(!grid || !catContainer || cats.length===0){return;}

  function render(cat){grid.innerHTML='';(skillsData[cat]||[]).forEach(s=>{const el=document.createElement('div');el.className='skill-item';el.innerHTML=`<div class="skill-icon"><i class="${s.icon}"></i></div><div class="skill-info"><h4>${s.name}</h4><div class="skill-progress"><div class="skill-progress-bar" style="width:${s.level}%"></div></div><span class="skill-percentage">${s.level}%</span></div>`;grid.appendChild(el);});}

  // Accessibility for category buttons
  cats.forEach(btn=>{btn.setAttribute('role','button');btn.setAttribute('tabindex','0');});

  function activate(btn){if(!btn)return;cats.forEach(x=>x.classList.remove('active'));btn.classList.add('active');render(btn.getAttribute('data-category'))}

  // Initial render based on any existing active, else default to ai-ml
  const initialActive = cats.find(x=>x.classList.contains('active')) || cats[0];
  activate(initialActive);

  // Delegated listeners within this container
  catContainer.addEventListener('click',(e)=>{
    const btn=e.target.closest('.skill-category');
    if(btn && catContainer.contains(btn)) activate(btn);
  });
  catContainer.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'||e.key===' '){
      const btn=e.target.closest('.skill-category');
      if(btn && catContainer.contains(btn)){e.preventDefault();activate(btn);} }
  });
}

// ------- Projects filter (home Featured Projects) -------
function initProjectFilters(){
  const filterBar = document.querySelector('.projects .projects-filter');
  const cards = [...document.querySelectorAll('.projects .project-card')];
  if(!filterBar || cards.length===0) return;

  function applyFilter(key){
    cards.forEach(c=>{
      const cat = c.getAttribute('data-category') || 'all';
      const show = (key==='all') || (cat===key);
      c.style.display = show ? '' : 'none';
    });
  }

  filterBar.addEventListener('click', (e)=>{
    const btn = e.target.closest('.filter-btn');
    if(!btn) return;
    const key = btn.getAttribute('data-filter') || 'all';
    [...filterBar.querySelectorAll('.filter-btn')].forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-pressed','true');
    applyFilter(key);
  });

  // Keyboard support
  filterBar.querySelectorAll('.filter-btn').forEach(b=>{
    b.setAttribute('role','button');
    b.setAttribute('tabindex','0');
    b.addEventListener('keydown',(e)=>{
      if(e.key==='Enter' || e.key===' '){
        e.preventDefault(); b.click();
      }
    });
  });

  // Initial state from current active button
  const active = filterBar.querySelector('.filter-btn.active') || filterBar.querySelector('.filter-btn[data-filter="all"]');
  if(active){ applyFilter(active.getAttribute('data-filter') || 'all'); }
}

// ------- SPA Router -------
function initSpaRouter(){
  const spaRoot = document.getElementById('spa-root');
  const homeRoot = document.getElementById('home-root') || document.body; // fallback
  if(!spaRoot) return;

  // Intercept nav-link clicks
  document.querySelectorAll('.nav-link').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href') || '';
      // Internal routes like /about, /skills, /projects, /blogs, /contact should be handled
      if(href.startsWith('/')){
        e.preventDefault();
        navigateTo(href);
      } else if(href.startsWith('index.html')){
        e.preventDefault();
        if(href.includes('#skills')){
          navigateTo('/').then(()=>{
            const sec=document.getElementById('skills');
            if(sec) sec.scrollIntoView({behavior:'smooth'});
          });
        } else {
          navigateTo('/');
        }
      } else if(href==='#home'){
        e.preventDefault();
        navigateTo('/');
      } else if(href==='#skills'){
        e.preventDefault();
        navigateTo('/').then(()=>{
          const sec=document.getElementById('skills');
          if(sec) sec.scrollIntoView({behavior:'smooth'});
        });
      }
    });
  });

  window.addEventListener('popstate',()=>{
    loadRoute(location.pathname);
  });

  function setActive(path){
    document.querySelectorAll('.nav-link').forEach(l=>{
      const href=l.getAttribute('href');
      l.classList.toggle('active', href===path || (path==='/' && href==='#home'));
    });
  }

  async function navigateTo(path){
    history.pushState({}, '', path);
    await loadRoute(path);
  }

  async function ensureStylesheet(href){
    if([...document.styleSheets].some(s=>s.href && s.href.includes(href))) return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link);
    // no need to await load for non-critical
  }

  function loadScriptOnce(src){
    return new Promise((resolve)=>{
      if(document.querySelector(`script[src="${src}"]`)){return resolve();}
      const s=document.createElement('script');s.src=src;s.onload=()=>resolve();document.body.appendChild(s);
    });
  }

  async function loadRoute(path){
    if(path==='/' || path==='/#home' || path==='#home'){
      if(homeRoot) homeRoot.style.display='';
      spaRoot.style.display='none';
      setActive('/');
      // Remove page-specific classes when returning home
      document.body.classList.remove('skills-page','contact-page');
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    try{
      const res = await fetch(path, {headers:{'X-Requested-With':'fetch'}});
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html,'text/html');
      // Apply page-specific body classes from the fetched document (e.g., skills-page)
      const incomingBodyClasses = [...doc.body.classList];
      document.body.classList.remove('skills-page','contact-page');
      incomingBodyClasses.forEach(c=>document.body.classList.add(c));
      // Collect body children except .navbar, .back-bar, footer and scripts
      const nodes = [...doc.body.children].filter(n=>!n.matches('.navbar,.back-bar,footer,script'));
      const wrapper = document.createElement('div');
      nodes.forEach(n=>wrapper.appendChild(n.cloneNode(true)));
      spaRoot.innerHTML='';
      spaRoot.appendChild(wrapper);
      spaRoot.style.display='';
      if(homeRoot) homeRoot.style.display='none';
      setActive(path);
      window.scrollTo({top:0,behavior:'smooth'});

      // Page specific initializers
      if(path.startsWith('/blogs')){
        await ensureStylesheet('css/blog.css');
        await loadScriptOnce('js/blog.js');
        if(typeof loadBlogPosts==='function'){
          loadBlogPosts({page:1});
          if(typeof initFilters==='function') initFilters();
          if(typeof initSearch==='function') initSearch();
          if(typeof initNewsletter==='function') initNewsletter();
        }
      } else if(path.startsWith('/recommendations')){
        await ensureStylesheet('css/recommendations.css');
        await loadScriptOnce('js/recommendations.js');
        if(typeof initRecommendationForm==='function') initRecommendationForm();
        if(typeof initDiscussionFilters==='function') initDiscussionFilters();
        if(typeof loadDiscussions==='function') loadDiscussions({page:1});
      } else if(path.startsWith('/skills')){
        // Initialize skills within the newly injected DOM only
        if(typeof initSkills==='function') initSkills(spaRoot);
      }
    }catch(err){
      spaRoot.innerHTML = '<div class="container" style="padding:24px"><h2>Failed to load page</h2><p>Please try again.</p></div>';
      spaRoot.style.display='';
      if(homeRoot) homeRoot.style.display='none';
    }
  }
}
