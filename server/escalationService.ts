import { storage } from "./storage";
import { eq, and, lt, sql } from "drizzle-orm";

export interface EscalationRule {
  workflowType: string;
  reminderHours: number[];
  escalationHours: number;
  finalEscalationHours: number;
  maxAttempts: number;
}

// Configuración de reglas de escalamiento por tipo de workflow
const ESCALATION_RULES: Record<string, EscalationRule> = {
  pago: {
    workflowType: 'pago',
    reminderHours: [24, 48, 72], // Recordatorios a las 24h, 48h, 72h
    escalationHours: 96, // Escalamiento a las 96h (4 días)
    finalEscalationHours: 168, // Escalamiento final a las 168h (7 días)
    maxAttempts: 3,
  },
  contratacion: {
    workflowType: 'contratacion',
    reminderHours: [48, 96], // Recordatorios a las 48h, 96h
    escalationHours: 120, // Escalamiento a las 120h (5 días)
    finalEscalationHours: 240, // Escalamiento final a las 240h (10 días)
    maxAttempts: 2,
  },
  orden_cambio: {
    workflowType: 'orden_cambio',
    reminderHours: [12, 24, 48], // Recordatorios más frecuentes para cambios urgentes
    escalationHours: 72, // Escalamiento a las 72h (3 días)
    finalEscalationHours: 120, // Escalamiento final a las 120h (5 días)
    maxAttempts: 3,
  },
  liberacion_credito: {
    workflowType: 'liberacion_credito',
    reminderHours: [6, 12, 24], // Recordatorios urgentes para créditos
    escalationHours: 48, // Escalamiento a las 48h (2 días)
    finalEscalationHours: 96, // Escalamiento final a las 96h (4 días)
    maxAttempts: 4,
  },
  capital_call: {
    workflowType: 'capital_call',
    reminderHours: [24, 48], // Recordatorios para capital calls
    escalationHours: 72, // Escalamiento a las 72h (3 días)
    finalEscalationHours: 144, // Escalamiento final a las 144h (6 días)
    maxAttempts: 2,
  },
};

export class EscalationService {
  // Procesar todos los workflows pendientes para escalamiento
  async processEscalations(): Promise<void> {
    console.log('[Escalation Service] Iniciando proceso de escalamiento...');
    
    try {
      const pendingWorkflows = await storage.getPendingWorkflowsForEscalation();
      
      for (const workflow of pendingWorkflows) {
        await this.processWorkflowEscalation(workflow);
      }
      
      console.log(`[Escalation Service] Procesados ${pendingWorkflows.length} workflows`);
    } catch (error) {
      console.error('[Escalation Service] Error procesando escalamientos:', error);
    }
  }

