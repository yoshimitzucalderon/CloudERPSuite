import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { escalationService } from "./escalationService";
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

  // Investor Routes
  app.get('/api/investors', isAuthenticated, async (req, res) => {
    try {
      const investors = await storage.getInvestors();
      res.json(investors);
    } catch (error) {
      console.error("Error fetching investors:", error);
      res.status(500).json({ message: "Failed to fetch investors" });
    }
  });

  app.post('/api/investors', isAuthenticated, async (req, res) => {
    try {
      const result = insertInvestorSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const investor = await storage.createInvestor(result.data);
      res.json(investor);
    } catch (error) {
      console.error("Error creating investor:", error);
      res.status(500).json({ message: "Failed to create investor" });
    }
  });

  // Capital Call Routes
  app.get('/api/capital-calls/:projectId', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.params;
      const capitalCalls = await storage.getCapitalCalls(projectId);
      res.json(capitalCalls);
    } catch (error) {
      console.error("Error fetching capital calls:", error);
      res.status(500).json({ message: "Failed to fetch capital calls" });
    }
  });

  app.post('/api/capital-calls', isAuthenticated, async (req: any, res) => {
    try {
      const capitalCallData = {
        ...req.body,
        createdBy: req.user.claims.sub,
      };
      const result = insertCapitalCallSchema.safeParse(capitalCallData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid data", errors: result.error.errors });
      }
      
      const capitalCall = await storage.createCapitalCall(result.data);
      res.json(capitalCall);
    } catch (error) {
      console.error("Error creating capital call:", error);
      res.status(500).json({ message: "Failed to create capital call" });
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

  const httpServer = createServer(app);
  return httpServer;
}
