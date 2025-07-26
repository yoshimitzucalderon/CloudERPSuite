import { db } from "./db";
import { authorizationMatrix } from "@shared/schema";

export async function seedAuthorizationMatrix() {
  console.log("Seeding authorization matrix...");

  const matrixData = [
    // Pago workflows - Payment approvals
    {
      workflowType: 'pago' as const,
      minAmount: '0',
      maxAmount: '25000',
      requiredLevel: 'supervisor' as const,
      requiresSequential: false,
      escalationHours: 12,
      isActive: true,
    },
    {
      workflowType: 'pago' as const,
      minAmount: '25001',
      maxAmount: '100000',
      requiredLevel: 'gerente' as const,
      requiresSequential: false,
      escalationHours: 24,
      isActive: true,
    },
    {
      workflowType: 'pago' as const,
      minAmount: '100001',
      maxAmount: '500000',
      requiredLevel: 'director' as const,
      requiresSequential: true,
      escalationHours: 48,
      isActive: true,
    },
    {
      workflowType: 'pago' as const,
      minAmount: '500001',
      maxAmount: null,
      requiredLevel: 'ejecutivo' as const,
      requiresSequential: true,
      escalationHours: 72,
      isActive: true,
    },

    // Contratacion workflows - Contract approvals
    {
      workflowType: 'contratacion' as const,
      minAmount: '0',
      maxAmount: '100000',
      requiredLevel: 'gerente' as const,
      requiresSequential: false,
      escalationHours: 48,
      isActive: true,
    },
    {
      workflowType: 'contratacion' as const,
      minAmount: '100001',
      maxAmount: '500000',
      requiredLevel: 'director' as const,
      requiresSequential: true,
      escalationHours: 72,
      isActive: true,
    },
    {
      workflowType: 'contratacion' as const,
      minAmount: '500001',
      maxAmount: null,
      requiredLevel: 'ejecutivo' as const,
      requiresSequential: true,
      escalationHours: 168,
      isActive: true,
    },

    // Orden cambio workflows - Change order approvals
    {
      workflowType: 'orden_cambio' as const,
      minAmount: '0',
      maxAmount: '50000',
      requiredLevel: 'gerente' as const,
      requiresSequential: false,
      escalationHours: 24,
      isActive: true,
    },
    {
      workflowType: 'orden_cambio' as const,
      minAmount: '50001',
      maxAmount: '250000',
      requiredLevel: 'director' as const,
      requiresSequential: true,
      escalationHours: 72,
      isActive: true,
    },
    {
      workflowType: 'orden_cambio' as const,
      minAmount: '250001',
      maxAmount: null,
      requiredLevel: 'ejecutivo' as const,
      requiresSequential: true,
      escalationHours: 168,
      isActive: true,
    },

    // Liberacion credito workflows - Credit release approvals
    {
      workflowType: 'liberacion_credito' as const,
      minAmount: '0',
      maxAmount: '100000',
      requiredLevel: 'director' as const,
      requiresSequential: false,
      escalationHours: 24,
      isActive: true,
    },
    {
      workflowType: 'liberacion_credito' as const,
      minAmount: '100001',
      maxAmount: null,
      requiredLevel: 'ejecutivo' as const,
      requiresSequential: true,
      escalationHours: 48,
      isActive: true,
    },

    // Capital call workflows - Capital call approvals
    {
      workflowType: 'capital_call' as const,
      minAmount: '0',
      maxAmount: '500000',
      requiredLevel: 'director' as const,
      requiresSequential: true,
      escalationHours: 72,
      isActive: true,
    },
    {
      workflowType: 'capital_call' as const,
      minAmount: '500001',
      maxAmount: null,
      requiredLevel: 'ejecutivo' as const,
      requiresSequential: true,
      escalationHours: 168,
      isActive: true,
    },
  ];

  try {
    for (const matrix of matrixData) {
      await db.insert(authorizationMatrix).values({
        ...matrix,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log("Authorization matrix seeded successfully!");
  } catch (error) {
    console.error("Error seeding authorization matrix:", error);
  }
}

// Run seeding if called directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedAuthorizationMatrix().then(() => {
    console.log("Seeding completed");
    process.exit(0);
  }).catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}