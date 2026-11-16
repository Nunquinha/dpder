/* Decimal arithmetic: quantities up to 6 decimal places; money rounded half up. */
globalThis.DPCalc=(()=>{function decimal(s){s=String(s).trim().replace(',','.');if(!/^\d+(\.\d{1,30})?$/.test(s))throw Error('Informe um número positivo com até 6 casas decimais, sem separador de milhar.');const [a,b='']=s.split('.');return [BigInt(a+b),b.length]}
function text(n,p){let s=n.toString().padStart(p+1,'0');return p?s.slice(0,-p)+'.'+s.slice(-p):s}
function multiply(values){let n=1n,p=0;for(const v of values){const [a,b]=decimal(v);n*=a;p+=b}return text(n,p)}
function cents(s){let[n,p]=decimal(s);if(p<=2)return n*10n**BigInt(2-p);let d=10n**BigInt(p-2);return (n+d/2n)/d}
function amount(c){return (c/100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+(c%100n).toString().padStart(2,'0')}
return {decimal,multiply,cents,amount}})();

