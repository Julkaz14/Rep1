# 🚢 Projekt: Bitwa Morska – Pirate Edition

### Projekt semestralny na zaliczenie przedmiotu

Klasyczna gra strategiczna "Statki" w unikalnej oprawie wizualnej wzorowanej na starych mapach morskich. Aplikacja łączy tradycyjną rozgrywkę z nowoczesnymi technikami webowymi, oferując interaktywny system rozmieszczania floty oraz animowane efekty.

---

## 🚀 Demo Online
Gra jest dostępna publicznie pod adresem:
👉 **[https://julkaz14.github.io/Rep1/](https://julkaz14.github.io/Rep1/)**

---

## 📄 Dokumentacja i Raport
Szczegółowy opis algorytmów, struktury kodu oraz analiza techniczna projektu:
👉 [Raport zaliczeniowy (Raport.md)](./Raport.md)

---

## 🛠️ Wykorzystane Technologie
Projekt został wykonany w architekturze **Serverless** (klient-side), co zapewnia błyskawiczne działanie:
* **HTML5** – semantyczna struktura gry.
* **CSS3 (Flexbox/Grid)** – zaawansowana oprawa graficzna, stylizacja na stary pergamin, efekty cieniowania (`drop-shadow`) oraz animacje monet.
* **JavaScript (ES6+)** – obsługa mechaniki **Drag & Drop**, algorytmów sprawdzania kolizji, logiki bitwy oraz prostego AI przeciwnika.

---

## 🎮 Instrukcja i Funkcje Gry
1.  **Rozpoczęcie:** Kliknij "Rozpocznij Grę", aby wejść do trybu planowania.
2.  **Zarządzanie Flotą:** * Chwyć statek ze **Stoczni** i przeciągnij go na swoją planszę.
    * **Kliknij statek**, aby obrócić go o 90° (pion/poziom).
3.  **Los Przeznaczenia:** Po ustawieniu floty następuje **interaktywny rzut monetą**, który decyduje, kto (Ty czy piracki komputer) odda pierwszy strzał.
4.  **Bitwa:**
    * Klikaj w pola na mapie wroga.
    * 💥 **Eksplozja** – Trafienie!
    * 🌊 **Fale** – Pudło.
    * 💀 **Czaszka** – Okręt całkowicie zatopiony.
5.  **Cel:** Zatop całą flotę przeciwnika i zostań władcą mórz!

---

## 📂 Struktura Projektu
* `index.html` – szkielet aplikacji z kontenerami na plansze i stocznię.
* `style.css` – pełna stylizacja (pergamin, ocean, grafiki statków, animacje 3D monety).
* `script.js` – serce projektu: system Drag & Drop, logika tury, AI komputera.
* `Raport.md` – dokumentacja techniczna.
*
