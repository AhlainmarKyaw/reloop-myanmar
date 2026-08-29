import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import {
  ArrowLeft, ArrowRight, BadgeCheck, Bike, Check, ChevronDown, CircleCheck,
  CloudUpload, Coffee, Heart, Laptop, Leaf, MapPin, Menu, PackageCheck,
  Recycle, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Smartphone,
  Sparkles, Upload, Utensils, WandSparkles, X, Zap,
} from 'lucide-react'

type Analysis = {
  itemName: string; category: string; condition: string; conditionConfidence: number
  suggestedPriceMin: number; suggestedPriceMax: number; title: string; description: string
  trustObservations: string[]; buyerChecks?: string[]; environmentalImpact: string; estimatedWasteAvoidedKg: number
  brand?: string; possibleModel?: string; modelConfidence?: number; visibleObservations?: string[]
  possibleDefects?: string[]; pricingBasis?: string; analysisSource?: 'openai' | 'demo'
}
type Listing = Analysis & {
  id: string; price: number; location: string; seller: string; sellerSince: string
  trustScore: number; aiVerified: boolean; image?: string; icon?: string; color?: string
  publishedAt?: string; sellerNote?: string
}

const demoListings: Listing[] = [
  {
    id: 'iphone-12', itemName: 'Apple iPhone 12', category: 'Phones', condition: 'Very Good',
    conditionConfidence: 94, suggestedPriceMin: 610000, suggestedPriceMax: 680000,
    title: 'iPhone 12 128GB — Clean Exterior', price: 645000, location: 'Yangon',
    seller: 'Moe Thuzar', sellerSince: 'Member since 2024', trustScore: 96, aiVerified: true,
    description: 'Carefully used iPhone 12 with 128GB storage. Screen and cameras are in excellent condition. Includes original box and charging cable.',
    trustObservations: ['Screen appears free of cracks', 'Camera lenses look intact', 'Ask seller to verify battery health before purchase'],
    environmentalImpact: 'Choosing this phone second-hand can extend its useful life and reduce demand for new electronics.',
    estimatedWasteAvoidedKg: 0.4, icon: 'phone', color: 'from-slate-800 to-slate-500',
  },
  {
    id: 'asus-laptop', itemName: 'ASUS VivoBook 15', category: 'Computers', condition: 'Good',
    conditionConfidence: 89, suggestedPriceMin: 750000, suggestedPriceMax: 840000,
    title: 'ASUS VivoBook 15 — Good Visible Condition', price: 790000, location: 'Mandalay',
    seller: 'Aung Kyaw', sellerSince: 'Member since 2023', trustScore: 91, aiVerified: true,
    description: 'Sample VivoBook listing with a clean exterior and light visible keyboard wear. Functionality and battery runtime cannot be verified from the image.',
    trustObservations: ['Keyboard shows light signs of use', 'Display appears clear', 'Confirm charger and battery runtime at meetup'],
    environmentalImpact: 'Reusing a laptop keeps valuable metals and electronics in circulation.',
    estimatedWasteAvoidedKg: 2.1, icon: 'laptop', color: 'from-blue-700 to-sky-400',
  },
  {
    id: 'sony-headphones', itemName: 'Sony Headphones', category: 'Audio', condition: 'Like New',
    conditionConfidence: 96, suggestedPriceMin: 250000, suggestedPriceMax: 300000,
    title: 'Sony WH-1000XM4 — Clean Exterior', price: 280000, location: 'Yangon',
    seller: 'Nandar Win', sellerSince: 'Member since 2025', trustScore: 98, aiVerified: true,
    description: 'Sample wireless-headphone listing showing a clean exterior, carrying case, and charging cable. Audio and Bluetooth functionality are not verified.',
    trustObservations: ['Ear cushions appear clean', 'Headband looks undamaged', 'Test Bluetooth and audio at meetup'],
    environmentalImpact: 'Keeping audio equipment in use reduces small electronic waste.',
    estimatedWasteAvoidedKg: 0.25, icon: 'headphones', color: 'from-stone-800 to-stone-400',
  },
  {
    id: 'teak-chair', itemName: 'Teak Lounge Chair', category: 'Furniture', condition: 'Good',
    conditionConfidence: 91, suggestedPriceMin: 120000, suggestedPriceMax: 160000,
    title: 'Solid Teak Lounge Chair — Handmade', price: 145000, location: 'Nay Pyi Taw',
    seller: 'Thiri Home', sellerSince: 'Member since 2022', trustScore: 94, aiVerified: false,
    description: 'Comfortable handmade teak chair with a warm natural finish. Structurally sound with light surface wear.',
    trustObservations: ['Frame appears structurally sound', 'Minor surface marks visible', 'Inspect joints before transport'],
    environmentalImpact: 'Reusing solid furniture avoids bulky waste and preserves material value.',
    estimatedWasteAvoidedKg: 12.5, icon: 'chair', color: 'from-amber-800 to-orange-300',
  },
  {
    id: 'city-bicycle', itemName: 'City Bicycle', category: 'Sports', condition: 'Good',
    conditionConfidence: 88, suggestedPriceMin: 220000, suggestedPriceMax: 275000,
    title: 'Lightweight City Bicycle — 7 Speed', price: 245000, location: 'Mandalay',
    seller: 'Ko Min', sellerSince: 'Member since 2024', trustScore: 90, aiVerified: true,
    description: 'Sample seven-speed bicycle listing with visible frame, tyres, and handlebars. Brakes, gears, and service history require buyer verification.',
    trustObservations: ['Frame shows no visible dents', 'Tyres appear serviceable', 'Test brakes and gears before purchase'],
    environmentalImpact: 'A reused bicycle supports low-carbon travel while avoiding material waste.',
    estimatedWasteAvoidedKg: 14.2, icon: 'bike', color: 'from-emerald-800 to-teal-300',
  },
  {
    id: 'rice-cooker', itemName: 'Panasonic Rice Cooker', category: 'Home Appliances', condition: 'Very Good',
    conditionConfidence: 93, suggestedPriceMin: 75000, suggestedPriceMax: 98000,
    title: 'Panasonic 1.8L Rice Cooker — Clean Exterior', price: 85000, location: 'Yangon',
    seller: 'May Zin', sellerSince: 'Member since 2023', trustScore: 95, aiVerified: true,
    description: 'Sample 1.8L rice cooker listing with a clean visible exterior. Heating and keep-warm functionality cannot be verified from an image.',
    trustObservations: ['Inner pot has light signs of use', 'Power cable appears intact', 'Request a power-on test at meetup'],
    environmentalImpact: 'Extending appliance life keeps mixed electronics and metal out of waste streams.',
    estimatedWasteAvoidedKg: 3.4, icon: 'cooker', color: 'from-rose-700 to-orange-300',
  },
]

