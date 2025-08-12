-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    CONSTRAINT "Department_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Department" ("id", "name", "plantId") SELECT "id", "name", "plantId" FROM "Department";
DROP TABLE "Department";
ALTER TABLE "new_Department" RENAME TO "Department";
CREATE INDEX "Department_tenantId_idx" ON "Department"("tenantId");
CREATE TABLE "new_Operator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "hireDate" DATETIME NOT NULL,
    "departmentId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "basePayRate" REAL,
    "emergencyContact" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Operator_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Operator" ("basePayRate", "createdAt", "departmentId", "email", "emergencyContact", "employeeId", "firstName", "hireDate", "id", "isActive", "lastName", "phone", "updatedAt") SELECT "basePayRate", "createdAt", "departmentId", "email", "emergencyContact", "employeeId", "firstName", "hireDate", "id", "isActive", "lastName", "phone", "updatedAt" FROM "Operator";
DROP TABLE "Operator";
ALTER TABLE "new_Operator" RENAME TO "Operator";
CREATE UNIQUE INDEX "Operator_employeeId_key" ON "Operator"("employeeId");
CREATE INDEX "Operator_tenantId_idx" ON "Operator"("tenantId");
CREATE TABLE "new_Plant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default'
);
INSERT INTO "new_Plant" ("id", "name") SELECT "id", "name" FROM "Plant";
DROP TABLE "Plant";
ALTER TABLE "new_Plant" RENAME TO "Plant";
CREATE INDEX "Plant_tenantId_idx" ON "Plant"("tenantId");
CREATE TABLE "new_Workcenter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plantId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "workcenterNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayTitle" TEXT,
    "defaultSchemeId" INTEGER,
    "minStaff" INTEGER NOT NULL DEFAULT 0,
    "gatingRules" TEXT,
    "changeoverFamily" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    CONSTRAINT "Workcenter_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Workcenter_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Workcenter" ("changeoverFamily", "defaultSchemeId", "departmentId", "displayTitle", "gatingRules", "id", "minStaff", "name", "plantId", "workcenterNo") SELECT "changeoverFamily", "defaultSchemeId", "departmentId", "displayTitle", "gatingRules", "id", "minStaff", "name", "plantId", "workcenterNo" FROM "Workcenter";
DROP TABLE "Workcenter";
ALTER TABLE "new_Workcenter" RENAME TO "Workcenter";
CREATE INDEX "Workcenter_tenantId_idx" ON "Workcenter"("tenantId");
CREATE UNIQUE INDEX "Workcenter_plantId_workcenterNo_key" ON "Workcenter"("plantId", "workcenterNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
