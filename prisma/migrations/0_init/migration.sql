-- CreateEnum
CREATE TYPE "UnitPreference" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "GearComponentType" AS ENUM ('MAIN', 'RESERVE', 'AAD', 'CONTAINER', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkJumpType" AS ENUM ('AFF', 'TANDEM', 'CAMERA', 'COACH');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'SENT', 'PAID');

-- CreateEnum
CREATE TYPE "InvoiceLineItemType" AS ENUM ('BASE_JUMP', 'HANDCAM_ADDON');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "taxRegistrationNumber" TEXT,
    "remittanceDetails" TEXT,
    "licenseNumber" TEXT,
    "unitPreference" "UnitPreference" NOT NULL DEFAULT 'IMPERIAL',
    "currentJumpNumber" INTEGER NOT NULL DEFAULT 0,
    "startingFreefallTime" INTEGER NOT NULL DEFAULT 0,
    "startingCutaways" INTEGER NOT NULL DEFAULT 0,
    "invoiceStartingNumber" INTEGER NOT NULL DEFAULT 1,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "isWorkingSkydiver" BOOLEAN NOT NULL DEFAULT false,
    "brandingLogo" TEXT,
    "brandingCompanyName" TEXT,
    "brandingPrimaryColor" TEXT,
    "brandingInvoiceFooter" TEXT,
    "defaultDropzoneId" TEXT,
    "defaultExitAltitude" INTEGER,
    "defaultDeploymentAltitude" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gear_components" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GearComponentType" NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT,
    "serialNumber" TEXT,
    "previousJumpCount" INTEGER NOT NULL DEFAULT 0,
    "serviceDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gear_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rigs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rigs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rig_components" (
    "id" TEXT NOT NULL,
    "rigId" TEXT NOT NULL,
    "gearComponentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rig_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dropzones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "country" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "currency" TEXT,
    "rateAFF" DECIMAL(10,2),
    "rateTandem" DECIMAL(10,2),
    "rateCamera" DECIMAL(10,2),
    "rateCoach" DECIMAL(10,2),
    "rateHandcam" DECIMAL(10,2),
    "taxRate" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dropzones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_jump_types" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_jump_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_aircrafts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_aircrafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jumps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jumpNumber" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "dropzoneId" TEXT NOT NULL,
    "aircraftId" TEXT,
    "jumpTypeId" TEXT,
    "rigId" TEXT,
    "exitAltitude" INTEGER,
    "deploymentAltitude" INTEGER,
    "freefallTime" INTEGER,
    "distanceToTarget" INTEGER,
    "isCutaway" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "photoUrl" TEXT,
    "isWorkJump" BOOLEAN NOT NULL DEFAULT false,
    "workJumpType" "WorkJumpType",
    "customerName" TEXT,
    "hasHandcam" BOOLEAN NOT NULL DEFAULT false,
    "isImportedAsPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jumps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jump_gear_components" (
    "id" TEXT NOT NULL,
    "jumpId" TEXT NOT NULL,
    "gearComponentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jump_gear_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jump_signatures" (
    "id" TEXT NOT NULL,
    "jumpId" TEXT NOT NULL,
    "signerLicenseNumber" TEXT NOT NULL,
    "signatureImage" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jump_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dropzoneId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATE NOT NULL,
    "dueDate" DATE,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,2),
    "taxAmount" DECIMAL(10,2),
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "pdfUrl" TEXT,
    "sentDate" TIMESTAMP(3),
    "shareableUrl" TEXT,
    "shareableUrlExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "jumpId" TEXT NOT NULL,
    "itemType" "InvoiceLineItemType" NOT NULL,
    "workJumpType" "WorkJumpType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jump_number_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "previousNumber" INTEGER NOT NULL,
    "newNumber" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jump_number_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_dropzones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_dropzones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_aircrafts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_aircrafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_jump_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_jump_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "gear_components_userId_idx" ON "gear_components"("userId");

-- CreateIndex
CREATE INDEX "gear_components_type_idx" ON "gear_components"("type");

-- CreateIndex
CREATE INDEX "gear_components_serviceDate_idx" ON "gear_components"("serviceDate");

-- CreateIndex
CREATE INDEX "rigs_userId_idx" ON "rigs"("userId");

-- CreateIndex
CREATE INDEX "rig_components_rigId_idx" ON "rig_components"("rigId");

-- CreateIndex
CREATE INDEX "rig_components_gearComponentId_idx" ON "rig_components"("gearComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "rig_components_rigId_gearComponentId_key" ON "rig_components"("rigId", "gearComponentId");

-- CreateIndex
CREATE INDEX "dropzones_userId_idx" ON "dropzones"("userId");

-- CreateIndex
CREATE INDEX "dropzones_isActive_idx" ON "dropzones"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "dropzones_userId_name_key" ON "dropzones"("userId", "name");

-- CreateIndex
CREATE INDEX "user_jump_types_userId_idx" ON "user_jump_types"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_jump_types_userId_name_key" ON "user_jump_types"("userId", "name");

-- CreateIndex
CREATE INDEX "user_aircrafts_userId_idx" ON "user_aircrafts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_aircrafts_userId_name_key" ON "user_aircrafts"("userId", "name");

-- CreateIndex
CREATE INDEX "jumps_userId_idx" ON "jumps"("userId");

-- CreateIndex
CREATE INDEX "jumps_dropzoneId_idx" ON "jumps"("dropzoneId");

-- CreateIndex
CREATE INDEX "jumps_date_idx" ON "jumps"("date");

-- CreateIndex
CREATE INDEX "jumps_jumpNumber_idx" ON "jumps"("jumpNumber");

-- CreateIndex
CREATE INDEX "jumps_isWorkJump_idx" ON "jumps"("isWorkJump");

-- CreateIndex
CREATE INDEX "jumps_isImportedAsPaid_idx" ON "jumps"("isImportedAsPaid");

-- CreateIndex
CREATE INDEX "jumps_aircraftId_idx" ON "jumps"("aircraftId");

-- CreateIndex
CREATE INDEX "jumps_jumpTypeId_idx" ON "jumps"("jumpTypeId");

-- CreateIndex
CREATE INDEX "jumps_rigId_idx" ON "jumps"("rigId");

-- CreateIndex
CREATE INDEX "jump_gear_components_jumpId_idx" ON "jump_gear_components"("jumpId");

-- CreateIndex
CREATE INDEX "jump_gear_components_gearComponentId_idx" ON "jump_gear_components"("gearComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "jump_gear_components_jumpId_gearComponentId_key" ON "jump_gear_components"("jumpId", "gearComponentId");

-- CreateIndex
CREATE INDEX "jump_signatures_jumpId_idx" ON "jump_signatures"("jumpId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_shareableUrl_key" ON "invoices"("shareableUrl");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- CreateIndex
CREATE INDEX "invoices_dropzoneId_idx" ON "invoices"("dropzoneId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_invoiceDate_idx" ON "invoices"("invoiceDate");

-- CreateIndex
CREATE INDEX "invoice_line_items_invoiceId_idx" ON "invoice_line_items"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_line_items_jumpId_idx" ON "invoice_line_items"("jumpId");

-- CreateIndex
CREATE INDEX "invoice_line_items_itemType_idx" ON "invoice_line_items"("itemType");

-- CreateIndex
CREATE INDEX "jump_number_audit_logs_userId_idx" ON "jump_number_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "jump_number_audit_logs_changedAt_idx" ON "jump_number_audit_logs"("changedAt");

-- CreateIndex
CREATE INDEX "global_dropzones_country_idx" ON "global_dropzones"("country");

-- CreateIndex
CREATE INDEX "global_dropzones_name_idx" ON "global_dropzones"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_defaultDropzoneId_fkey" FOREIGN KEY ("defaultDropzoneId") REFERENCES "dropzones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gear_components" ADD CONSTRAINT "gear_components_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rigs" ADD CONSTRAINT "rigs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rig_components" ADD CONSTRAINT "rig_components_rigId_fkey" FOREIGN KEY ("rigId") REFERENCES "rigs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rig_components" ADD CONSTRAINT "rig_components_gearComponentId_fkey" FOREIGN KEY ("gearComponentId") REFERENCES "gear_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dropzones" ADD CONSTRAINT "dropzones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_jump_types" ADD CONSTRAINT "user_jump_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_aircrafts" ADD CONSTRAINT "user_aircrafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumps" ADD CONSTRAINT "jumps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumps" ADD CONSTRAINT "jumps_dropzoneId_fkey" FOREIGN KEY ("dropzoneId") REFERENCES "dropzones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumps" ADD CONSTRAINT "jumps_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "user_aircrafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumps" ADD CONSTRAINT "jumps_jumpTypeId_fkey" FOREIGN KEY ("jumpTypeId") REFERENCES "user_jump_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumps" ADD CONSTRAINT "jumps_rigId_fkey" FOREIGN KEY ("rigId") REFERENCES "rigs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jump_gear_components" ADD CONSTRAINT "jump_gear_components_jumpId_fkey" FOREIGN KEY ("jumpId") REFERENCES "jumps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jump_gear_components" ADD CONSTRAINT "jump_gear_components_gearComponentId_fkey" FOREIGN KEY ("gearComponentId") REFERENCES "gear_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jump_signatures" ADD CONSTRAINT "jump_signatures_jumpId_fkey" FOREIGN KEY ("jumpId") REFERENCES "jumps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_dropzoneId_fkey" FOREIGN KEY ("dropzoneId") REFERENCES "dropzones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_jumpId_fkey" FOREIGN KEY ("jumpId") REFERENCES "jumps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jump_number_audit_logs" ADD CONSTRAINT "jump_number_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

