ALTER TABLE "users" DROP CONSTRAINT "users_cpf_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "cpf";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "rg";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "nome";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "idade";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email";