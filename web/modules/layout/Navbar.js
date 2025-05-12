$(document).ready(function () {
  const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
  const authModalHtml = `
    <div class="modal fade" id="authModal" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content p-4 rounded-lg shadow-lg">
          <div class="modal-header border-0 pb-0 justify-content-center position-relative">
            <button type="button" class="btn-close position-absolute end-0 top-0 m-3" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>
          <div class="modal-body pt-2">
            <form id="authForm">
              <div class="mb-3">
                <label for="username" class="form-label">Имя пользователя</label>
                <input type="text" class="form-control" id="username" placeholder="Введите логин" required>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Пароль</label>
                <input type="password" class="form-control" id="password" placeholder="Введите пароль" required>
              </div>
              <div id="authError" class="text-danger text-center mb-3" style="display:none;"></div>
            </form>
          </div>
          <div class="modal-footer border-0 pt-0 justify-content-center">
            <button type="button" class="btn btn-coddy px-5" id="authSubmit">Войти</button>
          </div>
        </div>
      </div>
    </div>
  `;
  $("body").append(authModalHtml);

  // Show login modal
  $(document).on("click", "#authorization-link", function (e) {
    e.preventDefault();
    $("#authModal").modal("show");
  });

  // Handle login form submission
  $(document).on("click", "#authSubmit", function () {
    const username = $("#username").val();
    const password = $("#password").val();

    $.ajax({
      url: `${API_BASE}/token`,
      type: "POST",
      data: { username, password },
      success: function (response) {
        // Store token & user info
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("role", response.role);
        localStorage.setItem("userId", response.userId);
        localStorage.setItem("lastname", response.Last_Name || response.lastname);
        localStorage.setItem("firstname", response.First_Name || response.firstname);
        localStorage.setItem("middlename", response.Middle_Name || response.middlename);

        $("#authModal").modal("hide");
        location.reload();
      },
      error: function () {
        $("#authError").text("Неверное имя пользователя или пароль").show();
      }
    });
  });


  // --- NAVBAR RENDERING ---
  function updateNavbar() {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    const lastname = localStorage.getItem("lastname") || "";
    const firstname = localStorage.getItem("firstname") || "";
    const middlename = localStorage.getItem("middlename") || "";
    const initials = `${lastname} ${firstname.charAt(0)}.${middlename.charAt(0)}.`;

    const navStart = `
      <nav class="py-3 navbar navbar-expand-lg fixed-top auto-hiding-navbar navbar-light">
        <div class="container">
          <a class="navbar-brand" href="">Coddy - Кострома</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                  data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                  aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav ms-auto align-items-center">
    `;
    const navEnd = `
            </ul>
          </div>
        </div>
      </nav>
    `;

    let itemsHtml = "";

    if (!token) {
      // Guest menu
      itemsHtml += `
        <li class="nav-item"><a class="nav-link" href="">Преподаватели</a></li>
        <li class="nav-item"><a class="nav-link" href="">Курсы</a></li>
        <li class="nav-item"><a class="nav-link" href="">Обратная связь</a></li>
        <li class="nav-item"><a class="nav-link" href="" id="authorization-link">Войти</a></li>
      `;
    } else {
      // Common for all authenticated
      if (role === "Родитель" || role === "Ученик") {
        itemsHtml += `
          <li class="nav-item"><a class="nav-link" href="">Преподаватели</a></li>
          <li class="nav-item"><a class="nav-link" href="">Курсы</a></li>
          <li class="nav-item"><a class="nav-link" href="">Обратная связь</a></li>
          <li class="nav-item"><a class="nav-link" href="" id="schedule">Расписание</a></li>
        `;
      } else if (role === "Преподаватель") {
        itemsHtml += `
          <li class="nav-item"><a class="nav-link" href="" id="schedule">Расписание</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="addDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Добавить
            </a>
            <ul class="dropdown-menu" aria-labelledby="addDropdown">
              <li><a class="dropdown-item" href="" id="add-schedule">Расписание</a></li>
              <li><a class="dropdown-item" href="" id="add-report">Отчёта</a></li>
              <li><a class="dropdown-item" href="" id="add-homework">Домашнего задания</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="editDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Редактировать
            </a>
            <ul class="dropdown-menu" aria-labelledby="editDropdown">
              <li><a class="dropdown-item" href="" id="edit-schedule">Расписание</a></li>
              <li><a class="dropdown-item" href="" id="edit-report">Отчёта</a></li>
              <li><a class="dropdown-item" href="" id="edit-homework">Домашнего задания</a></li>
            </ul>
          </li>
        `;
      } else if (role === "Админ") {
        itemsHtml += `
          <li class="nav-item"><a class="nav-link" href="" id="schedule">Расписание</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="addDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Добавить
            </a>
            <ul class="dropdown-menu" aria-labelledby="addDropdown">
              <li><a class="dropdown-item" href="" id="add-user">Пользователя</a></li>
              <li><a class="dropdown-item" href="" id="add-course">Курс</a></li>
              <li><a class="dropdown-item" href="" id="add-schedule">Расписание</a></li>
              <li><a class="dropdown-item" href="" id="group-add">Группу</a></li>
              <li><a class="dropdown-item" href="" id="add-report">Отчёта</a></li>
              <li><a class="dropdown-item" href="" id="add-homework">Домашнего задания</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="editDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Редактировать
            </a>
            <ul class="dropdown-menu" aria-labelledby="editDropdown">
              <li><a class="dropdown-item" href="" id="edit-user">Пользователя</a></li>
              <li><a class="dropdown-item" href="" id="edit-course">Курс</a></li>
              <li><a class="dropdown-item" href="" id="edit-schedule">Расписание</a></li>
              <li><a class="dropdown-item" href="" id="edit-group">Группу</a></li>
              <li><a class="dropdown-item" href="" id="edit-report">Отчёта</a></li>
              <li><a class="dropdown-item" href="" id="edit-homework">Домашнего задания</a></li>
            </ul>
          </li>
        `;
      }

      // User dropdown with initials and role
      itemsHtml += `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" id="userDropdown" role="button"
             data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-user-circle fa-lg"></i>
            <div class="d-none d-lg-block text-start">
              <div class="fw-semibold">${initials}</div>
              <div class="roledrow">${role}</div>
            </div>
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="#" id="user-settings">Настройки</a></li>
            <li><a class="dropdown-item" href="#" id="logoutButton">Выйти</a></li>
          </ul>
        </li>
      `;
    }

    // Render navbar and bind logout
    $("body").prepend(navStart + itemsHtml + navEnd);

    $("#logoutButton").on("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("role");
      localStorage.removeItem("lastname");
      localStorage.removeItem("firstname");
      localStorage.removeItem("middlename");
      location.reload();
    });
  }

  updateNavbar();
});
