-- CreateEnum
CREATE TYPE "ScenarioProgram" AS ENUM ('FIXED_30', 'FIXED_15', 'ARM_1_1', 'ARM_3_1', 'ARM_5_1', 'ARM_7_1', 'ARM_10_1', 'IO');

-- AlterTable
ALTER TABLE "Scenario" ADD COLUMN     "program" "ScenarioProgram" NOT NULL DEFAULT 'FIXED_30';
