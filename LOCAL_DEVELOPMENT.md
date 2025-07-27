# Guía de Desarrollo Local - CloudERP Suite

Esta guía te explica cómo ejecutar CloudERP Suite localmente sin problemas de autenticación.

## ✅ Problemas Solucionados

- ❌ **Error de autenticación "replitauth:localhost"** → ✅ **Sistema de autenticación de desarrollo**
- ❌ **Error de Docker/Supabase** → ✅ **PostgreSQL local**
- ❌ **Error de base de datos** → ✅ **Almacenamiento en memoria para desarrollo**
- ❌ **Error de escalamiento** → ✅ **Servicios mock para desarrollo**

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar PostgreSQL (Opcional)
Si quieres usar una base de datos real:
```bash
npm run db:setup
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```

### 4. Acceder a la aplicación
- Abre tu navegador en: `http://localhost:3000`
- Haz clic en "Login" o ve a `/api/login`
- ¡Listo! Ya estás autenticado como usuario de desarrollo

## 🔧 Configuración de Desarrollo

### Autenticación de Desarrollo
Cuando `NODE_ENV=development`, la aplicación:
- ✅ Usa autenticación simple sin OIDC
- ✅ Crea automáticamente un usuario de desarrollo
- ✅ Almacena sesiones en memoria (no requiere base de datos)
- ✅ Permite login automático visitando `/api/login`

### Variables de Entorno Automáticas
El script de desarrollo configura automáticamente:
- `NODE_ENV=development`
- `SESSION_SECRET=dev-secret-key`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clouderpsuite`

## 📊 Estado de los Servicios

### ✅ Funcionando
- ✅ Servidor Express en puerto 3000
- ✅ Autenticación de desarrollo
- ✅ API REST completa
- ✅ Interfaz de usuario React
- ✅ Servicios mock para desarrollo

### ⚠️ Limitaciones de Desarrollo
- 🔄 Base de datos: Almacenamiento en memoria (datos se pierden al reiniciar)
- 🔄 Archivos: No se guardan permanentemente
- 🔄 Escalamiento: Simulado (no envía emails reales)

## 🛠️ Comandos Útiles

```bash
# Iniciar desarrollo
npm run dev

# Ver estado de servicios
npm run supabase:status

# Configurar base de datos (opcional)
npm run db:setup

# Construir para producción
npm run build

# Verificar tipos TypeScript
npm run check
```

## 🔍 Troubleshooting

### Error: "Cannot set headers after they are sent"
✅ **Solucionado**: El sistema de autenticación de desarrollo maneja correctamente las respuestas.

### Error: "SASL: SCRAM-SERVER-FIRST-MESSAGE"
✅ **Solucionado**: Ya no requiere conexión a base de datos PostgreSQL.

### Error: "storage.getPendingWorkflowsForEscalation is not a function"
✅ **Solucionado**: Se agregaron métodos mock al storage.

### Puerto 3000 ocupado
```bash
# Cambiar puerto
PORT=3001 npm run dev
```

### Problemas de PowerShell
Si tienes problemas con PowerShell:
1. Ejecuta como administrador
2. O usa Command Prompt (cmd) en su lugar

## 🎯 Próximos Pasos

1. **Ejecuta la aplicación**: `npm run dev`
2. **Prueba la autenticación**: Ve a `/api/login`
3. **Explora las funcionalidades**: Navega por la aplicación
4. **Desarrolla nuevas features**: El entorno está listo para desarrollo

## 📝 Notas Importantes

- **Datos temporales**: En modo desarrollo, los datos se almacenan en memoria
- **Sin persistencia**: Los datos se pierden al reiniciar el servidor
- **Autenticación simple**: No requiere configuración de OIDC
- **Listo para desarrollo**: Todas las APIs funcionan con datos mock

¡Tu entorno de desarrollo está listo! 🎉 