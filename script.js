(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const input = $('image-input'), uploadArea = $('upload-area'), editorArea = $('editor-area');
  const canvas = $('preview-canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
  const controls = $('controls-content'), status = $('status-message'), download = $('download-button');
  let currentTool = 'compress', originalImage = null, originalName = 'image', originalMime = 'image/png';
  let basePixels = null, originalCanvas = null, currentURL = null, brushActive = false, brushSize = 22, lastPoint = null;
  const toolInfo = {
    cleaner: ['Mark Cleaner', 'Brush over small unwanted marks on images you own or are authorized to edit. This basic tool softens the selected area; it is not AI inpainting.'],
    background: ['Background Remover', 'Select a plain background colour to make similar pixels transparent. Results depend on the image and colour contrast.'],
    enhance: ['Image Enhancer', 'Tune brightness, contrast and saturation, then export the improved image.'],
    compress: ['Image Compressor', 'Choose an export format and quality to reduce file size.'],
    convert: ['Image Converter', 'Convert your image to PNG, JPEG or WebP. Transparent pixels become white when exporting to JPEG.'],
    resize: ['Image Resizer', 'Set new pixel dimensions and optionally keep the original aspect ratio.']
  };
  $('year').textContent = new Date().getFullYear();
  function setTool(name) {
    currentTool = name in toolInfo ? name : 'compress';
    $('workspace-title').textContent = toolInfo[currentTool][0];
    $('workspace-description').textContent = toolInfo[currentTool][1];
    $('active-tool-label').textContent = toolInfo[currentTool][0].toUpperCase();
    $('controls-title').textContent = 'Tool settings'; status.textContent = '';
    document.querySelectorAll('.tool-card').forEach(card => card.classList.toggle('selected', card.dataset.tool === currentTool));
    renderControls(); $('workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.querySelectorAll('.tool-card').forEach(card => card.addEventListener('click', () => setTool(card.dataset.tool)));
  $('choose-image').addEventListener('click', () => input.click());
  uploadArea.addEventListener('click', e => { if (!e.target.closest('button')) input.click(); });
  ['dragenter','dragover'].forEach(ev => uploadArea.addEventListener(ev, e => { e.preventDefault(); uploadArea.classList.add('dragging'); }));
  ['dragleave','drop'].forEach(ev => uploadArea.addEventListener(ev, e => { e.preventDefault(); uploadArea.classList.remove('dragging'); }));
  uploadArea.addEventListener('drop', e => { const file = e.dataTransfer.files && e.dataTransfer.files[0]; if (file) loadFile(file); });
  input.addEventListener('change', () => { if (input.files && input.files[0]) loadFile(input.files[0]); });
  function loadFile(file) {
    if (!file.type.startsWith('image/')) { alert('Please choose a valid image file.'); return; }
    if (file.size > 25 * 1024 * 1024) { alert('Please choose an image smaller than 25 MB.'); return; }
    originalName = file.name.replace(/\.[^.]+$/, '') || 'image'; originalMime = file.type;
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      if (currentURL) URL.revokeObjectURL(currentURL); currentURL = url; originalImage = img;
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      originalCanvas = document.createElement('canvas'); originalCanvas.width = canvas.width; originalCanvas.height = canvas.height;
      originalCanvas.getContext('2d').drawImage(img, 0, 0);
      basePixels = originalCanvas.getContext('2d', {willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height);
      uploadArea.classList.add('hidden'); editorArea.classList.remove('hidden'); $('canvas-placeholder').classList.add('hidden');
      $('image-dimensions').textContent = `${canvas.width} × ${canvas.height}`;
      $('preview-note').textContent = `${file.name} · ${(file.size/1024).toFixed(0)} KB`;
      download.disabled = false; renderControls(); drawBase(); status.textContent = 'Image ready to edit.';
    };
    img.onerror = () => { URL.revokeObjectURL(url); alert('Could not open this image. Please try another file.'); };
    img.src = url;
  }
  function field(label, inner, extra='') { return `<div class="field ${extra}"><label>${label}</label>${inner}</div>`; }
  function range(id, label, min, max, value, suffix='') { return field(`${label}<output id="${id}-value">${value}${suffix}</output>`, `<input type="range" id="${id}" min="${min}" max="${max}" value="${value}" step="1">`); }
  function select(id, label, options) { return field(label, `<select id="${id}">${options.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`); }
  function renderControls() {
    if (!originalImage) { controls.innerHTML = '<p class="empty-controls">Upload an image to unlock the controls.</p>'; return; }
    if (currentTool === 'enhance') controls.innerHTML = range('brightness','Brightness',-100,100,0)+range('contrast','Contrast',-100,100,0)+range('saturation','Saturation',0,200,100,'%');
    else if (currentTool === 'compress') controls.innerHTML = select('format','Export format',[['image/webp','WebP'],['image/jpeg','JPEG'],['image/png','PNG']])+range('quality','Image quality',10,100,82,'%')+'<p class="preview-note">PNG is lossless; quality settings apply to JPEG and WebP.</p>';
    else if (currentTool === 'convert') controls.innerHTML = select('format','Convert to',[['image/png','PNG'],['image/jpeg','JPEG'],['image/webp','WebP']])+'<p class="preview-note">JPEG does not support transparency; transparent areas will be filled white.</p>';
    else if (currentTool === 'resize') controls.innerHTML = field('Width (px)','<input type="number" id="width" min="1" max="12000" value="'+canvas.width+'">')+field('Height (px)','<input type="number" id="height" min="1" max="12000" value="'+canvas.height+'">')+field('Aspect ratio','<label class="inline-check"><input type="checkbox" id="lock-ratio" checked> Keep proportions</label>');
    else if (currentTool === 'background') controls.innerHTML = '<p class="preview-note">Click a pixel in the image to sample the background colour.</p>'+range('tolerance','Colour tolerance',0,150,35)+field('Sampled colour','<div id="sample-color" style="height:28px;border-radius:7px;background:#ffffff22;border:1px solid #ffffff20"></div>')+'<button class="button secondary" id="sample-bg" type="button">Pick background colour</button><p class="preview-note">Best for plain, single-colour backgrounds. Complex backgrounds may leave edges.</p>';
    else controls.innerHTML = range('brush','Brush size',5,80,22,' px')+'<p class="preview-note">Drag over a small area to soften it with nearby pixels. This is a basic retouch tool, not AI object reconstruction. Use only on images you own or have permission to edit.</p>';
    if (currentTool === 'enhance') ['brightness','contrast','saturation'].forEach(id => $(id).addEventListener('input', () => { $(id+'-value').textContent = $(id).value+(id==='saturation'?'%':''); drawEnhanced(); }));
    if (currentTool === 'compress') $('quality').addEventListener('input', () => $('quality-value').textContent = $('quality').value+'%');
    if (currentTool === 'background') { $('tolerance').addEventListener('input', () => $('tolerance-value').textContent = $('tolerance').value); $('sample-bg').addEventListener('click', () => { status.textContent = 'Click the background area in the image preview.'; canvas.style.cursor='crosshair'; canvas.addEventListener('click', sampleBackground, {once:true}); }); }
    if (currentTool === 'resize') { const ratio = canvas.width/canvas.height; $('width').addEventListener('input', () => { if ($('lock-ratio').checked && $('width').value) $('height').value = Math.max(1,Math.round(Number($('width').value)/ratio)); }); $('height').addEventListener('input', () => { if ($('lock-ratio').checked && $('height').value) $('width').value = Math.max(1,Math.round(Number($('height').value)*ratio)); }); }
    if (currentTool === 'cleaner') { $('brush').addEventListener('input', () => { brushSize=Number($('brush').value); $('brush-value').textContent=brushSize+' px'; }); canvas.onpointerdown = startBrush; canvas.onpointermove = moveBrush; canvas.onpointerup = endBrush; canvas.onpointerleave = endBrush; canvas.style.touchAction='none'; }
    else { canvas.onpointerdown=null;canvas.onpointermove=null;canvas.onpointerup=null;canvas.onpointerleave=null;canvas.style.touchAction='auto'; }
  }
  function drawBase() { if (!originalCanvas) return; canvas.width=originalCanvas.width; canvas.height=originalCanvas.height; ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(originalCanvas,0,0); }
  function drawEnhanced() { drawBase(); const b=Number($('brightness').value), c=Number($('contrast').value), s=Number($('saturation').value); const img=ctx.getImageData(0,0,canvas.width,canvas.height), d=img.data; const factor=(259*(c+255))/(255*(259-c)); for(let i=0;i<d.length;i+=4){for(let j=0;j<3;j++){let v=d[i+j];v=factor*(v-128)+128+b*1.4;const gray=.299*d[i]+.587*d[i+1]+.114*d[i+2];v=gray+(v-gray)*s/100;d[i+j]=Math.max(0,Math.min(255,v));}}ctx.putImageData(img,0,0); }
  let bgColor=null;
  function sampleBackground(e) { const p=canvasPoint(e); const d=ctx.getImageData(p.x,p.y,1,1).data; bgColor=[d[0],d[1],d[2]]; $('sample-color').style.background=`rgb(${d[0]},${d[1]},${d[2]})`; canvas.style.cursor='default'; status.textContent='Background colour sampled. Preview updated.'; removeBackground(); }
  function removeBackground() { if(!bgColor)return; drawBase(); const im=ctx.getImageData(0,0,canvas.width,canvas.height),d=im.data,t=Number($('tolerance').value); for(let i=0;i<d.length;i+=4){const dist=Math.sqrt((d[i]-bgColor[0])**2+(d[i+1]-bgColor[1])**2+(d[i+2]-bgColor[2])**2);if(dist<t*1.7){d[i+3]=Math.round(d[i+3]*Math.max(0,dist/(t*1.7)));}}ctx.putImageData(im,0,0); }
  function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width-1,Math.floor((e.clientX-r.left)/r.width*canvas.width))),y:Math.max(0,Math.min(canvas.height-1,Math.floor((e.clientY-r.top)/r.height*canvas.height)))};}
  function startBrush(e){if(currentTool!=='cleaner'||!originalImage)return;brushActive=true;lastPoint=canvasPoint(e);canvas.setPointerCapture?.(e.pointerId); e.preventDefault();}
  function moveBrush(e){if(!brushActive||currentTool!=='cleaner')return;const p=canvasPoint(e),r=Number($('brush').value);ctx.save();ctx.globalAlpha=.45;ctx.filter='blur(7px)';ctx.drawImage(canvas,Math.max(0,p.x-r),Math.max(0,p.y-r),Math.min(r*2,canvas.width),Math.min(r*2,canvas.height),Math.max(0,p.x-r),Math.max(0,p.y-r),Math.min(r*2,canvas.width),Math.min(r*2,canvas.height));ctx.restore();lastPoint=p;}
  function endBrush(){if(brushActive){brushActive=false;status.textContent='Retouch applied. Download to save the result.';}}
  $('undo-button').addEventListener('click', () => { if(!originalImage)return; bgColor=null; drawBase(); if(currentTool==='enhance'){['brightness','contrast'].forEach(id=>{if($(id))$(id).value=0;});if($('saturation'))$('saturation').value=100;['brightness','contrast','saturation'].forEach(id=>{if($(id+'-value'))$(id+'-value').textContent=$(id).value+(id==='saturation'?'%':'');});} if(currentTool==='background') $('sample-color').style.background='#ffffff22'; status.textContent='Preview reset to the original image.'; });
  $('reset-tool').addEventListener('click', () => { if(currentURL){URL.revokeObjectURL(currentURL);currentURL=null;} originalImage=null;originalCanvas=null;basePixels=null;input.value='';uploadArea.classList.remove('hidden');editorArea.classList.add('hidden');download.disabled=true;status.textContent='';$('canvas-placeholder').classList.remove('hidden');$('workspace-title').textContent='Choose a tool to begin';$('workspace-description').textContent='Select any tool above, then upload an image to get started.'; });
  download.addEventListener('click', () => { if(!originalImage)return; let mime='image/png', quality=1; if(currentTool==='compress'||currentTool==='convert'){mime=$('format').value;if(mime!=='image/png')quality=currentTool==='compress'?Number($('quality').value)/100:.92;} if(currentTool==='resize'){const w=Number($('width').value),h=Number($('height').value);if(!w||!h||w>12000||h>12000){status.textContent='Enter valid dimensions between 1 and 12000 pixels.';return;}const out=document.createElement('canvas');out.width=w;out.height=h;out.getContext('2d').drawImage(canvas,0,0,w,h);exportCanvas(out,mime,quality);return;} exportCanvas(canvas,mime,quality); });
  function exportCanvas(source,mime,quality){const out=document.createElement('canvas');out.width=source.width;out.height=source.height;const o=out.getContext('2d');if(mime==='image/jpeg'){o.fillStyle='#ffffff';o.fillRect(0,0,out.width,out.height);}o.drawImage(source,0,0);out.toBlob(blob=>{if(!blob){status.textContent='Could not export this image. Try another format.';return;}const ext=mime==='image/jpeg'?'jpg':mime.split('/')[1];const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=`${originalName}-mecro.${ext}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);status.textContent=`Export ready · ${(blob.size/1024).toFixed(0)} KB`;},mime,quality);}
  // Give the image workspace an initial functional tool without forcing a scroll.
  renderControls();
})();
