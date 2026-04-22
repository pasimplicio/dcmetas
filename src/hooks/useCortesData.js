import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

export const useCortesData = (referencia, regional) => {
    const [data, setData] = useState({
        metrics: {
            totalEmissao: 0,
            totalCorte: 0,
            pctCorte: 0,
            qtdePago: 0,
            qtdePagoAntes: 0,
            qtdePagoApos: 0,
            valorCobrado: 0,
            valorPago: 0,
            valorPagoAntes: 0,
            valorPagoApos: 0,
            valorCobradoCortado: 0,
            pctRecebidoAntes: 0,
            pctRecebidoPos: 0,
            pctRecebidoTotal: 0
        },
        dailyData: [],
        regionalData: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!referencia) return;

        let isMounted = true;
        setLoading(true);

        const fetchData = async () => {
            try {
                let url = `${API_URL}/cortes?referencia=${encodeURIComponent(referencia)}`;
                if (regional && regional !== 'TODAS') {
                    url += `&regional=${encodeURIComponent(regional)}`;
                }

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Falha ao buscar dados de cortes');
                }
                
                const result = await response.json();
                
                if (isMounted) {
                    setData(result);
                    setError(null);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [referencia, regional]);

    return { ...data, loading, error };
};