const storageKey = 'reloop-myanmar-listings'
const formatMMK = (value: number) => `${new Intl.NumberFormat('en-US').format(value)} MMK`
const defaultBuyerChecks = ['Confirm functionality before purchase', 'Verify included accessories', 'Inspect the item before payment']
const estimateWasteKg = (category: string) => {
  const value = category.toLowerCase()
  if (/phone|tablet/.test(value)) return 0.4
  if (/computer|laptop/.test(value)) return 2.1
  if (/audio|headphone/.test(value)) return 0.25
  if (/furniture|chair/.test(value)) return 12.5
  if (/bike|bicycle|sport/.test(value)) return 14.2
  if (/appliance|cooker/.test(value)) return 3.4
  if (/cloth|fashion/.test(value)) return 0.5
  if (/book/.test(value)) return 0.6
  return 1
}
const calculateTrustScore = (input: { image: boolean; analysis: boolean; description: boolean; sellerNote: boolean; conditionConfidence: number }) =>
  Math.min(100,
    (input.image ? 30 : 0) +
    (input.analysis ? 25 : 0) +
    (input.description ? 15 : 0) +
    (input.sellerNote ? 10 : 0) +
    Math.round(Math.max(0, Math.min(100, input.conditionConfidence)) * 0.2),
  )
const readPublished = (): Listing[] => {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]') }
  catch { return [] }
}

function demoAnalyzeItem(note: string): Analysis {
  if (/bike|bicycle/i.test(note)) return {
    itemName: 'Urban Commuter Bicycle', category: 'Sports & Outdoors', condition: 'Good',
    brand: 'Unknown', possibleModel: 'Unknown', modelConfidence: 25, analysisSource: 'demo',
    conditionConfidence: 90, suggestedPriceMin: 220000, suggestedPriceMax: 280000,
    pricingBasis: 'Prototype AI estimate based on item type and visible condition. No live Myanmar marketplace pricing source was available.',
    title: 'Reliable Urban Bicycle — Ready to Ride',
    description: 'Well-kept commuter bicycle with a sturdy frame and comfortable setup. A practical choice for everyday travel around the city. Light cosmetic wear is consistent with normal use.',
    trustObservations: ['Frame appears straight with no obvious exterior cracks', 'Tyres appear to show usable tread', 'Visible condition suggests normal cosmetic wear'],
    visibleObservations: ['Bicycle frame is visible in the provided demo image', 'Tyres and handlebars appear present'],
    possibleDefects: ['Minor cosmetic wear may be present'],
    buyerChecks: ['Test brakes and gears before purchase', 'Confirm the frame size is suitable', 'Inspect the item before payment'],
    environmentalImpact: 'Keeping this bicycle in use avoids material waste and supports low-carbon transport.',
    estimatedWasteAvoidedKg: 14.2,
  }
  return {
    itemName: 'Smartphone (appears to be iPhone 12)', category: 'Phones & Tablets', condition: 'Very Good',
    brand: 'Apple (seller-provided)', possibleModel: 'iPhone 12 (seller-provided)', modelConfidence: 75, analysisSource: 'demo',
    conditionConfidence: 94, suggestedPriceMin: 610000, suggestedPriceMax: 680000,
    pricingBasis: 'Prototype AI estimate based on the seller note, item type, and visible condition. No live Myanmar marketplace pricing source was available.',
    title: 'iPhone 12 128GB — Clean & Well Cared For',
    description: 'The seller identifies this as an iPhone 12 with 128GB storage. Visible condition appears very good, with a clean screen and camera area in the provided image. Functionality and internal condition cannot be verified from a photo.',
    trustObservations: ['No obvious exterior screen cracks are visible', 'Camera area appears intact in the provided image', 'Light signs of normal use may be present'],
    visibleObservations: ['Smartphone exterior is visible', 'No obvious exterior screen cracks are visible', 'Camera area appears intact'],
    possibleDefects: ['Light cosmetic wear may be present'],
    buyerChecks: ['Test functionality and battery before purchase', 'Verify IMEI and iCloud status', 'Confirm the included box and cable'],
    environmentalImpact: 'Giving this phone a second life can keep valuable electronics in circulation and reduce demand for a newly manufactured device.',
    estimatedWasteAvoidedKg: 0.4,
  }
}

