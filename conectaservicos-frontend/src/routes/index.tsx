import { createBrowserRouter, Navigate } from "react-router-dom";

import { PublicLayout } from "@/layouts/PublicLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRoute } from "@/routes/RoleRoute";

import Landing from "@/pages/publico/Landing";
import BuscaPrestadores from "@/pages/publico/BuscaPrestadores";
import PerfilPrestador from "@/pages/publico/PerfilPrestador";

import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import RegisterChoice from "@/pages/auth/RegisterChoice";
import RegisterCliente from "@/pages/auth/RegisterCliente";
import RegisterEmpresa from "@/pages/auth/RegisterEmpresa";
import RegisterPrestador from "@/pages/auth/RegisterPrestador";

import ClienteDashboard from "@/pages/cliente/Dashboard";
import ClienteSolicitacoes from "@/pages/cliente/Solicitacoes";
import ClienteNovaSolicitacao from "@/pages/cliente/NovaSolicitacaoPage";
import ClienteSolicitacaoDetalhe from "@/pages/cliente/SolicitacaoDetalhePage";

import EmpresaDashboard from "@/pages/empresa/Dashboard";
import EmpresaSolicitacoes from "@/pages/empresa/Solicitacoes";
import EmpresaNovaSolicitacao from "@/pages/empresa/NovaSolicitacaoPage";
import EmpresaSolicitacaoDetalhe from "@/pages/empresa/SolicitacaoDetalhePage";

import PrestadorDashboard from "@/pages/prestador/Dashboard";
import Oportunidades from "@/pages/prestador/Oportunidades";
import OportunidadeDetalhe from "@/pages/prestador/OportunidadeDetalhe";
import Propostas from "@/pages/prestador/Propostas";
import Servicos from "@/pages/prestador/Servicos";
import Carteira from "@/pages/prestador/Carteira";
import PrestadorPagamentos from "@/pages/prestador/Pagamentos";

import Chat from "@/pages/Chat";
import Checkout from "@/pages/pagamento/Checkout";
import StatusPagamento from "@/pages/pagamento/StatusPagamento";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsuarios from "@/pages/admin/Usuarios";
import AdminPrestadores from "@/pages/admin/Prestadores";
import AdminEmpresas from "@/pages/admin/Empresas";
import AdminPagamentos from "@/pages/admin/Pagamentos";
import AdminComissao from "@/pages/admin/Comissao";
import AdminDenuncias from "@/pages/admin/Denuncias";

import NotFound from "@/pages/NotFound";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/prestadores", element: <BuscaPrestadores /> },
      { path: "/prestadores/:id", element: <PerfilPrestador /> },
      { path: "/login", element: <Login /> },
      { path: "/esqueci-senha", element: <ForgotPassword /> },
      { path: "/redefinir-senha", element: <ResetPassword /> },
      { path: "/cadastro", element: <RegisterChoice /> },
      { path: "/cadastro/cliente", element: <RegisterCliente /> },
      { path: "/cadastro/empresa", element: <RegisterEmpresa /> },
      { path: "/cadastro/prestador", element: <RegisterPrestador /> },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      // ── Cliente ───────────────────────────────────────────────────────────
      {
        element: <RoleRoute allow={["CLIENTE"]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/cliente", element: <Navigate to="/cliente/dashboard" replace /> },
              { path: "/cliente/dashboard", element: <ClienteDashboard /> },
              { path: "/cliente/solicitacoes", element: <ClienteSolicitacoes /> },
              { path: "/cliente/solicitacoes/nova", element: <ClienteNovaSolicitacao /> },
              { path: "/cliente/solicitacoes/:id", element: <ClienteSolicitacaoDetalhe /> },
            ],
          },
        ],
      },

      // ── Empresa ───────────────────────────────────────────────────────────
      {
        element: <RoleRoute allow={["EMPRESA"]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/empresa", element: <Navigate to="/empresa/dashboard" replace /> },
              { path: "/empresa/dashboard", element: <EmpresaDashboard /> },
              { path: "/empresa/solicitacoes", element: <EmpresaSolicitacoes /> },
              { path: "/empresa/solicitacoes/nova", element: <EmpresaNovaSolicitacao /> },
              { path: "/empresa/solicitacoes/:id", element: <EmpresaSolicitacaoDetalhe /> },
            ],
          },
        ],
      },

      // ── Prestador ─────────────────────────────────────────────────────────
      {
        element: <RoleRoute allow={["PRESTADOR"]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/prestador", element: <Navigate to="/prestador/dashboard" replace /> },
              { path: "/prestador/dashboard", element: <PrestadorDashboard /> },
              { path: "/prestador/oportunidades", element: <Oportunidades /> },
              { path: "/prestador/oportunidades/:id", element: <OportunidadeDetalhe /> },
              { path: "/prestador/propostas", element: <Propostas /> },
              { path: "/prestador/servicos", element: <Servicos /> },
              { path: "/prestador/carteira", element: <Carteira /> },
              { path: "/prestador/pagamentos", element: <PrestadorPagamentos /> },
            ],
          },
        ],
      },

      // ── Áreas compartilhadas entre CLIENTE, EMPRESA e PRESTADOR ───────────
      {
        element: <RoleRoute allow={["CLIENTE", "EMPRESA", "PRESTADOR"]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/chat", element: <Chat /> },
              { path: "/chat/:serviceRequestId", element: <Chat /> },
            ],
          },
          // Checkout e retorno do gateway ficam fora do layout com menu para
          // manter o foco na transação. As três URLs de retorno abaixo são as
          // que o backend envia ao Mercado Pago (back_urls).
          { path: "/checkout/:orderId", element: <Checkout /> },
          { path: "/pedidos/:orderId/pagamento/sucesso", element: <StatusPagamento resultado="sucesso" /> },
          { path: "/pedidos/:orderId/pagamento/pendente", element: <StatusPagamento resultado="pendente" /> },
          { path: "/pedidos/:orderId/pagamento/falha", element: <StatusPagamento resultado="falha" /> },
        ],
      },

      // ── Administração ─────────────────────────────────────────────────────
      {
        element: <RoleRoute allow={["ADMIN"]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
              { path: "/admin/dashboard", element: <AdminDashboard /> },
              { path: "/admin/usuarios", element: <AdminUsuarios /> },
              { path: "/admin/prestadores", element: <AdminPrestadores /> },
              { path: "/admin/empresas", element: <AdminEmpresas /> },
              { path: "/admin/pagamentos", element: <AdminPagamentos /> },
              { path: "/admin/comissoes", element: <AdminComissao /> },
              { path: "/admin/configuracoes/comissao", element: <Navigate to="/admin/comissoes" replace /> },
              { path: "/admin/denuncias", element: <AdminDenuncias /> },
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <NotFound /> },
]);
