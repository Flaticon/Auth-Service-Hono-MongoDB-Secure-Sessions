"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const db_js_1 = require("./db.js");
const auth_js_1 = require("./utils/auth.js");
// Importar rutas
const auth_js_2 = __importDefault(require("./routes/auth.js"));
const dashboard_js_1 = __importDefault(require("./routes/dashboard.js"));
// Importar vistas
const loginView_js_1 = require("./views/loginView.js");
const signupView_js_1 = require("./views/signupView.js");
const dashboardView_js_1 = require("./views/dashboardView.js");
// Crear instancia de Hono
const app = new hono_1.Hono();
// Rate limiting global
const globalRateLimit = (0, auth_js_1.createRateLimit)(100, 15 * 60 * 1000); // 100 requests per 15 minutes
// Middleware global
app.use('*', globalRateLimit);
// Middleware para logs
app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const end = Date.now();
    console.log(`${c.req.method} ${c.req.url} - ${c.res.status} - ${end - start}ms`);
});
// Middleware para CORS (si es necesario)
app.use('*', async (c, next) => {
    // Configurar CORS headers
    c.res.headers.set('Access-Control-Allow-Origin', db_js_1.config.ALLOWED_ORIGINS || '*');
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
    c.res.headers.set('Access-Control-Allow-Credentials', 'true');
    if (c.req.method === 'OPTIONS') {
        return c.text('', 200);
    }
    await next();
});
// ===================================
// RUTAS DE VISTAS HTML
// ===================================
/**
 * GET / - Redirige al login
 */
app.get('/', (c) => {
    return c.redirect('/login');
});
/**
 * GET /login - Página de login
 */
app.get('/login', (c) => {
    const error = c.req.query('error');
    return c.html((0, loginView_js_1.loginView)(error));
});
/**
 * GET /signup - Página de registro
 */
app.get('/signup', (c) => {
    const error = c.req.query('error');
    return c.html((0, signupView_js_1.signupView)(error));
});
/**
 * GET /dashboard - Página del dashboard
 */
app.get('/dashboard', (c) => {
    return c.html((0, dashboardView_js_1.dashboardView)());
});
// ===================================
// RUTAS DE API
// ===================================
/**
 * Rutas de autenticación
 */
app.route('/auth', auth_js_2.default);
/**
 * Rutas del dashboard (API)
 */
app.route('/dashboard', dashboard_js_1.default);
// ===================================
// RUTAS DE UTILIDAD
// ===================================
/**
 * GET /health - Health check
 */
app.get('/health', (c) => {
    return c.json({
        success: true,
        message: 'Auth service is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        environment: db_js_1.config.NODE_ENV
    });
});
/**
 * GET /api/status - Estado detallado del servicio
 */
app.get('/api/status', async (c) => {
    try {
        // Intentar conectar a la base de datos para verificar estado
        await (0, db_js_1.connectDB)();
        return c.json({
            success: true,
            status: 'healthy',
            services: {
                database: 'connected',
                auth: 'operational'
            },
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    }
    catch (error) {
        return c.json({
            success: false,
            status: 'unhealthy',
            services: {
                database: 'disconnected',
                auth: 'degraded'
            },
            error: 'Database connection failed',
            timestamp: new Date().toISOString()
        }, 503);
    }
});
// ===================================
// MANEJO DE ERRORES
// ===================================
/**
 * Manejo de rutas no encontradas
 */
app.notFound((c) => {
    const accept = c.req.header('Accept') || '';
    // Si es una petición de API, devolver JSON
    if (accept.includes('application/json')) {
        return c.json({
            success: false,
            error: 'Endpoint not found',
            path: c.req.url,
            method: c.req.method
        }, 404);
    }
    // Si es una petición de navegador, devolver HTML
    return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Página no encontrada - Auth Service</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                color: white;
                text-align: center;
            }
            .container {
                max-width: 500px;
                padding: 2rem;
            }
            h1 {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            h2 {
                font-size: 2rem;
                margin-bottom: 1rem;
                opacity: 0.9;
            }
            p {
                font-size: 1.1rem;
                margin-bottom: 2rem;
                opacity: 0.8;
            }
            a {
                background: rgba(255,255,255,0.2);
                color: white;
                padding: 0.75rem 1.5rem;
                text-decoration: none;
                border-radius: 5px;
                transition: background 0.3s;
            }
            a:hover {
                background: rgba(255,255,255,0.3);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>404</h1>
            <h2>Página no encontrada</h2>
            <p>La página que buscas no existe o ha sido movida.</p>
            <a href="/dashboard">Ir al Dashboard</a>
        </div>
    </body>
    </html>
  `, 404);
});
/**
 * Manejo global de errores
 */
app.onError((error, c) => {
    console.error('❌ Server Error:', error);
    const accept = c.req.header('Accept') || '';
    // Si es una petición de API, devolver JSON
    if (accept.includes('application/json')) {
        return c.json({
            success: false,
            error: db_js_1.config.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        }, 500);
    }
    // Si es una petición de navegador, devolver HTML
    return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error del servidor - Auth Service</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                color: white;
                text-align: center;
            }
            .container {
                max-width: 500px;
                padding: 2rem;
            }
            h1 {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            h2 {
                font-size: 1.5rem;
                margin-bottom: 1rem;
                opacity: 0.9;
            }
            p {
                font-size: 1rem;
                margin-bottom: 2rem;
                opacity: 0.8;
            }
            a {
                background: rgba(255,255,255,0.2);
                color: white;
                padding: 0.75rem 1.5rem;
                text-decoration: none;
                border-radius: 5px;
                transition: background 0.3s;
            }
            a:hover {
                background: rgba(255,255,255,0.3);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>⚠️ Error</h1>
            <h2>Ha ocurrido un error en el servidor</h2>
            <p>Por favor, inténtalo de nuevo más tarde.</p>
            <a href="/dashboard">Ir al Dashboard</a>
        </div>
    </body>
    </html>
  `, 500);
});
// ===================================
// INICIALIZACIÓN DEL SERVIDOR
// ===================================
/**
 * Función para inicializar el servidor
 */
async function startServer() {
    try {
        console.log('🚀 Starting Auth Service...');
        // Conectar a la base de datos
        await (0, db_js_1.connectDB)();
        console.log('✅ Database connected successfully');
        // Iniciar servidor
        const port = parseInt(db_js_1.config.PORT);
        console.log('🔧 Server configuration:');
        console.log(`   - Port: ${port}`);
        console.log(`   - Environment: ${db_js_1.config.NODE_ENV}`);
        console.log(`   - Database: ${db_js_1.config.DB_NAME}`);
        console.log(`   - JWT Expires: ${db_js_1.config.JWT_EXPIRES_IN}`);
        console.log(`   - Session TTL: ${db_js_1.config.SESSION_TTL_SECONDS}s`);
        (0, node_server_1.serve)({
            fetch: app.fetch,
            port
        });
        console.log(`✅ Auth Service running on http://localhost:${port}`);
        console.log('📋 Available endpoints:');
        console.log('   - GET  /              → Redirect to login');
        console.log('   - GET  /login         → Login page');
        console.log('   - GET  /signup        → Signup page');
        console.log('   - GET  /dashboard     → Dashboard page');
        console.log('   - POST /auth/register → Register user');
        console.log('   - POST /auth/login    → Login user');
        console.log('   - POST /auth/logout   → Logout user');
        console.log('   - GET  /auth/me       → Get current user');
        console.log('   - GET  /health        → Health check');
        console.log('   - GET  /api/status    → Service status');
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Manejo de señales de cierre graceful
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Iniciar servidor
startServer();
exports.default = app;
