function _init() {  
  $(document).ready(function() {
    const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const API = {
        groupsInfo:    `${API_BASE}/groups/info`,
        teachers:      `${API_BASE}/teachers`,
        students:      `${API_BASE}/filtered-users?role=Ученик`,
        createGroup:   `${API_BASE}/groups`,
        updateGroup:   id => `${API_BASE}/groups/${id}`,
        deleteGroup:   id => `${API_BASE}/groups/${id}`,
        courses:       `${API_BASE}/courses`,
        courseInfo:    id => `${API_BASE}/courses/${id}`
    };

    let allGroups = [];
    let deleteGroupId = null;

    // контейнер для сообщений и модалки
    $('body').append(`
      <div id="msgBox" style="
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2000;
          display: none;
          min-width: 200px;
      "></div>

      <!-- Delete Confirm Modal -->
      <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Подтвердите удаление</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body"><p>Вы уверены, что хотите удалить эту группу?</p></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Удалить</button>
            </div>
          </div>
        </div>
      </div>
    `);

    function loadGroupList() {
        $.ajax({
            url: API.groupsInfo,
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            success(groups) {
                allGroups = groups;
                renderGroupList(groups);
            },
            error() { showMessage('Не удалось загрузить группы', 'danger'); }
        });
    }

    function renderGroupList(groups) {
        const html = `
<div class="container mt-5 pt-5">
  <h2 class="text-center mb-5 mainh1">Выберите группу</h2>
  <div class="row mb-4">
    <div class="col-md-6">
      <input id="searchGroup" class="form-control" placeholder="Поиск группы">
    </div>
  </div>
  <div class="row" id="groupsContainer">
    ${groups.map(g => `
      <div class="col-md-4 mb-4 group-card" data-name="${g.group_name.toLowerCase()}">
        <div class="card shadow-sm h-100">
          <div class="card-body d-flex flex-column justify-content-between">
            <div>
              <h5 class="card-title">${g.group_name}</h5>
              <p class="card-text">Преп.: ${g.teacher ? g.teacher.last_name + ' ' + g.teacher.first_name : '—'}</p>
              <p class="card-text">Учеников: ${g.students.length}</p>
            </div>
            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-coddy rounded-circle editCourseButton" data-course-id="${g.group_id}" style="width:40px;height:40px;padding:0;">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-danger rounded-circle deleteCourseButton" data-course-id="${g.group_id}" style="width:40px;height:40px;">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`).join('')}
  </div>
</div>`;
        $('#app').html(html);

        $('#searchGroup').off('input').on('input', () => {
            const term = $('#searchGroup').val().toLowerCase();
            $('.group-card').each((_, el) => {
                $(el).toggle($(el).data('name').includes(term));
            });
        });

        // Удаляем старые и добавляем обработчики
        $(document)
          .off('click', '.editCourseButton')
          .off('click', '.deleteCourseButton')
          .on('click', '.editCourseButton', e => loadEditForm(+e.currentTarget.dataset.courseId))
          .on('click', '.deleteCourseButton', e => {
              deleteGroupId = +e.currentTarget.dataset.courseId;
              const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
              modal.show();
          });

        $('#confirmDeleteBtn')
          .off('click')
          .on('click', function() {
              if (!deleteGroupId) return;
              const modalEl = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
              modalEl.hide();
              deleteGroup(deleteGroupId);
          });

        // Очистка фона после закрытия любой модалки
        $(document)
          .off('hidden.bs.modal')
          .on('hidden.bs.modal', '.modal', () => {
              $('.modal-backdrop').remove();
              $('body').removeClass('modal-open');
              $('body').css('padding-right', '');
          });
    }

    function deleteGroup(id) {
        $.ajax({
            url: API.deleteGroup(id),
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            success() {
                showMessage('Группа успешно удалена', 'success');
                loadGroupList();
            },
            error(xhr) {
                showMessage('Ошибка удаления: ' + xhr.responseText, 'danger');
            }
        });
    }

    function loadEditForm(groupId) {
        const grp = allGroups.find(g => g.group_id === groupId);
        if (!grp) {
            showMessage('Группа не найдена', 'danger');
            return;
        }

        $.when(
            $.ajax({ url: API.teachers, headers: { Authorization: `Bearer ${token}` } }),
            $.ajax({ url: API.students, headers: { Authorization: `Bearer ${token}` } }),
            $.ajax({ url: API.courses,  headers: { Authorization: `Bearer ${token}` } })
        ).done((tch, std, crs) => {
            const teachers = tch[0].filter(u => u.role === 'Преподаватель');
            renderEditForm(grp, teachers, std[0], crs[0]);
        }).fail(() => showMessage('Не удалось загрузить данные', 'danger'));
    }

    function renderEditForm(group, teachers, students, courses) {
        const selTeacher = group.teacher?.user_id || '';
        const checkedIds = group.students.map(s => s.user_id);
        const html = `
<div class="container mt-5 pt-5">
  <button id="backBtn" class="btn btn-secondary mb-4">Назад</button>
  <h2 class="text-center mb-5 mainh1">Редактировать группу</h2>
  <form id="editForm" class="shadow p-4 rounded bg-light">
    <input type="hidden" id="grpId" value="${group.group_id}">
    <div class="mb-3">
      <label class="form-label">Курс</label>
      <select id="courseSelect" class="form-control" required>
        <option value="">-- выберите курс --</option>
        ${courses.map(c => `
          <option value="${c.course_id}" ${+c.course_id === +group.course_id ? 'selected' : ''}>
            ${c.course_name}
          </option>`).join('')}
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Название группы</label>
      <input id="groupName" class="form-control" value="${group.group_name}" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Классный руководитель</label>
      <select id="teacherSelect" class="form-control">
        <option value="">-- выберите преп. --</option>
        ${teachers.map(t => `
          <option value="${t.user_id}" ${String(t.user_id) === String(selTeacher) ? 'selected' : ''}>
            ${t.last_name} ${t.first_name}
          </option>`).join('')}
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Ученики</label>
      <input id="studentSearch" class="form-control mb-2" placeholder="Поиск учеников">
      <div id="studentList" style="max-height:200px;overflow:auto;">
        ${students.map(s => `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${s.user_id}" id="stu${s.user_id}"
              ${checkedIds.includes(s.user_id) ? 'checked' : ''}>
            <label class="form-check-label" for="stu${s.user_id}">
              ${s.last_name} ${s.first_name}
            </label>
          </div>`).join('')}
      </div>
    </div>
    <div class="d-flex justify-content-end gap-2">
      <button type="submit" class="btn btn-coddy">Сохранить</button>
    </div>
  </form>
</div>`;
        $('#app').html(html);

        $('#backBtn').click(loadGroupList);

        $('#courseSelect').change(function() {
            const cid  = $(this).val();
            const name = $(this).find('option:selected').text().trim();
            $('#groupName').val(name);
            $('#teacherSelect').val('');
            if (!cid) return;
            $.ajax({ url: API.courseInfo(cid), headers: { Authorization: `Bearer ${token}` } })
            .done(info => {
              const first = (info.teachers || [])[0];
              const tid   = first?.user_id || first?.teacher_id;
              if (tid && $(`#teacherSelect option[value="${tid}"]`).length) {
                  $('#teacherSelect').val(tid);
              }
            });
        });

        $('#studentSearch').on('input', function(){
            const q = $(this).val().toLowerCase();
            $('#studentList .form-check').each((_,el)=>{
                $(el).toggle($(el).text().toLowerCase().includes(q));
            });
        });

        $('#editForm').submit(function(e) {
            e.preventDefault();
            const id = $('#grpId').val();
            const payload = {
                course_id:  +$('#courseSelect').val(),
                group_name: $('#groupName').val(),
                teacher_id:+$('#teacherSelect').val()||null,
                student_ids:$('#studentList input:checked').map((_,el)=>+el.value).get()
            };
            $.ajax({
                url: API.updateGroup(id),
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                contentType: 'application/json',
                data: JSON.stringify(payload)
            })
            .done(() => {
                showMessage('Изменения успешно сохранены', 'success');
                loadGroupList();
            })
            .fail(xhr => {
                showMessage('Ошибка сохранения: ' + xhr.responseText, 'danger');
            });
        });
    }

    function showMessage(text, type) {
        const box = $('#msgBox');
        box
          .stop(true,true)
          .removeClass()
          .addClass(`alert alert-${type}`)
          .text(text)
          .fadeIn(200)
          .delay(2500)
          .fadeOut(400);
    }

    // старт
    loadGroupList();
  });
}
window['init_modules_groups_edit-group_js'] = _init;
