# Guia de Deploy - VirtualBox + Ubuntu

Este guia explica como configurar o sistema de Trading Bot em uma VM VirtualBox para testar com a Binance Testnet.

---

## Requisitos

- **VirtualBox** instalado no seu notebook
- **ISO do Ubuntu Server 22.04 LTS** (download: https://ubuntu.com/download/server)
- **Mínimo 2GB RAM** e **20GB de disco** para a VM
- **Conexão com internet**

---

## Parte 1: Criar a VM no VirtualBox

### 1.1 Criar Nova Máquina Virtual

1. Abra o VirtualBox
2. Clique em **"Novo"**
3. Configure:
   - **Nome:** `trading-bot`
   - **Tipo:** Linux
   - **Versão:** Ubuntu (64-bit)
4. **Memória RAM:** 2048 MB (2GB) ou mais
5. **Disco rígido:** Criar um disco virtual agora
   - Tipo: VDI
   - Dinamicamente alocado
   - Tamanho: 20 GB

### 1.2 Configurar Rede (IMPORTANTE)

1. Selecione a VM → **Configurações** → **Rede**
2. **Adaptador 1:**
   - Habilitar: ✅
   - Conectado a: **Placa em modo Bridge** (Bridged Adapter)
   - Nome: Selecione sua placa de rede (Wi-Fi ou Ethernet)

> **Por que Bridged?** A VM terá seu próprio IP na rede local, facilitando o acesso.

### 1.3 Instalar Ubuntu Server

1. Selecione a VM → **Configurações** → **Armazenamento**
2. Clique no ícone de CD vazio → Escolher arquivo de disco → Selecione o ISO do Ubuntu
3. Inicie a VM e siga a instalação padrão:
   - Idioma: Português
   - Instalar OpenSSH Server: ✅ **SIM**
   - Criar usuário e senha

---

## Parte 2: Configurar o Ubuntu

Após a instalação, faça login e execute:

### 2.1 Atualizar o Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Instalar Node.js 20

```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node -v    # Deve mostrar v20.x.x
npm -v     # Deve mostrar 10.x.x
```

### 2.3 Instalar Ferramentas Necessárias

```bash
# Git para clonar o projeto
sudo apt install -y git

# Ferramentas de build (necessário para alguns pacotes npm)
sudo apt install -y build-essential

# PM2 para gerenciar o processo
sudo npm install -g pm2
```

---

## Parte 3: Copiar o Projeto para a VM

### Opção A: Via Git (Recomendado)

Se você tem o projeto no GitHub:

```bash
cd ~
git clone https://github.com/seu-usuario/seu-repo.git trading-bot
cd trading-bot
```

### Opção B: Via SCP (Transferência Direta)

Do seu notebook (não da VM), execute:

```bash
# Primeiro, descubra o IP da VM (dentro da VM execute: ip addr)
# Depois, do seu notebook:
scp -r /caminho/do/projeto usuario@IP-DA-VM:~/trading-bot
```

### Opção C: Download do Replit

1. No Replit, clique nos 3 pontinhos → **Download as zip**
2. Transfira o ZIP para a VM via SCP ou pendrive
3. Na VM:
   ```bash
   unzip trading-bot.zip -d ~/trading-bot
   cd ~/trading-bot
   ```

---

## Parte 4: Configurar o Projeto

### 4.1 Instalar Dependências

```bash
cd ~/trading-bot
npm install
```

### 4.2 Configurar Variáveis de Ambiente

Crie o arquivo `.env`:

```bash
nano .env
```

Cole o conteúdo:

```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=sua-chave-secreta-aqui-mude-isso
```

Salve: `Ctrl+X` → `Y` → `Enter`

### 4.3 Build do Projeto

```bash
npm run build
```

---

## Parte 5: Executar com PM2

### 5.1 Criar Arquivo de Configuração PM2

```bash
nano ecosystem.config.cjs
```

Cole:

```javascript
module.exports = {
  apps: [{
    name: 'trading-bot',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### 5.2 Iniciar a Aplicação

```bash
# Iniciar
pm2 start ecosystem.config.cjs

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs trading-bot

# Salvar para auto-restart
pm2 save

# Configurar para iniciar no boot
pm2 startup
# Execute o comando que aparecer na tela
```

---

## Parte 6: Acessar o Sistema

### 6.1 Descobrir o IP da VM

Na VM, execute:

```bash
ip addr | grep inet
```

Procure algo como `192.168.x.x` ou `10.0.x.x`

### 6.2 Acessar pelo Navegador

No seu notebook, abra o navegador e acesse:

```
http://IP-DA-VM:5000
```

Exemplo: `http://192.168.1.100:5000`

---

## Parte 7: Configurar Binance Testnet

Agora que o sistema está rodando na sua rede local:

### 7.1 Obter Chaves da Testnet

1. Acesse: https://testnet.binance.vision/
2. Faça login com GitHub
3. Clique em **"Generate HMAC_SHA256 Key"**
4. Copie a **API Key** e **Secret Key**

### 7.2 Conectar no Sistema

1. Acesse o sistema pelo navegador (http://IP-DA-VM:5000)
2. Vá em **Configurações**
3. Ative **"Usar Testnet"**
4. Cole as chaves
5. Clique em **"Conectar ao Testnet"**

A conexão deve funcionar porque está saindo do IP da sua rede local!

---

## Comandos Úteis

### PM2

```bash
pm2 status           # Ver status
pm2 logs             # Ver todos os logs
pm2 logs trading-bot # Ver logs do app
pm2 restart all      # Reiniciar
pm2 stop all         # Parar
pm2 delete all       # Remover
pm2 monit            # Monitor em tempo real
```

### Sistema

```bash
# Verificar uso de memória
free -h

# Verificar uso de disco
df -h

# Verificar processos
htop

# Reiniciar VM
sudo reboot
```

---

## Solução de Problemas

### Erro: "Cannot connect to database"

Para testes locais, o sistema usa armazenamento em memória. Se precisar de banco de dados:

```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb trading_bot
```

### Erro: "EACCES permission denied"

```bash
sudo chown -R $USER:$USER ~/trading-bot
```

### Porta 5000 já em uso

```bash
# Verificar o que está usando
sudo lsof -i :5000

# Matar o processo
sudo kill -9 <PID>
```

### VM não tem internet

1. Verifique se o modo Bridge está configurado
2. Tente: `ping google.com`
3. Se não funcionar, tente NAT com port forwarding

---

## Firewall (Opcional)

Se quiser adicionar segurança extra:

```bash
sudo ufw allow ssh
sudo ufw allow 5000/tcp
sudo ufw enable
```

---

## Próximos Passos

1. ✅ Configure a VM seguindo este guia
2. ✅ Conecte à Binance Testnet
3. ✅ Crie um robô de teste com valor pequeno
4. ✅ Monitore a execução e verifique os trades
5. ✅ Ajuste os indicadores conforme necessário

---

## Suporte

Se tiver problemas durante a configuração:

1. Verifique os logs: `pm2 logs trading-bot`
2. Verifique a rede: `ping testnet.binance.vision`
3. Verifique o Node: `node -v`

Boa sorte com seus testes! 🚀
