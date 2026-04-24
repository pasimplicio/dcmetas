import { useState, useEffect } from 'react';
import api from '../services/api.js';

export const useArrecadacaoComparativo = (referencia, regional = 'TODAS') => {
  const [data, setData] = useState({
    currentYear: 0,
    previousYear: 0,
    chartData: [],
    heatmapData: [],
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      setData(prev => ({ ...prev, loading: true }));
      try {
        const year = referencia.split('/')[1];
        const res = await api.get('/arrecadacao/comparativo', { year, regional });
        
        const { currentYear, previousYear, dados } = res;
        
        // Transformar para o formato do gráfico
        const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const chartData = MONTH_NAMES.map((name, index) => {
           const mesKey = String(index + 1).padStart(2, '0');
           const atual = dados.find(d => d.mes === mesKey && d.ano === String(currentYear))?.total || 0;
           const anterior = dados.find(d => d.mes === mesKey && d.ano === String(previousYear))?.total || 0;
           const variacao = anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
           
           return {
             month: name,
             atual,
             anterior,
             variacao
           };
        });

        setData({
          currentYear,
          previousYear,
          chartData,
          loading: false
        });
      } catch (err) {
        console.error("Error fetching comparativo data:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    if (referencia) fetchData();
  }, [referencia, regional]);

  return data;
};
