-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "connection_requests" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "devices" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "patients" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

-- AlterTable
ALTER TABLE "providers" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
