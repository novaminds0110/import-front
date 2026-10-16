import React, { useState, useEffect } from 'react';

// Frontend-only redesign. Existing backend URL, endpoints, payloads and calculations are preserved.
const API_BASE = 'http://localhost:5000/api';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

function MetricCard({ label, value, detail, icon, accent = 'emerald' }) {
  const accents = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ring-1 ${accents[accent] || accents.emerald}`} aria-hidden="true">{icon}</div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>}
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Field({ label, children }) {
  return <div className="min-w-0"><label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>{children}</div>;
}

const inputClass = 'mt-0 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';
const tableHeadClass = 'whitespace-nowrap bg-slate-50/90 px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500';
const tableCellClass = 'whitespace-nowrap border-t border-slate-100 px-5 py-4 text-sm text-slate-600';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [stocks, setStocks] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states intentionally kept identical to the original frontend.
  const [stockForm, setStockForm] = useState({
    commodity: 'Toor Dal Fatka',
    originCity: '',
    bags: '',
    batchRef: '',
    purchasePrice: '',
  });

  const [dispatchForm, setDispatchForm] = useState({
    inventoryId: '',
    clientName: '',
    destinationCity: '',
    bags: '',
    sellingPrice: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/dashboard`);
      const data = await res.json();
      setStocks(data.stocks || []);
      setDispatches(data.dispatches || []);
      if (data.stocks && data.stocks.length > 0 && !dispatchForm.inventoryId) {
        setDispatchForm((prev) => ({ ...prev, inventoryId: data.stocks[0].id }));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/stock/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockForm),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setStockForm({ commodity: 'Toor Dal Fatka', originCity: '', bags: '', batchRef: '', purchasePrice: '' });
      loadData();
      alert('Stock consignment successfully registered!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatchForm),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setDispatchForm((prev) => ({ ...prev, clientName: '', destinationCity: '', bags: '', sellingPrice: '' }));
      loadData();
      alert('Dispatch order processed and billed!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Existing dashboard calculations preserved.
  const totalStockBags = stocks.reduce((acc, s) => acc + Number(s.available_bags || 0), 0);
  const totalInventoryValuation = stocks.reduce((acc, s) => acc + (Number(s.available_bags || 0) * Number(s.purchase_price_per_bag || 0)), 0);
  const totalBilledSales = dispatches.reduce((acc, d) => acc + Number(d.total_amount || 0), 0);
  const totalGrossMargin = dispatches.reduce((acc, d) => {
    const buyPrice = Number(d.inventory?.purchase_price_per_bag || 0);
    const sellPrice = Number(d.selling_price_per_bag || 0);
    return acc + ((sellPrice - buyPrice) * Number(d.bags_sent || 0));
  }, 0);

  const goTo = (page) => {
    setCurrentPage(page);
    if (page === 'dashboard') loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => goTo('landing')} className="group flex items-center gap-3 text-left" aria-label="AgriTrade home">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-sm font-black tracking-tight text-white shadow-lg shadow-emerald-700/20 transition group-hover:rotate-3">AG</span>
            <span><span className="block text-lg font-black tracking-tight text-slate-950">AgriTrade</span><span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Trade & logistics portal</span></span>
          </button>
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
            <button onClick={() => goTo('landing')} className={`rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${currentPage === 'landing' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Overview</button>
            <button onClick={() => goTo('dashboard')} className={`rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${currentPage === 'dashboard' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-900'}`}>Workspace <span className="hidden sm:inline">↗</span></button>
          </div>
        </div>
      </nav>

      {currentPage === 'landing' && <>
        <main>
          <section className="relative isolate overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50">
            <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-36 -left-20 -z-10 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Wholesale trade, made clearer</div>
                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">Move commodities with <span className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">clarity and control.</span></h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Manage procurement, warehouse stock, multi-city dispatches, and sales margins from one streamlined trade workspace.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button onClick={() => goTo('dashboard')} className="inline-flex items-center justify-center gap-3 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-700">Enter trade workspace <span aria-hidden="true">→</span></button>
                  <button onClick={() => { loadData(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white">↻ Refresh live metrics</button>
                </div>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500"><span>✓ Inventory visibility</span><span>✓ Dispatch tracking</span><span>✓ Margin insights</span></div>
              </div>
              <div className="relative mx-auto w-full max-w-lg">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-emerald-200/60 to-sky-200/60 blur-2xl" />
                <div className="relative rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-7">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Trade overview</p><h3 className="mt-1 text-lg font-extrabold text-slate-900">Your operations at a glance</h3></div><span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">LIVE DATA</span></div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-4"><span className="text-xl">📦</span><p className="mt-4 text-xs font-semibold text-emerald-800/70">Available stock</p><p className="mt-1 text-2xl font-black text-emerald-900">{totalStockBags.toLocaleString()} <span className="text-xs font-semibold">bags</span></p></div>
                    <div className="rounded-2xl bg-sky-50 p-4"><span className="text-xl">🧾</span><p className="mt-4 text-xs font-semibold text-sky-800/70">Billed sales</p><p className="mt-1 text-xl font-black text-sky-900">{money(totalBilledSales)}</p></div>
                    <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">Inventory valuation</p><p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{money(totalInventoryValuation)}</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-xl">📊</div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" /></div><p className="mt-2 text-[11px] text-slate-400">Monitor stock value and realized margin in one place.</p></div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-950 p-4 text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-lg">🚚</span><div><p className="text-sm font-bold">From procurement to delivery</p><p className="mt-1 text-xs text-slate-400">A single workspace for your trade operations.</p></div></div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Live performance</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">Your trade numbers</h2></div><p className="text-xs text-slate-500">Calculated from your existing dashboard data</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Ready stock" value={totalStockBags.toLocaleString()} detail="Bags available in warehouse" icon="📦" accent="emerald" />
              <MetricCard label="Inventory valuation" value={money(totalInventoryValuation)} detail="Current stock holding value" icon="◈" accent="violet" />
              <MetricCard label="Billed sales" value={money(totalBilledSales)} detail="Total processed dispatches" icon="↗" accent="blue" />
              <MetricCard label="Gross margin" value={money(totalGrossMargin)} detail="Realized across dispatches" icon="％" accent="amber" />
            </div>
          </section>

          <section className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
            <SectionHeading eyebrow="Built for daily operations" title="Everything your trade workflow needs" description="A simpler way to track incoming consignments, coordinate deliveries, and understand profitability." />
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: '📦', color: 'bg-emerald-50 text-emerald-700', title: 'Flexible procurement', body: 'Register consignments from Kalaburagi, Latur, Indore, or any other sourcing location with purchase rates and lot references.' },
                { icon: '🚚', color: 'bg-blue-50 text-blue-700', title: 'Multi-city dispatch', body: 'Allocate partial or full stock to wholesale buyers and keep destination and quantity details together.' },
                { icon: '📈', color: 'bg-amber-50 text-amber-700', title: 'Margin visibility', body: 'Review invoice totals and gross margin calculated from purchase and selling rates.' },
              ].map((feature) => <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5"><div className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${feature.color}`}>{feature.icon}</div><h3 className="mt-5 text-lg font-extrabold text-slate-900">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{feature.body}</p></article>)}
            </div>
          </section>
        </main>
        <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>© {new Date().getFullYear()} AgriTrade Portal</span><span>Procurement · Inventory · Dispatch · Billing</span></div></footer>
      </>}

      {currentPage === 'dashboard' && <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Operations workspace</div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">Trade center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Manage inward batches, review inventory, process dispatches, and keep billing in view.</p></div><button onClick={loadData} disabled={loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60">{loading ? <><span className="animate-spin">◌</span> Refreshing…</> : <>↻ Refresh data</>}</button></div>
        </div>

        <div className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Available commodity" value={totalStockBags.toLocaleString()} detail="Bags ready for dispatch" icon="📦" accent="emerald" />
          <MetricCard label="Stock holding value" value={money(totalInventoryValuation)} detail="Value of available inventory" icon="◈" accent="violet" />
          <MetricCard label="Invoiced sales" value={money(totalBilledSales)} detail="Total billed dispatches" icon="↗" accent="blue" />
          <MetricCard label="Realized margin" value={money(totalGrossMargin)} detail="Calculated gross margin" icon="％" accent="amber" />
        </div>

        <SectionHeading eyebrow="Manage your workflow" title="Procurement & dispatch" description="Use the forms below to record incoming stock and process outgoing orders." />
        <div className="mb-10 grid items-start gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">＋</span><div><h3 className="text-lg font-extrabold text-slate-950">Add inward consignment</h3><p className="mt-1 text-xs text-slate-500">Register newly procured stock</p></div></div>
            <form onSubmit={handleStockSubmit} className="space-y-5">
              <Field label="Origin mandi / city"><input className={inputClass} placeholder="e.g. Kalaburagi, Latur, Indore" value={stockForm.originCity} onChange={(e) => setStockForm({ ...stockForm, originCity: e.target.value })} required /></Field>
              <Field label="Commodity specification"><input className={inputClass} placeholder="e.g. Toor Dal Fatka" value={stockForm.commodity} onChange={(e) => setStockForm({ ...stockForm, commodity: e.target.value })} required /></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Total bags"><input className={inputClass} type="number" min="1" placeholder="500" value={stockForm.bags} onChange={(e) => setStockForm({ ...stockForm, bags: e.target.value })} required /></Field><Field label="Buy price / bag (₹)"><input className={inputClass} type="number" min="0" step="0.01" placeholder="6500" value={stockForm.purchasePrice} onChange={(e) => setStockForm({ ...stockForm, purchasePrice: e.target.value })} required /></Field></div>
              <Field label="Consignment / lot reference"><input className={inputClass} placeholder="e.g. LOT-01 / TRUCK-44" value={stockForm.batchRef} onChange={(e) => setStockForm({ ...stockForm, batchRef: e.target.value })} /></Field>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-700/15 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20">Confirm & deposit stock <span>→</span></button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-700">↗</span><div><h3 className="text-lg font-extrabold text-slate-950">Dispatch & generate bill</h3><p className="mt-1 text-xs text-slate-500">Allocate stock to a buyer</p></div></div>
            <form onSubmit={handleDispatchSubmit} className="space-y-5">
              <Field label="Select active source lot"><select className={inputClass} value={dispatchForm.inventoryId} onChange={(e) => setDispatchForm({ ...dispatchForm, inventoryId: e.target.value })} required><option value="" disabled>Select origin batch</option>{stocks.map((s) => <option key={s.id} value={s.id}>{s.origin_city} ({s.commodity}) — {s.available_bags} bags (Cost: ₹{s.purchase_price_per_bag})</option>)}</select></Field>
              <Field label="Client / buyer business"><input className={inputClass} placeholder="e.g. Delhi Traders, Kashmir Wholesalers" value={dispatchForm.clientName} onChange={(e) => setDispatchForm({ ...dispatchForm, clientName: e.target.value })} required /></Field>
              <Field label="Destination delivery city"><input className={inputClass} placeholder="e.g. Delhi, Bangalore, Srinagar" value={dispatchForm.destinationCity} onChange={(e) => setDispatchForm({ ...dispatchForm, destinationCity: e.target.value })} required /></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Bags to send"><input className={inputClass} type="number" min="1" placeholder="25" value={dispatchForm.bags} onChange={(e) => setDispatchForm({ ...dispatchForm, bags: e.target.value })} required /></Field><Field label="Sell rate / bag (₹)"><input className={inputClass} type="number" min="0" step="0.01" placeholder="7100" value={dispatchForm.sellingPrice} onChange={(e) => setDispatchForm({ ...dispatchForm, sellingPrice: e.target.value })} required /></Field></div>
              <button type="submit" disabled={stocks.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-700/15 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">Process dispatch & invoice <span>→</span></button>
              {stocks.length === 0 && <p className="text-xs text-amber-700">Add an inward consignment before processing a dispatch.</p>}
            </form>
          </section>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h3 className="font-extrabold text-slate-950">Active inventory & stored lots</h3><p className="mt-1 text-xs text-slate-500">Current available stock by source and commodity</p></div><span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">{stocks.length} {stocks.length === 1 ? 'lot' : 'lots'}</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left"><thead><tr><th className={tableHeadClass}>Origin / reference</th><th className={tableHeadClass}>Commodity</th><th className={tableHeadClass}>Buy rate / bag</th><th className={tableHeadClass}>Available</th><th className={tableHeadClass}>Lot valuation</th></tr></thead><tbody>{stocks.length === 0 ? <tr><td colSpan="5" className="px-5 py-12 text-center"><div className="text-2xl">📦</div><p className="mt-2 text-sm font-bold text-slate-700">No active stock lots found</p><p className="mt-1 text-xs text-slate-400">Add a consignment to see it listed here.</p></td> : stocks.map((s) => <tr key={s.id} className="transition hover:bg-slate-50/80"><td className={`${tableCellClass} font-bold text-slate-800`}>{s.origin_city}{s.batch_ref && <span className="ml-2 text-xs font-medium text-slate-400">({s.batch_ref})</span>}</td><td className={tableCellClass}>{s.commodity}</td><td className={tableCellClass}>{money(s.purchase_price_per_bag)}</td><td className={tableCellClass}><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">{s.available_bags} bags</span></td><td className={`${tableCellClass} font-extrabold text-slate-900`}>{money(Number(s.available_bags) * Number(s.purchase_price_per_bag))}</td></tr>)}</tbody></table></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h3 className="font-extrabold text-slate-950">Sales ledger & client billing</h3><p className="mt-1 text-xs text-slate-500">Processed dispatches, invoice totals, and margin</p></div><span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{dispatches.length} {dispatches.length === 1 ? 'dispatch' : 'dispatches'}</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[950px] border-collapse text-left"><thead><tr><th className={tableHeadClass}>Buyer client</th><th className={tableHeadClass}>Destination</th><th className={tableHeadClass}>Source</th><th className={tableHeadClass}>Quantity</th><th className={tableHeadClass}>Sale rate</th><th className={tableHeadClass}>Invoice total</th><th className={tableHeadClass}>Margin</th></tr></thead><tbody>{dispatches.length === 0 ? <tr><td colSpan="7" className="px-5 py-12 text-center"><div className="text-2xl">🧾</div><p className="mt-2 text-sm font-bold text-slate-700">No dispatch records yet</p><p className="mt-1 text-xs text-slate-400">Processed dispatches will appear here.</p></td></tr> : dispatches.map((d) => { const buyPrice = Number(d.inventory?.purchase_price_per_bag || 0); const sellPrice = Number(d.selling_price_per_bag || 0); const profit = (sellPrice - buyPrice) * Number(d.bags_sent || 0); return <tr key={d.id} className="transition hover:bg-slate-50/80"><td className={`${tableCellClass} font-bold text-slate-800`}>{d.client_name}</td><td className={tableCellClass}>{d.destination_city}</td><td className={tableCellClass}>{d.inventory?.origin_city || '—'}</td><td className={tableCellClass}>{d.bags_sent} bags</td><td className={tableCellClass}>{money(sellPrice)}</td><td className={`${tableCellClass} font-extrabold text-slate-900`}>{money(d.total_amount)}</td><td className={`${tableCellClass} font-extrabold ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{profit >= 0 ? `+${money(profit)}` : `-${money(Math.abs(profit))}`}</td></tr>; })}</tbody></table></div>
        </section>
        <footer className="py-8 text-center text-xs text-slate-400">AgriTrade Operations · Inventory and dispatch overview</footer>
      </main>}
    </div>
  );
}
