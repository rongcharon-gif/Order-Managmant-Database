
const $=id=>document.getElementById(id),money=n=>'৳'+Number(n||0).toLocaleString('en-BD',{maximumFractionDigits:2});
const bnDate=()=>new Date().toISOString().slice(0,10);
let orders=JSON.parse(localStorage.orders||'[]'),products=JSON.parse(localStorage.products||'[]'),settings=JSON.parse(localStorage.settings||'{}'),draftItems=[],viewing=null,editingProduct=-1;
const deliveryStatuses=['অর্ডার কনফার্ম','পার্সেল পাঠানো হয়েছে','ডেলিভারি সম্পন্ন','ডেলিভারি ব্যর্থ','রিটার্ন হয়েছে'];
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function persist(){localStorage.orders=JSON.stringify(orders);localStorage.products=JSON.stringify(products);localStorage.settings=JSON.stringify(settings);renderAll()}
function showTab(id){document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function addItem(name='',price=0,qty=1){draftItems.push({id:Math.random().toString(36).slice(2),name,price,qty});renderItems()}
function renderItems(){$('items').innerHTML='';draftItems.forEach(it=>{let d=document.createElement('div');d.className='product-row';d.innerHTML=`<input aria-label="পণ্যের নাম" placeholder="পণ্যের নাম" value="${esc(it.name)}"><input aria-label="পরিমাণ" type="number" min="1" value="${it.qty}"><input aria-label="একক দাম" type="number" min="0" value="${it.price}"><button class="remove" aria-label="বাদ দিন">×</button>`;let [n,q,p,rm]=d.children;n.oninput=()=>{it.name=n.value;calc()};q.oninput=()=>{it.qty=Math.max(1,+q.value||1);calc()};p.oninput=()=>{it.price=Math.max(0,+p.value||0);calc()};rm.onclick=()=>{draftItems=draftItems.filter(x=>x.id!==it.id);renderItems()};$('items').append(d)});calc()}

function calc(){
let sub=draftItems.reduce((a,x)=>a+(+x.qty||0)*(+x.price||0),0);
let discountPercent=Math.min(100,Math.max(0,+$('discount').value||0));
let dis=sub*discountPercent/100;
let del=+$('deliveryZone').value||0;
let tot=Math.max(0,sub-dis+del);
let paid=Math.max(0,+$('paid').value||0);
let due=Math.max(0,tot-paid);
$('subtotal').textContent=money(sub);
$('discountView').textContent=money(dis);
$('deliveryView').textContent=money(del);
$('total').textContent=money(tot);
$('paidView').textContent=money(paid);
$('due').textContent=money(due);
return{sub,dis,discountPercent,del,tot,paid,due,deliveryZone:del===60?'গাজীপুরের ভিতরে':'সারা বাংলাদেশ'};
}

function setDelivery(){calc()}
function resetForm(){['customer','phone','address','note'].forEach(x=>$(x).value='');$('discount').value=0;$('deliveryZone').value='130';$('paid').value=0;$('payment').value='ক্যাশ অন ডেলিভারি';$('orderDate').value=bnDate();draftItems=[];addItem()}
function pickProduct(){let p=products[+$('productPicker').value];if(p)addItem(p.name,p.price,1);$('productPicker').value=''}
function saveProduct(){let name=$('pname').value.trim(),price=+$('pprice').value;if(!name||!Number.isFinite(price)||price<0)return alert('পণ্যের নাম ও সঠিক দাম লিখুন।');if(editingProduct>=0)products[editingProduct]={name,price};else products.push({name,price});editingProduct=-1;$('pname').value='';$('pprice').value='';$('productList').dataset.edit='';persist()}
function editProduct(i){editingProduct=i;$('pname').value=products[i].name;$('pprice').value=products[i].price;$('pname').focus()}
function deleteProduct(i){if(confirm('এই পণ্যটি তালিকা থেকে মুছবেন?')){products.splice(i,1);persist()}}
function saveSettings(){settings={storeName:$('storeName').value.trim()||'রঙচরণ',storePhone:$('storePhone').value.trim(),storePage:$('storePage').value.trim(),storeAddress:$('storeAddress').value.trim(),sheetUrl:$('sheetUrl').value.trim()};persist();alert('সেটিংস সেভ হয়েছে।')}

function buildOrder(){
let c=calc(),customer=$('customer').value.trim(),phone=$('phone').value.trim(),address=$('address').value.trim();
if(!customer||!phone||!address){alert('কাস্টমারের নাম, ফোন নম্বর ও সম্পূর্ণ ঠিকানা লিখুন।');return null}
if(!draftItems.length||draftItems.some(x=>!x.name.trim()||x.qty<1||x.price<0)){alert('কমপক্ষে একটি পণ্যের নাম, পরিমাণ ও সঠিক দাম যোগ করুন।');return null}
if(c.dis>c.sub){alert('ছাড়ের পরিমাণ পণ্যের মোট দামের চেয়ে বেশি হতে পারবে না।');return null}
return{id:'RC-'+Date.now().toString().slice(-8),date:$('orderDate').value||bnDate(),customer,phone,address,items:draftItems.map(({name,qty,price})=>({name,qty:+qty,price:+price})),...c,payment:$('payment').value,status:'অর্ডার কনফার্ম',note:$('note').value.trim(),createdAt:new Date().toISOString()}
}

async function saveOrder(){let o=buildOrder();if(!o)return;orders.unshift(o);persist();showMemo(o);if(settings.sheetUrl){$('syncStatus').textContent='Google Sheet-এ অর্ডার পাঠানো হচ্ছে…';try{await sendToSheet(o);$('syncStatus').textContent='অর্ডারের তথ্য Google Sheet-এ পাঠানো হয়েছে (শিটে row দেখে নিশ্চিত করুন)।'}catch(e){$('syncStatus').textContent='Sheet sync হয়নি; অর্ডার এই ডিভাইসে সেভ আছে।'}}alert('অর্ডার সেভ হয়েছে: '+o.id);resetForm()}
async function sendToSheet(o){return fetch(settings.sheetUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(o)})}
async function testSheet(){saveSettings();if(!settings.sheetUrl)return alert('আগে Web App URL দিন।');try{await fetch(settings.sheetUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({type:'test',id:'CONNECTION-TEST',date:new Date().toISOString()})});alert('টেস্ট রিকোয়েস্ট পাঠানো হয়েছে। Google Sheet-এর Orders tab-এ CONNECTION-TEST এসেছে কি না দেখুন।')}catch(e){alert('সংযোগ ব্যর্থ: '+e.message)}}
function previewDraft(){let o=buildOrder();if(o)showMemo(o)}

