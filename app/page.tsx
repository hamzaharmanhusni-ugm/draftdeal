"use client";

import { useMemo, useState } from "react";
import { computeRoi, formatRupiah, formatMonths } from "@/lib/roi";

type Inputs = {
  vendorName: string;
  clientName: string;
  clientIndustry: string;
  problem: string;
  currentProcess: string;
  hoursSavedPerMonth: string;
  hourlyRate: string;
  subscriptionReplaced: string;
  investment: string;
  monthlyRetainer: string;
};

type Paket = {
  nama: string;
  untukSiapa: string;
  fitur: string[];
  catatan: string;
  rekomendasi: boolean;
};

type Proposal = {
  judulSolusi: string;
  ringkasanEksekutif: string;
  konteksKlien: string;
  masalahUtama: string[];
  tujuanManfaat: { tujuan: string; manfaat: string }[];
  pengantarSolusi: string;
  komponen: { nama: string; deskripsi: string; fungsi: string[] }[];
  ruangLingkup: { termasuk: string[]; tidakTermasuk: string[] };
  paket: Paket[];
  penutup: string;
};

// Contoh dummy generik, bukan data nyata. Tinggal diganti.
const DUMMY: Inputs = {
  vendorName: "Studio Otomasi",
  clientName: "PT Roti Senja",
  clientIndustry: "F&B / bakery",
  problem:
    "Laporan penjualan harian masih direkap manual dari beberapa cabang, sering telat dan rawan salah hitung.",
  currentProcess:
    "Tiap kasir kirim foto struk ke WA grup, admin rekap ke Excel tiap malam, owner baru lihat angkanya besok pagi.",
  hoursSavedPerMonth: "60",
  hourlyRate: "40000",
  subscriptionReplaced: "600000",
  investment: "15000000",
  monthlyRetainer: "1000000",
};

const n = (s: string) => {
  const v = Number(String(s).replace(/[^\d.-]/g, ""));
  return Number.isFinite(v) ? v : 0;
};

