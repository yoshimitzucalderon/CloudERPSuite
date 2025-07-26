import { db } from "./db";
import { 
  documentLibrary, 
  documentVersions, 
  documentApprovalWorkflows,
  documentApprovalSteps,
  documentActivityLog,
  documentPermissions,
  documentTemplates,
  documentShares,
  users
} from "@shared/schema";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export class DocumentService {
  private uploadPath = "./uploads/documents";

  constructor() {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  // Calculate file checksum for integrity verification
  private async calculateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  // OCR simulation (in real implementation, use services like AWS Textract, Google Vision API, etc.)
  private async performOCR(filePath: string, mimeType: string): Promise<{ text: string; confidence: number }> {
    // Simulate OCR processing
    if (mimeType.includes('pdf')) {
      return {
        text: "Texto extraído del documento PDF mediante OCR. Contrato de compraventa con todas las cláusulas correspondientes...",
        confidence: 0.95
      };
    } else if (mimeType.includes('image')) {
      return {
        text: "Texto extraído de imagen mediante OCR. Licencia de construcción número 12345...",
        confidence: 0.88
      };
    }
    return { text: "", confidence: 0 };
  }

  // Upload and process document
  async uploadDocument(fileData: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  }, metadata: {
    name: string;
    description?: string;
    category: string;
    projectId?: string;
    entityType?: string;
    entityId?: string;
    tags?: string[];
    customFields?: any;
    userId: string;
  }) {
    const fileExtension = path.extname(fileData.originalName);
    const fileName = `${Date.now()}_${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, fileName);

    // Save file to disk
    await fs.writeFile(filePath, fileData.buffer);

    // Calculate checksum
    const checksum = await this.calculateChecksum(filePath);

    // Create document record
    const [document] = await db.insert(documentLibrary).values({
      name: metadata.name,
      description: metadata.description,
      category: metadata.category as any,
      fileName: fileData.originalName,
      fileSize: fileData.size,
      mimeType: fileData.mimeType,
      filePath: fileName, // Store relative path
      checksum,
      projectId: metadata.projectId,
      entityType: metadata.entityType,
      entityId: metadata.entityId,
      tags: metadata.tags,
      customFields: metadata.customFields,
      createdBy: metadata.userId,
      ownerId: metadata.userId,
      ocrStatus: 'pending'
    }).returning();

    // Log activity
    await this.logActivity(document.id, metadata.userId, 'created', {
      fileName: fileData.originalName,
      fileSize: fileData.size
    });

    // Start OCR processing (async)
    this.processOCRAsync(document.id, filePath, fileData.mimeType);

    return document;
  }

  // Async OCR processing
  private async processOCRAsync(documentId: string, filePath: string, mimeType: string) {
    try {
      // Update status to processing
      await db.update(documentLibrary)
        .set({ ocrStatus: 'processing' })
        .where(eq(documentLibrary.id, documentId));

      // Perform OCR
      const ocrResult = await this.performOCR(filePath, mimeType);

      // Update document with OCR results
      await db.update(documentLibrary)
        .set({
          extractedText: ocrResult.text,
          ocrStatus: 'completed',
          ocrConfidence: ocrResult.confidence
        })
        .where(eq(documentLibrary.id, documentId));

    } catch (error) {
      console.error('OCR processing failed:', error);
      await db.update(documentLibrary)
        .set({ ocrStatus: 'failed' })
        .where(eq(documentLibrary.id, documentId));
    }
  }

  // Create new version of document
  async createNewVersion(documentId: string, fileData: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  }, changes: string, userId: string) {
    const [originalDoc] = await db.select().from(documentLibrary)
      .where(eq(documentLibrary.id, documentId))
      .limit(1);

    if (!originalDoc) {
      throw new Error('Document not found');
    }

    // Mark current version as not latest
    await db.update(documentLibrary)
      .set({ isLatestVersion: false })
      .where(eq(documentLibrary.id, documentId));

    // Save old version to versions table
    await db.insert(documentVersions).values({
      documentId,
      version: originalDoc.version,
      fileName: originalDoc.fileName,
      filePath: originalDoc.filePath,
      fileSize: originalDoc.fileSize,
      changes: 'Previous version',
      createdBy: originalDoc.createdBy
    });

    // Generate new version number
    const versionParts = originalDoc.version.split('.');
    const newVersion = `${versionParts[0]}.${parseInt(versionParts[1]) + 1}`;

    // Upload new file
    const fileExtension = path.extname(fileData.originalName);
    const fileName = `${Date.now()}_${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, fileName);
    await fs.writeFile(filePath, fileData.buffer);

    const checksum = await this.calculateChecksum(filePath);

    // Update document with new version
    const [updatedDoc] = await db.update(documentLibrary)
      .set({
        fileName: fileData.originalName,
        fileSize: fileData.size,
        mimeType: fileData.mimeType,
        filePath: fileName,
        checksum,
        version: newVersion,
        isLatestVersion: true,
        updatedAt: new Date(),
        ocrStatus: 'pending'
      })
      .where(eq(documentLibrary.id, documentId))
      .returning();

    // Log version creation
    await this.logActivity(documentId, userId, 'updated', {
      newVersion,
      changes,
      fileName: fileData.originalName
    });

    // Start OCR for new version
    this.processOCRAsync(documentId, filePath, fileData.mimeType);

    return updatedDoc;
  }

  // Start approval workflow
  async startApprovalWorkflow(documentId: string, workflowConfig: {
    name: string;
    steps: Array<{
      approverRole: string;
      approverId?: string;
      deadline?: Date;
    }>;
  }, userId: string) {
    // Create workflow
    const [workflow] = await db.insert(documentApprovalWorkflows).values({
      documentId,
      workflowName: workflowConfig.name,
      status: 'in_progress',
      totalSteps: workflowConfig.steps.length,
      approvalSteps: workflowConfig.steps,
      createdBy: userId
    }).returning();

    // Create individual steps
    for (let i = 0; i < workflowConfig.steps.length; i++) {
      const step = workflowConfig.steps[i];
      await db.insert(documentApprovalSteps).values({
        workflowId: workflow.id,
        stepOrder: i + 1,
        approverRole: step.approverRole,
        approverId: step.approverId,
        deadline: step.deadline,
        status: i === 0 ? 'pending' : 'pending' // First step starts as pending
      });
    }

    // Update document status
    await db.update(documentLibrary)
      .set({ status: 'revision' })
      .where(eq(documentLibrary.id, documentId));

    // Log activity
    await this.logActivity(documentId, userId, 'approval_started', {
      workflowName: workflowConfig.name,
      totalSteps: workflowConfig.steps.length
    });

    return workflow;
  }

  // Approve/reject document step
  async processApprovalStep(stepId: string, decision: 'approved' | 'rejected', comments: string, userId: string) {
    const [step] = await db.select().from(documentApprovalSteps)
      .where(eq(documentApprovalSteps.id, stepId))
      .limit(1);

    if (!step) {
      throw new Error('Approval step not found');
    }

    // Update step
    await db.update(documentApprovalSteps)
      .set({
        status: decision,
        comments,
        [decision === 'approved' ? 'approvedAt' : 'rejectedAt']: new Date()
      })
      .where(eq(documentApprovalSteps.id, stepId));

    const [workflow] = await db.select().from(documentApprovalWorkflows)
      .where(eq(documentApprovalWorkflows.id, step.workflowId))
      .limit(1);

    if (decision === 'rejected') {
      // If rejected, stop workflow
      await db.update(documentApprovalWorkflows)
        .set({ 
          status: 'rejected',
          completedAt: new Date(),
          comments
        })
        .where(eq(documentApprovalWorkflows.id, step.workflowId));

      await db.update(documentLibrary)
        .set({ status: 'rechazado' })
        .where(eq(documentLibrary.id, workflow.documentId));

    } else {
      // Check if this was the last step
      const totalSteps = await db.select()
        .from(documentApprovalSteps)
        .where(eq(documentApprovalSteps.workflowId, step.workflowId));

      const approvedSteps = totalSteps.filter(s => s.status === 'approved').length;

      if (approvedSteps === totalSteps.length) {
        // All steps approved
        await db.update(documentApprovalWorkflows)
          .set({
            status: 'approved',
            completedAt: new Date()
          })
          .where(eq(documentApprovalWorkflows.id, step.workflowId));

        await db.update(documentLibrary)
          .set({ status: 'aprobado' })
          .where(eq(documentLibrary.id, workflow.documentId));
      } else {
        // Move to next step
        await db.update(documentApprovalWorkflows)
          .set({ currentStep: step.stepOrder })
          .where(eq(documentApprovalWorkflows.id, step.workflowId));
      }
    }

    // Log activity
    await this.logActivity(workflow.documentId, userId, decision, {
      stepOrder: step.stepOrder,
      comments
    });
  }

  // Search documents with advanced filters
  async searchDocuments(filters: {
    query?: string;
    category?: string;
    status?: string;
    projectId?: string;
    userId?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }) {
    let query = db.select({
      document: documentLibrary,
      createdByUser: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(documentLibrary)
    .leftJoin(users, eq(documentLibrary.createdBy, users.id));

    const conditions = [];

    if (filters.query) {
      conditions.push(
        or(
          like(documentLibrary.name, `%${filters.query}%`),
          like(documentLibrary.extractedText, `%${filters.query}%`),
          like(documentLibrary.description, `%${filters.query}%`)
        )
      );
    }

    if (filters.category) {
      conditions.push(eq(documentLibrary.category, filters.category));
    }

    if (filters.status) {
      conditions.push(eq(documentLibrary.status, filters.status));
    }

    if (filters.projectId) {
      conditions.push(eq(documentLibrary.projectId, filters.projectId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(documentLibrary.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    return results;
  }

  // Log document activity
  private async logActivity(documentId: string, userId: string, action: string, details: any = {}) {
    await db.insert(documentActivityLog).values({
      documentId,
      userId,
      action,
      details
    });
  }

  // Get document with full details
  async getDocumentDetails(documentId: string) {
    const [document] = await db.select()
      .from(documentLibrary)
      .where(eq(documentLibrary.id, documentId))
      .limit(1);

    if (!document) return null;

    // Get versions
    const versions = await db.select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.createdAt));

    // Get approval workflows
    const workflows = await db.select()
      .from(documentApprovalWorkflows)
      .where(eq(documentApprovalWorkflows.documentId, documentId))
      .orderBy(desc(documentApprovalWorkflows.createdAt));

    // Get activity log
    const activities = await db.select({
      activity: documentActivityLog,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(documentActivityLog)
    .leftJoin(users, eq(documentActivityLog.userId, users.id))
    .where(eq(documentActivityLog.documentId, documentId))
    .orderBy(desc(documentActivityLog.createdAt))
    .limit(20);

    return {
      document,
      versions,
      workflows,
      activities
    };
  }

  // Get user's document permissions
  async getUserDocumentPermissions(userId: string, documentId: string) {
    const permissions = await db.select()
      .from(documentPermissions)
      .where(
        and(
          eq(documentPermissions.documentId, documentId),
          eq(documentPermissions.userId, userId)
        )
      );

    return permissions;
  }

  // Create document share link
  async createShareLink(documentId: string, config: {
    shareType: 'public' | 'protected' | 'private';
    accessLevel: 'view' | 'download' | 'comment';
    password?: string;
    expiresAt?: Date;
    maxDownloads?: number;
  }, userId: string) {
    const shareToken = crypto.randomUUID();

    const [share] = await db.insert(documentShares).values({
      documentId,
      shareToken,
      shareType: config.shareType,
      accessLevel: config.accessLevel,
      password: config.password,
      expiresAt: config.expiresAt,
      maxDownloads: config.maxDownloads,
      createdBy: userId
    }).returning();

    return share;
  }
}

export const documentService = new DocumentService();