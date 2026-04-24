import { useState, useEffect } from 'react';
import api from '../services/api.js';

export const useArrecadacaoCurva = (mes1, mes2, regional = 'TODAS') => {
  const [data, setData] = useState({
    totalMes1: 0,
    totalMes2: 0,
    percentualGeral: 0,
    gapTotal: 0,
    curva: [],
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!mes1) return;
      setData(prev => ({ ...prev, loading: true }));
      try {
        const params = { mes1, regional };
        if (mes2) params.mes2 = mes2;
        const res = await api.get('/arrecadacao/curva', params);
        setData({ ...res, loading: false });
      } catch (err) {
        console.error("Error fetching curva data:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [mes1, mes2, regional]);

  return data;
};

export const useMesesDisponiveis = () => {
  const [meses, setMeses] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/arrecadacao/curva/meses');
        setMeses(res || []);
      } catch (err) {
        console.error("Error fetching meses:", err);
      }
    };
    fetch();
  }, []);

  return meses;
};
