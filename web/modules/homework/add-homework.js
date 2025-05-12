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
        let existingHomeworks = [];

        function renderAddHomeworkForm() {
            $('#app').html(`
                <div class="container mt-5 pt-5">
                    <h2 class="text-center mb-4 mainh1">Добавить домашнее задание</h2>
                    <div id="homeworkMsg" class="text-center mb-3" style="display:none;"></div>
                    <form id="addHomeworkForm" class="shadow p-4 rounded bg-light">
                        <div class="mb-4">
                            <label class="form-label">Занятие</label>
                            <select class="form-select" id="scheduleSelect" required>
                                <option value="">Выберите занятие</option>
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="form-label">Описание ДЗ</label>
                            <textarea class="form-control" id="homeworkDescription" rows="5" placeholder="Введите описание домашнего задания."></textarea>
                        </div>
                        <button type="submit" class="btn btn-coddy btn-lg w-100">Добавить ДЗ</button>
                    </form>
                </div>
            `);

            bindHomeworkEvents();
        }

        function showHomeworkMessage(text, type) {
            const msg = $('#homeworkMsg');
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
                        url: `${API_BASE}/homeworks`,
                        method: "GET",
                        headers: { "Authorization": `Bearer ${token}` }
                    }).done(function (homeworksData) {
                        existingHomeworks = homeworksData.map(h => h.schedule_id);

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
                            const isHomeworkSet = existingHomeworks.includes(s.schedule_id);
                            const formattedDate = lessonDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

                            return `<option value="${s.schedule_id}" ${isHomeworkSet ? 'disabled' : ''} style="background-color: ${isHomeworkSet ? '#d4edda' : '#f8d7da'};">
                                ${formattedDate} (${ago}) / ${groupName}${isHomeworkSet ? ' - ДЗ добавлено' : ''}
                            </option>`;
                        }).join('');

                        $('#scheduleSelect').append(options);
                    });
                },
                error: function () {
                    showHomeworkMessage('Ошибка при загрузке расписаний', 'danger');
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

        function bindHomeworkEvents() {
            // Сначала снимаем старый обработчик, затем вешаем заново
            $('#app').off('submit', '#addHomeworkForm').on('submit', '#addHomeworkForm', function (e) {
                e.preventDefault();

                const scheduleId = parseInt($('#scheduleSelect').val(), 10);
                if (existingHomeworks.includes(scheduleId)) {
                    showHomeworkMessage('Домашнее задание на это занятие уже добавлено', 'danger');
                    return;
                }

                const payload = {
                    schedule_id: scheduleId,
                    description: $('#homeworkDescription').val()
                };

                $.ajax({
                    url: `${API_BASE}/homeworks`,
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(payload),
                    success: function () {
                        showHomeworkMessage('Домашнее задание успешно добавлено', 'success');
                        $('#addHomeworkForm')[0].reset();
                        $('#scheduleSelect').empty().append('<option value="">Выберите занятие</option>');
                        loadSchedules();
                    },
                    error: function (xhr) {
                        const txt = xhr.responseJSON?.detail || xhr.responseText || 'Ошибка при добавлении ДЗ';
                        showHomeworkMessage(txt, 'danger');
                    }
                });
            });
        }

        renderAddHomeworkForm();

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
window['init_modules_homework_add-homework_js'] = _init;
