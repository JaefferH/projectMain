# Finance Module - API Reference

Base URLs: `/api/fee-categories`, `/api/fee-structures`, `/api/invoices`, `/api/payments`, `/api/salary-structures`, `/api/salary-payments`, `/api/revenues`, `/api/expenses`, `/api/financial-reports`

## Overview
Complete financial management system covering student fees, invoices, payments, staff salaries, revenue, expenses, and financial reporting.

---

## Fee Categories

### List Fee Categories
```
GET /api/fee-categories?branchId=branch_id&isActive=true&search=tuition
Authorization: Bearer {accessToken}
Permission: finance:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Fee categories retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "category_id",
        "branchId": "branch_id",
        "name": "Tuition Fee",
        "description": "Monthly tuition fee for all students",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "branch": { "id": "branch_id", "name": "Main Campus", "code": "MAIN" },
        "stats": { "feeStructures": 3 }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 8, "totalPages": 1 }
  }
}
```

### Create Fee Category
```
POST /api/fee-categories
Permission: finance:manage
Role: ADMIN+

{
  "branchId": "branch_id",
  "name": "Registration Fee",
  "description": "One-time registration fee for new students",
  "isActive": true
}
```

### Update Fee Category
```
PATCH /api/fee-categories/:id
Permission: finance:manage
Role: ADMIN+
```

### Toggle Status
```
PATCH /api/fee-categories/:id/toggle-status
Permission: finance:manage
Role: ADMIN+
```

### Delete Fee Category
```
DELETE /api/fee-categories/:id
Permission: finance:manage
Role: ADMIN+
```
**Note:** Cannot delete if it has fee structures.

---

## Fee Structures

### List Fee Structures
```
GET /api/fee-structures?academicYearId=year_id&feeCategoryId=category_id&branchId=branch_id
Permission: finance:read
```

### Get Fee Structure By ID
```
GET /api/fee-structures/:id
Permission: finance:read
```

### Get Fee Schedule (Grouped by Category)
```
GET /api/fee-structures/schedule/:academicYearId?branchId=branch_id
Permission: finance:read
```

**Response:**
```json
{
  "success": true,
  "message": "Fee schedule retrieved successfully.",
  "data": {
    "academicYear": { "id": "year_id", "name": "2024/2025" },
    "mandatoryFees": {
      "items": [
        {
          "id": "structure_id",
          "category": { "id": "cat_id", "name": "Tuition Fee" },
          "amount": 5000,
          "dueDate": "2024-09-05T00:00:00.000Z",
          "isRecurring": true,
          "recurringInterval": "MONTHLY"
        }
      ],
      "total": 5000
    },
    "optionalFees": {
      "items": [
        {
          "id": "structure_id",
          "category": { "id": "cat_id", "name": "Sports Fee" },
          "amount": 500,
          "dueDate": null,
          "isRecurring": false,
          "recurringInterval": null
        }
      ],
      "total": 500
    },
    "summary": {
      "totalMandatory": 5000,
      "totalOptional": 500,
      "grandTotal": 5500,
      "totalCategories": 5
    }
  }
}
```

### Create Fee Structure
```
POST /api/fee-structures
Permission: finance:manage
Role: ADMIN+

{
  "academicYearId": "year_id",
  "feeCategoryId": "category_id",
  "amount": 5000,
  "dueDate": "2024-09-05T00:00:00.000Z",
  "isOptional": false,
  "isRecurring": true,
  "recurringInterval": "MONTHLY"
}
```

**Recurring Intervals:** MONTHLY, TERMLY, YEARLY

### Bulk Create Fee Structures
```
POST /api/fee-structures/bulk
Permission: finance:manage
Role: ADMIN+

{
  "academicYearId": "year_id",
  "feeCategoryId": "default_category_id",
  "structures": [
    { "amount": 5000, "isRecurring": true, "recurringInterval": "MONTHLY", "feeCategoryId": "tuition_id" },
    { "amount": 1000, "isOptional": false, "feeCategoryId": "registration_id" },
    { "amount": 500, "isOptional": true, "feeCategoryId": "sports_id" }
  ]
}
```

