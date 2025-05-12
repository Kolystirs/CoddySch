function _init() {
    $(document).ready(function () {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem("token");
        if (!token) return window.location.href = '/login';

        const userId = parseInt(localStorage.getItem("userId"));
        const role = localStorage.getItem("role");

        let allGroups = [];
        let allSchedules = [];

        function loadGroups() {
            return $.ajax({
                url: `${API_BASE}/groups/info`,
                headers: { "Authorization": `Bearer ${token}` }
            });
        }

        function loadSchedules() {
            return $.ajax({
                url: `${API_BASE}/schedules`,
                headers: { "Authorization": `Bearer ${token}` }
            });
        }

        function renderInterface(groups) {
            const filtered = role === "Преподаватель"
                ? groups.filter(g => g.teacher?.user_id === userId)
                : groups;

            allGroups = filtered;
            const options = filtered.map(g => `<option value="${g.group_id}">${g.group_name}</option>`).join('');

            $('#app').html(`
                <div class="container mt-5 pt-5">
                    <h2 class="text-center mb-4 mainh1">Управление расписанием</h2>
                    <div id="scheduleMsg" class="text-center mb-3" style="display:none;"></div>
                    <form id="addScheduleForm" class="shadow p-4 rounded bg-light">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <label class="form-label">Дата занятия</label>
                                <input type="date" class="form-control" id="scheduleDate" required>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label">Начало занятия</label>
                                <input type="time" class="form-control" id="startTime" required>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label">Окончание занятия</label>
                                <input type="time" class="form-control" id="endTime" required>
                            </div>
                            <div class="col-md-3 mb-3">
                                <label class="form-label">Группа</label>
                                <select class="form-select" id="groupSelect" required>
                                    <option value="">Выберите группу</option>
                                    ${options}
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-coddy btn-lg w-100">Создать расписание</button>
                    </form>

                    <div class="mt-5">
                        <div class="mb-3">
                            <label for="groupFilter" class="form-label">Фильтр по группе</label>
                            <select id="groupFilter" class="form-select">
                                <option value="">Все группы</option>
                                ${options}
                            </select>
                        </div>
                        <table class="table table-striped" id="schedulesTable">
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Начало</th>
                                    <th>Окончание</th>
                                    <th>Группа</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            `);

            bindEvents();
            refreshSchedules();
        }

        function bindEvents() {
            const $doc = $(document);

            $doc.off('input', '#startTime').on('input', '#startTime', function () {
                const start = $(this).val();
                if (!start) return;
                const [h, m] = start.split(':').map(Number);
                const hh = String((h + 2) % 24).padStart(2, '0');
                const mm = String(m).padStart(2, '0');
                $('#endTime').val(`${hh}:${mm}`);
            });

            $doc.off('submit', '#addScheduleForm').on('submit', '#addScheduleForm', function (e) {
                e.preventDefault();
                const payload = {
                    date: $('#scheduleDate').val(),
                    start_time: $('#startTime').val(),
                    end_time: $('#endTime').val(),
                    group_id: parseInt($('#groupSelect').val(), 10)
                };
                $.ajax({
                    url: `${API_BASE}/schedules`,
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    data: JSON.stringify(payload),
                    contentType: "application/json",
                    success: () => {
                        showMessage('Расписание успешно создано', 'success');
                        $('#addScheduleForm')[0].reset();
                        refreshSchedules();
                    },
                    error: (xhr) => {
                        const text = xhr.responseJSON?.detail || xhr.responseText || 'Ошибка при создании расписания';
                        showMessage(text, 'danger');
                    }
                });
            });

            $doc.off('change', '#groupFilter').on('change', '#groupFilter', function () {
                filterSchedules($(this).val());
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

        function refreshSchedules() {
            loadSchedules().done(data => {
                allSchedules = data;
                renderSchedules(data);
            });
        }

        function formatRussianDate(dateStr) {
            const months = [
                "января", "февраля", "марта", "апреля", "мая", "июня",
                "июля", "августа", "сентября", "октября", "ноября", "декабря"
            ];
            const [year, month, day] = dateStr.split("-");
            return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
        }

        function renderSchedules(list) {
            const tbody = $('#schedulesTable tbody').empty();
            const relevant = role === "Преподаватель"
                ? list.filter(item => allGroups.some(g => g.group_id === item.group.group_id))
                : list;

            if (!relevant.length) {
                tbody.append('<tr><td colspan="4" class="text-center">Нет расписаний</td></tr>');
                return;
            }

            relevant.forEach(item => {
                tbody.append(`
                    <tr>
                        <td>${formatRussianDate(item.date)}</td>
                        <td>${item.start_time}</td>
                        <td>${item.end_time}</td>
                        <td>${item.group.group_name}</td>
                    </tr>
                `);
            });
        }

        function filterSchedules(groupId) {
            if (!groupId) {
                renderSchedules(allSchedules);
            } else {
                const filtered = allSchedules.filter(s => String(s.group.group_id) === groupId);
                renderSchedules(filtered);
            }
        }

        $.when(loadGroups()).done(groups => {
            renderInterface(groups);
        }).fail(() => alert('Ошибка при загрузке групп'));
    });
}
window['init_modules_schedule_schedule-add_js'] = _init;
