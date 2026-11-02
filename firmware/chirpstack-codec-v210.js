// ChirpStack codec for TSF LoRaWAN nodes, firmware up to V210 (older firmware decodes too)
// (firmware version = payload byte 1, decoded as obj.version).
// V209 adds: section 11 uplink reason, section 12 reset cause, section 10 phone location,
// config section 109 pulseEnabled; section 5 pulses only sent when enabled.
// V210: tilt section 3 accel/gyro rescaled (no more overflow); chosen by the version byte.
// Older firmware decodes fine too: it just never sends the new sections.
//
// CODEC_VERSION = "<firmware version>.<revision>", reported as codec_version in every decoded
// uplink so you can see which codec ChirpStack runs (no codec_version = older than 210.0).
// Bump the revision on ANY change to this file; release.ps1 sets "<N>.0" for a new firmware N.
const CODEC_VERSION = '210.0';

function decodeUplink(input) {
  function int16BE(h, l) {
    let val = (h << 8) | l;
    if (val & 0x8000) val = val - 0x10000;
    return val;
  }
  function pulse32(HH, HL, LH, LL) {
    return (HH << 24) | (HL << 16) | (LH << 8) | LL;
  }
  function u16BE(h, l) {
    return ((h << 8) | l) & 0xFFFF;
  }
  function hexFrom(bytes, count) {
    let s = '';
    for (let k = 0; k < count; k++) {
      s += bytes[k].toString(16).padStart(2, '0');
    }
    return s;
  }

  // Band names mapping (indexes match device firmware)
  const BAND_NAMES = [
    'EU868','US915','EU433','AU915','CN500','AS923','AS923_2','AS923_3','AS923_4','KR920','IN865'
  ];

  let bytes = input.bytes;
  let i = 0;
  let obj = {};

  obj.codec_version = CODEC_VERSION;
  obj.header = bytes[i++];
  obj.version = bytes[i++];

  // Configuration snapshot on fPort 101
  if (input && input.fPort === 101) {
    while (i < bytes.length) {
      const sid = bytes[i++];
      switch (sid) {
        case 100: {
          const bandIndex = bytes[i++];
          const subBand = bytes[i++];
          obj.bandIndex = bandIndex;
          obj.band = BAND_NAMES[bandIndex] || 'UNKNOWN';
          obj.subBand = subBand;
          break;
        }
        case 101: {
          const dev = bytes.slice(i, i + 8); i += 8;
          const join = bytes.slice(i, i + 8); i += 8;
          obj.devEUI = hexFrom(dev, 8);
          obj.joinEUI = hexFrom(join, 8);
          break;
        }
        case 102: {
          const iv = u16BE(bytes[i++], bytes[i++]);
          obj.interval = iv;
          obj.tiltEnabled = !!bytes[i++];
          obj.enableBMP = !!bytes[i++];
          obj.enableMPU = !!bytes[i++];
          break;
        }
        case 103: {
          obj.chargerEnabled = !!bytes[i++];
          obj.chargingEnabled = !!bytes[i++];
          obj.batteryType = bytes[i++];
          obj.batterySizeMah = u16BE(bytes[i++], bytes[i++]);
          obj.battAdcEnabled = !!bytes[i++];
          break;
        }
        case 104: {
          obj.vwModuleType = bytes[i++];
          obj.vw1Enabled = !!bytes[i++];
          obj.vw2Enabled = !!bytes[i++];
          obj.vw3Enabled = !!bytes[i++];
          obj.vw4Enabled = !!bytes[i++];
          obj.vwNumReadings = u16BE(bytes[i++], bytes[i++]);
          break;
        }
        case 105: {
          obj.v420Enabled = !!bytes[i++];
          obj.v420NumReadings = u16BE(bytes[i++], bytes[i++]);
          obj.v012vEnabled = !!bytes[i++];
          obj.v012vNumReadings = u16BE(bytes[i++], bytes[i++]);
          break;
        }
        case 106: {
          obj.modbusmodEnabled = !!bytes[i++];
          obj.modbusmodBaudrate = pulse32(bytes[i++], bytes[i++], bytes[i++], bytes[i++]);
          obj.modbusmodRegAddress = u16BE(bytes[i++], bytes[i++]);
          obj.modbusmodRegType = bytes[i++];
          break;
        }
        case 107: {
          obj.strainGaugeEnabled = !!bytes[i++];
          obj.strainGaugeNumReadings = u16BE(bytes[i++], bytes[i++]);
          break;
        }
        case 108: {
          obj.sen0313Enabled = !!bytes[i++];
          break;
        }
        case 109: {
          obj.pulseEnabled = !!bytes[i++];
          break;
        }
        default: {
          // Unknown section id; bail out to avoid desync
          i = bytes.length;
          break;
        }
      }
    }
    return { data: obj };
  }

  // Measurement payload: parse dynamic sequence of section IDs until end
  while (i < bytes.length) {
    const sid = bytes[i++];
    switch (sid) {
      case 1: { // Battery
        obj.battery_percent = bytes[i++];
        obj.battery_voltage = int16BE(bytes[i++], bytes[i++]) / 100.0;
        break;
      }
      case 2: { // BMP
        obj.temperature = int16BE(bytes[i++], bytes[i++]) / 100.0;
        obj.pressure = pulse32(bytes[i++], bytes[i++], bytes[i++], bytes[i++]);
        break;
      }
      case 3: { // Tilt: ax..az in mg, gx..gz in mdps
        // V210+: accel sent as mg x10, gyro as dps x10. Up to V209: both x100,
        // which wrapped beyond +-327.67 (pitch/roll were always correct).
        const v210 = obj.version >= 210;
        const accel = () => int16BE(bytes[i++], bytes[i++]) / (v210 ? 10.0 : 100.0);
        const gyro = () => int16BE(bytes[i++], bytes[i++]) * (v210 ? 100 : 0.01);
        obj.ax = accel();
        obj.ay = accel();
        obj.az = accel();
        obj.gx = gyro();
        obj.gy = gyro();
        obj.gz = gyro();
        obj.pitch = pulse32(bytes[i++], bytes[i++], bytes[i++], bytes[i++]) / 10000.0;
        obj.roll = pulse32(bytes[i++], bytes[i++], bytes[i++], bytes[i++]) / 10000.0;
        break;
      }
      case 41: { // VW1
        obj.tempvw1 = int16BE(bytes[i++], bytes[i++]) / 100.0;
        obj.freqvw1 = int16BE(bytes[i++], bytes[i++]) / 10.0;
        break;
      }
      case 42: { // VW2
        obj.tempvw2 = int16BE(bytes[i++], bytes[i++]) / 100.0;
        obj.freqvw2 = int16BE(bytes[i++], bytes[i++]) / 10.0;
        break;
      }
      case 43: { // VW3
        obj.tempvw3 = int16BE(bytes[i++], bytes[i++]) / 100.0;
        obj.freqvw3 = int16BE(bytes[i++], bytes[i++]) / 10.0;
        break;
      }
      case 44: { // VW4
        obj.tempvw4 = int16BE(bytes[i++], bytes[i++]) / 100.0;
        obj.freqvw4 = int16BE(bytes[i++], bytes[i++]) / 10.0;
        break;
      }
      case 5: { // Pulse
        obj.pulse_count = pulse32(bytes[i++], bytes[i++], bytes[i++], bytes[i++]);
        break;
      }
      case 6: { // Strain
        obj.strain = pulse32(bytes[i++], bytes[i++], bytes[i++], bytes[i++]) / 100.0;
        break;
      }
      case 7: { // Analog V2: 0–12V
        obj.v012v = int16BE(bytes[i++], bytes[i++]) / 100.0;
        break;
      }
      case 8: { // Analog V2: 4–20mA
        obj.v420 = int16BE(bytes[i++], bytes[i++]) / 100.0;
        break;
      }
      case 9: { // SEN0313 distance
        obj.sen0313_distance = pulse32(bytes[i++], bytes[i++], bytes[i++], bytes[i++]) / 100.0;
        break;
      }
      case 11: { // Why the uplink was sent
        const REASONS = ['reset', 'timer', 'button', 'motion', 'pulses', 'after_ble'];
        obj.uplink_reason_id = bytes[i++];
        obj.uplink_reason = REASONS[obj.uplink_reason_id] || 'unknown';
        break;
      }
      case 12: { // Reset cause, only on reset uplinks (ESP-IDF esp_reset_reason_t)
        const CAUSES = ['unknown', 'power_on', 'external', 'software', 'panic', 'int_watchdog',
          'task_watchdog', 'watchdog', 'deep_sleep', 'brownout', 'sdio', 'usb', 'jtag',
          'efuse', 'power_glitch', 'cpu_lockup'];
        obj.reset_cause_id = bytes[i++];
        obj.reset_cause = CAUSES[obj.reset_cause_id] || 'unknown';
        break;
      }
      case 10: { // Location from the phone used for the last BLE session
        obj.latitude = pulse32(bytes[i++], bytes[i++], bytes[i++], bytes[i++]) / 1e6;
        obj.longitude = pulse32(bytes[i++], bytes[i++], bytes[i++], bytes[i++]) / 1e6;
        obj.location_accuracy_m = u16BE(bytes[i++], bytes[i++]);
        break;
      }
      default: {
        // Unknown section id: stop parsing to prevent desync
        i = bytes.length;
        break;
      }
    }
  }

  return { data: obj };
}