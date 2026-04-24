import { z } from "zod";

const cpfSchema = z
  .string()
  .transform((s) => s.replace(/\D/g, ""))
  .refine((s) => s.length === 11, { message: "CPF deve ter 11 dígitos" });

const SENHA_MIN_LEN = 8;

/** Uma letra minúscula, uma maiúscula, um número e um caractere especial. */
export const strongPasswordSchema = z
  .string()
  .min(SENHA_MIN_LEN, `A senha deve ter ao menos ${SENHA_MIN_LEN} caracteres`)
  .refine((s) => /[a-z]/.test(s), { message: "Inclua ao menos uma letra minúscula" })
  .refine((s) => /[A-Z]/.test(s), { message: "Inclua ao menos uma letra maiúscula" })
  .refine((s) => /[0-9]/.test(s), { message: "Inclua ao menos um número" })
  .refine((s) => /[^A-Za-z0-9]/.test(s), {
    message: "Inclua ao menos um caractere especial",
  });

export const registerUserSchema = z
  .object({
    login: z.string().min(2, "Login deve ter ao menos 2 caracteres"),
    senha: strongPasswordSchema,
    senhaConfirmacao: z.string().min(1, "Confirme a senha"),
    turnstileToken: z.string().min(1).optional(),
  })
  .refine((d) => d.senha === d.senhaConfirmacao, {
    message: "As senhas não coincidem",
    path: ["senhaConfirmacao"],
  });

export const loginSchema = z.object({
  login: z.string().min(1, "Login é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
  turnstileToken: z.string().min(1).optional(),
});

export const patchUserSchema = z
  .object({
    login: z.string().min(2).optional(),
    senha: strongPasswordSchema.optional(),
  })
  .refine(
    (data) => data.login !== undefined || data.senha !== undefined,
    { message: "Informe ao menos um campo para atualizar" },
  );

/** Senha definida pelo admin para outro usuário (mesmas regras de força do cadastro). */
export const adminSetUserPasswordSchema = z
  .object({
    senha: strongPasswordSchema,
    senhaConfirmacao: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.senha === d.senhaConfirmacao, {
    message: "As senhas não coincidem",
    path: ["senhaConfirmacao"],
  });

export const createOrderSchema = z.object({
  clientId: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : val,
    z.string().uuid("Cliente inválido").optional(),
  ),
  titulo: z
    .string()
    .min(1, "Título é obrigatório")
    .max(200, "Título muito longo"),
  descricao: z
    .string()
    .max(4000, "Detalhes muito longos")
    .optional()
    .transform((s) => (typeof s === "string" ? s.trim() : "")),
  preco: z.coerce
    .number({ error: "Preço inválido" })
    .min(0, "O preço não pode ser negativo"),
  quantidade: z.coerce
    .number({ error: "Quantidade inválida" })
    .int("Quantidade deve ser um número inteiro")
    .min(1, "A quantidade mínima é 1"),
});

/** Corpo de PATCH em `/api/orders/[id]` (mesma forma que criação). */
export const updateOrderSchema = createOrderSchema;

export const createClientSchema = z.object({
  cpf: cpfSchema,
  rg: z.string().min(1, "RG é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  idade: z.coerce
    .number({ error: "Idade é obrigatória" })
    .int()
    .min(0, "Idade inválida")
    .max(130, "Idade inválida"),
  email: z.string().email("E-mail inválido"),
});

export const updateClientSchema = createClientSchema;

export const deleteUserModeSchema = z.enum(["soft", "hard"]).optional();

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PatchUserInput = z.infer<typeof patchUserSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
