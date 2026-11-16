-- Add contact profile and birthday communication preferences without changing existing records.
CREATE TYPE "CommunicationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'PHONE', 'NONE');
ALTER TABLE "Contact"
  ADD COLUMN "category" TEXT,
  ADD COLUMN "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN "address" TEXT,
  ADD COLUMN "preferredCommunicationChannel" "CommunicationChannel" NOT NULL DEFAULT 'WHATSAPP',
  ADD COLUMN "birthdayMessagingConsent" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Contact_organizationId_dateOfBirth_idx" ON "Contact"("organizationId", "dateOfBirth");
