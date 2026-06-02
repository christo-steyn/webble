(() => {
  const els = {
    svcUuid: document.getElementById('svcUuid'),
    ctrlUuid: document.getElementById('ctrlUuid'),
    dataUuid: document.getElementById('dataUuid'),
    btnConnect: document.getElementById('btnConnect'),
    btnDisconnect: document.getElementById('btnDisconnect'),
    fileInput: document.getElementById('fileInput'),
    chunkSize: document.getElementById('chunkSize'),
    fastMode: document.getElementById('fastMode'),
    btnStart: document.getElementById('btnStart'),
    btnAbort: document.getElementById('btnAbort'),
    progress: document.getElementById('progress'),
    status: document.getElementById('status'),
    log: document.getElementById('log'),
    hwRev: document.getElementById('hwRev'),
    swRev: document.getElementById('swRev'),
    crcOut: document.getElementById('crcOut'),
    xferOut: document.getElementById('xferOut'),
  };

  let device, server, service, ctrlChar, dataChar;
  let totalSize = 0, sentSize = 0;

  function setStatus(text) { els.status.textContent = text; }
  function log(msg) {
    const p = document.createElement('div');
    p.textContent = msg;
    els.log.prepend(p);
  }
  function setConnectedUI(connected) {
    els.btnConnect.disabled = connected;
    els.btnDisconnect.disabled = !connected;
    els.btnStart.disabled = !connected || !els.fileInput.files[0];
    els.btnAbort.disabled = !connected;
  }
  function updateProgress(val) {
    els.progress.value = val;
  }
  function setXfer(received, expected) {
    els.xferOut.value = `${received} / ${expected} bytes`;
  }

  function crc32(buf) {
    // buf: Uint8Array
    let crc = 0xFFFFFFFF >>> 0;
    for (let i = 0; i < buf.length; i++) {
      let c = (crc ^ buf[i]) & 0xFF;
      for (let k = 0; k < 8; k++) {
        const mask = -(c & 1);
        c = (c >>> 1) ^ (0xEDB88320 & mask);
      }
      crc = (crc >>> 8) ^ c;
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  async function connect() {
    try {
      setStatus('Requesting device…');
      device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [els.svcUuid.value] }],
        optionalServices: [els.svcUuid.value, 0x180A]
      });
      device.addEventListener('gattserverdisconnected', onDisconnected);
      setStatus('Connecting…');
      server = await device.gatt.connect();
      service = await server.getPrimaryService(els.svcUuid.value);
      ctrlChar = await service.getCharacteristic(els.ctrlUuid.value);
      dataChar = await service.getCharacteristic(els.dataUuid.value);
      await ctrlChar.startNotifications();
      ctrlChar.addEventListener('characteristicvaluechanged', onCtrlNotify);
      log('Notifications enabled on control characteristic');

      // Initial status read (prefill progress/state before notifications arrive)
      try {
        const rv = await ctrlChar.readValue();
        const st0 = parseStatusView(new DataView(rv.buffer));
        totalSize = st0.expected || 0;
        sentSize = st0.received || 0;
        updateProgress(totalSize ? Math.round((sentSize / totalSize) * 100) : 0);
        setXfer(sentSize, totalSize);
        if (st0.state === 1) setStatus('OTA in progress');
        else if (st0.state === 2) setStatus('Completed');
        else if (st0.state === 3) setStatus('Error');
        else setStatus('Idle');
        log(`Initial status: state=${st0.state} received=${st0.received}/${st0.expected}`);
      } catch (e) {
        log('Initial status read failed: ' + e.message);
      }
      // Read DIS (0x180A): HW (0x2A27) and SW (0x2A28)
      try {
        const dis = await server.getPrimaryService(0x180A);
        const hwc = await dis.getCharacteristic(0x2A27);
        const swc = await dis.getCharacteristic(0x2A28);
        const hwv = await hwc.readValue();
        const swv = await swc.readValue();
        els.hwRev.value = new TextDecoder().decode(new Uint8Array(hwv.buffer));
        els.swRev.value = new TextDecoder().decode(new Uint8Array(swv.buffer));
        log('Device Info read: HW=' + els.hwRev.value + ' SW=' + els.swRev.value);
      } catch (e) {
        try {
          const dis = await server.getPrimaryService('device_information');
          const hwc = await dis.getCharacteristic(0x2A27);
          const swc = await dis.getCharacteristic(0x2A28);
          const hwv = await hwc.readValue();
          const swv = await swc.readValue();
          els.hwRev.value = new TextDecoder().decode(new Uint8Array(hwv.buffer));
          els.swRev.value = new TextDecoder().decode(new Uint8Array(swv.buffer));
          log('Device Info read: HW=' + els.hwRev.value + ' SW=' + els.swRev.value);
        } catch (e2) {
          log('DIS read failed: ' + (e2.message || e.message));
        }
      }
      setConnectedUI(true);
      setStatus('Connected');
      log('Connected to ' + device.name);
    } catch (e) {
      setStatus('Error: ' + e.message);
      log('Connect error: ' + e.stack);
    }
  }

  function onDisconnected() {
    setConnectedUI(false);
    setStatus('Disconnected');
  }

  function parseStatusView(dv) {
    // state (u8), received (u32 le), expected (u32 le), text...
    const state = dv.getUint8(0);
    const received = dv.getUint32(1, true);
    const expected = dv.getUint32(5, true);
    const totalLen = dv.byteLength || dv.buffer.byteLength;
    const textLen = Math.max(0, totalLen - 9);
    const textBytes = textLen ? new Uint8Array(dv.buffer, dv.byteOffset + 9, textLen) : new Uint8Array();
    const text = textLen ? new TextDecoder().decode(textBytes) : '';
    return { state, received, expected, text };
  }

  function onCtrlNotify(e) {
    const val = e.target.value;
    const dv = val instanceof DataView ? val : new DataView(val.buffer);
    const st = parseStatusView(dv);
    if (st.expected) totalSize = st.expected;
    sentSize = st.received;
    const pct = totalSize ? Math.round((sentSize / totalSize) * 100) : 0;
    updateProgress(pct);
    setXfer(sentSize, totalSize);
    log(`Status: state=${st.state} received=${st.received}/${st.expected} ${st.text || ''}`);
    if (st.state === 2) {
      setStatus('Completed');
      log('OTA completed. Device may reboot shortly.');
    } else if (st.state === 3) {
      setStatus('Error');
      log('OTA error: ' + (st.text || ''));
    }
  }

  async function startOTA() {
    const file = els.fileInput.files[0];
    if (!file) return;
    // Read entire file to compute CRC32 and send in START
    const ab = await file.arrayBuffer();
    const all = new Uint8Array(ab);
    totalSize = all.length;
    const crc = crc32(all);
    els.crcOut.value = '0x' + crc.toString(16).padStart(8, '0');
    sentSize = 0;
    updateProgress(0);
    setStatus('Starting OTA…');
    // START opcode 0x01 + size (u32 le) + crc32 (u32 le)
    const startBuf = new Uint8Array(9);
    startBuf[0] = 0x01;
    const dv = new DataView(startBuf.buffer);
    dv.setUint32(1, totalSize, true);
    dv.setUint32(5, crc, true);
    await ctrlChar.writeValue(startBuf);

    // chunked writes from the preloaded buffer
    const chunk = parseInt(els.chunkSize.value, 10) || 180;
    for (let off = 0; off < all.length; off += chunk) {
      const slice = all.subarray(off, Math.min(off + chunk, all.length));
      await dataChar.writeValueWithoutResponse(slice);
      sentSize += slice.length;
      const pct = Math.round((sentSize / totalSize) * 100);
      updateProgress(pct);
      setXfer(sentSize, totalSize);
      
      // Long pause every 256KB to let device catch up with flash writes
      const bytesInto256KB = sentSize % 262144;
      if (bytesInto256KB < chunk && sentSize > chunk) {
        log(`Pausing at ${sentSize} bytes to let device catch up...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      // Short pause every 10 chunks for connection keepalive
      else if ((off / chunk) % 10 === 0 && off > 0) {
        // Fast mode: 25ms, Slow mode: 50ms
        const pauseDuration = els.fastMode.checked ? 25 : 50;
        await new Promise(resolve => setTimeout(resolve, pauseDuration));
      }
    }

    // END opcode 0x02
    await ctrlChar.writeValue(Uint8Array.of(0x02));
    setStatus('Finalizing…');
  }

  async function abortOTA() {
    try {
      await ctrlChar.writeValue(Uint8Array.of(0x03));
      setStatus('Aborted');
    } catch (e) {
      log('Abort error: ' + e.message);
    }
  }

  async function disconnect() {
    try {
      if (device && device.gatt.connected) device.gatt.disconnect();
    } catch {}
    setConnectedUI(false);
  }

  els.btnConnect.addEventListener('click', connect);
  els.btnDisconnect.addEventListener('click', disconnect);
  els.btnStart.addEventListener('click', startOTA);
  els.btnAbort.addEventListener('click', abortOTA);
  els.fileInput.addEventListener('change', () => {
    els.btnStart.disabled = !(device && device.gatt.connected) || !els.fileInput.files[0];
    const file = els.fileInput.files[0];
    if (file) {
      file.arrayBuffer().then(ab => {
        const crc = crc32(new Uint8Array(ab));
        els.crcOut.value = '0x' + crc.toString(16).padStart(8, '0');
        log('Computed CRC32 for selected file: ' + els.crcOut.value);
        totalSize = ab.byteLength;
        sentSize = 0;
        updateProgress(0);
        setXfer(0, totalSize);
      }).catch(() => {
        els.crcOut.value = '';
        log('Failed to compute CRC32');
        setXfer(0, 0);
      });
    } else {
      els.crcOut.value = '';
      setXfer(0, 0);
    }
  });
})();
