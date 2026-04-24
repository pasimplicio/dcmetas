#!/bin/bash

# Diretórios
DATA_DIR="./data"
BACKUP_DIR="./backups"
DB_FILE="database.sqlite"

# Criar pasta de backups se não existir
mkdir -p "$BACKUP_DIR"

# Timestamp do backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sqlite"

# Se o banco existe, copia
if [ -f "${DATA_DIR}/${DB_FILE}" ]; then
    echo "Iniciando backup do banco de dados..."
    # Usando o .backup do sqlite3 (garante consistência, melhor que cp direto se sqlite3 estiver instalado, senão fallback para cp)
    if command -v sqlite3 &> /dev/null; then
        sqlite3 "${DATA_DIR}/${DB_FILE}" ".backup '${BACKUP_FILE}'"
    else
        cp "${DATA_DIR}/${DB_FILE}" "${BACKUP_FILE}"
    fi
    echo "Backup concluído: ${BACKUP_FILE}"

    # Retenção: Manter apenas os últimos 7 dias de backups para economizar disco
    echo "Limpando backups antigos (mais de 7 dias)..."
    find "$BACKUP_DIR" -name "backup_*.sqlite" -type f -mtime +7 -delete
    echo "Limpeza concluída."
else
    echo "Banco de dados não encontrado em ${DATA_DIR}/${DB_FILE}"
fi
