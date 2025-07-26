import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertProjectSchema,
  insertPermitSchema,
  insertBudgetCategorySchema,
  insertBudgetItemSchema,
  insertDocumentSchema,
  insertCalendarEventSchema,
  insertWbsItemSchema,
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

  const httpServer = createServer(app);
  return httpServer;
}
