(function(){
  // Simple parallax for hero bg
  const bg=document.querySelector('.hero-background');
  if(bg){window.addEventListener('scroll',()=>{bg.style.transform=`translateY(${window.scrollY*0.2}px)`;});}
})();
