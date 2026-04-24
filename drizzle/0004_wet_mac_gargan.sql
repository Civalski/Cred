DROP INDEX "clients_user_id_cpf_unique";--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_user_id_cpf_unique" ON "clients" USING btree ("user_id","cpf") WHERE "clients"."deleted_at" is null;