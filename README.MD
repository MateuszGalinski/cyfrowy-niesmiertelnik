# URUCHOMIENIE APLIKACJI
W celu uruchomienia aplikacji należy zapoznać się z instrukcją zawartą w pliku `QUICKSATR.MD` będącego częścią tego rezpozytorium

---
# DEMO
[![Link do demo na yt](https://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg)](https://www.youtube.com/watch?v=z3ZSgeLHYiA)

---
# STRUKTURA REPOZYTORIUM
Repozytorium składa się z dwóch folderów nazwanych
- frontend
- backend  

Zawierają one kolejno kod źródłowy frontendu i backendu

### Frontend składa się z następujących folderów:
- components
    - dashboard - komponenty potrzebne do funckjonowania panelu dashboard wyświetlającego wizualizację danych pozyskanych z symulacji
    - ui - folder zawierający głównie komponenty otwartej biblioteki radix-ui ułatwiające produkcję
- hooks - folder zawierające hooki aplikacji w tym ten odpowiedzialny za połączenie websocketowe
- lib 
    - funkcja pomocnicza biblioteki tailwind
- types
    - telemetry.ts - plik zawierający definicje struktur otrzymywanych z backendu symulacji
- pages - folder ze stronami aplikacji webowej

plik App.tsx stanowi punkt startowy aplikacji

### Backend składa się z następujących folderów:
- filters - folder zawierający filtry Kalmana
- managment
    - commands - plik z komendą aktywującą proces archiwizowania telemetrii
- migration - folder z migracjami bazy danych
- models - folder z modelami tabel bazy danych
- serializeers - folder z serializerami przydatnymi w obsłudzie endpointów biblioteki DjangoRESTFramework

---
# BŁĘDY KTÓRYCH JESTEŚMY ŚWIADOMI
W obecnej wersji nasz backend wysyła zapytania protokołem websocket do backendu symulacji, który pełni funkcje beaconów/totemów. W docelowym rozwiązaniu byłoby to nieakceptowalne, ale przez brak kodu źródłowego symulacji jest to jedyne rozwiązanie.