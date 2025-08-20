"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardView = dashboardView;
/**
 * Vista HTML para el dashboard
 */
function dashboardView() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Auth Service</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            color: #333;
        }
        
        .navbar {
            background: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .navbar h1 {
            color: #667eea;
            font-size: 1.5rem;
        }
        
        .user-menu {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            text-decoration: none;
            display: inline-block;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-secondary {
            background: #e2e8f0;
            color: #64748b;
        }
        
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .card h3 {
            margin-bottom: 1rem;
            color: #333;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .stat-card {
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #64748b;
        }
        
        .spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error {
            background: #fee;
            color: #c33;
            padding: 1rem;
            border-radius: 5px;
            margin: 1rem 0;
            border: 1px solid #fcc;
        }
        
        .success {
            background: #efe;
            color: #3c3;
            padding: 1rem;
            border-radius: 5px;
            margin: 1rem 0;
            border: 1px solid #cfc;
        }
        
        .session-item {
            padding: 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            margin-bottom: 1rem;
        }
        
        .session-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .session-device {
            font-weight: bold;
            color: #333;
        }
        
        .session-current {
            background: #dcfce7;
            color: #166534;
            padding: 0.2rem 0.5rem;
            border-radius: 3px;
            font-size: 0.8rem;
        }
        
        .session-details {
            font-size: 0.9rem;
            color: #64748b;
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid #e2e8f0;
            margin-bottom: 1rem;
        }
        
        .tab {
            padding: 0.75rem 1.5rem;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .tab.active {
            border-bottom-color: #667eea;
            color: #667eea;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .profile-form {
            display: grid;
            gap: 1rem;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        .form-group label {
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333;
        }
        
        .form-group input {
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            font-size: 1rem;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        @media (max-width: 768px) {
            .navbar {
                padding: 1rem;
                flex-direction: column;
                gap: 1rem;
            }
            
            .container {
                padding: 1rem;
            }
            
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <h1>🔐 Auth Service</h1>
        <div class="user-menu">
            <div class="user-info">
                <div class="avatar" id="userAvatar">U</div>
                <span id="userName">Cargando...</span>
            </div>
            <button class="btn btn-danger" onclick="logout()">Cerrar Sesión</button>
        </div>
    </nav>
    
    <div class="container">
        <div id="messages"></div>
        
        <div class="dashboard-grid">
            <div class="card stat-card">
                <h3>👤 Perfil</h3>
                <div class="stat-number" id="userRole">-</div>
                <div class="stat-label">Rol de usuario</div>
            </div>
            
            <div class="card stat-card">
                <h3>🔒 Sesiones Activas</h3>
                <div class="stat-number" id="activeSessions">-</div>
                <div class="stat-label">Dispositivos conectados</div>
            </div>
            
            <div class="card stat-card">
                <h3>📅 Miembro desde</h3>
                <div class="stat-number" id="memberSince">-</div>
                <div class="stat-label">Fecha de registro</div>
            </div>
        </div>
        
        <div class="card">
            <div class="tabs">
                <div class="tab active" onclick="showTab('profile')">Perfil</div>
                <div class="tab" onclick="showTab('security')">Seguridad</div>
                <div class="tab" onclick="showTab('sessions')">Sesiones</div>
            </div>
            
            <div class="tab-content active" id="profile-tab">
                <h3>📝 Información del Perfil</h3>
                <form class="profile-form" id="profileForm">
                    <div class="form-group">
                        <label for="profileUsername">Nombre de Usuario</label>
                        <input type="text" id="profileUsername" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label for="profileEmail">Email</label>
                        <input type="email" id="profileEmail">
                    </div>
                    
                    <div class="form-group">
                        <label for="profileFirstName">Nombre</label>
                        <input type="text" id="profileFirstName">
                    </div>
                    
                    <div class="form-group">
                        <label for="profileLastName">Apellido</label>
                        <input type="text" id="profileLastName">
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Actualizar Perfil</button>
                </form>
            </div>
            
            <div class="tab-content" id="security-tab">
                <h3>🔐 Cambiar Contraseña</h3>
                <form class="profile-form" id="passwordForm">
                    <div class="form-group">
                        <label for="currentPassword">Contraseña Actual</label>
                        <input type="password" id="currentPassword" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="newPassword">Nueva Contraseña</label>
                        <input type="password" id="newPassword" required minlength="8">
                    </div>
                    
                    <div class="form-group">
                        <label for="confirmNewPassword">Confirmar Nueva Contraseña</label>
                        <input type="password" id="confirmNewPassword" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Cambiar Contraseña</button>
                </form>
                
                <hr style="margin: 2rem 0;">
                
                <h3>⚠️ Zona Peligrosa</h3>
                <button class="btn btn-danger" onclick="logoutAll()">
                    Cerrar Sesión en Todos los Dispositivos
                </button>
            </div>
            
            <div class="tab-content" id="sessions-tab">
                <h3>🔒 Sesiones Activas</h3>
                <div id="sessionsList">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Cargando sesiones...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentUser = null;
        
        document.addEventListener('DOMContentLoaded', function() {
            loadDashboard();
        });
        
        async function loadDashboard() {
            try {
                const response = await fetch('/dashboard', {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('Failed to load dashboard');
                }
                
                const result = await response.json();
                
                if (result.success) {
                    currentUser = result.data.user;
                    updateUI(result.data);
                } else {
                    showMessage('Error cargando dashboard: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Dashboard load error:', error);
                showMessage('Error de conexión', 'error');
            }
        }
        
        function updateUI(data) {
            const user = data.user;
            const stats = data.stats;
            
            document.getElementById('userName').textContent = user.username;
            document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
            document.getElementById('userRole').textContent = user.role.toUpperCase();
            document.getElementById('activeSessions').textContent = stats.activeSessions;
            
            const memberSince = new Date(user.createdAt).toLocaleDateString();
            document.getElementById('memberSince').textContent = memberSince;
            
            document.getElementById('profileUsername').value = user.username;
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profileFirstName').value = user.profile?.firstName || '';
            document.getElementById('profileLastName').value = user.profile?.lastName || '';
        }
        
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.getElementById(tabName + '-tab').classList.add('active');
            event.target.classList.add('active');
            
            if (tabName === 'sessions') {
                loadSessions();
            }
        }
        
        async function loadSessions() {
            const sessionsList = document.getElementById('sessionsList');
            sessionsList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando sesiones...</p></div>';
            
            try {
                const response = await fetch('/auth/sessions', {
                    credentials: 'include'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    displaySessions(result.data);
                } else {
                    sessionsList.innerHTML = '<p class="error">Error cargando sesiones: ' + result.error + '</p>';
                }
            } catch (error) {
                sessionsList.innerHTML = '<p class="error">Error de conexión</p>';
            }
        }
        
        function displaySessions(sessions) {
            const sessionsList = document.getElementById('sessionsList');
            
            if (sessions.length === 0) {
                sessionsList.innerHTML = '<p>No hay sesiones activas</p>';
                return;
            }
            
            const html = sessions.map(session => 
                '<div class="session-item">' +
                    '<div class="session-header">' +
                        '<div class="session-device">' + (session.metadata.device || 'Dispositivo desconocido') + '</div>' +
                        (session.isCurrent ? '<span class="session-current">Sesión actual</span>' : '') +
                    '</div>' +
                    '<div class="session-details">' +
                        '<p>IP: ' + (session.ipAddress || 'Desconocida') + '</p>' +
                        '<p>Último acceso: ' + new Date(session.lastAccess).toLocaleString() + '</p>' +
                        '<p>Creada: ' + new Date(session.createdAt).toLocaleString() + '</p>' +
                        (!session.isCurrent ? '<button class="btn btn-danger" onclick="revokeSession(\\'' + session.id + '\\')">Revocar</button>' : '') +
                    '</div>' +
                '</div>'
            ).join('');
            
            sessionsList.innerHTML = html;
        }
        
        async function revokeSession(sessionId) {
            if (!confirm('¿Estás seguro de que quieres revocar esta sesión?')) {
                return;
            }
            
            try {
                const response = await fetch('/auth/sessions/' + sessionId, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Sesión revocada exitosamente', 'success');
                    loadSessions();
                } else {
                    showMessage('Error revocando sesión: ' + result.error, 'error');
                }
            } catch (error) {
                showMessage('Error de conexión', 'error');
            }
        }
        
        document.getElementById('profileForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const updates = {
                email: formData.get('profileEmail'),
                profile: {
                    firstName: formData.get('profileFirstName'),
                    lastName: formData.get('profileLastName')
                }
            };
            
            try {
                const response = await fetch('/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(updates)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Perfil actualizado exitosamente', 'success');
                    currentUser = result.data;
                } else {
                    showMessage('Error actualizando perfil: ' + result.error, 'error');
                }
            } catch (error) {
                showMessage('Error de conexión', 'error');
            }
        });
        
        document.getElementById('passwordForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmNewPassword');
            
            if (newPassword !== confirmPassword) {
                showMessage('Las contraseñas no coinciden', 'error');
                return;
            }
            
            try {
                const response = await fetch('/auth/change-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Contraseña cambiada exitosamente. Redirigiendo al login...', 'success');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    showMessage('Error cambiando contraseña: ' + result.error, 'error');
                }
            } catch (error) {
                showMessage('Error de conexión', 'error');
            }
        });
        
        async function logout() {
            try {
                const response = await fetch('/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '/login';
            }
        }
        
        async function logoutAll() {
            if (!confirm('¿Estás seguro de que quieres cerrar sesión en todos los dispositivos?')) {
                return;
            }
            
            try {
                const response = await fetch('/auth/logout-all', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Sesión cerrada en todos los dispositivos. Redirigiendo...', 'success');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    showMessage('Error: ' + result.error, 'error');
                }
            } catch (error) {
                showMessage('Error de conexión', 'error');
            }
        }
        
        function showMessage(message, type) {
            type = type || 'error';
            const messages = document.getElementById('messages');
            messages.innerHTML = '<div class="' + type + '">' + message + '</div>';
            setTimeout(() => {
                messages.innerHTML = '';
            }, 5000);
        }
    </script>
</body>
</html>`;
}
