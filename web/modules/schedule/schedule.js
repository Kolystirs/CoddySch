function _init() {    
    $(document).ready(function () {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
            window.location.href = '/login';
            return;
        }

        const daysOfWeek = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
        let allSchedules = [];
        let homeworks = [];
        let reports = [];
        let currentPage = 1;
        const itemsPerPage = 6;

        const htmlContent = `
            <div class="container mt-5 pt-5" id="schedule-container">
                <h2 class="text-center mb-4">📅 Расписание</h2>
                <div class="row g-2 mb-3 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label">Фильтр по группе</label>
                        <select id="filter-group" class="form-select">
                            <option value="">Все группы</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Фильтр по дате</label>
                        <input type="date" id="filter-date" class="form-control" />
                    </div>
                    <div class="col-md-4 d-grid">
                        <button id="clear-filters" class="btn btn-outline-secondary mt-2 mt-md-0">Очистить фильтры</button>
                    </div>
                </div>
                <div id="schedule-list" class="mt-4"></div>
                <div id="pagination" class="mt-4"></div>
            </div>
        `;
        $("#app").html(htmlContent);

        function getDaysDifference(date1, date2) {
            return Math.ceil((date2 - date1) / (1000 * 60 * 60 * 24));
        }

        function formatRussianDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        }


        function getScheduleDayInfo(scheduleDateStr) {
            const now = new Date();
            const scheduleDate = new Date(scheduleDateStr);
            now.setHours(0, 0, 0, 0);
            scheduleDate.setHours(0, 0, 0, 0);
            const diffDays = getDaysDifference(now, scheduleDate);
            const dayName = daysOfWeek[scheduleDate.getDay()];
            if (diffDays === 0) return `Сегодня, ${dayName}`;
            if (diffDays === 1) return `Завтра, ${dayName}`;
            if (diffDays > 1) return `Через ${diffDays} дней, ${dayName}`;
            return `Было ${Math.abs(diffDays)} дней назад, ${dayName}`;
        }

        async function fetchAllData() {
            try {
                const [scheduleRes, homeworkRes, reportRes] = await Promise.all([
                    fetch(`${API_BASE}/schedules`, { headers: { "Authorization": `Bearer ${token}` } }),
                    fetch(`${API_BASE}/homeworks`, { headers: { "Authorization": `Bearer ${token}` } }),
                    fetch(`${API_BASE}/reports`, { headers: { "Authorization": `Bearer ${token}` } })
                ]);
                allSchedules = await scheduleRes.json();
                homeworks = await homeworkRes.json();
                reports = await reportRes.json();
                populateGroupFilter(allSchedules);
                updateScheduleView();
            } catch (error) {
                console.error("Ошибка при загрузке данных", error);
            }
        }

        function populateGroupFilter(schedules) {
            const groups = new Set();
            schedules.forEach(s => groups.add(s.group.group_name));
            let options = `<option value="">Все группы</option>`;
            groups.forEach(group => options += `<option value="${group}">${group}</option>`);
            $("#filter-group").html(options);
        }

        function filterSchedules() {
            const selectedGroup = $("#filter-group").val();
            const selectedDate = $("#filter-date").val();
            return allSchedules.filter(s => {
                const matchGroup = !selectedGroup || s.group.group_name === selectedGroup;
                const matchDate = !selectedDate || s.date === selectedDate;
                return matchGroup && matchDate;
            });
        }

        function renderSchedulesGroupByDate(schedules) {
            const now = new Date();
            const upcoming = [];
            const past = [];
        
            schedules.forEach(s => {
                const endTime = new Date(`${s.date}T${s.end_time}`);
                (endTime >= now ? upcoming : past).push(s);
            });
        
            // Сортировка по дате
            upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
            past.sort((a, b) => new Date(b.date) - new Date(a.date));
        
            function renderGroup(title, list, isPast = false) {
                if (list.length === 0) return '';
        
                const blocks = list.map(schedule => {
                    const endTime = new Date(`${schedule.date}T${schedule.end_time}`);
                    const isPassed = endTime < now;
                    const dayInfo = getScheduleDayInfo(schedule.date);
                    const badge = isPassed
                        ? `<span class="badge bg-secondary">Занятие прошло</span>`
                        : `<span class="badge bg-success">Предстоящее занятие</span>`;
        
                    const scheduleId = schedule.schedule_id;
                    const homework = homeworks.find(hw => hw.schedule_id === scheduleId)?.description || "<em>ещё не добавлена</em>";
                    const report = reports.find(rp => rp.schedule_id === scheduleId)?.description || "<em>ещё не добавлен</em>";
        
                    const cardClass = isPassed ? "bg-light border" : "bg-white border-start border-success border-4 shadow-sm";
        
                    return `
                        <div class="col">
                            <div class="card ${cardClass} h-100">
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title text-primary">👥 ${schedule.group.group_name}</h5>
                                    <p class="mb-1"><strong>🗓 Дата:</strong> ${formatRussianDate(schedule.date)} (${dayInfo})</p>
                                    <p class="mb-1"><strong>⏰ Время:</strong> ${schedule.start_time} – ${schedule.end_time}</p>
                                    ${badge}
                                    <hr class="my-2" />
                                    <div><strong>📚 Домашнее задание:</strong><br>${homework}</div>
                                    <div class="mt-2"><strong>📝 Отчёт:</strong><br>${report}</div>
                                </div>
                            </div>
                        </div>
                    `;
                });
        
                return `
                    <div class="mb-5">
                        <h4 class="mb-3 border-bottom pb-2">${title}</h4>
                        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                            ${blocks.join("")}
                        </div>
                    </div>
                `;
            }
        
            return [
                renderGroup("Предстоящие занятия", upcoming, false),
                renderGroup("Прошедшие занятия", past, true)
            ];
        }

        function renderPagination(totalItems) {
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const pagination = $("#pagination");
            pagination.empty();
        
            if (totalPages <= 1) return;
        
            const container = $('<div class="custom-pagination"></div>');
        
            for (let i = 1; i <= totalPages; i++) {
                const btn = $(`<button class="page-btn">${i}</button>`);
                if (i === currentPage) btn.addClass("active");
                btn.on("click", () => {
                    currentPage = i;
                    updateScheduleView();
                });
                container.append(btn);
            }
        
            pagination.append(container);
        }
        

        function updateScheduleView() {
            const filtered = filterSchedules();
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
            const groupedHtml = renderSchedulesGroupByDate(paginated);
            $("#schedule-list").html(groupedHtml.join(""));
            renderPagination(filtered.length);
        }

        $("#filter-group, #filter-date").on("change", function () {
            currentPage = 1;
            updateScheduleView();
        });

        $("#clear-filters").on("click", function () {
            $("#filter-group").val("");
            $("#filter-date").val("");
            currentPage = 1;
            updateScheduleView();
        });

        fetchAllData();
    });
}
window['init_modules_schedule_schedule_js'] = _init;