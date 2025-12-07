# Step 1
prepare 3 terminals:
- 1 for backend
- 1 for frontend
- 1 for telimetry history recording

# Step 2
Frontend może zostać uruchomiony otwierając konsolę na ścieżce `cyfrowy-niesmiertelnik/frontend` i wprowadzając następujące komendy:
```
npm install
npm run dev
```

# Step 3
W celu uruchomienia backendu należy uruchomić konsolę na ścieżce `cyfrowy-niesmiertelnik/backend/core` i wprowadzić następujące komendy:
```
python manage.py makemigrations
python manage.py migrate

# opcjonalne, ale przydatne by skorzystać z panelu admina
python manage.py createsuperuser 

python manage.py runserver
```

# Step 4
W celu uruchomienia archiwizacji danych historycznych telemetrii i alertów należy uruchomić konsolę na ścieżce `cyfrowy-niesmiertelnik/backend/core` i wprowadzić następującą komendę:
```
python manage.py run_telemetry_listener
```