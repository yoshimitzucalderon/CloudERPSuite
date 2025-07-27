export const storage = { 
  upsertUser: async (userData: any) => {
    console.log('Development mode: User would be saved:', userData);
  },
  getUser: async (id: string) => {
    return {
      id,
      email: 'dev@localhost',
      firstName: 'Development',
      lastName: 'User',
      profileImageUrl: ''
    };
  },
  getDashboardMetrics: async () => {
    return { projects: 0, users: 1, revenue: 0 };
  },
  getProjects: async () => {
    return [];
  },
  getProject: async (id: string) => {
    return null;
  },
  createProject: async (data: any) => {
    return { id: 'dev-project', ...data };
  },
  updateProject: async (id: string, data: any) => {
    return { id, ...data };
  },
  deleteProject: async (id: string) => {
    return true;
  },
  getPermits: async (projectId?: string) => {
    return [];
  },
  createPermit: async (data: any) => {
    return { id: 'dev-permit', ...data };
  },
  updatePermit: async (id: string, data: any) => {
    return { id, ...data };
  },
  getPendingWorkflowsForEscalation: async () => {
    return [];
  },
  
  // Budget methods
  getBudgetCategories: async () => {
    return [];
  },
  createBudgetCategory: async (data: any) => {
    return { id: 'dev-budget-category', ...data };
  },
  getBudgetItems: async (projectId: string) => {
    return [];
  },
  createBudgetItem: async (data: any) => {
    return { id: 'dev-budget-item', ...data };
  },
  updateBudgetItem: async (id: string, data: any) => {
    return { id, ...data };
  },
  
  // Document methods
  getDocuments: async (projectId?: string) => {
    return [];
  },
  createDocument: async (data: any) => {
    return { id: 'dev-document', ...data };
  },
  
  // Calendar methods
  getCalendarEvents: async (projectId?: string) => {
    return [];
  },
  createCalendarEvent: async (data: any) => {
    return { id: 'dev-calendar-event', ...data };
  },
  updateCalendarEvent: async (id: string, data: any) => {
    return { id, ...data };
  },
  
  // WBS methods
  getWbsItemsByProject: async (projectId: string) => {
    return [];
  },
  createWbsItem: async (data: any) => {
    return { id: 'dev-wbs-item', ...data };
  },
  updateWbsItem: async (id: string, data: any) => {
    return { id, ...data };
  },
  
  // Commercial management methods
  getLotsByProject: async (projectId: string) => {
    return [];
  },
  createLot: async (data: any) => {
    return { id: 'dev-lot', ...data };
  },
  getClients: async () => {
    return [];
  },
  createClient: async (data: any) => {
    return { id: 'dev-client', ...data };
  },
  getSalesContractsByProject: async (projectId: string) => {
    return [];
  },
  createSalesContract: async (data: any) => {
    return { id: 'dev-sales-contract', ...data };
  },
  
  // Authorization workflow methods
  getAuthorizationWorkflows: async (projectId?: string) => {
    return [];
  },
  createAuthorizationWorkflow: async (data: any) => {
    return { id: 'dev-auth-workflow', ...data };
  },
  updateAuthorizationWorkflow: async (id: string, data: any) => {
    return { id, ...data };
  },
  getAuthorizationWorkflow: async (id: string) => {
    return null;
  },
  getAuthorizationSteps: async (workflowId: string) => {
    return [];
  },
  createAuthorizationStep: async (data: any) => {
    return { id: 'dev-auth-step', ...data };
  },
  
  // Authorization matrix methods
  getAuthorizationMatrix: async () => {
    return [];
  },
  createAuthorizationMatrix: async (data: any) => {
    return { id: 'dev-auth-matrix', ...data };
  },
  
  // Multi-level workflow methods
  createMultiLevelWorkflow: async (data: any) => {
    return { 
      workflow: { id: 'dev-multi-workflow', ...data },
      steps: []
    };
  },
  
  // Workflow steps methods
  getWorkflowSteps: async (workflowId: string) => {
    return [];
  },
  updateWorkflowStep: async (id: string, data: any) => {
    return { id, ...data };
  },
  
  // Authority delegation methods
  getActiveAuthorityDelegations: async (delegateId: string) => {
    return [];
  },
  createAuthorityDelegation: async (data: any) => {
    return { id: 'dev-delegation', ...data };
  },
  revokeAuthorityDelegation: async (id: string) => {
    return { id, isActive: false };
  },
  getAuthorityDelegations: async () => {
    return [];
  },
  
  // Workflow notification methods
  getWorkflowNotifications: async (userId: string, unreadOnly?: boolean) => {
    return [];
  },
  markNotificationAsRead: async (id: string) => {
    return { id, isRead: true };
  },
  createWorkflowNotification: async (data: any) => {
    return { id: 'dev-notification', ...data };
  },
  
  // Pending approvals methods
  getWorkflowsRequiringApproval: async (userId: string) => {
    return [];
  },
  
  // Authorization metrics methods
  getAuthorizationMetrics: async () => {
    return {
      totalWorkflows: 0,
      pendingApprovals: 0,
      completedToday: 0,
      averageProcessingTime: 0
    };
  },
  
  // Recent workflows methods
  getRecentAuthorizationWorkflows: async () => {
    return [];
  },
  
  // Escalation methods
  getNotificationByWorkflowAndType: async (workflowId: string, notificationType: string) => {
    return null;
  },
  createEscalationRecord: async (data: any) => {
    return { id: 'dev-escalation', ...data };
  },
  getEscalationByWorkflowAndType: async (workflowId: string, escalationType: string) => {
    return null;
  },
  getUsersByRole: async (roles: string[]) => {
    return [];
  },
  getEscalationStatistics: async () => {
    return {
      totalEscalations: 0,
      pendingEscalations: 0,
      resolvedEscalations: 0,
      averageResolutionTime: 0
    };
  },
  getWorkflowsNearEscalation: async () => {
    return [];
  }
};
