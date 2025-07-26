import { db } from "./db";
import { budgetCategories } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultBudgetCategories = [
  { name: "Terreno y Predios", parentId: null },
  { name: "Proyectos y Licencias", parentId: null },
  { name: "Infraestructura", parentId: null },
  { name: "Construcción", parentId: null },
  { name: "Acabados", parentId: null },
  { name: "Instalaciones", parentId: null },
  { name: "Áreas Comunes", parentId: null },
  { name: "Ventas y Marketing", parentId: null },
  { name: "Gastos Administrativos", parentId: null },
  { name: "Contingencias", parentId: null },
];

export async function seedBudgetCategories() {
  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(budgetCategories).limit(1);
    
    if (existingCategories.length === 0) {
      console.log("Seeding budget categories...");
      
      for (const category of defaultBudgetCategories) {
        await db.insert(budgetCategories).values({
          name: category.name,
          parentId: category.parentId,
          createdAt: new Date(),
        });
      }
      
      console.log("Budget categories seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding budget categories:", error);
  }
}