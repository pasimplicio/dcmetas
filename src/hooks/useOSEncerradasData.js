import { useState, useEffect } from 'react';
import api from '../services/api.js';

export const useOSEncerradasData = (referencia, regional = 'TODAS', responsavel = '', setOsOptions = null) => {
  const [data, setData] = useState({
    gauge: {
      realizado: 0,
      totalPrevisto: 0,
      totalEncerradas: 0,
      totalGeradas: 0
    },
    mesPrevisto: 0,
    mesRealizado: 0,
    mesGeradas: 0,
    pendentesAnteriores: 0,
    chartData: [],
    regionalRanking: [],
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      setData(prev => ({ ...prev, loading: true }));
      try {
        const [mes, ano] = referencia.split('/');
        const result = await api.get('/os/encerradas', { regional, ano, mes, responsavel });
        
        if (result.filterOptions && setOsOptions) {
            setOsOptions({
                responsaveis: result.filterOptions.responsaveis || [],
                setores: [] // Encerradas doesn't use sectors
            });
        }

        setData({
          ...result,
          loading: false
        });
      } catch (err) {
        console.error("Erro ao buscar dados de OS Encerradas:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    if (referencia) {
        fetchData();
    }
  }, [referencia, regional, responsavel]);

  return data;
};
