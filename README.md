# FAQ 2.0

Sistema de preguntas frecuentes con backend PHP y frontend Angular.

## 📁 Estructura del Proyecto

```
faq2.0/
├── backend/          # API REST en PHP
└── frontend/         # Aplicación Angular
```

## 🚀 Instalación

### Backend
```powershell
cd backend
composer install
php -S localhost:8000
```

### Frontend
```powershell
cd frontend
npm install
ng serve
```

La aplicación estará disponible en `http://localhost:4200`

## 🔌 Endpoints API

- `GET /api/preguntas` - Listar todas las preguntas
- `GET /api/preguntas/{id}` - Obtener una pregunta
- `GET /api/preguntas/search?q={term}` - Buscar preguntas
- `POST /api/preguntas` - Crear pregunta (protegido)
- `PUT /api/preguntas/{id}` - Actualizar pregunta (protegido)
- `DELETE /api/preguntas/{id}` - Eliminar pregunta (protegido)

## 🛠️ Desarrollo

Ambos servidores deben estar corriendo simultáneamente:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:4200`

## 📝 Notas

El frontend se conecta al backend mediante el servicio `PreguntaService` que apunta a `http://localhost:8000/api/preguntas`.
