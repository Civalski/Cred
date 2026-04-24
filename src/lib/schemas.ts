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
  })
  .refine((d) => d.senha === d.senhaConfirmacao, {
    message: "As senhas não coincidem",
    path: ["senhaConfirmacao"],
  });

export const loginSchema = z.object({
  login: z.string().min(1, "Login é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export const patchUserSchema = z
  .object({
    cpf: cpfSchema.optional(),
    rg: z.string().min(1).optional(),
    nome: z.string().min(1).optional(),
    idade: z.coerce.number().int().min(0).max(130).optional(),
    email: z.string().email().optional(),
    login: z.string().min(2).optional(),
    senha: strongPasswordSchema.optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Informe ao menos um campo para atualizar",
  });

export const createOrderSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
});

export const deleteUserModeSchema = z.enum(["soft", "hard"]).optional();

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PatchUserInput = z.infer<typeof patchUserSchema>;
