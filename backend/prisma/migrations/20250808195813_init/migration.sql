-- CreateTable
CREATE TABLE "Plant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Department_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workcenter" (
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
    CONSTRAINT "Workcenter_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Workcenter_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plantId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "label" TEXT,
    CONSTRAINT "Holiday_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SKU" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "familyColorHex" TEXT,
    "formula" TEXT,
    "bottleSize" TEXT,
    "caseSize" TEXT
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "skuId" INTEGER NOT NULL,
    CONSTRAINT "Product_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "skuId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "runRateUph" INTEGER NOT NULL,
    "performanceLeverPct" REAL NOT NULL DEFAULT 100,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "dueAt" DATETIME NOT NULL,
    "workcenterId" INTEGER,
    "shopfloorTitle" TEXT,
    "colorHex" TEXT,
    CONSTRAINT "Order_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_workcenterId_fkey" FOREIGN KEY ("workcenterId") REFERENCES "Workcenter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleBlock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workcenterId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduleBlock_workcenterId_fkey" FOREIGN KEY ("workcenterId") REFERENCES "Workcenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduleBlock_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Changeover" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workcenterId" INTEGER NOT NULL,
    "fromBlockId" INTEGER NOT NULL,
    "toBlockId" INTEGER NOT NULL,
    "typeCode" TEXT NOT NULL,
    "plannedMinutes" INTEGER NOT NULL,
    "includeInOee" BOOLEAN NOT NULL DEFAULT true,
    "complexityTier" TEXT,
    CONSTRAINT "Changeover_workcenterId_fkey" FOREIGN KEY ("workcenterId") REFERENCES "Workcenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Changeover_fromBlockId_fkey" FOREIGN KEY ("fromBlockId") REFERENCES "ScheduleBlock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Changeover_toBlockId_fkey" FOREIGN KEY ("toBlockId") REFERENCES "ScheduleBlock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Workcenter_plantId_workcenterNo_key" ON "Workcenter"("plantId", "workcenterNo");

-- CreateIndex
CREATE UNIQUE INDEX "SKU_code_key" ON "SKU"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
