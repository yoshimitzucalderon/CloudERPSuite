import { db } from "./db";
import { 
  projectTasks, 
  taskDependencies, 
  projectResources, 
  taskResourceAssignments,
  projectBaselines,
  workingCalendars,
  projectMilestones,
  earnedValueMetrics,
  type ProjectTask,
  type InsertProjectTask,
  type TaskDependency,
  type InsertTaskDependency,
  type ProjectResource,
  type InsertProjectResource,
  type TaskResourceAssignment,
  type InsertTaskResourceAssignment,
  type ProjectBaseline,
  type InsertProjectBaseline,
  type WorkingCalendar,
  type InsertWorkingCalendar,
  type ProjectMilestone,
  type InsertProjectMilestone,
  type EarnedValueMetric,
  type InsertEarnedValueMetric
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export class ProjectManagementService {
  
  // ==================== TASK MANAGEMENT ====================
  
  async createTask(taskData: InsertProjectTask): Promise<ProjectTask> {
    const [task] = await db.insert(projectTasks).values(taskData).returning();
    
    // Automatically update critical path after creating a task
    await this.calculateCriticalPath(taskData.projectId!);
    
    return task;
  }

  async getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    return await db.select()
      .from(projectTasks)
      .where(eq(projectTasks.projectId, projectId))
      .orderBy(projectTasks.wbsCode);
  }

  async updateTask(taskId: string, updates: Partial<ProjectTask>): Promise<ProjectTask> {
    const [task] = await db.update(projectTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectTasks.id, taskId))
      .returning();
    
    // Recalculate critical path if dates or duration changed
    if (updates.startDate || updates.endDate || updates.duration) {
      await this.calculateCriticalPath(task.projectId!);
    }
    
    return task;
  }

  async deleteTask(taskId: string): Promise<void> {
    // Get project ID before deletion
    const task = await db.select().from(projectTasks).where(eq(projectTasks.id, taskId)).limit(1);
    const projectId = task[0]?.projectId;
    
    await db.delete(projectTasks).where(eq(projectTasks.id, taskId));
    
    if (projectId) {
      await this.calculateCriticalPath(projectId);
    }
  }

  // ==================== DEPENDENCIES MANAGEMENT ====================

  async createDependency(dependencyData: InsertTaskDependency): Promise<TaskDependency> {
    // Validate no circular dependencies
    const hasCircularDependency = await this.checkCircularDependency(
      dependencyData.successorTaskId!, 
      dependencyData.predecessorTaskId!
    );
    
    if (hasCircularDependency) {
      throw new Error("Creating this dependency would result in a circular dependency");
    }
    
    const [dependency] = await db.insert(taskDependencies).values(dependencyData).returning();
    
    // Recalculate critical path and auto-schedule
    const successorTask = await db.select().from(projectTasks)
      .where(eq(projectTasks.id, dependencyData.successorTaskId!)).limit(1);
    
    if (successorTask[0]) {
      await this.calculateCriticalPath(successorTask[0].projectId!);
      await this.autoScheduleTasks(successorTask[0].projectId!);
    }
    
    return dependency;
  }

  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    return await db.select()
      .from(taskDependencies)
      .where(
        sql`${taskDependencies.predecessorTaskId} = ${taskId} OR ${taskDependencies.successorTaskId} = ${taskId}`
      );
  }

  async deleteDependency(dependencyId: string): Promise<void> {
    await db.delete(taskDependencies).where(eq(taskDependencies.id, dependencyId));
  }

  private async checkCircularDependency(startTaskId: string, targetTaskId: string): Promise<boolean> {
    const visited = new Set<string>();
    const stack = [startTaskId];
    
    while (stack.length > 0) {
      const currentTaskId = stack.pop()!;
      
      if (currentTaskId === targetTaskId) {
        return true;
      }
      
      if (visited.has(currentTaskId)) {
        continue;
      }
      
      visited.add(currentTaskId);
      
      const dependencies = await db.select()
        .from(taskDependencies)
        .where(eq(taskDependencies.predecessorTaskId, currentTaskId));
      
      for (const dependency of dependencies) {
        stack.push(dependency.successorTaskId!);
      }
    }
    
    return false;
  }

  // ==================== CRITICAL PATH METHOD ====================

  async calculateCriticalPath(projectId: string): Promise<void> {
    const tasks = await this.getProjectTasks(projectId);
    const dependencies = await db.select().from(taskDependencies)
      .innerJoin(projectTasks, eq(taskDependencies.predecessorTaskId, projectTasks.id))
      .where(eq(projectTasks.projectId, projectId));

    // Reset all tasks to not critical
    await db.update(projectTasks)
      .set({ isOnCriticalPath: false, totalFloat: 0 })
      .where(eq(projectTasks.projectId, projectId));

    // Forward pass - calculate Early Start and Early Finish
    const earlyDates = new Map<string, { earlyStart: Date, earlyFinish: Date }>();
    
    for (const task of tasks) {
      let earlyStart = task.startDate || new Date();
      
      // Find all predecessors
      const predecessors = dependencies.filter(dep => dep.task_dependencies.successorTaskId === task.id);
      
      for (const pred of predecessors) {
        const predTask = tasks.find(t => t.id === pred.task_dependencies.predecessorTaskId);
        if (predTask && earlyDates.has(predTask.id)) {
          const predEarlyFinish = earlyDates.get(predTask.id)!.earlyFinish;
          const adjustedDate = new Date(predEarlyFinish);
          adjustedDate.setDate(adjustedDate.getDate() + (pred.task_dependencies.leadLag || 0));
          
          if (adjustedDate > earlyStart) {
            earlyStart = adjustedDate;
          }
        }
      }
      
      const earlyFinish = new Date(earlyStart);
      earlyFinish.setDate(earlyFinish.getDate() + (task.duration || 1));
      
      earlyDates.set(task.id, { earlyStart, earlyFinish });
    }

    // Backward pass - calculate Late Start and Late Finish
    const lateDates = new Map<string, { lateStart: Date, lateFinish: Date }>();
    const projectEndDate = Math.max(...Array.from(earlyDates.values()).map(d => d.earlyFinish.getTime()));
    
    for (let i = tasks.length - 1; i >= 0; i--) {
      const task = tasks[i];
      let lateFinish = task.endDate || new Date(projectEndDate);
      
      // Find all successors
      const successors = dependencies.filter(dep => dep.task_dependencies.predecessorTaskId === task.id);
      
      for (const succ of successors) {
        const succTask = tasks.find(t => t.id === succ.task_dependencies.successorTaskId);
        if (succTask && lateDates.has(succTask.id)) {
          const succLateStart = lateDates.get(succTask.id)!.lateStart;
          const adjustedDate = new Date(succLateStart);
          adjustedDate.setDate(adjustedDate.getDate() - (succ.task_dependencies.leadLag || 0));
          
          if (adjustedDate < lateFinish) {
            lateFinish = adjustedDate;
          }
        }
      }
      
      const lateStart = new Date(lateFinish);
      lateStart.setDate(lateStart.getDate() - (task.duration || 1));
      
      lateDates.set(task.id, { lateStart, lateFinish });
    }

    // Calculate total float and identify critical path
    for (const task of tasks) {
      const early = earlyDates.get(task.id);
      const late = lateDates.get(task.id);
      
      if (early && late) {
        const totalFloat = Math.max(0, Math.floor((late.lateStart.getTime() - early.earlyStart.getTime()) / (1000 * 60 * 60 * 24)));
        const isOnCriticalPath = totalFloat === 0;
        
        await db.update(projectTasks)
          .set({ 
            totalFloat,
            isOnCriticalPath,
            startDate: early.earlyStart,
            endDate: early.earlyFinish
          })
          .where(eq(projectTasks.id, task.id));
      }
    }
  }

  // ==================== AUTO-SCHEDULING ====================

  async autoScheduleTasks(projectId: string): Promise<void> {
    const tasks = await this.getProjectTasks(projectId);
    const dependencies = await db.select().from(taskDependencies)
      .innerJoin(projectTasks, eq(taskDependencies.predecessorTaskId, projectTasks.id))
      .where(eq(projectTasks.projectId, projectId));

    // Sort tasks by dependencies (topological sort)
    const sortedTasks = this.topologicalSort(tasks, dependencies.map(d => d.task_dependencies));
    
    for (const task of sortedTasks) {
      let scheduledStart = task.startDate || new Date();
      
      // Find all predecessors and their finish dates
      const predecessors = dependencies.filter(dep => dep.task_dependencies.successorTaskId === task.id);
      
      for (const pred of predecessors) {
        const predTask = tasks.find(t => t.id === pred.task_dependencies.predecessorTaskId);
        if (predTask && predTask.endDate) {
          const predFinish = new Date(predTask.endDate);
          
          // Apply dependency type logic
          switch (pred.task_dependencies.dependencyType) {
            case 'FS': // Finish-to-Start (default)
              predFinish.setDate(predFinish.getDate() + (pred.task_dependencies.leadLag || 0));
              if (predFinish > scheduledStart) {
                scheduledStart = predFinish;
              }
              break;
            case 'SS': // Start-to-Start
              const predStart = new Date(predTask.startDate || predTask.endDate!);
              predStart.setDate(predStart.getDate() + (pred.task_dependencies.leadLag || 0));
              if (predStart > scheduledStart) {
                scheduledStart = predStart;
              }
              break;
            // Add FF and SF cases as needed
          }
        }
      }
      
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setDate(scheduledEnd.getDate() + (task.duration || 1));
      
      await db.update(projectTasks)
        .set({ 
          startDate: scheduledStart,
          endDate: scheduledEnd,
          updatedAt: new Date()
        })
        .where(eq(projectTasks.id, task.id));
    }
  }

  private topologicalSort(tasks: ProjectTask[], dependencies: TaskDependency[]): ProjectTask[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    
    // Initialize
    for (const task of tasks) {
      inDegree.set(task.id, 0);
      adjList.set(task.id, []);
    }
    
    // Build adjacency list and calculate in-degrees
    for (const dep of dependencies) {
      const pred = dep.predecessorTaskId!;
      const succ = dep.successorTaskId!;
      
      adjList.get(pred)?.push(succ);
      inDegree.set(succ, (inDegree.get(succ) || 0) + 1);
    }
    
    // Topological sort using Kahn's algorithm
    const queue = tasks.filter(task => inDegree.get(task.id) === 0);
    const result: ProjectTask[] = [];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      for (const neighbor of adjList.get(current.id) || []) {
        const newInDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newInDegree);
        
        if (newInDegree === 0) {
          const neighborTask = tasks.find(t => t.id === neighbor);
          if (neighborTask) queue.push(neighborTask);
        }
      }
    }
    
    return result;
  }

  // ==================== RESOURCES MANAGEMENT ====================

  async createResource(resourceData: InsertProjectResource): Promise<ProjectResource> {
    const [resource] = await db.insert(projectResources).values(resourceData).returning();
    return resource;
  }

  async getProjectResources(projectId: string): Promise<ProjectResource[]> {
    return await db.select()
      .from(projectResources)
      .where(eq(projectResources.projectId, projectId));
  }

  async assignResourceToTask(assignmentData: InsertTaskResourceAssignment): Promise<TaskResourceAssignment> {
    const [assignment] = await db.insert(taskResourceAssignments).values(assignmentData).returning();
    
    // Update task cost based on resource assignment
    await this.updateTaskCosts(assignmentData.taskId!);
    
    return assignment;
  }

  async updateTaskCosts(taskId: string): Promise<void> {
    const assignments = await db.select()
      .from(taskResourceAssignments)
      .innerJoin(projectResources, eq(taskResourceAssignments.resourceId, projectResources.id))
      .where(eq(taskResourceAssignments.taskId, taskId));

    let totalCost = 0;
    
    for (const assignment of assignments) {
      const resource = assignment.project_resources;
      const assign = assignment.task_resource_assignments;
      
      const cost = (parseFloat(assign.workHours?.toString() || "0") * parseFloat(resource.costPerHour?.toString() || "0")) ||
                   (parseFloat(assign.unitsAssigned?.toString() || "1") * parseFloat(resource.costPerDay?.toString() || "0"));
      
      totalCost += cost;
    }
    
    await db.update(projectTasks)
      .set({ estimatedCost: totalCost.toString() })
      .where(eq(projectTasks.id, taskId));
  }

  // ==================== BASELINES MANAGEMENT ====================

  async createBaseline(baselineData: InsertProjectBaseline): Promise<ProjectBaseline> {
    // Deactivate other baselines
    await db.update(projectBaselines)
      .set({ isActive: false })
      .where(eq(projectBaselines.projectId, baselineData.projectId!));

    const [baseline] = await db.insert(projectBaselines)
      .values({ ...baselineData, isActive: true })
      .returning();

    // Save current task data to baseline
    await this.saveTaskBaseline(baselineData.projectId!);
    
    return baseline;
  }

  private async saveTaskBaseline(projectId: string): Promise<void> {
    const tasks = await this.getProjectTasks(projectId);
    
    for (const task of tasks) {
      const baselineData = {
        startDate: task.startDate,
        endDate: task.endDate,
        duration: task.duration,
        estimatedCost: task.estimatedCost,
        savedAt: new Date()
      };
      
      await db.update(projectTasks)
        .set({ baseline: baselineData })
        .where(eq(projectTasks.id, task.id));
    }
  }

  // ==================== EARNED VALUE MANAGEMENT ====================

  async calculateEVM(projectId: string): Promise<EarnedValueMetric> {
    const tasks = await this.getProjectTasks(projectId);
    const activeBaseline = await db.select()
      .from(projectBaselines)
      .where(and(
        eq(projectBaselines.projectId, projectId),
        eq(projectBaselines.isActive, true)
      ))
      .limit(1);

    if (!activeBaseline[0]) {
      throw new Error("No active baseline found for project");
    }

    let plannedValue = 0;
    let earnedValue = 0;
    let actualCost = 0;
    const budgetAtCompletion = parseFloat(activeBaseline[0].totalCost?.toString() || "0");

    for (const task of tasks) {
      const taskPlannedValue = parseFloat(task.estimatedCost?.toString() || "0");
      const taskActualCost = parseFloat(task.actualCost?.toString() || "0");
      const percentComplete = task.percentComplete || 0;

      plannedValue += taskPlannedValue;
      earnedValue += (taskPlannedValue * percentComplete / 100);
      actualCost += taskActualCost;
    }

    // Calculate EVM metrics
    const schedulePerformanceIndex = plannedValue > 0 ? earnedValue / plannedValue : 1;
    const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 1;
    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - actualCost;
    const estimateAtCompletion = costPerformanceIndex > 0 ? budgetAtCompletion / costPerformanceIndex : budgetAtCompletion;

    const evmData: InsertEarnedValueMetric = {
      projectId,
      plannedValue: plannedValue.toString(),
      earnedValue: earnedValue.toString(),
      actualCost: actualCost.toString(),
      budgetAtCompletion: budgetAtCompletion.toString(),
      estimateAtCompletion: estimateAtCompletion.toString(),
      schedulePerformanceIndex: schedulePerformanceIndex.toString(),
      costPerformanceIndex: costPerformanceIndex.toString(),
      scheduleVariance: scheduleVariance.toString(),
      costVariance: costVariance.toString()
    };

    const [evm] = await db.insert(earnedValueMetrics).values(evmData).returning();
    return evm;
  }

  // ==================== MILESTONES MANAGEMENT ====================

  async createMilestone(milestoneData: InsertProjectMilestone): Promise<ProjectMilestone> {
    const [milestone] = await db.insert(projectMilestones).values(milestoneData).returning();
    return milestone;
  }

  async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    return await db.select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId))
      .orderBy(projectMilestones.targetDate);
  }

  async updateMilestoneStatus(milestoneId: string, status: string, actualDate?: Date): Promise<ProjectMilestone> {
    const updateData: any = { status };
    if (actualDate) {
      updateData.actualDate = actualDate;
    }

    const [milestone] = await db.update(projectMilestones)
      .set(updateData)
      .where(eq(projectMilestones.id, milestoneId))
      .returning();

    return milestone;
  }

  // ==================== WORKING CALENDARS ====================

  async createWorkingCalendar(calendarData: InsertWorkingCalendar): Promise<WorkingCalendar> {
    const [calendar] = await db.insert(workingCalendars).values(calendarData).returning();
    return calendar;
  }

  async getProjectCalendars(projectId: string): Promise<WorkingCalendar[]> {
    return await db.select()
      .from(workingCalendars)
      .where(eq(workingCalendars.projectId, projectId));
  }

  // ==================== PROJECT ANALYTICS ====================

  async getProjectAnalytics(projectId: string) {
    const tasks = await this.getProjectTasks(projectId);
    const milestones = await this.getProjectMilestones(projectId);
    const latestEVM = await db.select()
      .from(earnedValueMetrics)
      .where(eq(earnedValueMetrics.projectId, projectId))
      .orderBy(desc(earnedValueMetrics.reportDate))
      .limit(1);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => (t.percentComplete || 0) === 100).length;
    const criticalTasks = tasks.filter(t => t.isOnCriticalPath).length;
    const delayedTasks = tasks.filter(t => t.endDate && new Date(t.endDate) < new Date() && (t.percentComplete || 0) < 100).length;

    const milestoneStats = {
      total: milestones.length,
      achieved: milestones.filter(m => m.status === 'achieved').length,
      delayed: milestones.filter(m => m.status === 'delayed').length,
      pending: milestones.filter(m => m.status === 'pending').length
    };

    return {
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: totalTasks - completedTasks,
        critical: criticalTasks,
        delayed: delayedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      },
      milestoneStats,
      earnedValue: latestEVM[0] || null,
      criticalPath: tasks.filter(t => t.isOnCriticalPath).sort((a, b) => a.wbsCode.localeCompare(b.wbsCode))
    };
  }
}

export const projectManagementService = new ProjectManagementService();