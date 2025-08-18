# 🤖 GUIDELINES PARA IA JUNIE - SUPER APP PROJECT

## 📋 VISÃO GERAL DO PROJETO

### **Descrição:**
Super App é um marketplace de serviços que conecta prestadores de serviço, compradores e anunciantes. O projeto utiliza arquitetura monorepo com backend Node.js e frontend mobile React Native + Expo.

### **Objetivo Principal:**
Criar uma plataforma completa onde usuários podem buscar, contratar e oferecer serviços de qualquer categoria, com sistema de upload de mídias via MongoDB GridFS.

---

## 🏗️ ESTRUTURA DO PROJETO

### **Arquitetura Monorepo:**
```
super-app-novo/
├── packages/
│   ├── backend/     ← API Node.js + TypeScript + MongoDB
│   ├── mobile/      ← App React Native + Expo
│   └── web/         ← Frontend React + Vite (futuro)
├── .junie/          ← Configurações da IA Junie
└── docs/            ← Documentação do projeto
```

### **Tecnologias Principais:**
- **Backend**: Node.js 18+, TypeScript, Express.js, MongoDB, Mongoose, GridFS
- **Mobile**: React Native, Expo SDK 53, TypeScript, React Navigation 6
- **Gerenciamento**: pnpm workspaces, ESLint, Prettier
- **Banco de Dados**: MongoDB 7.0+ com GridFS para upload de mídias

---

## 📱 PADRÕES DE DESENVOLVIMENTO MOBILE

### **Estrutura de Arquivos:**
```
packages/mobile/src/
├── components/      ← Componentes reutilizáveis
├── context/         ← Context API (Auth, App)
├── hooks/           ← Custom hooks
├── navigation/      ← React Navigation
├── screens/         ← Telas organizadas por funcionalidade
├── services/        ← API calls e integrações
├── styles/          ← Temas e estilos globais
├── types/           ← Interfaces TypeScript
└── utils/           ← Funções utilitárias
```

