/* ────────────────────────────────────────────
   STATE (in-memory, replaces Supabase)
──────────────────────────────────────────── */
let state = {
    perfis: [
        { id: 'p1', nome: 'Ana Beatriz Souza', cargo: 'Professor' },
        { id: 'p2', nome: 'Carlos Eduardo Lima', cargo: 'Professor' },
        { id: 'p3', nome: 'Fernanda Martins', cargo: 'Coordenador' },
        { id: 'p4', nome: 'Roberto Alves', cargo: 'Professor' },
    ],
    recursos: [
        { id: 'r1', nome_recurso: 'Sala 101', tipo_recurso: 'Sala', status: 'Disponível' },
        { id: 'r2', nome_recurso: 'Laboratório de Informática', tipo_recurso: 'Sala', status: 'Disponível' },
        { id: 'r3', nome_recurso: 'Lab. de Robótica', tipo_recurso: 'Sala', status: 'Manutenção' },
        { id: 'r4', nome_recurso: 'iPad #01', tipo_recurso: 'Dispositivo', status: 'Disponível' },
        { id: 'r5', nome_recurso: 'iPad #02', tipo_recurso: 'Dispositivo', status: 'Disponível' },
        { id: 'r6', nome_recurso: 'Chromebook #01', tipo_recurso: 'Dispositivo', status: 'Manutenção' },
    ],
    reservas: [],
};

// Pre-seed a few reservations for the current week
(function seedReservas() {
    const today = new Date();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const fmt = d => d.toISOString().slice(0, 10);

    const seeds = [
        { id: 'res1', id_usuario: 'p1', id_recurso: 'r1', data_reserva: fmt(mon), horario_reserva: '1º Horário' },
        { id: 'res2', id_usuario: 'p2', id_recurso: 'r2', data_reserva: fmt(mon), horario_reserva: '2º Horário' },
        { id: 'res3', id_usuario: 'p3', id_recurso: 'r4', data_reserva: fmt(addDays(mon, 1)), horario_reserva: '3º Horário' },
        { id: 'res4', id_usuario: 'p4', id_recurso: 'r1', data_reserva: fmt(addDays(mon, 2)), horario_reserva: '1º Horário' },
    ];
    state.reservas = seeds;
})();

function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function uuid() { return 'id-' + Math.random().toString(36).slice(2); }

/* ────────────────────────────────────────────
   ROUTING
──────────────────────────────────────────── */
function navigate(page) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelector(`.sidebar-item[data-page="${page}"]`).classList.add('active');
    if (page === 'dashboard') renderDashboard();
    if (page === 'nova-reserva') renderNovaReserva();
    if (page === 'admin') renderAdmin();
}

document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
});

/* ────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────── */
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DAYS_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function fmtDate(str) {
    // str = 'yyyy-MM-dd'
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
}

function weekRange() {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun
    const mon = new Date(today); mon.setDate(today.getDate() - ((dow + 6) % 7));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const fmt = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
        inicio: mon,
        fim: sun,
        label: `Reservas ativas de ${fmt(mon)} a ${fmt(sun)}/${sun.getFullYear()}.`
    };
}

function toISODate(d) { return d.toISOString().slice(0, 10); }

function badge(tipo) {
    if (tipo === 'Sala') return `<span class="badge badge-sala">Sala</span>`;
    return `<span class="badge badge-dispositivo">Dispositivo</span>`;
}
function badgeStatus(s) {
    if (s === 'Disponível') return `<span class="badge badge-disponivel">${s}</span>`;
    return `<span class="badge badge-manutencao">${s}</span>`;
}

