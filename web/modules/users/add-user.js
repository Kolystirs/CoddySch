function _init() {
    $(document).ready(function () {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
            return;
        }

        $("#app").html(`
            <div class="container mt-5 pt-5">
                <h2 class="text-center mb-5 mainh1">Добавить нового пользователя</h2>
                <div id="addUserMsg" class="text-center mb-3" style="display:none;"></div>
                <form id="addUserForm">
                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <label for="firstName" class="form-label">Имя</label>
                            <input type="text" class="form-control" id="firstName" placeholder="Введите имя" required>
                        </div>
                        <div class="col-md-6 mb-4">
                            <label for="lastName" class="form-label">Фамилия</label>
                            <input type="text" class="form-control" id="lastName" placeholder="Введите фамилию" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <label for="middleName" class="form-label">Отчество</label>
                            <input type="text" class="form-control" id="middleName" placeholder="Введите отчество">
                        </div>
                        <div class="col-md-6 mb-4">
                            <label for="username" class="form-label">Имя пользователя</label>
                            <div class="position-relative">
                                <input type="text" class="form-control pe-5" id="username" placeholder="Введите имя пользователя" required>
                                <span class="position-absolute top-50 end-0 translate-middle-y pe-3" id="generateUsername" style="cursor:pointer;">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <label for="password" class="form-label">Пароль</label>
                            <div class="position-relative">
                                <input type="password" class="form-control pe-5" id="password" placeholder="Введите пароль" required>
                                <span class="position-absolute top-50 end-0 translate-middle-y pe-3" id="togglePassword" style="cursor:pointer;">
                                    <i class="bi bi-eye-slash" id="passwordIcon"></i>
                                </span>
                            </div>
                        </div>
                        <div class="col-md-6 mb-4">
                            <label for="role" class="form-label">Роль</label>
                            <select class="form-select" id="role" required>
                                <option value="Ученик">Ученик</option>
                                <option value="Родитель">Родитель</option>
                                <option value="Преподаватель">Преподаватель</option>
                                <option value="Админ">Админ</option>
                            </select>
                        </div>
                    </div>
                    <div class="text-center">
                        <button type="submit" class="btn btn-coddy btn-lg">Добавить пользователя</button>
                    </div>
                </form>

                <h3 class="text-center mt-5 mb-3 mainh1">Список пользователей</h3>
                <div class="mb-3">
                    <label for="roleFilter" class="form-label">Фильтр по роли</label>
                    <select id="roleFilter" class="form-select">
                        <option value="">Все роли</option>
                        <option value="Ученик">Ученик</option>
                        <option value="Родитель">Родитель</option>
                        <option value="Преподаватель">Преподаватель</option>
                        <option value="Админ">Админ</option>
                    </select>
                </div>
                <table class="table table-striped" id="usersTable">
                    <thead>
                        <tr><th>Имя</th><th>Фамилия</th><th>Роль</th></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        // === Утилиты ===
        const translitMap = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'i',
            'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
            'ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ы':'y','э':'e','ю':'yu','я':'ya'
        };
        function transliterate(str) {
            return str.toLowerCase().split('').map(ch => translitMap[ch] || '').join('');
        }

        function showMessage(text, type = 'success') {
            const box = $('#addUserMsg');
            box.removeClass('text-success text-danger')
               .addClass(`text-${type}`)
               .text(text)
               .show();
            setTimeout(() => box.fadeOut(), 4000);
        }

        // === Обработчики ===
        $(document).off('click', '#togglePassword').on('click', '#togglePassword', function () {
            const pwd = $('#password');
            const icon = $('#passwordIcon');
            const type = pwd.attr('type') === 'password' ? 'text' : 'password';
            pwd.attr('type', type);
            icon.toggleClass('bi-eye-slash bi-eye');
        });

        $(document).off('click', '#generateUsername').on('click', '#generateUsername', function () {
            const first = transliterate($('#firstName').val().trim());
            const last = transliterate($('#lastName').val().trim());
            if (!first || !last) return;
            const rand = Math.floor(Math.random() * 900) + 100;
            $('#username').val(`${first}.${last}${rand}`);
        });

        $(document).off('submit', '#addUserForm').on('submit', '#addUserForm', function (e) {
            e.preventDefault();
            $('#addUserMsg').hide();

            const payload = {
                first_name: $('#firstName').val(),
                last_name: $('#lastName').val(),
                middle_name: $('#middleName').val(),
                username: $('#username').val(),
                password: $('#password').val(),
                role: $('#role').val()
            };

            $.ajax({
                url: `${API_BASE}/create-user`,
                type: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function () {
                    $('#addUserForm')[0].reset();
                    getFilteredUsers();
                    showMessage('Пользователь успешно создан', 'success');
                },
                error: function (xhr) {
                    const msg = xhr.responseJSON?.detail || 'Ошибка при создании пользователя';
                    showMessage(msg, 'danger');
                }
            });
        });

        $(document).off('change', '#roleFilter').on('change', '#roleFilter', function () {
            getFilteredUsers($(this).val());
        });

        // === Загрузка пользователей ===
        function getFilteredUsers(role = "") {
            const params = role ? `role=${role}` : '';
            $.ajax({
                url: `${API_BASE}/filtered-users?${params}`,
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
                success: updateUsersTable
            });
        }

        function updateUsersTable(users) {
            const tbody = $("#usersTable tbody").empty();
            if (!users.length) {
                return tbody.append('<tr><td colspan="3" class="text-center">Нет пользователей</td></tr>');
            }
            users.forEach(u => {
                tbody.append(`<tr><td>${u.first_name}</td><td>${u.last_name}</td><td>${u.role}</td></tr>`);
            });
        }

        // Стартовая загрузка
        getFilteredUsers();
    });
}
window['init_modules_users_add-user_js'] = _init;
