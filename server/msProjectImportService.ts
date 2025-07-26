import { XMLParser } from 'fast-xml-parser';
import AdmZip from 'adm-zip';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { 
  msProjectImports, 
  projectTasks, 
  projectResources, 
  projectMilestones,
  taskDependencies,
  taskResourceAssignments,
  projects
} from '@shared/schema';
import { eq } from 'drizzle-orm';

interface MSProjectTask {
  UID: string;
  ID: number;
  Name: string;
  Start?: string;
  Finish?: string;
  Duration?: string;
  PercentComplete?: number;
  Priority?: number;
  OutlineLevel?: number;
  WBS?: string;
  Notes?: string;
  Cost?: number;
  Work?: number;
  ActualCost?: number;
  ActualWork?: number;
  IsMilestone?: boolean;
  IsCritical?: boolean;
  PredecessorLink?: Array<{
    PredecessorUID: string;
    Type: number; // 0=FF, 1=FS, 2=SF, 3=SS
    LinkLag?: number;
  }>;
  ResourceAssignment?: Array<{
    ResourceUID: string;
    Units?: number;
    Work?: number;
    Cost?: number;
  }>;
}

interface MSProjectResource {
  UID: string;
  ID: number;
  Name: string;
  Type?: number; // 0=Material, 1=Work
  StandardRate?: number;
  OvertimeRate?: number;
  MaxUnits?: number;
  AccrueAt?: number;
  Cost?: number;
}

interface MSProjectCalendar {
  UID: string;
  Name: string;
  IsBaseCalendar?: boolean;
  WorkWeek?: {
    WorkingDays: number[];
    WorkingTimes: Array<{
      FromTime: string;
      ToTime: string;
    }>;
  };
}

