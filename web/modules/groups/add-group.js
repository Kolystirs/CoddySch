function _init() {    
    $(document).ready(function() {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        let allGroups = [];

        const API = {
            groupsInfo: `${API_BASE}/groups/info`,
            teachers: `${API_BASE}/teachers`,
            students: `${API_BASE}/filtered-users?role=Ученик`,
            createGroup: `${API_BASE}/groups`,
            courses: `${API_BASE}/courses`,
            courseInfo: id => `${API_BASE}/courses/${id}`
        };

        function fetchData(url) {
            return $.ajax({ url: url, headers: { Authorization: `Bearer ${token}` } });
        }

        function renderUI() {
            $('#app').html(`
                <div class="container mt-5 pt-5">
                    <h2 class="text-center mb-4 mainh1">Управление группами</h2>
                    <div id="msg" class="text-center mb-3" style="display:none"></div>
                    <form id="groupForm" class="shadow p-4 rounded bg-light mb-5">
                        <div class="mb-3">
                            <label class="form-label">Курс</label>
                            <select id="courseSelect" class="form-control" required>
                                <option value="">-- Выберите курс --</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Название группы</label>
                            <input type="text" id="groupName" class="form-control" placeholder="Введите название группы" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Классный руководитель</label>
                            <select id="teacherSelect" class="form-control">
                                <option value="">-- Выберите классного руководителя --</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Ученики</label>
                            <input type="text" id="studentSearch" class="form-control mb-2" placeholder="Поиск учеников">
                            <div id="studentList" style="max-height:200px; overflow-y:auto"></div>
                        </div>
                        <button type="submit" class="btn btn-coddy btn-lg w-100">Создать группу</button>
                    </form>
                    <div class="mb-3">
                        <label class="form-label">Поиск по названию группы</label>
                        <input type="text" id="groupFilter" class="form-control" placeholder="Начните ввод...">
                    </div>
                    <div class="row" id="groupsContainer"></div>
                </div>
            `);
        }

        function bindEvents() {
            $('#app')
                .off('change', '#courseSelect')
                .off('keyup', '#studentSearch')
                .off('submit', '#groupForm')
                .off('keyup', '#groupFilter')
                .on('change', '#courseSelect', onCourseChange)
                .on('keyup', '#studentSearch', onStudentSearch)
                .on('submit', '#groupForm', onFormSubmit)
                .on('keyup', '#groupFilter', onGroupFilter);

            // FIX: глобально удаляем тёмный фон, если он завис
            $(document).off('hidden.bs.modal').on('hidden.bs.modal', '.modal', () => {
                $('.modal-backdrop').remove();
                $('body').removeClass('modal-open');
            });
        }

        function loadAll() {
            fetchData(API.courses).done(populateCourses);
            fetchData(API.teachers).done(populateTeachers);
            fetchData(API.students).done(populateStudents);
            fetchData(API.groupsInfo).done(groups => { allGroups = groups; renderGroups(groups); });
        }

        function populateCourses(courses) {
            const options = ['<option value="">-- Выберите курс --</option>']
                .concat(courses.map(c => `<option value="${c.course_id}">${c.course_name}</option>`));
            $('#courseSelect').html(options.join(''));
        }

        function populateTeachers(teachers) {
            const options = ['<option value="">-- Выберите классного руководителя --</option>']
                .concat(teachers.map(t => `<option value="${t.user_id}">${t.last_name} ${t.first_name}</option>`));
            $('#teacherSelect').html(options.join(''));
        }

        function populateStudents(students) {
            const html = students.map(s =>
                `<div class="form-check student-item">
                    <input class="form-check-input" type="checkbox" value="${s.user_id}" id="stu_${s.user_id}">
                    <label class="form-check-label" for="stu_${s.user_id}">${s.last_name} ${s.first_name}</label>
                </div>`
            ).join('');
            $('#studentList').html(html);
        }

        function onCourseChange() {
            const courseId = $('#courseSelect').val();
            const courseName = $('#courseSelect option:selected').text();
            $('#groupName').val(courseName);
            $('#teacherSelect').val('');
            if (!courseId) return;

            fetchData(API.courseInfo(courseId))
                .done(info => {
                    const arr = info.teachers || [];
                    if (!arr.length) return;
                    const first = arr[0];
                    const teacherId = first.user_id || first.teacher_id || first.id || first.User_ID;
                    if (teacherId && $(`#teacherSelect option[value="${teacherId}"]`).length) {
                        $('#teacherSelect').val(teacherId);
                    }
                });
        }

        function onStudentSearch() {
            const term = $(this).val().toLowerCase();
            $('#studentList .student-item').each(function() {
                $(this).toggle($(this).text().toLowerCase().includes(term));
            });
        }

        function onFormSubmit(e) {
            e.preventDefault();
            const payload = {
                course_id: +$('#courseSelect').val(),
                group_name: $('#groupName').val(),
                teacher_id: +$('#teacherSelect').val() || null,
                student_ids: $('#studentList input:checked').map((_, el) => +el.value).get()
            };
            $.ajax({
                url: API.createGroup,
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                contentType: 'application/json',
                data: JSON.stringify(payload)
            })
            .done(() => {
                showMessage('Группа успешно создана', 'success');
                fetchData(API.groupsInfo).done(groups => { allGroups = groups; renderGroups(groups); });
                resetForm();
            })
            .fail(xhr => showMessage(xhr.responseJSON?.detail || 'Ошибка', 'danger'));
        }

        function onGroupFilter() {
            const q = $(this).val().toLowerCase();
            renderGroups(allGroups.filter(g => g.group_name.toLowerCase().includes(q)));
        }

        function renderGroups(groups) {
            const $container = $('#groupsContainer').empty();
            if (!groups.length) {
                $container.append('<p class="text-center text-muted">Нет групп</p>');
                return;
            }
            groups.forEach(g => {
                const teacherName = g.teacher ? `${g.teacher.first_name} ${g.teacher.last_name}` : '-';
                const studentsText = g.students.map(s => `${s.first_name} ${s.last_name}`).join(', ') || '-';
                $container.append(
                    `<div class="col-md-4 mb-4">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${g.group_name}</h5>
                                <h6 class="card-subtitle mb-2 text-muted">${teacherName}</h6>
                                <p class="mt-auto"><strong>Ученики:</strong> ${studentsText}</p>
                            </div>
                        </div>
                    </div>`
                );
            });
        }

        function showMessage(text, type) {
            $('#msg').attr('class', `text-center mb-3 text-${type}`).text(text).show().delay(3000).fadeOut();
        }

        function resetForm() {
            $('#groupForm')[0].reset();
        }

        // Initialize
        renderUI();
        bindEvents();
        loadAll();
    });
}
window['init_modules_groups_add-group_js'] = _init;