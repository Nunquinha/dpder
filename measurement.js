window.DPMeasurement=(()=>{
 const normalized=u=>String(u??'').trim().toLowerCase().replace(/²/g,'2').replace(/³/g,'3');
 function unit(u){return String(u??'').trim().replace(/m2/gi,'m²').replace(/m3/gi,'m³').replace(/\*/g,'·').replace(/^un$/i,'un.');}
 function number(value,min=0){let s=String(value??'').trim().replace(',','.');if(!/^\d+(\.\d+)?$/.test(s))return String(value??'');let[a,b='']=s.split('.');b=b.replace(/0+$/,'').padEnd(min,'0');return a+(b?','+b:'')}
 function money(value){const s=number(value,2),parts=s.split(',');return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+parts[1]}
 function same(a,b){try{const [an,ap]=DPCalc.decimal(a),[bn,bp]=DPCalc.decimal(b);return an*10n**BigInt(bp)===bn*10n**BigInt(ap)}catch{return false}}
 const expected={direct:1,length:2,area:3,volume:4},units={length:'m',area:'m2',volume:'m3'};
 function valid(m,u,quantity){return m&&expected[m.type]===m.values?.length&&(!units[m.type]||normalized(u)===units[m.type])&&m.values.every(v=>/^\d+([.,]\d{1,6})?$/.test(String(v)))&&same(DPCalc.multiply(m.values),quantity)}
 function format(m,u,quantity){const output=number(quantity)+' '+unit(u);if(m.type==='direct')return output+' (quantidade informada)';const count=m.values.at(-1),labels=m.type==='length'?['comprimento']:m.type==='area'?['comprimento','largura']:['comprimento','largura','altura'];return labels.map((label,n)=>number(m.values[n])+' m ('+label+')').join(' × ')+' × '+number(count)+' '+(same(count,'1')?'unidade':'unidades')+' = '+output}
 function describe(item){const u=item.unit,quantity=item.quantity;let m=item.measurement;if(valid(m,u,quantity))return format(m,u,quantity);const left=String(item.formula||'').split('=')[0].trim(),values=left.split(/\s*[×x*]\s*/);const type=values.length===1?'direct':normalized(u)==='m'&&values.length===2?'length':normalized(u)==='m2'&&values.length===3?'area':normalized(u)==='m3'&&values.length===4?'volume':null;m={type,values};if(type&&valid(m,u,quantity))return format(m,u,quantity);return String(item.formula||number(quantity)+' '+unit(u)).replace(/\bm2\b/gi,'m²').replace(/\bm3\b/gi,'m³')}
 function cost(item,exact){const u=unit(item.unit),denominator=/[·/*\s]/.test(u)?'('+u+')':u;return number(item.quantity)+' '+u+' × R$ '+money(item.price)+'/'+denominator+' = R$ '+money(exact??DPCalc.multiply([item.quantity,item.price]))}
 return {unit,number,money,describe,cost,format,valid};
})();
