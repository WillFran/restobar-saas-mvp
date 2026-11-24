# Restobar SaaS MVP

**Sistema web de gestión para restaurantes y restobares** desarrollado como proyecto de portafolio. Permite organizar mesas, productos y pedidos mediante interfaces diferenciadas para el personal operativo y administrativo.

> **Estado:** MVP en desarrollo. Algunas funciones y la configuración de base de datos necesaria para una instalación nueva aún están pendientes.

## Tecnologías utilizadas

- **Frontend:** React 19, TypeScript, Vite 8 y Tailwind CSS 4.
- **Backend como servicio:** Supabase (PostgreSQL, autenticación y Realtime).
- **Navegación:** React Router.
- **Interfaz:** React Hot Toast para notificaciones.
- **Control de versiones:** Git y GitHub.

## Funcionalidades del MVP

- **Acceso por roles:** vistas y rutas diferenciadas para administración, mozos, cocina y caja.
- **Mozo:** selección de mesas, registro y seguimiento de pedidos.
- **Cocina:** visualización de pedidos y actualización de sus estados.
- **Administración:** gestión de productos y mesas.
- **Dashboard:** indicadores operativos básicos.
- **Datos:** operaciones de consulta y actualización mediante servicios conectados a Supabase.

### Flujo funcional

1. El mozo selecciona una mesa y registra un pedido.
2. Cocina visualiza y actualiza el estado del pedido.
3. El personal consulta el avance desde las vistas correspondientes.

> La interfaz de caja existe dentro del proyecto, pero el módulo de cobros centralizados todavía está pendiente de implementación.

## Organización del código

```text
src/
├── components/layout/       # Estructura general de las vistas
├── context/                 # Contexto de autenticación
├── lib/                     # Cliente de Supabase
├── pages/                   # Acceso, mozo, cocina, caja y dashboard
│   └── admin/               # Administración de mesas y productos
├── routes/                  # Rutas protegidas y control por roles
├── services/                # Servicios de pedidos, mesas, productos y pagos
└── types/                   # Tipos de datos
```

## Cómo ejecutarlo localmente

**Requisitos:** Node.js compatible con Vite 8, npm y un proyecto Supabase configurado con las tablas, usuarios y políticas de seguridad que requiere la aplicación.

```bash
git clone https://github.com/WillFran/restobar-saas-mvp.git
cd restobar-saas-mvp
npm install
```

Crea un archivo `.env` en la raíz. Puedes tomar como referencia `.env.example`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publicable
```

Inicia la aplicación:

```bash
npm run dev
```

Abre la dirección local que indique Vite (habitualmente `http://localhost:5173`).

**Importante:** este repositorio no incluye migraciones SQL ni datos de ejemplo para reconstruir automáticamente la base de datos. Para utilizar todas las pantallas se requiere un proyecto Supabase compatible. Nunca publiques claves secretas o `service_role`; las variables `VITE_` quedan visibles en el frontend, por lo que la seguridad depende de las políticas RLS de Supabase.

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Compilación de producción
npm run lint     # Revisión con ESLint
npm run preview  # Vista previa de la compilación
```

## Próximas mejoras

- Completar caja, registro de cobros e historial de pagos.
- Añadir migraciones SQL, políticas RLS documentadas y datos de prueba.
- Incorporar pruebas automatizadas.
- Mejorar reportes y controles de inventario.
- Evaluar la integración con facturación electrónica peruana (SUNAT).

## Capturas de pantalla

Próximamente se añadirán capturas de las interfaces de inicio de sesión, administración, mesas, mozo y cocina, utilizando datos de demostración.

## Autor

**Willy Francis Delgado Tuanama**  
GitHub: [@WillFran](https://github.com/WillFran)

---

*Proyecto personal de aprendizaje y portafolio profesional en desarrollo web full stack.*
