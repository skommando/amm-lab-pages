import {resolveFormAmounts,calculateMortgage,fundReferenceRate,scheduleCsv} from './mortgage.mjs';
import {createMortgageChart} from './chart.mjs';
const $=id=>document.getElementById(id);
const form=$('loan-form');
const renderChart=createMortgageChart(document);
const money=value=>value.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
let results=null,method='annuity',all=false,downloadUrl=null;
function loanType(){return form.elements.loanType.value;}
function num(id){if($(id).value.trim()==='') throw new Error('请完整填写可见的贷款参数');return Number($(id).value);}
function amounts(){return resolveFormAmounts({mode:$('mode').value,housePrice:$('house-price').value,downPayment:$('down-payment').value,loanAmount:$('loan-amount').value,loanType:loanType(),fundAmount:$('fund-amount').value});}
function updateFields(){
  const type=loanType();
  $('house-fields').hidden=$('mode').value!=='house';$('loan-field').hidden=$('mode').value!=='loan';
  $('fund-fields').hidden=type==='commercial';$('commercial-fields').hidden=type==='fund';$('fund-amount-field').hidden=type!=='combined';
  try {const a=amounts();$('amount-note').textContent=`贷款 ${money(a.total/10000)} 万元${$('mode').value==='house'?` · 首付 ${money(a.downPayment/10000)} 万元`:''}`;$('commercial-amount').textContent=`商贷金额：${money(a.commercial/10000)} 万元${type==='combined'?'（总额减去公积金）':''}`;}
  catch{$('amount-note').textContent='请填写有效金额';$('commercial-amount').textContent='';}
}
function invalidate(){results=null;renderChart(null);$('result').hidden=true;$('schedule-panel').hidden=true;$('empty-result').hidden=false;$('status').className='';$('status').textContent='参数已修改，请重新计算';$('export-status').textContent='';updateFields();}
function preset(){if($('fund-preset').value==='custom')return;try{$('fund-rate').value=fundReferenceRate(num('fund-years'),$('fund-preset').value);}catch{}}
form.addEventListener('input',event=>{if(event.target.id==='fund-rate')$('fund-preset').value='custom';if(event.target.id==='fund-years')preset();invalidate();});
form.addEventListener('change',event=>{if(event.target.id==='fund-preset')preset();invalidate();});
function calculate(){
  try {
    const a=amounts(),loans=[];
    if(a.fund>0)loans.push({principal:a.fund,annualRate:num('fund-rate'),years:num('fund-years')});
    if(a.commercial>0)loans.push({principal:a.commercial,annualRate:num('commercial-rate'),years:num('commercial-years')});
    results={annuity:calculateMortgage(loans,'annuity'),principal:calculateMortgage(loans,'principal')};all=false;updateFields();render();renderChart(results);
    $('status').className='';$('status').textContent='已按当前参数计算';
  }catch(error){invalidate();$('status').className='error';$('status').textContent=error.message;}
}
function render(){
  for(const m of ['annuity','principal'])$(m).setAttribute('aria-pressed',String(m===method));
  if(!results)return;
  const r=results[method];$('result').hidden=false;$('schedule-panel').hidden=false;$('empty-result').hidden=true;
  $('payment-label').textContent=method==='annuity'?'首月月供 · 等额本息':'首月月供 · 等额本金';
  $('first-payment').textContent=money(r.firstPayment);$('months').textContent=r.months;
  $('payment-note').textContent=`末期 ${money(r.lastPayment)} 元${loanType()==='combined'?' · 分项结清后月供变化':''}`;
  $('total-principal').textContent=money(r.totalPrincipal);$('total-interest').textContent=money(r.totalInterest);$('total-payment').textContent=money(r.totalPayment);
  const pct=r.totalPrincipal/r.totalPayment*100;$('principal-bar').style.width=pct+'%';$('principal-share').textContent=`本金 ${pct.toFixed(1)}%`;$('interest-share').textContent=`利息 ${(100-pct).toFixed(1)}%`;
  const saving=results.annuity.totalInterest-results.principal.totalInterest;
  $('comparison').textContent=`相同条件下，等额本金比等额本息少付利息 ${money(saving)} 元；首月月供相差 ${money(results.principal.firstPayment-results.annuity.firstPayment)} 元。`;
  const rows=all?r.rows:r.rows.slice(0,12);
  $('schedule').replaceChildren(...rows.map(row=>{const tr=document.createElement('tr');for(const key of ['month','payment','principal','interest','balance']){const td=document.createElement('td');td.textContent=key==='month'?row[key]:money(row[key]);tr.append(td);}return tr;}));
  $('row-count').textContent=`显示 ${rows.length} / ${r.months} 期`;$('show-all').hidden=r.months<=12;$('show-all').textContent=all?'收起至前 12 期':'展开全部期数';
  $('export-status').textContent='';
}
form.addEventListener('submit',event=>{event.preventDefault();calculate();});
// reset 事件发生在浏览器恢复默认值之前；下一任务再读取表单。
form.addEventListener('reset',()=>{setTimeout(()=>{method='annuity';preset();calculate();},0);});
for(const m of ['annuity','principal'])$(m).addEventListener('click',()=>{method=m;render();});
$('show-all').addEventListener('click',()=>{all=!all;render();});
$('export').addEventListener('click',()=>{
  if(!results)return;
  if(downloadUrl)URL.revokeObjectURL(downloadUrl);
  downloadUrl=URL.createObjectURL(new Blob([scheduleCsv(results[method])],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=downloadUrl;a.download=`房贷还款计划-${method==='annuity'?'等额本息':'等额本金'}.csv`;document.body.append(a);a.click();a.remove();
  $('export-status').textContent='CSV 已生成；若浏览器未保存，请用页面顶部“独立打开”后重试。';
});
window.addEventListener('pagehide',()=>{if(downloadUrl)URL.revokeObjectURL(downloadUrl);});
updateFields();calculate();
