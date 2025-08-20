import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { connectDB, config } from './db.js';
import { createRateLimit, optionalAuth } from './utils/auth.js';
import { loginView } from './views/loginViews.js';
import { signupView } from './views/signupViews.js';
import { dashboardView } from './views/dashboardViews.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';

// Crear aplicación Hono
const app = new Hono();

// Middlewares globales
app.use('*', async (c, next) => {
  // CORS headers
  c.header('Access-Control-Allow-Origin', config.ALLOWED_ORIGINS || '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  c.header('Access-Control-Allow-Credentials', 'true');
  
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('OK');
  }
  
  await next();
});

// Rate limiting global (más permisivo)
const globalRateLimit = createRateLimit(100, 15 * 60 * 1000); // 100 requests per 15 minutes
app.use('*', globalRateLimit);

// Logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.url} - ${c.res.status} (${ms}ms)`);
});

// ===================================
// RUTAS DE VISTAS
// ===================================

/**
 * GET /
 * Página principal - redirige según autenticación
 */
app.get('/', optionalAuth, async (c) => {
  const user = c.get('user');
  
  if (user) {
    return c.redirect('/dashboard');
  } else {
    return c.redirect('/login');
  }
});

/**
 * GET /login
 * Vista de inicio de sesión
 */
app.get('/login', optionalAuth, async (c) => {
  const user = c.get('user');
  const error = c.req.query('error');
  
  // Si ya está autenticado, redirigir al dashboard
  if (user) {
    return c.redirect('/dashboard');
  }
  
  return c.html(loginView(error));
});

/**
 * GET /signup
 * Vista de registro
 */
app.get('/signup', optionalAuth, async (c) => {
  const user = c.get('user');
  const error = c.req.query('error');
  
  // Si ya está autenticado, redirigir al dashboard
  if (user) {
    return c.redirect('/dashboard');
  }
  
  return c.html(signupView(error));
});

/**
 * GET /dashboard
 * Vista del dashboard (requiere autenticación)
 */
app.get('/dashboard', async (c) => {
  try {
    // Verificar autenticación usando session token o JWT
    const sessionToken = c.req.header('X-Session-Token') || c.req.cookie('sessionToken');
    const authToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!sessionToken && !authToken) {
      return c.redirect('/login?error=Authentication required');
    }
    
    // Verificar sesión
    let user;
    if (sessionToken) {
      const { AuthService } = await import('./services/authService.js');
      const result = await AuthService.verifySession(sessionToken);
      
      if (!result.success || !result.data) {
        return c.redirect('/login?error=Session expired');
      }
      
      user = result.data.user;
    } else if (authToken) {
      const { verifyJWT } = await import('./utils/crypto.js');
      const { User } = await import('./models/User.js');
      
      try {
        const payload = verifyJWT(authToken);
        const userData = await User.findPublicById(payload.userId);
        
        if (!userData) {
          return c.redirect('/login?error=User not found');
        }
        
        user = userData;
      } catch (error) {
        return c.redirect('/login?error=Invalid token');
      }
    }
    
    if (!user) {
      return c.redirect('/login?error=Authentication failed');
    }
    
    // Obtener datos del dashboard
    let dashboardData;
    try {
      const response = await fetch(`${c.req.url.replace('/dashboard', '/dashboard')}`, {
        headers: {
          'X-Session-Token': sessionToken || '',
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        dashboardData = result.data;
      }
    } catch (error) {
      console.log('Could not fetch dashboard data:', error);
    }
    
    return c.html(dashboardView(user, dashboardData));
  } catch (error) {
    console.error('Dashboard route error:', error);
    return c.redirect('/login?error=Internal server error');
  }
});

// ===================================
// RUTAS DE API
// ===================================

// Rutas de autenticación
app.route('/auth', authRoutes);

// Rutas del dashboard
app.route('/dashboard', dashboardRoutes);

// ===================================
// RUTAS DE UTILIDAD
// ===================================

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV
  });
});

/**
 * GET /status
 * Status detallado del servicio
 */
app.get('/status', async (c) => {
  try {
    // Verificar conexión a la base de datos
    const { getDb } = await import('./db.js');
    const db = getDb();
    await db.admin().ping();
    
    return c.json({
      success: true,
      status: 'healthy',
      services: {
        database: 'connected',
        auth: 'operational'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      status: 'unhealthy',
      services: {
        database: 'disconnected',
        auth: 'operational'
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
 * 404 - Ruta no encontrada
 */
app.notFound((c) => {
  if (c.req.header('Accept')?.includes('application/json')) {
    return c.json({
      success: false,
      error: 'Endpoint not found',
      path: c.req.path
    }, 404);
  }
  
  // Para requests HTML, redirigir a login
  return c.redirect('/login');
});

/**
 * Error handler global
 */
app.onError((error, c) => {
  console.error('❌ Server Error:', error);
  
  if (c.req.header('Accept')?.includes('application/json')) {
    return c.json({
      success: false,
      error: config.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      ...(config.NODE_ENV !== 'production' && { stack: error.stack })
    }, 500);
  }
  
  return c.redirect('/login?error=Internal server error');
});

// ===================================
// INICIALIZACIÓN DEL SERVIDOR
// ===================================

async function startServer() {
  try {
    // Conectar a la base de datos
    console.log('🔄 Initializing auth service...');
    await connectDB();
    
    // Iniciar servidor
    const port = parseInt(config.PORT);
    
    console.log(`🚀 Auth service starting on port ${port}`);
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`🔗 Database: ${config.DB_NAME}`);
    
    serve({
      fetch: app.fetch,
      port
    });
    
    console.log(`✅ Auth service is running on http://localhost:${port}`);
    console.log(`📱 Login: http://localhost:${port}/login`);
    console.log(`📝 Signup: http://localhost:${port}/signup`);
    console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
    console.log(`🏥 Health: http://localhost:${port}/health`);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Manejo graceful de shutdown
process.on('SIGINT', async () => {
  console.log('\n🔴 Received SIGINT. Shutting down gracefully...');
  
  try {
    const { closeDB } = await import('./db.js');
    await closeDB();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔴 Received SIGTERM. Shutting down gracefully...');
  
  try {
    const { closeDB } = await import('./db.js');
    await closeDB();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
  
  process.exit(0);
});

// Manejo de excepciones no capturadas
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

export default app;