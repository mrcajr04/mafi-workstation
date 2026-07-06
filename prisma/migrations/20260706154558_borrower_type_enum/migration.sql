-- CreateEnum
CREATE TYPE "BorrowerType" AS ENUM ('PRIMARY', 'SECOND_HOME', 'INVESTMENT', 'OTHER');

-- Convert existing free-text borrower type values into the canonical enum.
ALTER TABLE "Contact"
ADD COLUMN "borrowerType_new" "BorrowerType" NOT NULL DEFAULT 'OTHER';

UPDATE "Contact"
SET "borrowerType_new" = CASE
  WHEN lower(trim("borrowerType")) = 'primary'
    OR upper(trim("borrowerType")) = 'PRIMARY'
    THEN 'PRIMARY'::"BorrowerType"
  WHEN lower(trim("borrowerType")) IN (
      'second home',
      'second home / vacation',
      'second / vacation',
      'second/vacation',
      'second vacation'
    )
    OR upper(trim("borrowerType")) IN (
      'SECOND_HOME',
      'SECOND_HOME_VACATION',
      'SECONDOND_VACATION'
    )
    THEN 'SECOND_HOME'::"BorrowerType"
  WHEN lower(trim("borrowerType")) = 'investment'
    OR upper(trim("borrowerType")) = 'INVESTMENT'
    THEN 'INVESTMENT'::"BorrowerType"
  ELSE 'OTHER'::"BorrowerType"
END;

ALTER TABLE "Contact" DROP COLUMN "borrowerType";
ALTER TABLE "Contact" RENAME COLUMN "borrowerType_new" TO "borrowerType";
ALTER TABLE "Contact" ALTER COLUMN "borrowerType" DROP DEFAULT;
