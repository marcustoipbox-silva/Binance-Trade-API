#!/bin/bash

# ===========================================
# Script de Setup - Trading Bot para Ubuntu
# ===========================================

set -e

echo "=========================================="
echo "  Trading Bot - Setup Automatico"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funcao para exibir mensagens
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERRO]${NC} $1"; }

# Verificar se esta rodando como root
if [ "$EUID" -eq 0 ]; then
    error "Nao execute este script como root. Use seu usuario normal."
    exit 1
fi

# 1. Atualizar sistema
info "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js
info "Instalando Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    info "Node.js ja instalado: $(node -v)"
fi

# 3. Instalar ferramentas de build
info "Instalando ferramentas de build..."
sudo apt install -y build-essential git

# 4. Instalar PM2
info "Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    info "PM2 ja instalado"
fi

# 5. Instalar dependencias do projeto
info "Instalando dependencias do projeto..."
npm install

# 6. Criar arquivo .env se nao existir
if [ ! -f .env ]; then
    info "Criando arquivo .env..."
    cat > .env << EOF
NODE_ENV=production
PORT=5000
SESSION_SECRET=$(openssl rand -hex 32)
# Obtenha sua chave gratuita em: https://coinmarketcap.com/api/
COINMARKETCAP_API_KEY=
EOF
    info "Arquivo .env criado com SESSION_SECRET aleatorio"
    warn "IMPORTANTE: Edite o arquivo .env e adicione sua COINMARKETCAP_API_KEY"
else
    info "Arquivo .env ja existe"
fi

# 7. Build do projeto
info "Fazendo build do projeto..."
npm run build

# 8. Criar arquivo de configuracao PM2
info "Criando configuracao PM2..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'trading-bot',
    script: 'dist/index.cjs',
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
EOF

# 9. Parar instancia anterior se existir
pm2 delete trading-bot 2>/dev/null || true

# 10. Iniciar aplicacao
info "Iniciando aplicacao..."
pm2 start ecosystem.config.cjs

# 11. Salvar configuracao PM2
pm2 save

# 12. Configurar startup
info "Configurando startup automatico..."
pm2 startup | tail -1 | bash || warn "Execute manualmente o comando de startup se necessario"

# 13. Obter IP da maquina
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo -e "${GREEN}  Setup Concluido com Sucesso!${NC}"
echo "=========================================="
echo ""
echo "Acesse o sistema em:"
echo -e "  ${GREEN}http://$IP:5000${NC}"
echo ""
echo "Comandos uteis:"
echo "  pm2 status       - Ver status"
echo "  pm2 logs         - Ver logs"
echo "  pm2 restart all  - Reiniciar"
echo ""
echo "Proximos passos:"
echo "  1. Acesse http://$IP:5000 no navegador"
echo "  2. Va em Configuracoes"
echo "  3. Ative 'Usar Testnet'"
echo "  4. Conecte com suas chaves da Testnet"
echo ""
