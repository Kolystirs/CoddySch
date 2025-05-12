$(document).ready(function () {
    const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
  function loadWelcomeSection() {
    const welcomeHTML = `
              <section id="hero">
              <section id="hero">
    <div class="container">
        <div class="row">
            <div class="col">
                <h1>Добро пожаловать в Coddy</h1>
                <p>Coddy — это образовательная платформа для детей и подростков, где они могут изучать программирование, создание игр и другие цифровые навыки, которые помогут им подготовиться к будущим вызовам в мире IT. На нашем сайте вы можете узнать о курсах, познакомиться с преподавателями и, самое главное, посмотреть актуальное расписание занятий.</p>
                <button type="button" class="btn-coddy">Посмотреть курсы</button>
            </div>
            <div class="col">
                <img src="https://kolystir.github.io/Coddy-School/web/img/hero.png" class="CoddyHero">
            </div>
        </div>
    </div>
</section>  
          `;
    $("#app").append(welcomeHTML);
    $(".btn-coddy").on("click", function () {
        const coursesSection = $("#courses");
        if (coursesSection.length) {
          $("html, body").animate(
            { scrollTop: coursesSection.offset().top },
            500
          );
        }
      });
  }

  function loadAboutUs() {
    const AboutUsHTML = `
              <section id="about-us" class="about-us-section">
    <div class="container">
        <div class="row align-items-center">
            <!-- Левый блок с изображением -->
            <div class="col-md-6">
                <img src="https://avatars.mds.yandex.net/get-altay/1678797/2a00000168c7f9dcade8ee48a91788c7d840/XXXL" alt="Coddy Team" class="img-fluid img-coddy"/>
            </div>
            <!-- Правый блок с текстом -->
            <div class="col-md-6">
                <h1>О нас</h1>
                <p>Coddy — команда профессионалов, предлагающая детям и подросткам уникальные курсы по программированию, созданию игр, веб-дизайну и другим цифровым навыкам. Мы стремимся помочь молодому поколению развиваться в мире технологий и готовиться к вызовам IT-сферы. Наши курсы ориентированы на практическое обучение через реальные проекты, чтобы дети могли сразу применить свои знания.</p>
                
            </div>
        </div>
    </div>
</section>
          `;
    $("#app").append(AboutUsHTML);
  }

  function loadTeachers() {
    return $.ajax({
      url: `${API_BASE}/courses/teacher_info/all`,
      method: "GET",
      dataType: "json",
      success: function (data) {
        let teachersHTML = `
                  <section id="teachers" class="my-5 container">
                      <h1 class="text-center mb-4">Наши преподаватели</h1>
                      <div class="row row-cols-1 row-cols-md-3 g-4" id="teachersList">
              `;

        const teacherMap = {};
        data.forEach((course) => {
          course.teachers.forEach((teacher) => {
            if (!teacherMap[teacher.teacher_id]) {
              teacherMap[teacher.teacher_id] = {
                ...teacher,
                courses: [],
              };
            }
            teacherMap[teacher.teacher_id].courses.push(course.course_name);
          });
        });

        Object.values(teacherMap).forEach((teacher) => {
          teachersHTML += `
                      <div class="col">
                          <div class="card shadow-sm h-100 text-center p-4">
                              <img src="${
                                teacher.photo || "default_photo.jpg"
                              }" alt="${teacher.first_name} ${
            teacher.last_name
          }" class="card-img-top mx-auto mb-3" style="width: 100%; height: 250px; object-fit: cover;">
                              <div class="card-body">
                                  <h5 class="card-title mb-2">${
                                    teacher.last_name } 
                                    ${teacher.first_name
                                  } ${teacher.middle_name || ""} 
          </h5>
                                  <p class="card-text text-start">
                                      <strong>Курсы:</strong> ${
                                        teacher.courses.length > 0
                                          ? teacher.courses.join(", ")
                                          : "Преподаватель"
                                      }
                                  </p>
                              </div>
                          </div>
                      </div>
                  `;
        });

        teachersHTML += "</div></section>";
        $("#app").append(teachersHTML);
      },
      error: function (xhr, status, error) {
        console.error("Ошибка при загрузке преподавателей:", status, error);
        $("#app").append("<p>Не удалось загрузить преподавателей.</p>");
      },
    });
  }

  function loadCourses() {
    return $.ajax({
      url: `${API_BASE}/courses/teacher_info/all`,
      method: "GET",
      dataType: "json",
      success: function (data) {
        let coursesHTML = `
                  <section id="courses" class="my-5 container">
                      <h1 class="text-center mb-4">Наши курсы</h1>
                      <div class="row row-cols-1 row-cols-md-3 g-4" id="coursesList">
              `;
        data.forEach((course) => {
          coursesHTML += `
                      <div class="col mb-4">
                          <div class="card shadow-sm">
                              <img src="${course.photo_course}" class="card-img-top" alt="Фото курса" style="height: 200px; object-fit: cover;">
                              <div class="card-body">
                                  <h4 class="card-title">${course.course_name}</h4>
                                  <p class="card-text">${course.description}</p>
                                  <p class="card-text"><strong>Часы:</strong> ${course.hours}</p>
                                  <h6 class="fw-bold mt-3">Преподаватели:</h6>
                                  <div class="list-unstyled">
                  `;
          course.teachers.forEach((teacher) => {
            coursesHTML += `<li>${teacher.first_name} ${teacher.last_name}</li>`;
          });
          coursesHTML += `
                                  </div>
                              </div>
                          </div>
                      </div>
                  `;
        });
        coursesHTML += "</div></section>";
        $("#app").append(coursesHTML);
      },
      error: function (xhr, status, error) {
        console.error("Ошибка при загрузке курсов:", status, error);
        $("#app").append("<p>Не удалось загрузить курсы.</p>");
      },
    });
  }

  function loadLocationSection() {
    const locationHTML = `
          <section class="text-center container my-5" id="feedback">
            <h3 class="mb-5 mainh1">Свяжитесь с нами</h3>
            <div class="row">
                <div class="col-lg-5 mb-4 mb-lg-0">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2128.4433161532525!2d40.934219999999996!3d57.759876!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46ad501f7a78296f%3A0xf1bcb40c05a913df!2z0JvQtdGB0L3QsNGPINGD0LsuLCAxMSwg0JrQvtGB0YLRgNC-0LzQsCwg0JrQvtGB0YLRgNC-0LzRgdC60LDRjyDQvtCx0LsuLCAxNTYwMDA!5e0!3m2!1sru!2sru!4v1731096345711!5m2!1sru!2sru"
                        width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                </div>
                <div class="col-lg-7">
                    <form>
                        <div class="row">
                            <div class="col-md-6 mb-4">
                                <div class="form-outline">
                                    <input type="text" id="form3Example1" class="form-control" />
                                    <label class="form-label" for="form3Example1">Имя</label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <div class="form-outline">
                                    <input type="email" id="form3Example2" class="form-control" />
                                    <label class="form-label" for="form3Example2">Электронная почта</label>
                                </div>
                            </div>
                            <div class="col-md-12 mb-4">
                                <div class="form-outline">
                                    <input type="text" id="form3Example3" class="form-control" />
                                    <label class="form-label" for="form3Example3">Тема</label>
                                </div>
                            </div>
                            <div class="col-md-12 mb-4">
                                <div class="form-outline">
                                    <textarea class="form-control" id="form4Example3" rows="4"></textarea>
                                    <label class="form-label" for="form4Example3">Сообщение</label>
                                </div>
                            </div>
                            <div class="col-md-12 text-center">
                                <button type="submit" class="btn-coddy">
                                    Отправить сообщение
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </section>
      `;
    $("#app").append(locationHTML);
  }


function loadPreview() {
    const locationHTML = `

<section id="courses-technologies" class="py-5">
    <div class="container text-center">
        <h2 class="mb-4 mainh1 text-center">На наших курсах вы можете узнать:</h2>
        <div id="technologiesCarousel" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
                <!-- Первый слайд: языки программирования -->
                <div class="carousel-item active">
                    <div class="row justify-content-center align-items-center mx-auto tech-icons-container">
                        <div class="col-3 col-sm-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/HTML5_logo_black.svg/2048px-HTML5_logo_black.svg.png" alt="HTML" class="tech-logo">
                        </div>
                        <div class="col-3 col-sm-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/CSS3_logo_and_wordmark.svg" alt="CSS" class="tech-logo">
                        </div>
                        <div class="col-3 col-sm-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png" alt="JavaScript" class="tech-logo">
                        </div>
                        <div class="col-3 col-sm-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/0/0d/C_Sharp_wordmark.svg" alt="C#" class="tech-logo">
                        </div>
                        <div class="col-3 col-sm-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/27/PHP-logo.svg" alt="PHP" class="tech-logo">
                        </div>
                        <div class="col-3 col-sm-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg" alt="Python" class="tech-logo">
                        </div>
                    </div>
                </div>
                <!-- Второй слайд: приложения и платформы -->
<div class="carousel-item">
    <div class="d-flex justify-content-between align-items-center mx-auto tech-icons-container">
        <div class="tech-logo-container">
            <img src="https://delftswa.gitbooks.io/desosa2016/content/codecombat/images-team-codecombat/CodecombatLogo.png" alt="CodeCombat" class="tech-logo">
        </div>
        <div class="tech-logo-container">
            <img src="https://www.pngmart.com/files/22/Minecraft-Logo-PNG-Isolated-HD.png" alt="Minecraft" class="tech-logo">
        </div>
        <div class="tech-logo-container">
            <img src="https://edu-tritec.ru/wp-content/uploads/2024/04/scratch_logo.png" alt="Scratch" class="tech-logo">
        </div>
    </div>
</div>

            <!-- Навигация по карусели -->
            <button class="carousel-control-prev" type="button" data-bs-target="#technologiesCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Предыдущий</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#technologiesCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Следующий</span>
            </button>
        </div>
    </div>
</section>



    `;
    $("#app").append(locationHTML);
  }

  // Загружаем секции в нужном порядке, ожидая завершения AJAX-запросов
  loadWelcomeSection();
  loadAboutUs();
  $.when(loadTeachers(), loadCourses()).done(function () {
    loadPreview();
    loadLocationSection();
  });
});