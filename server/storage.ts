import {
  users,
  projects,
  permits,
  budgetCategories,
  budgetItems,
  documents,
  calendarEvents,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum, sql } from "drizzle-orm";

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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
  }

  // Budget operations
  async getBudgetCategories(): Promise<BudgetCategory[]> {
    return await db.select().from(budgetCategories);
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
}

export const storage = new DatabaseStorage();
