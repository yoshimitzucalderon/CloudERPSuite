// Demo scenarios for authorization testing

export const authorizationScenarios = {
  // Scenario 1: User needs to approve (Yoshimitsu is first step, pendiente)
  pendingApproval: {
    authorizations: [
      { step: 1, stepType: "elabora", userName: "Yoshimitsu Calderón", userTitle: "Project Manager", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "pendiente", signedAt: null },
      { step: 2, stepType: "autoriza", userName: "Ana Cecilia Campos", userTitle: "Directora de Desarrollo", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "pendiente" },
      { step: 3, stepType: "autoriza", userName: "Juan Núñez", userTitle: "Socio Director", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "pendiente" },
      { step: 4, stepType: "autoriza", userName: "Javier Gómez", userTitle: "Investment Manager", company: "CI Capital Partners", status: "pendiente" }
    ]
  },

  // Scenario 2: User already approved and can reverse (no subsequent approvals)
  canReverse: {
    authorizations: [
      { step: 1, stepType: "elabora", userName: "Yoshimitsu Calderón", userTitle: "Project Manager", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "firmado", signedAt: new Date("2024-07-25") },
      { step: 2, stepType: "autoriza", userName: "Ana Cecilia Campos", userTitle: "Directora de Desarrollo", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "pendiente" },
      { step: 3, stepType: "autoriza", userName: "Juan Núñez", userTitle: "Socio Director", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "pendiente" },
      { step: 4, stepType: "autoriza", userName: "Javier Gómez", userTitle: "Investment Manager", company: "CI Capital Partners", status: "pendiente" }
    ]
  },

  // Scenario 3: User approved but cannot reverse (has subsequent approvals)
  cannotReverse: {
    authorizations: [
      { step: 1, stepType: "elabora", userName: "Yoshimitsu Calderón", userTitle: "Project Manager", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "firmado", signedAt: new Date("2024-07-25") },
      { step: 2, stepType: "autoriza", userName: "Ana Cecilia Campos", userTitle: "Directora de Desarrollo", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "firmado", signedAt: new Date("2024-07-26") },
      { step: 3, stepType: "autoriza", userName: "Juan Núñez", userTitle: "Socio Director", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "pendiente" },
      { step: 4, stepType: "autoriza", userName: "Javier Gómez", userTitle: "Investment Manager", company: "CI Capital Partners", status: "pendiente" }
    ]
  },

  // Scenario 4: User is not in the workflow (read-only)
  readOnly: {
    authorizations: [
      { step: 1, stepType: "elabora", userName: "María González", userTitle: "Project Manager", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "firmado", signedAt: new Date("2024-07-25") },
      { step: 2, stepType: "autoriza", userName: "Ana Cecilia Campos", userTitle: "Directora de Desarrollo", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "pendiente" },
      { step: 3, stepType: "autoriza", userName: "Juan Núñez", userTitle: "Socio Director", company: "Red Oak Ventures, S.A.P.I. de C.V.", status: "pendiente" },
      { step: 4, stepType: "autoriza", userName: "Javier Gómez", userTitle: "Investment Manager", company: "CI Capital Partners", status: "pendiente" }
    ]
  }
};