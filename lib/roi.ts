// Hitungan ROI deterministik. Angka uang TIDAK dikarang model: semua hitungan
// ada di sini supaya bisa diaudit, model bahasa cuma menulis prosanya.
// Metodologi sederhana: manfaat bulanan = jam kerja yang dihemat x tarif per jam
// + langganan yang bisa digantikan. Lalu balik modal & ROI tahun pertama.

export type RoiInput = {
  hoursSavedPerMonth: number; // jam kerja manual yang dihemat per bulan
  hourlyRate: number; // biaya per jam orang yang mengerjakan (Rp)
  subscriptionReplaced: number; // langganan/alat per bulan yang digantikan (Rp), 0 kalau tidak ada
  investment: number; // biaya proyek sekali bayar (Rp)
  monthlyRetainer: number; // biaya berlangganan/maintenance per bulan ke penyedia (Rp)
};

export type RoiResult = {
  monthlyTimeSaving: number;
  monthlySubscriptionSaving: number;
  monthlyGrossBenefit: number;
  annualGrossBenefit: number;
  annualRetainer: number;
  year1Net: number; // manfaat bersih tahun-1 setelah dikurangi investasi + retainer setahun
  roiYear1Pct: number; // persen
  paybackMonths: number; // bulan balik modal atas manfaat kotor bulanan
};

const nonNeg = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function computeRoi(input: RoiInput): RoiResult {
  const monthlyTimeSaving = nonNeg(input.hoursSavedPerMonth) * nonNeg(input.hourlyRate);
  const monthlySubscriptionSaving = nonNeg(input.subscriptionReplaced);
  const monthlyGrossBenefit = monthlyTimeSaving + monthlySubscriptionSaving;
  const annualGrossBenefit = monthlyGrossBenefit * 12;
  const annualRetainer = nonNeg(input.monthlyRetainer) * 12;
  const investment = nonNeg(input.investment);
  const year1Net = annualGrossBenefit - investment - annualRetainer;
  const roiYear1Pct = investment > 0 ? (year1Net / investment) * 100 : 0;
  const paybackMonths = monthlyGrossBenefit > 0 ? investment / monthlyGrossBenefit : Infinity;

  return {
    monthlyTimeSaving,
    monthlySubscriptionSaving,
    monthlyGrossBenefit,
    annualGrossBenefit,
    annualRetainer,
    year1Net,
    roiYear1Pct,
    paybackMonths,
  };
}

export function formatRupiah(n: number): string {
  if (!Number.isFinite(n)) return "-";
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function formatMonths(n: number): string {
  if (!Number.isFinite(n)) return "belum balik modal dari penghematan saja";
  return n < 1 ? "kurang dari 1 bulan" : `${n.toFixed(1)} bulan`;
}
