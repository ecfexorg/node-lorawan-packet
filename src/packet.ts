export const enum MType {
  JOIN_REQUEST,
  JOIN_ACCEPT,
  UNCONFIRMED_DATA_UP,
  Unconfirmed_Data_Down,
  CONFIRMED_DATA_UP,
  CONFIRMED_DATA_DOWN,
  RFU,
  PROPRIETARY
}

/**
 * LoraPacket class.
 */
export class LoraPacket {
  MHDR: number
  MACPayload: Buffer
  MIC: Buffer
  FHDR: Buffer
  FPort: number
  FRMPayload: Buffer
  DevAddr: Buffer
  FCtrl: number
  FCnt: Buffer
  FOpts: Buffer
  constructor(PHYPayload: Buffer) {
    // Parse PHYPayload
    this.MHDR = PHYPayload[0] // PHYPayload.slice(0, 1)
    this.MACPayload = PHYPayload.slice(1, -4)
    this.MIC = PHYPayload.slice(-4)

    // Parse FHDR
    this.DevAddr = Buffer.from([...this.MACPayload.slice(0, 4).reverse()]) // 小端转大端
    this.FCtrl = this.MACPayload[4] // this.MACPayload.slice(4, 5)
    this.FCnt = Buffer.from([...this.MACPayload.slice(5, 7).reverse()]) // 小端转大端
    this.FOpts = this.MACPayload.slice(7, 7 + this.getFOptsLen())

    // Parse MACPayload
    this.FHDR = this.MACPayload.slice(0, 7 + this.getFOptsLen())
    if (this.FHDR.length < this.MACPayload.length) {
      this.FPort = this.MACPayload[this.FHDR.length]// this.MACPayload.slice(this.FHDR.length, this.FHDR.length + 1)
      this.FRMPayload = this.MACPayload.slice(this.FHDR.length + 1)
    }
  }

  getMType(): MType {
    return this.MHDR >> 5
  }
  getMajor() {
    return this.MHDR & 0x03
  }
  getADR() {
    return this.FCtrl >> 7
  }
  getADRACKReq() {
    return this.FCtrl >> 6 & 0x01
  }
  getACK() {
    return this.FCtrl >> 5 & 0x01
  }
  /**
   * For downlink frames
   */
  getFPending() {
    return this.FCtrl >> 4 & 0x01
  }
  getFOptsLen() {
    return this.FCtrl & 0x0f
  }
}
