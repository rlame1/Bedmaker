# Sängynvalmistus & Kestävyyslaskuri (Wood Bed Planner)

> Moderni, interaktiivinen puusänkyjen suunnittelu- ja mitoitussovellus puusepille, nikkaroijille ja huonekalusuunnittelijoille. Sisältää reaaliaikaisen 3D/2D-visualisoinnin, Eurocode 5 -kestävyyslaskennan, materiaalilistat (BOM) sekä leikkausoptimoinnin.

---

## 🌟 Tärkeimmät ominaisuudet

### 1. Runkorakenteet ja mitoitus
* **Tasarunko (Platform / Top-mounted)**: Säleet ja patja lepäävät laitojen päällä. Säädettävä käyntivara (oletus 10 mm / 1 cm) antaa lakanoille tilaa ilman turhaa tilanhukkaa.
* **Upotettu runko (Recessed frame)**: Perinteinen malli, jossa patja upotetaan sivulaitojen sisään säädettävällä upotussyvyydellä.
* **Jalkojen asennustapa**:
  * *Rungon alle*: Runko lepää suoraan jalkojen päällä, pituus = vapaa maavara.
  * *Kulmatolpat*: Rungon sisäkulmiin pultattavat pitkät tolpat.
  * *Varvasystävällinen sisäänveto*: Jalkoja voidaan siirtää 0–80 mm rungon ulkoreunan sisäpuolelle.
* **Kaikki vakiopatjakoot**: 80, 90, 120, 140, 160, 180, 200 cm tai täysin vapaa mittatilaus.

### 2. Eurocode 5 -lujuus- ja taipumalaskenta
* **Pohjasäleiden jännevälilaskenta**: Laskee vapaan aukon ja tehollisen jännevälin runkorakenteen mukaan.
* **Pistekuormakoe**: Simuloi 200 kg pistekuormaa (esim. sängylle hypättäessä) ja useamman nukkujan yhteiskuormaa.
* **Taipumarajat**: Varmistaa, että säleiden ja keskipalkin taipuma pysyy sallituissa rajoissa ($\le L/300$ tai 8 mm).
* **Jalkojen puristusjännitys**: Tarkistaa tolppien kestävyyden puun syiden suuntaiselle puristukselle.

### 3. Puulajitietokanta
* Kattavat lujuus- ja kimmokerroinarvot eri puulajeille:
  * Havupuut: Mänty, Kuusi (C24 / C18)
  * Kovapuut: Koivu, Tammi, Saarni, Pyökki
  * Erikoispuut: Tervaleppä, Haapa
  * Liimatut puutuotteet: Koivuvaneri, Mänty/kuusi-liimapuu

### 4. Sahauslista (BOM) & Leikkausoptimointi
* Valmiit kappalemäärät, mitat, puun tilavuudet ja painoarviot.
* **Leikkausoptimointi**: Laskee parhaan sahausjärjestyksen kauppamittaisille lankuille (2,4 m – 4,8 m) ja minimoi hukan (kerf-hävikki huomioitu).
* Kiinnitys- ja liitososien laskenta (puutapit, ruuvit, kulmaraudat, keskipalkin kannattimet).

### 5. 3D- ja 2D-visualisointi
* Interaktiivinen 3D-malli vapaalla pyörityksellä ja zoomauksella.
* Mittatarkka 2D-päältäkuva ja poikkileikkauskuva mittanoineen.
* Tulostettava sahausohje ja materiaalikooste.

---

## 🚀 Pika-aloitus (Kehitys & Paikallinen käyttö)

### Vaatimukset
* [Node.js](https://nodejs.org/) (versio 18 tai uudempi)
* npm, pnpm tai yarn

### Asennus ja käynnistys

1. **Kloonaa repositorio:**
   ```bash
   git clone https://github.com/OMATUNNUS/puusangyn-suunnittelu-laskuri.git
   cd puusangyn-suunnittelu-laskuri
   ```

2. **Asenna riippuvuudet:**
   ```bash
   npm install
   ```

3. **Käynnistä kehityspalvelin:**
   ```bash
   npm run dev
   ```
   Sovellus aukeaa osoitteessa [http://localhost:3000](http://localhost:3000).

4. **Tuotantoversion kääntäminen:**
   ```bash
   npm run build
   ```
   Valmiit tiedostot syntyvät `dist/`-kansioon.

---

## 📤 Julkaiseminen GitHubiin

Jos haluat viedä tämän projektin omaan GitHub-tiliisi, voit tehdä sen kahdella tavalla:

### Tapa A: Git-komentorivillä

1. Luo uusi tyhjä repositorio GitHubissa osoitteessa: https://github.com/new (esim. nimellä `puusangyn-suunnittelu-laskuri`). Älä lisää README- tai .gitignore-tiedostoa GitHubin luontilomakkeella, sillä ne ovat jo valmiina tässä projektissa.

2. Aja terminaalissa seuraavat komennot:
   ```bash
   git init -b main
   git add .
   git commit -m "feat: Sängynvalmistus & Kestävyyslaskuri v1.0.0"
   git remote add origin https://github.com/OMATUNNUS/puusangyn-suunnittelu-laskuri.git
   git push -u origin main
   ```
   *(Korvaa `OMATUNNUS` omalla GitHub-käyttäjänimelläsi)*

### Tapa B: AI Studion Export-valikosta
Voit myös ladata projektin ZIP-pakettina tai viedä suoraan GitHubiin Google AI Studion ylävalikosta: **Settings / Export -> GitHub**.

---

## 🛠️ Teknologiat

* **Käyttöliittymä**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
* **Kääntäjä & Työkalut**: [Vite](https://vitejs.dev/)
* **Muotoilu**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Ikonit**: [Lucide React](https://lucide.dev/)
* **Animaatiot**: [Motion](https://motion.dev/)

---

## 📄 Lisenssi

Tämä projekti on lisensoitu [MIT-lisenssillä](LICENSE). Voit vapaasti käyttää, muokata ja jakaa koodia sekä henkilökohtaisiin että kaupallisiin puusepänprojekteihin.
