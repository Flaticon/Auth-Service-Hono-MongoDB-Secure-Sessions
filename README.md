# 🔐 Auth Service – Hono + MongoDB + Sessions  

[![Build](https://img.shields.io/github/actions/workflow/status/tu-usuario/tu-repo/ci.yml?label=build&logo=github)](https://github.com/Flaticon/Auth-Service-Hono-MongoDB-Secure-Sessions/actions)  
[![Deploy](https://img.shields.io/badge/deploy-cloudflare%20pages-blue?logo=cloudflare)](https://pages.cloudflare.com)  
[![License](https://img.shields.io/github/license/Flaticon/Auth-Service-Hono-MongoDB-Secure-Sessions)](./LICENSE)  
[![Made with Hono](https://img.shields.io/badge/made%20with-hono-orange?logo=cloudflare)](https://hono.dev)  
[![MongoDB](https://img.shields.io/badge/db-mongodb-green?logo=mongodb)](https://mongodb.com)  

Microservicio de autenticación clásico basado en **sesiones con cookies HttpOnly** y almacenamiento en **MongoDB**.  
Diseñado para ser simple, seguro y reutilizable en cualquier proyecto frontend (**Astro, React, etc.**) o como servicio independiente.  

---

## 🚀 Features

- `POST /signup` → Registro de usuario con **hash de contraseña (bcryptjs)**  
- `POST /login` → Autenticación con soporte de `?next=` para redirecciones post-login  
- `POST /logout` → Cierre de sesión y destrucción del registro en DB  
- `GET /dashboard` → Ruta protegida, accesible solo con sesión válida  
- Sesiones con `SESSID` almacenadas en MongoDB (`sessions`)  
- HTML simple con formularios `application/x-www-form-urlencoded` (sin AJAX)  
- Arquitectura **MVC minimal** (rutas → controladores, vistas en HTML, modelos con Mongo)  

---

## 🛠️ Tecnologías

- [Hono](https://hono.dev/) – framework minimal para serverless/edge  
- [MongoDB Atlas](https://www.mongodb.com/atlas/database) – base de datos en la nube (free tier 512 MB)  
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) – hashing de contraseñas compatible con runtimes edge  
- [TypeScript](https://www.typescriptlang.org/)  

---

## 📂 Estructura del proyecto

src/
├─ routes/
│ ├─ auth.ts # /login, /signup, /logout
│ └─ dashboard.ts # /dashboard
│
├─ views/
│ ├─ login.ts # HTML del login
│ ├─ signup.ts # HTML del signup
│ ├─ dashboard.ts # HTML del dashboard
│ └─ home.ts # HTML del home
│
├─ models/
│ ├─ user.ts # modelo de usuario
│ └─ session.ts # modelo de sesión
│
├─ utils/
│ └─ crypto.ts # funciones hashPassword, comparePassword
│
├─ server.ts # instancia de Hono, middlewares, rutas
└─ db.ts # conexión a Mongo

yaml
Copiar
Editar

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz:

```bash
MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/auth  
SESSION_SECRET=supersecretkey  
PORT=3000  
📦 Instalación & Uso
bash
Copiar
Editar
# Clonar el repositorio
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
🖼 Screenshots
Login

Signup

Dashboard protegido

🔗 Endpoints
GET /signup → formulario de registro

POST /signup → crea usuario

GET /login → formulario de login

POST /login → inicia sesión

GET /dashboard → dashboard protegido

POST /logout → cierra sesión

✅ CI/CD
Incluye GitHub Actions para:

Instalar dependencias

Lint + tests

Despliegue automático

📜 Licencia
Este proyecto está bajo la licencia MIT.

yaml
Copiar
Editar

---

👆 Este ya está listo para tu **GitHub**, con badges, secciones limpias y screenshots.  
¿Quieres que también te prepare un **`ci.yml` de GitHub Actions** para que tu badge de `Build` funcione de inmediato