function memoHTML(o){
let s=settings;
let discountPercent=o.discountPercent??(o.sub?o.dis/o.sub*100:0);
return `<div class="memohead"><img class="memo-logo" src="brand-logo.jpg"><h2>${esc(s.storeName||'রঙচরণ')}</h2><div>Girls’ Accessories</div><div>${esc(s.storeAddress||'')}</div><div>${esc(s.storePhone||'')} ${s.storePage?' · '+esc(s.storePage):''}</div><h3>ক্যাশ মেমো / অর্ডার ইনভয়েস</h3></div><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><b>কাস্টমার:</b> ${esc(o.customer)}<br><b>মোবাইল:</b> ${esc(o.phone)}<br><b>ঠিকানা:</b> ${esc(o.address)}</div><div><b>অর্ডার নং:</b> ${esc(o.id)}<br><b>তারিখ:</b> ${esc(o.date)}<br><b>স্ট্যাটাস:</b> ${esc(o.status)}</div></div><table style="margin-top:18px"><thead><tr><th>পণ্যের নাম</th><th>পরিমাণ</th><th>দাম</th><th>মোট</th></tr></thead><tbody>${o.items.map(i=>`<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(i.qty*i.price)}</td></tr>`).join('')}</tbody></table><div style="margin-left:auto;max-width:270px;margin-top:12px"><div class="total"><span>পণ্যের মোট দাম</span><b>${money(o.sub)}</b></div><div class="total"><span>ছাড় (${discountPercent}%)</span><b>${money(o.dis)}</b></div><div class="total"><span>ডেলিভারি (${esc(o.deliveryZone||'')})</span><b>${money(o.del)}</b></div><div class="total grand"><span>সর্বমোট</span><b>${money(o.tot)}</b></div><div class="total"><span>অগ্রিম জমা</span><b>${money(o.paid)}</b></div><div class="total"><span>বকেয়া</span><b>${money(o.due)}</b></div></div><p><b>পেমেন্ট:</b> ${esc(o.payment)}</p>${o.note?`<p><b>নোট:</b> ${esc(o.note)}</p>`:''}<div class="memofoot"><span>কাস্টমারের স্বাক্ষর</span><span>রঙচরণ</span></div><p style="text-align:center;margin-top:25px;color:#76152b">রঙচরণের সাথে থাকার জন্য ধন্যবাদ ♡</p>`
}

function showMemo(o){viewing=o;$('memo').innerHTML=memoHTML(o);showTab('memoPanel')}

function customerCopyText(o){
let discountPercent=o.discountPercent??(o.sub?o.dis/o.sub*100:0);
return `${settings.storeName||'রঙচরণ'} — অর্ডার ইনভয়েস\nঅর্ডার নং: ${o.id}\nতারিখ: ${o.date}\n\nকাস্টমার: ${o.customer}\nমোবাইল: ${o.phone}\nঠিকানা: ${o.address}\n\n${o.items.map((i,n)=>`${n+1}. ${i.name} — ${i.qty} × ${money(i.price)} = ${money(i.qty*i.price)}`).join('\n')}\n\nপণ্যের মোট: ${money(o.sub)}\nছাড় (${discountPercent}%): ${money(o.dis)}\nডেলিভারি (${o.deliveryZone}): ${money(o.del)}\nসর্বমোট: ${money(o.tot)}\nঅগ্রিম: ${money(o.paid)}\nবকেয়া: ${money(o.due)}\nপেমেন্ট: ${o.payment}\n\nরঙচরণের সাথে থাকার জন্য ধন্যবাদ ♡`
}

