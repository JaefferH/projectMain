// src/modules/finance/expense/expense.routes.ts
import { Router } from "express";
import { expenseController } from "./expense.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { 
  createExpenseCategorySchema, updateExpenseCategorySchema, 
  createExpenseSchema, updateExpenseSchema, 
  approveExpenseSchema, rejectExpenseSchema 
} from "./expense.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();
router.use(authenticate);

// Summary
router.get("/summary", authorize("finance:read"), expenseController.getExpenseSummary);

// Categories
router.get("/categories", authorize("finance:read"), expenseController.getExpenseCategories);
router.post("/categories", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(createExpenseCategorySchema), expenseController.createExpenseCategory);
router.patch("/categories/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(updateExpenseCategorySchema), expenseController.updateExpenseCategory);
router.delete("/categories/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), expenseController.deleteExpenseCategory);

// Expenses
router.get("/", authorize("finance:read"), expenseController.getExpenses);
router.get("/:id", authorize("finance:read"), expenseController.getExpenseById);
router.post("/", authorize("finance:manage"), validate(createExpenseSchema), expenseController.createExpense);
router.patch("/:id", authorize("finance:manage"), validate(updateExpenseSchema), expenseController.updateExpense);
router.patch("/:id/approve", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(approveExpenseSchema), expenseController.approveExpense);
router.patch("/:id/reject", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(rejectExpenseSchema), expenseController.rejectExpense);
router.delete("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), expenseController.deleteExpense);

export default router;