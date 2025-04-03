document.addEventListener('DOMContentLoaded', function() {
    // Инициализация темы (проверяем куки -> localStorage -> по умолчанию light)
    initTheme();
    
    // Проверка аутентификации на странице профиля
    if (document.getElementById('username')) {
        checkAuth();
        loadData();
        
        // Навешиваем обработчики для профиля
        document.getElementById('logout').addEventListener('click', logout);
        document.getElementById('refresh-data').addEventListener('click', loadData);
    }
    
    // Логика для страницы входа/регистрации
    if (document.getElementById('login-form')) {
        document.getElementById('show-register').addEventListener('click', showRegisterForm);
        document.getElementById('show-login').addEventListener('click', showLoginForm);
        document.getElementById('login').addEventListener('submit', login);
        document.getElementById('register').addEventListener('submit', register);
    }
    
    // Обработчик переключения темы (есть на всех страницах)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

// ====================== ФУНКЦИИ ТЕМЫ ======================
function initTheme() {
    // Пытаемся получить тему из кук
    const themeCookie = document.cookie.split('; ').find(row => row.startsWith('theme='));
    const theme = themeCookie ? themeCookie.split('=')[1] : localStorage.getItem('theme') || 'light';
    
    // Применяем тему
    document.body.className = `${theme}-theme`;
    updateThemeButton();
}

async function toggleTheme() {
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    try {
        // Сохраняем тему на сервере (в куки)
        const response = await fetch('/set-theme', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ theme: newTheme })
        });
        
        if (response.ok) {
            // Применяем новую тему
            document.body.classList.replace(`${currentTheme}-theme`, `${newTheme}-theme`);
            
            // Сохраняем в localStorage для быстрого доступа
            localStorage.setItem('theme', newTheme);
            
            // Обновляем кнопку
            updateThemeButton();
        } else {
            console.error('Ошибка сохранения темы');
        }
    } catch (error) {
        console.error('Ошибка при изменении темы:', error);
    }
}

function updateThemeButton() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = document.body.classList.contains('light-theme') 
            ? 'Тёмная тема' 
            : 'Светлая тема';
    }
}

// ====================== АУТЕНТИФИКАЦИЯ ======================
async function checkAuth() {
    try {
        const response = await fetch('/profile');
        if (response.redirected) {
            window.location.href = '/';
        } else {
            // Если авторизованы, показываем имя пользователя
            const username = await getUsername();
            if (username) {
                document.getElementById('username').textContent = username;
            }
        }
    } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
    }
}

async function getUsername() {
    try {
        const response = await fetch('/profile');
        if (!response.redirected) {
            return document.cookie.split('; ').find(row => row.startsWith('username='))?.split('=')[1];
        }
    } catch (error) {
        console.error('Ошибка получения имени пользователя:', error);
    }
    return null;
}

async function login(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.querySelector('input[type="text"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/profile';
        } else {
            alert(data.error || 'Ошибка входа');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения');
    }
}

async function register(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.querySelector('input[type="text"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Регистрация успешна! Теперь войдите.');
            showLoginForm({ preventDefault: () => {} });
            form.reset();
        } else {
            alert(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения');
    }
}

async function logout() {
    try {
        await fetch('/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
}

// ====================== РАБОТА С ФОРМАМИ ======================
function showRegisterForm(e) {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLoginForm(e) {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// ====================== РАБОТА С ДАННЫМИ ======================
async function loadData() {
    try {
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) refreshBtn.disabled = true;
        
        const response = await fetch('/data');
        const data = await response.json();
        
        const container = document.getElementById('data-container');
        if (container) {
            container.innerHTML = `
                <div class="data-item"><strong>Время:</strong> ${new Date(data.timestamp).toLocaleString()}</div>
                <div class="data-item"><strong>Данные:</strong> ${data.data}</div>
                <div class="data-item"><strong>Числа:</strong> ${data.numbers.join(', ')}</div>
                ${data.cached ? '<div class="cached-indicator">(из кэша)</div>' : ''}
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        const container = document.getElementById('data-container');
        if (container) container.textContent = 'Ошибка загрузки данных';
    } finally {
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) refreshBtn.disabled = false;
    }
}