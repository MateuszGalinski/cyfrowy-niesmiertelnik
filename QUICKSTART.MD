# Wymagania wstępne
Wymagania zostały dobrane na podstawie wersji oprogramowania, którymi była tworzona aplikacja i nie są jedynymi dla których zadziała oprogramowanie
### Fronetend:
wersja node - v25.2.1
### Backend:
wesja python - v3.12.2
### System operacyjny:
Windows 11

---
# Krok 1
przygotuj 3 terminale:
- 1 dla backendu
- 1 dla frontendu
- 1 dla zapisu historii danych telimetrycznych
---
# Krok 2
Frontend może zostać uruchomiony otwierając konsolę na ścieżce `cyfrowy-niesmiertelnik/frontend` i wprowadzając następujące komendy:
```
npm install
npm run dev
```
---
# Krok 3
Przed przystąpieniem do uruchamiani backendu należy zainstalować odpowiednie zależności (najlepiej w wirtualnym środowisku). W tym celu należy w konsoli otwartej na ścieżce `cyfrowy-niesmiertelnik/backend` u urucomić następujące komendy:
```
python -m venv .venv
.\.venv\Scripts\activate # akrywacja dla systemów Windows
pip install -r requirements.txt
```

W celu uruchomienia backendu należy uruchomić konsolę na ścieżce `cyfrowy-niesmiertelnik/backend/core` i wprowadzić następujące komendy z aktywowanym środowiskiem i pobranymi zależnościami:
```
python manage.py makemigrations
python manage.py migrate

# opcjonalne, ale przydatne by skorzystać z panelu admina
python manage.py createsuperuser 

python manage.py runserver
```
---
# Krok 4
## (wymagane ukończenie kroku 3)
Przed przystąpieniem należy się upewnić, że aktywowaliśmy środowisko z kroku 3 aby to zrobić należy otworzyć konsolę na ścieżce `cyfrowy-niesmiertelnik/backend` i wprowazić następującą komendę
```
.\.venv\Scripts\activate # dla systemu Windows
```

W celu uruchomienia archiwizacji danych historycznych telemetrii i alertów należy uruchomić konsolę na ścieżce `cyfrowy-niesmiertelnik/backend/core` i wprowadzić następującą komendę:
```
python manage.py run_telemetry_listener
```

# Krok 5
Aby otworzyć frontend aplikacji należy wejść w wybraną przez siebie przeglądrakę i wprowadzić address:
`http://localhost:5173`