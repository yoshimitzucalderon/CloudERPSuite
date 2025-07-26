// Simple in-memory store for approval states during demo
interface ApprovalState {
  capitalCallId: string;
  userId: string;
  userName: string;
  action: 'approve' | 'reject' | 'reverse';
  comments?: string;
  timestamp: Date;
}

class ApprovalStore {
  private approvals: Map<string, ApprovalState[]> = new Map();

  addApproval(approval: ApprovalState) {
    const key = approval.capitalCallId;
    if (!this.approvals.has(key)) {
      this.approvals.set(key, []);
    }
    
    const approvals = this.approvals.get(key)!;
    
    // Remove any previous approval from the same user for this capital call
    const filtered = approvals.filter(a => a.userId !== approval.userId);
    
    // Add the new approval
    filtered.push(approval);
    
    this.approvals.set(key, filtered);
  }

  getApprovals(capitalCallId: string): ApprovalState[] {
    return this.approvals.get(capitalCallId) || [];
  }

  getUserApproval(capitalCallId: string, userId: string): ApprovalState | undefined {
    const approvals = this.getApprovals(capitalCallId);
    return approvals.find(a => a.userId === userId);
  }

  clear() {
    this.approvals.clear();
  }
}

export const approvalStore = new ApprovalStore();