export default function Page() {
  const [inp, setInp] = useState<Inputs>(DUMMY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [copied, setCopied] = useState(false);

  const roi = useMemo(
    () =>
      computeRoi({
        hoursSavedPerMonth: n(inp.hoursSavedPerMonth),
        hourlyRate: n(inp.hourlyRate),
        subscriptionReplaced: n(inp.subscriptionReplaced),
        investment: n(inp.investment),
        monthlyRetainer: n(inp.monthlyRetainer),
      }),
    [inp],
  );

  const set = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInp((prev) => ({ ...prev, [k]: e.target.value }));

  async function generate() {
    setLoading(true);
    setError(null);
    setProposal(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inp),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat proposal.");
      } else {
        setProposal(data.proposal as Proposal);
      }
    } catch {
      setError("Tidak bisa menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  function copyProposal() {
    if (!proposal) return;
    navigator.clipboard.writeText(proposalToText(proposal, roi, inp)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      <header className="site-header">
        <div className="inner">
          <span className="wordmark">
            Draft<span className="accent">Deal</span>
          </span>
          <span className="tagline">Draft proposal + ROI dalam menit</span>
        </div>
      </header>

      <main className="shell">
        {/* ---------- FORM ---------- */}
        <section className="form-col">
          <div className="card">
            <h2>Isi data discovery</h2>
            <p className="hint">Isi seadanya hasil ngobrol dengan calon klien. ROI dihitung langsung di bawah.</p>

            <div className="group-title">Tentang klien</div>
            <TextField label="Nama penyedia jasa (kamu)" value={inp.vendorName} onChange={set("vendorName")} />
            <TextField label="Nama klien" value={inp.clientName} onChange={set("clientName")} />
            <TextField label="Industri klien" value={inp.clientIndustry} onChange={set("clientIndustry")} />
            <AreaField label="Masalah / pain klien" value={inp.problem} onChange={set("problem")} />
            <AreaField label="Cara kerja manual sekarang" value={inp.currentProcess} onChange={set("currentProcess")} />

            <div className="group-title">Angka untuk ROI</div>
            <NumField label="Jam kerja dihemat" unit="jam / bulan" value={inp.hoursSavedPerMonth} onChange={set("hoursSavedPerMonth")} />
            <NumField label="Biaya per jam orang" unit="Rp / jam" value={inp.hourlyRate} onChange={set("hourlyRate")} />
            <NumField label="Langganan yang digantikan" unit="Rp / bulan" value={inp.subscriptionReplaced} onChange={set("subscriptionReplaced")} />
            <NumField label="Investasi proyek" unit="Rp, sekali bayar" value={inp.investment} onChange={set("investment")} />
            <NumField label="Retainer / maintenance" unit="Rp / bulan" value={inp.monthlyRetainer} onChange={set("monthlyRetainer")} />

            <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><span className="spinner" /> Menyusun proposal...</> : "Buat Proposal"}
            </button>
          </div>
        </section>

        {/* ---------- HASIL ---------- */}
        <section>
          {/* ROI hero */}
          <div className="roi-grid">
            <div className="roi-tile positive">
              <div className="label">Hemat per tahun</div>
              <div className="value">{formatRupiah(roi.annualGrossBenefit)}</div>
            </div>
            <div className={`roi-tile ${roi.roiYear1Pct >= 0 ? "positive" : ""}`}>
              <div className="label">ROI tahun pertama</div>
              <div className="value">{Number.isFinite(roi.roiYear1Pct) ? `${roi.roiYear1Pct.toFixed(0)}%` : "-"}</div>
            </div>
            <div className="roi-tile warning">
              <div className="label">Balik modal</div>
              <div className="value">{formatMonths(roi.paybackMonths)}</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Rincian ROI</h2>
            <p className="hint">
              Berdasar {n(inp.hoursSavedPerMonth)} jam/bulan x {formatRupiah(n(inp.hourlyRate))}/jam. Semua angka dihitung di kode, bukan dikarang.
            </p>
            <table className="breakdown">
              <tbody>
                <Row label="Manfaat waktu (per bulan)" value={formatRupiah(roi.monthlyTimeSaving)} />
                <Row label="Manfaat langganan digantikan (per bulan)" value={formatRupiah(roi.monthlySubscriptionSaving)} />
                <Row label="Manfaat kotor (per bulan)" value={formatRupiah(roi.monthlyGrossBenefit)} />
                <Row label="Manfaat kotor (per tahun)" value={formatRupiah(roi.annualGrossBenefit)} />
                <Row label="Investasi proyek (sekali bayar)" value={formatRupiah(n(inp.investment))} neg />
                <Row label="Retainer (per tahun)" value={formatRupiah(roi.annualRetainer)} neg />
                <tr className="net">
                  <td>Manfaat bersih tahun pertama</td>
                  <td className={`amount ${roi.year1Net < 0 ? "neg" : ""}`}>{formatRupiah(roi.year1Net)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Proposal */}
          {error && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="banner warn">{error}</div>
            </div>
          )}

          {!proposal && !error && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="empty">Klik <strong>Buat Proposal</strong> untuk menghasilkan draft penawaran + 3 opsi paket.</div>
            </div>
          )}

          {proposal && (
            <div className="card proposal" style={{ marginTop: 16 }}>
              <div className="row-between">
                <h2>{proposal.judulSolusi}</h2>
                <button className="btn btn-ghost" onClick={copyProposal}>{copied ? "Tersalin" : "Salin teks"}</button>
              </div>

              <h3>Ringkasan eksekutif</h3>
              <p>{proposal.ringkasanEksekutif}</p>

              <h3>Latar belakang & kebutuhan</h3>
              <p>{proposal.konteksKlien}</p>

              <h3>Masalah utama</h3>
              <ul>{proposal.masalahUtama.map((m, i) => <li key={i}>{m}</li>)}</ul>

              <h3>Tujuan & manfaat</h3>
              <ul>{proposal.tujuanManfaat.map((t, i) => <li key={i}><strong>{t.tujuan}:</strong> {t.manfaat}</li>)}</ul>

              <h3>Pendekatan solusi</h3>
              <p>{proposal.pengantarSolusi}</p>
              {proposal.komponen.map((k, i) => (
                <div key={i}>
                  <h3>{k.nama}</h3>
                  <p>{k.deskripsi}</p>
                  <ul>{k.fungsi.map((f, j) => <li key={j}>{f}</li>)}</ul>
                </div>
              ))}

              <h3>Ruang lingkup</h3>
              <div className="subgrid">
                <div>
                  <strong>Termasuk</strong>
                  <ul>{proposal.ruangLingkup.termasuk.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                  <strong>Tidak termasuk</strong>
                  <ul>{proposal.ruangLingkup.tidakTermasuk.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              </div>

              <h3 style={{ marginBottom: 12 }}>Opsi paket</h3>
              <div className="tiers">
                {proposal.paket.map((p, i) => (
                  <div key={i} className={`tier ${p.rekomendasi ? "recommended" : ""}`}>
                    {p.rekomendasi && <span className="badge">Direkomendasikan</span>}
                    <h3>{p.nama}</h3>
                    <div className="who">{p.untukSiapa}</div>
                    <ul>{p.fitur.map((f, j) => <li key={j}>{f}</li>)}</ul>
                    <div className="note">{p.catatan}</div>
                  </div>
                ))}
              </div>

              <h3>Penutup</h3>
              <p>{proposal.penutup}</p>

              <p className="hint" style={{ marginTop: 16 }}>
                Ini draft yang dihasilkan AI. Periksa dan poles sebelum dikirim ke klien.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function TextField(props: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      <input type="text" value={props.value} onChange={props.onChange} />
    </div>
  );
}

function AreaField(props: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      <textarea value={props.value} onChange={props.onChange} />
    </div>
  );
}

function NumField(props: { label: string; unit: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="field">
      <label>
        {props.label} <span className="unit">({props.unit})</span>
      </label>
      <input className="num" inputMode="numeric" value={props.value} onChange={props.onChange} />
    </div>
  );
}

function Row(props: { label: string; value: string; neg?: boolean }) {
  return (
    <tr>
      <td>{props.label}</td>
      <td className={`amount ${props.neg ? "neg" : ""}`}>{props.neg ? `- ${props.value}` : props.value}</td>
    </tr>
  );
}

function proposalToText(p: Proposal, roi: ReturnType<typeof computeRoi>, inp: Inputs): string {
  const lines: string[] = [];
  lines.push(p.judulSolusi.toUpperCase(), "");
  lines.push("RINGKASAN EKSEKUTIF", p.ringkasanEksekutif, "");
  lines.push("LATAR BELAKANG & KEBUTUHAN", p.konteksKlien, "");
  lines.push("MASALAH UTAMA", ...p.masalahUtama.map((m) => `- ${m}`), "");
  lines.push("TUJUAN & MANFAAT", ...p.tujuanManfaat.map((t) => `- ${t.tujuan}: ${t.manfaat}`), "");
  lines.push("PENDEKATAN SOLUSI", p.pengantarSolusi, "");
  for (const k of p.komponen) {
    lines.push(k.nama, k.deskripsi, ...k.fungsi.map((f) => `- ${f}`), "");
  }
  lines.push("RUANG LINGKUP");
  lines.push("Termasuk:", ...p.ruangLingkup.termasuk.map((s) => `- ${s}`));
  lines.push("Tidak termasuk:", ...p.ruangLingkup.tidakTermasuk.map((s) => `- ${s}`), "");
  lines.push("RINGKASAN ROI");
  lines.push(`- Manfaat kotor per tahun: ${formatRupiah(roi.annualGrossBenefit)}`);
  lines.push(`- ROI tahun pertama: ${roi.roiYear1Pct.toFixed(0)}%`);
  lines.push(`- Balik modal: ${formatMonths(roi.paybackMonths)}`, "");
  lines.push("OPSI PAKET");
  for (const pk of p.paket) {
    lines.push(`${pk.nama}${pk.rekomendasi ? " (Direkomendasikan)" : ""} (${pk.untukSiapa})`);
    lines.push(...pk.fitur.map((f) => `  - ${f}`));
    lines.push(`  ${pk.catatan}`, "");
  }
  lines.push("PENUTUP", p.penutup);
  return lines.join("\n");
}
