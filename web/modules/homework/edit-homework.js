function _init() {
    $(document).ready(function () {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem("token");
        if (!token) return window.location.href = '/login';

        const userId = parseInt(localStorage.getItem("userId"));
        const role = localStorage.getItem("role");

        let schedulesMap = {};
        let editingHomeworkId = null;
        let allHomeworks = [];
        let groups = {};
        let homeworkToDeleteId = null;

        loadSchedules()
            .then(loadGroups)
            .then(loadHomeworks);

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
                            data = data.filter(g => g.teacher?.user_id === userId);
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

        function fillGroupFilter() {
            const $sel = $('#groupFilter');
            $sel.empty().append('<option value="">Все группы</option>');
            Object.entries(groups).forEach(([id, name]) => {
                $sel.append(`<option value="${id}">${name}</option>`);
            });
        }

        function loadHomeworks() {
            $.ajax({
                url: `${API_BASE}/homeworks`,
                headers: { "Authorization": `Bearer ${token}` },
                success(homeworks) {
                    if (role === "Преподаватель") {
                        const myGroupIds = Object.keys(groups).map(Number);
                        allHomeworks = homeworks.filter(hw => {
                            const sched = schedulesMap[hw.schedule_id];
                            return sched && myGroupIds.includes(sched.group.group_id);
                        });
                    } else {
                        allHomeworks = homeworks;
                    }
                    renderHomeworkList(allHomeworks);
                    bindEvents();
                },
                error: () => showMessage('Ошибка при загрузке домашних заданий', 'danger')
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

        function renderHomeworkList(homeworks) {
            const html = `
                <div class="container mt-5 pt-5">
                    <h2 class="text-center mb-4 mainh1">Список домашних заданий</h2>
                    <div id="homeworkMsg" class="text-center mb-3" style="display:none;"></div>
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
                    <ul class="list-group" id="homeworkList"></ul>

                    <!-- Модалки -->
                    <div class="modal fade" id="editHomeworkModal" tabindex="-1">
                        <div class="modal-dialog"><div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Редактировать домашнее задание</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editHomeworkForm">
                                    <div class="mb-3">
                                        <label class="form-label">Описание</label>
                                        <textarea class="form-control" id="homeworkDescription" rows="4" required></textarea>
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
                            <div class="modal-body"><p>Вы уверены, что хотите удалить это домашнее задание?</p></div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Удалить</button>
                            </div>
                        </div></div>
                    </div>
                </div>`;
            $("#app").html(html);
            fillGroupFilter();
            renderHomeworkItems(homeworks);
        }

        function renderHomeworkItems(homeworks) {
            const today = new Date();
            const sorted = [...homeworks].sort((a, b) => {
                const da = new Date(schedulesMap[a.schedule_id]?.date || 0);
                const db = new Date(schedulesMap[b.schedule_id]?.date || 0);
                return db - da;
            });

            const items = sorted.map(hw => {
                const sched = schedulesMap[hw.schedule_id] || {};
                const group = sched.group || {};
                const diff = Math.floor((new Date() - new Date(sched.date)) / (1000 * 60 * 60 * 24));
                const ago = getDaysAgoString(diff);
                return `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <div><strong>Группа:</strong> ${group.group_name || '—'}</div>
                            <div><strong>Дата занятия:</strong> ${sched.date ? formatDate(sched.date) : '—'} (${ago})</div>
                            <div><strong>ДЗ:</strong> ${hw.description || 'Без описания'}</div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-coddy rounded-circle editHomework" data-id="${hw.homework_id}" data-description="${hw.description || ''}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-danger rounded-circle deleteHomework" data-id="${hw.homework_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </li>`;
            }).join('');
            $("#homeworkList").html(items);
        }

        function bindEvents() {
            const $doc = $(document);
            $doc
                .off('click', '.deleteHomework')
                .off('click', '#confirmDeleteBtn')
                .off('click', '.editHomework')
                .off('submit', '#editHomeworkForm')
                .off('change', '#dateFilter, #groupFilter')
                .off('click', '#resetFilter')

                .on('click', '.deleteHomework', function () {
                    homeworkToDeleteId = $(this).data('id');
                    new bootstrap.Modal($('#deleteConfirmModal')).show();
                })

                .on('click', '#confirmDeleteBtn', function () {
                    if (!homeworkToDeleteId) return;
                    $.ajax({
                        url: `${API_BASE}/homeworks/${homeworkToDeleteId}`,
                        method: 'DELETE',
                        headers: { "Authorization": `Bearer ${token}` },
                        success: () => {
                            showMessage('Домашнее задание удалено', 'success');
                            loadHomeworks();
                        },
                        error: () => showMessage('Ошибка при удалении', 'danger'),
                        complete: () => bootstrap.Modal.getInstance($('#deleteConfirmModal')).hide()
                    });
                })

                .on('click', '.editHomework', function () {
                    editingHomeworkId = $(this).data('id');
                    $('#homeworkDescription').val($(this).data('description'));
                    new bootstrap.Modal($('#editHomeworkModal')).show();
                })

                .on('submit', '#editHomeworkForm', function (e) {
                    e.preventDefault();
                    const newDesc = $('#homeworkDescription').val();
                    if (!editingHomeworkId) return;
                    $.ajax({
                        url: `${API_BASE}/homeworks/${editingHomeworkId}`,
                        method: 'PUT',
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        data: JSON.stringify({ description: newDesc }),
                        success: () => {
                            showMessage('Домашнее задание обновлено', 'success');
                            bootstrap.Modal.getInstance($('#editHomeworkModal')).hide();
                            loadHomeworks();
                        },
                        error: () => showMessage('Ошибка при обновлении', 'danger')
                    });
                })

                .on('change', '#dateFilter, #groupFilter', function () {
                    const date = $('#dateFilter').val();
                    const groupId = $('#groupFilter').val();
                    const filtered = allHomeworks.filter(hw => {
                        const sched = schedulesMap[hw.schedule_id];
                        if (!sched) return false;
                        const matchDate = date ? sched.date === date : true;
                        const matchGroup = groupId ? String(sched.group.group_id) === groupId : true;
                        return matchDate && matchGroup;
                    });
                    renderHomeworkItems(filtered);
                })

                .on('click', '#resetFilter', function () {
                    $('#dateFilter').val('');
                    $('#groupFilter').val('');
                    renderHomeworkItems(allHomeworks);
                });

            // Очистка фона модалки (если вдруг остаётся)
            $doc
                .off('hidden.bs.modal')
                .on('hidden.bs.modal', '.modal', () => {
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');
                });
        }

        function showMessage(text, type) {
            const msg = $('#homeworkMsg');
            msg.removeClass('text-success text-danger')
               .addClass(type === 'success' ? 'text-success' : 'text-danger')
               .text(text)
               .show();
            setTimeout(() => msg.fadeOut(), 5000);
        }
    });
}
window['init_modules_homework_edit-homework_js'] = _init;
