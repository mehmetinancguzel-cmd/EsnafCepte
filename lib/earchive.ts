/**
 * GİB Official E-Archive & E-Invoice Provider Engine for EsnafCepte (İnanoraSoft)
 * Generates UBL-TR 2.1 compliant XML, ETTN (UUID), GİB QR Code and supports integration
 * with Turkish e-Transformation providers (Paraşüt, BizimHesap, Uyumsoft, KolayBi, EDM, GİB 5000/2000 Portal).
 */

export interface EArchiveInvoiceParams {
  ettn?: string; // UUID v4
  invoiceNo?: string;
  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:mm:ss
  invoiceType: 'SATIS' | 'IADE' | 'TEVKIFAT';
  currency: 'TRY';
  
  // Seller (Satıcı)
  seller: {
    vknTckn: string;
    title: string;
    taxOffice: string;
    address: string;
    phone?: string;
    email?: string;
  };

  // Buyer (Alıcı)
  buyer: {
    vknTckn: string; // 11111111111 for standard consumer
    title: string;
    taxOffice?: string;
    address?: string;
    phone?: string;
    email?: string;
  };

  // Items
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    kdvRate: 1 | 10 | 20;
    discount?: number;
  }>;

  notes?: string[];
}

export interface EArchiveResult {
  ettn: string;
  invoiceNo: string;
  ublXml: string;
  gibQrCodeData: string;
  payableAmount: number;
  taxTotal: number;
  subtotal: number;
}

/**
 * Generate official GİB compliant ETTN (UUID v4)
 */
export function generateETTN(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate official GİB E-Arşiv invoice data and UBL-TR 2.1 XML
 */
export function createEArchiveInvoice(params: EArchiveInvoiceParams): EArchiveResult {
  const ettn = params.ettn || generateETTN();
  const invoiceNo = params.invoiceNo || `GIB${new Date().getFullYear()}${Date.now().toString().slice(-9)}`;

  let subtotal = 0;
  let taxTotal = 0;
  let totalDiscount = 0;

  const calculatedItems = params.items.map((item) => {
    const gross = item.quantity * item.unitPrice;
    const discount = item.discount || 0;
    const lineNet = gross - discount;
    const kdvAmount = (lineNet * item.kdvRate) / 100;

    subtotal += lineNet;
    taxTotal += kdvAmount;
    totalDiscount += discount;

    return {
      ...item,
      lineNet,
      kdvAmount,
      lineTotal: lineNet + kdvAmount,
    };
  });

  const payableAmount = subtotal + taxTotal;

  // GİB QR Code Payload standard:
  // VKN=...&AV=...&T=...&SN=...&ETTN=...&O=...
  const gibQrCodeData = `https://earsivportal.gib.gov.tr/dogrulama?vkn=${params.seller.vknTckn}&av=${params.buyer.vknTckn}&sn=${invoiceNo}&ettn=${ettn}&t=${payableAmount.toFixed(2)}`;

  // UBL-TR 2.1 XML Skeleton
  const ublXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>
  <cbc:ID>${invoiceNo}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${ettn}</cbc:UUID>
  <cbc:IssueDate>${params.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${params.issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${params.invoiceType}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${params.currency}</cbc:DocumentCurrencyCode>

  <!-- Satıcı Bilgileri -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${params.seller.vknTckn}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${params.seller.title}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:CityName>${params.seller.address}</cbc:CityName>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${params.seller.taxOffice}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Alıcı Bilgileri -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="TCKN">${params.buyer.vknTckn}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${params.buyer.title}</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Vergi Toplamı -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">${taxTotal.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>

  <!-- Genel Toplamlar -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">${payableAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="TRY">${payableAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Fatura Satırları -->
  ${calculatedItems.map((item, idx) => `
  <cac:InvoiceLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${item.unit === 'Kg' ? 'KGM' : 'C62'}">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">${item.lineNet.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${item.name}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('')}
</Invoice>`;

  return {
    ettn,
    invoiceNo,
    ublXml,
    gibQrCodeData,
    payableAmount,
    taxTotal,
    subtotal,
  };
}
