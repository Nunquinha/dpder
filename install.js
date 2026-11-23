(()=>{
 let promptEvent;
 const button=document.querySelector('#install-app');
 const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 function close(){document.querySelector('#install-help')?.remove()}
 function help(){
  close();const ios=/iPad|iPhone|iPod/.test(navigator.userAgent),android=/Android/.test(navigator.userAgent),edge=/Edg\//.test(navigator.userAgent),chrome=/Chrome\//.test(navigator.userAgent)&&!edge;
  const dialog=document.createElement('dialog');dialog.id='install-help';dialog.style.cssText='border:1px solid #d4ded7;border-radius:14px;padding:28px;max-width:480px;width:calc(100% - 40px);color:#243d32';
  const steps=ios?'<li>Abra este endereço no <strong>Safari</strong>.</li><li>Toque em <strong>Compartilhar</strong>.</li><li>Escolha <strong>Adicionar à Tela de Início</strong> e confirme.</li>':android?'<li>Abra este endereço no <strong>Chrome</strong>.</li><li>Toque nos três pontos <strong>⋮</strong>.</li><li>Escolha <strong>Adicionar à tela inicial → Instalar</strong>.</li>':edge?'<li>No Edge, clique nos três pontos <strong>⋯</strong>, no canto superior direito.</li><li>Abra <strong>Aplicativos → Instalar este site como aplicativo</strong>.</li><li>Confirme em <strong>Instalar</strong>.</li>':chrome?'<li>No Chrome, clique nos três pontos <strong>⋮</strong>, no canto superior direito.</li><li>Abra <strong>Transmitir, salvar e compartilhar → Instalar página como app</strong>. O nome pode aparecer como <strong>Instalar DP DER</strong>.</li><li>Confirme em <strong>Instalar</strong>.</li>':'<li>Abra o DP DER no <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.</li><li>No menu do navegador, escolha a opção para <strong>instalar a página como aplicativo</strong>.</li>';
  dialog.innerHTML='<h2 style="margin-top:0">Instalar DP DER</h2><p>O app é instalado pelo navegador e abre em uma janela própria.</p><ol style="padding-left:22px;line-height:1.7">'+steps+'</ol><p style="font-size:14px">Se já estiver instalado, procure <strong>DP DER</strong> no menu Iniciar do computador.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="install-copy">Copiar endereço do app</button><button id="install-close" class="primary">Entendi</button></div><p id="install-status" role="status"></p>';
  document.body.append(dialog);dialog.querySelector('#install-close').onclick=()=>dialog.close();dialog.addEventListener('close',close);dialog.querySelector('#install-copy').onclick=async()=>{try{await navigator.clipboard.writeText(new URL('./',location.href).href);dialog.querySelector('#install-status').textContent='Endereço copiado. Cole no Chrome ou Edge.'}catch{dialog.querySelector('#install-status').textContent=new URL('./',location.href).href}};dialog.showModal();
 }
 if(installed())button.hidden=true;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;button.hidden=false});
 window.addEventListener('appinstalled',()=>{promptEvent=null;button.hidden=true;close()});
 button.onclick=async()=>{if(installed()){button.hidden=true;return}if(promptEvent){const event=promptEvent;promptEvent=null;try{await event.prompt();if((await event.userChoice).outcome==='accepted'){button.hidden=true;return}}catch{}}help()};
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
})();