export class MSProjectImportService {
  private parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    trimValues: true,
    parseTagValue: true,
    parseTrueNumberOnly: false,
    arrayMode: false,
    allowBooleanAttributes: true,
  });

  async importMSProjectFile(
    filePath: string,
    projectId: string,
    importedBy: string,
    fileName: string
  ): Promise<string> {
    // Create import record
    const [importRecord] = await db.insert(msProjectImports).values({
      projectId,
      fileName,
      filePath,
      fileSize: fs.statSync(filePath).size,
      importedBy,
      importStatus: 'procesando',
      msProjectFileType: path.extname(fileName).toLowerCase(),
    }).returning();

    try {
      let xmlContent: string;
      const fileExtension = path.extname(fileName).toLowerCase();

      // Handle different file types
      if (fileExtension === '.mpp') {
        // .mpp files are compressed containers, extract XML
        xmlContent = await this.extractXmlFromMpp(filePath);
      } else if (fileExtension === '.xml') {
        // Direct XML file
        xmlContent = fs.readFileSync(filePath, 'utf-8');
      } else {
        throw new Error(`Tipo de archivo no soportado: ${fileExtension}`);
      }

      // Parse XML content
      const projectData = this.parser.parse(xmlContent);
      const msProject = projectData.Project;

      if (!msProject) {
        throw new Error('Archivo XML no válido: No se encontró elemento Project');
      }

      // Import data
      const importStats = await this.importProjectData(msProject, projectId, importRecord.id);

      // Update import record with success
      await db.update(msProjectImports)
        .set({
          importStatus: 'completado',
          tasksImported: importStats.tasksImported,
          resourcesImported: importStats.resourcesImported,
          milestonesImported: importStats.milestonesImported,
          msProjectVersion: msProject.SaveVersion || 'Desconocida',
          updatedAt: new Date(),
        })
        .where(eq(msProjectImports.id, importRecord.id));

      return importRecord.id;

    } catch (error) {
      // Update import record with error
      await db.update(msProjectImports)
        .set({
          importStatus: 'error',
          errorLog: error instanceof Error ? error.message : 'Error desconocido',
          updatedAt: new Date(),
        })
        .where(eq(msProjectImports.id, importRecord.id));

      throw error;
    }
  }

  private async extractXmlFromMpp(filePath: string): Promise<string> {
    try {
      // Try to extract as ZIP first (newer .mpp format)
      const zip = new JSZip();
      const data = fs.readFileSync(filePath);
      const zipFile = await zip.loadAsync(data);
      
      // Look for project.xml or similar XML file
      const xmlFiles = Object.keys(zipFile.files).filter(name => 
        name.endsWith('.xml') && (
          name.includes('project') || 
          name.includes('Project') ||
          name === 'project.xml'
        )
      );

      if (xmlFiles.length > 0) {
        const xmlContent = await zipFile.files[xmlFiles[0]].async('text');
        return xmlContent;
      }

      // Try ADM-ZIP as fallback
      const admZip = new AdmZip(filePath);
      const entries = admZip.getEntries();
      
      for (const entry of entries) {
        if (entry.entryName.endsWith('.xml')) {
          return entry.getData().toString('utf8');
        }
      }

      throw new Error('No se encontró archivo XML dentro del archivo .mpp');

    } catch (error) {
      throw new Error(`Error al extraer XML del archivo .mpp: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  private async importProjectData(
    msProject: any,
    projectId: string,
    importId: string
  ): Promise<{ tasksImported: number; resourcesImported: number; milestonesImported: number }> {
    let tasksImported = 0;
    let resourcesImported = 0;
    let milestonesImported = 0;

    // Import Resources first
    if (msProject.Resources && msProject.Resources.Resource) {
      const resources = Array.isArray(msProject.Resources.Resource) 
        ? msProject.Resources.Resource 
        : [msProject.Resources.Resource];

      for (const resource of resources) {
        await this.importResource(resource, projectId);
        resourcesImported++;
      }
    }

    // Import Tasks
    if (msProject.Tasks && msProject.Tasks.Task) {
      const tasks = Array.isArray(msProject.Tasks.Task) 
        ? msProject.Tasks.Task 
        : [msProject.Tasks.Task];

      // First pass: Create all tasks
      for (const task of tasks) {
        const imported = await this.importTask(task, projectId);
        if (imported && imported.isMilestone) {
          milestonesImported++;
        } else {
          tasksImported++;
        }
      }

      // Second pass: Create dependencies
      for (const task of tasks) {
        if (task.PredecessorLink) {
          await this.importTaskDependencies(task, projectId);
        }
      }

      // Third pass: Create resource assignments
      if (msProject.Assignments && msProject.Assignments.Assignment) {
        const assignments = Array.isArray(msProject.Assignments.Assignment)
          ? msProject.Assignments.Assignment
          : [msProject.Assignments.Assignment];

        for (const assignment of assignments) {
          await this.importResourceAssignment(assignment, projectId);
        }
      }
    }

    return { tasksImported, resourcesImported, milestonesImported };
  }

  private async importResource(resource: any, projectId: string) {
    const resourceType = this.determineResourceType(resource.Type);
    const standardRate = this.parseDecimal(resource.StandardRate);
    
    await db.insert(projectResources).values({
      projectId,
      resourceName: resource.Name || `Recurso ${resource.ID}`,
      resourceType,
      costPerHour: standardRate,
      costPerDay: standardRate ? standardRate * 8 : undefined, // Assuming 8-hour workday
      maxUnitsAvailable: this.parseDecimal(resource.MaxUnits) || 1,
      isActive: true,
    });
  }

  private async importTask(task: any, projectId: string) {
    const isMilestone = task.Milestone === true || task.IsMilestone === true;
    const startDate = task.Start ? new Date(task.Start) : null;
    const finishDate = task.Finish ? new Date(task.Finish) : null;
    
    // Calculate duration in days
    let duration = 0;
    if (task.Duration) {
      // Parse MS Project duration format (e.g., "PT8H0M0S" or "P5D")
      duration = this.parseDuration(task.Duration);
    } else if (startDate && finishDate) {
      duration = Math.ceil((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const [insertedTask] = await db.insert(projectTasks).values({
      projectId,
      wbsCode: task.WBS || `${task.OutlineLevel || 1}.${task.ID}`,
      taskName: task.Name || `Tarea ${task.ID}`,
      description: task.Notes || '',
      startDate,
      endDate: finishDate,
      duration,
      percentComplete: task.PercentComplete || 0,
      priority: this.mapPriority(task.Priority),
      taskType: isMilestone ? 'milestone' : 'task',
      isOnCriticalPath: task.Critical === true || task.IsCritical === true,
      estimatedCost: this.parseDecimal(task.Cost),
      actualCost: this.parseDecimal(task.ActualCost),
      notes: task.Notes || '',
    }).returning();

    // Create milestone if needed
    if (isMilestone) {
      await db.insert(projectMilestones).values({
        projectId,
        milestoneName: task.Name || `Hito ${task.ID}`,
        description: task.Notes || '',
        targetDate: finishDate,
        status: task.PercentComplete >= 100 ? 'achieved' : 'pending',
      });
    }

    return { taskId: insertedTask.id, isMilestone };
  }

  private async importTaskDependencies(task: any, projectId: string) {
    if (!task.PredecessorLink) return;

    const predecessorLinks = Array.isArray(task.PredecessorLink) 
      ? task.PredecessorLink 
      : [task.PredecessorLink];

    for (const link of predecessorLinks) {
      // Find tasks by task name (since we removed msProjectId)
      const [predecessorTask] = await db.select()
        .from(projectTasks)
        .where(eq(projectTasks.taskName, task.Name || ''));

      const [successorTask] = await db.select()
        .from(projectTasks)
        .where(eq(projectTasks.taskName, task.Name || ''));

      if (predecessorTask && successorTask) {
        await db.insert(taskDependencies).values({
          predecessorTaskId: predecessorTask.id,
          successorTaskId: successorTask.id,
          dependencyType: this.mapDependencyType(link.Type),
          leadLag: link.LinkLag || 0,
        });
      }
    }
  }

  private async importResourceAssignment(assignment: any, projectId: string) {
    // For now, skip resource assignments as we need to match by name
    // This would require a more sophisticated mapping system
    return;
  }

  // Utility methods
  private determineResourceType(msType: number): 'human' | 'equipment' | 'material' {
    switch (msType) {
      case 0: return 'material';
      case 1: return 'human';
      default: return 'equipment';
    }
  }

  private parseDuration(duration: string): number {
    // Parse MS Project duration formats
    if (duration.includes('PT')) {
      // Format: PT8H0M0S (8 hours)
      const hours = duration.match(/(\d+)H/)?.[1] || '0';
      return Math.ceil(parseInt(hours) / 8); // Convert to days
    } else if (duration.includes('P') && duration.includes('D')) {
      // Format: P5D (5 days)
      const days = duration.match(/(\d+)D/)?.[1] || '0';
      return parseInt(days);
    }
    return 1; // Default to 1 day
  }

  private mapPriority(msPriority: number): 'low' | 'normal' | 'high' | 'critical' {
    if (msPriority >= 800) return 'critical';
    if (msPriority >= 600) return 'high';
    if (msPriority >= 400) return 'normal';
    return 'low';
  }

  private mapDependencyType(msType: number): 'FS' | 'SS' | 'FF' | 'SF' {
    switch (msType) {
      case 0: return 'FF'; // Finish-to-Finish
      case 1: return 'FS'; // Finish-to-Start
      case 2: return 'SF'; // Start-to-Finish
      case 3: return 'SS'; // Start-to-Start
      default: return 'FS';
    }
  }

  private parseDecimal(value: any): number | undefined {
    if (value === null || value === undefined) return undefined;
    const num = parseFloat(value.toString());
    return isNaN(num) ? undefined : num;
  }

  // Get import history for a project
  async getImportHistory(projectId: string) {
    return await db.select()
      .from(msProjectImports)
      .where(eq(msProjectImports.projectId, projectId))
      .orderBy(msProjectImports.createdAt);
  }

  // Get import details
  async getImportDetails(importId: string) {
    const [importRecord] = await db.select()
      .from(msProjectImports)
      .where(eq(msProjectImports.id, importId));

    return importRecord;
  }

  // Validate MS Project file before import
  async validateMSProjectFile(filePath: string): Promise<{ 
    isValid: boolean; 
    version?: string; 
    taskCount?: number; 
    resourceCount?: number; 
    error?: string 
  }> {
    try {
      let xmlContent: string;
      const fileExtension = path.extname(filePath).toLowerCase();

      if (fileExtension === '.mpp') {
        xmlContent = await this.extractXmlFromMpp(filePath);
      } else if (fileExtension === '.xml') {
        xmlContent = fs.readFileSync(filePath, 'utf-8');
      } else {
        return { isValid: false, error: 'Tipo de archivo no soportado' };
      }

      const projectData = this.parser.parse(xmlContent);
      const msProject = projectData.Project;

      if (!msProject) {
        return { isValid: false, error: 'Archivo XML no válido' };
      }

      const taskCount = msProject.Tasks?.Task ? 
        (Array.isArray(msProject.Tasks.Task) ? msProject.Tasks.Task.length : 1) : 0;
      
      const resourceCount = msProject.Resources?.Resource ? 
        (Array.isArray(msProject.Resources.Resource) ? msProject.Resources.Resource.length : 1) : 0;

      return {
        isValid: true,
        version: msProject.SaveVersion || 'Desconocida',
        taskCount,
        resourceCount,
      };

    } catch (error) {
      return { isValid: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}

export const msProjectImportService = new MSProjectImportService();