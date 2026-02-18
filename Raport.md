# RAPORT Z REALIZACJI PROJEKTU SEMESTRALNEGO: BITWA MORSKA – PIRATE EDITION

## 1. Wstęp i założenia teoretyczne

​Celem niniejszego projektu była realizacja w pełni funkcjonalnej aplikacji webowej typu Single Page Application (SPA), odtwarzającej mechanikę klasycznej gry „Bitwa Morska”. Zdecydowano się na implementację stylistyki pirackiej, co wymusiło zastosowanie zaawansowanych technik manipulacji obrazem i stylizacji CSS3 w celu uzyskania immersyjnego interfejsu.

### Projekt skupia się na trzech filarach technologicznych:

-Natywnym programowaniu zdarzeniowym (Vanilla JavaScript) bez użycia frameworków.

-Sztucznej Inteligencji (AI) opartej na matematycznym modelu gęstości prawdopodobieństwa.

-Interaktywnym UI/UX, wykorzystującym API Drag & Drop oraz transformacje przestrzenne 3D.

## 2. Metryka narzędzi AI i licencjonowanie

​W procesie wytwórczym oraz analitycznym wykorzystano narzędzia generatywnej sztucznej inteligencji. Narzędzia te służyły jako wsparcie w projektowaniu struktur danych oraz optymalizacji algorytmów decyzyjnych.

| Narzędzie | Model | Typ usługi | Zastosowanie techniczne |
| :--- | :--- | :--- | :--- |
| Google Gemini | Gemini 1.5 Pro | Google AI Pro | Generowanie heurystyk AI oraz optymalizacja kodu |

Oświadczenie o licencji: Zgodnie z regulaminem usługi Google AI Pro, użytkownik zachowuje pełne prawa autorskie do wygenerowanych treści. Narzędzia te zostały wykorzystane do opracowania szkieletów funkcji, które następnie poddano ręcznej refaktoryzacji i dostosowaniu do specyfiki gry.

## ​3. Struktura architektury systemu
Projekt został zaprojektowany w modelu monolitycznym typu Client-Side, co oznacza, że całość logiki obliczeniowej, zarządzanie stanem gry oraz renderowanie interfejsu odbywa się bezpośrednio w przeglądarce użytkownika. Architektura opiera się na separacji odpowiedzialności pomiędzy trzema głównymi warstwami: strukturalną, wizualną oraz behawioralną.

### 3.1. Warstwa Strukturalna (HTML5)
Plik index.html nie pełni jedynie roli kontenera, ale definiuje hierarchię widoków aplikacji. Zastosowano w nim system nakładek (overlays), które są dynamicznie przełączane w zależności od stanu gry:

-Menu Główne: Moduł odpowiedzialny za inicjalizację sesji i wybór ustawień.

-Przestrzeń Bitewna: Kontener przechowujący dwie niezależne siatki DOM reprezentujące obszary działań gracza oraz przeciwnika.

-​System Komunikatów: Warstwa powiadomień informująca o wynikach tur oraz zakończeniu rozgrywki.

### ​3.2. Warstwa Prezentacji (CSS3)
Architektura stylów została oparta na nowoczesnych modułach CSS Grid i Flexbox, co pozwoliło na uzyskanie pełnej responsywności bez użycia zewnętrznych bibliotek typu Bootstrap. Kluczowe aspekty tej warstwy to:

-System Siatek: Zastosowanie grid-template-columns: repeat(10, 1fr) umożliwiło stworzenie idealnie kwadratowych pól bitwy, które zachowują proporcje niezależnie od rozdzielczości ekranu.

-Zarządzanie Stanem Wizualnym: Wykorzystano klasy modyfikujące (np. .hit, .miss, .sunk), które są dynamicznie nadawane przez JavaScript, zmieniając wygląd komórek w czasie rzeczywistym.

-Silnik Animacji: Implementacja transformacji rotateY i rotateX pozwoliła na realizację efektów trójwymiarowych, takich jak obracanie monety.

### 3.3. Warstwa Logiczna i Zarządzanie Stanem (JavaScript)
Silnik gry został podzielony na kilka autonomicznych modułów współpracujących ze sobą:

