ALTER TABLE "orders" ADD COLUMN "preco" double precision NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quantidade" integer NOT NULL DEFAULT 1;