document.addEventListener('DOMContentLoaded', function() {
    // Общие элементы
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Применяем сохраненную тему
    document.body.className = `${currentTheme}-theme`;
    updateThemeButton();
    
    // Переключение темы
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Проверка аутентификации на странице профиля
    if (document.getElementById('username')) {
        checkAuth();
        loadData();
        
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
});

// Функции темы
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('light-theme')) {
        body.classList.replace('light-theme', 'dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        localStorage.setItem('theme', 'light');
    }
    updateThemeButton();
}

function updateThemeButton() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = document.body.classList.contains('light-theme') 
            ? 'Темная тема' 
            : 'Светлая тема';
    }
}

// Формы входа/регистрации
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
        } else {
            alert(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка соединения');
    }
}

// Функции профиля
async function checkAuth() {
    try {
        const response = await fetch('/profile');
        if (response.redirected) {
            window.location.href = '/';
        } else {
            document.getElementById('username').textContent = 'Пользователь';
        }
    } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
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

async function loadData() {
    try {
        const response = await fetch('/data');
        const data = await response.json();
        
        const container = document.getElementById('data-container');
        container.innerHTML = `
            <div class="data-item"><strong>Время:</strong> ${new Date(data.timestamp).toLocaleString()}</div>
            <div class="data-item"><strong>Данные:</strong> ${data.data}</div>
            <div class="data-item"><strong>Числа:</strong> ${data.numbers.join(', ')}</div>
            ${data.cached ? '<div class="cached-indicator">(из кэша)</div>' : ''}
        `;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        document.getElementById('data-container').textContent = 'Ошибка загрузки данных';
    }
}