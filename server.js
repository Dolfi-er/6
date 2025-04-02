const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Настройка сессий
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // true если HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 1 день
    }
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Хранение пользователей (в реальном приложении используйте БД)
const users = [];

// Хэширование пароля
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Проверка аутентификации
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/');
    }
    next();
}

// Роуты
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (users.some(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    
    users.push({
        username,
        password: hashPassword(password)
    });
    
    res.json({ success: true });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.user = username;
    res.json({ success: true });
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/profile', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/data', requireAuth, (req, res) => {
    const cacheFile = path.join(__dirname, 'cache', 'data.json');
    
    // Проверяем кэш
    if (fs.existsSync(cacheFile)) {
        const cacheTime = fs.statSync(cacheFile).mtimeMs;
        const currentTime = Date.now();
        
        // Если кэш актуален (менее 1 минуты)
        if (currentTime - cacheTime < 60 * 1000) {
            const cachedData = JSON.parse(fs.readFileSync(cacheFile));
            return res.json({ ...cachedData, cached: true });
        }
    }
    
    // Генерируем новые данные
    const newData = {
        timestamp: new Date().toISOString(),
        data: `Server data for ${req.session.user}`,
        numbers: Array.from({ length: 5 }, () => Math.floor(Math.random() * 100))
    };
    
    // Сохраняем в кэш
    if (!fs.existsSync(path.join(__dirname, 'cache'))) {
        fs.mkdirSync(path.join(__dirname, 'cache'));
    }
    fs.writeFileSync(cacheFile, JSON.stringify(newData));
    
    res.json(newData);
});

// Защита от основных уязвимостей
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});