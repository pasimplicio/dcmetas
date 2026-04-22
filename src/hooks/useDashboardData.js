import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

// Helper to filter by year
const extractYear = (referencia) => referencia.split('/')[1];

export const useDashboardData = (referencia) => {
  const [data, setData] = useState({
    kpis: {
      total: { realizado: 0, previsto: 0 },
      residencial: { realizado: 0, previsto: 0 },
      comercial: { realizado: 0, previsto: 0 },
      industrial: { realizado: 0, previsto: 0 },
      publico: { realizado: 0, previsto: 0 },
    },
    daily: [],
    annual: [],
    regional: [],
    bancoRanking: [],
    perfilDistribution: [],
    formaDistribution: [],
    table: [],
    loading: true
  });

  const setLoading = (val) => setData(prev => ({...prev, loading: val}));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const year = extractYear(referencia);

        // Fetch unified dashboard data from Local Backend
        const res = await fetch(`${API_URL}/dashboard?referencia=${referencia}`);
        if (!res.ok) throw new Error('Não foi possível conectar ao servidor local.');
        
        const { 
          arrecadacaoMes, metasRegMes, localidades, 
          yearData, yearMetas, municipioMatrix 
        } = await res.json();

        // KPIs calculation
        const kpis = {
          total: { realizado: 0, previsto: 0 },
          residencial: { realizado: 0, previsto: 0 },
          comercial: { realizado: 0, previsto: 0 },
          industrial: { realizado: 0, previsto: 0 },
          publico: { realizado: 0, previsto: 0 },
        };

        arrecadacaoMes.forEach(item => {
           const val = item.valorArrecadado || 0;
           kpis.total.realizado += val;

           // Normalize category: REMOVE ACCENTS, trim, uppercase
           const catRaw = (item.categoria || '').trim().toUpperCase();
           const cat = catRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

           if (cat === 'RESIDENCIAL') kpis.residencial.realizado += val;
           if (cat === 'COMERCIAL') kpis.comercial.realizado += val;
           if (cat === 'INDUSTRIAL') kpis.industrial.realizado += val;
           if (cat === 'PUBLICO') kpis.publico.realizado += val;
        });

        metasRegMes.forEach(item => {
           const val = item.valorPrevisto || 0;
           kpis.total.previsto += val;
           const cat = (item.categoria || '').toUpperCase();
           if (cat === 'RESIDENCIAL') kpis.residencial.previsto += val;
           if (cat === 'COMERCIAL') kpis.comercial.previsto += val;
           if (cat === 'INDUSTRIAL') kpis.industrial.previsto += val;
           if (cat === 'PUBLICO') kpis.publico.previsto += val;
        });

        // Daily Calculation
        const dailyMap = {};
        arrecadacaoMes.forEach(item => {
           const dayStr = item.dataPagamento?.substring(0, 2);
           if (!dayStr) return;
           const day = parseInt(dayStr, 10);
           if (!dailyMap[day]) dailyMap[day] = 0;
           dailyMap[day] += item.valorArrecadado || 0;
        });
        
        let daily = [];
        const daysInMonth = new Date(parseInt(year), parseInt(referencia.split('/')[0]), 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
           const valor = dailyMap[i] || 0;
           if (valor > 0) daily.push({ day: i, realizado: valor });
        }

        // Regional Ranking
        const regionMap = {};
        const getRegName = (id, fallback) => {
            const l = localidades.find(loc => loc.id === id);
            return l ? l.regional : (fallback || 'OUTROS');
        };

        arrecadacaoMes.forEach(item => {
            const regName = getRegName(item.localidadeId, 'OUTROS');
            if (!regionMap[regName]) regionMap[regName] = { realizado: 0, previsto: 0 };
            regionMap[regName].realizado += (item.valorArrecadado || 0);
        });
        
        metasRegMes.forEach(item => {
            const regName = getRegName(item.localidadeId, item.regional);
            if (!regionMap[regName]) regionMap[regName] = { realizado: 0, previsto: 0 };
            regionMap[regName].previsto += (item.valorPrevisto || 0);
        });
        
        const regional = Object.keys(regionMap).map(name => ({
           name,
           realizado: regionMap[name].realizado,
           previsto: regionMap[name].previsto,
           porcentagem: regionMap[name].previsto > 0 ? (regionMap[name].realizado / regionMap[name].previsto) * 100 : 0
        })).sort((a, b) => b.porcentagem - a.porcentagem);

        // Annual performance - Use pre-combined data from backend
        // Table logic (YTD aggregation handled locally based on current month)
        const tableLocMap = {};
        localidades.forEach(loc => {
           tableLocMap[loc.id] = {
               id: loc.id,
               nome: loc.nomeLocalidade,
               regional: loc.regional,
               months: {},
           };
        });

        arrecadacaoMes.forEach(item => {
           const m = item.mesPagamento;
           if (tableLocMap[item.localidadeId]) {
               if (!tableLocMap[item.localidadeId].months[m]) tableLocMap[item.localidadeId].months[m] = {realizado: 0, banco: item.banco || 'NÃO INFORMADO', qtd: 0};
               tableLocMap[item.localidadeId].months[m].realizado += (item.valorArrecadado || 0);
               tableLocMap[item.localidadeId].months[m].qtd += (item.qtdDocumentos || 0);
           }
        });

        const table = Object.values(tableLocMap)
            .filter(l => Object.keys(l.months).length > 0)
            .map(l => ({
                id: l.id,
                nome: l.nome,
                regional: l.regional,
                banco: l.months[referencia]?.banco || 'N/I',
                valor: l.months[referencia]?.realizado || 0,
                qtd: l.months[referencia]?.qtd || 0
            }))
            .sort((a,b) => b.valor - a.valor);

        // Advanced Insights
        const bancoMap = {};
        const perfilMap = {};
        const formaMap = {};

        arrecadacaoMes.forEach(item => {
           const val = item.valorArrecadado || 0;
           const banco = item.banco || 'NÃO INFORMADO';
           bancoMap[banco] = (bancoMap[banco] || 0) + val;
           const perfil = item.perfil || 'OUTROS';
           perfilMap[perfil] = (perfilMap[perfil] || 0) + val;
           const forma = item.formaArrecadacao || 'OUTRAS';
           formaMap[forma] = (formaMap[forma] || 0) + val;
        });

        const bancoRanking = Object.entries(bancoMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
        const perfilDistribution = Object.entries(perfilMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
        const formaDistribution = Object.entries(formaMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        setData({ 
          kpis, daily, annual, regional, 
          bancoRanking, perfilDistribution, formaDistribution,
          table, loading: false 
        });
      } catch (err) {
        console.error("Dashboard local fetch error", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [referencia]);

  return data;
};
