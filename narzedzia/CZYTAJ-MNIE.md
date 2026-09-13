# Aktualizacja strony z pliku Excel

## Jednorazowo (pierwsze uruchomienie)

```bash
cd "/Users/michalzborowski/Documents/ChatGPT/Bazzo Interiors"
python3 -m venv narzedzia/venv
narzedzia/venv/bin/pip install -r narzedzia/requirements.txt
```

## Gdy wróci uzupełniony plik

1. Wrzuć `dane-realizacji.xlsx` do katalogu projektu (nadpisując stary).
2. Wrzuć zdjęcia do `do-wrzucenia/<realizacja>/galeria/` i `.../materialy/`
   jako `1`, `2`, `3`, `4` (dowolne rozszerzenie).
3. Podejrzyj, co się zmieni — bez zapisywania:

```bash
narzedzia/venv/bin/python narzedzia/zaktualizuj-strone.py --sprawdz
```

4. Jeśli raport wygląda dobrze, zapisz zmiany:

```bash
narzedzia/venv/bin/python narzedzia/zaktualizuj-strone.py
```

5. Sprawdź stronę lokalnie (`open index.html`), a potem opublikuj:

```bash
git add -A && git commit -m "Aktualizacja realizacji" && git push
```

Strona odświeży się sama w ~1 minutę.

## Co robi skrypt

- Przepisuje metrykę (lokalizacja, powierzchnia, rok, zakres), podtytuł i opisy.
- Buduje sekcję materiałów: nazwa, opis, kod koloru + próbka koloru.
- Buduje galerię; orientację (pionowe/poziome) wykrywa z proporcji pliku.
- Konwertuje zdjęcia na WebP (galeria do 1600 px, faktury do 1200 px),
  respektując orientację EXIF — zdjęcia z telefonu nie wychodzą obrócone.
- Dopisuje `?v=<hash>` do adresów, żeby przeglądarki nie trzymały starych zdjęć.
- Zdjęcia już obecne na stronie zostawia w spokoju, jeśli nie przyszło nowe
  źródło (ponowna kompresja pogarsza jakość).

## Czego nie zrobi

- Nie doda nowej realizacji — obsługuje cztery istniejące podstrony.
- Nie wymyśli opisów zdjęć. Brak opisu = ostrzeżenie w raporcie.
- Nie przyjmie kodu koloru w złym formacie (wymaga `#rrggbb`).
