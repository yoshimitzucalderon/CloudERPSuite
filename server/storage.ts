import {
  users,
  projects,
  permits,
  budgetCategories,
  budgetItems,
  documents,
  calendarEvents,
  wbsItems,
  lots,
  clients,
  salesContracts,
  authorizationWorkflows,
  authorizationSteps,
  authorizationMatrix,
  workflowSteps,
  authorityDelegations,
  workflowNotifications,
  escalationRecords,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Permit,
  type InsertPermit,
  type BudgetCategory,
  type InsertBudgetCategory,
  type BudgetItem,
  type InsertBudgetItem,
  type Document,
  type InsertDocument,
  type CalendarEvent,
  type InsertCalendarEvent,
  type WbsItem,
  type InsertWbsItem,
  type Lot,
  type InsertLot,
  type Client,
  type InsertClient,
  type SalesContract,
  type InsertSalesContract,
  type AuthorizationWorkflow,
  type InsertAuthorizationWorkflow,
  type AuthorizationStep,
  type InsertAuthorizationStep,
  type AuthorizationMatrix,
  type InsertAuthorizationMatrix,
  type WorkflowStep,
  type InsertWorkflowStep,
  type AuthorityDelegation,
  type InsertAuthorityDelegation,
  type WorkflowNotification,
  type InsertWorkflowNotification,
  type EscalationRecord,
  type InsertEscalationRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum, sql, or, isNull, lte, gte } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Permit operations
  getPermits(projectId?: string): Promise<Permit[]>;
  getPermit(id: string): Promise<Permit | undefined>;
  createPermit(permit: InsertPermit): Promise<Permit>;
  updatePermit(id: string, permit: Partial<InsertPermit>): Promise<Permit | undefined>;
  deletePermit(id: string): Promise<boolean>;
  
  // Budget operations
  getBudgetCategories(): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  getBudgetItems(projectId: string): Promise<BudgetItem[]>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItem(id: string, item: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined>;
  
  // Document operations
  getDocuments(projectId?: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Calendar operations
  getCalendarEvents(projectId?: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;

  // WBS operations for project management
  getWbsItemsByProject(projectId: string): Promise<WbsItem[]>;
  createWbsItem(item: InsertWbsItem): Promise<WbsItem>;
  updateWbsItem(id: string, item: Partial<InsertWbsItem>): Promise<WbsItem | undefined>;

  // Commercial management operations
  getLotsByProject(projectId: string): Promise<Lot[]>;
  createLot(lot: InsertLot): Promise<Lot>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  getSalesContractsByProject(projectId: string): Promise<SalesContract[]>;
  createSalesContract(contract: InsertSalesContract): Promise<SalesContract>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    activeProjects: number;
    totalBudget: string;
    pendingPermits: number;
    criticalActivities: CalendarEvent[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({
        ...project,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...project,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Permit operations
  async getPermits(projectId?: string): Promise<Permit[]> {
    if (projectId) {
      return await db.select().from(permits).where(eq(permits.projectId, projectId));
    }
    return await db.select().from(permits).orderBy(desc(permits.createdAt));
  }

  async getPermit(id: string): Promise<Permit | undefined> {
    const [permit] = await db.select().from(permits).where(eq(permits.id, id));
    return permit;
  }

  async createPermit(permit: InsertPermit): Promise<Permit> {
    const [newPermit] = await db
      .insert(permits)
      .values({
        ...permit,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newPermit;
  }

  async updatePermit(id: string, permit: Partial<InsertPermit>): Promise<Permit | undefined> {
    const [updatedPermit] = await db
      .update(permits)
      .set({
        ...permit,
        updatedAt: new Date(),
      })
      .where(eq(permits.id, id))
      .returning();
    return updatedPermit;
  }

  async deletePermit(id: string): Promise<boolean> {
    const result = await db.delete(permits).where(eq(permits.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Budget operations
  async getBudgetCategories(): Promise<BudgetCategory[]> {
    const result = await db.select().from(budgetCategories);
    return result as BudgetCategory[];
  }

  async createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory> {
    const [newCategory] = await db
      .insert(budgetCategories)
      .values({
        ...category,
        createdAt: new Date(),
      })
      .returning();
    return newCategory;
  }

  async getBudgetItems(projectId: string): Promise<BudgetItem[]> {
    return await db.select().from(budgetItems).where(eq(budgetItems.projectId, projectId));
  }

  async createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem> {
    const [newItem] = await db
      .insert(budgetItems)
      .values({
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newItem;
  }

  async updateBudgetItem(id: string, item: Partial<InsertBudgetItem>): Promise<BudgetItem | undefined> {
    const [updatedItem] = await db
      .update(budgetItems)
      .set({
        ...item,
        updatedAt: new Date(),
      })
      .where(eq(budgetItems.id, id))
      .returning();
    return updatedItem;
  }

  // Document operations
  async getDocuments(projectId?: string): Promise<Document[]> {
    if (projectId) {
      return await db.select().from(documents).where(eq(documents.projectId, projectId));
    }
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values({
        ...document,
        createdAt: new Date(),
      })
      .returning();
    return newDocument;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Calendar operations
  async getCalendarEvents(projectId?: string): Promise<CalendarEvent[]> {
    if (projectId) {
      return await db.select().from(calendarEvents).where(eq(calendarEvents.projectId, projectId));
    }
    return await db.select().from(calendarEvents).orderBy(desc(calendarEvents.startDate));
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db
      .insert(calendarEvents)
      .values({
        ...event,
        createdAt: new Date(),
      })
      .returning();
    return newEvent;
  }

  async updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const [updatedEvent] = await db
      .update(calendarEvents)
      .set(event)
      .where(eq(calendarEvents.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    activeProjects: number;
    totalBudget: string;
    pendingPermits: number;
    criticalActivities: CalendarEvent[];
  }> {
    // Count active projects
    const [activeProjectsResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(sql`${projects.status} != 'entrega'`);

    // Sum total budget
    const [budgetResult] = await db
      .select({ total: sum(projects.totalBudget) })
      .from(projects)
      .where(sql`${projects.status} != 'entrega'`);

    // Count pending permits
    const [pendingPermitsResult] = await db
      .select({ count: count() })
      .from(permits)
      .where(eq(permits.status, 'pendiente'));

    // Get critical activities (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const criticalActivities = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          sql`${calendarEvents.startDate} >= NOW()`,
          sql`${calendarEvents.startDate} <= ${nextWeek}`
        )
      )
      .orderBy(calendarEvents.startDate)
      .limit(5);

    return {
      activeProjects: activeProjectsResult.count,
      totalBudget: budgetResult.total || "0",
      pendingPermits: pendingPermitsResult.count,
      criticalActivities,
    };
  }

  // WBS operations for project management
  async getWbsItemsByProject(projectId: string): Promise<WbsItem[]> {
    return await db
      .select()
      .from(wbsItems)
      .where(eq(wbsItems.projectId, projectId))
      .orderBy(wbsItems.wbsCode);
  }

  async createWbsItem(item: InsertWbsItem): Promise<WbsItem> {
    const [newItem] = await db
      .insert(wbsItems)
      .values({
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newItem;
  }

  async updateWbsItem(id: string, item: Partial<InsertWbsItem>): Promise<WbsItem | undefined> {
    const [updatedItem] = await db
      .update(wbsItems)
      .set({
        ...item,
        updatedAt: new Date(),
      })
      .where(eq(wbsItems.id, id))
      .returning();
    return updatedItem;
  }

  // Commercial management operations
  async getLotsByProject(projectId: string): Promise<Lot[]> {
    return await db
      .select()
      .from(lots)
      .where(eq(lots.projectId, projectId))
      .orderBy(lots.lotNumber);
  }

  async createLot(lot: InsertLot): Promise<Lot> {
    const [newLot] = await db
      .insert(lots)
      .values({
        ...lot,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newLot;
  }

  async getClients(): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .orderBy(clients.lastName, clients.firstName);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values({
        ...client,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newClient;
  }

  async getSalesContractsByProject(projectId: string): Promise<SalesContract[]> {
    return await db
      .select()
      .from(salesContracts)
      .where(eq(salesContracts.projectId, projectId))
      .orderBy(salesContracts.createdAt);
  }

  async createSalesContract(contract: InsertSalesContract): Promise<SalesContract> {
    const [newContract] = await db
      .insert(salesContracts)
      .values({
        ...contract,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newContract;
  }

  // Authorization workflows
  async getAuthorizationWorkflows(projectId?: string): Promise<AuthorizationWorkflow[]> {
    if (projectId) {
      return await db
        .select()
        .from(authorizationWorkflows)
        .where(eq(authorizationWorkflows.projectId, projectId))
        .orderBy(authorizationWorkflows.createdAt);
    }
    return await db
      .select()
      .from(authorizationWorkflows)
      .orderBy(authorizationWorkflows.createdAt);
  }

  async createAuthorizationWorkflow(workflow: InsertAuthorizationWorkflow): Promise<AuthorizationWorkflow> {
    const [newWorkflow] = await db
      .insert(authorizationWorkflows)
      .values({
        ...workflow,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newWorkflow;
  }

  async updateAuthorizationWorkflow(id: string, workflow: Partial<InsertAuthorizationWorkflow>): Promise<AuthorizationWorkflow | undefined> {
    const [updatedWorkflow] = await db
      .update(authorizationWorkflows)
      .set({
        ...workflow,
        updatedAt: new Date(),
      })
      .where(eq(authorizationWorkflows.id, id))
      .returning();
    return updatedWorkflow;
  }

  async getAuthorizationSteps(workflowId: string): Promise<AuthorizationStep[]> {
    return await db
      .select()
      .from(authorizationSteps)
      .where(eq(authorizationSteps.workflowId, workflowId))
      .orderBy(authorizationSteps.timestamp);
  }

  async createAuthorizationStep(step: InsertAuthorizationStep): Promise<AuthorizationStep> {
    const [newStep] = await db
      .insert(authorizationSteps)
      .values({
        ...step,
        timestamp: new Date(),
      })
      .returning();
    return newStep;
  }

  // Authorization Matrix Management

  // Advanced Multi-level Authorization System
  async getAuthorizationMatrix(): Promise<AuthorizationMatrix[]> {
    return await db
      .select()
      .from(authorizationMatrix)
      .where(eq(authorizationMatrix.isActive, true))
      .orderBy(authorizationMatrix.workflowType, authorizationMatrix.minAmount);
  }

  // Escalation System Functions
  async getPendingWorkflowsForEscalation(): Promise<any[]> {
    return await db
      .select()
      .from(authorizationWorkflows)
      .where(
        and(
          eq(authorizationWorkflows.status, 'pendiente'),
          isNull(authorizationWorkflows.approvedAt),
          isNull(authorizationWorkflows.rejectedAt)
        )
      )
      .orderBy(authorizationWorkflows.createdAt);
  }

  async createEscalationRecord(record: InsertEscalationRecord): Promise<EscalationRecord> {
    const [newRecord] = await db
      .insert(escalationRecords)
      .values({
        ...record,
        createdAt: new Date(),
      })
      .returning();
    return newRecord;
  }

  async getNotificationByWorkflowAndType(workflowId: string, type: string, hours: number): Promise<WorkflowNotification | undefined> {
    const [notification] = await db
      .select()
      .from(workflowNotifications)
      .where(
        and(
          eq(workflowNotifications.workflowId, workflowId),
          eq(workflowNotifications.notificationType, type),
          sql`CAST(${workflowNotifications.metadata}->>'hours' AS INTEGER) = ${hours}`
        )
      );
    return notification;
  }

  async getEscalationByWorkflowAndType(workflowId: string, type: string): Promise<EscalationRecord | undefined> {
    const [escalation] = await db
      .select()
      .from(escalationRecords)
      .where(
        and(
          eq(escalationRecords.workflowId, workflowId),
          eq(escalationRecords.escalationType, type)
        )
      );
    return escalation;
  }

  async getUsersByRole(roles: string[]): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(sql`${users.role} = ANY(${roles})`);
  }

  async getEscalationStatistics(): Promise<any> {
    const totalEscalations = await db
      .select({ count: count() })
      .from(escalationRecords);
    
    const escalationsByType = await db
      .select({
        type: escalationRecords.escalationType,
        count: count()
      })
      .from(escalationRecords)
      .groupBy(escalationRecords.escalationType);

    return {
      total: totalEscalations[0]?.count || 0,
      byType: escalationsByType,
    };
  }

  async getWorkflowsNearEscalation(): Promise<any[]> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(authorizationWorkflows)
      .where(
        and(
          eq(authorizationWorkflows.status, 'pendiente'),
          lte(authorizationWorkflows.createdAt, sixHoursAgo),
          isNull(authorizationWorkflows.approvedAt),
          isNull(authorizationWorkflows.rejectedAt)
        )
      )
      .orderBy(authorizationWorkflows.createdAt);
  }

  async createAuthorizationMatrix(matrix: InsertAuthorizationMatrix): Promise<AuthorizationMatrix> {
    const [newMatrix] = await db
      .insert(authorizationMatrix)
      .values({
        ...matrix,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newMatrix;
  }

  async updateAuthorizationMatrix(id: string, matrix: Partial<InsertAuthorizationMatrix>): Promise<AuthorizationMatrix | undefined> {
    const [updatedMatrix] = await db
      .update(authorizationMatrix)
      .set({
        ...matrix,
        updatedAt: new Date(),
      })
      .where(eq(authorizationMatrix.id, id))
      .returning();
    return updatedMatrix;
  }

  // Multi-level Workflow Steps
  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    return await db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId))
      .orderBy(workflowSteps.stepOrder);
  }

  async createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep> {
    const [newStep] = await db
      .insert(workflowSteps)
      .values({
        ...step,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newStep;
  }

  async updateWorkflowStep(id: string, step: Partial<InsertWorkflowStep>): Promise<WorkflowStep | undefined> {
    const [updatedStep] = await db
      .update(workflowSteps)
      .set({
        ...step,
        updatedAt: new Date(),
      })
      .where(eq(workflowSteps.id, id))
      .returning();
    return updatedStep;
  }

  // Authority Delegation Management
  async getActiveAuthorityDelegations(delegateId?: string): Promise<AuthorityDelegation[]> {
    const now = new Date();
    let query = db
      .select()
      .from(authorityDelegations)
      .where(
        and(
          eq(authorityDelegations.isActive, true),
          lte(authorityDelegations.validFrom, now),
          gte(authorityDelegations.validUntil, now)
        )
      );

    if (delegateId) {
      query = query.where(eq(authorityDelegations.delegateId, delegateId));
    }

    return await query.orderBy(authorityDelegations.validFrom);
  }

  async createAuthorityDelegation(delegation: InsertAuthorityDelegation): Promise<AuthorityDelegation> {
    const [newDelegation] = await db
      .insert(authorityDelegations)
      .values({
        ...delegation,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newDelegation;
  }

  async revokeAuthorityDelegation(id: string): Promise<AuthorityDelegation | undefined> {
    const [revokedDelegation] = await db
      .update(authorityDelegations)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(authorityDelegations.id, id))
      .returning();
    return revokedDelegation;
  }

  // Workflow Notifications
  async getWorkflowNotifications(recipientId: string, unreadOnly = false): Promise<WorkflowNotification[]> {
    let query = db
      .select()
      .from(workflowNotifications)
      .where(
        and(
          eq(workflowNotifications.recipientId, recipientId),
          eq(workflowNotifications.isActive, true)
        )
      );

    if (unreadOnly) {
      query = query.where(isNull(workflowNotifications.readAt));
    }

    return await query.orderBy(desc(workflowNotifications.createdAt));
  }

  async createWorkflowNotification(notification: InsertWorkflowNotification): Promise<WorkflowNotification> {
    const [newNotification] = await db
      .insert(workflowNotifications)
      .values({
        ...notification,
        createdAt: new Date(),
      })
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<WorkflowNotification | undefined> {
    const [readNotification] = await db
      .update(workflowNotifications)
      .set({
        readAt: new Date(),
      })
      .where(eq(workflowNotifications.id, id))
      .returning();
    return readNotification;
  }

  async getEscalationRecords(): Promise<EscalationRecord[]> {
    return await db
      .select()
      .from(escalationRecords)
      .orderBy(desc(escalationRecords.createdAt));
  }

  // Advanced Authorization Logic
  async determineRequiredApprovals(workflowType: string, amount: string): Promise<AuthorizationMatrix[]> {
    const amountNum = parseFloat(amount || "0");
    
    return await db
      .select()
      .from(authorizationMatrix)
      .where(
        and(
          eq(authorizationMatrix.workflowType, workflowType as any),
          eq(authorizationMatrix.isActive, true),
          or(
            isNull(authorizationMatrix.minAmount),
            lte(sql`CAST(${authorizationMatrix.minAmount} as DECIMAL)`, amountNum)
          ),
          or(
            isNull(authorizationMatrix.maxAmount),
            gte(sql`CAST(${authorizationMatrix.maxAmount} as DECIMAL)`, amountNum)
          )
        )
      )
      .orderBy(authorizationMatrix.requiredLevel);
  }

  async createMultiLevelWorkflow(workflowData: InsertAuthorizationWorkflow): Promise<{ workflow: AuthorizationWorkflow; steps: WorkflowStep[] }> {
    // Create the main workflow
    const workflow = await this.createAuthorizationWorkflow(workflowData);
    
    // Determine required approval levels
    const requiredApprovals = await this.determineRequiredApprovals(
      workflowData.workflowType,
      workflowData.amount || "0"
    );

    // Create workflow steps for each required approval level
    const steps: WorkflowStep[] = [];
    for (let i = 0; i < requiredApprovals.length; i++) {
      const approval = requiredApprovals[i];
      const step = await this.createWorkflowStep({
        workflowId: workflow.id,
        stepOrder: i + 1,
        approverLevel: approval.requiredLevel,
        isRequired: true,
        status: i === 0 ? 'pendiente' : 'pendiente', // First step is active, others wait
      });
      steps.push(step);
    }

    return { workflow, steps };
  }

  async getWorkflowsRequiringApproval(userId: string): Promise<AuthorizationWorkflow[]> {
    // Get user's approval level and delegations
    const user = await this.getUser(userId);
    const delegations = await this.getActiveAuthorityDelegations(userId);
    
    // Find workflows where user can approve based on their level or delegations
    return await db
      .select({
        id: authorizationWorkflows.id,
        projectId: authorizationWorkflows.projectId,
        workflowType: authorizationWorkflows.workflowType,
        title: authorizationWorkflows.title,
        description: authorizationWorkflows.description,
        amount: authorizationWorkflows.amount,
        requestedBy: authorizationWorkflows.requestedBy,
        currentApprover: authorizationWorkflows.currentApprover,
        status: authorizationWorkflows.status,
        priority: authorizationWorkflows.priority,
        dueDate: authorizationWorkflows.dueDate,
        approvedAt: authorizationWorkflows.approvedAt,
        rejectedAt: authorizationWorkflows.rejectedAt,
        rejectionReason: authorizationWorkflows.rejectionReason,
        createdAt: authorizationWorkflows.createdAt,
        updatedAt: authorizationWorkflows.updatedAt,
      })
      .from(authorizationWorkflows)
      .innerJoin(workflowSteps, eq(workflowSteps.workflowId, authorizationWorkflows.id))
      .where(
        and(
          eq(authorizationWorkflows.status, 'pendiente'),
          eq(workflowSteps.status, 'pendiente'),
          or(
            eq(workflowSteps.assignedApproverId, userId),
            eq(authorizationWorkflows.currentApprover, userId)
          )
        )
      )
      .orderBy(authorizationWorkflows.priority, authorizationWorkflows.createdAt);
  }

  async getAuthorizationWorkflow(id: string): Promise<AuthorizationWorkflow | undefined> {
    const [workflow] = await db
      .select()
      .from(authorizationWorkflows)
      .where(eq(authorizationWorkflows.id, id));
    return workflow;
  }

  async updateAuthorizationWorkflow(id: string, workflow: Partial<InsertAuthorizationWorkflow>): Promise<AuthorizationWorkflow | undefined> {
    const [updatedWorkflow] = await db
      .update(authorizationWorkflows)
      .set({
        ...workflow,
        updatedAt: new Date(),
      })
      .where(eq(authorizationWorkflows.id, id))
      .returning();
    return updatedWorkflow;
  }

  async getAuthorizationMetrics(): Promise<any> {
    const totalWorkflows = await db.select({ count: count() }).from(authorizationWorkflows);
    const pendingWorkflows = await db.select({ count: count() }).from(authorizationWorkflows).where(eq(authorizationWorkflows.status, 'pendiente'));
    const approvedWorkflows = await db.select({ count: count() }).from(authorizationWorkflows).where(eq(authorizationWorkflows.status, 'aprobado'));
    const rejectedWorkflows = await db.select({ count: count() }).from(authorizationWorkflows).where(eq(authorizationWorkflows.status, 'rechazado'));

    return {
      totalWorkflows: totalWorkflows[0]?.count || 0,
      pendingWorkflows: pendingWorkflows[0]?.count || 0,
      approvedWorkflows: approvedWorkflows[0]?.count || 0,
      rejectedWorkflows: rejectedWorkflows[0]?.count || 0,
      averageApprovalTime: 24, // Mock data
      escalatedWorkflows: 0,
      activeApprovers: 3,
      approvalRate: 85,
    };
  }

  async getRecentAuthorizationWorkflows(): Promise<AuthorizationWorkflow[]> {
    return await db
      .select()
      .from(authorizationWorkflows)
      .orderBy(desc(authorizationWorkflows.updatedAt))
      .limit(10);
  }

  async getAuthorityDelegations(): Promise<AuthorityDelegation[]> {
    return await db
      .select()
      .from(authorityDelegations)
      .orderBy(desc(authorityDelegations.createdAt));
  }

  async createAuthorityDelegation(delegation: InsertAuthorityDelegation): Promise<AuthorityDelegation> {
    const [newDelegation] = await db
      .insert(authorityDelegations)
      .values(delegation)
      .returning();
    return newDelegation;
  }

  async revokeAuthorityDelegation(id: string): Promise<void> {
    await db
      .update(authorityDelegations)
      .set({ isActive: false })
      .where(eq(authorityDelegations.id, id));
  }
}

export const storage = new DatabaseStorage();
