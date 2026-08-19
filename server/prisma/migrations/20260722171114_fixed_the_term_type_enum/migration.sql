/*
  Warnings:

  - The values [SEMESTER_ONE,SEMESTER_TWO] on the enum `AcademicTermType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AcademicTermType_new" AS ENUM ('SEMESTER_1', 'SEMESTER_2', 'TRIMESTER_1', 'TRIMESTER_2', 'TRIMESTER_3', 'QUARTER_1', 'QUARTER_2', 'QUARTER_3', 'QUARTER_4', 'SUMMER');
ALTER TABLE "AcademicTerm" ALTER COLUMN "type" TYPE "AcademicTermType_new" USING ("type"::text::"AcademicTermType_new");
ALTER TYPE "AcademicTermType" RENAME TO "AcademicTermType_old";
ALTER TYPE "AcademicTermType_new" RENAME TO "AcademicTermType";
DROP TYPE "public"."AcademicTermType_old";
COMMIT;
