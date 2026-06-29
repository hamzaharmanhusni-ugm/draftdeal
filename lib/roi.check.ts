// Self-check kalkulasi ROI. Jalankan: npm run check
import assert from "node:assert";
import { computeRoi, formatRupiah } from "./roi";

// Kasus contoh netral: hemat 22 jam/bulan @ Rp 68.200, ganti langganan Rp 2jt/bulan,
// proyek Rp 30jt, retainer Rp 2,5jt/bulan.
const r = computeRoi({
  hoursSavedPerMonth: 22,
  hourlyRate: 68_200,
  subscriptionReplaced: 2_000_000,
  investment: 30_000_000,
  monthlyRetainer: 2_500_000,
});

assert.strictEqual(r.monthlyTimeSaving, 1_500_400, "manfaat waktu/bulan salah");
assert.strictEqual(r.monthlyGrossBenefit, 3_500_400, "manfaat kotor/bulan salah");
assert.strictEqual(r.annualGrossBenefit, 42_004_800, "manfaat kotor/tahun salah");
assert.strictEqual(r.annualRetainer, 30_000_000, "retainer/tahun salah");
assert.strictEqual(r.year1Net, 42_004_800 - 30_000_000 - 30_000_000, "net tahun-1 salah");
assert.ok(Math.abs(r.paybackMonths - 30_000_000 / 3_500_400) < 1e-6, "payback salah");

// Input negatif/kosong tidak boleh bikin NaN atau angka negatif liar.
const zero = computeRoi({
  hoursSavedPerMonth: -5,
  hourlyRate: 0,
  subscriptionReplaced: 0,
  investment: 0,
  monthlyRetainer: 0,
});
assert.strictEqual(zero.monthlyGrossBenefit, 0, "input kosong harus 0");
assert.strictEqual(zero.roiYear1Pct, 0, "ROI tanpa investasi harus 0, bukan NaN");
assert.strictEqual(zero.paybackMonths, Infinity, "tanpa manfaat, payback Infinity");

console.log("OK semua self-check ROI lolos.");
console.log("Contoh: manfaat kotor/bulan =", formatRupiah(r.monthlyGrossBenefit));
