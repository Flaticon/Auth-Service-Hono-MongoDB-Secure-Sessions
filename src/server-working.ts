import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = new Hono();

// Configuración
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auth_service';
const JWT_SECRET = process.env.JWT_SECRET || 'tu_jwt_secret_aqui';
const PORT = parseInt(process.env.PORT || '3000');

// Cliente MongoDB
const client = new MongoClient(MONGO_URI);
let db: any = null;

// Conectar a MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db('auth_service');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Funciones auxiliares
function hashPassword(password: string) {
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

function generateJWT(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyJWT(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

// Middleware de CORS
app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }
  
  await next();
});

// Middleware de autenticación simple
async function authenticate(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return c.json({ success: false, error: 'Token required' }, 401);
  }
  
  try {
    const payload = verifyJWT(token);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
}

// RUTAS

// Página principal
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auth Service</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 500px;
            }
            h1 { font-size: 3rem; margin-bottom: 1rem; }
            p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
            .btn {
                display: inline-block;
                padding: 12px 24px;
                background: rgba(255,255,255,0.2);
                color: white;
                text-decoration: none;
                border-radius: 10px;
                margin: 0.5rem;
                transition: all 0.3s;
                border: 1px solid rgba(255,255,255,0.3);
            }
            .btn:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
            }
            .status {
                background: rgba(255,255,255,0.1);
                padding: 1rem;
                border-radius: 10px;
                margin-top: 2rem;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔐 Auth Service</h1>
            <p>Servicio de autenticación con TypeScript, Hono y MongoDB</p>
            
            <div>
                <a href="/register" class="btn">📝 Registrarse</a>
                <a href="/login" class="btn">🔑 Iniciar Sesión</a>
                <a href="/dashboard" class="btn">📊 Dashboard</a>
            </div>
            
            <div class="status">
                <strong>Estado:</strong> ✅ Operativo<br>
                <strong>Base de datos:</strong> ${db ? '✅ Conectada' : '❌ Desconectada'}<br>
                <strong>Versión:</strong> 1.0.0<br>
                <strong>Hora:</strong> ${new Date().toLocaleString()}
            </div>
        </div>
    </body>
    </html>
  `);
});

// Página de registro
app.get('/register', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registro - Auth Service</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
            }
            .form-container {
                background: white;
                padding: 2rem;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
            }
            h1 { text-align: center; color: #333; margin-bottom: 2rem; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500; }
            input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e1e1e1;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.3s;
            }
            input:focus {
                outline: none;
                border-color: #667eea;
            }
            .btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .btn:hover { transform: translateY(-1px); }
            .message {
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                display: none;
            }
            .error { background: #fee; color: #c33; border: 1px solid #fcc; }
            .success { background: #efe; color: #3c3; border: 1px solid #cfc; }
            .back-link {
                text-align: center;
                margin-top: 1rem;
            }
            .back-link a {
                color: #667eea;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="form-container">
            <h1>📝 Crear Cuenta</h1>
            
            <div id="message" class="message"></div>
            
            <form id="registerForm">
                <div class="form-group">
                    <label for="username">Usuario</label>
                    <input type="text" id="username" name="username" required minlength="3">
                </div>
                
                <div class="form-group">
                    <label for="email">Email (opcional)</label>
                    <input type="email" id="email" name="email">
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" required minlength="6">
                </div>
                
                <button type="submit" class="btn">Crear Cuenta</button>
            </form>
            
            <div class="back-link">
                <a href="/">← Volver al inicio</a> | 
                <a href="/login">¿Ya tienes cuenta?</a>
            </div>
        </div>

        <script>
            document.getElementById('registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const data = {
                    username: formData.get('username'),
                    email: formData.get('email') || undefined,
                    password: formData.get('password')
                };
                
                try {
                    const response = await fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    const messageDiv = document.getElementById('message');
                    
                    if (result.success) {
                        messageDiv.className = 'message success';
                        messageDiv.textContent = 'Cuenta creada exitosamente. Redirigiendo...';
                        messageDiv.style.display = 'block';
                        
                        setTimeout(() => {
                            window.location.href = '/dashboard?token=' + result.token;
                        }, 2000);
                    } else {
                        messageDiv.className = 'message error';
                        messageDiv.textContent = 'Error: ' + result.error;
                        messageDiv.style.display = 'block';
                    }
                } catch (error) {
                    const messageDiv = document.getElementById('message');
                    messageDiv.className = 'message error';
                    messageDiv.textContent = 'Error de conexión';
                    messageDiv.style.display = 'block';
                }
            });
        </script>
    </body>
    </html>
  `);
});

