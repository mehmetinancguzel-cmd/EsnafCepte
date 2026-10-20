/**
 * Barkodlu Terazi (EAN-13 Ağırlıklı Barkod) Çözümleyici
 * Türkiye'deki manav, kasap, şarküteri, kuruyemiş vb. terazi sistemleri standart
 * 27, 28 veya 29 ile başlayan 13 haneli EAN-13 barkod üretir.
 * 
 * Standart Format:
 * [2X] [PPPPP] [GGGGG] [C]
 * - 2X: Terazi Öneki (27, 28 veya 29)
 * - PPPPP: 5 haneli Ürün (PLU) Kodu
 * - GGGGG: 5 haneli Ağırlık (Gram cinsinden, örn: 01450 = 1.450 kg) veya Tutar (Kuruş cinsinden)
 * - C: EAN-13 Kontrol Hanesi
 */

export interface ParsedScaleBarcode {
  isScale: boolean;
  prefix?: string;
  itemCode?: string; // 5 haneli ürün kodu
  numericCode?: number; // Sayısal ürün kodu
  weightKg?: number; // Kilogram cinsinden ağırlık (örn: 1.25)
  weightGram?: number; // Gram cinsinden ağırlık (örn: 1250)
  rawAmount?: number;
  rawBarcode: string;
}

export function parseScaleBarcode(rawInput: string): ParsedScaleBarcode {
  const barcode = (rawInput || '').trim();

  // 13 haneli ve 27, 28, 29 ile başlıyorsa terazi barkodudur
  if (barcode.length === 13 && /^(27|28|29)/.test(barcode) && /^\d+$/.test(barcode)) {
    const prefix = barcode.substring(0, 2);
    const itemCode = barcode.substring(2, 7); // 5 hane
    const weightOrAmountStr = barcode.substring(7, 12); // 5 hane
    const weightGram = parseInt(weightOrAmountStr, 10);
    const weightKg = parseFloat((weightGram / 1000).toFixed(3));
    const numericCode = parseInt(itemCode, 10);

    return {
      isScale: true,
      prefix,
      itemCode,
      numericCode,
      weightKg: weightKg > 0 ? weightKg : 1,
      weightGram,
      rawAmount: weightGram,
      rawBarcode: barcode,
    };
  }

  return {
    isScale: false,
    rawBarcode: barcode,
  };
}
