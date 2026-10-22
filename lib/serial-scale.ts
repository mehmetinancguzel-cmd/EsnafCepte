/**
 * Physical RS-232 / USB Serial Scale Driver for EsnafCepte (İnanoraSoft)
 * Uses the Web Serial API to read real-time weight from electronic scales
 * (CAS, Dibal, Baster, TEM, Mettler-Toledo).
 */

export interface ScaleReading {
  weightKg: number;
  isStable: boolean;
  unit: string;
  raw: string;
}

export type ScaleType = 'CAS' | 'DIBAL' | 'TEM' | 'GENERIC_ASCII';

export class SerialScaleDriver {
  private port: any = null;
  private reader: any = null;
  private isReading = false;
  private onWeightCallback: ((reading: ScaleReading) => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;
  private buffer = '';

  /**
   * Check if Web Serial API is supported in current browser
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Request user to pick a serial port and connect
   */
  async connect(baudRate: number = 9600, scaleType: ScaleType = 'CAS'): Promise<boolean> {
    if (!SerialScaleDriver.isSupported()) {
      throw new Error('Web Serial API bu tarayıcıda desteklenmiyor (Chrome / Edge önerilir).');
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      });

      this.isReading = true;
      this.startReadingLoop(scaleType);
      return true;
    } catch (err: any) {
      if (this.onErrorCallback) this.onErrorCallback(err.message || 'Porta bağlanılamadı');
      return false;
    }
  }

  /**
   * Continuous read loop from RS-232 / COM port
   */
  private async startReadingLoop(scaleType: ScaleType) {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.isReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.buffer += value;
          this.processBuffer(scaleType);
        }
      }
    } catch (err: any) {
      if (this.onErrorCallback) this.onErrorCallback(err.message || 'Okuma hatası');
    } finally {
      if (this.reader) {
        this.reader.releaseLock();
      }
    }
  }

  /**
   * Parse continuous weight frames from buffer
   */
  private processBuffer(scaleType: ScaleType) {
    // Frames typically end with \r\n or \n
    const lines = this.buffer.split(/[\r\n]+/);
    // Keep last partial fragment in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const reading = this.parseScaleFrame(trimmed, scaleType);
      if (reading && this.onWeightCallback) {
        this.onWeightCallback(reading);
      }
    }
  }

  /**
   * Scale protocol parsers
   */
  private parseScaleFrame(frame: string, scaleType: ScaleType): ScaleReading | null {
    // 1. CAS Format (e.g. "ST,GS,+001.250kg" or "US,GS,+001.250kg")
    if (frame.includes('GS') || scaleType === 'CAS') {
      const isStable = frame.startsWith('ST');
      // Match decimal weight
      const match = frame.match(/([+-]?\d+\.?\d*)\s*(kg|g)?/i);
      if (match) {
        let weight = parseFloat(match[1]);
        if (match[2]?.toLowerCase() === 'g') weight /= 1000;
        return {
          weightKg: Math.max(0, weight),
          isStable,
          unit: 'KG',
          raw: frame,
        };
      }
    }

    // 2. Generic ASCII / TEM / Dibal Format (e.g. "  1.250 kg" or "W:+01.250")
    const genericMatch = frame.match(/([+-]?\d+\.\d{2,3})/);
    if (genericMatch) {
      const weight = parseFloat(genericMatch[1]);
      return {
        weightKg: Math.max(0, weight),
        isStable: !frame.includes('US'),
        unit: 'KG',
        raw: frame,
      };
    }

    return null;
  }

  /**
   * Listen for weight updates
   */
  onWeight(cb: (reading: ScaleReading) => void) {
    this.onWeightCallback = cb;
  }

  onError(cb: (err: string) => void) {
    this.onErrorCallback = cb;
  }

  /**
   * Disconnect and release port
   */
  async disconnect() {
    this.isReading = false;
    try {
      if (this.reader) await this.reader.cancel();
      if (this.port) await this.port.close();
    } catch {}
    this.port = null;
    this.reader = null;
  }
}
