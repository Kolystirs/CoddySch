function _init() {
    $(document).ready(function () {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem("token");
        if (!token) return window.location.href = '/login';

        const userId = parseInt(localStorage.getItem("userId"));
        const role = localStorage.getItem("role");

        let schedulesMap = {};
        let editingReportId = null;
        let allReports = [];
        let groups = {};
        let reportToDeleteId = null;

        loadSchedules()
            .then(loadGroups)
            .then(loadReports);

        function loadSchedules() {
            return $.ajax({
                url: `${API_BASE}/schedules`,
                headers: { "Authorization": `Bearer ${token}` },
                success: data => data.forEach(s => schedulesMap[s.schedule_id] = s),
                error: () => showMessage('Ошибка при загрузке расписаний', 'danger')
            });
        }

        function loadGroups() {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: `${API_BASE}/groups/info`,
                    headers: { "Authorization": `Bearer ${token}` },
                    success(data) {
                        if (role === "Преподаватель") {
                            data = data.filter(g => g.teacher && g.teacher.user_id === userId);
                        }
                        groups = data.reduce((acc, g) => {
                            acc[g.group_id] = g.group_name;
                            return acc;
                        }, {});
                        resolve();
                    },
                    error: () => {
                        showMessage('Ошибка при загрузке групп', 'danger');
                        reject();
                    }
                });
            });
        }

        function loadReports() {
            $.ajax({
                url: `${API_BASE}/reports`,
                headers: { "Authorization": `Bearer ${token}` },
                success(reports) {
                    if (role === "Преподаватель") {
                        const myGroupIds = Object.keys(groups).map(Number);
                        allReports = reports.filter(rp => {
                            const sched = schedulesMap[rp.schedule_id];
                            return sched && myGroupIds.includes(sched.group.group_id);
                        });
                    } else {
                        allReports = reports;
                    }
                    renderReportList(allReports);
                    bindEvents();
                },
                error: () => showMessage('Ошибка при загрузке отчётов', 'danger')
            });
        }

        function getDaysAgoString(diff) {
            if (diff === 0) return 'сегодня';
            const abs = Math.abs(diff), r10 = abs % 10, r100 = abs % 100;
            const suf = (r10 === 1 && r100 !== 11) ? 'день' :
                        (r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14)) ? 'дня' : 'дней';
            return diff > 0 ? `через ${abs} ${suf}` : `${abs} ${suf} назад`;
        }

        function formatDate(str) {
            return new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        }

        function fillGroupFilter() {
            const $sel = $('#groupFilter');
            $sel.empty().append('<option value="">Все группы</option>');
            Object.entries(groups).forEach(([id, name]) => {
                $sel.append(`<option value="${id}">${name}</option>`);
            });
        }

        function renderReportList(reports) {
            const html = `
                <div class="container mt-5 pt-5">
                    <h2 class="text-center mb-4 mainh1">Список отчётов</h2>
                    <div id="reportMsg" class="text-center mb-3" style="display:none;"></div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Фильтр по дате</label>
                            <input type="date" class="form-control" id="dateFilter">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Фильтр по группе</label>
                            <select class="form-select" id="groupFilter"></select>
                        </div>
                    </div>
                    <div class="mb-4">
                        <button id="resetFilter" class="btn btn-secondary">Показать все</button>
                    </div>
                    <ul class="list-group" id="reportList"></ul>

                    <!-- Модалки -->
                    <div class="modal fade" id="editReportModal" tabindex="-1">
                        <div class="modal-dialog"><div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Редактировать отчёт</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editReportForm">
                                    <div class="mb-3">
                                        <label class="form-label">Описание</label>
                                        <textarea class="form-control" id="reportDescription" rows="4" required></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-coddy w-100">Сохранить изменения</button>
                                </form>
                            </div>
                        </div></div>
                    </div>

                    <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
                        <div class="modal-dialog"><div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Подтвердите удаление</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body"><p>Вы уверены, что хотите удалить этот отчёт?</p></div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Удалить</button>
                            </div>
                        </div></div>
                    </div>
                </div>`;
            $("#app").html(html);
            fillGroupFilter();
            renderReportItems(reports);
        }

        function renderReportItems(reports) {
            const today = new Date();
            const sorted = [...reports].sort((a, b) => {
                const da = new Date(schedulesMap[a.schedule_id]?.date || 0);
                const db = new Date(schedulesMap[b.schedule_id]?.date || 0);
                return db - da;
            });

            const items = sorted.map(rp => {
                const sched = schedulesMap[rp.schedule_id] || {};
                const group = sched.group || {};
                const diff = Math.floor((new Date() - new Date(sched.date)) / (1000 * 60 * 60 * 24));
                const ago = getDaysAgoString(diff);
                return `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <div><strong>Группа:</strong> ${group.group_name || '—'}</div>
                            <div><strong>Дата занятия:</strong> ${sched.date ? formatDate(sched.date) : '—'} (${ago})</div>
                            <div><strong>Отчёт:</strong> ${rp.description || 'Без описания'}</div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-coddy rounded-circle editReport" data-id="${rp.report_id}" data-description="${rp.description || ''}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-danger rounded-circle deleteReport" data-id="${rp.report_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </li>`;
            }).join('');
            $("#reportList").html(items);
        }

        function bindEvents() {
            const $doc = $(document);
            $doc
                .off('click', '.editReport')
                .off('click', '.deleteReport')
                .off('click', '#confirmDeleteBtn')
                .off('submit', '#editReportForm')
                .off('change', '#dateFilter, #groupFilter')
                .off('click', '#resetFilter')

                .on('click', '.editReport', function () {
                    editingReportId = $(this).data('id');
                    $('#reportDescription').val($(this).data('description'));
                    new bootstrap.Modal($('#editReportModal')).show();
                })

                .on('click', '.deleteReport', function () {
                    reportToDeleteId = $(this).data('id');
                    new bootstrap.Modal($('#deleteConfirmModal')).show();
                })

                .on('click', '#confirmDeleteBtn', function () {
                    if (!reportToDeleteId) return;
                    $.ajax({
                        url: `${API_BASE}/reports/${reportToDeleteId}`,
                        method: 'DELETE',
                        headers: { "Authorization": `Bearer ${token}` },
                        success: () => {
                            showMessage('Отчёт удалён', 'success');
                            loadReports();
                        },
                        error: () => showMessage('Ошибка при удалении', 'danger'),
                        complete: () => bootstrap.Modal.getInstance($('#deleteConfirmModal')).hide()
                    });
                })

                .on('submit', '#editReportForm', function (e) {
                    e.preventDefault();
                    const newDesc = $('#reportDescription').val();
                    if (!editingReportId) return;
                    $.ajax({
                        url: `${API_BASE}/reports/${editingReportId}`,
                        method: 'PUT',
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        data: JSON.stringify({ description: newDesc }),
                        success: () => {
                            showMessage('Отчёт обновлён', 'success');
                            bootstrap.Modal.getInstance($('#editReportModal')).hide();
                            loadReports();
                        },
                        error: () => showMessage('Ошибка при обновлении', 'danger')
                    });
                })

                .on('change', '#dateFilter, #groupFilter', function () {
                    const date = $('#dateFilter').val();
                    const groupId = $('#groupFilter').val();
                    const filtered = allReports.filter(rp => {
                        const sched = schedulesMap[rp.schedule_id];
                        if (!sched) return false;
                        const matchDate = date ? sched.date === date : true;
                        const matchGroup = groupId ? String(sched.group.group_id) === groupId : true;
                        return matchDate && matchGroup;
                    });
                    renderReportItems(filtered);
                })

                .on('click', '#resetFilter', function () {
                    $('#dateFilter').val('');
                    $('#groupFilter').val('');
                    renderReportItems(allReports);
                })

                .off('hidden.bs.modal')
                .on('hidden.bs.modal', '.modal', () => {
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                });
        }

        function showMessage(text, type) {
            const msg = $('#reportMsg');
            msg.removeClass('text-success text-danger')
               .addClass(type === 'success' ? 'text-success' : 'text-danger')
               .text(text)
               .show();
            setTimeout(() => msg.fadeOut(), 5000);
        }
    });
}
window['init_modules_report_edit-report_js'] = _init;
