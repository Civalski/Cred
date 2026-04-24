ALTER TABLE "orders" ADD COLUMN "titulo" text;--> statement-breakpoint
UPDATE "orders" SET "titulo" = CASE
  WHEN trim(coalesce("descricao", '')) = '' THEN 'Pedido'
  ELSE left(trim("descricao"), 200)
END
WHERE "titulo" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "titulo" SET NOT NULL;--> statement-breakpoint