async function shareCustomerCopy(){if(!viewing)return;let txt=customerCopyText(viewing);if(navigator.share){try{await navigator.share({title:'রঙচরণ অর্ডার ইনভয়েস',text:txt})}catch(e){if(e.name!=='AbortError')copyCustomerText(txt)}}else copyCustomerText(txt)}
async function copyCustomerText(txt){try{await navigator.clipboard.writeText(txt);alert('কাস্টমার ইনভয়েস কপি হয়েছে। এখন WhatsApp/Messenger-এ পেস্ট করে পাঠান।')}catch(e){prompt('নিচের ইনভয়েস কপি করে পাঠান:',txt)}}

function renderOrders(){let q=($('searchOrders')?.value||'').toLowerCase(),arr=orders.filter(o=>(o.id+' '+o.customer+' '+o.phone).toLowerCase().includes(q));$('orderList').innerHTML=arr.length?arr.map(o=>`<div class="order"><div style="min-width:0"><b>${esc(o.customer)}</b> <span class="pill">${esc(o.status)}</span><div class="muted">${esc(o.id)} · ${esc(o.date)} · ${esc(o.phone)}</div><b>${money(o.tot)}</b><div class="field" style="margin-top:7px"><label>পার্সেলের বর্তমান অবস্থা</label><select class="status-select" onchange="updateStatus('${o.id}',this.value)">${deliveryStatuses.map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></div></div><div class="actions"><button class="btn secondary small" onclick="openOrder('${o.id}')">ইনভয়েস</button><button class="btn danger small" onclick="deleteOrder('${o.id}')">মুছুন</button></div></div>`).join(''):'<p class="muted">কোনো অর্ডার পাওয়া যায়নি।</p>'}
function updateStatus(id,status){let o=orders.find(x=>x.id===id);if(o){o.status=status;persist();renderOrders();if(settings.sheetUrl)sendToSheet({...o,type:'status_update'}).catch(()=>{});}}
function openOrder(id){let o=orders.find(x=>x.id===id);if(o)showMemo(o)}
function deleteOrder(id){if(confirm('এই অর্ডারটি মুছবেন?')){orders=orders.filter(o=>o.id!==id);persist()}}
function renderProducts(){$('productList').innerHTML=products.length?products.map((p,i)=>`<div class="order"><span><b>${esc(p.name)}</b><br><span class="muted">${money(p.price)}</span></span><div class="actions"><button class="btn secondary small" onclick="editProduct(${i})">এডিট</button><button class="btn danger small" onclick="deleteProduct(${i})">মুছুন</button></div></div>`).join(''):'<p class="muted">এখনো কোনো পণ্য যোগ করা হয়নি।</p>';$('productPicker').innerHTML='<option value="">পণ্য বাছাই করুন</option>'+products.map((p,i)=>`<option value="${i}">${esc(p.name)} — ${money(p.price)}</option>`).join('')}
function renderAll(){renderOrders();renderProducts();$('statOrders').textContent=orders.length.toLocaleString('bn-BD');$('statSales').textContent=money(orders.filter(o=>o.status!=='রিটার্ন হয়েছে').reduce((a,o)=>a+o.tot,0));$('statDue').textContent=money(orders.filter(o=>o.status!=='রিটার্ন হয়েছে').reduce((a,o)=>a+o.due,0));$('recent').innerHTML=orders.slice(0,5).map(o=>`<div class="order"><div><b>${esc(o.customer)}</b><div class="muted">${esc(o.id)} · ${esc(o.date)} · ${esc(o.status)}</div></div><b>${money(o.tot)}</b></div>`).join('')||'এখনো কোনো অর্ডার নেই।';$('syncStatus').textContent=settings.sheetUrl?'Google Sheet-এর Web App URL সেট করা আছে।':'এখনো Google Sheet সংযোগ দেওয়া হয়নি।'}
function exportJSON(){let blob=new Blob([JSON.stringify({orders,products,settings},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rongcharon-backup.json';a.click();URL.revokeObjectURL(a.href)}
function importJSON(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);orders=d.orders||[];products=d.products||[];settings=d.settings||{};persist();loadSettings();alert('ব্যাকআপ ফিরিয়ে আনা হয়েছে।')}catch(_){alert('ফাইলটি সঠিক ব্যাকআপ নয়।')}};r.readAsText(f)}
function clearAll(){if(confirm('সব অর্ডার, পণ্য ও সেটিংস মুছে যাবে। নিশ্চিত?')){orders=[];products=[];settings={storeName:'রঙচরণ'};localStorage.clear();persist();loadSettings()}}
function loadSettings(){for(let k of ['storeName','storePhone','storePage','storeAddress','sheetUrl'])$(k).value=settings[k]??(k==='storeName'?'রঙচরণ':'')}
function init(){settings.storeName=settings.storeName||'রঙচরণ';loadSettings();$('orderDate').value=bnDate();$('deliveryZone').value='130';renderAll();addItem();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{})}
init();
