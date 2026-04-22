import Dexie from 'dexie';

const db = new Dexie('DCMetasDB');

db.version(4).stores({
  localidades: 'id, superintendencia, regional, nomeLocalidade, municipio',
  arrecadacao: '++id, localidadeId, referencia, mesPagamento, categoria, perfil, banco, formaArrecadacao, dataPagamento, valorPago, valorDevolucao, valorArrecadado',
  metasLocalidade: '++id, referencia, localidadeId, valorPrevisto',
  metasRegional: '++id, referencia, localidadeId, regional, categoria, valorPrevisto'
});

export const clearTable = async (tableName) => {
  await db[tableName].clear();
};

export const insertBatch = async (tableName, items) => {
  return await db[tableName].bulkAdd(items);
};

export const getMetasByMonthAndRegion = async (referencia) => {
  return await db.metasRegional.where('referencia').equals(referencia).toArray();
};

export const getMetasLocalidadeByMonth = async (referencia) => {
  return await db.metasLocalidade.where('referencia').equals(referencia).toArray();
};

export const getArrecadacaoByMonth = async (referencia) => {
  return await db.arrecadacao.where('mesPagamento').equals(referencia).toArray();
};

export const getLocalidades = async () => {
  return await db.localidades.toArray();
};

export default db;
