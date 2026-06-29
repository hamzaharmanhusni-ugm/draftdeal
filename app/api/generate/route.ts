import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { computeRoi, formatRupiah, formatMonths, type RoiInput } from "@/lib/roi";

// Beri ruang untuk panggilan model.
export const maxDuration = 60;

const ProposalSchema = z.object({
  judulSolusi: z.string().describe("Judul solusi ringkas, tanpa nama produk pihak ketiga"),
  ringkasanEksekutif: z.string().describe("3 sampai 5 kalimat, jual hasil, sebut angka ROI yang diberikan"),
  konteksKlien: z.string().describe("Satu paragraf latar bisnis klien dan kebutuhannya"),
  masalahUtama: z.array(z.string()).min(3).max(6).describe("Daftar masalah konkret klien"),
  tujuanManfaat: z
    .array(z.object({ tujuan: z.string(), manfaat: z.string() }))
    .min(3)
    .max(5),
  pengantarSolusi: z.string().describe("Satu paragraf garis besar pendekatan"),
  komponen: z
    .array(z.object({ nama: z.string(), deskripsi: z.string(), fungsi: z.array(z.string()).min(2).max(5) }))
    .min(2)
    .max(5),
  ruangLingkup: z.object({
    termasuk: z.array(z.string()).min(3),
    tidakTermasuk: z.array(z.string()).min(2),
  }),
  paket: z
    .array(
      z.object({
        nama: z.string(),
        untukSiapa: z.string(),
        fitur: z.array(z.string()).min(4).max(7),
        catatan: z.string().describe("Catatan harga/scope singkat"),
        rekomendasi: z.boolean(),
      }),
    )
    .length(3)
    .describe("Tepat 3 paket berjenjang. Tepat satu paket (yang tengah) rekomendasi: true"),
  penutup: z.string(),
});

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body permintaan tidak valid." }, { status: 400 });
  }

  const roiInput: RoiInput = {
    hoursSavedPerMonth: num(body.hoursSavedPerMonth),
    hourlyRate: num(body.hourlyRate),
    subscriptionReplaced: num(body.subscriptionReplaced),
    investment: num(body.investment),
    monthlyRetainer: num(body.monthlyRetainer),
  };
  const roi = computeRoi(roiInput);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY belum dipasang. ROI tetap bisa dihitung, tapi proposal butuh API key." },
      { status: 400 },
    );
  }

  const vendorName = String(body.vendorName || "Penyedia jasa").trim();
  const clientName = String(body.clientName || "calon klien").trim();
  const clientIndustry = String(body.clientIndustry || "").trim();
  const problem = String(body.problem || "").trim();
  const currentProcess = String(body.currentProcess || "").trim();

  // Angka ROI sudah final dari kode. Claude DILARANG menghitung ulang.
  const angkaRoi = [
    `Manfaat waktu per bulan: ${formatRupiah(roi.monthlyTimeSaving)}`,
    `Manfaat dari langganan yang digantikan per bulan: ${formatRupiah(roi.monthlySubscriptionSaving)}`,
    `Total manfaat kotor per bulan: ${formatRupiah(roi.monthlyGrossBenefit)}`,
    `Total manfaat kotor per tahun: ${formatRupiah(roi.annualGrossBenefit)}`,
    `Investasi proyek (sekali bayar): ${formatRupiah(roiInput.investment)}`,
    `Retainer per tahun: ${formatRupiah(roi.annualRetainer)}`,
    `Manfaat bersih tahun pertama: ${formatRupiah(roi.year1Net)}`,
    `ROI tahun pertama: ${roi.roiYear1Pct.toFixed(0)}%`,
    `Perkiraan balik modal: ${formatMonths(roi.paybackMonths)}`,
  ].join("\n");

  const system = [
    "Kamu konsultan solusi yang menulis draft proposal jasa dalam Bahasa Indonesia.",
    "Tulis dalam bahasa bisnis yang jelas dan jual hasil, bukan daftar fitur teknis.",
    "Bahasa harus natural seperti ditulis manusia. Dilarang memakai tanda em dash atau en dash; pakai koma, titik, atau tanda kurung.",
    "PENTING: angka ROI sudah final dan diberikan kepadamu. Jangan menghitung, mengubah, atau mengarang angka uang apa pun. Pakai angka yang diberikan apa adanya.",
    "Filosofi paket: kalau klien butuh lebih murah, potong ruang lingkup, bukan kualitas. Buat 3 paket berjenjang; paket tengah jadi rekomendasi (rekomendasi: true).",
    "Output harus berupa draft yang siap diedit manusia, bukan dokumen final.",
  ].join(" ");

  const prompt = [
    `Penyedia jasa: ${vendorName}`,
    `Klien: ${clientName}${clientIndustry ? ` (industri: ${clientIndustry})` : ""}`,
    problem ? `Masalah/pain klien: ${problem}` : "",
    currentProcess ? `Cara kerja manual sekarang: ${currentProcess}` : "",
    "",
    "Angka ROI final (pakai apa adanya, jangan diubah):",
    angkaRoi,
    "",
    "Susun draft proposal lengkap sesuai skema. Di ringkasan eksekutif, sebut manfaat per tahun dan ROI tahun pertama dari angka di atas. Komponen solusi diturunkan dari masalah klien. Tiga paket berjenjang dari ramping ke lengkap, paket tengah ditandai rekomendasi.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { object } = await generateObject({
      model: anthropic(process.env.MODEL || "claude-sonnet-4-6"),
      schema: ProposalSchema,
      system,
      prompt,
    });
    return Response.json({ roi, proposal: object });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat proposal.";
    return Response.json({ error: `Gagal memanggil model: ${msg}` }, { status: 500 });
  }
}