async function analyzeItem(image: string, note: string): Promise<{ analysis: Analysis; demoMode: boolean }> {
  try {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    const response = await fetch('/api/analyze-item', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, note }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!response.ok) throw new Error('AI endpoint unavailable')
    const value = await response.json() as Partial<Analysis>
    if (!value.itemName || !value.category || !value.condition || !value.title || !value.description ||
      !value.brand || !value.possibleModel || !value.pricingBasis || value.analysisSource !== 'openai' ||
      !Array.isArray(value.visibleObservations) || !Array.isArray(value.possibleDefects) ||
      !Array.isArray(value.trustObservations) || !Array.isArray(value.buyerChecks) ||
      !Number.isFinite(value.suggestedPriceMin) || !Number.isFinite(value.suggestedPriceMax)) throw new Error('Invalid AI response')
    const analysis = value as Analysis
    analysis.conditionConfidence = Math.max(0, Math.min(100, Number(analysis.conditionConfidence) || 0))
    analysis.estimatedWasteAvoidedKg = estimateWasteKg(analysis.category)
    return { analysis, demoMode: false }
  } catch {
    await new Promise(resolve => setTimeout(resolve, 1200))
    return { analysis: demoAnalyzeItem(note), demoMode: true }
  }
}

const getPricingConfidence = (analysis: Analysis) => {
  const identifiedEvidence = analysis.brand && analysis.brand !== 'Unknown' &&
    analysis.possibleModel && analysis.possibleModel !== 'Unknown' &&
    (analysis.modelConfidence || 0) >= 70
  return identifiedEvidence && analysis.conditionConfidence >= 70 ? 'Medium' : 'Low'
}

const fileToDataUrl = (file: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(new Error('Unable to read image'))
  reader.readAsDataURL(file)
})

async function prepareImage(file: File, allowDemoSvg = false) {
  const supported = ['image/jpeg', 'image/png', 'image/webp']
  if (!supported.includes(file.type) && !(allowDemoSvg && file.type === 'image/svg+xml')) {
    throw new Error('Please choose a JPG, PNG, or WEBP image.')
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('Please choose an image under 10 MB.')
  const source = await fileToDataUrl(file)
  const image = new window.Image()
  image.src = source
  await image.decode()
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to prepare image.')
  context.fillStyle = '#f5f5f4'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.84)
}

async function sendListingEvent(payload: Record<string, unknown>) {
  if (import.meta.env.DEV) return
  try {
    await fetch('/api/listing-event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
  } catch {
    // Optional automation must never block the core marketplace flow.
  }
}
function cn(...values: Array<string | false | undefined>) { return values.filter(Boolean).join(' ') }

function Button({ children, variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button className={cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60',
    variant === 'primary' && 'bg-brand-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md',
    variant === 'secondary' && 'border border-stone-200 bg-white text-ink hover:border-brand-200 hover:bg-brand-50',
    variant === 'ghost' && 'text-stone-600 hover:bg-stone-100', className,
  )} {...props}>{children}</button>
}

function Logo() {
  return <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-ink">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm"><Recycle size={20} /></span>
    <span className="text-xl">ReLoop <span className="text-brand-600">Myanmar</span></span>
  </Link>
}

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const onSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate(`/?q=${encodeURIComponent(String(new FormData(event.currentTarget).get('search') || ''))}`)
  }
  return <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-xl">
    <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-7 px-5 sm:px-8">
      <Logo />
      <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 lg:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input name="search" aria-label="Search marketplace" placeholder="Search phones, furniture, bikes…" className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-50" />
      </form>
      <nav className="ml-auto hidden items-center gap-7 text-sm font-medium text-stone-600 md:flex">
        <Link to="/#categories" className="hover:text-brand-700">Categories</Link>
        <Link to="/#impact" className="hover:text-brand-700">Impact</Link>
        <Link to="/sell"><Button className="py-2.5"><WandSparkles size={17} /> Sell with AI</Button></Link>
      </nav>
      <button aria-label="Open menu" onClick={() => setMobileOpen(v => !v)} className="ml-auto rounded-lg p-2 md:hidden">{mobileOpen ? <X /> : <Menu />}</button>
    </div>
    {mobileOpen && <div className="border-t border-stone-100 bg-white p-5 md:hidden">
      <form onSubmit={onSearch} className="relative mb-4"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} /><input name="search" placeholder="Search marketplace" className="w-full rounded-xl border border-stone-200 py-3 pl-11 pr-4" /></form>
      <Link to="/sell" onClick={() => setMobileOpen(false)}><Button className="w-full"><WandSparkles size={17} /> Sell with AI</Button></Link>
    </div>}
    {location.pathname === '/sell' && <div className="h-0.5 w-full bg-stone-100"><div className="h-full w-1/2 bg-brand-500" /></div>}
  </header>
}

function ItemVisual({ listing, className = '' }: { listing: Listing; className?: string }) {
  if (listing.image) return <img src={listing.image} alt={listing.title} className={cn('h-full w-full object-cover', className)} />
  const icons: Record<string, React.ReactNode> = {
    phone: <Smartphone />, laptop: <Laptop />, bike: <Bike />, cooker: <Utensils />,
    headphones: <Zap />, chair: <Coffee />, default: <ShoppingBag />,
  }
  return <div className={cn('relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br', listing.color || 'from-brand-700 to-emerald-300', className)}>
    <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/20" />
    <div className="absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-white/10" />
    <span className="grid h-24 w-24 place-items-center rounded-[2rem] bg-white/15 text-white shadow-2xl backdrop-blur-md [&>svg]:h-12 [&>svg]:w-12">{icons[listing.icon || 'default']}</span>
  </div>
}

