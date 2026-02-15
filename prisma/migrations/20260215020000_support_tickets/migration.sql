-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "SupportTicket" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketReply" (
  "id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "message" TEXT NOT NULL,
  "is_admin" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicketReply_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "SupportTicket_created_at_idx" ON "SupportTicket"("created_at");
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX "SupportTicket_user_id_idx" ON "SupportTicket"("user_id");
CREATE INDEX "SupportTicketReply_author_id_idx" ON "SupportTicketReply"("author_id");
CREATE INDEX "SupportTicketReply_created_at_idx" ON "SupportTicketReply"("created_at");
CREATE INDEX "SupportTicketReply_ticket_id_idx" ON "SupportTicketReply"("ticket_id");

-- FKs
ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportTicketReply"
  ADD CONSTRAINT "SupportTicketReply_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "SupportTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SupportTicketReply"
  ADD CONSTRAINT "SupportTicketReply_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
