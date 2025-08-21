const API = {
  list: (params = {}) =>
    fetch('/api/items' + toQuery(params)).then((r) => r.json()),
  create: (body) =>
    fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  update: (id, body) =>
    fetch('/api/items/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  remove: (id) =>
    fetch('/api/items/' + id, { method: 'DELETE' }).then((r) => r.json()),
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = { items: [], installingEvent: null };

window.addEventListener('online', () => $('#offlineTip').classList.add('hidden'));
window.addEventListener('offline', () => $('#offlineTip').classList.remove('hidden'));
if (!navigator.onLine) $('#offlineTip').classList.remove('hidden');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.installingEvent = e;
  $('#installTip').classList.remove('hidden');
});
$('#installTip')?.addEventListener('click', async () => {
  if (state.installingEvent) {
    state.installingEvent.prompt();
    await state.installingEvent.userChoice;
    $('#installTip').classList.add('hidden');
    state.installingEvent = null;
  }
});

$('#notifBtn')?.addEventListener('click', async () => {
  if (!('Notification' in window))
    return alert('Seu navegador não suporta notificações.');
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm !== 'granted') return alert('Permissão negada.');
  new Notification('Notificações ativadas no VisorIA');
});

function notifyIfNeeded(items) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  items.forEach((it) => {
    if (it.status === 'vencido')
      new Notification(`VENCIDO: ${it.name}`, {
        body: `Venceu há ${Math.abs(it.daysLeft)} dia(s).`,
      });
    else if (it.status === 'vermelho')
      new Notification(`ATENÇÃO: ${it.name}`, {
        body: `${it.daysLeft} dia(s) para vencer.`,
      });
  });
}

function toQuery(obj) {
  const params = new URLSearchParams(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== '')
  );
  return params.toString() ? '?' + params.toString() : '';
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}
function escapeHtml(s) {
  return (s || '').replace(/[&<>"]/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

async function loadAndRender() {
  const q = $('#search').value.trim();
  const status = $('#statusFilter').value;
  const items = await API.list({ q, status, sort: 'daysLeft', order: 'asc' });
  state.items = items;
  renderTable(items);
  notifyIfNeeded(items);
}

function renderTable(list) {
  const tbody = $('#itemsTable tbody');
  tbody.innerHTML = '';
  list.forEach((it) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(it.name)}<br><small class="muted">${escapeHtml(
      it.category || ''
    )} ${escapeHtml(it.location ? '· ' + it.location : '')}</small></td>
      <td>${it.quantity}</td>
      <td>${fmtDate(it.expiryDate)}</td>
      <td>${it.daysLeft}d</td>
      <td><span class="badge ${it.status}">${it.status}</span></td>
      <td class="actions">
        <button class="link" data-act="edit" data-id="${it.id}">Editar</button>
        <button class="link" data-act="del" data-id="${it.id}">Excluir</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

$('#itemForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: $('#name').value.trim(),
    quantity: Number($('#quantity').value || 1),
    expiry_input: $('#expiry').value.trim(),
    category: $('#category').value.trim(),
    location: $('#location').value.trim(),
    notes: $('#notes').value.trim(),
  };
  const res = await API.create(payload);
  if (res.error) return alert(res.error);
  e.target.reset();
  loadAndRender();
});

$('#itemsTable')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.act === 'del') {
    if (confirm('Excluir este item?')) {
      await API.remove(id);
      loadAndRender();
    }
  } else if (btn.dataset.act === 'edit') {
    const it = state.items.find((x) => x.id === id);
    if (!it) return;
    $('#editId').value = id;
    $('#editName').value = it.name;
    $('#editQuantity').value = it.quantity;
    $('#editExpiry').value = '';
    $('#editCategory').value = it.category || '';
    $('#editLocation').value = it.location || '';
    $('#editNotes').value = it.notes || '';
    $('#editDialog').showModal();
  }
});

$('#editForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = Number($('#editId').value);
  const body = {
    name: $('#editName').value.trim(),
    quantity: Number($('#editQuantity').value || 1),
    expiry_input: $('#editExpiry').value.trim() || undefined,
    category: $('#editCategory').value.trim(),
    location: $('#editLocation').value.trim(),
    notes: $('#editNotes').value.trim(),
  };
  const res = await API.update(id, body);
  if (res.error) return alert(res.error);
  $('#editDialog').close();
  loadAndRender();
});

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
$('#voiceBtn')?.addEventListener('click', () => {
  if (!SR) return alert('Seu navegador não suporta reconhecimento de voz.');
  const r = new SR();
  r.lang = 'pt-BR';
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.start();
  r.onresult = async (evt) => {
    const said = evt.results[0][0].transcript.toLowerCase();
    const name = (said.match(/nome\s*:\s*([^;]+)/) || [])[1] ||
      said.split(',')[0] || said;
    const qty = Number((said.match(/quantidade\s*:\s*(\d+)/) || [])[1] || 1);
    const val = (said.match(/validade\s*:\s*([^;]+)/) || [])[1] || '';
    const payload = {
      name: name.trim(),
      quantity: qty,
      expiry_input: val.trim(),
    };
    const res = await API.create(payload);
    if (res.error) alert(res.error);
    else loadAndRender();
  };
  r.onerror = () => alert('Falha no reconhecimento de voz.');
});

// initial load
loadAndRender();