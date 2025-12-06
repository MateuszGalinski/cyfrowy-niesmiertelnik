import { useState, useEffect, useCallback, useRef } from 'react';
import type { WebSocketMessage, TagTelemetry, BeaconsStatus, BuildingConfig, Alert } from '@/types/telemetry';

const WS_URL = 'wss://niesmiertelnik.replit.app/ws';

interface WebSocketState {
  firefighters: Map<string, TagTelemetry>;
  beacons: BeaconsStatus | null;
  building: BuildingConfig | null;
  alerts: Alert[];
  connected: boolean;
  lastUpdate: Date | null;
}

export function useWebSocket() {
  const [state, setState] = useState<WebSocketState>({
    firefighters: new Map(),
    beacons: null,
    building: null,
    alerts: [],
    connected: false,
    lastUpdate: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setState(prev => ({ ...prev, connected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        setState(prev => {
          const newState = { ...prev, lastUpdate: new Date() };

          switch (data.type) {
            case 'tag_telemetry':
              const newFirefighters = new Map(prev.firefighters);
              newFirefighters.set(data.firefighter.id, data);
              newState.firefighters = newFirefighters;
              break;

            case 'beacons_status':
              newState.beacons = data;
              break;

            case 'building_config':
              newState.building = data;
              break;

            case 'alert':
              // Add new alert to the beginning of the list
              const existingAlertIndex = prev.alerts.findIndex(a => a.id === data.id);
              if (existingAlertIndex >= 0) {
                const updatedAlerts = [...prev.alerts];
                updatedAlerts[existingAlertIndex] = data;
                newState.alerts = updatedAlerts;
              } else {
                newState.alerts = [data, ...prev.alerts].slice(0, 50); // Keep last 50 alerts
              }
              break;
          }

          return newState;
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setState(prev => ({ ...prev, connected: false }));
      
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, []);

  const sendCommand = useCallback((command: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    }
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
    }));
    sendCommand({ command: 'acknowledge_alert', alert_id: alertId });
  }, [sendCommand]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    ...state,
    firefightersArray: Array.from(state.firefighters.values()),
    sendCommand,
    acknowledgeAlert,
  };
}
