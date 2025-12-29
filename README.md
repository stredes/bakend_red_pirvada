# Huerto Hogar Backend (Express + Firebase)

Backend REST para la app Huerto Hogar. Toda la captura de datos pasa por este API y se persiste en Firebase (Firestore + Storage). Diseñado para desplegarse en Vercel.

## Caracteristicas

- Autenticacion JWT (access + refresh)
- Usuarios con roles (root, admin, provider, user)
- Productos (CRUD) + subida de imagenes a Firebase Storage
- Carrito por usuario
- Ordenes/checkout
- Mensajeria y social (solicitudes, amigos)
- Mensajes de contacto (admin)

## Requisitos

- Node.js 18+
- Proyecto Firebase con Firestore y Storage habilitados
- Service Account de Firebase

## Configuracion

Copia `.env.example` a `.env` y completa las variables:

```env
JWT_SECRET=change-me
FIREBASE_SERVICE_ACCOUNT_JSON={...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
ROOT_EMAIL=root
ROOT_PASSWORD=change-this
```

## Ejecutar local

```bash
npm install
npm run dev
```

API: `http://localhost:3000` (tambien disponible en `/v1`)

Health: `GET /health`

## Endpoints principales

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/verify-email`
- `POST /auth/reset-password` (token requerido)

### Usuarios (admin/root)
- `GET /users`
- `GET /users/:email`
- `PATCH /users/:email`
- `POST /users/admin`
- `DELETE /users/:email`

### Productos
- `GET /products`
- `GET /products/:id`
- `POST /products` (admin/root/provider)
- `PUT /products/:id` (admin/root/provider)
- `DELETE /products/:id` (admin/root/provider)

### Uploads
- `POST /uploads/products` (multipart, field: `image`)

### Carrito
- `GET /cart`
- `POST /cart/items`
- `DELETE /cart/items/:productId`
- `POST /cart/clear`

### Ordenes
- `POST /orders`

### Pedidos (flujo principal app movil)
- `POST /pedidos`
- `GET /pedidos/mis`
- `GET /pedidos/proveedor`
- `GET /pedidos/proveedor/pendientes`
- `GET /pedidos/proveedor/listos-despacho`
- `GET /pedidos/counts/pendientes`
- `GET /pedidos/counts/notificaciones`
- `GET /pedidos/:pedidoId`
- `PATCH /pedidos/:pedidoId/metodo-pago`
- `PATCH /pedidos/:pedidoId/estado`
- `POST /pedidos/:pedidoId/confirmar`
- `POST /pedidos/:pedidoId/pagado`
- `POST /pedidos/:pedidoId/listo-despacho`
- `POST /pedidos/:pedidoId/en-camino`
- `POST /pedidos/:pedidoId/entregado`
- `POST /pedidos/:pedidoId/cancelar`

### Mensajes
- `POST /messages`
- `GET /messages/inbox`
- `GET /messages/thread?with=email`

### Social
- `POST /social/requests`
- `GET /social/requests/incoming`
- `GET /social/requests/outgoing`
- `POST /social/requests/:id/accept`
- `POST /social/requests/:id/reject`
- `GET /social/friends`

### Contacto
- `POST /contact`
- `GET /contact/admin`
- `PATCH /contact/admin/:id`
- `DELETE /contact/admin/:id`

## Paginacion y filtros

- `GET /products?page=1&pageSize=20`
- `GET /messages/inbox?page=1&pageSize=20`
- `GET /messages/thread?with=email&page=1&pageSize=50`
- `GET /contact/admin?page=1&pageSize=20`
- `GET /pedidos/mis?page=1&pageSize=20&estado=PENDIENTE&desde=1700000000000&hasta=1709999999999`

## Notas de contratos

- `POST /cart/items` espera `{ productId, qty }` y devuelve `subtotalCLP`/`totalCLP`.
- `POST /uploads/products` usa multipart con campo `image`.
- `PATCH /pedidos/:id/metodo-pago` cambia a `ESPERANDO_PAGO`.
- Cancelacion requiere `motivoCancelacion` o `motivo` en el body.

## Arquitectura (capas)

```
src/
  app.js
  config/
  controllers/
  middleware/
  repositories/
  routes/
  services/
  utils/
```

## Despliegue en Vercel

1. Agrega las variables de entorno del `.env` en el panel de Vercel.
2. Configura el proyecto para Node (sin build).
3. Usa el archivo `vercel.json`.

## Notas de integracion con la app

- La app debe dejar de usar Room para persistencia local.
- Todas las operaciones (usuarios, productos, carrito, mensajes) deben consumir este backend.
- La subida de imagenes debe ir al endpoint `/uploads/products` y usar la URL devuelta.