### Update Fee Structure
```
PATCH /api/fee-structures/:id
Permission: finance:manage
Role: ADMIN+
```
**Note:** Cannot change amount if invoices already exist.

### Delete Fee Structure
```
DELETE /api/fee-structures/:id
Permission: finance:manage
Role: ADMIN+
```
**Note:** Cannot delete if it has invoices.

---

## Invoices

### List Invoices
```
GET /api/invoices?enrollmentId=id&classroomId=id&academicYearId=id&status=PENDING&search=INV
Permission: finance:read
```

**Invoice Statuses:** PENDING, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, WAIVED

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invoices retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "invoice_id",
        "invoiceNumber": "INV-MAIN-2024-0001",
        "enrollmentId": "enrollment_id",
        "feeStructureId": "structure_id",
        "amount": 5000,
        "discount": 0,
        "discountReason": null,
        "taxAmount": 0,
        "totalAmount": 5000,
        "status": "PENDING",
        "issuedAt": "2024-09-01T00:00:00.000Z",
        "dueDate": "2024-09-05T00:00:00.000Z",
        "paidAt": null,
        "notes": null,
        "student": {
          "id": "student_id",
          "fullName": "Mohammed Ahmed",
          "registrationNumber": "STU-2024-001"
        },
        "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
        "feeCategory": { "id": "category_id", "name": "Tuition Fee" },
        "academicYear": { "id": "year_id", "name": "2024/2025" },
        "paymentSummary": {
          "totalPaid": 0,
          "balance": 5000,
          "isFullyPaid": false,
          "paymentCount": 0
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 300, "totalPages": 15 }
  }
}
```

### Get Invoice By ID
```
GET /api/invoices/:id
Permission: finance:read
```
Response includes full payment history and fee structure details.

### Get My Invoices (Student)
```
GET /api/invoices/my-invoices?status=PENDING&academicYearId=year_id
Authorization: Bearer {studentToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Your invoices retrieved successfully.",
  "data": {
    "student": {
      "id": "student_id",
      "fullName": "Mohammed Ahmed",
      "registrationNumber": "STU-2024-001"
    },
    "invoices": [...],
    "summary": {
      "totalInvoices": 5,
      "pendingInvoices": 2,
      "paidInvoices": 3,
      "totalOwed": 10000
    }
  }
}
```

### Generate Invoices
```
POST /api/invoices/generate
Permission: finance:manage
Role: ADMIN+

// For all students in a class:
{
  "academicYearId": "year_id",
  "classroomId": "classroom_id"
}

