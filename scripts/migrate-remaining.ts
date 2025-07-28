import postgres from 'postgres';
import { config } from 'dotenv';

config();

async function migrateRemainingTables() {
  console.log('🚀 Migrando tablas restantes...');

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

  // Tablas restantes (las que tenían datos o podrían tener datos)
  const remainingTables = [
    'documents',
    'authorization_steps', 
    'authorization_workflows',
    'workflow_steps',
    'workflow_notifications',
    'authority_delegations',
    'calendar_events',
    'investors',
    'capital_calls',
    'capital_call_items',
    'sales_contracts',
    'task_dependencies'
  ];

  function cleanDateValue(value: any, columnName: string, tableName: string): any {
    if (value === null || value === undefined) return null;
    
    const dateFields = ['created_at', 'updated_at', 'start_date', 'end_date', 'due_date', 
                       'birth_date', 'call_date', 'contract_date', 'paid_date', 'issued_date', 
                       'expiry_date', 'submission_date', 'approval_date', 'completion_date'];
    
    const isDateField = dateFields.some(field => columnName.toLowerCase().includes(field.toLowerCase())) ||
                       columnName.toLowerCase().includes('date') ||
                       columnName.toLowerCase().includes('time');

    if (isDateField) {
      try {
        if (value instanceof Date) {
          if (isNaN(value.getTime())) return null;
          return value.toISOString();
        }
        
        if (typeof value === 'string') {
          let cleanString = value.trim();
          if (cleanString === '' || cleanString === 'Invalid Date' || cleanString === 'null') {
            return null;
          }
          
          const parsed = new Date(cleanString);
          if (isNaN(parsed.getTime())) return null;
          return parsed.toISOString();
        }
        
        if (typeof value === 'number') {
          const date = new Date(value);
          if (isNaN(date.getTime())) return null;
          return date.toISOString();
        }
        
        const attemptDate = new Date(value);
        if (isNaN(attemptDate.getTime())) return null;
        return attemptDate.toISOString();
        
      } catch (error) {
        return null;
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value);
      } catch (jsonError) {
        return null;
      }
    }
    
    return value;
  }

  async function getTableColumns(db: any, tableName: string) {
    try {
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
    } catch (error) {
      return [];
    }
  }

  async function migrateTable(tableName: string) {
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

      if (!neonExists[0].exists) {
        console.log(`    ⚠️  Tabla no existe en Neon`);
        return;
      }

      if (!supabaseExists[0].exists) {
        console.log(`    ⚠️  Tabla no existe en Supabase`);
        return;
      }

      // Obtener esquemas
      const neonColumns = await getTableColumns(neon, tableName);
      const supabaseColumns = await getTableColumns(supabase, tableName);
      
      if (neonColumns.length === 0 || supabaseColumns.length === 0) {
        console.log(`    ⚠️  No se pudieron obtener columnas`);
        return;
      }

      const commonColumns = neonColumns
        .map(c => c.name)
        .filter(col => supabaseColumns.some(sc => sc.name === col));

      if (commonColumns.length === 0) {
        console.log(`    ⚠️  No hay columnas comunes`);
        return;
      }

      // Contar registros
      const [neonCount] = await neon.unsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);

      if (neonCount.count === 0) {
        console.log(`    ⚪ tabla vacía`);
        return;
      }

      console.log(`    📊 ${neonCount.count} registros en Neon`);
      console.log(`    🔗 ${commonColumns.length} columnas comunes`);

      // Obtener datos
      const columnsList = commonColumns.map(c => `"${c}"`).join(', ');
      const data = await neon.unsafe(`SELECT ${columnsList} FROM "${tableName}"`);

      if (data.length === 0) return;

      // Limpiar tabla destino
      await supabase.unsafe(`DELETE FROM "${tableName}"`);

      // Migrar registro por registro
      let migratedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          const cleanedValues = commonColumns.map(col => {
            return cleanDateValue(row[col], col, tableName);
          });

          const placeholders = commonColumns.map((_, idx) => `$${idx + 1}`).join(', ');
          
          await supabase.unsafe(`
            INSERT INTO "${tableName}" (${commonColumns.map(c => `"${c}"`).join(', ')})
            VALUES (${placeholders})
          `, cleanedValues);

          migratedCount++;

        } catch (rowError) {
          errorCount++;
          if (errorCount <= 2) { // Mostrar solo primeros 2 errores
            console.log(`    ❌ Error en registro ${i + 1}: ${rowError.message.slice(0, 80)}...`);
          }
        }
      }

      console.log(`    ✅ ${tableName}: ${migratedCount}/${neonCount.count} registros migrados`);
      
      if (errorCount > 0) {
        console.log(`    ⚠️  ${errorCount} registros con errores`);
      }

    } catch (tableError) {
      console.error(`    ❌ Error crítico en ${tableName}:`, tableError.message.slice(0, 100));
    }
    
    console.log('');
  }

  try {
    console.log(`📊 Procesando ${remainingTables.length} tablas restantes...\n`);

    for (const tableName of remainingTables) {
      await migrateTable(tableName);
    }

    console.log('🎉 Migración de tablas restantes completada!');
    
    // Resumen general
    console.log('\n📈 RESUMEN FINAL DE TODAS LAS TABLAS:');
    const allTables = [
      'budget_categories', 'users', 'clients', 'projects', 'authorization_matrix',
      'lots', 'permits', 'budget_items', 'wbs_items', ...remainingTables
    ];

    let totalRecords = 0;
    for (const tableName of allTables) {
      try {
        const [count] = await supabase.unsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
        if (count.count > 0) {
          console.log(`✅ ${tableName}: ${count.count} registros`);
          totalRecords += count.count;
        }
      } catch (e) {
        // Tabla no existe, ignorar
      }
    }
    
    console.log(`\n🎯 TOTAL GENERAL: ${totalRecords} registros migrados`);

  } catch (error) {
    console.error('❌ Error crítico:', error);
  } finally {
    await neon.end();
    await supabase.end();
  }
}

migrateRemainingTables();