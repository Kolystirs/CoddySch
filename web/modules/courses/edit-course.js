function _init() {   
  $(document).ready(function () {
    const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
    const token = localStorage.getItem("token");
    if (!token) {
      showNotification("Вы не авторизованы. Пожалуйста, войдите в систему.", "error");
      window.location.href = "/login";
      return;
    }

    let deleteModal;

    loadCourseList();

    function loadCourseList() {
      $.ajax({
        url: `${API_BASE}/courses-page`,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        success(courses) {
          window.allCourses = courses;
          renderCourseList(courses);
        },
        error() {
          showNotification("Ошибка при загрузке курсов", "error");
        }
      });
    }

    function renderCourseList(courses) {
      const html = `
        <div class="container mt-5 pt-5">
          <h2 class="text-center mb-5 mainh1">Выберите курс для редактирования</h2>
          <div class="row mb-4">
            <div class="col-md-6">
              <input type="text" id="searchCourse" class="form-control" placeholder="Поиск по названию курса">
            </div>
            <div class="col-md-6">
              <select id="filterTeacher" class="form-select">
                <option value="">Все преподаватели</option>
              </select>
            </div>
          </div>
          <div class="mb-4">
            <button id="resetFilters" class="btn btn-secondary">Показать все</button>
          </div>
          <div id="coursesContainer" class="row">
            ${courses.map(course => {
              const teachers = course.teachers.join(", ");
              return `
                <div class="col-md-4 mb-4 course-card"
                    data-course-name="${course.course_name.toLowerCase()}"
                    data-teachers="${teachers.toLowerCase()}">
                  <div class="card shadow-sm h-100">
                    ${course.photo_course
                      ? `<img src="${course.photo_course}" class="card-img-top" style="height:200px;object-fit:cover;">`
                      : ""}
                    <div class="card-body d-flex flex-column justify-content-between">
                      <div>
                        <h5 class="card-title">${course.course_name}</h5>
                        <p class="card-text">Преподаватели: ${teachers}</p>
                      </div>
                      <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-coddy rounded-circle editCourseButton" data-course-id="${course.course_id}" style="width:40px;height:40px;padding: 0px 0px;">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger rounded-circle deleteCourseButton" data-course-id="${course.course_id}" style="width:40px;height:40px;">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>`;
            }).join("")}
          </div>
        </div>

        <!-- Notification Modal -->
        <div class="modal fade" id="notificationModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header" id="modalHeader">
                <h5 class="modal-title" id="modalTitle"></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body"><p id="modalMessage"></p></div>
            </div>
          </div>
        </div>

        <!-- Delete Confirm Modal -->
        <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Подтвердите удаление</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body"><p>Вы уверены, что хотите удалить этот курс?</p></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Удалить</button>
              </div>
            </div>
          </div>
        </div>
      `;

      $("#app").html(html);
      loadTeacherOptions();

      deleteModal = new bootstrap.Modal($("#deleteConfirmModal")[0]);
    }


    function loadTeacherOptions() {
      $.ajax({
        url: `${API_BASE}/teachers`,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        success(teachers) {
          const opts = teachers.map(t =>
            `<option value="${(t.last_name + ' ' + t.first_name).toLowerCase()}">${t.last_name} ${t.first_name}</option>`
          ).join("");
          $("#filterTeacher").append(opts);
        },
        error() {
          showNotification("Не удалось загрузить преподавателей", "error");
        }
      });
    }

    $(document).on("input change", "#searchCourse, #filterTeacher", () => {
      const term = $("#searchCourse").val().toLowerCase();
      const teacher = $("#filterTeacher").val().toLowerCase();
      $(".course-card").each(function () {
        const name = $(this).data("course-name");
        const teachers = $(this).data("teachers");
        $(this).toggle(name.includes(term) && (teacher === "" || teachers.includes(teacher)));
      });
    });

    $(document).on("click", "#resetFilters", () => {
      $("#searchCourse, #filterTeacher").val("");
      $("#searchCourse, #filterTeacher").trigger("change");
    });

    $(document).on("click", ".deleteCourseButton", function () {
      window.courseToDelete = $(this).data("course-id");
      deleteModal.show();
    });

  $(document).on("click", "#confirmDeleteBtn", function () {
      const id = window.courseToDelete;
      $.ajax({
        url: `${API_BASE}/courses/${id}`,
        type: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        success(res) {
          showNotification(res.message, "success");
          deleteModal.hide();
          // Перезагрузка списка произойдёт при скрытии модалки
        },
        error(xhr) {
          showNotification("Ошибка при удалении: " + xhr.responseText, "error");
          deleteModal.hide();
        }
      });
    });


    $(document).on("click", ".editCourseButton", function () {
      loadEditForm($(this).data("course-id"));
    });

    function loadEditForm(id) {
      $.ajax({
        url: `${API_BASE}/courses/${id}`,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        success(course) {
          $.ajax({
            url: `${API_BASE}/teachers`,
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            success(teachers) {
              renderEditForm(course, teachers);
            },
            error() {
              showNotification("Ошибка при загрузке преподавателей", "error");
            }
          });
        },
        error() {
          showNotification("Ошибка при загрузке курса", "error");
        }
      });
    }


    

    function renderEditForm(course, teachers) {
      const selectedIds = (course.teachers || []).map(t => t.teacher_id);



      const teacherOptions = teachers.map(t => {
        const selected = selectedIds.includes(t.user_id) ? "selected" : "";
        return `<option value="${t.user_id}" ${selected}>${t.last_name} ${t.first_name}</option>`;
      }).join("");

      const html = `
        <div class="container mt-5 pt-5">
          <button id="backToList" class="btn btn-secondary mb-4">Назад</button>
          <h2 class="text-center mb-5 mainh1">Редактировать курс</h2>
          <form id="editCourseForm" class="shadow p-4 rounded bg-light">
            <div class="mb-3">
              <label class="form-label">Название</label>
              <input type="text" id="courseName" class="form-control" required value="${course.course_name}">
            </div>
            <div class="mb-3">
              <label class="form-label">Описание</label>
              <textarea id="description" class="form-control">${course.description || ""}</textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Фото (URL)</label>
              <input type="text" id="photoCourse" class="form-control" value="${course.photo_course || ""}">
            </div>
            <div class="mb-3">
              <label class="form-label">Время обучения</label>
              <input type="text" id="timeLearn" class="form-control" value="${course.time_learn || ""}">
            </div>
            <div class="mb-3">
              <label class="form-label">Преподаватели</label>
              <select id="teacherSelect" class="form-select" multiple>${teacherOptions}</select>
            </div>
            <div class="d-flex gap-2 justify-content-end">
              <button type="submit" class="btn btn-coddy btn-lg w-100">Сохранить</button>
            </div>
          </form>
        </div>
      `;
      $("#app").html(html);

      $("#teacherSelect").select2({ placeholder: "Выберите преподавателей", allowClear: true });
      $("#backToList").on("click", loadCourseList);
      $("#deleteConfirmModal").on("hidden.bs.modal", function () {
        loadCourseList();
      });


      $("#editCourseForm").off("submit").on("submit", function (e) {
        e.preventDefault();

        const data = {
          course_name: $("#courseName").val(),
          description: $("#description").val(),
          photo_course: $("#photoCourse").val(),
          time_learn: $("#timeLearn").val(),
          teacher_ids: ($("#teacherSelect").val() || []).map(Number)
        };

        $.ajax({
          url: `${API_BASE}/courses/${course.course_id}`,
          type: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          contentType: "application/json",
          data: JSON.stringify(data),
          success(res) {
            showNotification(res.message, "success");
            loadCourseList(); // ← Переход на список сразу
          },
          error(xhr) {
            showNotification("Ошибка: " + xhr.responseText, "error");
          }
        });
      });

      $("#deleteCourseFormButton").on("click", function () {
        window.courseToDelete = course.course_id;
        deleteModal.show();
      });
    }

    function showNotification(message, type = 'success') {
      const modalEl = document.getElementById('notificationModal');
      if (!modalEl) return;

      const modal = new bootstrap.Modal(modalEl);
      modalEl.querySelector('.modal-body').textContent = message;
      modal.show();
    }
  });
}
window['init_modules_courses_edit-course_js'] = _init;







