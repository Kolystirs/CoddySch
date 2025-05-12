function _init() {
    $(document).ready(function () {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
            window.location.href = '/login';
            return;
        }

        function loadTeachers() {
            $.ajax({
                url: `${API_BASE}/teachers`,
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
                success: function (response) {
                    const teacherSelect = $("#teacherSelect");
                    response.forEach(teacher => {
                        const teacherName = `${teacher.last_name} ${teacher.first_name}`;
                        teacherSelect.append(`<option value="${teacher.user_id}">${teacherName}</option>`);
                    });
                    teacherSelect.select2({ placeholder: "Выберите преподавателей", allowClear: true });
                },
                error: function () {
                    alert("Ошибка при загрузке списка преподавателей");
                }
            });
        }

        $("#app").html(`
            <div class="container mt-5 pt-5">
                <h2 class="text-center mb-5 mainh1">Добавить новый курс</h2>
                <form id="addCourseForm" class="shadow p-4 rounded bg-light mb-5">
                    <div id="addCourseMsg" class="text-center text-success mb-3" style="display:none;"></div>
                    <div class="mb-3">
                        <label for="courseName" class="form-label">Название курса</label>
                        <input type="text" class="form-control" id="courseName" placeholder="Введите название курса" required>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">Описание</label>
                        <textarea class="form-control" id="description" rows="3" placeholder="Введите описание курса"></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="photo" class="form-label">Фото курса (URL)</label>
                        <input type="url" class="form-control" id="photo" placeholder="https://example.com/your-photo.jpg">
                    </div>
                    <div class="mb-3">
                        <label for="timeLearn" class="form-label">Длительность</label>
                        <input type="text" class="form-control" id="timeLearn" placeholder="Например: 40 часов">
                    </div>
                    <div class="mb-4">
                        <label for="teacherSelect" class="form-label">Выберите преподавателей</label>
                        <select multiple id="teacherSelect" style="width: 100%;"></select>
                    </div>
                    <button type="submit" class="btn btn-coddy btn-lg w-100">Добавить курс</button>
                </form>

                <div id="coursesList">
                    <h3 class="text-center mb-4 mainh1">Список курсов</h3>
                    <div id="coursesContainer" class="row row-cols-1 row-cols-md-3 g-4"></div>
                </div>
            </div>
        `);

        loadTeachers();

        $("#addCourseForm").submit(function (e) {
            e.preventDefault();
            const form = $(this);
            const selectedTeachers = $("#teacherSelect").val();
            const formData = {
                course_name: $("#courseName").val(),
                description: $("#description").val(),
                photo_course: $("#photo").val(),
                time_learn: $("#timeLearn").val(),
                teacher_ids: selectedTeachers
            };

            $.ajax({
                url: `${API_BASE}/create-course`,
                type: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                data: JSON.stringify(formData),
                contentType: "application/json",
                success: function () {
                    $("#addCourseMsg").text('Курс успешно добавлен').show();
                    setTimeout(() => { $("#addCourseMsg").fadeOut(); }, 5000);
                    loadCourses();
                    form[0].reset();
                    $("#teacherSelect").val(null).trigger('change');
                    $("#addCourseError").remove();
                },
                error: function (xhr) {
                    const detail = xhr.responseJSON?.detail || 'Ошибка при добавлении курса';
                    if (!$('#addCourseError').length) {
                        form.prepend(`<div id="addCourseError" class="text-center text-danger mb-3">${detail}</div>`);
                    } else {
                        $('#addCourseError').text(detail).show();
                    }
                    setTimeout(() => { $('#addCourseError').fadeOut(); }, 5000);
                }
            });
        });

        function loadCourses() {
            $.ajax({
                url: `${API_BASE}/courses-page`,
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
                success: function (response) {
                    const container = $("#coursesContainer").empty();
                    if (!response.length) {
                        return container.append("<p class='text-muted text-center'>Курсы не найдены</p>");
                    }
                    response.forEach(course => {
                        const card = `
                            <div class="col">
                                <div class="card h-100 shadow-sm border-0">
                                    ${course.photo_course ?
                                    `<img src="${course.photo_course}" class="card-img-top" style="height:180px;object-fit:cover;">` :
                                    `<div class="bg-secondary text-white d-flex align-items-center justify-content-center" style="height:180px;">Нет фото</div>`
                                    }
                                    <div class="card-body d-flex flex-column">
                                        <h5 class="card-title">${course.course_name}</h5>
                                        <p class="card-text mt-auto"><strong>Преподаватели:</strong> ${course.teachers.join(", ")}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                        container.append(card);
                    });
                },
                error: function () {
                    if(!$('#loadCoursesError').length) $("#coursesList").prepend("<div id='loadCoursesError' class='text-center text-danger mb-3'>Ошибка при загрузке курсов</div>");
                }
            });
        }

        loadCourses();
    });
}

window['init_modules_courses_add-course_js'] = _init;