function ListingCard({ listing }: { listing: Listing }) {
  return <Link to={`/listing/${listing.id}`} className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,.03)] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-200/60">
    <div className="relative aspect-[4/3] overflow-hidden">
      <ItemVisual listing={listing} className="transition duration-500 group-hover:scale-105" />
      <button aria-label="Save listing" onClick={event => { event.preventDefault(); event.currentTarget.classList.toggle('text-rose-500') }} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-stone-600 shadow-sm backdrop-blur transition hover:scale-105"><Heart size={17} /></button>
      {listing.aiVerified && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-brand-700 shadow-sm backdrop-blur"><BadgeCheck size={14} /> {listing.publishedAt ? (listing.analysisSource === 'openai' ? 'AI ASSESSED' : 'DEMO MODE') : 'SAMPLE LISTING'}</span>}
    </div>
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="rounded-md bg-brand-50 px-2 py-1 font-semibold text-brand-700">{listing.condition}</span><span className="flex items-center gap-1 text-stone-500"><MapPin size={13} /> {listing.location}</span></div>
      <h3 className="line-clamp-2 min-h-11 font-semibold leading-snug text-ink">{listing.title}</h3>
      <p className="mt-3 text-lg font-extrabold tracking-tight text-ink">{formatMMK(listing.price)}</p>
      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500"><span>{listing.seller}</span><span className="flex items-center gap-1 font-semibold text-stone-700"><ShieldCheck size={14} className="text-brand-600" /> {listing.trustScore}% trust</span></div>
    </div>
  </Link>
}

