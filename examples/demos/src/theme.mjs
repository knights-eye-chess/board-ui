// Runs before the stylesheet to avoid flashing the wrong saved theme.
(() => {
  const root=document.documentElement;
  let saved;
  try {saved=localStorage.getItem('board-ui-demo-theme')} catch {}
  root.dataset.theme=['light','dark'].includes(saved)?saved:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  function label(button) {
    const dark=root.dataset.theme==='dark';
    button.textContent=dark?'Light mode':'Dark mode';
    button.setAttribute('aria-pressed',String(dark));
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const button=document.querySelector('#theme-toggle');label(button);
    button.addEventListener('click',()=>{
      root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';label(button);
      try {localStorage.setItem('board-ui-demo-theme',root.dataset.theme)} catch {}
    });
  },{once:true});
})();
