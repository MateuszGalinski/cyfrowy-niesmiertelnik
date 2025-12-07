# Krok 1
przygotuj 3 terminale:
- 1 dla backendu
- 1 dla frontendu
- 1 dla zapisu historii danych telimetrycznych

# Krok 2
Frontend może zostać uruchomiony otwierając konsolę na ścieżce `cyfrowy-niesmiertelnik/frontend` i wprowadzając następujące komendy:
```
npm install
npm run dev
```

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

# Krok 4
## (wymagane ukończenie kroku 3)
W celu uruchomienia archiwizacji danych historycznych telemetrii i alertów należy uruchomić konsolę na ścieżce `cyfrowy-niesmiertelnik/backend/core` i wprowadzić następującą komendę:
```
python manage.py run_telemetry_listener
```