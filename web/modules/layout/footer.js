$(document).ready(function () {
    const footerContent = `
      <footer id="dynamic-footer" class="footer bg-colr py-5">
        <div class="container">
          <div class="row gy-4">
            <!-- О компании -->
            <div class="col-lg-4 col-md-6">
              <h5 class="text-uppercase navbar-brand">О компании</h5>
              <ul class="list-unstyled">
                <li><a href="#teachers" class="custom-text">Преподаватели</a></li>
                <li><a href="#courses" class="custom-text">Курсы</a></li>
                <li><a href="#about-us" class="custom-text">О нас</a></li>
              </ul>
            </div>
  
            <!-- Наше видение вместо поддержки -->
            <div class="col-lg-4 col-md-6">
              <h5 class="text-uppercase navbar-brand">Наше видение</h5>
              <p class="custom-text">
                Coddy — это образовательная экосистема, где каждый ребёнок  
                сразу погружается в практику IT-проектов и игр.  
                Мы делаем обучение живым и увлекательным.
              </p>
            </div>
  
            <!-- Соцсети -->
            <div class="col-lg-4 col-md-12">
              <h5 class="text-uppercase navbar-brand">Соцсети</h5>
              <div class="d-flex">
                <a href="https://vk.com/kolyst1r" class="me-3"><i class="fab fa-vk custom-icon"></i></a>
                <a href="https://www.instagram.com/kolystir/" class="me-3"><i class="fab fa-instagram custom-icon"></i></a>
                <a href="https://web.whatsapp.com" class="me-3"><i class="fab fa-whatsapp custom-icon"></i></a>
              </div>
            </div>
          </div>
  
          <div class="text-center mt-4">
            <p class="custom-text mb-0">&copy; 2024 Coddy Kostroma. Все права защищены.</p>
          </div>
        </div>
      </footer>
    `;
  
    $("body").append(footerContent);
  });
  