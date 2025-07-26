import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { escalationService } from "./escalationService";
import { documentService } from "./documentService";
import { projectManagementService } from "./projectManagementService";
import {
  insertProjectSchema,
  insertPermitSchema,
  insertBudgetCategorySchema,
  insertBudgetItemSchema,
  insertDocumentSchema,
  insertCalendarEventSchema,
  insertWbsItemSchema,
  insertLotSchema,
  insertClientSchema,
  insertSalesContractSchema,
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const partialData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, partialData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Permit routes
  app.get('/api/permits', isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const permits = await storage.getPermits(projectId);
      res.json(permits);
    } catch (error) {
      console.error("Error fetching permits:", error);
      res.status(500).json({ message: "Failed to fetch permits" });
    }
  });

  app.post('/api/permits', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPermitSchema.parse(req.body);
      const permit = await storage.createPermit(validatedData);
      res.status(201).json(permit);
    } catch (error) {
      console.error("Error creating permit:", error);
      res.status(400).json({ message: "Invalid permit data" });
    }
  });

  app.put('/api/permits/:id', isAuthenticated, async (req, res) => {
    try {
      const partialData = insertPermitSchema.partial().parse(req.body);
      const permit = await storage.updatePermit(req.params.id, partialData);
      if (!permit) {
        return res.status(404).json({ message: "Permit not found" });
      }
      res.json(permit);
    } catch (error) {
      console.error("Error updating permit:", error);
      res.status(400).json({ message: "Invalid permit data" });
    }
  });

  // Budget routes
  app.get('/api/budget/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getBudgetCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching budget categories:", error);
      res.status(500).json({ message: "Failed to fetch budget categories" });
    }
  });

  app.post('/api/budget/categories', isAuthenticated, async (req, res) => {
    try {
      const categoryData = insertBudgetCategorySchema.parse(req.body);
      const category = await storage.createBudgetCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating budget category:", error);
      res.status(400).json({ message: "Failed to create budget category" });
    }
  });

  app.get('/api/budget/items/:projectId', isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getBudgetItems(req.params.projectId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });

  app.post('/api/budget/items', isAuthenticated, async (req, res) => {
    try {
      const itemData = insertBudgetItemSchema.parse(req.body);
      const item = await storage.createBudgetItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating budget item:", error);
      res.status(400).json({ message: "Invalid budget item data" });
    }
  });

  app.put('/api/budget/items/:id', isAuthenticated, async (req, res) => {
    try {
      const itemData = insertBudgetItemSchema.partial().parse(req.body);
      const item = await storage.updateBudgetItem(req.params.id, itemData);
      if (!item) {
        return res.status(404).json({ message: "Budget item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating budget item:", error);
      res.status(400).json({ message: "Invalid budget item data" });
    }
  });

  app.get('/api/budget/items/:projectId', isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getBudgetItems(req.params.projectId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });

  app.post('/api/budget/items', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBudgetItemSchema.parse(req.body);
      const item = await storage.createBudgetItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating budget item:", error);
      res.status(400).json({ message: "Invalid budget item data" });
    }
  });

  // Document routes
  app.get('/api/documents', isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const documents = await storage.getDocuments(projectId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const documentData = {
        projectId: req.body.projectId || null,
        permitId: req.body.permitId || null,
        name: req.body.name || req.file.originalname,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.claims.sub,
        category: req.body.category || 'general',
        filePath: req.file.path,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(400).json({ message: "Invalid document data" });
    }
  });

  // Calendar routes
  app.get('/api/calendar/events', isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const events = await storage.getCalendarEvents(projectId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post('/api/calendar/events', isAuthenticated, async (req: any, res) => {
    try {
      const eventData = {
        ...req.body,
        createdBy: req.user.claims.sub,
      };
      const validatedData = insertCalendarEventSchema.parse(eventData);
      const event = await storage.createCalendarEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(400).json({ message: "Invalid calendar event data" });
    }
  });

  app.put('/api/calendar/events/:id', isAuthenticated, async (req, res) => {
    try {
      const partialData = insertCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(req.params.id, partialData);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(400).json({ message: "Invalid calendar event data" });
    }
  });

  // WBS Items for Project Management
  app.get('/api/wbs/:projectId', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const wbsItems = await storage.getWbsItemsByProject(projectId);
      res.json(wbsItems);
    } catch (error) {
      console.error("Error fetching WBS items:", error);
      res.status(500).json({ message: "Failed to fetch WBS items" });
    }
  });

  app.post('/api/wbs', isAuthenticated, async (req, res) => {
    try {
      const result = insertWbsItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const wbsItem = await storage.createWbsItem(result.data);
      res.json(wbsItem);
    } catch (error) {
      console.error("Error creating WBS item:", error);
      res.status(500).json({ message: "Failed to create WBS item" });
    }
  });

  app.put('/api/wbs/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const result = insertWbsItemSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const wbsItem = await storage.updateWbsItem(id, result.data);
      res.json(wbsItem);
    } catch (error) {
      console.error("Error updating WBS item:", error);
      res.status(500).json({ message: "Failed to update WBS item" });
    }
  });

  // Commercial Management Routes - Lots
  app.get('/api/lots/:projectId', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const lots = await storage.getLotsByProject(projectId);
      res.json(lots);
    } catch (error) {
      console.error("Error fetching lots:", error);
      res.status(500).json({ message: "Failed to fetch lots" });
    }
  });

  app.post('/api/lots', isAuthenticated, async (req, res) => {
    try {
      const result = insertLotSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const lot = await storage.createLot(result.data);
      res.json(lot);
    } catch (error) {
      console.error("Error creating lot:", error);
      res.status(500).json({ message: "Failed to create lot" });
    }
  });

  // Commercial Management Routes - Clients
  app.get('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const result = insertClientSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const client = await storage.createClient(result.data);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Commercial Management Routes - Sales Contracts
  app.get('/api/contracts/:projectId', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const contracts = await storage.getSalesContractsByProject(projectId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.post('/api/contracts', isAuthenticated, async (req, res) => {
    try {
      const result = insertSalesContractSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const contract = await storage.createSalesContract(result.data);
      res.json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ message: "Failed to create contract" });
    }
  });

  // Authorization Workflow Routes
  app.get('/api/authorizations', isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId as string;
      const workflows = await storage.getAuthorizationWorkflows(projectId);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching authorization workflows:", error);
      res.status(500).json({ message: "Failed to fetch authorization workflows" });
    }
  });

  app.post('/api/authorizations', isAuthenticated, async (req: any, res) => {
    try {
      const workflowData = {
        ...req.body,
        requestedBy: req.user.claims.sub,
      };
      const result = insertAuthorizationWorkflowSchema.safeParse(workflowData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const workflow = await storage.createAuthorizationWorkflow(result.data);
      res.json(workflow);
    } catch (error) {
      console.error("Error creating authorization workflow:", error);
      res.status(500).json({ message: "Failed to create authorization workflow" });
    }
  });

  app.put('/api/authorizations/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const result = insertAuthorizationWorkflowSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const workflow = await storage.updateAuthorizationWorkflow(id, result.data);
      res.json(workflow);
    } catch (error) {
      console.error("Error updating authorization workflow:", error);
      res.status(500).json({ message: "Failed to update authorization workflow" });
    }
  });

  app.get('/api/authorizations/:id/steps', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const steps = await storage.getAuthorizationSteps(id);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching authorization steps:", error);
      res.status(500).json({ message: "Failed to fetch authorization steps" });
    }
  });

  app.post('/api/authorizations/:id/steps', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const stepData = {
        ...req.body,
        workflowId: id,
        approverId: req.user.claims.sub,
      };
      const result = insertAuthorizationStepSchema.safeParse(stepData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const step = await storage.createAuthorizationStep(result.data);
      res.json(step);
    } catch (error) {
      console.error("Error creating authorization step:", error);
      res.status(500).json({ message: "Failed to create authorization step" });
    }
  });



  // Advanced Authorization System Routes

  // Authorization Matrix Management
  app.get('/api/authorization-matrix', isAuthenticated, async (req, res) => {
    try {
      const matrix = await storage.getAuthorizationMatrix();
      res.json(matrix);
    } catch (error) {
      console.error("Error fetching authorization matrix:", error);
      res.status(500).json({ message: "Failed to fetch authorization matrix" });
    }
  });

  app.post('/api/authorization-matrix', isAuthenticated, async (req, res) => {
    try {
      const result = insertAuthorizationMatrixSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const matrix = await storage.createAuthorizationMatrix(result.data);
      res.json(matrix);
    } catch (error) {
      console.error("Error creating authorization matrix:", error);
      res.status(500).json({ message: "Failed to create authorization matrix" });
    }
  });

  // Multi-level Workflow Creation
  app.post('/api/authorizations/multi-level', isAuthenticated, async (req: any, res) => {
    try {
      const workflowData = {
        ...req.body,
        requestedBy: req.user.claims.sub,
      };
      const result = insertAuthorizationWorkflowSchema.safeParse(workflowData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const { workflow, steps } = await storage.createMultiLevelWorkflow(result.data);
      res.json({ workflow, steps });
    } catch (error) {
      console.error("Error creating multi-level workflow:", error);
      res.status(500).json({ message: "Failed to create multi-level workflow" });
    }
  });

  // Workflow Steps Management
  app.get('/api/workflow-steps/:workflowId', isAuthenticated, async (req, res) => {
    try {
      const { workflowId } = req.params;
      const steps = await storage.getWorkflowSteps(workflowId);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching workflow steps:", error);
      res.status(500).json({ message: "Failed to fetch workflow steps" });
    }
  });

  app.put('/api/workflow-steps/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const stepData = {
        ...req.body,
        assignedApproverId: req.user.claims.sub,
      };
      const result = insertWorkflowStepSchema.partial().safeParse(stepData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const step = await storage.updateWorkflowStep(id, result.data);
      res.json(step);
    } catch (error) {
      console.error("Error updating workflow step:", error);
      res.status(500).json({ message: "Failed to update workflow step" });
    }
  });

  // Authority Delegation Routes
  app.get('/api/authority-delegations', isAuthenticated, async (req: any, res) => {
    try {
      const delegateId = req.query.delegateId || req.user.claims.sub;
      const delegations = await storage.getActiveAuthorityDelegations(delegateId as string);
      res.json(delegations);
    } catch (error) {
      console.error("Error fetching authority delegations:", error);
      res.status(500).json({ message: "Failed to fetch authority delegations" });
    }
  });

  app.post('/api/authority-delegations', isAuthenticated, async (req: any, res) => {
    try {
      const delegationData = {
        ...req.body,
        delegatorId: req.user.claims.sub,
      };
      const result = insertAuthorityDelegationSchema.safeParse(delegationData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const delegation = await storage.createAuthorityDelegation(result.data);
      res.json(delegation);
    } catch (error) {
      console.error("Error creating authority delegation:", error);
      res.status(500).json({ message: "Failed to create authority delegation" });
    }
  });

  app.delete('/api/authority-delegations/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const delegation = await storage.revokeAuthorityDelegation(id);
      res.json(delegation);
    } catch (error) {
      console.error("Error revoking authority delegation:", error);
      res.status(500).json({ message: "Failed to revoke authority delegation" });
    }
  });

  // Workflow Notifications
  app.get('/api/workflow-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const unreadOnly = req.query.unreadOnly === 'true';
      const notifications = await storage.getWorkflowNotifications(req.user.claims.sub, unreadOnly);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching workflow notifications:", error);
      res.status(500).json({ message: "Failed to fetch workflow notifications" });
    }
  });

  app.put('/api/workflow-notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Pending Approvals for Current User
  app.get('/api/pending-approvals', isAuthenticated, async (req: any, res) => {
    try {
      const workflows = await storage.getWorkflowsRequiringApproval(req.user.claims.sub);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  // Workflow action processing (approve/reject)
  app.post('/api/authorization-workflows/:id/action', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { action, comments } = req.body;
      const userId = req.user.claims.sub;

      // Get the current workflow
      const workflow = await storage.getAuthorizationWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      // Update workflow status based on action
      let updateData: any = {};
      if (action === 'approve') {
        updateData = {
          status: 'aprobado',
          approvedAt: new Date(),
          currentApprover: null,
        };
      } else if (action === 'reject') {
        updateData = {
          status: 'rechazado',
          rejectedAt: new Date(),
          rejectionReason: comments || 'Rechazado por el aprobador',
          currentApprover: null,
        };
      }

      const updatedWorkflow = await storage.updateAuthorizationWorkflow(id, updateData);

      // Create authorization step record
      await storage.createAuthorizationStep({
        workflowId: id,
        approverId: userId,
        action: action,
        comments: comments || '',
      });

      // Create notification for requester
      await storage.createWorkflowNotification({
        workflowId: id,
        recipientId: workflow.requestedBy,
        notificationType: action === 'approve' ? 'approval_completed' : 'rejection',
        message: `Tu solicitud "${workflow.title}" ha sido ${action === 'approve' ? 'aprobada' : 'rechazada'}.`,
      });

      res.json(updatedWorkflow);
    } catch (error) {
      console.error("Error processing workflow action:", error);
      res.status(500).json({ message: "Failed to process workflow action" });
    }
  });

  // Authorization metrics
  app.get('/api/authorization-metrics', isAuthenticated, async (req: any, res) => {
    try {
      const metrics = await storage.getAuthorizationMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching authorization metrics:", error);
      res.status(500).json({ message: "Failed to fetch authorization metrics" });
    }
  });

  // Recent workflows
  app.get('/api/authorization-workflows/recent', isAuthenticated, async (req: any, res) => {
    try {
      const workflows = await storage.getRecentAuthorizationWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching recent workflows:", error);
      res.status(500).json({ message: "Failed to fetch recent workflows" });
    }
  });

  // Authority delegations
  app.get('/api/authority-delegations', isAuthenticated, async (req: any, res) => {
    try {
      const delegations = await storage.getAuthorityDelegations();
      res.json(delegations);
    } catch (error) {
      console.error("Error fetching authority delegations:", error);
      res.status(500).json({ message: "Failed to fetch authority delegations" });
    }
  });

  app.post('/api/authority-delegations', isAuthenticated, async (req: any, res) => {
    try {
      const delegation = await storage.createAuthorityDelegation({
        ...req.body,
        delegatorId: req.user.claims.sub,
        isActive: true,
      });
      res.json(delegation);
    } catch (error) {
      console.error("Error creating authority delegation:", error);
      res.status(500).json({ message: "Failed to create authority delegation" });
    }
  });

  app.delete('/api/authority-delegations/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.revokeAuthorityDelegation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking authority delegation:", error);
      res.status(500).json({ message: "Failed to revoke authority delegation" });
    }
  });

  // Escalation API Routes
  app.get('/api/escalations/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await escalationService.getEscalationStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching escalation stats:", error);
      res.status(500).json({ message: "Failed to fetch escalation stats" });
    }
  });

  app.get('/api/escalations/at-risk', isAuthenticated, async (req, res) => {
    try {
      const workflows = await escalationService.getWorkflowsAtRisk();
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows at risk:", error);
      res.status(500).json({ message: "Failed to fetch workflows at risk" });
    }
  });

  app.post('/api/escalations/trigger', isAuthenticated, async (req, res) => {
    try {
      await escalationService.processEscalations();
      res.json({ message: "Escalations processed successfully" });
    } catch (error) {
      console.error("Error triggering escalations:", error);
      res.status(500).json({ message: "Failed to trigger escalations" });
    }
  });

  // Workflow Automation Routes
  app.get('/api/workflow-templates', async (req, res) => {
    try {
      // Mock data for workflow templates
      const templates = [
        {
          id: '1',
          name: 'Aprobación de Presupuesto',
          description: 'Workflow automático para aprobar presupuestos de proyecto',
          category: 'financial',
          triggerType: 'event',
          steps: [
            { name: 'Validación inicial', type: 'condition' },
            { name: 'Notificar supervisor', type: 'notification' },
            { name: 'Aprobación requerida', type: 'approval' },
            { name: 'Análisis IA', type: 'ai_analysis' }
          ],
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Escalamiento de Permisos',
          description: 'Escalamiento automático cuando los permisos se retrasan',
          category: 'permit',
          triggerType: 'scheduled',
          steps: [
            { name: 'Verificar estado', type: 'condition' },
            { name: 'Análisis de retraso', type: 'ai_analysis' },
            { name: 'Notificar urgencia', type: 'notification' }
          ],
          isActive: true,
          createdAt: new Date()
        }
      ];
      res.json(templates);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  app.get('/api/workflow-instances', async (req, res) => {
    try {
      // Mock data for workflow instances
      const instances = [
        {
          id: '1',
          templateId: '1',
          name: 'Aprobación Presupuesto - Proyecto Alameda',
          status: 'running',
          currentStep: 2,
          totalSteps: 4,
          priority: 'high',
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          context: { projectId: 'proj-1', amount: 250000 }
        },
        {
          id: '2',
          templateId: '2',
          name: 'Escalamiento Permisos - Torre Central',
          status: 'completed',
          currentStep: 3,
          totalSteps: 3,
          priority: 'medium',
          startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
          context: { projectId: 'proj-2', permitType: 'construccion' }
        }
      ];
      res.json(instances);
    } catch (error) {
      console.error('Error fetching workflow instances:', error);
      res.status(500).json({ error: 'Failed to fetch instances' });
    }
  });

  app.get('/api/notifications', async (req, res) => {
    try {
      // Mock smart notifications
      const notifications = [
        {
          id: '1',
          title: 'Análisis IA: Riesgo de retraso detectado',
          message: 'El proyecto Alameda presenta un 85% de probabilidad de retraso en la fase de construcción',
          type: 'ai_insight',
          category: 'ai_recommendation',
          priority: 'high',
          isRead: false,
          actionRequired: true,
          createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        },
        {
          id: '2',
          title: 'Aprobación requerida: Presupuesto adicional',
          message: 'Se requiere aprobación para presupuesto adicional de $50,000 en materiales',
          type: 'warning',
          category: 'approval',
          priority: 'high',
          isRead: false,
          actionRequired: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: '3',
          title: 'Workflow completado: Permisos actualizados',
          message: 'El workflow de escalamiento de permisos se completó exitosamente',
          type: 'success',
          category: 'workflow',
          priority: 'medium',
          isRead: true,
          actionRequired: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        }
      ];
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.get('/api/ai-automation-rules', async (req, res) => {
    try {
      // Mock AI automation rules
      const rules = [
        {
          id: '1',
          name: 'Detector de Sobrecostos',
          description: 'Detecta automáticamente cuando un proyecto excede el 110% del presupuesto',
          entityType: 'project',
          confidence_threshold: 0.85,
          isActive: true,
          triggerCount: 12,
          lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000),
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Predictor de Retrasos',
          description: 'Predice retrasos en cronogramas basado en el progreso actual',
          entityType: 'project',
          confidence_threshold: 0.75,
          isActive: true,
          triggerCount: 8,
          lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date()
        },
        {
          id: '3',
          name: 'Optimizador de Recursos',
          description: 'Sugiere redistribución de recursos entre proyectos',
          entityType: 'resource',
          confidence_threshold: 0.80,
          isActive: false,
          triggerCount: 3,
          lastTriggered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date()
        }
      ];
      res.json(rules);
    } catch (error) {
      console.error('Error fetching AI rules:', error);
      res.status(500).json({ error: 'Failed to fetch AI rules' });
    }
  });

  app.post('/api/workflow-templates', async (req, res) => {
    try {
      const templateData = req.body;
      // In real implementation, save to database
      const newTemplate = {
        id: Date.now().toString(),
        ...templateData,
        isActive: true,
        createdAt: new Date()
      };
      res.json(newTemplate);
    } catch (error) {
      console.error('Error creating workflow template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  app.post('/api/workflow-templates/:templateId/execute', async (req, res) => {
    try {
      const { templateId } = req.params;
      const { context } = req.body;
      
      // In real implementation, use workflowAutomationService
      const newInstance = {
        id: Date.now().toString(),
        templateId,
        name: `Ejecución manual - ${new Date().toLocaleString()}`,
        status: 'running',
        currentStep: 0,
        priority: 'medium',
        startedAt: new Date(),
        context
      };
      
      res.json(newInstance);
    } catch (error) {
      console.error('Error executing workflow:', error);
      res.status(500).json({ error: 'Failed to execute workflow' });
    }
  });

  // Document Management Routes
  app.get('/api/documents', async (req, res) => {
    try {
      // Mock document data with OCR capabilities
      const documents = [
        {
          id: '1',
          name: 'Contrato de Compraventa - Lote 15A',
          description: 'Contrato firmado para la venta del lote 15A en el proyecto Alameda',
          category: 'contrato',
          status: 'aprobado',
          fileName: 'contrato_lote_15A.pdf',
          fileSize: 2456789,
          mimeType: 'application/pdf',
          version: '2.1',
          extractedText: 'CONTRATO DE COMPRAVENTA - Entre la empresa CONSTRUCTORA YCM360 S.A.S. y el señor Juan Pérez, se celebra el presente contrato para la compraventa del lote número 15A ubicado en el proyecto residencial Alameda por un valor de $120.000.000 COP...',
          ocrStatus: 'completed',
          ocrConfidence: 0.96,
          tags: ['contrato', 'venta', 'lote-15A', 'alameda'],
          projectId: 'proj-1',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          isLatestVersion: true,
          isSigned: true
        },
        {
          id: '2',
          name: 'Planos Arquitectónicos Torre B',
          description: 'Planos técnicos actualizados para la construcción de la Torre B',
          category: 'plano',
          status: 'revision',
          fileName: 'planos_torre_b_v3.dwg',
          fileSize: 15678234,
          mimeType: 'application/dwg',
          version: '3.0',
          extractedText: 'PLANOS ARQUITECTÓNICOS - TORRE B - Escala 1:100 - Área construida: 1,250 m2 - Apartamentos tipo A: 8 unidades - Apartamentos tipo B: 4 unidades...',
          ocrStatus: 'completed',
          ocrConfidence: 0.88,
          tags: ['planos', 'torre-b', 'arquitectura', 'construccion'],
          projectId: 'proj-1',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          isLatestVersion: true,
          isSigned: false
        },
        {
          id: '3',
          name: 'Licencia de Construcción Proyecto Central',
          description: 'Licencia expedida por Planeación Municipal para el proyecto Central',
          category: 'permiso',
          status: 'aprobado',
          fileName: 'licencia_construccion_central.pdf',
          fileSize: 890456,
          mimeType: 'application/pdf',
          version: '1.0',
          extractedText: 'LICENCIA DE CONSTRUCCIÓN No. LC-2024-0385 - Se autoriza a CONSTRUCTORA YCM360 S.A.S. para adelantar obras de construcción en el predio ubicado en la dirección Calle 45 No. 23-67...',
          ocrStatus: 'completed',
          ocrConfidence: 0.94,
          tags: ['licencia', 'construccion', 'proyecto-central', 'planeacion'],
          projectId: 'proj-2',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          isLatestVersion: true,
          isSigned: true
        },
        {
          id: '4',
          name: 'Presupuesto Detallado Q1 2024',
          description: 'Presupuesto trimestral con desglose por categorías y proyectos',
          category: 'presupuesto',
          status: 'borrador',
          fileName: 'presupuesto_q1_2024.xlsx',
          fileSize: 567234,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          version: '1.3',
          extractedText: 'PRESUPUESTO Q1 2024 - Total presupuestado: $4.250.000.000 - Materiales: $2.550.000.000 - Mano de obra: $1.275.000.000 - Gastos generales: $425.000.000...',
          ocrStatus: 'processing',
          ocrConfidence: 0.82,
          tags: ['presupuesto', 'q1-2024', 'financiero'],
          projectId: null,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isLatestVersion: true,
          isSigned: false
        }
      ];
      
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  app.get('/api/document-templates', async (req, res) => {
    try {
      // Mock document templates
      const templates = [
        {
          id: '1',
          name: 'Contrato de Compraventa Estándar',
          description: 'Plantilla estándar para contratos de compraventa de lotes',
          category: 'contrato',
          fields: [
            { name: 'buyer_name', label: 'Nombre del Comprador', type: 'text', required: true },
            { name: 'lot_number', label: 'Número de Lote', type: 'text', required: true },
            { name: 'sale_price', label: 'Precio de Venta', type: 'currency', required: true },
            { name: 'payment_terms', label: 'Términos de Pago', type: 'select', options: ['Contado', 'Financiado', 'Mixto'] }
          ],
          approvalWorkflow: {
            steps: [
              { role: 'legal', name: 'Revisión Legal' },
              { role: 'commercial', name: 'Aprobación Comercial' },
              { role: 'management', name: 'Aprobación Gerencial' }
            ]
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Solicitud de Permiso Municipal',
          description: 'Plantilla para solicitudes de permisos ante entidades municipales',
          category: 'permiso',
          fields: [
            { name: 'permit_type', label: 'Tipo de Permiso', type: 'select', required: true },
            { name: 'project_address', label: 'Dirección del Proyecto', type: 'text', required: true },
            { name: 'construction_area', label: 'Área de Construcción', type: 'number', required: true },
            { name: 'expected_duration', label: 'Duración Estimada', type: 'text', required: true }
          ],
          approvalWorkflow: {
            steps: [
              { role: 'technical', name: 'Revisión Técnica' },
              { role: 'legal', name: 'Revisión Legal' }
            ]
          },
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '3',
          name: 'Reporte de Presupuesto Mensual',
          description: 'Plantilla para reportes mensuales de presupuesto y gastos',
          category: 'presupuesto',
          fields: [
            { name: 'reporting_period', label: 'Período de Reporte', type: 'date', required: true },
            { name: 'total_budget', label: 'Presupuesto Total', type: 'currency', required: true },
            { name: 'spent_amount', label: 'Monto Ejecutado', type: 'currency', required: true },
            { name: 'variance_analysis', label: 'Análisis de Variaciones', type: 'textarea' }
          ],
          approvalWorkflow: {
            steps: [
              { role: 'accounting', name: 'Revisión Contable' },
              { role: 'finance', name: 'Aprobación Financiera' }
            ]
          },
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching document templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  app.post('/api/documents/upload', async (req, res) => {
    try {
      // In real implementation, use documentService
      const mockDocument = {
        id: Date.now().toString(),
        name: 'Documento subido',
        status: 'borrador',
        version: '1.0',
        ocrStatus: 'pending',
        createdAt: new Date(),
        message: 'Documento subido exitosamente. El procesamiento OCR iniciará automáticamente.'
      };
      
      res.json(mockDocument);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  app.post('/api/documents/:documentId/approval', async (req, res) => {
    try {
      const { documentId } = req.params;
      const workflow = req.body;
      
      // In real implementation, use documentService
      const approvalWorkflow = {
        id: Date.now().toString(),
        documentId,
        workflowName: workflow.name,
        status: 'in_progress',
        currentStep: 0,
        totalSteps: 3,
        createdAt: new Date()
      };
      
      res.json(approvalWorkflow);
    } catch (error) {
      console.error('Error starting approval workflow:', error);
      res.status(500).json({ error: 'Failed to start approval workflow' });
    }
  });

  app.get('/api/documents/:documentId', async (req, res) => {
    try {
      const { documentId } = req.params;
      
      // Mock detailed document data
      const documentDetails = {
        document: {
          id: documentId,
          name: 'Contrato de Compraventa - Lote 15A',
          description: 'Contrato firmado para la venta del lote 15A',
          extractedText: 'Contenido completo extraído por OCR...',
          ocrConfidence: 0.96
        },
        versions: [
          { version: '2.1', createdAt: new Date(), changes: 'Corrección en cláusula 5.2' },
          { version: '2.0', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), changes: 'Actualización de términos' }
        ],
        workflows: [
          { id: '1', workflowName: 'Aprobación Legal', status: 'approved', completedAt: new Date() }
        ],
        activities: [
          { action: 'approved', user: { firstName: 'Ana', lastName: 'García' }, createdAt: new Date() },
          { action: 'viewed', user: { firstName: 'Carlos', lastName: 'López' }, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
        ]
      };
      
      res.json(documentDetails);
    } catch (error) {
      console.error('Error fetching document details:', error);
      res.status(500).json({ error: 'Failed to fetch document details' });
    }
  });

  // ==================== PROJECT MANAGEMENT ROUTES ====================

  // Project Tasks Routes
  app.get('/api/projects/:projectId/tasks', isAuthenticated, async (req, res) => {
    try {
      const tasks = await projectManagementService.getProjectTasks(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      res.status(500).json({ message: "Failed to fetch project tasks" });
    }
  });

  app.post('/api/projects/:projectId/tasks', isAuthenticated, async (req, res) => {
    try {
      const task = await projectManagementService.createTask({
        ...req.body,
        projectId: req.params.projectId
      });
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:taskId', isAuthenticated, async (req, res) => {
    try {
      const task = await projectManagementService.updateTask(req.params.taskId, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:taskId', isAuthenticated, async (req, res) => {
    try {
      await projectManagementService.deleteTask(req.params.taskId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Task Dependencies Routes
  app.get('/api/tasks/:taskId/dependencies', isAuthenticated, async (req, res) => {
    try {
      const dependencies = await projectManagementService.getTaskDependencies(req.params.taskId);
      res.json(dependencies);
    } catch (error) {
      console.error("Error fetching task dependencies:", error);
      res.status(500).json({ message: "Failed to fetch task dependencies" });
    }
  });

  app.post('/api/tasks/dependencies', isAuthenticated, async (req, res) => {
    try {
      const dependency = await projectManagementService.createDependency(req.body);
      res.json(dependency);
    } catch (error) {
      console.error("Error creating dependency:", error);
      res.status(500).json({ message: error.message || "Failed to create dependency" });
    }
  });

  app.delete('/api/dependencies/:dependencyId', isAuthenticated, async (req, res) => {
    try {
      await projectManagementService.deleteDependency(req.params.dependencyId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dependency:", error);
      res.status(500).json({ message: "Failed to delete dependency" });
    }
  });

  // Critical Path Routes
  app.post('/api/projects/:projectId/calculate-critical-path', isAuthenticated, async (req, res) => {
    try {
      await projectManagementService.calculateCriticalPath(req.params.projectId);
      res.json({ success: true, message: "Critical path calculated successfully" });
    } catch (error) {
      console.error("Error calculating critical path:", error);
      res.status(500).json({ message: "Failed to calculate critical path" });
    }
  });

  app.post('/api/projects/:projectId/auto-schedule', isAuthenticated, async (req, res) => {
    try {
      await projectManagementService.autoScheduleTasks(req.params.projectId);
      res.json({ success: true, message: "Tasks auto-scheduled successfully" });
    } catch (error) {
      console.error("Error auto-scheduling tasks:", error);
      res.status(500).json({ message: "Failed to auto-schedule tasks" });
    }
  });

  // Project Resources Routes
  app.get('/api/projects/:projectId/resources', isAuthenticated, async (req, res) => {
    try {
      const resources = await projectManagementService.getProjectResources(req.params.projectId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching project resources:", error);
      res.status(500).json({ message: "Failed to fetch project resources" });
    }
  });

  app.post('/api/projects/:projectId/resources', isAuthenticated, async (req, res) => {
    try {
      const resource = await projectManagementService.createResource({
        ...req.body,
        projectId: req.params.projectId
      });
      res.json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  app.post('/api/tasks/:taskId/resource-assignments', isAuthenticated, async (req, res) => {
    try {
      const assignment = await projectManagementService.assignResourceToTask({
        ...req.body,
        taskId: req.params.taskId
      });
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning resource to task:", error);
      res.status(500).json({ message: "Failed to assign resource to task" });
    }
  });

  // Project Baselines Routes
  app.post('/api/projects/:projectId/baselines', isAuthenticated, async (req: any, res) => {
    try {
      const baseline = await projectManagementService.createBaseline({
        ...req.body,
        projectId: req.params.projectId,
        createdBy: req.user.claims.sub
      });
      res.json(baseline);
    } catch (error) {
      console.error("Error creating baseline:", error);
      res.status(500).json({ message: "Failed to create baseline" });
    }
  });

  // Earned Value Management Routes
  app.get('/api/projects/:projectId/evm', isAuthenticated, async (req, res) => {
    try {
      const evm = await projectManagementService.calculateEVM(req.params.projectId);
      res.json(evm);
    } catch (error) {
      console.error("Error calculating EVM:", error);
      res.status(500).json({ message: error.message || "Failed to calculate EVM" });
    }
  });

  // Project Milestones Routes
  app.get('/api/projects/:projectId/milestones', isAuthenticated, async (req, res) => {
    try {
      const milestones = await projectManagementService.getProjectMilestones(req.params.projectId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.post('/api/projects/:projectId/milestones', isAuthenticated, async (req, res) => {
    try {
      const milestone = await projectManagementService.createMilestone({
        ...req.body,
        projectId: req.params.projectId
      });
      res.json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  app.put('/api/milestones/:milestoneId/status', isAuthenticated, async (req, res) => {
    try {
      const { status, actualDate } = req.body;
      const milestone = await projectManagementService.updateMilestoneStatus(
        req.params.milestoneId, 
        status, 
        actualDate ? new Date(actualDate) : undefined
      );
      res.json(milestone);
    } catch (error) {
      console.error("Error updating milestone status:", error);
      res.status(500).json({ message: "Failed to update milestone status" });
    }
  });

  // Working Calendars Routes
  app.get('/api/projects/:projectId/calendars', isAuthenticated, async (req, res) => {
    try {
      const calendars = await projectManagementService.getProjectCalendars(req.params.projectId);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching project calendars:", error);
      res.status(500).json({ message: "Failed to fetch project calendars" });
    }
  });

  app.post('/api/projects/:projectId/calendars', isAuthenticated, async (req, res) => {
    try {
      const calendar = await projectManagementService.createWorkingCalendar({
        ...req.body,
        projectId: req.params.projectId
      });
      res.json(calendar);
    } catch (error) {
      console.error("Error creating working calendar:", error);
      res.status(500).json({ message: "Failed to create working calendar" });
    }
  });

  // Project Analytics Routes
  app.get('/api/projects/:projectId/analytics', isAuthenticated, async (req, res) => {
    try {
      const analytics = await projectManagementService.getProjectAnalytics(req.params.projectId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching project analytics:", error);
      res.status(500).json({ message: "Failed to fetch project analytics" });
    }
  });

  const httpServer = createServer(app);
  // Microsoft Project Import endpoints
  app.post('/api/projects/:projectId/import/msproject', upload.single('msProjectFile'), isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó archivo' });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;
      const userId = req.user.claims.sub;

      // Validate file type
      const allowedExtensions = ['.mpp', '.xml'];
      const fileExtension = path.extname(fileName).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        fs.unlinkSync(filePath); // Clean up uploaded file
        return res.status(400).json({ 
          message: 'Tipo de archivo no soportado. Solo se permiten archivos .mpp y .xml' 
        });
      }

      // Import the file
      const { msProjectImportService } = await import('./msProjectImportService');
      const importId = await msProjectImportService.importMSProjectFile(
        filePath, 
        projectId, 
        userId, 
        fileName
      );

      res.json({ 
        message: 'Importación iniciada exitosamente',
        importId 
      });

    } catch (error) {
      console.error('Error importing MS Project file:', error);
      res.status(500).json({ 
        message: 'Error al importar archivo de Microsoft Project',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Get import history for a project
  app.get('/api/projects/:projectId/import/history', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const { msProjectImportService } = await import('./msProjectImportService');
      
      const importHistory = await msProjectImportService.getImportHistory(projectId);
      res.json(importHistory);
    } catch (error) {
      console.error('Error fetching import history:', error);
      res.status(500).json({ message: 'Error al obtener el historial de importaciones' });
    }
  });

  // Get import details
  app.get('/api/import/:importId', isAuthenticated, async (req, res) => {
    try {
      const { importId } = req.params;
      const { msProjectImportService } = await import('./msProjectImportService');
      
      const importDetails = await msProjectImportService.getImportDetails(importId);
      if (!importDetails) {
        return res.status(404).json({ message: 'Importación no encontrada' });
      }
      
      res.json(importDetails);
    } catch (error) {
      console.error('Error fetching import details:', error);
      res.status(500).json({ message: 'Error al obtener los detalles de la importación' });
    }
  });

  // Validate MS Project file before import
  app.post('/api/projects/:projectId/import/validate', upload.single('msProjectFile'), isAuthenticated, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó archivo' });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;

      // Validate file type
      const allowedExtensions = ['.mpp', '.xml'];
      const fileExtension = path.extname(fileName).toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        fs.unlinkSync(filePath); // Clean up uploaded file
        return res.status(400).json({ 
          message: 'Tipo de archivo no soportado. Solo se permiten archivos .mpp y .xml' 
        });
      }

      const { msProjectImportService } = await import('./msProjectImportService');
      const validation = await msProjectImportService.validateMSProjectFile(filePath);
      
      // Clean up uploaded file after validation
      fs.unlinkSync(filePath);
      
      res.json(validation);
    } catch (error) {
      console.error('Error validating MS Project file:', error);
      res.status(500).json({ 
        message: 'Error al validar archivo de Microsoft Project',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // Mock API routes for Investor Management (temporary implementation)
  app.get('/api/investor-statistics', isAuthenticated, async (req, res) => {
    try {
      const mockStats = {
        totalInvestors: 12,
        activeInvestors: 10,
        totalCommitments: "25000000",
        totalContributions: "18750000", 
        pendingCapitalCalls: 3,
        averageROI: 15.7
      };
      res.json(mockStats);
    } catch (error) {
      console.error("Error fetching investor statistics:", error);
      res.status(500).json({ message: "Failed to fetch investor statistics" });
    }
  });

  app.get('/api/investors', isAuthenticated, async (req, res) => {
    try {
      const mockInvestors = [
        {
          id: "inv-1",
          investorCode: "INV-001",
          firstName: "Carlos",
          lastName: "Rodríguez",
          email: "carlos.rodriguez@email.com",
          phone: "+52 55 1234 5678",
          taxId: "RORC850123ABC",
          investorType: "individual",
          totalCommitment: "2500000",
          totalContributed: "1875000",
          status: "activo",
          kycCompleted: true,
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15")
        },
        {
          id: "inv-2", 
          investorCode: "INV-002",
          firstName: "María",
          lastName: "González",
          email: "maria.gonzalez@email.com",
          phone: "+52 55 9876 5432",
          taxId: "GOMA900315XYZ",
          investorType: "individual",
          totalCommitment: "5000000",
          totalContributed: "3750000",
          status: "activo",
          kycCompleted: true,
          createdAt: new Date("2024-01-20"),
          updatedAt: new Date("2024-01-20")
        }
      ];
      res.json(mockInvestors);
    } catch (error) {
      console.error("Error fetching investors:", error);
      res.status(500).json({ message: "Failed to fetch investors" });
    }
  });

  app.post('/api/investors', isAuthenticated, async (req, res) => {
    try {
      const mockInvestor = {
        id: `inv-${Date.now()}`,
        ...req.body,
        status: "activo",
        kycCompleted: false,
        totalContributed: "0",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      res.status(201).json(mockInvestor);
    } catch (error) {
      console.error("Error creating investor:", error);
      res.status(500).json({ message: "Failed to create investor" });
    }
  });

  app.get('/api/capital-calls', isAuthenticated, async (req, res) => {
    try {
      const mockCapitalCalls = [
        {
          id: "cc-1",
          projectId: "5670e9b8-33e6-4a13-9102-ef62cb47fc0a",
          callNumber: 1,
          totalAmount: "5000000",
          callDate: new Date("2024-02-01"),
          dueDate: new Date("2024-02-15"),
          purpose: "Inicio de construcción - Fase 1",
          status: "pendiente",
          createdBy: "45547572",
          createdAt: new Date("2024-01-25")
        },
        {
          id: "cc-2",
          projectId: "5670e9b8-33e6-4a13-9102-ef62cb47fc0a", 
          callNumber: 2,
          totalAmount: "3500000",
          callDate: new Date("2024-03-01"),
          dueDate: new Date("2024-03-15"),
          purpose: "Adquisición de materiales especializados",
          status: "pagado_completo",
          createdBy: "45547572",
          createdAt: new Date("2024-02-20")
        }
      ];
      res.json(mockCapitalCalls);
    } catch (error) {
      console.error("Error fetching capital calls:", error);
      res.status(500).json({ message: "Failed to fetch capital calls" });
    }
  });

  app.post('/api/capital-calls', isAuthenticated, async (req, res) => {
    try {
      const mockCapitalCall = {
        id: `cc-${Date.now()}`,
        ...req.body,
        status: "pendiente",
        createdAt: new Date()
      };
      res.status(201).json(mockCapitalCall);
    } catch (error) {
      console.error("Error creating capital call:", error);
      res.status(500).json({ message: "Failed to create capital call" });
    }
  });

  return httpServer;
}
