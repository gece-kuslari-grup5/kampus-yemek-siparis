const stokVerileri = {
    "Mercimek Çorbası": { kapasite: 500, kalan: 28 },
    "Tarhana Çorbası": { kapasite: 500, kalan: 45 },
    "Izgara Köfte": { kapasite: 500, kalan: 12 },
    "Tavuk Sote": { kapasite: 500, kalan: 0 }, 
    "Pirinç Pilavı": { kapasite: 500, kalan: 24 },
    "Makarna": { kapasite: 500, kalan: 36 },
    "Fırın Sütlaç": { kapasite: 500, kalan: 5 },
    "Mevsim Salata": { kapasite: 500, kalan: 30 }
};


const kartlar = document.querySelectorAll('.card');

kartlar.forEach(kart => {
    const yemekAdi = kart.querySelector('h3').innerText.trim();
    
    const veri = stokVerileri[yemekAdi];

    if (veri) {
        const kapasiteElementi = kart.querySelector('.price'); 
        const stokElementi = kart.querySelector('.stock');

        kapasiteElementi.innerText = "Kapasite: " + veri.kapasite;

        if (veri.kalan <= 0) {
            stokElementi.innerText = "Tükendi";
            stokElementi.classList.add('out-of-stock');
        } else if (veri.kalan <= 25) { 
            stokElementi.innerText = "Kalan: " + veri.kalan + " Porsiyon";
            stokElementi.classList.add('low-stock');
        } else {
            stokElementi.innerText = "Kalan: " + veri.kalan + " Porsiyon";
        }
    }
});