import { db } from "./db";
import { 
  workflowTemplates, 
  workflowInstances, 
  workflowStepExecutions, 
  aiAutomationRules, 
  smartNotifications,
  projects,
  users
} from "@shared/schema";
import { eq, and, lt, isNull, desc } from "drizzle-orm";

export class WorkflowAutomationService {
  // Execute a workflow template
  async executeWorkflow(templateId: string, context: any, startedBy?: string) {
    const template = await db.select().from(workflowTemplates)
      .where(eq(workflowTemplates.id, templateId))
      .limit(1);
    
    if (!template.length || !template[0].isActive) {
      throw new Error("Workflow template not found or inactive");
    }

    const [instance] = await db.insert(workflowInstances).values({
      templateId,
      name: template[0].name,
      status: 'running',
      context,
      startedBy,
      priority: 'medium'
    }).returning();

    // Execute first step
    await this.executeNextStep(instance.id);
    
    return instance;
  }

  // Execute next workflow step
  async executeNextStep(instanceId: string) {
    const [instance] = await db.select().from(workflowInstances)
      .where(eq(workflowInstances.id, instanceId))
      .limit(1);

    if (!instance || instance.status !== 'running') {
      return;
    }

    const [template] = await db.select().from(workflowTemplates)
      .where(eq(workflowTemplates.id, instance.templateId))
      .limit(1);

    const steps = template.steps as any[];
    const currentStep = steps[instance.currentStep];

    if (!currentStep) {
      // Workflow completed
      await db.update(workflowInstances)
        .set({ 
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(workflowInstances.id, instanceId));
      return;
    }

    // Create step execution record
    const [stepExecution] = await db.insert(workflowStepExecutions).values({
      instanceId,
      stepIndex: instance.currentStep,
      stepName: currentStep.name,
      stepType: currentStep.type,
      status: 'running',
      input: currentStep.config || {}
    }).returning();

    try {
      let stepResult = null;
      
      switch (currentStep.type) {
        case 'notification':
          stepResult = await this.executeNotificationStep(currentStep, instance.context);
          break;
        case 'ai_analysis':
          stepResult = await this.executeAIAnalysisStep(currentStep, instance.context);
          break;
        case 'approval':
          stepResult = await this.executeApprovalStep(currentStep, instance.context);
          break;
        case 'condition':
          stepResult = await this.executeConditionStep(currentStep, instance.context);
          break;
        default:
          stepResult = { success: true, message: 'Step completed' };
      }

      // Update step execution
      await db.update(workflowStepExecutions)
        .set({
          status: 'completed',
          output: stepResult,
          completedAt: new Date()
        })
        .where(eq(workflowStepExecutions.id, stepExecution.id));

      // Move to next step
      await db.update(workflowInstances)
        .set({ 
          currentStep: instance.currentStep + 1,
          context: { ...instance.context, ...stepResult.context }
        })
        .where(eq(workflowInstances.id, instanceId));

      // Continue execution if step was successful
      if (stepResult.success !== false) {
        setTimeout(() => this.executeNextStep(instanceId), 100);
      }

    } catch (error) {
      // Handle step failure
      await db.update(workflowStepExecutions)
        .set({
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        })
        .where(eq(workflowStepExecutions.id, stepExecution.id));

      await db.update(workflowInstances)
        .set({ 
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        })
        .where(eq(workflowInstances.id, instanceId));
    }
  }

  // Execute notification step
  private async executeNotificationStep(step: any, context: any) {
    const notification = {
      userId: step.config.userId || context.userId,
      title: this.replaceVariables(step.config.title, context),
      message: this.replaceVariables(step.config.message, context),
      type: step.config.type || 'info',
      category: 'workflow',
      priority: step.config.priority || 'medium',
      entityType: context.entityType,
      entityId: context.entityId,
      actionRequired: step.config.actionRequired || false,
      actionUrl: step.config.actionUrl
    };

    await db.insert(smartNotifications).values(notification);
    
    return { 
      success: true, 
      message: 'Notification sent',
      context: { notificationSent: true }
    };
  }

  // Execute AI analysis step
  private async executeAIAnalysisStep(step: any, context: any) {
    // Simulate AI analysis - in real implementation, this would call OpenAI API
    const analysis = {
      confidence: 0.85,
      recommendations: [
        "El proyecto está dentro del presupuesto esperado",
        "Se recomienda acelerar la fase de permisos"
      ],
      insights: [
        "Riesgo bajo de retrasos",
        "Oportunidad de optimización en costos"
      ]
    };

    return {
      success: true,
      message: 'AI analysis completed',
      context: { aiAnalysis: analysis }
    };
  }

  // Execute approval step
  private async executeApprovalStep(step: any, context: any) {
    // For approval steps, we mark as pending and wait for manual approval
    const notification = {
      userId: step.config.approverId,
      title: `Aprobación requerida: ${context.title || 'Workflow'}`,
      message: this.replaceVariables(step.config.message || 'Se requiere su aprobación para continuar', context),
      type: 'warning',
      category: 'approval',
      priority: 'high',
      entityType: context.entityType,
      entityId: context.entityId,
      actionRequired: true,
      actionUrl: `/approvals/${context.entityId}`
    };

    await db.insert(smartNotifications).values(notification);

    return {
      success: false, // This will pause the workflow
      message: 'Waiting for approval',
      context: { awaitingApproval: true, approverId: step.config.approverId }
    };
  }

  // Execute condition step
  private async executeConditionStep(step: any, context: any) {
    const condition = step.config.condition;
    let result = false;

    // Simple condition evaluation
    switch (condition.type) {
      case 'value_comparison':
        const value = this.getContextValue(context, condition.field);
        result = this.evaluateComparison(value, condition.operator, condition.value);
        break;
      case 'date_comparison':
        const date = new Date(this.getContextValue(context, condition.field));
        const compareDate = new Date(condition.value);
        result = this.evaluateDateComparison(date, condition.operator, compareDate);
        break;
    }

    return {
      success: true,
      message: `Condition evaluated: ${result}`,
      context: { conditionResult: result }
    };
  }

  // Process AI automation rules
  async processAIAutomationRules(entityType: string, entityId: string, entityData: any) {
    const rules = await db.select().from(aiAutomationRules)
      .where(and(
        eq(aiAutomationRules.entityType, entityType),
        eq(aiAutomationRules.isActive, true)
      ));

    for (const rule of rules) {
      const conditions = rule.conditions as any;
      const shouldTrigger = await this.evaluateAIConditions(conditions, entityData);

      if (shouldTrigger && shouldTrigger.confidence >= rule.confidence_threshold) {
        await this.executeAIActions(rule.actions as any, {
          entityType,
          entityId,
          ...entityData,
          aiConfidence: shouldTrigger.confidence
        });

        // Update rule statistics
        await db.update(aiAutomationRules)
          .set({
            lastTriggered: new Date(),
            triggerCount: rule.triggerCount + 1
          })
          .where(eq(aiAutomationRules.id, rule.id));
      }
    }
  }

  // Evaluate AI conditions (simplified)
  private async evaluateAIConditions(conditions: any, entityData: any) {
    // Simulate AI condition evaluation
    // In real implementation, this would use machine learning models
    
    let confidence = 0.75; // Base confidence
    
    for (const condition of conditions) {
      switch (condition.type) {
        case 'budget_analysis':
          if (entityData.budget && entityData.spent) {
            const percentage = (entityData.spent / entityData.budget) * 100;
            if (percentage > condition.threshold) {
              confidence = Math.min(confidence + 0.1, 1.0);
            }
          }
          break;
        case 'timeline_analysis':
          if (entityData.dueDate) {
            const daysUntilDue = Math.ceil((new Date(entityData.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < condition.daysThreshold) {
              confidence = Math.min(confidence + 0.15, 1.0);
            }
          }
          break;
      }
    }

    return { confidence, shouldTrigger: confidence > 0.8 };
  }

  // Execute AI-driven actions
  private async executeAIActions(actions: any[], context: any) {
    for (const action of actions) {
      switch (action.type) {
        case 'create_notification':
          await db.insert(smartNotifications).values({
            userId: action.userId,
            title: action.title,
            message: this.replaceVariables(action.message, context),
            type: 'ai_insight',
            category: 'ai_recommendation',
            priority: action.priority || 'medium',
            entityType: context.entityType,
            entityId: context.entityId
          });
          break;
        case 'trigger_workflow':
          await this.executeWorkflow(action.workflowTemplateId, context);
          break;
      }
    }
  }

  // Helper methods
  private replaceVariables(template: string, context: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return context[variable] || match;
    });
  }

  private getContextValue(context: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], context);
  }

  private evaluateComparison(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case '>': return value > compareValue;
      case '<': return value < compareValue;
      case '>=': return value >= compareValue;
      case '<=': return value <= compareValue;
      case '==': return value == compareValue;
      case '!=': return value != compareValue;
      default: return false;
    }
  }

  private evaluateDateComparison(date: Date, operator: string, compareDate: Date): boolean {
    switch (operator) {
      case 'before': return date < compareDate;
      case 'after': return date > compareDate;
      case 'equals': return date.getTime() === compareDate.getTime();
      default: return false;
    }
  }

  // Get workflow templates
  async getWorkflowTemplates(category?: string) {
    const query = db.select().from(workflowTemplates)
      .where(eq(workflowTemplates.isActive, true));
    
    if (category) {
      query.where(eq(workflowTemplates.category, category));
    }
    
    return await query.orderBy(desc(workflowTemplates.createdAt));
  }

  // Get workflow instances
  async getWorkflowInstances(limit = 50) {
    return await db.select().from(workflowInstances)
      .orderBy(desc(workflowInstances.startedAt))
      .limit(limit);
  }

  // Get smart notifications for user
  async getSmartNotifications(userId: string, unreadOnly = false) {
    const query = db.select().from(smartNotifications)
      .where(eq(smartNotifications.userId, userId));
    
    if (unreadOnly) {
      query.where(eq(smartNotifications.isRead, false));
    }
    
    return await query.orderBy(desc(smartNotifications.createdAt));
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string) {
    await db.update(smartNotifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(smartNotifications.id, notificationId));
  }
}

export const workflowAutomationService = new WorkflowAutomationService();