function HomePage() {
  const searchParams = new URLSearchParams(useLocation().search)
  const query = (searchParams.get('q') || '').toLowerCase()
  const publishedId = searchParams.get('published')
  const allListings = useMemo(() => [...readPublished(), ...demoListings], [])
  const filtered = allListings.filter(item => !query || `${item.title} ${item.category} ${item.location}`.toLowerCase().includes(query))
  const totalWaste = allListings.reduce((sum, listing) => sum + listing.estimatedWasteAvoidedKg, 0)
  const categories = [['Phones', Smartphone], ['Computers', Laptop], ['Home', Coffee], ['Sports', Bike]] as const
  return <main>
    <section className="relative overflow-hidden border-b border-stone-200 bg-[#f4faf6]">
      <div className="absolute left-1/2 top-12 h-80 w-80 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
        <div>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700"><Sparkles size={14} /> Smarter resale for Myanmar</span>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.04] tracking-[-.045em] text-ink sm:text-6xl lg:text-7xl">Give Things a <span className="text-brand-600">Second Life.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600 sm:text-xl">Turn one photo into a trusted second-hand listing in seconds.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/sell"><Button className="w-full px-7 py-4 text-base sm:w-auto"><WandSparkles size={20} /> Sell with AI <ArrowRight size={18} /></Button></Link><a href="#marketplace"><Button variant="secondary" className="w-full py-4 text-base sm:w-auto">Browse Items</Button></a></div>
          <p className="mt-4 flex items-center gap-2 text-xs text-stone-500"><CircleCheck size={14} className="text-brand-600" /> Free to list · AI guidance in seconds</p>
        </div>
        <div className="relative hidden h-[430px] lg:block">
          <div className="animate-float absolute left-12 top-4 h-72 w-56 rotate-[-6deg] overflow-hidden rounded-[2rem] border-8 border-white bg-white shadow-2xl"><ItemVisual listing={demoListings[0]} /><div className="absolute bottom-0 w-full bg-white p-4"><p className="text-xs text-stone-500">AI price estimate</p><p className="font-bold">610K – 680K MMK</p></div></div>
          <div className="absolute bottom-3 right-8 h-72 w-64 rotate-[7deg] overflow-hidden rounded-[2rem] border-8 border-white bg-white shadow-2xl"><ItemVisual listing={demoListings[4]} /><div className="absolute bottom-0 w-full bg-white p-4"><p className="font-bold">Ready for a second life</p><p className="mt-1 text-xs text-stone-500">14.2 kg waste avoided</p></div></div>
          <div className="absolute right-4 top-4 rounded-2xl bg-white p-4 shadow-xl"><BadgeCheck className="text-brand-600" /><p className="mt-2 text-sm font-bold">AI assessed</p></div>
        </div>
      </div>
    </section>
    <section id="impact" className="border-b border-stone-200 bg-white"><div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-stone-200 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
      {[[String(allListings.length), 'Items given a second life', PackageCheck], [`${totalWaste.toFixed(1)} kg`, 'Estimated waste avoided', Recycle], ['PHOTO → AI → TRUST → REUSE', 'The ReLoop journey', Leaf]].map(([value, label, Icon]) =>
        <div key={String(label)} className="flex items-center gap-4 px-4 py-7 sm:justify-center"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={21} /></span><div><p className="text-xl font-extrabold">{String(value)}</p><p className="text-xs text-stone-500">{String(label)}*</p></div></div>)}
    </div></section>
    <section id="categories" className="mx-auto max-w-7xl px-5 pt-16 sm:px-8"><div className="flex gap-3 overflow-auto pb-2">{categories.map(([name, Icon]) => <a key={name} href={`/?q=${name}`} className="flex min-w-36 items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-brand-300 hover:text-brand-700"><Icon size={19} className="text-brand-600" /> {name}</a>)}</div></section>
    <section className="mx-auto grid max-w-7xl gap-4 px-5 pt-14 sm:grid-cols-3 sm:px-8">
      {[[Zap, 'Sell faster', 'AI handles identification, pricing, and writing.'], [ShieldCheck, 'Buy with confidence', 'Visible observations and practical buyer checks.'], [Leaf, 'Reduce waste', 'See the estimated benefit of keeping items in use.']].map(([Icon, title, copy]) => <div key={String(title)} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={19} /></span><div><h3 className="font-bold">{String(title)}</h3><p className="mt-1 text-sm leading-relaxed text-stone-500">{String(copy)}</p></div></div>)}
    </section>
    <section id="marketplace" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
      {publishedId && <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-brand-800 sm:flex-row sm:items-center"><CircleCheck size={24} className="shrink-0" /><div className="flex-1"><p className="font-bold">Your listing is live.</p><p className="text-sm opacity-75">It is now at the top of the marketplace.</p></div><Link to={`/listing/${publishedId}`}><Button className="w-full sm:w-auto">Open listing <ArrowRight size={16} /></Button></Link></div>}
      <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-brand-600">Fresh finds</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{query ? `Results for “${query}”` : 'Discover your next find'}</h2></div><Button variant="secondary" className="hidden sm:flex"><SlidersHorizontal size={16} /> Filter <ChevronDown size={15} /></Button></div>
      {filtered.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(listing => <ListingCard key={listing.id} listing={listing} />)}</div> :
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white py-20 text-center"><Search className="mx-auto text-stone-300" size={40} /><h3 className="mt-4 text-xl font-bold">No matching items yet</h3><p className="mt-2 text-stone-500">Try a broader search, or be the first to list one.</p><Link to="/sell"><Button className="mt-5">Sell with AI</Button></Link></div>}
      <p className="mt-8 text-center text-xs text-stone-400">*Demo listings and impact figures are illustrative estimates, not real-time market data.</p>
    </section>
  </main>
}

const analysisSteps = ['Looking at your item…', 'Checking visible condition…', 'Preparing your listing…']

function TrustPassport({ analysis, trustScore, sellerNoteProvided }: { analysis: Analysis; trustScore: number; sellerNoteProvided: boolean }) {
  const signals = [
    [analysis.analysisSource === 'openai' ? 'Photo analyzed with AI' : 'Photo assessed in Demo Mode', true],
    ['Visible condition reviewed', true],
    ['Listing information completed', Boolean(analysis.title && analysis.description)],
    ['Seller provided additional information', sellerNoteProvided],
  ] as const
  return <section className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm">
    <div className="bg-blue-50 p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-700">AI Trust Passport</p><h3 className="mt-2 text-lg font-extrabold">{analysis.analysisSource === 'openai' ? 'AI-assisted assessment' : 'Demo assessment'}</h3></div><div className="text-right"><p className="text-3xl font-black text-blue-800">{trustScore}<span className="text-base text-blue-400"> / 100</span></p><p className="text-[11px] font-semibold text-blue-600">Trust signals</p></div></div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">{signals.map(([label, active]) => <div key={label} className={cn('flex items-center gap-2 text-xs font-semibold', active ? 'text-blue-800' : 'text-stone-400')}><span className={cn('grid h-5 w-5 place-items-center rounded-full', active ? 'bg-blue-700 text-white' : 'bg-stone-200')}><Check size={12} /></span>{label}</div>)}</div>
      <details className="mt-5 text-xs text-blue-700"><summary className="cursor-pointer font-bold focus:outline-none focus:ring-2 focus:ring-blue-300">How is this calculated?</summary><p className="mt-2 leading-relaxed text-blue-700/75">Image +30, {analysis.analysisSource === 'openai' ? 'AI analysis' : 'structured demo assessment'} +25, completed description +15, seller note +10, and condition confidence up to +20. It does not guarantee honesty, authenticity, ownership, safety, or functionality.</p></details>
    </div>
    <div className="grid gap-6 p-6 sm:grid-cols-2">
      <div><p className="text-sm font-extrabold">AI visible observations</p><ul className="mt-3 space-y-3">{(analysis.visibleObservations || analysis.trustObservations).map(item => <li key={item} className="flex gap-2 text-sm leading-relaxed text-stone-600"><CircleCheck size={16} className="mt-0.5 shrink-0 text-brand-600" />{item}</li>)}</ul>{Boolean(analysis.possibleDefects?.length) && <div className="mt-4 rounded-xl bg-amber-50 p-3"><p className="text-xs font-bold text-amber-800">Possible visible wear</p><p className="mt-1 text-xs leading-relaxed text-amber-700">{analysis.possibleDefects?.join(' · ')}</p></div>}</div>
      <div><p className="text-sm font-extrabold">Buyer checks</p><ul className="mt-3 space-y-3">{(analysis.buyerChecks || defaultBuyerChecks).map(item => <li key={item} className="flex gap-2 text-sm leading-relaxed text-stone-600"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-600" />{item}</li>)}</ul></div>
    </div>
    <p className="border-t border-stone-100 px-6 py-3 text-[11px] text-stone-400">Buyer verification recommended. Assessment is based only on the provided image and seller note.</p>
  </section>
}

function SellPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const analysisLock = useRef(false)
  const [image, setImage] = useState('')
  const [note, setNote] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [step, setStep] = useState(0)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [price, setPrice] = useState(0)
  const [error, setError] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    if (!isAnalyzing) return
    const timer = window.setInterval(() => setStep(current => Math.min(current + 1, analysisSteps.length - 1)), 650)
    return () => clearInterval(timer)
  }, [isAnalyzing])
  const handleFile = async (file?: File, allowDemoSvg = false) => {
    if (!file) return
    try {
      const prepared = await prepareImage(file, allowDemoSvg)
      setImage(prepared); setError(''); setAnalysis(null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to prepare this image.')
    }
  }
  const loadDemoItem = async () => {
    const response = await fetch('/demo-phone.svg')
    const blob = await response.blob()
    await handleFile(new File([blob], 'reloop-demo-phone.svg', { type: 'image/svg+xml' }), true)
    setNote('Used for one year. Charger and original box included.')
  }
  const runAnalysis = async () => {
    if (!image || analysisLock.current) return
    analysisLock.current = true
    setIsAnalyzing(true); setStep(0); setError('')
    try {
      const result = await analyzeItem(image, note)
      setAnalysis(result.analysis); setDemoMode(result.demoMode)
      setPrice(Math.round(((result.analysis.suggestedPriceMin + result.analysis.suggestedPriceMax) / 2) / 5000) * 5000)
    } catch {
      setError('We could not analyze this image. Please try again.')
    } finally {
      setIsAnalyzing(false)
      analysisLock.current = false
    }
  }
  const publish = () => {
    if (!analysis || !image || !analysis.title.trim() || !analysis.description.trim() || price <= 0 || isPublishing) return
    setIsPublishing(true)
    const id = `listing-${Date.now()}`
    const publishedAt = new Date().toISOString()
    const trustScore = calculateTrustScore({ image: true, analysis: true, description: true, sellerNote: Boolean(note.trim()), conditionConfidence: analysis.conditionConfidence })
    const listing: Listing = { ...analysis, estimatedWasteAvoidedKg: estimateWasteKg(analysis.category), id, price, image, location: 'Yangon', seller: 'You', sellerSince: 'New seller', sellerNote: note, trustScore, aiVerified: true, publishedAt }
    localStorage.setItem(storageKey, JSON.stringify([listing, ...readPublished()]))
    void sendListingEvent({ event: 'listing_published', listingId: id, title: listing.title, category: listing.category, price, location: listing.location, trustScore, estimatedWasteAvoidedKg: listing.estimatedWasteAvoidedKg, createdAt: publishedAt })
    navigate(`/?published=${id}#marketplace`)
  }

  return <main className="min-h-[calc(100vh-72px)] bg-[#f7f8f6]"><div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
    <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-ink"><ArrowLeft size={16} /> Back to marketplace</Link>
    <div className="mb-10 max-w-2xl"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white"><WandSparkles size={22} /></span><span className="font-bold text-brand-700">AI Sell Assistant</span></div><h1 className="mt-5 text-4xl font-black tracking-[-.035em] sm:text-5xl">{analysis ? 'Your listing, made smarter.' : 'Turn a photo into a great listing.'}</h1><p className="mt-4 text-stone-600">{analysis ? 'Review the AI suggestions, make any edits, and publish when you’re happy.' : 'Upload one clear photo. ReLoop AI helps identify, price, describe, and assess your item.'}</p></div>
    {!analysis && !isAnalyzing && <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between"><div><p className="font-bold">1. Add one item photo</p><p className="mt-1 text-sm text-stone-500">A clear, well-lit photo works best.</p></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">JPG, PNG, WEBP · max 10 MB</span></div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => handleFile(event.target.files?.[0])} />
        {image ? <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-stone-100"><img src={image} alt="Item preview" className="h-full w-full object-contain" /><button onClick={() => setImage('')} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-stone-700 shadow-lg"><X size={17} /></button></div> :
          <button onClick={() => fileRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); handleFile(event.dataTransfer.files[0]) }} className="group flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 transition hover:border-brand-400 hover:bg-brand-50/50"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-brand-600 shadow-md transition group-hover:-translate-y-1"><CloudUpload size={29} /></span><p className="mt-5 font-bold">Drop your photo here</p><p className="mt-1 text-sm text-stone-500">or click to browse</p></button>}
      </section>
      <aside className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7">
        <p className="font-bold">2. Add a note <span className="font-normal text-stone-400">(optional)</span></p><p className="mt-1 text-sm text-stone-500">Details like model, age, or included accessories improve results.</p>
        <textarea value={note} onChange={event => setNote(event.target.value)} rows={5} placeholder="Used for one year. Charger included." aria-label="Optional seller note" className="mt-5 w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed outline-none transition placeholder:text-stone-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-50" />
        <div className="mt-5 rounded-2xl bg-brand-50 p-4"><p className="flex items-center gap-2 text-sm font-bold text-brand-700"><ShieldCheck size={17} /> Your photo stays private</p><p className="mt-1 text-xs leading-relaxed text-brand-700/70">Used only to create this listing in the prototype.</p></div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <Button onClick={runAnalysis} disabled={!image || isAnalyzing} className="mt-5 w-full py-4 text-base"><Sparkles size={19} /> Analyze with AI</Button>
        <button onClick={loadDemoItem} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-brand-700 hover:bg-brand-50"><Zap size={16} /> Try Demo Item</button>
      </aside>
    </div>}
    {isAnalyzing && <div className="mx-auto grid max-w-4xl items-center gap-9 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/40 sm:p-9 md:grid-cols-2">
      <div className="relative aspect-square max-h-80 overflow-hidden rounded-2xl bg-stone-100"><img src={image} alt="Item being analyzed" className="h-full w-full object-contain opacity-80" /><div className="animate-scan absolute inset-x-4 top-0 h-0.5 bg-brand-400 shadow-[0_0_15px_4px_rgba(23,167,105,.5)]" /><div className="absolute inset-4 rounded-xl border border-brand-400/50" /></div>
      <div><span className="animate-ring grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white"><Sparkles size={22} /></span><h2 className="mt-6 text-2xl font-extrabold">ReLoop AI is working</h2><p className="mt-2 text-sm text-stone-500">Turning your photo into a trusted, ready-to-publish listing.</p><div className="mt-7 space-y-4">{analysisSteps.map((label, index) => <div key={label} className={cn('flex items-center gap-3 text-sm transition', index <= step ? 'text-ink' : 'text-stone-300')}><span className={cn('grid h-6 w-6 place-items-center rounded-full', index < step ? 'bg-brand-600 text-white' : index === step ? 'border-2 border-brand-500 bg-brand-50 text-brand-600' : 'border border-stone-200')}>{index < step ? <Check size={14} /> : index + 1}</span><span className={index === step ? 'font-bold' : ''}>{label}</span></div>)}</div></div>
    </div>}
    {analysis && <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-600">Item identified</p><h2 className="mt-2 text-2xl font-extrabold">{analysis.itemName}</h2></div>{demoMode ? <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wide text-amber-700 shadow-sm"><Zap size={15} fill="currentColor" /> AI Demo Mode</span> : <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wide text-brand-700"><Sparkles size={15} /> AI Analysis</span>}</div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{[['Category', analysis.category], ['Brand', analysis.brand || 'Unknown'], ['Possible model', analysis.possibleModel || 'Unknown'], ['Visible condition', analysis.condition], ['Condition confidence', `${analysis.conditionConfidence}%`], ['Model confidence', `${analysis.modelConfidence || 0}%`]].map(([label, value]) => <div key={label} className="rounded-2xl bg-stone-50 p-4"><p className="text-xs text-stone-500">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}</div>
          <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-brand-700">AI Estimated Price</p><span title="No live market references are connected. Confidence reflects identification and visible-condition evidence only." className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-brand-700">{getPricingConfidence(analysis)} confidence</span></div>
            <p className="mt-2 text-2xl font-black tracking-tight text-brand-700">{formatMMK(analysis.suggestedPriceMin).replace(' MMK', '')} – {formatMMK(analysis.suggestedPriceMax)}</p>
            <div className="mt-4 border-t border-brand-200 pt-3 text-xs leading-relaxed text-brand-800/70"><p><strong>Price source:</strong> AI estimate</p><p className="mt-1"><strong>Pricing basis:</strong> {analysis.pricingBasis || 'Prototype AI estimate based on item type and visible condition. No live Myanmar marketplace pricing source was available.'}</p></div>
            <p className="mt-3 text-[11px] font-semibold text-brand-700">Estimated price — not real-time market data.</p>
          </div>
        </section>
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">AI generated listing</p><h2 className="mt-2 text-2xl font-extrabold">Make it yours</h2>
          <label className="mt-6 block text-sm font-bold">Listing title</label><input value={analysis.title} onChange={event => setAnalysis({ ...analysis, title: event.target.value })} className="mt-2 w-full rounded-xl border border-stone-200 p-3.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" />
          <label className="mt-5 block text-sm font-bold">Description</label><textarea value={analysis.description} onChange={event => setAnalysis({ ...analysis, description: event.target.value })} rows={6} className="mt-2 w-full resize-none rounded-xl border border-stone-200 p-3.5 leading-relaxed outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" />
          <label className="mt-5 block text-sm font-bold">Your selling price</label><p className="mt-1 text-xs text-stone-500">You control the final price. The AI range is guidance only.</p><div className="relative mt-2"><input type="number" value={price} onChange={event => setPrice(Number(event.target.value))} className="w-full rounded-xl border border-stone-200 p-3.5 pr-20 font-bold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">MMK</span></div>
        </section>
      </div>
      <aside className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"><div className="aspect-[4/3] bg-stone-100"><img src={image} alt="Listing preview" className="h-full w-full object-contain" /></div><div className="p-5"><p className="text-xs text-stone-500">Your listing preview</p><p className="mt-1 font-bold">{analysis.title}</p><p className="mt-2 text-lg font-black">{formatMMK(price)}</p></div></div>
        <TrustPassport analysis={analysis} sellerNoteProvided={Boolean(note.trim())} trustScore={calculateTrustScore({ image: true, analysis: true, description: Boolean(analysis.description.trim()), sellerNote: Boolean(note.trim()), conditionConfidence: analysis.conditionConfidence })} />
        <section className="rounded-3xl bg-[#173f30] p-6 text-white shadow-sm"><Leaf className="text-brand-200" size={25} /><p className="mt-5 text-xs font-bold uppercase tracking-widest text-brand-200">Estimated environmental impact</p><p className="mt-2 text-3xl font-black">{estimateWasteKg(analysis.category)} kg</p><p className="text-sm text-brand-100">estimated waste avoided</p><p className="mt-4 text-sm leading-relaxed text-white/70">{analysis.environmentalImpact}</p><p className="mt-4 text-[11px] text-white/45" title="Prototype estimate based on typical item category weight. Actual impact may vary.">Prototype category-weight estimate. Actual impact may vary.</p></section>
        <Button onClick={publish} disabled={isPublishing || !image || !analysis.title.trim() || !analysis.description.trim() || price <= 0 || !analysis.condition} className="w-full py-4 text-base"><Upload size={19} /> {isPublishing ? 'Publishing…' : 'Publish Listing'}</Button>
        <button onClick={() => setAnalysis(null)} className="w-full text-center text-sm font-medium text-stone-500 hover:text-ink">Start over with another photo</button>
      </aside>
    </div>}
  </div></main>
}

