# Sistema de Login - Super Admin

## 📋 Visão Geral

Sistema de autenticação completo para proteger o acesso ao painel Super Admin, garantindo que apenas usuários com role `SUPER_ADMIN` possam acessar a área administrativa.

## 🔐 Componentes Criados

### 1. **Login Component** (`components/Login.jsx`)

- Interface de login com validação
- Validação específica para role SUPER_ADMIN
- Integração com endpoint `/api/auth/login`
- Armazenamento seguro de token e dados do usuário
- Design moderno e responsivo

### 2. **Auth Context** (`contexts/AuthContext.jsx`)

- Gerenciamento global de autenticação
- Persistência de sessão via localStorage
- Hook `useAuth()` para acesso fácil ao estado de autenticação
- Funções: `login()`, `logout()`
- Estados: `user`, `loading`, `isAuthenticated`, `isSuperAdmin`

### 3. **App.jsx Atualizado**

- Rotas protegidas com `ProtectedRoute`
- Redirecionamento automático baseado em autenticação
- Loading state durante verificação inicial

### 4. **SuperAdminPage Atualizado**

- Exibição do nome do usuário logado
- Botão de logout
- Header redesenhado com melhor UX

## 🚀 Fluxo de Autenticação

```
1. Usuário acessa "/" ou "/superadmin"
   ↓
2. Se não autenticado → redireciona para "/login"
   ↓
3. Usuário preenche credenciais
   ↓
4. Sistema valida com backend (subdomain: "superadminpage")
   ↓
5. Backend verifica se role === "SUPER_ADMIN"
   ↓
6. Token JWT é gerado e retornado
   ↓
7. Token e dados do usuário são salvos no localStorage
   ↓
8. Usuário é redirecionado para "/superadmin"
   ↓
9. ProtectedRoute valida permissões
   ↓
10. SuperAdminPage é renderizado
```

## 🔑 Endpoints Utilizados

### POST `/api/auth/login`

**Request:**

```json
{
  "email": "admin@toyland.com",
  "senha": "senha123",
  "subdomain": "superadminpage"
}
```

**Response (Sucesso):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "uuid",
    "nome": "Admin Super",
    "email": "admin@toyland.com",
    "role": "SUPER_ADMIN",
    "telefone": null
  }
}
```

**Response (Erro - Não é SUPER_ADMIN):**

```json
{
  "error": "Acesso restrito ao SUPER_ADMIN neste subdomínio."
}
```

## 📱 Estrutura de Rotas

```
/                    → Redireciona para /login ou /superadmin
/login               → Página de login (público)
/superadmin          → Painel Super Admin (protegido)
```

## 🛡️ Segurança

### Validações Implementadas:

1. **Backend** (`authController.js`):
   - Verifica se subdomain === "superadminpage"
   - Valida se usuário.role === "SUPER_ADMIN"
   - Retorna erro 403 se não for SUPER_ADMIN

2. **Frontend** (`Login.jsx`):
   - Valida role após login
   - Não salva token se não for SUPER_ADMIN
   - Exibe mensagem de erro apropriada

3. **Protected Route** (`App.jsx`):
   - Verifica autenticação
   - Valida roles permitidas
   - Redireciona se não autorizado

## 💾 Armazenamento

### LocalStorage:

- `token`: JWT token para autenticação
- `usuario`: Dados do usuário (sem senha)

### Axios Headers:

- `Authorization: Bearer ${token}` configurado automaticamente

## 🎨 Interface do Usuário

### Página de Login:

- Gradiente roxo moderno
- Campos: Email e Senha
- Validação em tempo real
- Mensagens de erro claras
- Loading state durante login
- Aviso de acesso restrito

### Header do SuperAdmin:

- Nome do usuário logado com badge
- Botão "Nova Empresa"
- Botão "Sair" para logout
- Design limpo e profissional

## 🔄 Logout

O logout é realizado através do botão "Sair" e:

1. Remove token do localStorage
2. Remove dados do usuário do localStorage
3. Remove header Authorization do axios
4. Limpa estado do contexto
5. Redireciona para /login

## 🧪 Como Testar

### 1. Criar um usuário SUPER_ADMIN no banco:

```javascript
// Use o seed ou crie manualmente
const usuario = await Usuario.create({
  nome: "Super Admin",
  email: "superadmin@toyland.com",
  senha: await bcrypt.hash("admin123", 10),
  role: "SUPER_ADMIN",
  ativo: true,
  empresaId: null, // ou ID de uma empresa
});
```

### 2. Acessar a aplicação:

```
http://localhost:3000/
```

### 3. Fazer login:

- Email: superadmin@toyland.com
- Senha: admin123

### 4. Verificar acesso:

- Deve ser redirecionado para `/superadmin`
- Header deve mostrar nome do usuário
- Deve poder criar empresas
- Botão "Sair" deve fazer logout

### 5. Testar proteção:

- Tentar fazer login com usuário não SUPER_ADMIN
- Deve exibir erro de acesso negado
- Tentar acessar `/superadmin` sem login
- Deve redirecionar para `/login`

## 🐛 Troubleshooting

### Problema: "Erro ao realizar login"

- Verificar se o backend está rodando
- Verificar se a URL da API está correta
- Verificar console do navegador para erros

### Problema: "Acesso negado"

- Verificar se o usuário tem role "SUPER_ADMIN"
- Verificar no banco de dados o campo `role`

### Problema: Redirecionamento infinito

- Limpar localStorage
- Verificar se o token não está expirado
- Fazer login novamente

### Problema: Token inválido

- Verificar se JWT_SECRET está configurado
- Verificar se o token não expirou
- Fazer logout e login novamente

## 📝 Próximos Passos (Opcional)

- [ ] Implementar recuperação de senha
- [ ] Adicionar autenticação de dois fatores
- [ ] Implementar refresh token
- [ ] Adicionar log de acessos
- [ ] Implementar sessões concorrentes
- [ ] Adicionar tempo de expiração de sessão
- [ ] Implementar "Lembrar-me"

## 🔗 Arquivos Relacionados

- [App.jsx](../App.jsx)
- [Login.jsx](../components/Login.jsx)
- [AuthContext.jsx](../contexts/AuthContext.jsx)
- [SuperAdminPage.jsx](../components/SuperAdminPage.jsx)
- [authController.js](../src/controllers/authController.js)
- [auth.routes.js](../src/routes/auth.routes.js)
