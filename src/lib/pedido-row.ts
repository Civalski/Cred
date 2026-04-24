export type PedidoClienteOption = { id: string; nome: string };

export type PedidoRow = {
  id: string;
  clientId: string | null;
  titulo: string;
  descricao: string;
  preco: number;
  quantidade: number;
  createdAt: string;
  clientNome: string | null;
};