function DetailPage() {
  const { id } = useParams()
  const locationState = useLocation().state as { justPublished?: boolean } | null
  const listing = [...readPublished(), ...demoListings].find(item => item.id === id)
  const [saved, setSaved] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [interestSent, setInterestSent] = useState(false)
  const [interestForm, setInterestForm] = useState({ buyerName: '', contact: '', message: 'Hi, is this still available?' })
  const [interestError, setInterestError] = useState('')
  const submitInterest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const submitted = {
      buyerName: String(form.get('buyerName') || interestForm.buyerName).trim(),
      contact: String(form.get('contact') || interestForm.contact).trim(),
      message: String(form.get('message') || interestForm.message).trim(),
    }
    if (!submitted.buyerName || !submitted.contact || !submitted.message) {
      setInterestError('Add your name, contact method, and a short message.')
      return
    }
    setInterestForm(submitted)
    setInterestError('')
    void sendListingEvent({
      event: 'buyer_interest', listingId: listing?.id, listingTitle: listing?.title,
      buyerName: submitted.buyerName, contact: submitted.contact, message: submitted.message,
      createdAt: new Date().toISOString(),
    })
    setInterestSent(true)
  }
  if (!listing) return <main className="mx-auto max-w-2xl px-5 py-24 text-center"><ShoppingBag className="mx-auto text-stone-300" size={48} /><h1 className="mt-5 text-3xl font-black">Listing not found</h1><p className="mt-3 text-stone-500">This item may no longer be available.</p><Link to="/"><Button className="mt-7">Back to marketplace</Button></Link></main>
  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
    {locationState?.justPublished && <div className="mb-7 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-brand-700"><CircleCheck className="mt-0.5 shrink-0" size={20} /><div><p className="font-bold">Your listing is live!</p><p className="mt-0.5 text-sm opacity-80">It now appears in the ReLoop marketplace.</p></div></div>}
    <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-ink"><ArrowLeft size={16} /> Marketplace</Link>
    <div className="grid gap-9 lg:grid-cols-[1.15fr_.85fr]">
      <section><div className="aspect-[4/3] overflow-hidden rounded-3xl bg-stone-100 shadow-sm"><ItemVisual listing={listing} /></div><div className="mt-8 hidden space-y-6 lg:block"><DescriptionBlocks listing={listing} /></div></section>
      <aside>
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{listing.condition}</span>{listing.aiVerified && <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"><BadgeCheck size={14} /> {listing.publishedAt ? (listing.analysisSource === 'openai' ? 'AI ASSESSED' : 'DEMO MODE') : 'SAMPLE LISTING'}</span>}</div>
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-[-.025em]">{listing.title}</h1><p className="mt-4 text-3xl font-black text-brand-700">{formatMMK(listing.price)}</p><p className="mt-4 flex items-center gap-1.5 text-sm text-stone-500"><MapPin size={16} /> {listing.location}</p>
          <div className="my-7 border-t border-stone-100" />
          <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#e7d4bb] font-bold text-amber-900">{listing.seller.slice(0, 1)}</span><div><p className="font-bold">{listing.seller}</p><p className="text-xs text-stone-500">{listing.sellerSince}</p></div><div className="ml-auto text-right"><p className="flex items-center gap-1 font-bold text-brand-700"><ShieldCheck size={17} /> {listing.trustScore}%</p><p className="text-[11px] text-stone-400">Trust score</p></div></div>
          <div className="mt-7 grid grid-cols-[1fr_auto] gap-3"><Button onClick={() => setDialogOpen(true)} className="py-4 text-base">I'm Interested <ArrowRight size={18} /></Button><Button aria-label="Save listing" variant="secondary" onClick={() => setSaved(v => !v)} className={cn('px-4', saved && 'border-rose-200 bg-rose-50 text-rose-600')}><Heart size={20} fill={saved ? 'currentColor' : 'none'} /></Button></div>
          <p className="mt-4 text-center text-xs text-stone-400">Meet safely in a public place. Inspect before paying.</p>
        </div>
        <div className="mt-5 rounded-3xl bg-[#173f30] p-6 text-white"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-brand-200"><Leaf size={22} /></span><div><p className="text-xs text-brand-200">Estimated environmental impact</p><p className="text-xl font-black">{listing.estimatedWasteAvoidedKg} kg waste avoided</p></div></div><p className="mt-4 text-sm leading-relaxed text-white/65">{listing.environmentalImpact}</p><p className="mt-4 text-[11px] text-white/40">Prototype estimate based on typical item category weight. Actual impact may vary.</p></div>
        <div className="mt-8 space-y-6 lg:hidden"><DescriptionBlocks listing={listing} /></div>
      </aside>
    </div>
    <Dialog.Root open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) { setInterestSent(false); setInterestError('') } }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <Dialog.Close aria-label="Close interest form" className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200"><X size={17} /></Dialog.Close>
      {interestSent ? <div className="py-4 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600"><CircleCheck size={32} /></span><Dialog.Title className="mt-5 text-2xl font-black">Interest sent.</Dialog.Title><Dialog.Description className="mt-3 leading-relaxed text-stone-500">Your interest is saved for this prototype. No real message was sent.</Dialog.Description><Button onClick={() => setDialogOpen(false)} className="mt-7 w-full">Done</Button></div> :
        <><Dialog.Title className="pr-10 text-2xl font-black">Interested in this item?</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-relaxed text-stone-500">Share a simple way for the seller to respond. This stays local in the prototype.</Dialog.Description>
          <form onSubmit={submitInterest} noValidate className="mt-6 space-y-4">
            <label className="block text-sm font-bold">Your name<input name="buyerName" autoFocus value={interestForm.buyerName} onChange={event => setInterestForm(current => ({ ...current, buyerName: event.target.value }))} placeholder="Aye Aye" className="mt-2 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" /></label>
            <label className="block text-sm font-bold">Contact method<input name="contact" value={interestForm.contact} onChange={event => setInterestForm(current => ({ ...current, contact: event.target.value }))} placeholder="Phone, Viber username, or email" className="mt-2 w-full rounded-xl border border-stone-200 p-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" /></label>
            <label className="block text-sm font-bold">Message<textarea name="message" value={interestForm.message} onChange={event => setInterestForm(current => ({ ...current, message: event.target.value }))} rows={3} className="mt-2 w-full resize-none rounded-xl border border-stone-200 p-3 font-normal outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-50" /></label>
            {interestError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{interestError}</p>}
            <Button type="submit" className="w-full py-3.5">Send interest <ArrowRight size={17} /></Button>
          </form>
        </>}
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </main>
}

function DescriptionBlocks({ listing }: { listing: Listing }) {
  return <>
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-extrabold">About this item</h2><p className="mt-4 leading-relaxed text-stone-600">{listing.description}</p></section>
    <TrustPassport analysis={listing} trustScore={listing.trustScore} sellerNoteProvided={Boolean(listing.sellerNote)} />
  </>
}

function Footer() {
  return <footer className="border-t border-stone-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8"><Logo /><p className="text-xs text-stone-400">Built for a more circular Myanmar · Hackathon prototype</p></div></footer>
}

function App() {
  return <BrowserRouter><div className="min-h-screen"><Header /><Routes><Route path="/" element={<HomePage />} /><Route path="/sell" element={<SellPage />} /><Route path="/listing/:id" element={<DetailPage />} /><Route path="*" element={<HomePage />} /></Routes><Footer /></div></BrowserRouter>
}
export default App