// API: Registro de usuario
app.post('/api/register', async (c) => {
  try {
    const { username, email, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ success: false, error: 'Username y password son requeridos' }, 400);
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return c.json({ success: false, error: 'El usuario ya existe' }, 400);
    }
    
    // Crear usuario
    const passwordHash = hashPassword(password);
    const user = {
      username,
      email,
      passwordHash,
      createdAt: new Date(),
      isActive: true,
      role: 'user'
    };
    
    const result = await db.collection('users').insertOne(user);
    
    // Generar token
    const token = generateJWT({
      userId: result.insertedId,
      username,
      role: 'user'
    });
    
    return c.json({
      success: true,
      token,
      user: { id: result.insertedId, username, email, role: 'user' }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Página de login
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - Auth Service</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
            }
            .form-container {
                background: white;
                padding: 2rem;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
            }
            h1 { text-align: center; color: #333; margin-bottom: 2rem; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500; }
            input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e1e1e1;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.3s;
            }
            input:focus {
                outline: none;
                border-color: #667eea;
            }
            .btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .btn:hover { transform: translateY(-1px); }
            .message {
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                display: none;
            }
            .error { background: #fee; color: #c33; border: 1px solid #fcc; }
            .success { background: #efe; color: #3c3; border: 1px solid #cfc; }
            .back-link {
                text-align: center;
                margin-top: 1rem;
            }
            .back-link a {
                color: #667eea;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="form-container">
            <h1>🔑 Iniciar Sesión</h1>
            
            <div id="message" class="message"></div>
            
            <form id="loginForm">
                <div class="form-group">
                    <label for="username">Usuario o Email</label>
                    <input type="text" id="username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn">Iniciar Sesión</button>
            </form>
            
            <div class="back-link">
                <a href="/">← Volver al inicio</a> | 
                <a href="/register">Crear cuenta</a>
            </div>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const data = {
                    identifier: formData.get('username'),
                    password: formData.get('password')
                };
                
                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    const messageDiv = document.getElementById('message');
                    
                    if (result.success) {
                        messageDiv.className = 'message success';
                        messageDiv.textContent = 'Login exitoso. Redirigiendo...';
                        messageDiv.style.display = 'block';
                        
                        setTimeout(() => {
                            window.location.href = '/dashboard?token=' + result.token;
                        }, 1000);
                    } else {
                        messageDiv.className = 'message error';
                        messageDiv.textContent = 'Error: ' + result.error;
                        messageDiv.style.display = 'block';
                    }
                } catch (error) {
                    const messageDiv = document.getElementById('message');
                    messageDiv.className = 'message error';
                    messageDiv.textContent = 'Error de conexión';
                    messageDiv.style.display = 'block';
                }
            });
        </script>
    </body>
    </html>
  `);
});

// API: Login de usuario
app.post('/api/login', async (c) => {
  try {
    const { identifier, password } = await c.req.json();
    
    if (!identifier || !password) {
      return c.json({ success: false, error: 'Credenciales requeridas' }, 400);
    }
    
    // Buscar usuario
    const user = await db.collection('users').findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });
    
    if (!user || !user.isActive) {
      return c.json({ success: false, error: 'Usuario no encontrado' }, 401);
    }
    
    // Verificar contraseña
    const isValidPassword = verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Contraseña incorrecta' }, 401);
    }
    
    // Generar token
    const token = generateJWT({
      userId: user._id,
      username: user.username,
      role: user.role
    });
    
    return c.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Dashboard básico
app.get('/dashboard', (c) => {
  const token = c.req.query('token');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - Auth Service</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f7fa;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                padding: 2rem;
            }
            h1 { color: #333; text-align: center; margin-bottom: 2rem; }
            .user-info {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1.5rem;
                border-radius: 15px;
                margin-bottom: 2rem;
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            .stat-card {
                background: #f8f9fa;
                padding: 1.5rem;
                border-radius: 10px;
                text-align: center;
            }
            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 0.5rem;
            }
            .btn {
                display: inline-block;
                padding: 10px 20px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                margin: 0.5rem;
                transition: transform 0.2s;
            }
            .btn:hover { transform: translateY(-1px); }
            .btn-danger { background: #dc3545; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📊 Dashboard</h1>
            
            <div class="user-info" id="userInfo">
                <h2>Cargando información del usuario...</h2>
            </div>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">✅</div>
                    <div>Estado: Activo</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">🔒</div>
                    <div>Sesión: Segura</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">🕒</div>
                    <div id="loginTime">Conectado</div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="/api/protected" class="btn">🔐 Área Protegida</a>
                <a href="/" class="btn btn-danger">🚪 Salir</a>
            </div>
        </div>

        <script>
            const token = '${token}' || localStorage.getItem('authToken');
            
            if (token) {
                localStorage.setItem('authToken', token);
                
                // Verificar token
                fetch('/api/protected', {
                    headers: { 'Authorization': 'Bearer ' + token }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('userInfo').innerHTML = 
                            '<h2>Bienvenido, ' + data.user.username + '</h2>' +
                            '<p>ID: ' + data.user.userId + '</p>' +
                            '<p>Rol: ' + data.user.role + '</p>';
                        
                        document.getElementById('loginTime').textContent = 
                            'Conectado: ' + new Date().toLocaleTimeString();
                    } else {
                        document.getElementById('userInfo').innerHTML = 
                            '<h2>⚠️ Sesión inválida</h2><p>Por favor, inicia sesión nuevamente</p>';
                    }
                })
                .catch(err => {
                    document.getElementById('userInfo').innerHTML = 
                        '<h2>❌ Error de conexión</h2>';
                });
            } else {
                document.getElementById('userInfo').innerHTML = 
                    '<h2>🔒 No autenticado</h2><p><a href="/login">Inicia sesión</a></p>';
            }
        </script>
    </body>
    </html>
  `);
});

// API: Ruta protegida
app.get('/api/protected', authenticate, async (c) => {
  const user = (c as any).get('user');
  return c.json({
    success: true,
    message: 'Acceso autorizado',
    user: user,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Auth service is running',
    database: db ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Endpoint not found' }, 404);
});

// Error handler
app.onError((error, c) => {
  console.error('Server Error:', error);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// Iniciar servidor
async function startServer() {
  try {
    await connectDB();
    
    serve({
      fetch: app.fetch,
      port: PORT
    });
    
    console.log(`🚀 Auth Service running on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('   - GET  /           → Home page');
    console.log('   - GET  /register   → Registration page');
    console.log('   - GET  /login      → Login page');
    console.log('   - GET  /dashboard  → Dashboard');
    console.log('   - POST /api/register → Register user');
    console.log('   - POST /api/login    → Login user');
    console.log('   - GET  /api/protected → Protected route');
    console.log('   - GET  /health     → Health check');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;