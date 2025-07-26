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
  role: varchar("role").notNull().default('operativo'), // operativo, supervisor, gerente, director, ceo
  authorizationLimit: varchar("authorization_limit").default("50000"), // Límite de autorización en MXN
  department: varchar("department"), // departamento
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
// Enums for workflow and authorization
export const authorizationStatusEnum = pgEnum('authorization_status', [
  'pendiente', 'en_revision', 'aprobado', 'rechazado', 'cancelado'
]);

export const workflowTypeEnum = pgEnum('workflow_type', [
  'contratacion', 'orden_cambio', 'pago', 'liberacion_credito', 'capital_call'
]);

// Task dependencies enum
export const dependencyTypeEnum = pgEnum('dependency_type', [
  'finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'
]);

// Lot/Unit status for commercial management
export const lotStatusEnum = pgEnum('lot_status', [
  'disponible', 'apartado', 'promesa', 'vendido', 'escriturado'
]);

// Work Breakdown Structure (WBS) table
export const wbsItems = pgTable("wbs_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  parentId: varchar("parent_id"), // Para jerarquía
  wbsCode: varchar("wbs_code").notNull(), // Código WBS automático
  name: varchar("name").notNull(),
  description: text("description"),
  level: integer("level").notNull().default(1),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  duration: integer("duration"), // En días
  progress: integer("progress").default(0), // % completado
  budgetedCost: decimal("budgeted_cost", { precision: 15, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 15, scale: 2 }),
  isMilestone: boolean("is_milestone").default(false),
  isCritical: boolean("is_critical").default(false),
  assignedTo: varchar("assigned_to"), // User ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task dependencies for Gantt/CPM
export const taskDependencies = pgTable("task_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  predecessorId: varchar("predecessor_id").notNull(),
  successorId: varchar("successor_id").notNull(),
  dependencyType: dependencyTypeEnum("dependency_type").notNull().default('finish_to_start'),
  leadLag: integer("lead_lag").default(0), // Días de adelanto/retraso
  createdAt: timestamp("created_at").defaultNow(),
});

// Authorization workflows
export const authorizationWorkflows = pgTable("authorization_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id"),
  workflowType: workflowTypeEnum("workflow_type").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  requestedBy: varchar("requested_by").notNull(), // User ID
  currentApprover: varchar("current_approver"), // User ID
  status: authorizationStatusEnum("status").notNull().default('pendiente'),
  priority: varchar("priority").default('medium'), // high, medium, low
  dueDate: timestamp("due_date"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  attachments: text("attachments").array(), // URLs de documentos
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Authorization steps/history
export const authorizationSteps = pgTable("authorization_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull(),
  approverId: varchar("approver_id").notNull(),
  action: varchar("action").notNull(), // approved, rejected, delegated
  comments: text("comments"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Investors table for capital calls
export const investors = pgTable("investors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  investorType: varchar("investor_type").default('individual'), // individual, corporate, fund
  taxId: varchar("tax_id"), // RFC o Tax ID
  bankAccount: varchar("bank_account"),
  bankName: varchar("bank_name"),
  totalCommitment: decimal("total_commitment", { precision: 15, scale: 2 }),
  totalContributed: decimal("total_contributed", { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project investor participations
export const projectInvestors = pgTable("project_investors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  investorId: varchar("investor_id").notNull(),
  participationPercentage: decimal("participation_percentage", { precision: 5, scale: 2 }),
  commitmentAmount: decimal("commitment_amount", { precision: 15, scale: 2 }),
  contributedAmount: decimal("contributed_amount", { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Capital calls
export const capitalCalls = pgTable("capital_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  callNumber: integer("call_number").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  callDate: timestamp("call_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  purpose: text("purpose"),
  status: varchar("status").default('pending'), // pending, partial, completed
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual capital call items per investor
export const capitalCallItems = pgTable("capital_call_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  capitalCallId: varchar("capital_call_id").notNull(),
  investorId: varchar("investor_id").notNull(),
  requestedAmount: decimal("requested_amount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).default('0'),
  paidDate: timestamp("paid_date"),
  status: varchar("status").default('pending'), // pending, paid, overdue
});

// Lots/Units for commercial management
export const lots = pgTable("lots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  lotNumber: varchar("lot_number").notNull(),
  block: varchar("block"),
  area: decimal("area", { precision: 10, scale: 2 }), // m²
  pricePerM2: decimal("price_per_m2", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }),
  status: lotStatusEnum("status").notNull().default('disponible'),
  characteristics: text("characteristics"), // Orientación, vista, etc.
  reservedBy: varchar("reserved_by"), // Cliente que lo apartó
  reservedDate: timestamp("reserved_date"),
  soldDate: timestamp("sold_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales clients
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  taxId: varchar("tax_id"), // RFC
  birthDate: timestamp("birth_date"),
  occupation: varchar("occupation"),
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  maritalStatus: varchar("marital_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales contracts
export const salesContracts = pgTable("sales_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  lotId: varchar("lot_id").notNull(),
  clientId: varchar("client_id").notNull(),
  contractType: varchar("contract_type").notNull(), // promesa, deposito, definitivo
  contractNumber: varchar("contract_number"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  downPayment: decimal("down_payment", { precision: 15, scale: 2 }),
  monthlyPayment: decimal("monthly_payment", { precision: 12, scale: 2 }),
  paymentTerm: integer("payment_term"), // Meses
  contractDate: timestamp("contract_date").notNull(),
  deliveryDate: timestamp("delivery_date"),
  status: varchar("status").default('active'), // active, completed, cancelled
  specialConditions: text("special_conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment schedule and history
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  paymentNumber: integer("payment_number").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).default('0'),
  paidDate: timestamp("paid_date"),
  paymentMethod: varchar("payment_method"), // efectivo, transferencia, cheque
  reference: varchar("reference"),
  status: varchar("status").default('pending'), // pending, paid, overdue
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Additional insert schemas for new tables
export const insertWbsItemSchema = createInsertSchema(wbsItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuthorizationWorkflowSchema = createInsertSchema(authorizationWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestorSchema = createInsertSchema(investors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCapitalCallSchema = createInsertSchema(capitalCalls).omit({
  id: true,
  createdAt: true,
});

export const insertLotSchema = createInsertSchema(lots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesContractSchema = createInsertSchema(salesContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertWbsItem = z.infer<typeof insertWbsItemSchema>;
export type WbsItem = typeof wbsItems.$inferSelect;
export type InsertAuthorizationWorkflow = z.infer<typeof insertAuthorizationWorkflowSchema>;
export type AuthorizationWorkflow = typeof authorizationWorkflows.$inferSelect;
export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type Investor = typeof investors.$inferSelect;
export type InsertCapitalCall = z.infer<typeof insertCapitalCallSchema>;
export type CapitalCall = typeof capitalCalls.$inferSelect;
export type InsertLot = z.infer<typeof insertLotSchema>;
export type Lot = typeof lots.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertSalesContract = z.infer<typeof insertSalesContractSchema>;
export type SalesContract = typeof salesContracts.$inferSelect;
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
