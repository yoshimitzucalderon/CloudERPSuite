# Guía de Supabase MCP para CloudERP Suite

Esta guía te explica cómo usar Supabase MCP (Model Context Protocol) con tu proyecto CloudERP Suite.

## ¿Qué es Supabase MCP?

Supabase MCP es una herramienta que te permite:
- Ejecutar consultas SQL directamente desde tu editor
- Gestionar tu base de datos Supabase
- Crear y modificar tablas
- Insertar, actualizar y eliminar datos
- Ver el estado de tu base de datos en tiempo real

## Configuración Inicial

### 1. Instalar Supabase CLI (ya hecho)
```bash
npm install --save-dev supabase
```

### 2. Inicializar Supabase (ya hecho)
```bash
npx supabase init
```

### 3. Configurar el proyecto
El archivo `supabase/config.toml` ya está configurado para tu proyecto.

## Comandos Útiles

### Iniciar Supabase Local
```bash
npm run supabase:start
```
Esto iniciará:
- Base de datos PostgreSQL en puerto 54322
- API REST en puerto 54321
- Supabase Studio en puerto 54323
- Realtime en puerto 54324

### Ver Estado de Supabase
```bash
npm run supabase:status
```

### Abrir Supabase Studio
```bash
npm run supabase:studio
```
Esto abrirá la interfaz web de Supabase en tu navegador.

### Detener Supabase
```bash
npm run supabase:stop
```

## Uso con MCP

### 1. Configurar MCP en tu editor

Si usas VS Code, instala la extensión de Supabase:
- Busca "Supabase" en las extensiones
- Instala "Supabase" oficial

### 2. Conectar con tu base de datos

En VS Code:
1. Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
2. Busca "Supabase: Connect to Project"
3. Selecciona tu proyecto o crea uno nuevo

### 3. Ejecutar consultas SQL

Una vez conectado, puedes:
- Abrir un archivo `.sql`
- Escribir consultas SQL
- Presionar `Ctrl+Shift+P` y buscar "Supabase: Run Query"
- Ver los resultados en tiempo real

## Ejemplos de Consultas SQL

### Ver todas las tablas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Ver estructura de una tabla
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tu_tabla';
```

### Insertar datos de ejemplo
```sql
INSERT INTO projects (name, description, status)
VALUES ('Proyecto Demo', 'Descripción del proyecto', 'active');
```

### Consultar datos
```sql
SELECT * FROM projects WHERE status = 'active';
```

## Integración con tu Aplicación

### 1. Variables de Entorno

Para usar Supabase local, actualiza tu `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=tu_anon_key
```

### 2. Obtener las claves de API

Después de iniciar Supabase:
```bash
npm run supabase:status
```

Esto te mostrará las claves necesarias.

### 3. Usar con tu aplicación

Tu aplicación ya está configurada para usar la base de datos local cuando `NODE_ENV=development`.

## Migraciones y Esquemas

### Crear una nueva migración
```bash
npx supabase migration new nombre_de_la_migracion
```

### Aplicar migraciones
```bash
npm run supabase:db:push
```

### Resetear la base de datos
```bash
npm run supabase:db:reset
```

## Funciones Útiles de MCP

### 1. Autocompletado SQL
- El editor te sugerirá nombres de tablas y columnas
- Autocompletado de funciones SQL
- Sugerencias de sintaxis

### 2. Validación en Tiempo Real
- Errores de sintaxis SQL se muestran inmediatamente
- Validación de tipos de datos
- Verificación de restricciones

### 3. Explorador de Base de Datos
- Ver todas las tablas en el panel lateral
- Explorar estructura de tablas
- Ver datos de ejemplo

### 4. Historial de Consultas
- Guarda todas las consultas ejecutadas
- Reutilizar consultas anteriores
- Exportar resultados

## Troubleshooting

### Error de conexión
Si tienes problemas de conexión:
1. Verifica que Supabase esté corriendo: `npm run supabase:status`
2. Reinicia Supabase: `npm run supabase:stop && npm run supabase:start`
3. Verifica los puertos en `supabase/config.toml`

### Puerto ocupado
Si un puerto está ocupado:
1. Cambia el puerto en `supabase/config.toml`
2. O mata el proceso que usa ese puerto

### Problemas de permisos
En Windows, asegúrate de ejecutar PowerShell como administrador si tienes problemas.

## Recursos Adicionales

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Guía de MCP](https://supabase.com/docs/guides/cli)
- [SQL Reference](https://supabase.com/docs/reference/sql)

## Próximos Pasos

1. Inicia Supabase local: `npm run supabase:start`
2. Abre Supabase Studio: `npm run supabase:studio`
3. Explora tu base de datos
4. Ejecuta algunas consultas SQL de prueba
5. Integra con tu aplicación CloudERP Suite 