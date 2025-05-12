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

  // Открытие модалки
  $(document).on("click", "#authorization-link", function (e) {
    e.preventDefault();
    $("#authModal").modal("show");
  });

  // Отправка формы
  $(document).on("click", "#authSubmit", function () {
    const username = $("#username").val();
    const password = $("#password").val();

    $.ajax({
      url: `${API_BASE}/token`,
      type: "POST",
      data: { username, password },
      success: function (response) {
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("role", response.role);
        localStorage.setItem("userId", response.userId);
        localStorage.setItem("lastname", response.lastname);
        localStorage.setItem("firstname", response.firstname);
        localStorage.setItem("middlename", response.middlename);
        $("#authModal").modal("hide");
        location.reload();
      },
      error: function () {
        $("#authError").text("Неверное имя пользователя или пароль").show();
      }
    });
  });
});
