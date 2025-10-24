// Three.js starfield background
(function(){
  if(window.__space_bg_init) return; // prevent double init across SPA
  window.__space_bg_init = true;

  const CDN = 'https://unpkg.com/three@0.160.0/build/three.min.js';

  function loadThree(){
    return new Promise((resolve, reject)=>{
      if(window.THREE){ return resolve(); }
      const s = document.createElement('script');
      s.src = CDN;
      s.async = true;
      s.onload = ()=> resolve();
      s.onerror = ()=> reject(new Error('Failed to load Three.js'));
      document.head.appendChild(s);
    });
  }

  function init(){
    const THREE = window.THREE;
    if(!THREE) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'space-bg-canvas';
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: '0',
      pointerEvents: 'none'
    });
    document.body.prepend(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 5;

    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 7000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const velocities = new Float32Array(starCount); // forward motion
    const phases = new Float32Array(starCount); // twinkle phase

    const colorDark = new THREE.Color(0x9fb3ff);
    const colorAccent = new THREE.Color(0x7adfff);

    for(let i=0;i<starCount;i++){
      const i3 = i*3;
      const radius = 105 * Math.pow(Math.random(), 0.7);
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2*Math.random() - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3+1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3+2] = radius * Math.cos(phi);

      const c = colorDark.clone().lerp(colorAccent, Math.random()*0.9);
      colors[i3] = c.r; colors[i3+1] = c.g; colors[i3+2] = c.b;

      velocities[i] = 0.02 + Math.random()*0.08;
      phases[i] = Math.random() * Math.PI * 2;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Round, soft star sprite
    function makeStarTexture(){
      const size = 64;
      const cvs = document.createElement('canvas');
      cvs.width = cvs.height = size;
      const ctx = cvs.getContext('2d');
      const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.2, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.25)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,size,size);
      const tex = new THREE.CanvasTexture(cvs);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    }

    const starTexture = makeStarTexture();
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.07,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Subtle nebula fog tint based on theme
    function applyTheme(){
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      const bg = light ? 0xeef4ff : 0x0f0f23;
      scene.fog = new THREE.FogExp2(bg, light ? 0.0015 : 0.004);
      starsMaterial.opacity = light ? 0.65 : 0.95;
      starsMaterial.size = light ? 0.085 : 0.07;
    }
    applyTheme();

    // React to theme toggle if available
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Resize handling
    function resize(){
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', resize);
    resize();

    // Mouse parallax
    let targetX = 0, targetY = 0;
    window.addEventListener('pointermove', (e)=>{
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      targetX = x * 0.3;
      targetY = y * 0.2;
    });

    // Scroll depth influences camera z
    function scrollZ(){
      const maxZ = 7;
      const minZ = 4.5;
      const t = Math.min(1, window.scrollY / 2000);
      camera.position.z = minZ + (maxZ - minZ) * t;
    }
    window.addEventListener('scroll', scrollZ, { passive: true });
    scrollZ();

    // Animate
    let last = performance.now();
    function animate(now){
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // drift
      stars.rotation.y += 0.005 * dt;
      stars.rotation.x += 0.0015 * dt;

      // forward motion + recycle
      const pos = starsGeometry.attributes.position.array;
      for(let i=0;i<starCount;i++){
        const i3 = i*3;
        pos[i3+2] += velocities[i] * dt * 60;
        if(pos[i3+2] > 60){
          pos[i3+2] = -80 - Math.random()*40; // send back
          pos[i3] = (Math.random()-0.5) * 120;
          pos[i3+1] = (Math.random()-0.5) * 120;
        }
        phases[i] += dt;
      }
      starsGeometry.attributes.position.needsUpdate = true;

      // subtle global twinkle
      const tw = 0.02 * Math.sin(now*0.002);
      starsMaterial.size += tw;
      starsMaterial.size = Math.max(0.06, Math.min(starsMaterial.size, 0.1));

      camera.rotation.y += (targetX - camera.rotation.y) * 0.06;
      camera.rotation.x += (-targetY - camera.rotation.x) * 0.06;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  loadThree().then(init).catch(()=>{
    // fail silently; site works without background
  });
})();
