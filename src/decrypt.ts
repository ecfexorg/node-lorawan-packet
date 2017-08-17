import { createCipheriv } from 'crypto'
import { LoraPacket, MType } from './packet'

const aes128 = (key: Buffer, data: Buffer, iv: Buffer) => {
  const cipher = createCipheriv('aes128', key, iv)
  return Buffer.concat([
    cipher.update(data),
    cipher.final()
  ])
}

const buildAi = (packet: LoraPacket, i: number) => {
  let direction: number = null
  switch (packet.getMType()) {
    case MType.UNCONFIRMED_DATA_UP:
    case MType.CONFIRMED_DATA_UP:
      direction = 0x00
      break
    case MType.Unconfirmed_Data_Down:
    case MType.CONFIRMED_DATA_DOWN:
      direction = 0x01
      break
    case MType.JOIN_REQUEST:
    case MType.JOIN_ACCEPT:
    case MType.RFU:
    case MType.PROPRIETARY:
      throw new Error('Direction neither "up" nor "down"')
  }
  return Buffer.from([
    0x01, 0x00, 0x00, 0x00, 0x00,
    direction,
    ...packet.DevAddr.reverse(),
    ...packet.FCnt.reverse(), 0x00, 0x00,
    0x00,
    i
  ])
}

/**
 * @param packet {LoraPacket} LoraPacket Object.
 * @param NwkSKey {Buffer} NwkSKey.
 * @param AppSKey {Buffer} AppSKey.
 */
export const decrypt = (packet: LoraPacket, NwkSKey: Buffer, AppSKey: Buffer) => {
  const k = Math.ceil(packet.FRMPayload.length / 16)
  const sArr: Buffer[] = []
  for (let i = 1; i <= k; i++)
    sArr.push(aes128(packet.FPort ? AppSKey : NwkSKey, buildAi(packet, i), Buffer.alloc(16)))

  const s = Buffer.concat(sArr)
  const result = Buffer.alloc(packet.FRMPayload.length)

  for (let i = 0; i < result.length; i++) {
    result[i] = packet.FRMPayload[i] ^ s[i]
  }
  return result
}