/* ────────────────────────────────────────────
   TOAST
──────────────────────────────────────────── */
function toast(msg, type = 'success') {
    const icon = type === 'success'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = icon + `<span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

/* ────────────────────────────────────────────
   DASHBOARD
──────────────────────────────────────────── */
function renderDashboard() {
    const { inicio, fim, label } = weekRange();
    document.getElementById('dash-period').textContent = label;

    const startStr = toISODate(inicio);
    const endStr = toISODate(fim);

    const semana = state.reservas.filter(r => r.data_reserva >= startStr && r.data_reserva <= endStr);

    document.getElementById('stat-reservas').textContent = semana.length;
    document.getElementById('stat-salas').textContent = state.recursos.filter(r => r.tipo_recurso === 'Sala').length;
    document.getElementById('stat-dispositivos').textContent = state.recursos.filter(r => r.tipo_recurso === 'Dispositivo').length;

    const filtroData = document.getElementById('filtro-data').value;
    const filtroTipo = document.getElementById('filtro-tipo').value;

    let lista = semana;
    if (filtroData) lista = lista.filter(r => r.data_reserva === filtroData);
    if (filtroTipo !== 'todos') lista = lista.filter(r => {
        const rec = state.recursos.find(x => x.id === r.id_recurso);
        return rec && rec.tipo_recurso === filtroTipo;
    });

    lista.sort((a, b) => a.data_reserva.localeCompare(b.data_reserva));

    const tbody = document.getElementById('dash-tbody');
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="td-empty">Nenhuma reserva encontrada.</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(r => {
        const perfil = state.perfis.find(p => p.id === r.id_usuario);
        const recurso = state.recursos.find(x => x.id === r.id_recurso);
        return `<tr>
        <td class="td-name">${fmtDate(r.data_reserva)}</td>
        <td>${r.horario_reserva}</td>
        <td>${recurso ? recurso.nome_recurso : '—'}</td>
        <td>${recurso ? badge(recurso.tipo_recurso) : '—'}</td>
        <td>
          <div class="td-name">${perfil ? perfil.nome : '—'}</div>
          <div class="td-sub">${perfil ? perfil.cargo : ''}</div>
        </td>
      </tr>`;
    }).join('');
}

document.getElementById('filtro-data').addEventListener('input', renderDashboard);
document.getElementById('filtro-tipo').addEventListener('change', renderDashboard);

/* ────────────────────────────────────────────
   NOVA RESERVA
──────────────────────────────────────────── */
function renderNovaReserva() {
    const sel = document.getElementById('nr-usuario');
    const rec = document.getElementById('nr-recurso');

    sel.innerHTML = `<option value="">Selecione um usuário</option>` +
        state.perfis.map(p => `<option value="${p.id}">${p.nome} — ${p.cargo}</option>`).join('');

    rec.innerHTML = `<option value="">Selecione um recurso</option>` +
        state.recursos.filter(r => r.status === 'Disponível')
            .sort((a, b) => a.nome_recurso.localeCompare(b.nome_recurso))
            .map(r => `<option value="${r.id}">${r.nome_recurso} (${r.tipo_recurso})</option>`).join('');
}

document.getElementById('btn-confirmar').addEventListener('click', () => {
    const usuario = document.getElementById('nr-usuario').value;
    const recurso = document.getElementById('nr-recurso').value;
    const data = document.getElementById('nr-data').value;
    const horario = document.getElementById('nr-horario').value;

    if (!usuario || !recurso || !data || !horario) {
        toast('Preencha todos os campos.', 'error'); return;
    }

    const conflito = state.reservas.find(r => r.id_recurso === recurso && r.data_reserva === data && r.horario_reserva === horario);
    if (conflito) { toast('Este recurso já está reservado para este dia e horário!', 'error'); return; }

    state.reservas.push({ id: uuid(), id_usuario: usuario, id_recurso: recurso, data_reserva: data, horario_reserva: horario });
    toast('Reserva confirmada com sucesso!');

    document.getElementById('nr-recurso').value = '';
    document.getElementById('nr-data').value = '';
    document.getElementById('nr-horario').value = '';
});

/* ────────────────────────────────────────────
   ADMIN
──────────────────────────────────────────── */
function renderAdmin() {
    const tbody = document.getElementById('admin-tbody');
    if (state.recursos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="td-empty">Nenhum recurso cadastrado.</td></tr>`;
        return;
    }
    const sorted = [...state.recursos].sort((a, b) => a.nome_recurso.localeCompare(b.nome_recurso));
    tbody.innerHTML = sorted.map(r => {
        const toggleLabel = r.status === 'Disponível'
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Manutenção`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="20 6 9 17 4 12"/></svg> Disponível`;
        return `<tr>
        <td class="td-name">${r.nome_recurso}</td>
        <td>${badge(r.tipo_recurso)}</td>
        <td>${badgeStatus(r.status)}</td>
        <td style="text-align:right">
          <div style="display:flex;justify-content:flex-end;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="toggleStatus('${r.id}')">${toggleLabel}</button>
            <button class="btn btn-ghost btn-sm" onclick="removeRecurso('${r.id}')">
              <svg class="icon-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
}

document.getElementById('btn-cadastrar').addEventListener('click', () => {
    const nome = document.getElementById('admin-nome').value.trim();
    const tipo = document.getElementById('admin-tipo').value;
    if (!nome || !tipo) { toast('Preencha nome e tipo do recurso.', 'error'); return; }
    state.recursos.push({ id: uuid(), nome_recurso: nome, tipo_recurso: tipo, status: 'Disponível' });
    document.getElementById('admin-nome').value = '';
    document.getElementById('admin-tipo').value = '';
    toast('Recurso cadastrado!');
    renderAdmin();
});

function toggleStatus(id) {
    const r = state.recursos.find(x => x.id === id);
    if (!r) return;
    r.status = r.status === 'Disponível' ? 'Manutenção' : 'Disponível';
    toast('Status atualizado.');
    renderAdmin();
}

function removeRecurso(id) {
    state.recursos = state.recursos.filter(x => x.id !== id);
    state.reservas = state.reservas.filter(x => x.id_recurso !== id);
    toast('Recurso removido.');
    renderAdmin();
}

/* ────────────────────────────────────────────
   INIT
──────────────────────────────────────────── */
renderDashboard();
