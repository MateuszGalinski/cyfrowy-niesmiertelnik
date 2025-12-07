import asyncio
import json
import logging
import websockets
from django.core.management.base import BaseCommand
from asgiref.sync import sync_to_async
from django.db import transaction

from app.serializers.serializers_telemetry_lite import TelemetryLiteSerializer, AlertLiteSerializer
from app.serializers.serializers_firefighter import FirefighterSerializer 
from app.models.model_firefighter import Firefighter

logger = logging.getLogger(__name__)

WS_URL = "wss://niesmiertelnik.replit.app/ws"


class Command(BaseCommand):
    help = "Uruchamia klienta WebSocket do zbierania danych z symulatora PSP"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Uruchamianie nasłuchu telemetrii...'))
        try:
            asyncio.run(self.listen_to_simulator())
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('Zatrzymano nasłuch.'))

    async def listen_to_simulator(self):
        """Główna pętla połączenia z automatycznym wznawianiem"""
        while True:
            try:
                async with websockets.connect(WS_URL, ping_interval=30, ping_timeout=10) as websocket:
                    logger.info(f"Połączono z {WS_URL}")
                    self.stdout.write(self.style.SUCCESS("--> Połączono z symulatorem!"))
                    
                    async for message in websocket:
                        data = json.loads(message)
                        await self.process_message(data)
                        
            except (websockets.ConnectionClosed, OSError) as e:
                logger.error(f"Utracono połączenie: {e}. Ponawianie za 5s...")
                self.stdout.write(self.style.WARNING(f"Utracono połączenie: {e}. Ponawianie za 5s..."))
                await asyncio.sleep(5)

    async def process_message(self, data):
        """Router wiadomości"""
        msg_type = data.get('type')

        if msg_type == 'firefighters_list':
            await self.handle_firefighters_list(data)
        elif msg_type == 'tag_telemetry':
            await self.handle_telemetry(data)
        elif msg_type == 'alert':
            await self.handle_alert(data)
        elif msg_type == 'welcome':
            self.stdout.write(f"Wersja symulatora: {data.get('simulator_version')}")
        elif msg_type == 'beacons_config':
            logger.info(f"Otrzymano konfigurację {len(data['beacons'])} beaconów.")

    @sync_to_async
    @transaction.atomic
    def handle_firefighters_list(self, data):
        """Obsługuje wiadomość 'firefighters_list'."""
        firefighters_data = data.get('firefighters', [])
        
        if not firefighters_data:
            logger.warning("Otrzymano pustą listę strażaków.")
            return

        for ff_data in firefighters_data:
            payload = {
                'id': ff_data['id'],
                'tag_id': ff_data.get('tag_id'),
                'name': ff_data.get('name'),
                'rank': ff_data.get('rank'),
                'role': ff_data.get('role'),
                'team': ff_data.get('team'),
            }

            try:
                firefighter = Firefighter.objects.get(pk=payload['id'])
                serializer = FirefighterSerializer(firefighter, data=payload, partial=True)
                action = "Zaktualizowano"
            except Firefighter.DoesNotExist:
                serializer = FirefighterSerializer(data=payload)
                action = "Utworzono"
            
            if serializer.is_valid():
                serializer.save()
                self.stdout.write(self.style.NOTICE(f"{action} strażaka: {payload['name']} ({payload['id']})"))
            else:
                logger.error(f"Błąd walidacji Firefighter dla {payload['id']}: {serializer.errors}")

    @sync_to_async
    def handle_telemetry(self, data):
        """Mapuje zagnieżdżony JSON z symulatora na płaską strukturę i zapisuje."""
        try:
            payload = {
                'firefighter_id': data['firefighter']['id'],
                'tag_id': data['tag_id'],
                'timestamp': data['timestamp'],
                'sequence': data.get('sequence', 0),
                'pos_x': data['position']['x'],
                'pos_y': data['position']['y'],
                'pos_z': data['position']['z'],
                'floor': data['position']['floor'],
                'heading_deg': data.get('heading_deg', 0.0),
                'heart_rate': data['vitals']['heart_rate_bpm'],
                'motion_state': data['vitals']['motion_state'],
                'scba_pressure': data['scba']['cylinder_pressure_bar'],
                'battery_level': data['device']['battery_percent'],
                'temperature': data['environment']['temperature_c'],
            }

            serializer = TelemetryLiteSerializer(data=payload)
            if serializer.is_valid():
                obj = serializer.save()
                self.stdout.write(f"✅ Telemetria: {data['firefighter']['name']} (ID={obj.pk})")
            else:
                self.stdout.write(self.style.ERROR(f"❌ Błąd walidacji telemetrii: {serializer.errors}"))

        except KeyError as e:
            self.stdout.write(self.style.ERROR(f"❌ Brakujący klucz: {e}"))
        except Exception as e:
            logger.error(f"Błąd przetwarzania telemetrii: {e}")

    @sync_to_async
    def handle_alert(self, data):
        """Obsługa alertów"""
        try:
            payload = {
                'external_id': data['id'],
                'alert_type': data['alert_type'],
                'severity': data['severity'],
                'timestamp': data['timestamp'],
                'firefighter_id': data.get('firefighter', {}).get('id'),
                'tag_id': data.get('tag_id', ''),
                'pos_x': data.get('position', {}).get('x'),
                'pos_y': data.get('position', {}).get('y'),
                'pos_z': data.get('position', {}).get('z'),
                'floor': data.get('position', {}).get('floor', 0),
                'details': data.get('details', {}),
                'resolved': data.get('resolved', False),
                'acknowledged': data.get('acknowledged', False),
            }

            serializer = AlertLiteSerializer(data=payload)
            if serializer.is_valid():
                obj = serializer.save()
                self.stdout.write(self.style.WARNING(f"⚠️ ALERT: {payload['alert_type']} - {payload['firefighter_id']} (ID={obj.pk})"))
            else:
                self.stdout.write(self.style.ERROR(f"❌ Błąd walidacji alertu: {serializer.errors}"))

        except KeyError as e:
            self.stdout.write(self.style.ERROR(f"❌ Brakujący klucz w alercie: {e}"))
        except Exception as e:
            logger.error(f"Błąd przetwarzania alertu: {e}")