const cents = value => Math.round(value * 100);
export function resolveFormAmounts(fields) {
  const active=fields.mode==='house'?['housePrice','downPayment']:['loanAmount'];
  if(fields.loanType==='combined')active.push('fundAmount');
  const values={mode:fields.mode,loanType:fields.loanType};
  for(const key of active){
    if(fields[key]===undefined || String(fields[key]).trim()==='')throw new Error('请完整填写可见的贷款参数');
    values[key]=Number(fields[key]);
  }
  return resolveAmounts(values);
}
function number(value, label, min, max, integer=false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new Error(`${label}须为 ${min}～${max} 范围内的${integer?'整数':'数字'}`);
  return value;
}
export function resolveAmounts({mode,housePrice,downPayment,loanAmount,loanType,fundAmount}) {
  if (!['house','loan'].includes(mode) || !['fund','commercial','combined'].includes(loanType)) throw new Error('请选择有效的贷款类型与计算方式');
  let total,down=0;
  if(mode==='house') {
    number(housePrice,'房价（万元）',0.0001,100000);
    number(downPayment,'首付比例',0,99.99);
    down=cents(housePrice*10000*downPayment/100)/100;
    total=cents(housePrice*10000-down)/100;
  } else total=cents(number(loanAmount,'贷款金额（万元）',0.0001,100000)*10000)/100;
  let fund=loanType==='fund'?total:0;
  if(loanType==='combined') {
    fund=cents(number(fundAmount,'公积金金额（万元）',0.0001,100000)*10000)/100;
    if(fund>=total) throw new Error('组合贷款的公积金金额须小于贷款总额；单一贷款请选择对应类型');
  }
  return {total,downPayment:down,fund,commercial:cents(total-fund)/100};
}
export function fundReferenceRate(years,home='first') {
  number(years,'贷款年限',1,30,true);
  if(!['first','second'].includes(home)) throw new Error('请选择首套或二套');
  return home==='first'?(years<=5?2.1:2.6):(years<=5?2.525:3.075);
}
function loanSchedule({principal,annualRate,years},method) {
  number(principal,'贷款本金（元）',0.01,1e9);number(annualRate,'年利率（%）',0,30);number(years,'贷款年限',1,30,true);
  const p=cents(principal),n=years*12,r=annualRate/1200;
  const payment=method==='annuity'?(r===0?Math.round(p/n):Math.round(p*r/-Math.expm1(-n*Math.log1p(r)))):0;
  let balance=p;
  return Array.from({length:n},(_,i)=>{
    const interest=Math.round(balance*r);
    const repayment=i===n-1?balance:Math.min(balance,method==='annuity'?Math.max(0,payment-interest):Math.round(p/n));
    balance-=repayment;
    return {month:i+1,principal:repayment,interest,payment:repayment+interest,balance};
  });
}
export function calculateMortgage(loans,method='annuity') {
  if(!Array.isArray(loans)||loans.length<1||loans.length>2) throw new Error('请填写一笔或两笔贷款');
  if(!['annuity','principal'].includes(method)) throw new Error('无效的还款方式');
  const schedules=loans.map(loan=>loanSchedule(loan,method));
  const months=Math.max(...schedules.map(s=>s.length));
  const rows=Array.from({length:months},(_,i)=>{
    const row={month:i+1,principal:0,interest:0,payment:0,balance:0};
    for(const schedule of schedules) for(const key of ['principal','interest','payment','balance']) row[key]+=schedule[i]?.[key]??0;
    for(const key of ['principal','interest','payment','balance']) row[key]/=100;
    return row;
  });
  const totalPrincipal=loans.reduce((s,l)=>s+cents(l.principal),0)/100;
  const totalInterest=rows.reduce((s,row)=>s+cents(row.interest),0)/100;
  return {method,rows,months,totalPrincipal,totalInterest,totalPayment:cents(totalPrincipal+totalInterest)/100,firstPayment:rows[0].payment,lastPayment:rows.at(-1).payment};
}
export function scheduleCsv(result,language='zh') {
  const headings=language==='en'?'Payment,Payment (CNY),Principal (CNY),Interest (CNY),Remaining principal (CNY)':'期数,月供（元）,本金（元）,利息（元）,剩余本金（元）';
  return '\uFEFF'+headings+'\r\n'+result.rows.map(row=>[row.month,...['payment','principal','interest','balance'].map(key=>row[key].toFixed(2))].join(',')).join('\r\n');
}
