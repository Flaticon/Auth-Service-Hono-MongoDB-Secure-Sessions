import { html } from 'hono/html';

export function loginView(error?: string) {
  return html`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Iniciar Sesión - Auth Service</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            primary: '#3b82f6',
                            secondary: '#1e40af',
                        }
                    }
                }
            }
        </script>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full space-y-8">
            <div class="text-center">
                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
                    🔐 Iniciar Sesión
                </h2>
                <p class="mt-2 text-sm text-gray-600">
                    Accede a tu cuenta de forma segura
                </p>
            </div>
            
            <div class="bg-white shadow-2xl rounded-xl px-8 py-6">
                ${error ? html`
                    <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <div class="flex">
                            <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="text-sm">${error}</span>
                        </div>
                    </div>
                ` : ''}
                
                <form class="space-y-6" id="loginForm" onsubmit="handleLogin(event)">
                    <div>
                        <label for="identifier" class="block text-sm font-medium text-gray-700 mb-2">
                            Usuario o Email
                        </label>
                        <input 
                            id="identifier" 
                            name="identifier" 
                            type="text" 
                            required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="tu_usuario o email@ejemplo.com"
                        />
                    </div>
                    
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <div class="relative">
                            <input 
                                id="password" 
                                name="password" 
                                type="password" 
                                required 
                                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Tu contraseña"
                            />
                            <button 
                                type="button" 
                                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onclick="togglePassword()"
                            >
                                <svg id="eyeIcon" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input 
                                id="remember" 
                                name="remember" 
                                type="checkbox" 
                                class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label for="remember" class="ml-2 block text-sm text-gray-700">
                                Recordarme
                            </label>
                        </div>
                        
                        <div class="text-sm">
                            <a href="#" class="text-primary hover:text-secondary transition-colors">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </div>
                    
                    <div>
                        <button 
                            type="submit" 
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            id="submitBtn"
                        >
                            <span id="btnText">Iniciar Sesión</span>
                            <svg id="spinner" class="hidden animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </button>
                    </div>
                </form>
                
                <div class="mt-6">
                    <div class="relative">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-gray-300" />
                        </div>
                        <div class="relative flex justify-center text-sm">
                            <span class="px-2 bg-white text-gray-500">¿No tienes cuenta?</span>
                        </div>
                    </div>
                    
                    <div class="mt-6">
                        <a 
                            href="/signup" 
                            class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                        >
                            Crear nueva cuenta
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="text-center text-xs text-gray-500">
                © 2025 Auth Service. Todos los derechos reservados.
            </div>
        </div>
        
        <script>
            function togglePassword() {
                const passwordInput = document.getElementById('password');
                const eyeIcon = document.getElementById('eyeIcon');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    eyeIcon.innerHTML = \`
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    \`;
                } else {
                    passwordInput.type = 'password';
                    eyeIcon.innerHTML = \`
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    \`;
                }
            }
            
            async function handleLogin(event) {
                event.preventDefault();
                
                const form = event.target;
                const submitBtn = document.getElementById('submitBtn');
                const btnText = document.getElementById('btnText');
                const spinner = document.getElementById('spinner');
                
                // UI de loading
                submitBtn.disabled = true;
                btnText.textContent = 'Iniciando sesión...';
                spinner.classList.remove('hidden');
                
                try {
                    const formData = new FormData(form);
                    const data = {
                        identifier: formData.get('identifier'),
                        password: formData.get('password')
                    };
                    
                    const response = await fetch('/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Guardar token en localStorage para uso con JWT
                        if (result.token) {
                            localStorage.setItem('authToken', result.token);
                        }
                        
                        // Redirigir al dashboard
                        window.location.href = '/dashboard';
                    } else {
                        // Mostrar error
                        showError(result.error || 'Error al iniciar sesión');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showError('Error de conexión. Inténtalo de nuevo.');
                } finally {
                    // Restaurar UI
                    submitBtn.disabled = false;
                    btnText.textContent = 'Iniciar Sesión';
                    spinner.classList.add('hidden');
                }
            }
            
            function showError(message) {
                // Remover error anterior si existe
                const existingError = document.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                // Crear nuevo mensaje de error
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg';
                errorDiv.innerHTML = \`
                    <div class="flex">
                        <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="text-sm">\${message}</span>
                    </div>
                \`;
                
                const form = document.getElementById('loginForm');
                form.parentNode.insertBefore(errorDiv, form);
                
                // Auto-ocultar después de 5 segundos
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.remove();
                    }
                }, 5000);
            }
        </script>
    </body>
    </html>
  `;
}