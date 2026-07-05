/*
  Warnings:

  - You are about to drop the column `ltv1` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `ltv2` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `ltv3` on the `Contact` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "ltv1",
DROP COLUMN "ltv2",
DROP COLUMN "ltv3";

-- AlterTable
ALTER TABLE "OpportunityValue" ADD COLUMN     "ltv" DECIMAL(5,2);
