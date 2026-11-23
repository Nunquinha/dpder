window.DPReportPDF=(()=>{
 async function build(record,options={}){
  if(!record.items?.length)throw Error('Adicione pelo menos um item ao orçamento.');
  const {PDFDocument,StandardFonts,rgb}=PDFLib,doc=await PDFDocument.create(),regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const bytes=options.logoBytes||await fetch('logo-der.jpg').then(r=>{if(!r.ok)throw Error('Logo DER indisponível.');return r.arrayBuffer()});const logo=await doc.embedJpg(bytes),calculation=totals(record),issued=new Date(options.issuedAt||Date.now());
  const W=595.28,H=841.89,M=42,CW=W-2*M,green=rgb(.14,.24,.19),muted=rgb(.40,.46,.42),line=rgb(.84,.88,.85),pale=rgb(.95,.97,.95),white=rgb(1,1,1);let page,y;
  doc.setTitle('DP DER - Memorial de cálculo de danos ao patrimônio');doc.setAuthor('Departamento de Estradas de Rodagem - SP');doc.setSubject('Apropriação de custos e ressarcimento de danos ao patrimônio');doc.setCreator('DP DER - Desenvolvido Por Vinicius Vaz Vieira');doc.setCreationDate(issued);
  function safe(value,font=regular){return Array.from(String(value??'').replace(/[\r\n\t]+/g,' ')).map(c=>{try{font.encodeText(c);return c}catch{return '?'}}).join('')}
  function draw(value,x,top,size=9,font=regular,color=green){page.drawText(safe(value,font),{x,y:H-top-size,size,font,color})}
  function wrap(value,width,size=9,font=regular){const text=safe(value,font),words=text.split(/\s+/),lines=[];let current='';for(const word of words){if(font.widthOfTextAtSize(current?current+' '+word:word,size)<=width){current=current?current+' '+word:word;continue}if(current){lines.push(current);current=''}let part='';for(const c of word){if(font.widthOfTextAtSize(part+c,size)>width&&part){lines.push(part);part=''}part+=c}current=part}if(current||!lines.length)lines.push(current);return lines}
  function paragraph(text,width=CW,size=9,color=muted){for(const lineText of String(text??'').split(/\r?\n/)){for(const s of wrap(lineText,width,size)){ensure(size+6);draw(s,M,y,size,regular,color);y+=size+4}}}
  function newPage(){page=doc.addPage([W,H]);const ratio=logo.width/logo.height,lw=48,lh=48/ratio;page.drawImage(logo,{x:M,y:H-37-lh,width:lw,height:lh});draw('DEPARTAMENTO DE ESTRADAS DE RODAGEM',M+62,39,11,bold);draw('ESTADO DE SÃO PAULO',M+62,57,9,bold);draw('DP DER | DANOS AO PATRIMÔNIO',M+62,73,8,regular,muted);page.drawLine({start:{x:M,y:H-99},end:{x:W-M,y:H-99},thickness:1.8,color:green});y=115}
  function ensure(height){if(y+height>H-62){newPage();return true}return false}
  function section(title){ensure(110);y+=10;draw(title,M,y,11,bold);y+=24}
  function table(headers,widths,rows,alignRight=[]){const headerHeight=28;function header(){page.drawRectangle({x:M,y:H-y-headerHeight,width:CW,height:headerHeight,color:green});let x=M;headers.forEach((h,i)=>{draw(h,x+7,y+8,8,bold,white);x+=widths[i]});y+=headerHeight}ensure(60);header();rows.forEach((cells,index)=>{const content=cells.map((v,i)=>wrap(v,widths[i]-14,8.4));const height=Math.max(32,...content.map(a=>a.length*11+16));if(ensure(height)){draw('Continuação',M,y,9,regular,muted);y+=20;header()}if(index%2===0)page.drawRectangle({x:M,y:H-y-height,width:CW,height,color:pale});let x=M;content.forEach((lines,i)=>{lines.forEach((s,j)=>{const dx=alignRight.includes(i)?widths[i]-7-regular.widthOfTextAtSize(s,8.4):7;draw(s,x+dx,y+8+j*11,8.4)});x+=widths[i]});page.drawLine({start:{x:M,y:H-y-height},end:{x:W-M,y:H-y-height},thickness:.5,color:line});y+=height})}

  function field(label,value){paragraph(label+': '+(value||'Não informado'),CW,9,green)}
  newPage();
  for(const lineText of wrap('APROPRIAÇÃO DE CUSTOS E RESSARCIMENTO DE DANOS AO PATRIMÔNIO',CW,14,bold)){draw(lineText,M,y,14,bold);y+=19}y+=10;
  if(!record.validated){paragraph('MINUTA PARA CONFERÊNCIA - confira medições, regime da TPU e arredondamento.',CW,8);y+=7}
  field('Processo / ocorrência',record.number);field('B.O.',record.bo);
  field('Rodovia',record.road+' | km '+(record.km||'Não informado')+' | Sentido: '+(record.direction||'Não informado'));
  field('Data da ocorrência',DPHistory.date(record.date));field('Responsável / interessado',record.responsible);field('Responsável técnico',record.technician);
  section('1. Descrição do dano');paragraph(record.description||'Não informada.',CW,9,green);
  section('2. Apropriação de custos');
  const perItem=record.rounding!=='total';
  table(['CÓDIGO / SERVIÇO','UN.','QUANTIDADE','UNIT. (R$)',perItem?'TOTAL (R$)':'PRODUTO (R$)'],[221,29,69,85,CW-404],record.items.map((i,n)=>[
   i.code+' - '+i.name+' | TPU: '+(i.reference||'Não informada')+' | '+(i.regime==='D'?'Desonerada':'Não desonerada'),i.unit,String(i.quantity).replace('.',','),DPCalc.amount(DPCalc.cents(i.price)),perItem?DPCalc.amount(DPCalc.cents(calculation.exact[n])):calculation.exact[n].replace('.',',')
  ]),[2,3,4]);
  ensure(63);y+=12;draw('VALOR TOTAL DOS DANOS',M,y,10,bold);const amount='R$ '+DPCalc.amount(calculation.sum);draw(amount,W-M-bold.widthOfTextAtSize(amount,17),y-4,17,bold);y+=30;
  paragraph('Sem BDI ou acréscimos adicionais. Arredondamento decimal, metade para cima. Regra: '+(perItem?'arredondar cada item para centavos e somar.':'somar os produtos exatos e arredondar somente o total.'),CW,8);
  section('3. Memória de cálculo');
  record.items.forEach((i,n)=>{
   ensure(85);paragraph((n+1)+'. '+i.code+' - '+i.name,CW,9,green);
   if(i.note)paragraph('Descrição da medição: '+i.note,CW,8);
   paragraph('Medição: '+(i.formula||String(i.quantity).replace('.',',')+' '+i.unit),CW,9,green);
   paragraph('Custo: '+String(i.quantity).replace('.',',')+' × R$ '+String(i.price).replace('.',',')+' = R$ '+calculation.exact[n].replace('.',','),CW,9,green);y+=9;
  });
  async function embedPhoto(src){
   if(/^data:image\/jpe?g;base64,/.test(src))return doc.embedJpg(src);
   if(/^data:image\/png;base64,/.test(src))return doc.embedPng(src);
   const blob=await fetch(src).then(r=>r.blob()),image=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);image.close();return doc.embedJpg(canvas.toDataURL('image/jpeg',.9));
  }
  if(record.photos?.length){
   for(let n=0;n<record.photos.length;n++){const photo=record.photos[n],image=await embedPhoto(photo.src);newPage();draw('4. Relatório fotográfico',M,y,13,bold);y+=27;
    field('Local',record.road+' | km '+record.km+' | '+(record.direction||'Sentido não informado'));paragraph('Foto '+(n+1)+' - '+(photo.caption||'Sem legenda'),CW,9,green);y+=12;
    const available=H-70-y,scale=Math.min(CW/image.width,available/image.height),iw=image.width*scale,ih=image.height*scale;
    page.drawImage(image,{x:M+(CW-iw)/2,y:H-y-ih,width:iw,height:ih});y+=ih+15;
   }
  }else{section('4. Relatório fotográfico');paragraph('Nenhuma foto anexada.',CW,9,green)}
  const pages=doc.getPages();pages.forEach((p,i)=>{p.drawLine({start:{x:M,y:44},end:{x:W-M,y:44},thickness:.6,color:line});p.drawText('DP DER | Danos ao patrimônio',{x:M,y:29,size:7,font:regular,color:muted});const label=(i+1)+' / '+pages.length;p.drawText(label,{x:W-M-regular.widthOfTextAtSize(label,8),y:29,size:8,font:regular,color:muted})});
  return doc.save();
 }
 return {build};
})();
