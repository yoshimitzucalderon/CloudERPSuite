import { db } from "./db";
import { projects, permits, budgetItems, calendarEvents, budgetCategories, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

export async function createDemoProject() {
  try {
    // Check if demo project already exists
    const existingProject = await db.select().from(projects).where(eq(projects.name, "Residencial Los Pinos")).limit(1);
    
    if (existingProject.length === 0) {
      console.log("Creating demo project...");
      
      // Create demo project
      const [project] = await db.insert(projects).values({
        name: "Residencial Los Pinos",
        type: "residencial",
        location: "Av. Los Pinos 123, Ciudad de México",
        totalLandArea: "5000",
        sellableArea: "4200",
        plannedUnits: 24,
        totalBudget: "45000000",
        status: "construccion",
        progress: 65,
        description: "Desarrollo residencial de 24 unidades habitacionales con amenidades",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-12-20"),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Create demo permits
      await db.insert(permits).values([
        {
          projectId: project.id,
          name: "Licencia de Construcción",
          type: "licencia_construccion",
          status: "aprobado",
          requestDate: new Date("2024-01-10"),
          approvalDate: new Date("2024-02-15"),
          cost: "150000",
          responsiblePerson: "Ing. Ana García",
          notes: "Licencia aprobada para 24 unidades",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          projectId: project.id,
          name: "Factibilidad de Servicios",
          type: "factibilidad_servicios",
          status: "en_revision",
          requestDate: new Date("2024-02-01"),
          dueDate: new Date("2024-03-15"),
          cost: "85000",
          responsiblePerson: "Ing. Carlos Mendoza",
          notes: "En proceso de revisión por la CFE",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]);

      // Get budget categories for demo budget items
      const categories = await db.select().from(budgetCategories).limit(5);
      
      if (categories.length > 0) {
        const budgetItemsData = [
          {
            projectId: project.id,
            categoryId: categories[0].id,
            name: "Adquisición de terreno",
            budgetedAmount: "12000000",
            actualAmount: "12000000",
            description: "Compra del terreno de 5000 m²",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            projectId: project.id,
            categoryId: categories[1].id,
            name: "Proyecto arquitectónico",
            budgetedAmount: "800000",
            actualAmount: "750000",
            description: "Desarrollo del proyecto ejecutivo",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            projectId: project.id,
            categoryId: categories[2].id,
            name: "Urbanización",
            budgetedAmount: "3500000",
            actualAmount: "3200000",
            description: "Infraestructura vial y servicios",
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ];

        await db.insert(budgetItems).values(budgetItemsData);
      }

      // Get first user for calendar events
      const [firstUser] = await db.select().from(users).limit(1);
      
      if (firstUser) {
        // Create demo calendar events
        await db.insert(calendarEvents).values([
          {
            projectId: project.id,
            title: "Inspección de obra",
            description: "Inspección mensual del avance de construcción",
            startDate: new Date("2025-02-15T10:00:00"),
            endDate: new Date("2025-02-15T12:00:00"),
            priority: "high",
            createdBy: firstUser.id,
            createdAt: new Date(),
          },
          {
            projectId: project.id,
            title: "Entrega de acabados",
            description: "Verificación de acabados en las primeras 12 unidades",
            startDate: new Date("2025-03-01T09:00:00"),
            endDate: new Date("2025-03-01T17:00:00"),
            priority: "medium",
            createdBy: firstUser.id,
            createdAt: new Date(),
          }
        ]);
      }

      // Create demo WBS items for project management
      await storage.createWbsItem({
        projectId: project.id,
        parentId: "",
        wbsCode: "01.001",
        name: "Planeación y Diseño",
        description: "Fase inicial de planeación arquitectónica y diseño del proyecto",
        level: 1,
        duration: 90,
        progress: 80,
        budgetedCost: "150000000",
        actualCost: "120000000",
        isMilestone: true,
        isCritical: true,
        assignedTo: "",
      });

      await storage.createWbsItem({
        projectId: project.id,
        parentId: "",
        wbsCode: "02.001",
        name: "Licencias y Permisos",
        description: "Obtención de licencias de construcción y permisos municipales",
        level: 1,
        duration: 120,
        progress: 60,
        budgetedCost: "80000000",
        actualCost: "70000000",
        isMilestone: true,
        isCritical: true,
        assignedTo: "",
      });

      await storage.createWbsItem({
        projectId: project.id,
        parentId: "",
        wbsCode: "03.001",
        name: "Movimiento de Tierra",
        description: "Excavación, nivelación y preparación del terreno",
        level: 2,
        duration: 45,
        progress: 0,
        budgetedCost: "200000000",
        actualCost: "0",
        isMilestone: false,
        isCritical: true,
        assignedTo: "",
      });

      // Create demo lots for commercial management
      const lots = [
        { number: "A-101", area: 120, price: "180000000", location: "Torre A - Piso 1" },
        { number: "A-102", area: 95, price: "150000000", location: "Torre A - Piso 1" },
        { number: "A-201", area: 110, price: "165000000", location: "Torre A - Piso 2" },
        { number: "B-101", area: 130, price: "195000000", location: "Torre B - Piso 1" },
        { number: "B-102", area: 98, price: "147000000", location: "Torre B - Piso 1" },
      ];

      for (const lotData of lots) {
        await storage.createLot({
          projectId: project.id,
          number: lotData.number,
          area: lotData.area,
          price: lotData.price,
          status: "disponible",
          location: lotData.location,
        });
      }

      // Create demo clients
      const clients = [
        {
          firstName: "Ana María",
          lastName: "González Rodríguez",
          email: "ana.gonzalez@email.com",
          phone: "+57 300 123 4567",
          identificationType: "cedula",
          identificationNumber: "52123456",
          address: "Calle 85 #12-34, Bogotá",
        },
        {
          firstName: "Carlos Eduardo",
          lastName: "Martínez López",
          email: "carlos.martinez@email.com",
          phone: "+57 310 987 6543",
          identificationType: "cedula",
          identificationNumber: "80987654",
          address: "Carrera 15 #45-67, Bogotá",
        },
        {
          firstName: "Lucia",
          lastName: "Fernández Silva",
          email: "lucia.fernandez@email.com",
          phone: "+57 320 456 7890",
          identificationType: "cedula",
          identificationNumber: "41456789",
          address: "Avenida 68 #23-45, Bogotá",
        },
      ];

      for (const clientData of clients) {
        await storage.createClient(clientData);
      }

      console.log("Demo project created successfully");
    }
  } catch (error) {
    console.error("Error creating demo project:", error);
  }
}