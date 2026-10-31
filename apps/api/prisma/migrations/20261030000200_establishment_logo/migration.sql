-- Optional business logo. Existing rows and their versions remain unchanged.
ALTER TABLE "Establishment" ADD COLUMN "logoDataUrl" TEXT;
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_logo_size"
  CHECK ("logoDataUrl" IS NULL OR octet_length("logoDataUrl") <= 90000);
