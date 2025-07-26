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
  real,
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
  authorizationLimit: varchar("authorization_limit").default("50000"),
  department: varchar("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project status and type enums
export const projectStatusEnum = pgEnum('project_status', [
  'planeacion', 'diseño', 'tramites', 'construccion', 'ventas', 'entrega'
]);

export const projectTypeEnum = pgEnum('project_type', [
  'residencial', 'industrial', 'comercial', 'usos_mixtos'
]);

// Task priority enum
export const taskPriorityEnum = pgEnum('task_priority', [
  'baja', 'media', 'alta', 'critica'
]);

// Task status enum
export const taskStatusEnum = pgEnum('task_status', [
  'no_iniciada', 'en_progreso', 'completada', 'pausada', 'cancelada'
]);

// Resource type enum
export const resourceTypeEnum = pgEnum('resource_type', [
  'humano', 'equipo', 'material', 'costo'
]);

// Milestone status enum
export const milestoneStatusEnum = pgEnum('milestone_status', [
  'pendiente', 'en_progreso', 'alcanzado', 'retrasado'
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



// Permit status and type enums
export const permitStatusEnum = pgEnum('permit_status', [
  'pendiente', 'en_revision', 'aprobado', 'rechazado', 'vencido'
]);

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

// WBS (Work Breakdown Structure) table for advanced project management
export const wbsItems = pgTable("wbs_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  parentId: varchar("parent_id").references(() => wbsItems.id),
  wbsCode: varchar("wbs_code").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  level: integer("level").notNull(),
  duration: integer("duration"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  progress: integer("progress").default(0),
  budgetedCost: varchar("budgeted_cost").default('0'),
  actualCost: varchar("actual_cost").default('0'),
  isMilestone: boolean("is_milestone").default(false),
  isCritical: boolean("is_critical").default(false),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lot status enum
export const lotStatusEnum = pgEnum('lot_status', [
  'disponible', 'reservado', 'vendido', 'apartado'
]);

// Lots table for commercial management
export const lots = pgTable("lots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  lotNumber: varchar("lot_number").notNull(),
  block: varchar("block"),
  area: decimal("area", { precision: 10, scale: 2 }),
  pricePerM2: decimal("price_per_m2", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }),
  status: lotStatusEnum("status").notNull().default('disponible'),
  characteristics: text("characteristics"),
  reservedBy: varchar("reserved_by"),
  reservedDate: timestamp("reserved_date"),
  soldDate: timestamp("sold_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client identification type enum
export const identificationTypeEnum = pgEnum('identification_type', [
  'cedula', 'pasaporte', 'nit', 'cedula_extranjera'
]);

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  identificationType: identificationTypeEnum("identification_type").notNull(),
  identificationNumber: varchar("identification_number").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales contract status enum
export const contractStatusEnum = pgEnum('contract_status', [
  'borrador', 'promesa', 'firmado', 'cancelado', 'entregado'
]);

// Financing type enum
export const financingTypeEnum = pgEnum('financing_type', [
  'contado', 'credito_bancario', 'credito_constructor', 'mixto'
]);

// Sales contracts table
export const salesContracts = pgTable("sales_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  lotId: varchar("lot_id").notNull().references(() => lots.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  salePrice: varchar("sale_price").notNull(),
  downPayment: varchar("down_payment").default('0'),
  financingType: financingTypeEnum("financing_type").notNull().default('contado'),
  installments: integer("installments").default(0),
  monthlyPayment: varchar("monthly_payment").default('0'),
  status: contractStatusEnum("status").notNull().default('borrador'),
  signedDate: timestamp("signed_date"),
  deliveryDate: timestamp("delivery_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Authorization workflow status and type enums
export const authorizationStatusEnum = pgEnum('authorization_status', [
  'pendiente', 'en_revision', 'aprobado', 'rechazado', 'cancelado'
]);

export const workflowTypeEnum = pgEnum('workflow_type', [
  'presupuesto', 'contrato', 'pago', 'cambio_orden', 'compra'
]);

// Authorization workflows table
export const authorizationWorkflows = pgTable("authorization_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  workflowType: workflowTypeEnum("workflow_type").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  amount: varchar("amount"),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  currentApprover: varchar("current_approver").references(() => users.id),
  status: authorizationStatusEnum("status").notNull().default('pendiente'),
  priority: varchar("priority").default('medium'),
  dueDate: timestamp("due_date"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Authorization steps table
export const authorizationSteps = pgTable("authorization_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => authorizationWorkflows.id),
  approverId: varchar("approver_id").notNull().references(() => users.id),
  action: varchar("action").notNull(),
  comments: text("comments"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Advanced authorization system tables
export const approvalLevelsEnum = pgEnum('approval_level', [
  'operativo', 'supervisor', 'gerente', 'director', 'ejecutivo'
]);

// Authorization matrix for multi-level approvals
export const authorizationMatrix = pgTable("authorization_matrix", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowType: workflowTypeEnum("workflow_type").notNull(),
  minAmount: varchar("min_amount").default('0'),
  maxAmount: varchar("max_amount"),
  requiredLevel: approvalLevelsEnum("required_level").notNull(),
  requiresSequential: boolean("requires_sequential").default(false),
  escalationHours: integer("escalation_hours").default(24),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Multi-level workflow steps
export const workflowSteps = pgTable("workflow_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => authorizationWorkflows.id),
  stepOrder: integer("step_order").notNull(),
  approverLevel: approvalLevelsEnum("approver_level").notNull(),
  assignedApproverId: varchar("assigned_approver_id").references(() => users.id),
  isRequired: boolean("is_required").default(true),
  status: authorizationStatusEnum("status").default('pendiente'),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  comments: text("comments"),
  escalatedAt: timestamp("escalated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Authority delegation system
export const authorityDelegations = pgTable("authority_delegations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  delegatorId: varchar("delegator_id").notNull().references(() => users.id),
  delegateId: varchar("delegate_id").notNull().references(() => users.id),
  workflowTypes: varchar("workflow_types").array(), // Array of workflow types
  maxAmount: varchar("max_amount"),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").default(true),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow notifications and escalations
export const workflowNotifications = pgTable("workflow_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => authorizationWorkflows.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  notificationType: varchar("notification_type").notNull(), // 'reminder', 'escalation', 'approval_required'
  message: text("message").notNull(),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Investors table for capital management
export const investors = pgTable("investors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  investorType: varchar("investor_type").default('individual'),
  taxId: varchar("tax_id"),
  totalCommitment: varchar("total_commitment").default('0'),
  totalContributed: varchar("total_contributed").default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Capital calls table
export const capitalCalls = pgTable("capital_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  callNumber: integer("call_number").notNull(),
  totalAmount: varchar("total_amount").notNull(),
  callDate: timestamp("call_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  purpose: text("purpose"),
  status: varchar("status").default('pendiente'),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Escalation Records - Registro de escalamientos
export const escalationRecords = pgTable("escalation_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => authorizationWorkflows.id),
  escalationType: varchar("escalation_type").notNull(), // 'reminder', 'escalation', 'final_escalation'
  triggerHours: integer("trigger_hours").notNull(), // Horas transcurridas que dispararon el escalamiento
  targetUserId: varchar("target_user_id").notNull().references(() => users.id),
  previousApprover: varchar("previous_approver").references(() => users.id),
  message: text("message").notNull(),
  isProcessed: boolean("is_processed").default(false),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  permits: many(permits),
  budgetItems: many(budgetItems),
  documents: many(documents),
  calendarEvents: many(calendarEvents),
  wbsItems: many(wbsItems),
  lots: many(lots),
  salesContracts: many(salesContracts),
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

export const wbsItemsRelations = relations(wbsItems, ({ one, many }) => ({
  project: one(projects, {
    fields: [wbsItems.projectId],
    references: [projects.id],
  }),
  parent: one(wbsItems, {
    fields: [wbsItems.parentId],
    references: [wbsItems.id],
  }),
  children: many(wbsItems),
  assignedTo: one(users, {
    fields: [wbsItems.assignedTo],
    references: [users.id],
  }),
}));

export const lotsRelations = relations(lots, ({ one, many }) => ({
  project: one(projects, {
    fields: [lots.projectId],
    references: [projects.id],
  }),
  salesContracts: many(salesContracts),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  salesContracts: many(salesContracts),
}));

export const salesContractsRelations = relations(salesContracts, ({ one }) => ({
  project: one(projects, {
    fields: [salesContracts.projectId],
    references: [projects.id],
  }),
  lot: one(lots, {
    fields: [salesContracts.lotId],
    references: [lots.id],
  }),
  client: one(clients, {
    fields: [salesContracts.clientId],
    references: [clients.id],
  }),
}));

export const authorizationWorkflowsRelations = relations(authorizationWorkflows, ({ one, many }) => ({
  project: one(projects, {
    fields: [authorizationWorkflows.projectId],
    references: [projects.id],
  }),
  requestedBy: one(users, {
    fields: [authorizationWorkflows.requestedBy],
    references: [users.id],
  }),
  currentApprover: one(users, {
    fields: [authorizationWorkflows.currentApprover],
    references: [users.id],
  }),
  steps: many(authorizationSteps),
}));

export const authorizationStepsRelations = relations(authorizationSteps, ({ one }) => ({
  workflow: one(authorizationWorkflows, {
    fields: [authorizationSteps.workflowId],
    references: [authorizationWorkflows.id],
  }),
  approver: one(users, {
    fields: [authorizationSteps.approverId],
    references: [users.id],
  }),
}));

export const capitalCallsRelations = relations(capitalCalls, ({ one }) => ({
  project: one(projects, {
    fields: [capitalCalls.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [capitalCalls.createdBy],
    references: [users.id],
  }),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  workflow: one(authorizationWorkflows, {
    fields: [workflowSteps.workflowId],
    references: [authorizationWorkflows.id],
  }),
  assignedApprover: one(users, {
    fields: [workflowSteps.assignedApproverId],
    references: [users.id],
  }),
}));

export const authorityDelegationsRelations = relations(authorityDelegations, ({ one }) => ({
  delegator: one(users, {
    fields: [authorityDelegations.delegatorId],
    references: [users.id],
  }),
  delegate: one(users, {
    fields: [authorityDelegations.delegateId],
    references: [users.id],
  }),
}));

export const workflowNotificationsRelations = relations(workflowNotifications, ({ one }) => ({
  workflow: one(authorizationWorkflows, {
    fields: [workflowNotifications.workflowId],
    references: [authorizationWorkflows.id],
  }),
  recipient: one(users, {
    fields: [workflowNotifications.recipientId],
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

export const insertWbsItemSchema = createInsertSchema(wbsItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertAuthorizationWorkflowSchema = createInsertSchema(authorizationWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuthorizationStepSchema = createInsertSchema(authorizationSteps).omit({
  id: true,
  timestamp: true,
});

export const insertInvestorSchema = createInsertSchema(investors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCapitalCallSchema = createInsertSchema(capitalCalls).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuthorizationMatrixSchema = createInsertSchema(authorizationMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuthorityDelegationSchema = createInsertSchema(authorityDelegations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowNotificationSchema = createInsertSchema(workflowNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertEscalationRecordSchema = createInsertSchema(escalationRecords).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Workflow templates for automation
export const workflowTemplates = pgTable("workflow_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // 'financial', 'project', 'permit', 'commercial'
  triggerType: varchar("trigger_type").notNull(), // 'manual', 'scheduled', 'event', 'ai_driven'
  triggerConditions: jsonb("trigger_conditions"), // JSON with conditions
  steps: jsonb("steps").notNull(), // Array of workflow steps
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow instances (actual executions)
export const workflowInstances = pgTable("workflow_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => workflowTemplates.id),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status").notNull(), // 'pending', 'running', 'completed', 'failed', 'cancelled'
  currentStep: integer("current_step").default(0).notNull(),
  context: jsonb("context"), // Runtime data and variables
  startedBy: varchar("started_by").references(() => users.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  priority: varchar("priority").default('medium').notNull(), // 'low', 'medium', 'high', 'critical'
});

// Workflow step executions
export const workflowStepExecutions = pgTable("workflow_step_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instanceId: varchar("instance_id").notNull().references(() => workflowInstances.id),
  stepIndex: integer("step_index").notNull(),
  stepName: varchar("step_name").notNull(),
  stepType: varchar("step_type").notNull(), // 'approval', 'notification', 'api_call', 'ai_analysis', 'condition'
  status: varchar("status").notNull(), // 'pending', 'running', 'completed', 'failed', 'skipped'
  input: jsonb("input"),
  output: jsonb("output"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

// AI automation rules
export const aiAutomationRules = pgTable("ai_automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  entityType: varchar("entity_type").notNull(), // 'project', 'permit', 'budget', 'document'
  conditions: jsonb("conditions").notNull(), // AI analysis conditions
  actions: jsonb("actions").notNull(), // Automated actions to take
  confidence_threshold: real("confidence_threshold").default(0.8).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0).notNull(),
});

// Smart notifications
export const smartNotifications = pgTable("smart_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(), // 'info', 'warning', 'error', 'success', 'ai_insight'
  category: varchar("category").notNull(), // 'workflow', 'deadline', 'approval', 'ai_recommendation'
  priority: varchar("priority").default('medium').notNull(),
  entityType: varchar("entity_type"), // Related entity type
  entityId: varchar("entity_id"), // Related entity ID
  actionRequired: boolean("action_required").default(false).notNull(),
  actionUrl: varchar("action_url"),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
  scheduledFor: timestamp("scheduled_for"), // For delayed notifications
});

export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplates.$inferInsert;
export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = typeof workflowInstances.$inferInsert;
export type WorkflowStepExecution = typeof workflowStepExecutions.$inferSelect;
export type InsertWorkflowStepExecution = typeof workflowStepExecutions.$inferInsert;
export type AiAutomationRule = typeof aiAutomationRules.$inferSelect;
export type InsertAiAutomationRule = typeof aiAutomationRules.$inferInsert;
export type SmartNotification = typeof smartNotifications.$inferSelect;
export type InsertSmartNotification = typeof smartNotifications.$inferInsert;

// Document categories enum
export const documentCategoryEnum = pgEnum('document_category', [
  'contrato', 'plano', 'permiso', 'presupuesto', 'factura', 'comprobante', 
  'certificado', 'licencia', 'escritura', 'avaluo', 'otro'
]);

// Document status enum
export const documentStatusEnum = pgEnum('document_status', [
  'borrador', 'revision', 'aprobado', 'rechazado', 'archivado', 'vencido'
]);

// Access level enum
export const accessLevelEnum = pgEnum('access_level', [
  'publico', 'interno', 'confidencial', 'restringido'
]);

// Advanced document management system
export const documentLibrary = pgTable("document_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: documentCategoryEnum("category").notNull(),
  status: documentStatusEnum("status").notNull().default('borrador'),
  accessLevel: accessLevelEnum("access_level").notNull().default('interno'),
  
  // File information
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  filePath: varchar("file_path").notNull(),
  checksum: varchar("checksum"), // For integrity verification
  
  // OCR and content
  extractedText: text("extracted_text"), // OCR extracted text
  ocrStatus: varchar("ocr_status").default('pending'), // 'pending', 'processing', 'completed', 'failed'
  ocrConfidence: real("ocr_confidence"), // OCR confidence score
  
  // Versioning
  version: varchar("version").notNull().default('1.0'),
  parentDocumentId: varchar("parent_document_id").references(() => documentLibrary.id),
  isLatestVersion: boolean("is_latest_version").default(true).notNull(),
  
  // Metadata
  tags: text("tags").array(), // Searchable tags
  customFields: jsonb("custom_fields"), // Custom metadata fields
  
  // Relationships
  projectId: varchar("project_id").references(() => projects.id),
  entityType: varchar("entity_type"), // 'project', 'client', 'permit', etc.
  entityId: varchar("entity_id"), // Reference to related entity
  
  // Security and permissions
  createdBy: varchar("created_by").notNull().references(() => users.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  
  // Lifecycle dates
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expirationDate: timestamp("expiration_date"),
  archivedAt: timestamp("archived_at"),
  
  // Digital signature
  isSigned: boolean("is_signed").default(false).notNull(),
  signatureData: jsonb("signature_data"), // Digital signature information
});

// Document versions history
export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documentLibrary.id),
  version: varchar("version").notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  changes: text("changes"), // Description of changes
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document approval workflows
export const documentApprovalWorkflows = pgTable("document_approval_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documentLibrary.id),
  workflowName: varchar("workflow_name").notNull(),
  status: varchar("status").notNull().default('pending'), // 'pending', 'in_progress', 'approved', 'rejected'
  currentStep: integer("current_step").default(0).notNull(),
  totalSteps: integer("total_steps").notNull(),
  approvalSteps: jsonb("approval_steps").notNull(), // Array of approval steps
  comments: text("comments"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Document approval steps
export const documentApprovalSteps = pgTable("document_approval_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => documentApprovalWorkflows.id),
  stepOrder: integer("step_order").notNull(),
  approverRole: varchar("approver_role").notNull(),
  approverId: varchar("approver_id").references(() => users.id),
  status: varchar("status").notNull().default('pending'), // 'pending', 'approved', 'rejected', 'skipped'
  comments: text("comments"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  deadline: timestamp("deadline"),
});

// Document access permissions
export const documentPermissions = pgTable("document_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documentLibrary.id),
  userId: varchar("user_id").references(() => users.id),
  roleId: varchar("role_id"), // For role-based permissions
  permissionType: varchar("permission_type").notNull(), // 'read', 'write', 'delete', 'approve'
  grantedBy: varchar("granted_by").notNull().references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Document activity log
export const documentActivityLog = pgTable("document_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documentLibrary.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // 'created', 'viewed', 'downloaded', 'updated', 'approved', 'rejected'
  details: jsonb("details"), // Additional action details
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document templates for common document types
export const documentTemplates = pgTable("document_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: documentCategoryEnum("category").notNull(),
  templatePath: varchar("template_path").notNull(),
  fields: jsonb("fields").notNull(), // Template fields configuration
  approvalWorkflow: jsonb("approval_workflow"), // Default approval workflow
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document sharing and external access
export const documentShares = pgTable("document_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documentLibrary.id),
  shareToken: varchar("share_token").notNull().unique(),
  shareType: varchar("share_type").notNull(), // 'public', 'protected', 'private'
  accessLevel: varchar("access_level").notNull(), // 'view', 'download', 'comment'
  password: varchar("password"), // For protected shares
  expiresAt: timestamp("expires_at"),
  maxDownloads: integer("max_downloads"),
  downloadCount: integer("download_count").default(0).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DocumentLibrary = typeof documentLibrary.$inferSelect;
export type InsertDocumentLibrary = typeof documentLibrary.$inferInsert;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;
export type DocumentApprovalWorkflow = typeof documentApprovalWorkflows.$inferSelect;
export type InsertDocumentApprovalWorkflow = typeof documentApprovalWorkflows.$inferInsert;
export type DocumentApprovalStep = typeof documentApprovalSteps.$inferSelect;
export type InsertDocumentApprovalStep = typeof documentApprovalSteps.$inferInsert;
export type DocumentPermission = typeof documentPermissions.$inferSelect;
export type InsertDocumentPermission = typeof documentPermissions.$inferInsert;
export type DocumentActivityLog = typeof documentActivityLog.$inferSelect;
export type InsertDocumentActivityLog = typeof documentActivityLog.$inferInsert;
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = typeof documentTemplates.$inferInsert;
export type DocumentShare = typeof documentShares.$inferSelect;
export type InsertDocumentShare = typeof documentShares.$inferInsert;
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
export type InsertWbsItem = z.infer<typeof insertWbsItemSchema>;
export type WbsItem = typeof wbsItems.$inferSelect;
export type InsertLot = z.infer<typeof insertLotSchema>;
export type Lot = typeof lots.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertSalesContract = z.infer<typeof insertSalesContractSchema>;
export type SalesContract = typeof salesContracts.$inferSelect;
export type InsertAuthorizationWorkflow = z.infer<typeof insertAuthorizationWorkflowSchema>;
export type AuthorizationWorkflow = typeof authorizationWorkflows.$inferSelect;
export type InsertAuthorizationStep = z.infer<typeof insertAuthorizationStepSchema>;
export type AuthorizationStep = typeof authorizationSteps.$inferSelect;
export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type Investor = typeof investors.$inferSelect;
export type InsertCapitalCall = z.infer<typeof insertCapitalCallSchema>;
export type CapitalCall = typeof capitalCalls.$inferSelect;
export type InsertAuthorizationMatrix = z.infer<typeof insertAuthorizationMatrixSchema>;
export type AuthorizationMatrix = typeof authorizationMatrix.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertAuthorityDelegation = z.infer<typeof insertAuthorityDelegationSchema>;
export type AuthorityDelegation = typeof authorityDelegations.$inferSelect;
export type InsertWorkflowNotification = z.infer<typeof insertWorkflowNotificationSchema>;
export type WorkflowNotification = typeof workflowNotifications.$inferSelect;
export type InsertEscalationRecord = z.infer<typeof insertEscalationRecordSchema>;
export type EscalationRecord = typeof escalationRecords.$inferSelect;

// Project Management and Critical Path Tables
export const projectTasks = pgTable("project_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  wbsCode: varchar("wbs_code").notNull(), // e.g., "1.2.3.1"
  taskName: varchar("task_name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  duration: integer("duration"), // duration in days
  percentComplete: integer("percent_complete").default(0),
  priority: varchar("priority", { enum: ["low", "normal", "high", "critical"] }).default("normal"),
  taskType: varchar("task_type", { enum: ["task", "milestone", "summary"] }).default("task"),
  isOnCriticalPath: boolean("is_on_critical_path").default(false),
  totalFloat: integer("total_float").default(0), // slack time in days
  parentTaskId: varchar("parent_task_id").references(() => projectTasks.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }),
  baseline: jsonb("baseline"), // stores baseline dates and costs
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskDependencies = pgTable("task_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  predecessorTaskId: varchar("predecessor_task_id").references(() => projectTasks.id, { onDelete: "cascade" }),
  successorTaskId: varchar("successor_task_id").references(() => projectTasks.id, { onDelete: "cascade" }),
  dependencyType: varchar("dependency_type", { enum: ["FS", "SS", "FF", "SF"] }).default("FS"), // Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish
  leadLag: integer("lead_lag").default(0), // lead (negative) or lag (positive) in days
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectResources = pgTable("project_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  resourceName: varchar("resource_name").notNull(),
  resourceType: varchar("resource_type", { enum: ["human", "equipment", "material"] }).notNull(),
  costPerHour: decimal("cost_per_hour", { precision: 10, scale: 2 }),
  costPerDay: decimal("cost_per_day", { precision: 10, scale: 2 }),
  maxUnitsAvailable: decimal("max_units_available", { precision: 8, scale: 2 }).default(1),
  workingCalendarId: varchar("working_calendar_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskResourceAssignments = pgTable("task_resource_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => projectTasks.id, { onDelete: "cascade" }),
  resourceId: varchar("resource_id").references(() => projectResources.id, { onDelete: "cascade" }),
  unitsAssigned: decimal("units_assigned", { precision: 8, scale: 2 }).default(1), // percentage of resource allocation
  workHours: decimal("work_hours", { precision: 10, scale: 2 }),
  actualWorkHours: decimal("actual_work_hours", { precision: 10, scale: 2 }),
  costAssigned: decimal("cost_assigned", { precision: 12, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectBaselines = pgTable("project_baselines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  baselineName: varchar("baseline_name").notNull(),
  baselineDate: timestamp("baseline_date").defaultNow(),
  totalDuration: integer("total_duration"),
  totalCost: decimal("total_cost", { precision: 15, scale: 2 }),
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  isActive: boolean("is_active").default(false),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workingCalendars = pgTable("working_calendars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  calendarName: varchar("calendar_name").notNull(),
  workingDays: jsonb("working_days"), // [1,2,3,4,5] for Mon-Fri
  workingHours: jsonb("working_hours"), // {start: "08:00", end: "17:00"}
  holidays: jsonb("holidays"), // array of holiday dates
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectMilestones = pgTable("project_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  milestoneName: varchar("milestone_name").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  actualDate: timestamp("actual_date"),
  status: varchar("status", { enum: ["pending", "achieved", "delayed", "cancelled"] }).default("pending"),
  criticalityLevel: varchar("criticality_level", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  responsibleUserId: varchar("responsible_user_id").references(() => users.id),
  linkedTaskIds: jsonb("linked_task_ids"), // array of task IDs related to this milestone
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const earnedValueMetrics = pgTable("earned_value_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  reportDate: timestamp("report_date").defaultNow(),
  plannedValue: decimal("planned_value", { precision: 15, scale: 2 }), // PV - Planned Value
  earnedValue: decimal("earned_value", { precision: 15, scale: 2 }), // EV - Earned Value  
  actualCost: decimal("actual_cost", { precision: 15, scale: 2 }), // AC - Actual Cost
  budgetAtCompletion: decimal("budget_at_completion", { precision: 15, scale: 2 }), // BAC
  estimateAtCompletion: decimal("estimate_at_completion", { precision: 15, scale: 2 }), // EAC
  schedulePerformanceIndex: decimal("schedule_performance_index", { precision: 8, scale: 4 }), // SPI = EV/PV
  costPerformanceIndex: decimal("cost_performance_index", { precision: 8, scale: 4 }), // CPI = EV/AC
  scheduleVariance: decimal("schedule_variance", { precision: 15, scale: 2 }), // SV = EV - PV
  costVariance: decimal("cost_variance", { precision: 15, scale: 2 }), // CV = EV - AC
  createdAt: timestamp("created_at").defaultNow(),
});

// Microsoft Project Import History table
export const msProjectImports = pgTable("ms_project_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size"),
  importedBy: varchar("imported_by").references(() => users.id),
  importStatus: varchar("import_status").notNull().default('procesando'), // procesando, completado, error
  tasksImported: integer("tasks_imported").default(0),
  resourcesImported: integer("resources_imported").default(0),
  milestonesImported: integer("milestones_imported").default(0),
  errorLog: text("error_log"),
  msProjectVersion: varchar("ms_project_version"),
  msProjectFileType: varchar("ms_project_file_type"), // .mpp, .xml, .json
  importSettings: jsonb("import_settings"), // Settings used during import
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports for Project Management
export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = typeof projectTasks.$inferInsert;
export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;
export type ProjectResource = typeof projectResources.$inferSelect;
export type InsertProjectResource = typeof projectResources.$inferInsert;
export type TaskResourceAssignment = typeof taskResourceAssignments.$inferSelect;
export type InsertTaskResourceAssignment = typeof taskResourceAssignments.$inferInsert;
export type ProjectBaseline = typeof projectBaselines.$inferSelect;
export type InsertProjectBaseline = typeof projectBaselines.$inferInsert;
export type WorkingCalendar = typeof workingCalendars.$inferSelect;
export type InsertWorkingCalendar = typeof workingCalendars.$inferInsert;
export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type InsertProjectMilestone = typeof projectMilestones.$inferInsert;
export type EarnedValueMetric = typeof earnedValueMetrics.$inferSelect;
export type InsertEarnedValueMetric = typeof earnedValueMetrics.$inferInsert;
export type MsProjectImport = typeof msProjectImports.$inferSelect;
export type InsertMsProjectImport = typeof msProjectImports.$inferInsert;