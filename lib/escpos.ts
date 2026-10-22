/**
 * ESC/POS Thermal Receipt Engine & Hardware Kick Drawer for EsnafCepte (İnanoraSoft)
 * Supports 58mm & 80mm thermal receipt printers via WebUSB, WebBluetooth, Serial or Network Raw.
 */

// Turkish character transliterator & CP857 encoding helper
export function sanitizeTurkishForReceipt(str: string): string {
  const map: Record<string, string> = {
    'ğ': 'g', 'Ğ': 'G',
    'ş': 's', 'Ş': 'S',
    'ı': 'i', 'İ': 'I',
    'ç': 'c', 'Ç': 'C',
    'ö': 'o', 'Ö': 'O',
    'ü': 'u', 'Ü': 'U',
  };
  return str.replace(/[ğĞşŞıİçÇöÖüÜ]/g, m => map[m] || m);
}

export class EscPosBuilder {
  private buffer: number[] = [];
  private widthChars: number; // 32 chars for 58mm, 48 chars for 80mm

  constructor(paperWidth: '58mm' | '80mm' = '80mm') {
    this.widthChars = paperWidth === '58mm' ? 32 : 48;
    this.init();
  }

  /**
   * ESC @ - Initialize printer
   */
  init(): this {
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  /**
   * ESC a n - Select justification (0: left, 1: center, 2: right)
   */
  align(alignment: 'left' | 'center' | 'right'): this {
    const n = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1B, 0x61, n);
    return this;
  }

  /**
   * ESC E n - Turn emphasized (bold) mode on/off
   */
  bold(enable: boolean = true): this {
    this.buffer.push(0x1B, 0x45, enable ? 1 : 0);
    return this;
  }

  /**
   * GS ! n - Select character size
   */
  size(mode: 'normal' | 'double_height' | 'double_width' | 'quad'): this {
    let n = 0x00;
    if (mode === 'double_height') n = 0x01;
    else if (mode === 'double_width') n = 0x10;
    else if (mode === 'quad') n = 0x11;
    this.buffer.push(0x1D, 0x21, n);
    return this;
  }

  /**
   * Append raw text
   */
  text(str: string): this {
    const clean = sanitizeTurkishForReceipt(str);
    for (let i = 0; i < clean.length; i++) {
      this.buffer.push(clean.charCodeAt(i));
    }
    return this;
  }

  /**
   * Append text with line feed (LF)
   */
  line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0A);
    return this;
  }

  /**
   * Print a two-column row aligned left and right (e.g. "Ekmek x2 ......... 20.00 TL")
   */
  row(left: string, right: string): this {
    const cleanLeft = sanitizeTurkishForReceipt(left);
    const cleanRight = sanitizeTurkishForReceipt(right);
    const spaceCount = Math.max(1, this.widthChars - cleanLeft.length - cleanRight.length);
    const rowStr = cleanLeft + ' '.repeat(spaceCount) + cleanRight;
    this.line(rowStr);
    return this;
  }

  /**
   * Print a horizontal divider line
   */
  divider(char: string = '-'): this {
    this.line(char.repeat(this.widthChars));
    return this;
  }

  /**
   * Feed n lines
   */
  feed(lines: number = 2): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  /**
   * ESC p m t1 t2 - Kick Cash Drawer (Çekmeceyi Fırlat)
   * Sends pulse to open cash drawer connected to RJ11/RJ12 drawer port on printer.
   */
  openDrawer(): this {
    // 0x1B, 0x70, 0x00, 0x19, 0xFA (Pin 2 / 25ms on, 250ms off)
    this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
    return this;
  }

  /**
   * GS V m - Cut paper (0: Full cut, 1: Partial cut)
   */
  cut(partial: boolean = true): this {
    this.feed(3);
    this.buffer.push(0x1D, 0x56, partial ? 0x01 : 0x00);
    return this;
  }

  /**
   * Return byte buffer as Uint8Array
   */
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Generate full ESC/POS receipt for a sale
 */
