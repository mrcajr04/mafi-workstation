-- CreateTable
CREATE TABLE "LoanProduct" (
    "id" UUID NOT NULL,
    "lender" TEXT NOT NULL,
    "loanType" TEXT NOT NULL,
    "loanSubtype" TEXT,
    "minFico" INTEGER NOT NULL,
    "maxLtv" DECIMAL(5,2) NOT NULL,
    "eligibleBorrowerTypes" TEXT NOT NULL,
    "eligiblePropertyTypes" TEXT NOT NULL,
    "eligiblePurposes" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanProduct_lender_idx" ON "LoanProduct"("lender");

-- CreateIndex
CREATE INDEX "LoanProduct_loanType_idx" ON "LoanProduct"("loanType");

-- CreateIndex
CREATE INDEX "LoanProduct_minFico_idx" ON "LoanProduct"("minFico");

-- CreateIndex
CREATE INDEX "LoanProduct_maxLtv_idx" ON "LoanProduct"("maxLtv");
