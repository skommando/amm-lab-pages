const money = value => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const description = (name, row) => `${name}：本金 ${money(row.principal)} 元，利息 ${money(row.interest)} 元，月供 ${money(row.payment)} 元`;

// 两套方案共用最大月供作为横轴上限，不把每期条形强制归一化。
export function buildChartRows(results) {
  if (!results) return null;
  return {
    maxPayment: Math.max(...results.principal.rows.map(row => row.payment), ...results.annuity.rows.map(row => row.payment)),
    rows: results.principal.rows.map((row, index) => ({ month: row.month, principal: row, annuity: results.annuity.rows[index] })),
  };
}

export function chartRowsHtml(model) {
  if (!model) return '';
  const bar = row => `<span class="chart-track"><span class="chart-principal" style="width:${row.principal / model.maxPayment * 100}%"></span><span class="chart-interest" style="width:${row.interest / model.maxPayment * 100}%"></span></span>`;
  return model.rows.map((row, index) => `<button type="button" class="chart-row" data-month="${row.month}" tabindex="${index === 0 ? 0 : -1}" aria-pressed="${index === 0}" aria-label="第 ${row.month} 期；${description('等额本金', row.principal)}；${description('等额本息', row.annuity)}"><span aria-hidden="true" class="chart-month">${row.month}</span><span aria-hidden="true">${bar(row.principal)}</span><span aria-hidden="true">${bar(row.annuity)}</span></button>`).join('');
}

export function chartOverviewHtml(model) {
  if (!model) return '';
  const count = model.rows.length;
  const height = 280 / count;
  const ticks = `<div class="chart-overview-ticks" aria-hidden="true"><span>1</span><span>${Math.ceil(count / 2)}</span><span>${count}</span></div>`;
  const columns = ['principal', 'annuity'].map(method => {
    const bars = model.rows.map((row, index) => {
      const principal = row[method].principal / model.maxPayment * 100;
      const interest = row[method].interest / model.maxPayment * 100;
      return `<rect class="chart-principal" x="0" y="${index * height}" width="${principal}" height="${height}"/><rect class="chart-interest" x="${principal}" y="${index * height}" width="${interest}" height="${height}"/>`;
    }).join('');
    return `<svg viewBox="0 0 100 280" preserveAspectRatio="none" role="img" aria-label="${method === 'principal' ? '等额本金' : '等额本息'}，从上到下为第1至${count}期，本金深蓝、利息橙色，具体金额见下方逐期查看">${bars}</svg>`;
  }).join('');
  return ticks + columns;
}

export function createMortgageChart(document) {
  const panel = document.getElementById('chart-panel');
  const rowsElement = document.getElementById('chart-rows');
  const detail = document.getElementById('chart-detail');
  let model = null;
  let selected = null;
  function select(button) {
    if (!button || !model) return;
    if (selected) { selected.tabIndex = -1; selected.setAttribute('aria-pressed', 'false'); }
    selected = button;
    selected.tabIndex = 0;
    selected.setAttribute('aria-pressed', 'true');
    const row = model.rows[Number(button.dataset.month) - 1];
    detail.replaceChildren();
    for (const text of [`第 ${row.month} / ${model.rows.length} 期`, description('等额本金', row.principal), description('等额本息', row.annuity)]) {
      const line = document.createElement('span'); line.textContent = text; detail.append(line);
    }
  }
  for (const event of ['click', 'focusin', 'pointerover']) rowsElement.addEventListener(event, e => select(e.target.closest('.chart-row')));
  rowsElement.addEventListener('keydown', event => {
    const button = event.target.closest('.chart-row');
    if (!button) return;
    const index = Number(button.dataset.month) - 1;
    const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: model.rows.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = rowsElement.children[Math.max(0, Math.min(model.rows.length - 1, next))];
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest' });
  });
  return results => {
    model = buildChartRows(results);
    panel.hidden = !model;
    rowsElement.innerHTML = chartRowsHtml(model);
    document.getElementById('chart-overview').innerHTML = chartOverviewHtml(model);
    rowsElement.scrollTop = 0;
    selected = null;
    detail.replaceChildren();
    document.getElementById('chart-scale').textContent = model ? `共同横轴：0 — ${money(model.maxPayment)} 元 / 期 · 共 ${model.rows.length} 期` : '';
    if (model) select(rowsElement.firstElementChild);
  };
}
