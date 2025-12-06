import { useState, useEffect, useCallback, useRef } from 'react';
import type { WebSocketMessage, TagTelemetry, BeaconsStatus, BuildingConfig, Alert } from '@/types/telemetry';

const WS_URL = 'wss://niesmiertelnik.replit.app/ws';
const MAN_DOWN_THRESHOLD_S = 30;

interface WebSocketState {
  firefighters: Map<string, TagTelemetry>;
  beacons: BeaconsStatus | null;
  building: BuildingConfig | null;
  alerts: Alert[];
  connected: boolean;
  lastUpdate: Date | null;
}

// Track generated local alerts to avoid duplicates
const generatedAlertIds = new Set<string>();

function generateLocalAlert(telemetry: TagTelemetry, alertType: 'man_down' | 'sos_pressed'): Alert {
  const alertId = `LOCAL-${alertType}-${telemetry.firefighter.id}-${Date.now()}`;
  return {
    id: alertId,
    type: 'alert',
    timestamp: new Date().toISOString(),
    alert_type: alertType,
    severity: 'critical',
    tag_id: telemetry.tag_id,
    firefighter: telemetry.firefighter,
    position: telemetry.position,
    details: alertType === 'man_down' 
      ? { stationary_duration_s: telemetry.vitals.stationary_duration_s }
      : { sos_button_pressed: true },
    resolved: false,
    acknowledged: false,
  };
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
  const manDownTrackerRef = useRef<Map<string, boolean>>(new Map());
  const sosTrackerRef = useRef<Map<string, boolean>>(new Map());

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
          let newAlerts = [...prev.alerts];

          switch (data.type) {
            case 'tag_telemetry':
              const newFirefighters = new Map(prev.firefighters);
              newFirefighters.set(data.firefighter.id, data);
              newState.firefighters = newFirefighters;

              // Check for MAN DOWN condition (stationary > 30s)
              const ffId = data.firefighter.id;
              const isStationary = data.vitals.stationary_duration_s >= MAN_DOWN_THRESHOLD_S;
              const wasManDown = manDownTrackerRef.current.get(ffId) || false;
              
              if (isStationary && !wasManDown) {
                // Trigger MAN DOWN alert
                const manDownAlert = generateLocalAlert(data, 'man_down');
                if (!generatedAlertIds.has(`man_down-${ffId}`)) {
                  generatedAlertIds.add(`man_down-${ffId}`);
                  newAlerts = [manDownAlert, ...newAlerts].slice(0, 50);
                }
                manDownTrackerRef.current.set(ffId, true);
              } else if (!isStationary && wasManDown) {
                // Reset man down state when moving again
                manDownTrackerRef.current.set(ffId, false);
                generatedAlertIds.delete(`man_down-${ffId}`);
              }

              // Check for SOS button pressed
              const isSosPressed = data.device.sos_button_pressed;
              const wasSosPressed = sosTrackerRef.current.get(ffId) || false;
              
              if (isSosPressed && !wasSosPressed) {
                // Trigger SOS alert
                const sosAlert = generateLocalAlert(data, 'sos_pressed');
                if (!generatedAlertIds.has(`sos-${ffId}`)) {
                  generatedAlertIds.add(`sos-${ffId}`);
                  newAlerts = [sosAlert, ...newAlerts].slice(0, 50);
                }
                sosTrackerRef.current.set(ffId, true);
              } else if (!isSosPressed && wasSosPressed) {
                sosTrackerRef.current.set(ffId, false);
                generatedAlertIds.delete(`sos-${ffId}`);
              }

              newState.alerts = newAlerts;
              break;

            case 'beacons_status':
              newState.beacons = data;
              break;

            case 'building_config':
              newState.building = data;
              break;

            case 'alert':
              // Add new alert from server to the beginning of the list
              const existingAlertIndex = prev.alerts.findIndex(a => a.id === data.id);
              if (existingAlertIndex >= 0) {
                const updatedAlerts = [...prev.alerts];
                updatedAlerts[existingAlertIndex] = data;
                newState.alerts = updatedAlerts;
              } else {
                newState.alerts = [data, ...prev.alerts].slice(0, 50);
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