### **Convenções de Nomenclatura:**
- **Arquivos**: PascalCase para componentes (`UserProfile.tsx`)
- **Pastas**: camelCase (`userProfile/`)
- **Variáveis**: camelCase (`userName`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase com sufixo (`UserInterface`, `ApiResponse`)

### **Padrões de Componentes:**
```typescript
// ✅ CORRETO - Estrutura padrão de componente
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface ComponentProps {
  title: string;
  onPress?: () => void;
}

const Component: React.FC<ComponentProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default Component;
```

---

## 🖥️ PADRÕES DE DESENVOLVIMENTO BACKEND

### **Estrutura de Arquivos:**
```
packages/backend/src/
├── config/          ← Configurações (DB, env)
├── controllers/     ← Controladores da API
├── middleware/      ← Middlewares (auth, validation)
├── models/          ← Modelos Mongoose
├── routes/          ← Rotas da API
├── services/        ← Lógica de negócio
├── types/           ← Interfaces TypeScript
└── utils/           ← Funções utilitárias
```

### **Padrões de API REST:**
```typescript
// ✅ CORRETO - Estrutura de controller
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

export const userController = {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAll();
      res.status(200).json({
        success: true,
        data: users,
        message: 'Usuários recuperados com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
};
```

### **Padrões de Resposta API:**
```typescript
// ✅ SEMPRE use este formato de resposta
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}
```

---

## 🎨 PADRÕES DE UI/UX

### **Design System:**
- **Biblioteca**: React Native Paper (Material Design 3)
- **Cores Primárias**: `#6200EE` (roxo), `#03DAC6` (teal)
- **Tipografia**: Roboto (Android), SF Pro (iOS)
- **Espaçamentos**: Múltiplos de 8px (8, 16, 24, 32)

### **Componentes Obrigatórios:**
```typescript
// ✅ SEMPRE use estes componentes base
import { Button, Card, Text, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
```

### **Padrões de Navegação:**
- **Tela Inicial**: BuscarOfertasScreen (lista de ofertas)
- **Bottom Tabs**: Ofertas, Agenda, Chat, Comunidade, Perfil
- **Sem Welcome Screen**: App vai direto para ofertas
- **Autenticação**: Modal/Stack separado

---

## 🔐 PADRÕES DE AUTENTICAÇÃO

### **Fluxo de Auth:**
1. **Login/Registro** → JWT token + refresh token
2. **Persistência** → AsyncStorage (mobile) / localStorage (web)
3. **Interceptors** → Axios para renovação automática
4. **Context** → AuthContext global

### **Tipos de Usuário:**
```typescript
type UserType = 'buyer' | 'provider' | 'advertiser';

interface User {
  _id: string;
  nome: string;
  email: string;
  tipo: UserType;
  avatar?: string;
  telefone?: string;
  localizacao?: {
    cidade: string;
    estado: string;
  };
}
```

---

## 📊 PADRÕES DE DADOS

### **Modelo Principal - OfertaServico:**
```typescript
interface OfertaServico {
  _id: string;
  titulo: string;
  descricao: string;
  preco: number;
  categoria: string;
  prestador: {
    _id: string;
    nome: string;
    avatar?: string;
    avaliacao: number;
  };
  imagens: string[];  // ⚠️ IMPORTANTE: é 'imagens', não 'imagem'
  localizacao: {
    cidade: string;
    estado: string;
    endereco?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### **Upload de Mídias:**
- **Sistema**: MongoDB GridFS (NÃO AWS S3)
- **Tipos**: Imagens (JPG, PNG) e Vídeos (MP4)
- **Limite**: 5 arquivos por oferta, 10MB cada
- **Processamento**: Thumbnails automáticos

---

## 🧪 PADRÕES DE TESTE

### **Testes Obrigatórios:**
- **Backend**: Jest + Supertest para APIs
- **Mobile**: Jest + React Native Testing Library
- **Cobertura**: Mínimo 80% para controllers e services

### **Estrutura de Testes:**
```typescript
// ✅ CORRETO - Estrutura de teste
describe('UserController', () => {
  beforeEach(() => {
    // Setup
  });

  it('should create user successfully', async () => {
    // Arrange
    const userData = { nome: 'Test', email: 'test@test.com' };
    
    // Act
    const response = await request(app)
      .post('/api/users')
      .send(userData);
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

---

## ⚠️ ANTIPADRÕES - NÃO FAÇA

### **❌ ERROS COMUNS A EVITAR:**

1. **Navegação Incorreta:**
   ```typescript
   // ❌ ERRADO - Não criar Welcome Screen
   <Stack.Screen name="Welcome" component={WelcomeScreen} />
   
   // ✅ CORRETO - Ir direto para ofertas
   <Tab.Screen name="Ofertas" component={BuscarOfertasScreen} />
   ```

2. **Propriedades Incorretas:**
   ```typescript
   // ❌ ERRADO
   item.imagem?.[0]
   
   // ✅ CORRETO
   item.imagens?.[0]
   ```

3. **Tipos Incorretos:**
   ```typescript
   // ❌ ERRADO
   const [category, setCategory] = useState<string | null>(null);
   
   // ✅ CORRETO
   const [category, setCategory] = useState<string | undefined>(undefined);
   ```

4. **Imports Incorretos:**
   ```typescript
   // ❌ ERRADO
   import IconButton from 'react-native-paper';
   
   // ✅ CORRETO
   import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
   ```

5. **Context Mal Exportado:**
   ```typescript
   // ❌ ERRADO - Context não exportado
   const AuthContext = createContext();
   
   // ✅ CORRETO - Context exportado
   export const AuthContext = createContext<AuthContextType>();
   export const useAuth = () => useContext(AuthContext);
   ```

---

## 🔧 CONFIGURAÇÕES TÉCNICAS

### **Dependências Obrigatórias (Mobile):**
```json
{
  "expo": "~53.0.0",
  "@react-navigation/native": "^6.1.18",
  "@react-navigation/bottom-tabs": "^6.6.1",
  "react-native-paper": "^5.14.5",
  "react-native-vector-icons": "^10.3.0",
  "axios": "^1.9.0",
  "@react-native-async-storage/async-storage": "^1.23.1"
}
```

### **Scripts Padrão:**
```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "build": "expo build"
}
```

### **Configuração TypeScript:**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 📝 REGRAS DE COMMIT E VERSIONAMENTO

### **Padrões de Commit:**
```
feat: adiciona tela de busca de ofertas
fix: corrige erro de autenticação
refactor: melhora estrutura de navegação
docs: atualiza README do projeto
test: adiciona testes para UserService
```

### **Branches:**
- `main` - Produção
- `develop` - Desenvolvimento
- `feature/nome-da-feature` - Novas funcionalidades
- `fix/nome-do-bug` - Correções

---

## 🎯 OBJETIVOS DE QUALIDADE

### **Performance:**
- **Mobile**: Tempo de inicialização < 3s
- **API**: Resposta < 500ms para endpoints básicos
- **Bundle**: Tamanho do app < 50MB

### **Acessibilidade:**
- **Labels**: Todos os elementos interativos
- **Contraste**: Mínimo 4.5:1
- **Navegação**: Suporte a screen readers

### **Segurança:**
- **JWT**: Tokens com expiração
- **Validação**: Zod para entrada de dados
- **Rate Limiting**: 100 req/min por IP
- **CORS**: Configurado para domínios específicos

---

## 🚀 COMANDOS ESSENCIAIS

### **Desenvolvimento:**
```bash
# Instalar dependências
pnpm install

# Backend
cd packages/backend && pnpm run dev

# Mobile
cd packages/mobile && npx expo start

# Testes
pnpm test

# Build
pnpm build
```

### **Troubleshooting:**
```bash
# Limpar cache
npx expo r -c

# Reset completo
rm -rf node_modules .expo
pnpm install

# Verificar saúde
npx expo doctor
```

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

### **Links Importantes:**
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)
- [MongoDB GridFS](https://docs.mongodb.com/manual/core/gridfs/)

### **Arquivos de Configuração Críticos:**
- `packages/mobile/app.json` - Configuração Expo
- `packages/mobile/babel.config.js` - Babel + Module Resolver
- `packages/backend/.env` - Variáveis de ambiente
- `.junie/guidelines.md` - Este arquivo

---

## ⚡ INSTRUÇÕES ESPECÍFICAS PARA JUNIE

### **Ao Criar Código:**
1. **SEMPRE** siga os padrões definidos neste documento
2. **SEMPRE** use TypeScript com tipagem rigorosa
3. **SEMPRE** implemente tratamento de erros
4. **SEMPRE** adicione comentários explicativos
5. **SEMPRE** teste o código antes de finalizar

### **Ao Corrigir Bugs:**
1. **IDENTIFIQUE** a causa raiz do problema
2. **VERIFIQUE** se a correção não quebra outras funcionalidades
3. **TESTE** a correção em diferentes cenários
4. **DOCUMENTE** a correção se necessário

### **Ao Implementar Features:**
1. **ANALISE** os requisitos completamente
2. **PLANEJE** a implementação seguindo os padrões
3. **IMPLEMENTE** incrementalmente
4. **TESTE** cada incremento
5. **REFATORE** se necessário para manter qualidade

### **Prioridades:**
1. **Funcionalidade** - O código deve funcionar 100%
2. **Padrões** - Seguir as convenções do projeto
3. **Performance** - Otimizar quando possível
4. **Manutenibilidade** - Código limpo e documentado

---

## 🎯 METAS DO PROJETO

### **Curto Prazo (1-2 semanas):**
- ✅ Backend 100% funcional
- ✅ Mobile iniciando sem erros
- ✅ Autenticação completa
- ✅ Tela de busca de ofertas funcionando

### **Médio Prazo (1 mês):**
- ✅ Sistema de upload MongoDB GridFS
- ✅ CRUD completo de ofertas
- ✅ Sistema de chat básico
- ✅ Agenda de prestadores

### **Longo Prazo (3 meses):**
- ✅ Sistema de pagamentos
- ✅ Avaliações e reviews
- ✅ Notificações push
- ✅ Deploy em produção

---

**🤖 LEMBRE-SE: Você é uma colaboradora essencial neste projeto. Sempre priorize qualidade, funcionalidade e aderência aos padrões estabelecidos. Em caso de dúvida, pergunte antes de implementar!**

