function _init() {
  $(document).ready(function () {
    const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
      window.location.href = '/login';
      return;
    }

    loadUserList();

    function loadUserList() {
      $.ajax({
        url: `${API_BASE}/users`,
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (users) {
          window.allUsers = users;
          renderUserList(users);
        },
        error: function () {
          showModal("Ошибка при загрузке пользователей");
        }
      });
    }

    function renderUserList(users) {
      const html = `
        <div class="container mt-5 pt-5">
          <h2 class="text-center mb-5 mainh1">Выберите пользователя для редактирования</h2>
          <div class="row mb-4">
            <div class="col-md-4">
              <input type="text" id="searchName" class="form-control" placeholder="Поиск по имени или логину">
            </div>
            <div class="col-md-4">
              <select id="filterRole" class="form-select">
                <option value="">Все роли</option>
                <option value="Ученик">Ученик</option>
                <option value="Родитель">Родитель</option>
                <option value="Преподаватель">Преподаватель</option>
                <option value="Админ">Админ</option>
              </select>
            </div>
            <div class="col-md-4">
              <button id="clearFilters" class="btn btn-secondary">Сбросить фильтры</button>
            </div>
          </div>
          <div id="usersContainer" class="row">
            ${generateUserCards(users)}
          </div>
        </div>
        ${modalTemplate()}
      `;
      $("#app").html(html);

      $(document).off('input', '#searchName').on('input', '#searchName', filterUsers);
      $(document).off('change', '#filterRole').on('change', filterUsers);
      $(document).off('click', '#clearFilters').on('click', () => {
        $("#searchName").val("");
        $("#filterRole").val("");
        filterUsers();
      });
    }

    function generateUserCards(users) {
      if (!users.length) {
        return `<div class="col-12 text-center"><p>Пользователи не найдены.</p></div>`;
      }
      return users.map(user => `
        <div class="col-md-4 mb-4">
          <div class="card shadow-sm h-100">
            <div class="card-body">
              <h5 class="card-title">${user.first_name} ${user.last_name}</h5>
              <p class="card-text">
                Роль: ${user.role}<br>
                Логин: ${user.username}<br>
                Email: ${user.email || 'Нет'}
              </p>
              <div class="d-flex gap-2 justify-content-end">
                <button class="btn btn-coddy rounded-circle editUserButton" data-user-id="${user.user_id}" style="width:40px;height:40px;">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger rounded-circle deleteUserButton" data-user-id="${user.user_id}" style="width:40px;height:40px;">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }

    function filterUsers() {
      const term = $("#searchName").val().toLowerCase();
      const role = $("#filterRole").val();
      const filtered = window.allUsers.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const username = (user.username || "").toLowerCase();
        return (fullName.includes(term) || username.includes(term)) && (!role || user.role === role);
      });
      $("#usersContainer").html(generateUserCards(filtered));
    }

    $(document).off('click', '.editUserButton').on('click', '.editUserButton', function () {
      const userId = $(this).data("user-id");
      loadEditForm(userId);
    });

    $(document).off('click', '.deleteUserButton').on('click', '.deleteUserButton', function () {
      const userId = $(this).data("user-id");
      showConfirmModal("Вы действительно хотите удалить пользователя?", function () {
        $.ajax({
          url: `${API_BASE}/delete-user/${userId}`,
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
          success: function () {
            loadUserList();
            showModal("Пользователь успешно удалён");
          },
          error: function (xhr) {
            showModal("Ошибка при удалении пользователя: " + (xhr.responseJSON?.detail || "Неизвестная ошибка"));
          }
        });
      });
    });

    function loadEditForm(userId) {
      $.ajax({
        url: `${API_BASE}/users-edit/${userId}`,
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (user) {
          renderEditForm(user);
        },
        error: function () {
          showModal("Ошибка при загрузке данных пользователя");
        }
      });
    }

    function renderEditForm(user) {
      $("#app").html(`
        <div class="container mt-5 pt-5">
          <button id="backToList" class="btn btn-secondary mb-4">Назад к выбору пользователя</button>
          <h2 class="text-center mb-5 mainh1">Редактировать пользователя</h2>
          <form id="editUserForm">
            <div class="mb-4">
              <label class="form-label">Имя</label>
              <input type="text" class="form-control" id="firstName" required value="${user.first_name}">
            </div>
            <div class="mb-4">
              <label class="form-label">Фамилия</label>
              <input type="text" class="form-control" id="lastName" required value="${user.last_name}">
            </div>
            <div class="mb-4">
              <label class="form-label">Логин</label>
              <input type="text" class="form-control" id="username" required value="${user.username}">
            </div>
            <div class="mb-4">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" id="email" value="${user.email || ''}">
            </div>
            <div class="mb-4">
              <label class="form-label">Пароль (оставьте пустым, если не меняете)</label>
              <input type="password" class="form-control" id="password">
            </div>
            <div class="mb-4">
              <label class="form-label">Роль</label>
              <select class="form-select" id="role" required>
                <option value="Ученик" ${user.role === "Ученик" ? "selected" : ""}>Ученик</option>
                <option value="Родитель" ${user.role === "Родитель" ? "selected" : ""}>Родитель</option>
                <option value="Преподаватель" ${user.role === "Преподаватель" ? "selected" : ""}>Преподаватель</option>
                <option value="Админ" ${user.role === "Админ" ? "selected" : ""}>Админ</option>
              </select>
            </div>
            <button type="submit" class="btn btn-coddy btn-lg">Сохранить</button>
          </form>
          ${modalTemplate()}
        </div>
      `);

      $(document).off('click', '#backToList').on('click', '#backToList', loadUserList);
      $(document).off('submit', '#editUserForm').on('submit', '#editUserForm', function (e) {
        e.preventDefault();
        const formData = {
          first_name: $("#firstName").val(),
          last_name: $("#lastName").val(),
          username: $("#username").val(),
          role: $("#role").val(),
          email: $("#email").val().trim() || undefined,
          password: $("#password").val().trim() || undefined
        };

        $.ajax({
          url: `${API_BASE}/users-edit/${user.user_id}`,
          type: "PUT",
          headers: { "Authorization": `Bearer ${token}` },
          contentType: "application/json",
          data: JSON.stringify(formData),
          success: function () {
            showModal("Пользователь успешно обновлён");
            setTimeout(loadUserList, 1500);
          },
          error: function (xhr) {
            showModal("Ошибка при обновлении: " + (xhr.responseJSON?.detail || xhr.responseText));
          }
        });
      });
    }

    function modalTemplate() {
      return `
        <div class="modal fade" id="infoModal" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered" style="margin-top: -100px;">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Уведомление</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body"></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">ОК</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function showModal(message) {
      const modalEl = $('#infoModal');
      if (!modalEl.length) $('body').append(modalTemplate());
      $('#infoModal .modal-body').text(message);
      new bootstrap.Modal(document.getElementById('infoModal')).show();
    }

    function showConfirmModal(message, onConfirm) {
      $('#confirmModal').remove(); // Удалить, если уже есть
      const confirmHtml = `
        <div class="modal fade" id="confirmModal" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered" style="margin-top: -100px;">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Подтверждение</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">${message}</div>
              <div class="modal-footer">
                <button id="confirmYes" type="button" class="btn btn-danger">Да</button>
              </div>
            </div>
          </div>
        </div>`;
      $('body').append(confirmHtml);
      const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
      modal.show();

      $(document).off('click', '#confirmYes').on('click', '#confirmYes', function () {
        modal.hide();
        onConfirm();
      });

      $('#confirmModal').on('hidden.bs.modal', function () {
        $('#confirmModal').remove();
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open').css('overflow', '');
      });
    }
  });
}
window['init_modules_users_edit-user_js'] = _init;
