import { useState, type ReactNode } from 'react'

type Screen = 'menu' | 'form' | 'summary' | 'tracking' | 'system'
type Meal = { name: string; desc: string; stock: number; tone: string; icon: string }
type Reservation = { meal: Meal; day: number; time: number; delivery: number }

const capitalize = (value: string) => value.charAt(0).toLocaleUpperCase('tr-TR') + value.slice(1)
const days = Array.from({ length: 7 }, (_, index) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + index)
  const weekday = capitalize(new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(date))
  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    short: index === 0 ? 'Bugün' : index === 1 ? 'Yarın' : weekday,
    label: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(date),
    full: capitalize(new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(date)),
    weekday,
  }
})
const slots = [
  { label: '12:00–12:30', availability: '18 yer kaldı', full: false },
  { label: '12:30–13:00', availability: 'Dolu', full: true },
  { label: '13:00–13:30', availability: '8 yer kaldı', full: false },
]

const Icon = ({ name, size = 20 }: { name: string; size?: number }) => {
  const paths: Record<string, ReactNode> = {
    mark: <><path d="M5 3h14v5a7 7 0 0 1-14 0V3Z"/><path d="M8 21h8M12 15v6"/><path d="M8 7h8"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    bowl: <><path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M8 20h8M7 7c0-2 2-2 2-4M12 7c0-2 2-2 2-4M17 7c0-2 2-2 2-4"/></>,
    bag: <><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></>,
    arrow: <><path d="m9 18 6-6-6-6"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>,
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Button({ children, variant = 'primary', disabled, allowDisabledClick, onClick }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'disabled'; disabled?: boolean; allowDisabledClick?: boolean; onClick?: () => void }) {
  return <button type="button" className={`btn btn-${disabled ? 'disabled' : variant}`} aria-disabled={disabled} disabled={disabled && !allowDisabledClick} onClick={onClick}>{children}</button>
}

function Header({ screen, go, hasReservation }: { screen: Screen; go: (s: Screen) => void; hasReservation: boolean }) {
  return <header className="header">
    <button type="button" className="brand" onClick={() => go('menu')}><span className="brand-icon"><Icon name="mark" /></span><span>Kampüs Yemek</span></button>
    <nav className="nav">
      <button type="button" className={screen === 'menu' ? 'active' : ''} onClick={() => go('menu')}>Günlük Menü</button>
      <button type="button" disabled={!hasReservation} title={!hasReservation ? 'Henüz bir rezervasyonun yok' : undefined} className={screen === 'tracking' ? 'active' : ''} onClick={() => go('tracking')}>Rezervasyonlarım</button>
      <button type="button" className={screen === 'system' ? 'active' : ''} onClick={() => go('system')}>Design System</button>
    </nav>
    <div className="student"><span>EA</span><div><strong>Elif Aksoy</strong><small>Öğrenci</small></div></div>
  </header>
}

const weeklyMenus: Record<string, Meal[]> = {
  Pazartesi: [
    { name: 'Mercimek Çorbası', desc: 'Kırmızı mercimek ve sebzelerle hazırlanan sıcak başlangıç.', stock: 84, tone: 'orange', icon: '🥣' },
    { name: 'Etli Kuru Fasulye', desc: 'Dana eti ve kuru fasulyeyle hazırlanan geleneksel ana yemek.', stock: 62, tone: 'red', icon: '🍲' },
    { name: 'Pirinç Pilavı', desc: 'Tereyağlı, tane tane geleneksel pirinç pilavı.', stock: 95, tone: 'yellow', icon: '🍚' },
    { name: 'Cacık', desc: 'Yoğurt, salatalık ve nane ile hazırlanan ferah eşlikçi.', stock: 70, tone: 'blue', icon: '🥛' },
  ],
  Salı: [
    { name: 'Domates Çorbası', desc: 'Olgun domates ve baharatlarla hazırlanan sıcak çorba.', stock: 76, tone: 'red', icon: '🥣' },
    { name: 'Fırında Tavuk', desc: 'Baharatlarla marine edilip fırında pişirilmiş tavuk.', stock: 54, tone: 'orange', icon: '🍗' },
    { name: 'Bulgur Pilavı', desc: 'Domatesli ve sebzeli, doyurucu bulgur pilavı.', stock: 88, tone: 'yellow', icon: '🍚' },
    { name: 'Mevsim Salata', desc: 'Günlük taze yeşilliklerle hazırlanan mevsim salatası.', stock: 41, tone: 'blue', icon: '🥗' },
  ],
  Çarşamba: [
    { name: 'Ezogelin Çorbası', desc: 'Mercimek, bulgur ve baharatlarla hazırlanan geleneksel çorba.', stock: 68, tone: 'orange', icon: '🥣' },
    { name: 'İzmir Köfte', desc: 'Köfte, patates ve domates sosuyla fırınlanmış ana yemek.', stock: 49, tone: 'red', icon: '🍲' },
    { name: 'Makarna', desc: 'Hafif domates soslu, günlük hazırlanan makarna.', stock: 92, tone: 'yellow', icon: '🍝' },
    { name: 'Yoğurt', desc: 'Soğuk servis edilen doğal yoğurt.', stock: 73, tone: 'blue', icon: '🥛' },
  ],
  Perşembe: [
    { name: 'Yayla Çorbası', desc: 'Yoğurt, pirinç ve nane ile hazırlanan hafif çorba.', stock: 72, tone: 'blue', icon: '🥣' },
    { name: 'Tavuk Sote', desc: 'Taze sebzelerle sotelenmiş, baharatlı tavuk.', stock: 120, tone: 'orange', icon: '🍲' },
    { name: 'Pirinç Pilavı', desc: 'Tereyağlı, tane tane geleneksel pirinç pilavı.', stock: 35, tone: 'yellow', icon: '🍚' },
    { name: 'Ayran', desc: 'Soğuk, taze ve ferahlatıcı klasik ayran.', stock: 0, tone: 'blue', icon: '🥛' },
  ],
  Cuma: [
    { name: 'Tarhana Çorbası', desc: 'Geleneksel tarhana ve baharatlarla hazırlanan sıcak çorba.', stock: 81, tone: 'orange', icon: '🥣' },
    { name: 'Fırında Köfte', desc: 'Sebzelerle birlikte fırınlanmış ev usulü köfte.', stock: 58, tone: 'red', icon: '🍲' },
    { name: 'Patates Püresi', desc: 'Tereyağı ve sütle hazırlanan yumuşak patates püresi.', stock: 90, tone: 'yellow', icon: '🥔' },
    { name: 'Salata', desc: 'Taze sebzelerle günlük hazırlanan karışık salata.', stock: 46, tone: 'blue', icon: '🥗' },
  ],
  Cumartesi: [
    { name: 'Sebze Çorbası', desc: 'Mevsim sebzeleriyle hazırlanan besleyici çorba.', stock: 64, tone: 'orange', icon: '🥣' },
    { name: 'Tavuklu Makarna', desc: 'Tavuk parçaları ve hafif sosla hazırlanan makarna.', stock: 52, tone: 'red', icon: '🍝' },
    { name: 'Yoğurt', desc: 'Soğuk servis edilen doğal yoğurt.', stock: 69, tone: 'blue', icon: '🥛' },
  ],
  Pazar: [
    { name: 'Mercimek Çorbası', desc: 'Kırmızı mercimek ve sebzelerle hazırlanan sıcak başlangıç.', stock: 77, tone: 'orange', icon: '🥣' },
    { name: 'Etli Nohut', desc: 'Dana eti ve nohutla hazırlanan geleneksel ana yemek.', stock: 55, tone: 'red', icon: '🍲' },
    { name: 'Bulgur Pilavı', desc: 'Domatesli ve sebzeli, doyurucu bulgur pilavı.', stock: 86, tone: 'yellow', icon: '🍚' },
    { name: 'Cacık', desc: 'Yoğurt, salatalık ve nane ile hazırlanan ferah eşlikçi.', stock: 66, tone: 'blue', icon: '🥛' },
  ],
}
const initialMenus = Object.fromEntries(days.map(day => [day.key, weeklyMenus[day.weekday].map(meal => ({ ...meal }))]))

function Menu({ meals, day, setDay, next }: { meals: Meal[]; day: number; setDay: (day: number) => void; next: (meal: Meal) => void }) {
  return <main className="page">
    <div className="intro"><div><p className="eyebrow">{days[day].full}</p><h1>Bugünün Menüsü</h1><p>Öğle yemeğini seç, saatini ayır ve sıra beklemeden teslim al.</p></div><div className="service"><span><Icon name="clock" /></span><div><small>Servis saatleri</small><strong>12:00 — 13:30</strong></div></div></div>
    <div className="date-tabs">{days.map((d, i) => <button type="button" key={d.short} className={day === i ? 'selected' : ''} onClick={() => setDay(i)}><Icon name="calendar" size={18}/><span><strong>{d.short}</strong><small>{d.label}</small></span></button>)}</div>
    <div className="section-head"><div><h2>Öğle Menüsü</h2><p>Menü içeriği günlük olarak güncellenir.</p></div><span className="open-dot">Rezervasyona açık</span></div>
    <div className="meal-grid">{meals.map((meal) => <article className={`meal-card ${meal.stock === 0 ? 'sold' : ''}`} key={meal.name}>
      <div className={`meal-visual ${meal.tone}`}><span>{meal.icon}</span>{meal.stock === 0 && <b>TÜKENDİ</b>}</div>
      <div className="meal-body"><div className="tag">ÖĞRENCİ MENÜSÜ</div><h3>{meal.name}</h3><p>{meal.desc}</p><div className="meal-footer"><span className={meal.stock === 0 ? 'stock empty' : 'stock'}><i />{meal.stock ? `${meal.stock} porsiyon kaldı` : 'Tükendi'}</span><Button disabled={meal.stock === 0} onClick={() => next(meal)}>Rezervasyon Yap <Icon name="arrow" size={17}/></Button></div></div>
    </article>)}</div>
  </main>
}

function Progress({ step }: { step: number }) {
  return <div className="progress">{['Menü Seçimi', 'Rezervasyon', 'Onay'].map((label, i) => <div className={i <= step ? 'done' : ''} key={label}><span>{i < step ? <Icon name="check" size={14}/> : i + 1}</span><small>{label}</small></div>)}</div>
}

function Form({ meal, time, delivery, setTime, setDelivery, back, next }: { meal: Meal; time: number | null; delivery: number | null; setTime: (value: number) => void; setDelivery: (value: number) => void; back: () => void; next: () => void }) {
  const [attempted, setAttempted] = useState(false)
  const incomplete = time === null || delivery === null
  const continueFlow = () => {
    if (incomplete) {
      setAttempted(true)
      return
    }
    next()
  }
  return <main className="narrow page"><Progress step={1}/><div className="screen-title"><button type="button" onClick={back}><Icon name="back"/></button><div><p className="eyebrow">ADIM 2 / 3</p><h1>Rezervasyonunu Oluştur</h1><p>Geliş saatini ve teslim alma tercihini belirle.</p></div></div>
    <section className="selected-meal"><div className="mini-visual">{meal.icon}</div><div><small>SEÇİLEN YEMEK</small><h3>{meal.name}</h3><p>Öğrenci menüsü · {meal.stock} porsiyon kaldı</p></div><span className="available">Uygun</span></section>
    <section className="form-section"><div className="field-title"><span><Icon name="clock"/></span><div><h2>Geliş Saati</h2><p>Yemeğini teslim almak istediğin zaman aralığını seç.</p></div></div><div className="option-grid time-grid">{slots.map((slot,i)=><button type="button" disabled={slot.full} onClick={()=>setTime(i)} className={`${time===i?'choice selected':'choice'} ${slot.full ? 'unavailable' : ''}`} key={slot.label}><span className="radio"/><strong>{slot.label}</strong><small className={slot.full || i===2?'warning':''}>{slot.availability}</small></button>)}</div></section>
    <section className="form-section"><div className="field-title"><span><Icon name="bag"/></span><div><h2>Teslim Alma Tercihi</h2><p>Sana en uygun teslim alma yöntemini seç.</p></div></div><div className="option-grid">{[[`bowl`,'Yemekhanede Ye','Yemeğini kampüs yemekhanesinde ye.'],['bag','Al Götür','Paketli olarak teslim al.']].map((t,i)=><button type="button" onClick={()=>setDelivery(i)} className={delivery===i?'choice delivery selected':'choice delivery'} key={t[1]}><span className="choice-icon"><Icon name={t[0]}/></span><span><strong>{t[1]}</strong><small>{t[2]}</small></span><span className="radio"/></button>)}</div></section>
    <div className="actions"><Button variant="secondary" onClick={back}><Icon name="back" size={17}/> Geri Dön</Button><Button disabled={incomplete} allowDisabledClick onClick={continueFlow}>Devam Et <Icon name="arrow" size={17}/></Button></div>
    {attempted && incomplete && <p className="validation-note" role="alert">Devam etmek için geliş saati ve teslim alma tercihi seçmelisin.</p>}
  </main>
}

function Summary({ meal, day, time, delivery, back, confirm }: { meal: Meal; day: number; time: number; delivery: number; back: () => void; confirm: () => void }) {
  return <main className="narrow page"><Progress step={2}/><div className="screen-title centered"><div><p className="eyebrow">SON ADIM</p><h1>Rezervasyon Özeti</h1><p>Onaylamadan önce bilgilerini kontrol et.</p></div></div>
    <section className="summary-card"><div className="summary-top"><span><Icon name="receipt" size={25}/></span><div><small>REZERVASYON DETAYLARI</small><h3>Öğle Yemeği Rezervasyonu</h3></div></div><div className="summary-meal"><div className="mini-visual">{meal.icon}</div><div><small>SEÇİLEN YEMEK</small><h2>{meal.name}</h2><p>Öğrenci menüsü</p></div><span className="available">Uygun</span></div><div className="details"><div><span><Icon name="calendar"/></span><small>TARİH</small><strong>{days[day].full}</strong></div><div><span><Icon name="clock"/></span><small>GELİŞ SAATİ</small><strong>{slots[time].label}</strong></div><div><span><Icon name="bowl"/></span><small>TESLİM ALMA</small><strong>{delivery === 0 ? 'Yemekhanede Ye' : 'Al Götür'}</strong></div></div>
      <div className="info-note"><Icon name="clock" size={18}/><p>Rezervasyonun seçtiğin saat aralığının sonuna kadar geçerlidir.</p></div>
    </section>
    <div className="summary-actions"><Button variant="secondary" onClick={back}><Icon name="edit" size={17}/> Bilgileri Düzenle</Button><Button onClick={confirm}><Icon name="check" size={17}/> Rezervasyonu Onayla</Button></div>
    <p className="scope-note">Ödeme gerekmiyor · Öğrenci yemek hakkından düşülecektir.</p>
  </main>
}

function Tracking({ meal, day, time, delivery, menu }: { meal: Meal; day: number; time: number; delivery: number; menu: () => void }) {
  return <main className="narrow page tracking"><div className="success-mark"><Icon name="check" size={30}/></div><p className="eyebrow centered-text">REZERVASYON OLUŞTURULDU</p><h1>Yemeğin seni bekliyor!</h1><p>Rezervasyonun başarıyla alındı. Belirlediğin saatte teslim noktasında olman yeterli.</p>
    <section className="ticket"><div className="ticket-head"><div><small>REZERVASYON NUMARASI</small><strong>#KY-184203</strong></div><span className="status">Onaylandı</span></div><div className="ticket-meal"><div className="mini-visual">{meal.icon}</div><div><small>YEMEK</small><h2>{meal.name}</h2></div></div><div className="ticket-info"><div><span><Icon name="calendar"/></span><div><small>TARİH</small><strong>{days[day].full}</strong></div></div><div><span><Icon name="clock"/></span><div><small>GELİŞ SAATİ</small><strong>{slots[time].label}</strong></div></div><div><span><Icon name="bowl"/></span><div><small>TESLİM ALMA</small><strong>{delivery === 0 ? 'Yemekhanede Ye' : 'Al Götür'}</strong></div></div></div>
      <div className="status-line"><div className="complete"><span><Icon name="check" size={14}/></span><strong>Onaylandı</strong><small>Şu an</small></div><i/><div><span><Icon name="bowl" size={16}/></span><strong>Hazırlanıyor</strong><small>Sıradaki adım</small></div><i/><div><span><Icon name="check" size={14}/></span><strong>Teslim Edildi</strong><small>—</small></div></div>
    </section>
    <Button onClick={menu}><Icon name="home" size={18}/> Menüye Dön</Button><p className="help">Bir sorun mu var? <strong>Yemekhane görevlisine danış.</strong></p>
  </main>
}

function DesignSystem() {
  return <main className="page system-page"><div className="intro"><div><p className="eyebrow">SPRINT 1 KÜTÜPHANESİ</p><h1>Design System</h1><p>Geliştirici teslimi için temel görsel token’lar ve tekrar kullanılabilir bileşenler.</p></div></div>
    <section className="system-section"><h2>Renkler</h2><div className="swatches">{[['blue','Primary Blue','#2563EB'],['navy','Dark Navy','#172554'],['green','Success Green','#16A34A'],['background','Background','#F8FAFC'],['white','White','#FFFFFF'],['muted','Secondary Text','#64748B'],['red','Error Red','#DC2626']].map(c=><div className="swatch" key={c[0]}><i className={`swatch-${c[0]}`}/><strong>{c[1]}</strong><small>{c[2]}</small></div>)}</div></section>
    <section className="system-section"><h2>Tipografi</h2><div className="type-spec"><div><h1>Sayfa Başlığı</h1><small>Inter · 32 px · Bold</small></div><div><h3>Kart Başlığı</h3><small>Inter · 17 px · Semibold</small></div><div><p>Gövde metni, açıklamalar ve yardımcı içerikler için kullanılır.</p><small>Inter · 14 px · Regular</small></div></div></section>
    <section className="system-section"><h2>Bileşenler</h2><div className="component-row"><Button>Primary Buton</Button><Button variant="secondary">Secondary Buton</Button><Button disabled>Disabled Buton</Button><span className="status">Onaylandı</span><span className="stock empty"><i/>Tükendi</span></div><div className="component-examples"><div className="choice selected"><span className="radio"/><strong>12:00–12:30</strong><small>18 yer kaldı</small></div><div className="sample-field"><small>FORM ALANI</small><strong>Yemekhanede Ye</strong></div><div className="sample-card"><span>🍲</span><div><small>ÖĞRENCİ MENÜSÜ</small><strong>Tavuk Sote</strong></div></div></div></section>
  </main>
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [menus, setMenus] = useState<Record<string, Meal[]>>(initialMenus)
  const [mealName, setMealName] = useState(initialMenus[days[0].key][0].name)
  const [day, setDay] = useState(0)
  const [time, setTime] = useState<number | null>(null)
  const [delivery, setDelivery] = useState<number | null>(null)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const meals = menus[days[day].key]
  const meal = meals.find(item => item.name === mealName) ?? meals[0]
  const startReservation = (selected: Meal) => {
    setMealName(selected.name)
    setTime(null)
    setDelivery(null)
    setScreen('form')
  }
  const confirm = () => {
    if (time === null || delivery === null) return
    const dateKey = days[day].key
    setMenus(current => ({
      ...current,
      [dateKey]: current[dateKey].map(item => item.name === mealName ? { ...item, stock: Math.max(0, item.stock - 1) } : item),
    }))
    setReservation({ meal, day, time, delivery })
    setScreen('tracking')
  }
  return <div className="app"><Header screen={screen} go={setScreen} hasReservation={reservation !== null}/>
    {screen === 'menu' && <Menu meals={meals} day={day} setDay={setDay} next={startReservation}/>}
    {screen === 'form' && <Form meal={meal} time={time} delivery={delivery} setTime={setTime} setDelivery={setDelivery} back={() => setScreen('menu')} next={() => setScreen('summary')}/>}
    {screen === 'summary' && time !== null && delivery !== null && <Summary meal={meal} day={day} time={time} delivery={delivery} back={() => setScreen('form')} confirm={confirm}/>}
    {screen === 'tracking' && reservation && <Tracking meal={reservation.meal} day={reservation.day} time={reservation.time} delivery={reservation.delivery} menu={() => setScreen('menu')}/>}
    {screen === 'system' && <DesignSystem/>}
    <footer>© 2025 Kampüs Yemek · Öğrenci İşleri Daire Başkanlığı</footer></div>
}