  // Procesar escalamiento de un workflow específico
  private async processWorkflowEscalation(workflow: any): Promise<void> {
    const rule = ESCALATION_RULES[workflow.workflowType];
    if (!rule) {
      console.warn(`[Escalation Service] No hay reglas para el tipo: ${workflow.workflowType}`);
      return;
    }

    const now = new Date();
    const createdAt = new Date(workflow.createdAt);
    const hoursElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));

    // Verificar si necesita recordatorios
    await this.checkAndSendReminders(workflow, rule, hoursElapsed);

    // Verificar si necesita escalamiento
    await this.checkAndEscalate(workflow, rule, hoursElapsed);
  }

  // Enviar recordatorios progresivos
  private async checkAndSendReminders(workflow: any, rule: EscalationRule, hoursElapsed: number): Promise<void> {
    for (const reminderHour of rule.reminderHours) {
      if (hoursElapsed >= reminderHour) {
        const existingReminder = await storage.getNotificationByWorkflowAndType(
          workflow.id, 
          'reminder', 
          reminderHour
        );

        if (!existingReminder) {
          await this.sendReminderNotification(workflow, reminderHour);
          
          // Crear registro de escalamiento
          await storage.createEscalationRecord({
            workflowId: workflow.id,
            escalationType: 'reminder',
            triggerHours: reminderHour,
            targetUserId: workflow.currentApprover || workflow.requestedBy,
            message: `Recordatorio: Workflow "${workflow.title}" pendiente desde hace ${reminderHour} horas`,
            isProcessed: true,
          });
        }
      }
    }
  }

  // Procesar escalamientos de autoridad
  private async checkAndEscalate(workflow: any, rule: EscalationRule, hoursElapsed: number): Promise<void> {
    // Escalamiento regular
    if (hoursElapsed >= rule.escalationHours) {
      const existingEscalation = await storage.getEscalationByWorkflowAndType(
        workflow.id, 
        'escalation'
      );

      if (!existingEscalation) {
        await this.escalateToSupervisor(workflow, rule.escalationHours);
      }
    }

    // Escalamiento final
    if (hoursElapsed >= rule.finalEscalationHours) {
      const existingFinalEscalation = await storage.getEscalationByWorkflowAndType(
        workflow.id, 
        'final_escalation'
      );

      if (!existingFinalEscalation) {
        await this.escalateToExecutive(workflow, rule.finalEscalationHours);
      }
    }
  }

  // Enviar notificación de recordatorio
  private async sendReminderNotification(workflow: any, hours: number): Promise<void> {
    const message = this.generateReminderMessage(workflow, hours);
    
    await storage.createWorkflowNotification({
      workflowId: workflow.id,
      recipientId: workflow.currentApprover || workflow.requestedBy,
      notificationType: 'reminder',
      message: message,
      priority: hours > 48 ? 'high' : 'medium',
      metadata: { hours, type: 'reminder' },
    });

    console.log(`[Escalation Service] Recordatorio enviado para workflow ${workflow.id} (${hours}h)`);
  }

  // Escalar a supervisor
  private async escalateToSupervisor(workflow: any, hours: number): Promise<void> {
    const supervisor = await this.findSupervisor(workflow.currentApprover || workflow.requestedBy);
    
    if (supervisor) {
      // Actualizar el workflow con el nuevo aprobador
      await storage.updateAuthorizationWorkflow(workflow.id, {
        currentApprover: supervisor.id,
        status: 'escalado',
        escalatedAt: new Date(),
      });

      // Notificar al supervisor
      await storage.createWorkflowNotification({
        workflowId: workflow.id,
        recipientId: supervisor.id,
        notificationType: 'escalation',
        message: `Workflow escalado: "${workflow.title}" requiere su aprobación urgente (${hours}h sin respuesta)`,
        priority: 'high',
        metadata: { hours, type: 'escalation', originalApprover: workflow.currentApprover },
      });

      // Crear registro de escalamiento
      await storage.createEscalationRecord({
        workflowId: workflow.id,
        escalationType: 'escalation',
        triggerHours: hours,
        targetUserId: supervisor.id,
        previousApprover: workflow.currentApprover,
        message: `Escalado a supervisor por falta de respuesta en ${hours} horas`,
        isProcessed: true,
      });

      console.log(`[Escalation Service] Workflow ${workflow.id} escalado a supervisor ${supervisor.id}`);
    }
  }

  // Escalar a nivel ejecutivo
  private async escalateToExecutive(workflow: any, hours: number): Promise<void> {
    const executives = await this.findExecutives();
    
    for (const executive of executives) {
      await storage.createWorkflowNotification({
        workflowId: workflow.id,
        recipientId: executive.id,
        notificationType: 'final_escalation',
        message: `ESCALAMIENTO CRÍTICO: Workflow "${workflow.title}" sin aprobación por ${hours} horas`,
        priority: 'critical',
        metadata: { hours, type: 'final_escalation' },
      });
    }

    // Marcar como escalamiento crítico
    await storage.updateAuthorizationWorkflow(workflow.id, {
      status: 'escalamiento_critico',
      finalEscalatedAt: new Date(),
    });

    // Crear registro de escalamiento final
    await storage.createEscalationRecord({
      workflowId: workflow.id,
      escalationType: 'final_escalation',
      triggerHours: hours,
      targetUserId: executives[0]?.id,
      message: `Escalamiento final por falta de respuesta en ${hours} horas`,
      isProcessed: true,
    });

    console.log(`[Escalation Service] Workflow ${workflow.id} escalado a nivel ejecutivo`);
  }

  // Encontrar supervisor de un usuario
  private async findSupervisor(userId: string): Promise<any> {
    // Lógica para encontrar el supervisor basado en la jerarquía organizacional
    // Por ahora, buscaremos usuarios con rol 'admin' o 'supervisor'
    const supervisors = await storage.getUsersByRole(['admin', 'supervisor']);
    return supervisors.find(s => s.id !== userId) || supervisors[0];
  }

  // Encontrar ejecutivos
  private async findExecutives(): Promise<any[]> {
    return await storage.getUsersByRole(['admin', 'executive']);
  }

  // Generar mensaje de recordatorio personalizado
  private generateReminderMessage(workflow: any, hours: number): string {
    const urgencyLevel = hours > 72 ? 'URGENTE' : hours > 48 ? 'IMPORTANTE' : 'RECORDATORIO';
    
    return `${urgencyLevel}: El workflow "${workflow.title}" está pendiente de aprobación desde hace ${hours} horas. ` +
           `Tipo: ${workflow.workflowType.replace('_', ' ').toUpperCase()}, ` +
           `Monto: $${workflow.amount}. ` +
           `Por favor, revise y tome una decisión lo antes posible.`;
  }

  // Obtener estadísticas de escalamiento
  async getEscalationStats(): Promise<any> {
    return await storage.getEscalationStatistics();
  }

  // Obtener workflows en riesgo de escalamiento
  async getWorkflowsAtRisk(): Promise<any[]> {
    return await storage.getWorkflowsNearEscalation();
  }
}

// Instancia singleton del servicio
export const escalationService = new EscalationService();

// Función para inicializar el servicio de escalamiento automático
export function startEscalationService(): void {
  console.log('[Escalation Service] Iniciando servicio de escalamiento automático...');
  
  // Ejecutar cada hora
  const ESCALATION_INTERVAL = 60 * 60 * 1000; // 1 hora en milisegundos
  
  setInterval(async () => {
    try {
      await escalationService.processEscalations();
    } catch (error) {
      console.error('[Escalation Service] Error en proceso automático:', error);
    }
  }, ESCALATION_INTERVAL);

  // Ejecutar inmediatamente al iniciar
  setTimeout(() => {
    escalationService.processEscalations();
  }, 5000); // Esperar 5 segundos después del inicio
  
  console.log('[Escalation Service] Servicio configurado para ejecutar cada hora');
}