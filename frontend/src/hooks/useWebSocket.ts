import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export function useWebSocket() {
  const { updatePrices, setWsConnected, companies } = useStore();
  const wsRef = useRef<WebSocket | null>(null);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startLocalSimulation() {
    if (simulationRef.current) return;
    simulationRef.current = setInterval(() => {
      const updates = companies.map(co => {
        const vol = co.basePrice > 400 ? 0.006 : co.basePrice > 100 ? 0.009 : 0.015;
        const shock = (Math.random() - 0.495) * vol * co.price;
        const drift = (co.basePrice - co.price) * 0.0002;
        const newPrice = Math.max(co.price * 0.4, co.price + shock + drift);
        const price = parseFloat(newPrice.toFixed(2));
        const change = parseFloat((price - co.basePrice).toFixed(2));
        const changePercent = parseFloat(((change / co.basePrice) * 100).toFixed(2));
        return { ticker: co.ticker, price, change, changePercent, volume: Math.floor(co.avgVolume * 0.01) };
      });
      updatePrices(updates);
    }, 5000);
  }

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string) ?? '';
    const wsUrl = apiBase
      ? apiBase.replace(/^https/, 'wss').replace(/^http/, 'ws')
      : `ws://${window.location.hostname}:3001`;

    function connect() {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          if (simulationRef.current) {
            clearInterval(simulationRef.current);
            simulationRef.current = null;
          }
        };

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data as string);
            if (msg.type === 'snapshot' || msg.type === 'price_update') {
              updatePrices(msg.data);
            }
          } catch {}
        };

        ws.onclose = () => {
          setWsConnected(false);
          startLocalSimulation();
          setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        setWsConnected(false);
        startLocalSimulation();
      }
    }

    connect();

    return () => {
      wsRef.current?.close();
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);
}