export function buildSaleReceiptBytes(params: {
  storeName: string;
  phone?: string;
  address?: string;
  saleCode: string;
  items: Array<{ name: string; quantity: number; unit_price: number; total_price: number; variant?: string }>;
  totalAmount: number;
  discount?: number;
  paymentMethod: 'NAKIT' | 'KREDI_KARTI' | 'VERESIYE';
  customerName?: string;
  dateStr?: string;
  paperWidth?: '58mm' | '80mm';
  autoDrawer?: boolean;
}): Uint8Array {
  const paper = params.paperWidth || '80mm';
  const builder = new EscPosBuilder(paper);

  // 1. Kick cash drawer immediately on cash sales if requested
  if (params.autoDrawer && params.paymentMethod === 'NAKIT') {
    builder.openDrawer();
  }

  // 2. Store Header
  builder.align('center')
    .size('double_height')
    .bold(true)
    .line(params.storeName)
    .size('normal')
    .bold(false);

  if (params.address) builder.line(params.address);
  if (params.phone) builder.line(`Tel: ${params.phone}`);
  
  builder.line('EsnafCepte Perakende Satis Fisi')
    .divider('=')
    .align('left');

  // 3. Metadata
  const now = params.dateStr || new Date().toLocaleString('tr-TR');
  builder.row('Tarih:', now);
  builder.row('Fis No:', params.saleCode);
  builder.row('Odeme Turu:', params.paymentMethod === 'NAKIT' ? 'NAKIT KASA' : params.paymentMethod === 'KREDI_KARTI' ? 'KREDI KARTI (POS)' : 'VERESIYE');
  if (params.customerName) {
    builder.row('Musteri:', params.customerName);
  }

  builder.divider('-');

  // 4. Items Table
  builder.bold(true);
  builder.row('Urun / Hizmet', 'Tutar');
  builder.bold(false);
  builder.divider('-');

  for (const item of params.items) {
    const itemLabel = `${item.name}${item.variant ? ` (${item.variant})` : ''}`;
    const qtyPrice = `${item.quantity} x ${item.unit_price.toFixed(2)} TL`;
    builder.line(itemLabel);
    builder.row(`  ${qtyPrice}`, `${item.total_price.toFixed(2)} TL`);
  }

  builder.divider('=');

  // 5. Totals
  const subtotal = params.totalAmount + (params.discount || 0);
  if (params.discount && params.discount > 0) {
    builder.row('Ara Toplam:', `${subtotal.toFixed(2)} TL`);
    builder.row('Uygulanan Indirim:', `-${params.discount.toFixed(2)} TL`);
  }

  builder.size('double_height')
    .bold(true)
    .row('TOPLAM TUTAR:', `${params.totalAmount.toFixed(2)} TL`)
    .size('normal')
    .bold(false);

  builder.divider('-');

  // 6. Footer
  builder.align('center')
    .feed(1)
    .line('Mali degeri yoktur. Bilgi fisidir.')
    .line('Bizi tercih ettiginiz icin tesekkur ederiz!')
    .line('EsnafCepte - InanoraSoft')
    .feed(2)
    .cut(true);

  return builder.build();
}

/**
 * WebUSB Direct Printing Driver (Works in Chrome, Edge, Opera)
 */
export async function printDirectWebUsb(receiptBytes: Uint8Array): Promise<{ success: boolean; message: string }> {
  if (typeof navigator === 'undefined' || !(navigator as any).usb) {
    return { success: false, message: 'WebUSB bu tarayıcıda desteklenmiyor (Chrome / Edge kullanın).' };
  }

  try {
    const device = await (navigator as any).usb.requestDevice({
      filters: [] // Allow user to select any connected USB printer
    });

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    await device.claimInterface(0);

    // Find OUT endpoint
    const endpoint = device.configuration.interfaces[0].alternate.endpoints.find(
      (e: any) => e.direction === 'out'
    );

    if (!endpoint) {
      throw new Error('Yazıcı çıkış kanalı (OUT endpoint) bulunamadı.');
    }

    await device.transferOut(endpoint.endpointNumber, receiptBytes);
    await device.close();

    return { success: true, message: 'Fiş termal yazıcıya başarıyla iletildi.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Yazıcıya bağlanılamadı.' };
  }
}
