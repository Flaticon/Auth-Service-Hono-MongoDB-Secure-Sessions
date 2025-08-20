/**
 * Vista HTML para la página de registro
 */
export function signupView(error?: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro - Auth Service</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 450px;
        }
        
        .logo {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .logo h1 {
            color: #333;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .logo p {
            color: #666;
            font-size: 0.9rem;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }
        
        input[type="text"],
        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e1e1e1;
            border-radius: 5px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        input[type="text"]:focus,
        input[type="email"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .password-requirements {
            font-size: 0.8rem;
            color: #666;
            margin-top: 0.5rem;
        }
        
        .requirement {
            display: block;
            margin: 0.2rem 0;
        }
        
        .requirement.valid {
            color: #4CAF50;
        }
        
        .requirement.invalid {
            color: #f44336;
        }
        
        .btn {
            width: 100%;
            padding: 0.75rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-1px);
        }
        
        .btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        .error, .success {
            padding: 0.75rem;
            border-radius: 5px;
            margin-bottom: 1rem;
        }
        
        .error {
            background: #fee;
            color: #c33;
            border: 1px solid #fcc;
        }
        
        .success {
            background: #efe;
            color: #3c3;
            border: 1px solid #cfc;
        }
        
        .links {
            text-align: center;
            margin-top: 1.5rem;
        }
        
        .links a {
            color: #667eea;
            text-decoration: none;
            font-size: 0.9rem;
        }
        
        .links a:hover {
            text-decoration: underline;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin-top: 1rem;
        }
        
        .spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🔐</h1>
            <h1>Auth Service</h1>
            <p>Crea tu cuenta</p>
        </div>
        
        <div id="messages"></div>
        
        <form id="signupForm">
            <div class="form-group">
                <label for="username">Nombre de Usuario</label>
                <input type="text" id="username" name="username" required 
                       pattern="[a-zA-Z0-9_.-]+" minlength="3" maxlength="30">
                <div class="password-requirements">
                    <span class="requirement" id="username-length">• Mínimo 3 caracteres</span>
                    <span class="requirement" id="username-chars">• Solo letras, números, puntos, guiones y guión bajo</span>
                </div>
            </div>
            
            <div class="form-group">
                <label for="email">Email (Opcional)</label>
                <input type="email" id="email" name="email">
            </div>
            
            <div class="form-group">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" required minlength="8">
                <div class="password-requirements">
                    <span class="requirement" id="pwd-length">• Mínimo 8 caracteres</span>
                    <span class="requirement" id="pwd-upper">• Una letra mayúscula</span>
                    <span class="requirement" id="pwd-lower">• Una letra minúscula</span>
                    <span class="requirement" id="pwd-number">• Un número</span>
                    <span class="requirement" id="pwd-special">• Un carácter especial</span>
                </div>
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">Confirmar Contraseña</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
                <div class="password-requirements">
                    <span class="requirement" id="pwd-match">• Las contraseñas deben coincidir</span>
                </div>
            </div>
            
            <button type="submit" class="btn" id="submitBtn" disabled>
                Crear Cuenta
            </button>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Creando cuenta...</p>
            </div>
        </form>
        
        <div class="links">
            <a href="/login">¿Ya tienes cuenta? Inicia sesión</a>
        </div>
    </div>

    <script>
        const form = document.getElementById('signupForm');
        const submitBtn = document.getElementById('submitBtn');
        const loading = document.getElementById('loading');
        const messages = document.getElementById('messages');
        
        // Elementos de validación
        const username = document.getElementById('username');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        
        // Validación en tiempo real
        username.addEventListener('input', validateUsername);
        password.addEventListener('input', validatePassword);
        confirmPassword.addEventListener('input', validatePasswordMatch);
        
        function validateUsername() {
            const value = username.value;
            const lengthReq = document.getElementById('username-length');
            const charsReq = document.getElementById('username-chars');
            
            // Validar longitud
            if (value.length >= 3) {
                lengthReq.classList.add('valid');
                lengthReq.classList.remove('invalid');
            } else {
                lengthReq.classList.add('invalid');
                lengthReq.classList.remove('valid');
            }
            
            // Validar caracteres
            if (/^[a-zA-Z0-9_.-]+$/.test(value)) {
                charsReq.classList.add('valid');
                charsReq.classList.remove('invalid');
            } else {
                charsReq.classList.add('invalid');
                charsReq.classList.remove('valid');
            }
            
            checkFormValidity();
        }
        
        function validatePassword() {
            const value = password.value;
            
            // Validar longitud
            const lengthReq = document.getElementById('pwd-length');
            if (value.length >= 8) {
                lengthReq.classList.add('valid');
                lengthReq.classList.remove('invalid');
            } else {
                lengthReq.classList.add('invalid');
                lengthReq.classList.remove('valid');
            }
            
            // Validar mayúscula
            const upperReq = document.getElementById('pwd-upper');
            if (/[A-Z]/.test(value)) {
                upperReq.classList.add('valid');
                upperReq.classList.remove('invalid');
            } else {
                upperReq.classList.add('invalid');
                upperReq.classList.remove('valid');
            }
            
            // Validar minúscula
            const lowerReq = document.getElementById('pwd-lower');
            if (/[a-z]/.test(value)) {
                lowerReq.classList.add('valid');
                lowerReq.classList.remove('invalid');
            } else {
                lowerReq.classList.add('invalid');
                lowerReq.classList.remove('valid');
            }
            
            // Validar número
            const numberReq = document.getElementById('pwd-number');
            if (/\d/.test(value)) {
                numberReq.classList.add('valid');
                numberReq.classList.remove('invalid');
            } else {
                numberReq.classList.add('invalid');
                numberReq.classList.remove('valid');
            }
            
            // Validar carácter especial
            const specialReq = document.getElementById('pwd-special');
            if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                specialReq.classList.add('valid');
                specialReq.classList.remove('invalid');
            } else {
                specialReq.classList.add('invalid');
                specialReq.classList.remove('valid');
            }
            
            validatePasswordMatch();
            checkFormValidity();
        }
        
        function validatePasswordMatch() {
            const matchReq = document.getElementById('pwd-match');
            
            if (password.value && confirmPassword.value) {
                if (password.value === confirmPassword.value) {
                    matchReq.classList.add('valid');
                    matchReq.classList.remove('invalid');
                } else {
                    matchReq.classList.add('invalid');
                    matchReq.classList.remove('valid');
                }
            }
            
            checkFormValidity();
        }
        
        function checkFormValidity() {
            const usernameValid = username.value.length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(username.value);
            const passwordValid = password.value.length >= 8 && 
                                  /[A-Z]/.test(password.value) && 
                                  /[a-z]/.test(password.value) && 
                                  /\d/.test(password.value) && 
                                  /[!@#$%^&*(),.?":{}|<>]/.test(password.value);
            const passwordsMatch = password.value === confirmPassword.value && password.value.length > 0;
            
            if (usernameValid && passwordValid && passwordsMatch) {
                submitBtn.disabled = false;
            } else {
                submitBtn.disabled = true;
            }
        }
        
        function showMessage(message, type = 'error') {
            messages.innerHTML = `<div class="${type}">${message}</div>`;
            setTimeout(() => {
                messages.innerHTML = '';
            }, 5000);
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                username: formData.get('username'),
                email: formData.get('email') || undefined,
                password: formData.get('password')
            };
            
            // Verificar que las contraseñas coincidan
            if (data.password !== formData.get('confirmPassword')) {
                showMessage('Las contraseñas no coinciden');
                return;
            }
            
            // Mostrar loading
            submitBtn.style.display = 'none';
            loading.style.display = 'block';
            
            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('¡Cuenta creada exitosamente! Redirigiendo...', 'success');
                    
                    // Guardar token si es necesario
                    if (result.token) {
                        localStorage.setItem('authToken', result.token);
                    }
                    
                    // Redirigir al dashboard después de un momento
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 2000);
                } else {
                    showMessage('Error: ' + result.error);
                    submitBtn.style.display = 'block';
                    loading.style.display = 'none';
                }
            } catch (error) {
                console.error('Signup error:', error);
                showMessage('Error de conexión. Inténtalo de nuevo.');
                submitBtn.style.display = 'block';
                loading.style.display = 'none';
            }
        });
        
        // Validación inicial
        checkFormValidity();
    </script>
</body>
</html>
  `;
}