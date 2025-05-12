function _init() {
    $(document).ready(function () {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem("token");
        if (!token) return window.location.href = '/login';

        const userId = parseInt(localStorage.getItem("userId"));
        const role = localStorage.getItem("role");

        let allGroups = [];
        let allSchedules = [];
        let editingSchedule = null;
        let scheduleToDelete = null;

        loadGroups().then(loadScheduleList).catch(() => showMessage('Ошибка при загрузке групп', 'danger'));

        function loadGroups() {
            return $.ajax({
                url: `${API_BASE}/groups/info`,
                headers: { "Authorization": `Bearer ${token}` }
            }).then(data => {
                allGroups = role === 'Преподаватель'
                    ? data.filter(g => g.teacher?.user_id === userId)
                    : data;
            });
        }

        function loadScheduleList() {
            $.ajax({
                url: `${API_BASE}/schedules`,
                headers: { "Authorization": `Bearer ${token}` }
            }).then(schedules => {
                allSchedules = role === 'Преподаватель'
                    ? schedules.filter(s => allGroups.some(g => g.group_id === s.group.group_id))
                    : schedules;
                renderScheduleList(allSchedules);
                bindEvents();
            }).catch(() => showMessage('Ошибка при загрузке расписаний', 'danger'));
        }

        function renderScheduleList(schedules) {
            const groupOptions = allGroups.map(g => `<option value="${g.group_id}">${g.group_name}</option>`).join('');
            const html = `
                <div class="container mt-5 pt-5">
                    <h2 class="text-center mb-4 mainh1">Управление расписанием</h2>
                    <div id="scheduleMsg" class="text-center mb-3" style="display:none;"></div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Фильтр по дате</label>
                            <input type="date" id="dateFilter" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Фильтр по группе</label>
                            <select id="groupFilter" class="form-select">
                                <option value="">Все группы</option>
                                ${groupOptions}
                            </select>
                        </div>
                    </div>
                    <div class="mb-4">
                        <button id="resetFilter" class="btn btn-secondary">Показать все</button>
                    </div>
                    <div id="scheduleContainer" class="row">
                        ${generateScheduleCards(schedules)}
                    </div>
                </div>

                <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Подтвердите удаление</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body"><p>Вы уверены, что хотите удалить это расписание?</p></div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Удалить</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            $("#app").html(html);
        }

        function generateScheduleCards(schedules) {
            if (!schedules.length) return `<div class="col-12 text-center">Расписание не найдено.</div>`;
            return schedules.map(s => `
                <div class="col-md-4 mb-4">
                    <div class="card shadow-sm h-100">
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <h5 class="card-title">${s.group.group_name}</h5>
                                <p class="card-text">Дата: ${formatDate(s.date)}<br>Время: ${s.start_time} - ${s.end_time}</p>
                            </div>
                            <div class="d-flex gap-2 justify-content-end">
                                <button class="btn btn-coddy rounded-circle p-2 editScheduleButton" data-schedule-id="${s.schedule_id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-danger rounded-circle p-2 deleteScheduleButton" data-schedule-id="${s.schedule_id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'long'
            });
        }

        function applyFilters() {
            const date = $('#dateFilter').val();
            const group = $('#groupFilter').val();
            const filtered = allSchedules.filter(s => {
                const matchDate = date ? s.date === date : true;
                const matchGroup = group ? String(s.group.group_id) === group : true;
                return matchDate && matchGroup;
            });
            $('#scheduleContainer').html(generateScheduleCards(filtered));
        }

        function renderEditForm(schedule) {
            const groupOptions = allGroups.map(g => `<option value="${g.group_id}"${g.group_id === schedule.group.group_id ? ' selected' : ''}>${g.group_name}</option>`).join('');
            $("#app").html(`
                <div class="container mt-5 pt-5">
                    <button id="backToList" class="btn btn-secondary mb-4">Назад к расписанию</button>
                    <h2 class="text-center mb-5 mainh1">Редактировать расписание</h2>
                    <div id="scheduleMsg" class="text-center mb-3" style="display:none;"></div>
                    <form id="editScheduleForm" class="shadow p-4 rounded bg-light">
                        <div class="mb-3">
                            <label class="form-label">Дата</label>
                            <input type="date" class="form-control" id="date" value="${schedule.date}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Время начала</label>
                            <input type="time" class="form-control" id="startTime" value="${schedule.start_time}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Время окончания</label>
                            <input type="time" class="form-control" id="endTime" value="${schedule.end_time}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Группа</label>
                            <select class="form-select" id="groupId">${groupOptions}</select>
                        </div>
                        <button type="submit" class="btn btn-coddy btn-lg w-100">Сохранить</button>
                    </form>
                </div>
            `);

            $('#startTime').off('input').on('input', function () {
                const val = $(this).val();
                if (!val) return;
                const [h, m] = val.split(':').map(Number);
                const endH = (h + 2) % 24;
                $('#endTime').val(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            });

            $('#backToList').off('click').on('click', loadScheduleList);

            $('#editScheduleForm').off('submit').on('submit', function (e) {
                e.preventDefault();
                const payload = {
                    date: $('#date').val(),
                    start_time: $('#startTime').val(),
                    end_time: $('#endTime').val(),
                    group_id: parseInt($('#groupId').val(), 10)
                };
                $.ajax({
                    url: `${API_BASE}/schedules/${schedule.schedule_id}`,
                    method: 'PUT',
                    headers: { "Authorization": `Bearer ${token}` },
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: () => {
                        showMessage('Расписание успешно обновлено', 'success');
                        setTimeout(loadScheduleList, 500);
                    },
                    error: xhr => {
                        showMessage('Ошибка при обновлении: ' + (xhr.responseJSON?.detail || xhr.responseText), 'danger');
                    }
                });
            });
        }

        function bindEvents() {
            const $doc = $(document);

            $doc.off('change', '#dateFilter, #groupFilter')
                .on('change', '#dateFilter, #groupFilter', applyFilters);

            $doc.off('click', '#resetFilter')
                .on('click', '#resetFilter', function () {
                    $('#dateFilter').val('');
                    $('#groupFilter').val('');
                    applyFilters();
                });

            $doc.off('click', '.editScheduleButton')
                .on('click', '.editScheduleButton', function () {
                    const id = $(this).data('schedule-id');
                    editingSchedule = allSchedules.find(s => s.schedule_id === id);
                    if (!editingSchedule) return showMessage('Расписание не найдено', 'danger');
                    renderEditForm(editingSchedule);
                });

            $doc.off('click', '.deleteScheduleButton')
                .on('click', '.deleteScheduleButton', function () {
                    scheduleToDelete = $(this).data('schedule-id');
                    new bootstrap.Modal($('#deleteConfirmModal')).show();
                });

            $doc.off('click', '#confirmDeleteBtn')
                .on('click', '#confirmDeleteBtn', function () {
                    if (!scheduleToDelete) return;
                    $.ajax({
                        url: `${API_BASE}/schedules/${scheduleToDelete}`,
                        method: 'DELETE',
                        headers: { "Authorization": `Bearer ${token}` },
                        success: () => {
                            showMessage('Расписание удалено', 'success');
                            loadScheduleList();
                        },
                        error: xhr => {
                            showMessage('Ошибка при удалении: ' + (xhr.responseJSON?.detail || xhr.responseText), 'danger');
                        },
                        complete: () => bootstrap.Modal.getInstance($('#deleteConfirmModal')).hide()
                    });
                });

            $doc.off('hidden.bs.modal')
                .on('hidden.bs.modal', '.modal', () => {
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                });
        }

        function showMessage(text, type) {
            const msg = $('#scheduleMsg');
            msg.removeClass('text-success text-danger')
               .addClass(type === 'success' ? 'text-success' : 'text-danger')
               .text(text)
               .show();
            setTimeout(() => msg.fadeOut(), 5000);
        }
    });
}
window['init_modules_schedule_schedule-edit_js'] = _init;
