import { useState, useEffect } from 'react';
import api from '../services/api.js';

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Helper to extract year from referencia "MM/YYYY"
const extractYear = (referencia) => referencia.split('/')[1];

export const useDashboardData = (referencia, regional = 'TODAS') => {
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
    tableMonths: [],
    check: { faturamento: 0, pagamentos: 0 },
    loading: true
  });

  const setLoading = (val) => setData(prev => ({...prev, loading: val}));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const year = extractYear(referencia);

        // Fetch unified dashboard data from Local Backend with Regional filter
        const { 
          arrecadacaoMes, metasRegMes, metasLocMes, localidades, 
          yearData, yearMetas, municipioMatrix,
          totalFaturamento, totalPagamentos
        } = await api.get('/dashboard', { referencia, regional });

        // ===== KPIs calculation =====
        const kpis = {
          total: { realizado: 0, previsto: 0 },
          residencial: { realizado: 0, previsto: 0 },
          comercial: { realizado: 0, previsto: 0 },
          industrial: { realizado: 0, previsto: 0 },
          publico: { realizado: 0, previsto: 0 },
        };

        // Helper: normalize category (remove accents, uppercase, trim)
        const normalizeCat = (raw) => (raw || '').trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        arrecadacaoMes.forEach(item => {
           const val = item.valorArrecadado || 0;
           kpis.total.realizado += val;

           const cat = normalizeCat(item.categoria);
           if (cat === 'RESIDENCIAL') kpis.residencial.realizado += val;
           if (cat === 'COMERCIAL') kpis.comercial.realizado += val;
           if (cat === 'INDUSTRIAL') kpis.industrial.realizado += val;
           if (cat === 'PUBLICO') kpis.publico.realizado += val;
        });

        metasRegMes.forEach(item => {
           const val = item.valorPrevisto || 0;
           kpis.total.previsto += val;
           const cat = normalizeCat(item.categoria);
           if (cat === 'RESIDENCIAL') kpis.residencial.previsto += val;
           if (cat === 'COMERCIAL') kpis.comercial.previsto += val;
           if (cat === 'INDUSTRIAL') kpis.industrial.previsto += val;
           if (cat === 'PUBLICO') kpis.publico.previsto += val;
        });

        // Fallback or complement with local goals if regional goals are missing categories
        if (kpis.total.previsto === 0 && metasLocMes && metasLocMes.length > 0) {
           metasLocMes.forEach(item => {
             kpis.total.previsto += (item.valorPrevisto || 0);
           });
        }

        // ===== Daily Calculation =====
        const dailyMap = {};
        arrecadacaoMes.forEach(item => {
           const dayStr = item.dataPagamento?.substring(0, 2);
           if (!dayStr) return;
           const day = parseInt(dayStr, 10);
           if (isNaN(day) || day < 1 || day > 31) return;
           if (!dailyMap[day]) dailyMap[day] = 0;
           dailyMap[day] += item.valorArrecadado || 0;
        });
        
        let daily = [];
        const daysInMonth = new Date(parseInt(year), parseInt(referencia.split('/')[0]), 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
           const valor = dailyMap[i] || 0;
           if (valor > 0) daily.push({ day: i, realizado: valor });
        }

        // ===== Regional Ranking =====
        const regionMap = {};
        const locMap = {};
        localidades.forEach(loc => { locMap[loc.id] = loc; });

        const getRegName = (id, fallback) => {
            const l = locMap[id];
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

        // Include local goals in the regional ranking if they aren't already represented by regional records
        (metasLocMes || []).forEach(item => {
            const regName = getRegName(item.localidadeId, 'OUTROS');
            if (regName === 'OUTROS') return; // Avoid polluting ranking with unknown
            if (!regionMap[regName]) regionMap[regName] = { realizado: 0, previsto: 0 };
            
            // Check if this regional already has a total foreseen from regional records
            // If it's 0, we sum the local goals.
            const hasRegionalMeta = metasRegMes.some(mr => getRegName(mr.localidadeId, mr.regional) === regName);
            if (!hasRegionalMeta) {
                regionMap[regName].previsto += (item.valorPrevisto || 0);
            }
        });
        
        const regionalRanking = Object.keys(regionMap).map(name => ({
           name,
           realizado: regionMap[name].realizado,
           previsto: regionMap[name].previsto,
           porcentagem: regionMap[name].previsto > 0 ? (regionMap[name].realizado / regionMap[name].previsto) * 100 : 0
        })).sort((a, b) => b.porcentagem - a.porcentagem);
        
        console.log('Ranking sorted:', regionalRanking.map(r => `${r.name}: ${r.porcentagem.toFixed(1)}%`));

        // ===== Annual Performance (FIX: was always empty) =====
        const annualRealizadoMap = {};
        const annualPrevistoMap = {};

        // yearData: [{ mesPagamento: "01/2026", realizado: 12345 }, ...]
        (yearData || []).forEach(item => {
          const mesNum = item.mesPagamento?.split('/')[0];
          if (mesNum) annualRealizadoMap[mesNum] = (annualRealizadoMap[mesNum] || 0) + (item.realizado || 0);
        });

        // yearMetas: [{ referencia: "01/2026", previsto: 54321 }, ...]
        (yearMetas || []).forEach(item => {
          const mesNum = item.referencia?.split('/')[0];
          if (mesNum) annualPrevistoMap[mesNum] = (annualPrevistoMap[mesNum] || 0) + (item.previsto || 0);
        });

        const annual = [];
        for (let m = 1; m <= 12; m++) {
          const mesKey = String(m).padStart(2, '0');
          const realizado = annualRealizadoMap[mesKey] || 0;
          const previsto = annualPrevistoMap[mesKey] || 0;
          // Only include months that have any data
          if (realizado > 0 || previsto > 0) {
            annual.push({
              month: MONTH_NAMES[m - 1],
              realizado,
              previsto,
              porcentagem: previsto > 0 ? (realizado / previsto) * 100 : null
            });
          }
        }

        // ===== Detail Table (Municipality x Month Matrix) =====
        // Collect which months exist in the data
        const tableMonthsSet = new Set();
        const munMap = {};

        (municipioMatrix || []).forEach(item => {
           const mun = item.municipio || 'NÃO INFORMADO';
           const mes = item.mesPagamento;
           if (!mes) return;
           tableMonthsSet.add(mes);
           if (!munMap[mun]) munMap[mun] = { municipio: mun, months: {}, total: 0 };
           munMap[mun].months[mes] = (munMap[mun].months[mes] || 0) + (item.valor || 0);
           munMap[mun].total += (item.valor || 0);
        });

        // Sort months chronologically
        const tableMonths = Array.from(tableMonthsSet).sort((a, b) => {
          const [mA, yA] = a.split('/');
          const [mB, yB] = b.split('/');
          return (parseInt(yA) * 100 + parseInt(mA)) - (parseInt(yB) * 100 + parseInt(mB));
        });

        const table = Object.values(munMap)
            .sort((a, b) => b.total - a.total);

        // ===== Advanced Insights =====
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
          kpis, daily, annual, regional: regionalRanking, 
          bancoRanking, perfilDistribution, formaDistribution,
          table, tableMonths, 
          check: { faturamento: totalFaturamento, pagamentos: totalPagamentos },
          loading: false 
        });
      } catch (err) {
        console.error("Dashboard local fetch error", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [referencia, regional]);

  return data;
};
