import { storage } from "./storage";
import {
  investors,
  investorParticipations,
  capitalCalls,
  capitalCallNotices,
  investorDistributions,
  roiReports,
  type Investor,
  type InvestorParticipation,
  type CapitalCall,
  type CapitalCallNotice,
  type InvestorDistribution,
  type RoiReport,
  type InsertInvestor,
  type InsertInvestorParticipation,
  type InsertCapitalCall,
  type InsertCapitalCallNotice,
  type InsertInvestorDistribution,
  type InsertRoiReport,
} from "@shared/schema";
import { eq, and, desc, sum, count, avg } from "drizzle-orm";
import { db } from "./db";

export class InvestorService {
  // Investor Management
  async createInvestor(investorData: InsertInvestor): Promise<Investor> {
    // Generate unique investor code
    const investorCode = await this.generateInvestorCode();
    
    const [investor] = await db
      .insert(investors)
      .values({
        ...investorData,
        investorCode,
      })
      .returning();
    
    return investor;
  }

  async getInvestors(): Promise<Investor[]> {
    return await db
      .select()
      .from(investors)
      .orderBy(desc(investors.createdAt));
  }

  async getInvestor(id: string): Promise<Investor | undefined> {
    const [investor] = await db
      .select()
      .from(investors)
      .where(eq(investors.id, id));
    
    return investor;
  }

  async updateInvestor(id: string, updates: Partial<InsertInvestor>): Promise<Investor> {
    const [investor] = await db
      .update(investors)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(investors.id, id))
      .returning();
    
