function _init() {    
    $(document).ready(function () {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        const userId = parseInt(localStorage.getItem("userId"), 10);

        if (!token) {
            window.location.href = '/login';
            return;
        }

        let teacherGroupIds = [];
        let existingReports = [];

        function renderAddReportForm() {
            $('#app').html(`
                <div class="container mt-5 pt-5">
                    <h2 class="text-center mb-4 mainh1">Добавить отчёт о занятии</h2>
                    <div id="reportMsg" class="text-center mb-3" style="display:none;"></div>
                    <form id="addReportForm" class="shadow p-4 rounded bg-light">
                        <div class="mb-4">
                            <label class="form-label">Занятие</label>
                            <select class="form-select" id="scheduleSelect" required>
                                <option value="">Выберите занятие</option>
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="form-label">Описание отчёта</label>
                            <textarea class="form-control" id="reportDescription" rows="5" placeholder="Введите описание отчёта."></textarea>
                        </div>
                        <button type="submit" class="btn btn-coddy btn-lg w-100">Добавить отчёт</button>
                    </form>
                </div>
            `);

            bindReportEvents();
        }

        function showReportMessage(text, type) {
            const msg = $('#reportMsg');
            msg.removeClass('text-success text-danger')
               .addClass(type === 'success' ? 'text-success' : 'text-danger')
               .text(text)
               .show();
            setTimeout(() => msg.fadeOut(), 5000);
        }

        function loadSchedules() {
            $.ajax({
                url: `${API_BASE}/schedules`,
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
                success: function (schedulesData) {
                    $.ajax({
                        url: `${API_BASE}/reports`,
                        method: "GET",
                        headers: { "Authorization": `Bearer ${token}` }
                    }).done(function (reportsData) {
                        existingReports = reportsData.map(r => r.schedule_id);

                        let schedules = schedulesData;
                        if (role === 'Преподаватель') {
                            schedules = schedules.filter(s => teacherGroupIds.includes(s.group.group_id));
                        }

                        const today = new Date();
                        const options = schedules.map(s => {
                            const lessonDate = new Date(s.date);
                            const diffDays = Math.floor((today - lessonDate) / (1000 * 60 * 60 * 24));
                            const ago = getDaysAgoString(diffDays);
                            const groupName = s.group?.group_name || '-';
                            const isReported = existingReports.includes(s.schedule_id);
                            const formattedDate = lessonDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

                            return `<option value="${s.schedule_id}" ${isReported ? 'disabled' : ''} 
                                style="background-color: ${isReported ? '#d4edda' : '#f8d7da'};">
                                ${formattedDate} (${ago}) / ${groupName}${isReported ? ' - Отчёт добавлен' : ''}
                            </option>`;
                        }).join('');

                        $('#scheduleSelect').append(options);
                    });
                },
                error: function () {
                    showReportMessage('Ошибка при загрузке расписаний', 'danger');
                }
            });
        }

        function getDaysAgoString(diff) {
            if (diff === 0) return 'сегодня';
            const absDiff = Math.abs(diff);
            const rem10 = absDiff % 10;
            const rem100 = absDiff % 100;
            let suffix = 'дней';

            if (rem10 === 1 && rem100 !== 11) {
                suffix = 'день';
            } else if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) {
                suffix = 'дня';
            }

            return diff > 0 ? `через ${absDiff} ${suffix}` : `${absDiff} ${suffix} назад`;
        }

        function bindReportEvents() {
            $('#app').off('submit', '#addReportForm').on('submit', '#addReportForm', function (e) {
                e.preventDefault();

                const scheduleId = parseInt($('#scheduleSelect').val(), 10);
                if (existingReports.includes(scheduleId)) {
                    showReportMessage('Отчёт по этому занятию уже добавлен', 'danger');
                    return;
                }

                const payload = {
                    schedule_id: scheduleId,
                    description: $('#reportDescription').val()
                };

                $.ajax({
                    url: `${API_BASE}/reports`,
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(payload),
                    success: function () {
                        showReportMessage('Отчёт успешно добавлен', 'success');
                        $('#addReportForm')[0].reset();
                        $('#scheduleSelect').empty().append('<option value="">Выберите занятие</option>');
                        loadSchedules();
                    },
                    error: function (xhr) {
                        const txt = xhr.responseJSON?.detail || xhr.responseText || 'Ошибка при добавлении отчёта';
                        showReportMessage(txt, 'danger');
                    }
                });
            });
        }

        // Основной запуск
        renderAddReportForm();

        if (role === 'Преподаватель') {
            $.ajax({
                url: `${API_BASE}/groups/info`,
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            }).done(function (groups) {
                teacherGroupIds = groups
                    .filter(g => g.teacher && g.teacher.user_id === userId)
                    .map(g => g.group_id);
            }).always(function () {
                loadSchedules();
            });
        } else {
            loadSchedules();
        }
    });
}
window['init_modules_report_add-report_js'] = _init;