// For specific students:
{
  "academicYearId": "year_id",
  "enrollmentIds": ["enrollment_1_id", "enrollment_2_id"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 25 invoices, 2 failed",
  "data": {
    "successful": [...],
    "failed": [
      { "student": "Ahmed Mohammed", "error": "Invoice already exists" }
    ]
  }
}
```

**Invoice Number Format:** `INV-{branchCode}-{year}-{sequence}` (e.g., `INV-MAIN-2024-0001`)

### Update Invoice
```
PATCH /api/invoices/:id
Permission: finance:manage
Role: ADMIN+

{
  "discount": 500,
  "discountReason": "Early payment discount",
  "status": "WAIVED",
  "dueDate": "2024-10-05T00:00:00.000Z",
  "notes": "Extended due date"
}
```

### Apply Discount
```
PATCH /api/invoices/:id/discount
Permission: finance:manage
Role: ADMIN+

{
  "discount": 500,
  "discountReason": "Sibling discount"
}
```

### Cancel Invoice
```
PATCH /api/invoices/:id/cancel
Permission: finance:manage
Role: ADMIN+
```
**Note:** Cannot cancel paid invoices or invoices with payments.

---

## Payments

### List Payments
```
GET /api/payments?invoiceId=id&classroomId=id&academicYearId=id&paymentMethod=CASH&startDate=2024-09-01&endDate=2024-09-30
Permission: finance:read
```

**Payment Methods:** CASH, BANK_TRANSFER, MOBILE_MONEY, CHEQUE, CREDIT_CARD, DEBIT_CARD, ONLINE, OTHER

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payments retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "payment_id",
        "receiptNumber": "RCP-MAIN-2024-0001",
        "invoiceId": "invoice_id",
        "amount": 5000,
        "paymentMethod": "CASH",
        "referenceNumber": null,
        "paymentDate": "2024-09-03T10:00:00.000Z",
        "notes": "Full payment for September tuition",
        "receivedBy": { "id": "user_id", "username": "admin" },
        "invoice": {
          "id": "invoice_id",
          "invoiceNumber": "INV-MAIN-2024-0001",
          "status": "PAID",
          "student": { "id": "student_id", "fullName": "Mohammed Ahmed" },
          "classroom": { "id": "classroom_id", "name": "Grade 10-A" },
          "feeCategory": { "id": "category_id", "name": "Tuition Fee" }
        }
      }
    ],
    "summary": {
      "totalPayments": 50,
      "totalAmount": 250000
    },
    "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
  }
}
```

### Get Payment By ID
```
GET /api/payments/:id
Permission: finance:read
```

### Get Payments By Invoice
```
GET /api/payments/invoice/:invoiceId
Permission: finance:read
```

### Get My Payments (Student)
```
GET /api/payments/my-payments?academicYearId=year_id
Authorization: Bearer {studentToken}
```

### Record Payment
```
POST /api/payments
Permission: finance:manage

{
  "invoiceId": "invoice_id",
  "amount": 5000,
  "paymentMethod": "CASH",
  "referenceNumber": null,
  "paymentDate": "2024-09-03T10:00:00.000Z",
  "notes": "Full payment for September tuition"
}
```

**Rules:**
- Cannot overpay (amount > remaining balance)
- Cannot pay cancelled invoices
- Auto-updates invoice status to PAID when fully paid
- Auto-updates invoice status to PARTIALLY_PAID for partial payments

**Receipt Number Format:** `RCP-{branchCode}-{year}-{sequence}`

---

## Salary Structures

### List Salary Structures
```
GET /api/salary-structures?branchId=id&profileId=id&isActive=true
Permission: finance:read
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Salary structures retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "structure_id",
        "profileId": "teacher_profile_id",
        "branchId": "branch_id",
        "basicSalary": 15000,
        "currency": "ETB",
        "isActive": true,
        "effectiveFrom": "2024-09-01T00:00:00.000Z",
        "effectiveTo": null,
        "staff": {
          "id": "profile_id",
          "fullName": "Sumeya Besha",
          "employeeNumber": "TCH-001",
          "phone": "+251912345678"
        },
        "branch": { "id": "branch_id", "name": "Main Campus" },
        "components": [
          { "id": "comp_id", "type": "ALLOWANCE", "name": "Housing Allowance", "amount": 3000, "isPercentage": false },
          { "id": "comp_id", "type": "DEDUCTION", "name": "Pension", "amount": -1050, "isPercentage": false }
        ],
        "salarySummary": {
          "basicSalary": 15000,
          "totalAdditions": 4500,
          "totalDeductions": 3050,
          "netSalary": 16450
        }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
  }
}
```

### Get My Salary Structure (Staff)
```
GET /api/salary-structures/my-salary
Authorization: Bearer {staffToken}
```

### Create Salary Structure
```
POST /api/salary-structures
Permission: finance:manage
Role: ADMIN+

{
  "profileId": "teacher_profile_id",
  "branchId": "branch_id",
  "basicSalary": 15000,
  "currency": "ETB",
  "effectiveFrom": "2024-09-01T00:00:00.000Z",
  "components": [
    { "type": "ALLOWANCE", "name": "Housing Allowance", "amount": 3000 },
    { "type": "ALLOWANCE", "name": "Transport Allowance", "amount": 1500 },
    { "type": "DEDUCTION", "name": "Pension Contribution", "amount": -1050 },
    { "type": "DEDUCTION", "name": "Income Tax", "amount": -2000 }
  ]
}
```

**Component Types:** BASE_SALARY, BONUS, DEDUCTION, OVERTIME, ALLOWANCE, TAX, PENSION, OTHER

**Rules:**
- Staff must have TEACHER/ADMIN/SUPER_ADMIN role
- Creating a new active structure deactivates the previous one
- `isPercentage: true` calculates amount as percentage of basic salary

### Update Salary Structure
```
PATCH /api/salary-structures/:id
Permission: finance:manage
Role: ADMIN+
```

### Delete Salary Structure
```
DELETE /api/salary-structures/:id
Permission: finance:manage
Role: ADMIN+
```
**Note:** Cannot delete if it has salary payments.

---

## Salary Payments

### List Salary Payments
```
GET /api/salary-payments?branchId=id&profileId=id&paymentPeriod=2024-09&status=PAID
Permission: finance:read
```

**Statuses:** PENDING, PROCESSED, PAID, CANCELLED

### Get Salary Payment By ID
```
GET /api/salary-payments/:id
Permission: finance:read
```

### Get My Salary Payments (Staff)
```
GET /api/salary-payments/my-payments?paymentPeriod=2024-09
Authorization: Bearer {staffToken}
```

### Generate Salary Payment (Single)
```
POST /api/salary-payments/generate
Permission: finance:manage
Role: ADMIN+

{
  "salaryStructureId": "structure_id",
  "paymentPeriod": "2024-09",
  "periodStart": "2024-09-01T00:00:00.000Z",
  "periodEnd": "2024-09-30T00:00:00.000Z",
  "notes": "September 2024 salary"
}
```

**Reference Format:** `SAL-{branchCode}-{period}-{employeeNumber}`

### Bulk Generate Salary Payments
```
POST /api/salary-payments/bulk-generate
Permission: finance:manage
Role: ADMIN+

{
  "branchId": "branch_id",
  "paymentPeriod": "2024-09",
  "periodStart": "2024-09-01T00:00:00.000Z",
  "periodEnd": "2024-09-30T00:00:00.000Z",
  "notes": "September 2024 salary for all staff"
}
```

### Process/Mark Salary as Paid
```
PATCH /api/salary-payments/:id/process
Permission: finance:manage
Role: ADMIN+

{
  "paymentMethod": "BANK_TRANSFER",
  "referenceNumber": "BANK-TRF-2024-001",
  "paymentDate": "2024-10-01T10:00:00.000Z",
  "notes": "Paid via bank transfer"
}
```

### Cancel Salary Payment
```
PATCH /api/salary-payments/:id/cancel
Permission: finance:manage
Role: ADMIN+
```
**Note:** Cannot cancel paid salary payments.

---

## Revenue

### List Revenue Categories
```
GET /api/revenues/categories?branchId=id&isActive=true
Permission: finance:read
```

### List Revenues
```
GET /api/revenues?branchId=id&categoryId=id&startDate=2024-09-01&endDate=2024-09-30
Permission: finance:read
```

### Get Revenue Summary
```
GET /api/revenues/summary?branchId=id&startDate=2024-09-01&endDate=2024-09-30
Permission: finance:read
```

### Record Revenue
```
POST /api/revenues
Permission: finance:manage

{
  "branchId": "branch_id",
  "categoryId": "category_id",
  "amount": 50000,
  "receivedDate": "2024-09-15T10:00:00.000Z",
  "description": "Donation from local business",
  "referenceNumber": "DON-2024-001"
}
```

**Receipt Number Format:** `REV-{branchCode}-{year}-{sequence}`

---

## Expense

### List Expense Categories
```
GET /api/expenses/categories?branchId=id&isActive=true
Permission: finance:read
```

### List Expenses
```
GET /api/expenses?branchId=id&categoryId=id&status=PENDING&startDate=2024-09-01&endDate=2024-09-30
Permission: finance:read
```

**Statuses:** PENDING, APPROVED, REJECTED

### Get Expense Summary
```
GET /api/expenses/summary?branchId=id&startDate=2024-09-01&endDate=2024-09-30
Permission: finance:read
```

### Record Expense
```
POST /api/expenses
Permission: finance:manage

{
  "branchId": "branch_id",
  "categoryId": "category_id",
  "amount": 3500,
  "expenseDate": "2024-09-10T00:00:00.000Z",
  "description": "Monthly electricity bill",
  "referenceNumber": "UTIL-SEP-2024"
}
```

**Voucher Number Format:** `VCH-{branchCode}-{year}-{sequence}`

### Approve Expense
```
PATCH /api/expenses/:id/approve
Permission: finance:manage
Role: ADMIN+

{
  "notes": "Verified against utility bill"
}
```

### Reject Expense
```
PATCH /api/expenses/:id/reject
Permission: finance:manage
Role: ADMIN+

{
  "notes": "Incorrect amount - please verify with actual bill"
}
```

---

## Financial Reports

### List Reports
```
GET /api/financial-reports?branchId=id&reportType=MONTHLY&reportPeriod=2024-09
Permission: finance:read
```

### Get Report By ID
```
GET /api/financial-reports/:id
Permission: finance:read
```

### Generate Report
```
POST /api/financial-reports/generate
Permission: finance:manage
Role: ADMIN+

// Monthly:
{
  "branchId": "branch_id",
  "reportType": "MONTHLY",
  "reportPeriod": "2024-09",
  "periodStart": "2024-09-01T00:00:00.000Z",
  "periodEnd": "2024-09-30T23:59:59.000Z",
  "notes": "September 2024 financial report"
}

// Termly:
{
  "branchId": "branch_id",
  "reportType": "TERMLY",
  "reportPeriod": "2024-Q3",
  "periodStart": "2024-07-01T00:00:00.000Z",
  "periodEnd": "2024-09-30T23:59:59.000Z"
}

// Yearly:
{
  "branchId": "branch_id",
  "reportType": "YEARLY",
  "reportPeriod": "2024",
  "periodStart": "2024-01-01T00:00:00.000Z",
  "periodEnd": "2024-12-31T23:59:59.000Z"
}
```

**Report Types:** MONTHLY, TERMLY, YEARLY, CUSTOM

**Response:**
```json
{
  "success": true,
  "message": "Financial report generated successfully.",
  "data": {
    "report": {
      "id": "report_id",
      "branchId": "branch_id",
      "reportType": "MONTHLY",
      "reportPeriod": "2024-09",
      "totalRevenue": 50000,
      "totalExpenses": 15000,
      "totalFeesCollected": 85000,
      "totalSalaries": 45000,
      "netIncome": 75000,
      "profitMargin": 55
    },
    "breakdown": {
      "revenue": {
        "total": 50000,
        "byCategory": [
          { "categoryName": "Donations", "count": 2, "total": 50000 }
        ]
      },
      "expenses": {
        "total": 15000,
        "byCategory": [...],
        "pending": { "count": 1, "totalAmount": 2000 }
      },
      "feesCollected": {
        "total": 85000,
        "byCategory": [...]
      },
      "salaries": {
        "total": 45000,
        "count": 3
      }
    },
    "summary": {
      "totalIncome": 135000,
      "totalOutflow": 60000,
      "netIncome": 75000,
      "isProfitable": true,
      "profitMargin": 55
    }
  }
}
```

### Get Financial Overview (Quick)
```
GET /api/financial-reports/overview?branchId=id&periodStart=2024-09-01T00:00:00.000Z&periodEnd=2024-09-30T23:59:59.000Z
Permission: finance:read
```

---

## Finance Flow

```
Fee Categories → Fee Structures → Invoices → Payments
                                           ↓
                                      Student Ledger

Salary Structures → Salary Payments → Process Payment
                                     ↓
                                  Staff Ledger

Revenue Categories → Revenue → Financial Reports
Expense Categories → Expense → Financial Reports
```