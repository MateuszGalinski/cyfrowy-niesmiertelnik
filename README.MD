# URUCHOMIENIE APLIKACJI
W celu uruchomienia aplikacji należy zapoznać się z instrukcją zawartą w pliku `QUICKSATR.MD` będącego częścią tego rezpozytorium

---
# STRUKTURA REPOZYTORIUM
Repozytorium składa się z dwóch folderów nazwanych
- frontend
- backend
Zawierają one kolejno kod źródłowy frontendu i backendu

Frontend składa się z następujących folderów:
- components
    - dashboard - komponenty potrzebne do funckjonowania panelu dashboard wyświetlającego wizualizację danych pozyskanych z symulacji
    - ui - folder zawierający głównie komponenty otwartej biblioteki radix-ui ułatwiające produkcję
- hooks - folder zawierające hooki aplikacji w tym ten odpowiedzialny za połączenie websocketowe
- lib 
    - funkcja pomocnicza biblioteki tailwind
- types
    - telemetry.ts - plik zawierający definicje struktur otrzymywanych z backendu symulacji

---
# BŁĘDY KTÓRYCH JESTEŚMY ŚWIADOMI
W obecnej wersji nasz backend wysyła zapytania protokołem websocket do backendu symulacji, który pełni funkcje beconów/totemów. W docelowym rozwiązaniu byłoby to nieakceptowalne, ale przez brak kodu źródłowego symulacji jest to jedyne rozwiązanie 