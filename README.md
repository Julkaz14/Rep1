# 🚢 Projekt: Bitwa Morska – Pirate Edition

### Projekt semestralny na zaliczenie przedmiotu

Klasyczna gra strategiczna "Statki" w unikalnej oprawie wizualnej wzorowanej na starych mapach morskich. Aplikacja łączy tradycyjną rozgrywkę z nowoczesnymi technikami webowymi, oferując interaktywny system rozmieszczania floty, zaawansowane AI oraz animacje 3D.

---

## 🚀 Demo Online
Gra jest dostępna publicznie pod adresem:
👉 **[Zagraj teraz: Pirate Edition](https://julkaz14.github.io/Rep1/)**

---

## 📄 Dokumentacja i Raport
Szczegółowy opis algorytmów (w tym logiki AI), struktury kodu oraz analiza techniczna projektu została przygotowana w systemie składu tekstu **LaTeX**.

👉 [ZOBACZ PEŁNY RAPORT W FORMACIE PDF](Raport.pdf)

---

## 🛠️ Wykorzystane Technologie
Projekt został wykonany w architekturze **Serverless** (client-side), co zapewnia błyskawiczne działanie i brak opóźnień:
* **HTML5** – semantyczna struktura i obsługa API Drag & Drop.
* **CSS3 (Flexbox/Grid/3D)** – stylizacja na stary pergamin, efekty cieniowania (`drop-shadow`) oraz zaawansowane transformacje 3D przy rzucie monetą.
* **JavaScript (ES6+)** – autorska implementacja logiki bitwy, algorytmów sprawdzania kolizji oraz **Sztucznej Inteligencji** opartej na mapach prawdopodobieństwa.

---

## 🎮 Instrukcja i Funkcje Gry
1.  **Planowanie:** Przejdź do trybu rozmieszczania floty.
2.  **Zarządzanie Flotą:** * **Drag & Drop:** Chwyć statek ze Stoczni i przeciągnij go na swoją planszę.
    * **Rotacja:** Kliknij statek, aby obrócić go o 90° przed umieszczeniem.
3.  **Los Przeznaczenia:** Interaktywny rzut monetą z fizyką obrotu decyduje o pierwszeństwie ataku.
4.  **Bitwa:**
    * 💥 **Eksplozja** – Trafienie jednostki.
    * 🌊 **Fale** – Pudło (strzał w taflę wody).
    * 💀 **Czaszka** – Okręt całkowicie zatopiony.
5.  **Cel:** Zatop całą flotę pirackiego komputera i zostań władcą mórz!

---

## 📂 Struktura Plików
* `index.html` – szkielet aplikacji i kontenery interfejsu.
* `style.css` – arkusz stylów (warstwa wizualna, animacje, responsywność).
* `script.js` – logika gry, obsługa zdarzeń i moduł AI przeciwnika.
* `Raport(1).pdf` – pełna dokumentacja techniczna wykonana w LaTeX.
*