    return investor;
  }

  async deleteInvestor(id: string): Promise<void> {
    await db
      .delete(investors)
      .where(eq(investors.id, id));
  }

  // Investor Participation Management
  async createInvestorParticipation(participationData: InsertInvestorParticipation): Promise<InvestorParticipation> {
    const [participation] = await db
      .insert(investorParticipations)
      .values({
        ...participationData,
        pendingAmount: participationData.investmentAmount,
      })
      .returning();
    
    return participation;
  }

  async getInvestorParticipations(investorId?: string, projectId?: string): Promise<InvestorParticipation[]> {
    let query = db.select().from(investorParticipations);
    
    if (investorId && projectId) {
      query = query.where(and(
        eq(investorParticipations.investorId, investorId),
        eq(investorParticipations.projectId, projectId)
      ));
    } else if (investorId) {
      query = query.where(eq(investorParticipations.investorId, investorId));
    } else if (projectId) {
      query = query.where(eq(investorParticipations.projectId, projectId));
    }
    
    return await query.orderBy(desc(investorParticipations.createdAt));
  }

  async updateInvestorParticipation(id: string, updates: Partial<InsertInvestorParticipation>): Promise<InvestorParticipation> {
    const [participation] = await db
      .update(investorParticipations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(investorParticipations.id, id))
      .returning();
    
    return participation;
  }

  // Capital Calls Management
  async createCapitalCall(capitalCallData: InsertCapitalCall): Promise<CapitalCall> {
    // Generate unique call number
    const callNumber = await this.generateCallNumber();
    
    const [capitalCall] = await db
      .insert(capitalCalls)
      .values({
        ...capitalCallData,
        callNumber,
        pendingAmount: capitalCallData.totalAmount,
      })
      .returning();
    
    // Create individual notices for all investors in the project
    await this.createCapitalCallNotices(capitalCall.id, capitalCall.projectId);
    
    return capitalCall;
  }

  async getCapitalCalls(projectId?: string): Promise<CapitalCall[]> {
    let query = db.select().from(capitalCalls);
    
    if (projectId) {
      query = query.where(eq(capitalCalls.projectId, projectId));
    }
    
    return await query.orderBy(desc(capitalCalls.createdAt));
  }

  async getCapitalCall(id: string): Promise<CapitalCall | undefined> {
    const [capitalCall] = await db
      .select()
      .from(capitalCalls)
      .where(eq(capitalCalls.id, id));
    
    return capitalCall;
  }

  async updateCapitalCall(id: string, updates: Partial<InsertCapitalCall>): Promise<CapitalCall> {
    const [capitalCall] = await db
      .update(capitalCalls)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(capitalCalls.id, id))
      .returning();
    
    return capitalCall;
  }

  // Capital Call Notices Management
  async createCapitalCallNotices(capitalCallId: string, projectId: string): Promise<void> {
    // Get all investors participating in the project
    const participations = await db
      .select()
      .from(investorParticipations)
      .where(and(
        eq(investorParticipations.projectId, projectId),
        eq(investorParticipations.isActive, true)
      ));

    // Get the capital call details
    const [capitalCall] = await db
      .select()
      .from(capitalCalls)
      .where(eq(capitalCalls.id, capitalCallId));

    if (!capitalCall) return;

    // Create notices for each investor based on their participation percentage
    const notices: InsertCapitalCallNotice[] = participations.map(participation => ({
      capitalCallId,
      investorId: participation.investorId,
      amountDue: (Number(capitalCall.totalAmount) * participation.participationPercentage / 100).toString(),
    }));

    if (notices.length > 0) {
      await db.insert(capitalCallNotices).values(notices);
    }
  }

  async getCapitalCallNotices(capitalCallId?: string, investorId?: string): Promise<CapitalCallNotice[]> {
    let query = db.select().from(capitalCallNotices);
    
    if (capitalCallId && investorId) {
      query = query.where(and(
        eq(capitalCallNotices.capitalCallId, capitalCallId),
        eq(capitalCallNotices.investorId, investorId)
      ));
    } else if (capitalCallId) {
      query = query.where(eq(capitalCallNotices.capitalCallId, capitalCallId));
    } else if (investorId) {
      query = query.where(eq(capitalCallNotices.investorId, investorId));
    }
    
    return await query.orderBy(desc(capitalCallNotices.createdAt));
  }

  async updateCapitalCallNotice(id: string, updates: Partial<InsertCapitalCallNotice>): Promise<CapitalCallNotice> {
    const [notice] = await db
      .update(capitalCallNotices)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(capitalCallNotices.id, id))
      .returning();
    
    // Update the capital call totals
    await this.updateCapitalCallTotals(notice.capitalCallId);
    
    return notice;
  }

  async recordCapitalCallPayment(noticeId: string, amountPaid: string, paymentReference?: string): Promise<CapitalCallNotice> {
    const [notice] = await db
      .select()
      .from(capitalCallNotices)
      .where(eq(capitalCallNotices.id, noticeId));

    if (!notice) {
      throw new Error('Capital call notice not found');
    }

    const totalPaid = Number(notice.amountPaid) + Number(amountPaid);
    const amountDue = Number(notice.amountDue);
    
    let paymentStatus = 'pendiente';
    if (totalPaid >= amountDue) {
      paymentStatus = 'pagado_completo';
    } else if (totalPaid > 0) {
      paymentStatus = 'pagado_parcial';
    }

    const [updatedNotice] = await db
      .update(capitalCallNotices)
      .set({
        amountPaid: totalPaid.toString(),
        paymentStatus,
        paidDate: paymentStatus === 'pagado_completo' ? new Date() : notice.paidDate,
        paymentReference,
        updatedAt: new Date(),
      })
      .where(eq(capitalCallNotices.id, noticeId))
      .returning();

    // Update investor participation paid amount
    await this.updateInvestorParticipationPayment(notice.investorId, amountPaid);
    
    // Update capital call totals
    await this.updateCapitalCallTotals(notice.capitalCallId);
    
    return updatedNotice;
  }

  // Investor Distributions Management
  async createDistribution(distributionData: InsertInvestorDistribution): Promise<InvestorDistribution> {
    // Generate unique distribution code
    const distributionCode = await this.generateDistributionCode();
    
    const [distribution] = await db
      .insert(investorDistributions)
      .values({
        ...distributionData,
        distributionCode,
        netAmount: distributionData.netAmount || distributionData.amount,
      })
      .returning();
    
    return distribution;
  }

  async getDistributions(investorId?: string, projectId?: string): Promise<InvestorDistribution[]> {
    let query = db.select().from(investorDistributions);
    
    if (investorId && projectId) {
      query = query.where(and(
        eq(investorDistributions.investorId, investorId),
        eq(investorDistributions.projectId, projectId)
      ));
    } else if (investorId) {
      query = query.where(eq(investorDistributions.investorId, investorId));
    } else if (projectId) {
      query = query.where(eq(investorDistributions.projectId, projectId));
    }
    
    return await query.orderBy(desc(investorDistributions.createdAt));
  }

  async updateDistribution(id: string, updates: Partial<InsertInvestorDistribution>): Promise<InvestorDistribution> {
    const [distribution] = await db
      .update(investorDistributions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(investorDistributions.id, id))
      .returning();
    
    return distribution;
  }

  async markDistributionAsPaid(id: string, paymentDate: Date, paymentReference?: string): Promise<InvestorDistribution> {
    const [distribution] = await db
      .update(investorDistributions)
      .set({
        isPaid: true,
        paymentDate,
        paymentReference,
        updatedAt: new Date(),
      })
      .where(eq(investorDistributions.id, id))
      .returning();
    
    // Update investor total returns
    await this.updateInvestorReturns(distribution.investorId, distribution.amount);
    
    return distribution;
  }

  // ROI Reports Management
  async generateROIReport(investorId: string, projectId?: string, reportPeriod?: string): Promise<RoiReport> {
    const reportCode = await this.generateROIReportCode();
    const currentDate = new Date();
    
    // Calculate ROI data
    const roiData = await this.calculateInvestorROI(investorId, projectId);
    
    const [report] = await db
      .insert(roiReports)
      .values({
        reportCode,
        investorId,
        projectId: projectId || null,
        reportPeriod: reportPeriod || `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${currentDate.getFullYear()}`,
        startDate: new Date(currentDate.getFullYear(), 0, 1), // Start of year
        endDate: currentDate,
        initialInvestment: roiData.initialInvestment,
        additionalInvestments: roiData.additionalInvestments,
        totalInvestment: roiData.totalInvestment,
        distributions: roiData.distributions,
        currentValue: roiData.currentValue,
        netReturn: roiData.netReturn,
        roiPercentage: roiData.roiPercentage,
        annualizedReturn: roiData.annualizedReturn,
      })
      .returning();
    
    return report;
  }

  async getROIReports(investorId?: string): Promise<RoiReport[]> {
    let query = db.select().from(roiReports);
    
    if (investorId) {
      query = query.where(eq(roiReports.investorId, investorId));
    }
    
    return await query.orderBy(desc(roiReports.generatedAt));
  }

  // Analytics and Statistics
  async getInvestorStatistics() {
    const totalInvestors = await db
      .select({ count: count() })
      .from(investors)
      .where(eq(investors.status, 'activo'));

    const totalInvested = await db
      .select({ total: sum(investors.totalInvested) })
      .from(investors);

    const totalReturns = await db
      .select({ total: sum(investors.totalReturns) })
      .from(investors);

    const avgROI = await db
      .select({ avg: avg(investors.currentROI) })
      .from(investors)
      .where(eq(investors.status, 'activo'));

    const pendingCapitalCalls = await db
      .select({ count: count() })
      .from(capitalCalls)
      .where(eq(capitalCalls.status, 'programado'));

    return {
      totalInvestors: totalInvestors[0]?.count || 0,
      totalInvested: totalInvested[0]?.total || '0',
      totalReturns: totalReturns[0]?.total || '0',
      averageROI: avgROI[0]?.avg || 0,
      pendingCapitalCalls: pendingCapitalCalls[0]?.count || 0,
    };
  }

  async getProjectInvestorSummary(projectId: string) {
    const participations = await db
      .select()
      .from(investorParticipations)
      .where(and(
        eq(investorParticipations.projectId, projectId),
        eq(investorParticipations.isActive, true)
      ));

    const totalInvestment = participations.reduce((sum, p) => sum + Number(p.investmentAmount), 0);
    const totalPaid = participations.reduce((sum, p) => sum + Number(p.paidAmount), 0);
    const totalPending = participations.reduce((sum, p) => sum + Number(p.pendingAmount), 0);

    return {
      totalInvestors: participations.length,
      totalInvestment: totalInvestment.toString(),
      totalPaid: totalPaid.toString(),
      totalPending: totalPending.toString(),
      participations,
    };
  }

  // Private helper methods
  private async generateInvestorCode(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await db.select({ count: count() }).from(investors);
    const sequence = (count[0]?.count || 0) + 1;
    return `INV${year}${sequence.toString().padStart(4, '0')}`;
  }

  private async generateCallNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db
      .select({ count: count() })
      .from(capitalCalls)
      .where(eq(capitalCalls.callNumber, `CALL${year}%`));
    
    const sequence = (count[0]?.count || 0) + 1;
    return `CALL${year}-${sequence.toString().padStart(3, '0')}`;
  }

  private async generateDistributionCode(): Promise<string> {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const count = await db.select({ count: count() }).from(investorDistributions);
    const sequence = (count[0]?.count || 0) + 1;
    return `DIST${year}${month}-${sequence.toString().padStart(3, '0')}`;
  }

  private async generateROIReportCode(): Promise<string> {
    const year = new Date().getFullYear();
    const quarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const count = await db.select({ count: count() }).from(roiReports);
    const sequence = (count[0]?.count || 0) + 1;
    return `ROI${year}Q${quarter}-${sequence.toString().padStart(3, '0')}`;
  }

  private async updateCapitalCallTotals(capitalCallId: string): Promise<void> {
    const notices = await db
      .select()
      .from(capitalCallNotices)
      .where(eq(capitalCallNotices.capitalCallId, capitalCallId));

    const paidAmount = notices.reduce((sum, notice) => sum + Number(notice.amountPaid), 0);
    const totalAmount = notices.reduce((sum, notice) => sum + Number(notice.amountDue), 0);
    const pendingAmount = totalAmount - paidAmount;

    let status = 'programado';
    if (paidAmount >= totalAmount) {
      status = 'pagado_completo';
    } else if (paidAmount > 0) {
      status = 'pagado_parcial';
    }

    await db
      .update(capitalCalls)
      .set({
        paidAmount: paidAmount.toString(),
        pendingAmount: pendingAmount.toString(),
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(capitalCalls.id, capitalCallId));
  }

  private async updateInvestorParticipationPayment(investorId: string, amountPaid: string): Promise<void> {
    // This is a simplified version - in a real system, you'd need to track
    // which participation the payment is for
    const participations = await db
      .select()
      .from(investorParticipations)
      .where(eq(investorParticipations.investorId, investorId));

    for (const participation of participations) {
      const newPaidAmount = Number(participation.paidAmount) + Number(amountPaid);
      const newPendingAmount = Number(participation.investmentAmount) - newPaidAmount;
      
      await db
        .update(investorParticipations)
        .set({
          paidAmount: newPaidAmount.toString(),
          pendingAmount: Math.max(0, newPendingAmount).toString(),
          updatedAt: new Date(),
        })
        .where(eq(investorParticipations.id, participation.id));
      
      break; // For simplicity, apply to first participation
    }
  }

  private async updateInvestorReturns(investorId: string, returnAmount: string): Promise<void> {
    const [investor] = await db
      .select()
      .from(investors)
      .where(eq(investors.id, investorId));

    if (investor) {
      const newTotalReturns = Number(investor.totalReturns) + Number(returnAmount);
      const currentROI = Number(investor.totalInvested) > 0 
        ? (newTotalReturns / Number(investor.totalInvested)) * 100 
        : 0;

      await db
        .update(investors)
        .set({
          totalReturns: newTotalReturns.toString(),
          currentROI,
          lastActivityDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(investors.id, investorId));
    }
  }

  private async calculateInvestorROI(investorId: string, projectId?: string) {
    // Get all participations for the investor
    let participationsQuery = db
      .select()
      .from(investorParticipations)
      .where(eq(investorParticipations.investorId, investorId));

    if (projectId) {
      participationsQuery = participationsQuery.where(
        eq(investorParticipations.projectId, projectId)
      );
    }

    const participations = await participationsQuery;

    // Get all distributions for the investor
    let distributionsQuery = db
      .select()
      .from(investorDistributions)
      .where(and(
        eq(investorDistributions.investorId, investorId),
        eq(investorDistributions.isPaid, true)
      ));

    if (projectId) {
      distributionsQuery = distributionsQuery.where(
        eq(investorDistributions.projectId, projectId)
      );
    }

    const distributions = await distributionsQuery;

    const initialInvestment = participations.reduce((sum, p) => sum + Number(p.investmentAmount), 0);
    const additionalInvestments = 0; // Could be calculated from capital calls
    const totalInvestment = initialInvestment + additionalInvestments;
    const totalDistributions = distributions.reduce((sum, d) => sum + Number(d.netAmount), 0);
    
    // Simplified current value calculation - in reality, this would be based on project valuations
    const currentValue = totalInvestment * 1.1; // Assume 10% appreciation for demo
    const netReturn = currentValue + totalDistributions - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (netReturn / totalInvestment) * 100 : 0;
    
    // Simplified annualized return calculation
    const yearsInvested = 1; // Would calculate based on actual investment dates
    const annualizedReturn = roiPercentage / yearsInvested;

    return {
      initialInvestment: initialInvestment.toString(),
      additionalInvestments: additionalInvestments.toString(),
      totalInvestment: totalInvestment.toString(),
      distributions: totalDistributions.toString(),
      currentValue: currentValue.toString(),
      netReturn: netReturn.toString(),
      roiPercentage,
      annualizedReturn,
    };
  }
}

export const investorService = new InvestorService();