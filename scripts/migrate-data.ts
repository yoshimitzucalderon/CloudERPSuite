import postgres from 'postgres';
import { config } from 'dotenv';

config();

async function migrateDataRobust() {
  console.log('🚀 Iniciando migración robusta con manejo de fechas...');

  const neon = postgres(process.env.NEON_DATABASE_URL!, { 
    prepare: false, 
    max: 5,
    ssl: { rejectUnauthorized: false }
  });

  const supabase = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max: 5,
    ssl: { rejectUnauthorized: false }
  });

  // Función mejorada para limpiar fechas
  function cleanDateValue(value: any, columnName: string, tableName: string): any {
    if (value === null || value === undefined) return null;
    
    // Para campos que sabemos que son fechas
    const dateFields = ['created_at', 'updated_at', 'start_date', 'end_date', 'due_date', 
                       'birth_date', 'call_date', 'contract_date', 'paid_date', 'issued_date', 
                       'expiry_date', 'submission_date', 'approval_date', 'completion_date'];
    
    const isDateField = dateFields.some(field => columnName.toLowerCase().includes(field.toLowerCase())) ||
                       columnName.toLowerCase().includes('date') ||
                       columnName.toLowerCase().includes('time');

    if (isDateField) {
      try {
        // Caso 1: Si ya es una fecha válida
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            console.log(`    🔧 Fecha inválida en ${tableName}.${columnName}: ${value} → NULL`);
            return null;
          }
          return value.toISOString();
        }
        
        // Caso 2: String de fecha
        if (typeof value === 'string') {
          // Limpiar strings problemáticos
          let cleanString = value.trim();
          
          // Casos especiales conocidos
          if (cleanString === '' || cleanString === 'Invalid Date' || cleanString === 'null') {
            return null;
          }
          
          // Intentar parsear
          const parsed = new Date(cleanString);
          if (isNaN(parsed.getTime())) {
            console.log(`    🔧 String de fecha inválido en ${tableName}.${columnName}: "${value}" → NULL`);
            return null;
          }
          
          return parsed.toISOString();
        }
        
        // Caso 3: Número (timestamp)
        if (typeof value === 'number') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            console.log(`    🔧 Timestamp inválido en ${tableName}.${columnName}: ${value} → NULL`);
            return null;
          }
          return date.toISOString();
        }
        
        // Caso 4: Otros tipos - intentar convertir
        const attemptDate = new Date(value);
        if (isNaN(attemptDate.getTime())) {
          console.log(`    🔧 Valor no fecha en ${tableName}.${columnName}: ${typeof value} ${value} → NULL`);
          return null;
        }
        
        return attemptDate.toISOString();
        
      } catch (error) {
        console.log(`    🔧 Error procesando fecha en ${tableName}.${columnName}: ${error.message} → NULL`);
        return null;
      }
    }
    
    // No es un campo de fecha - manejar otros tipos
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value);
      } catch (jsonError) {
        console.log(`    🔧 Error JSON en ${tableName}.${columnName}: ${jsonError.message} → NULL`);
        return null;
      }
    }
    
    return value;
  }

  // Función para inspeccionar datos problemáticos
  async function inspectProblematicData(tableName: string, columnNames: string[]) {
    console.log(`    🔍 Inspeccionando datos problemáticos en ${tableName}...`);
    
    try {
      const sampleData = await neon.unsafe(`SELECT * FROM "${tableName}" LIMIT 1`);
      if (sampleData.length > 0) {
        const sample = sampleData[0];
        console.log(`    📋 Muestra de datos:`);
        
        for (const col of columnNames.slice(0, 5)) { // Solo primeras 5 columnas
          const value = sample[col];
          const type = typeof value;
          const preview = type === 'string' ? `"${value?.slice(0, 50)}..."` : String(value);
          console.log(`      ${col}: ${type} = ${preview}`);
        }
      }
    } catch (inspectError) {
      console.log(`    ⚠️  Error inspeccionando: ${inspectError.message}`);
    }
  }

  // Función para obtener columnas con tipos
  async function getTableColumns(db: any, tableName: string) {
    const columns = await db`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    return columns.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES'
    }));
  }

  // Función para migrar tabla con diagnóstico
  async function migrateTableRobust(tableName: string) {
    console.log(`🔄 Procesando: ${tableName}`);

    try {
      // Verificar existencia
      const neonExists = await neon`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = ${tableName} AND table_schema = 'public'
        )
      `;
      
      const supabaseExists = await supabase`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = ${tableName} AND table_schema = 'public'
        )
      `;

      if (!neonExists[0].exists || !supabaseExists[0].exists) {
        console.log(`    ⚠️  Tabla no existe en una de las bases de datos`);
        return;
      }

      // Obtener esquemas
      const neonColumns = await getTableColumns(neon, tableName);
      const supabaseColumns = await getTableColumns(supabase, tableName);
      
      const commonColumns = neonColumns
        .map(c => c.name)
        .filter(col => supabaseColumns.some(sc => sc.name === col));

      // Contar registros
      const [neonCount] = await neon.unsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);

      if (neonCount.count === 0) {
        console.log(`    ⚪ tabla vacía`);
        return;
      }

      console.log(`    📊 ${neonCount.count} registros en Neon`);
      console.log(`    🔗 ${commonColumns.length} columnas comunes`);

      // Inspeccionar datos si hay pocos registros
      if (neonCount.count <= 10) {
        await inspectProblematicData(tableName, commonColumns);
      }

      // Obtener datos
      const columnsList = commonColumns.map(c => `"${c}"`).join(', ');
      const data = await neon.unsafe(`SELECT ${columnsList} FROM "${tableName}"`);

      if (data.length === 0) return;

      // Limpiar tabla destino
      await supabase.unsafe(`DELETE FROM "${tableName}"`);

      // Migrar registro por registro con diagnóstico detallado
      let migratedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Limpiar valores con diagnóstico
          const cleanedValues = commonColumns.map(col => {
            return cleanDateValue(row[col], col, tableName);
          });

          // Intentar insertar
          const placeholders = commonColumns.map((_, idx) => `$${idx + 1}`).join(', ');
          
          await supabase.unsafe(`
            INSERT INTO "${tableName}" (${commonColumns.map(c => `"${c}"`).join(', ')})
            VALUES (${placeholders})
          `, cleanedValues);

          migratedCount++;

        } catch (rowError) {
          errorCount++;
          if (errorCount <= 3) { // Solo mostrar primeros 3 errores
            console.log(`    ❌ Error en registro ${i + 1}: ${rowError.message.slice(0, 100)}...`);
            
            // Mostrar valores problemáticos
            console.log(`    📋 Valores en registro ${i + 1}:`);
            for (const col of commonColumns.slice(0, 3)) {
              const value = row[col];
              console.log(`      ${col}: ${typeof value} = ${String(value).slice(0, 30)}...`);
            }
          }
        }
      }

      console.log(`    ✅ ${tableName}: ${migratedCount}/${neonCount.count} registros migrados`);
      
      if (errorCount > 0) {
        console.log(`    ⚠️  ${errorCount} registros con errores`);
      }

    } catch (tableError) {
      console.error(`    ❌ Error crítico en ${tableName}:`, tableError.message);
    }
    
    console.log('');
  }

  // Orden de migración simplificado (empezar con tablas más simples)
  const simpleTablesFirst = [
    'budget_categories',    // Tabla simple sin muchas fechas
    'users',               // Tabla fundamental
    'clients',             // Tabla simple
    'projects',            // Depende de users
    'authorization_matrix', // Después de users
    'lots',                // Depende de projects
    'permits',             // Depende de projects
    'budget_items',        // Depende de projects
    'wbs_items'            // Depende de projects
  ];

  try {
    console.log(`📊 Migrando ${simpleTablesFirst.length} tablas principales...\n`);

    for (const tableName of simpleTablesFirst) {
      await migrateTableRobust(tableName);
    }

    console.log('🎉 Migración robusta completada!');
    
    // Resumen final
    console.log('\n📈 RESUMEN FINAL:');
    for (const tableName of simpleTablesFirst) {
      try {
        const [count] = await supabase.unsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
        if (count.count > 0) {
          console.log(`✅ ${tableName}: ${count.count} registros`);
        }
      } catch (e) {
        // Ignorar errores de conteo
      }
    }

  } catch (error) {
    console.error('❌ Error crítico:', error);
  } finally {
    await neon.end();
    await supabase.end();
  }
}

migrateDataRobust();