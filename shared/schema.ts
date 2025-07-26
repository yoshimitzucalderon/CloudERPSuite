import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default('operativo'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project status enum
export const projectStatusEnum = pgEnum('project_status', [
  'planeacion', 'diseño', 'tramites', 'construccion', 'ventas', 'entrega'
]);

// Project type enum
export const projectTypeEnum = pgEnum('project_type', [
  'residencial', 'industrial', 'comercial', 'usos_mixtos'
]);

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: projectTypeEnum("type").notNull(),
  location: text("location"),
  totalLandArea: decimal("total_land_area", { precision: 12, scale: 2 }),
  sellableArea: decimal("sellable_area", { precision: 12, scale: 2 }),
  plannedUnits: integer("planned_units"),
  totalBudget: decimal("total_budget", { precision: 15, scale: 2 }),
  status: projectStatusEnum("status").notNull().default('planeacion'),
  progress: integer("progress").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Permit status enum
export const permitStatusEnum = pgEnum('permit_status', [
  'pendiente', 'en_revision', 'aprobado', 'rechazado', 'vencido'
]);

// Permit type enum
export const permitTypeEnum = pgEnum('permit_type', [
  'licencia_construccion', 'factibilidad_servicios', 'impacto_ambiental',
  'proteccion_civil', 'uso_suelo', 'zonificacion', 'vialidad'
]);

// Permits table
export const permits = pgTable("permits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  name: varchar("name").notNull(),
  type: permitTypeEnum("type").notNull(),
  status: permitStatusEnum("status").notNull().default('pendiente'),
  requestDate: timestamp("request_date"),
  dueDate: timestamp("due_date"),
  approvalDate: timestamp("approval_date"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  responsiblePerson: varchar("responsible_person"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget categories table
export const budgetCategories = pgTable("budget_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  parentId: varchar("parent_id").references(() => budgetCategories.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget items table
export const budgetItems = pgTable("budget_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  categoryId: varchar("category_id").notNull().references(() => budgetCategories.id),
  name: varchar("name").notNull(),
  budgetedAmount: decimal("budgeted_amount", { precision: 15, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 15, scale: 2 }).default('0'),
  commitedAmount: decimal("commited_amount", { precision: 15, scale: 2 }).default('0'),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  permitId: varchar("permit_id").references(() => permits.id),
  name: varchar("name").notNull(),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  category: varchar("category"),
  filePath: varchar("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar events table
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  title: varchar("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  allDay: boolean("all_day").default(false),
  priority: varchar("priority").default('medium'),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  permits: many(permits),
  budgetItems: many(budgetItems),
  documents: many(documents),
  calendarEvents: many(calendarEvents),
}));

export const permitsRelations = relations(permits, ({ one, many }) => ({
  project: one(projects, {
    fields: [permits.projectId],
    references: [projects.id],
  }),
  documents: many(documents),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one, many }) => ({
  parent: one(budgetCategories, {
    fields: [budgetCategories.parentId],
    references: [budgetCategories.id],
  }),
  children: many(budgetCategories),
  budgetItems: many(budgetItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  project: one(projects, {
    fields: [budgetItems.projectId],
    references: [projects.id],
  }),
  category: one(budgetCategories, {
    fields: [budgetItems.categoryId],
    references: [budgetCategories.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  permit: one(permits, {
    fields: [documents.permitId],
    references: [permits.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  project: one(projects, {
    fields: [calendarEvents.projectId],
    references: [projects.id],
  }),
  assignedTo: one(users, {
    fields: [calendarEvents.assignedTo],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [calendarEvents.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermitSchema = createInsertSchema(permits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertPermit = z.infer<typeof insertPermitSchema>;
export type Permit = typeof permits.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
