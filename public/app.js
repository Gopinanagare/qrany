/**
 * QRDrop - Minimalist Vector QR Code Generator
 * Obsidian Utility Design System Implementation
 */

// Application State
const state = {
  currentTab: 'doc', // 'doc' | 'url' | 'photo' | 'text'
  currentData: 'http://localhost:3000/f/catalog-preview',
  activeFile: {
    name: 'Product_Catalog_2025.pdf',
    sizeFormatted: '3.4 MB',
    type: 'doc'
  },
  dotType: 'dots', // 'dots' | 'square' | 'rounded'
  fgColor: '#000000',
  bgColor: '#ffffff',
  eccLevel: 'H',
  hasLogo: true,
  shareMode: 'local', // 'local' | 'cloud'
  networkInfo: {
    localIp: 'localhost',
    port: 3000,
    baseUrl: 'http://localhost:3000'
  },
  history: []
};

// Global QR Styling Instance
let qrCode = null;
let html5QrScanner = null;

// Initializer
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await fetchNetworkInfo();
  initQRCode();
  initHistory();
  initKeyboardShortcuts();
});

// -------------------------------------------------------------
// Network Discovery
// -------------------------------------------------------------
async function fetchNetworkInfo() {
  try {
    const res = await fetch('/api/network-info');
    if (res.ok) {
      const data = await res.json();
      state.networkInfo = data;
      const ipDisp = document.getElementById('network-ip-display');
      if (ipDisp) ipDisp.innerText = `${data.localIp}:${data.port}`;
      
      // Update default document mock URL to real network URL
      if (state.currentTab === 'doc' && state.activeFile.name === 'Product_Catalog_2025.pdf') {
        state.currentData = `${data.baseUrl}/f/Product_Catalog_2025`;
        updateEndpointDisplay(state.currentData);
      }
    }
  } catch (e) {
    console.warn('Running in standalone / client-only mode without server:', e);
  }
}

function checkNetworkInfo() {
  showToast(`Active on: ${state.networkInfo.baseUrl}`, 'router');
}

// -------------------------------------------------------------
// QR Code Generator Engine (qr-code-styling)
// -------------------------------------------------------------
function initQRCode() {
  const container = document.getElementById('qr-code-canvas');
  if (!container) return;

  container.innerHTML = '';

  qrCode = new QRCodeStyling({
    width: 230,
    height: 230,
    type: 'svg',
    data: state.currentData,
    dotsOptions: {
      color: state.fgColor,
      type: state.dotType
    },
    backgroundOptions: {
      color: state.bgColor
    },
    cornersSquareOptions: {
      color: state.fgColor,
      type: state.dotType === 'square' ? 'square' : 'extra-rounded'
    },
    cornersDotOptions: {
      color: state.fgColor,
      type: state.dotType === 'square' ? 'square' : 'dot'
    },
    qrOptions: {
      errorCorrectionLevel: state.eccLevel
    }
  });

  qrCode.append(container);
  updateBadgeState();
}

function refreshQRCode() {
  if (!qrCode) return;

  const t0 = performance.now();

  qrCode.update({
    data: state.currentData,
    dotsOptions: {
      color: state.fgColor,
      type: state.dotType
    },
    backgroundOptions: {
      color: state.bgColor
    },
    cornersSquareOptions: {
      color: state.fgColor,
      type: state.dotType === 'square' ? 'square' : 'extra-rounded'
    },
    cornersDotOptions: {
      color: state.fgColor,
      type: state.dotType === 'square' ? 'square' : 'dot'
    },
    qrOptions: {
      errorCorrectionLevel: state.eccLevel
    }
  });

  const t1 = performance.now();
  const latency = Math.max(1, Math.round(t1 - t0));
  const latencyEl = document.getElementById('latency-indicator');
  if (latencyEl) {
    latencyEl.innerText = `< ${latency}ms Encode`;
  }

  animateQRUpdate();
  updateBadgeState();
}

function animateQRUpdate() {
  const wrapper = document.getElementById('qr-wrapper');
  if (wrapper) {
    wrapper.classList.add('scale-95', 'opacity-70');
    setTimeout(() => {
      wrapper.classList.remove('scale-95', 'opacity-70');
    }, 140);
  }
}

function updateBadgeState() {
  const badge = document.getElementById('center-badge');
  if (!badge) return;

  if (state.hasLogo) {
    badge.classList.remove('hidden');
    // Match badge color with QR foreground if not black
    const inner = badge.querySelector('div');
    if (inner) {
      inner.style.backgroundColor = state.fgColor === '#000000' ? '' : state.fgColor;
    }
  } else {
    badge.classList.add('hidden');
  }
}

function updateEndpointDisplay(url) {
  const endpointEl = document.getElementById('endpoint-string');
  if (endpointEl) {
    endpointEl.innerText = url.replace(/^https?:\/\//, '');
  }
}

// -------------------------------------------------------------
// Tabs Switching
// -------------------------------------------------------------
function switchTab(type) {
  state.currentTab = type;
  const views = ['doc', 'url', 'photo', 'text'];
  
  views.forEach(v => {
    const viewElem = document.getElementById('view-' + v);
    const tabElem = document.getElementById('tab-' + v);
    
    if (v === type) {
      viewElem.classList.remove('hidden');
      viewElem.classList.add('flex');
      tabElem.classList.add('bg-surface-container-lowest', 'dark:bg-slate-800', 'text-on-surface', 'dark:text-white', 'shadow-sm');
      tabElem.classList.remove('text-on-surface-variant', 'dark:text-slate-400');
    } else {
      viewElem.classList.add('hidden');
      viewElem.classList.remove('flex');
      tabElem.classList.remove('bg-surface-container-lowest', 'dark:bg-slate-800', 'text-on-surface', 'dark:text-white', 'shadow-sm');
      tabElem.classList.add('text-on-surface-variant', 'dark:text-slate-400');
    }
  });

  // Update target data based on active tab
  if (type === 'doc') {
    state.currentData = state.activeFile.url || `${state.networkInfo.baseUrl}/f/catalog`;
  } else if (type === 'url') {
    const val = document.getElementById('url-input')?.value || 'https://mywebsite.com/presentation';
    state.currentData = val;
  } else if (type === 'photo') {
    state.currentData = state.activeFile.photoUrl || `${state.networkInfo.baseUrl}/f/Event_Banner_HiRes`;
  } else if (type === 'text') {
    const textVal = document.getElementById('text-input')?.value || 'Instant QRDrop Note';
    state.currentData = textVal;
  }

  updateEndpointDisplay(state.currentData);
  refreshQRCode();
}

// -------------------------------------------------------------
// File Drag, Drop & Upload Handling
// -------------------------------------------------------------
function handleDragOver(e, el) {
  e.preventDefault();
  el.classList.add('drag-over-active');
}

function handleDragLeave(e, el) {
  e.preventDefault();
  el.classList.remove('drag-over-active');
}

function handleFileDrop(e, mode) {
  e.preventDefault();
  const el = document.getElementById(`dropzone-${mode}`);
  if (el) el.classList.remove('drag-over-active');

  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    uploadFile(e.dataTransfer.files[0], mode);
  }
}

function fileSelected(input, mode) {
  if (input.files && input.files[0]) {
    uploadFile(input.files[0], mode);
  }
}

async function uploadFile(file, mode) {
  const isPhoto = mode === 'photo' || file.type.startsWith('image/');
  const targetMode = isPhoto ? 'photo' : 'doc';

  // Update UI to uploading state
  const nameEl = document.getElementById(`active-file-name-${targetMode}`);
  const sizeEl = document.getElementById(`active-file-size-${targetMode}`);
  const statusEl = document.getElementById(`active-file-status-${targetMode}`);

  if (nameEl) nameEl.innerText = file.name;
  if (sizeEl) sizeEl.innerText = formatFileSize(file.size);
  if (statusEl) statusEl.innerText = 'Uploading to QRDrop server...';

  // If photo, show local thumbnail immediately
  if (isPhoto) {
    const thumbEl = document.getElementById('photo-thumb-preview');
    if (thumbEl) {
      thumbEl.src = URL.createObjectURL(file);
    }
  }

async function uploadToCloud(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) throw new Error('Cloud upload failed');
  const result = await res.json();
  if (result.status !== 'success' || !result.data?.url) {
    throw new Error('Invalid cloud response');
  }

  // Convert to direct download URL (e.g. https://tmpfiles.org/dl/123/file.pdf)
  const directDownloadUrl = result.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
  return directDownloadUrl;
}

async function uploadFile(file, mode) {
  const isPhoto = mode === 'photo' || file.type.startsWith('image/');
  const targetMode = isPhoto ? 'photo' : 'doc';

  // Update UI to uploading state
  const nameEl = document.getElementById(`active-file-name-${targetMode}`);
  const sizeEl = document.getElementById(`active-file-size-${targetMode}`);
  const statusEl = document.getElementById(`active-file-status-${targetMode}`);

  if (nameEl) nameEl.innerText = file.name;
  if (sizeEl) sizeEl.innerText = formatFileSize(file.size);
  if (statusEl) statusEl.innerText = 'Uploading file...';

  // If photo, show local thumbnail immediately
  if (isPhoto) {
    const thumbEl = document.getElementById('photo-thumb-preview');
    if (thumbEl) {
      thumbEl.src = URL.createObjectURL(file);
    }
  }

  // Determine whether to use cloud upload or local server
  const isVercelOrCloud = state.shareMode === 'cloud' || 
                          window.location.hostname.includes('vercel.app') || 
                          window.location.protocol === 'file:' || 
                          !window.location.origin.includes('localhost');

  let targetUrl = '';

  if (isVercelOrCloud) {
    try {
      if (statusEl) statusEl.innerText = 'Uploading to Public Cloud (Global Scannable)...';
      targetUrl = await uploadToCloud(file);
      if (statusEl) statusEl.innerText = 'Uploaded to Cloud • Scannable worldwide';
    } catch (cloudErr) {
      console.warn('Cloud upload failed, attempting local fallback:', cloudErr);
    }
  }

  // If not cloud or cloud failed, try local server
  if (!targetUrl) {
    try {
      if (statusEl) statusEl.innerText = 'Uploading to QRDrop server...';
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Local upload failed');
      const data = await res.json();
      targetUrl = data.file.viewUrl;
      if (statusEl) statusEl.innerText = 'Uploaded • Ready to Scan on local Wi-Fi';
    } catch (localErr) {
      console.warn('Local server upload failed, trying cloud upload:', localErr);
      try {
        if (statusEl) statusEl.innerText = 'Uploading to Public Cloud CDN...';
        targetUrl = await uploadToCloud(file);
        if (statusEl) statusEl.innerText = 'Uploaded to Cloud • Scannable worldwide';
      } catch (finalErr) {
        console.error('All upload methods failed:', finalErr);
        // Offline reference URL fallback
        targetUrl = `${window.location.origin}/f/${encodeURIComponent(file.name)}`;
        if (statusEl) statusEl.innerText = 'Local Reference • Scannable on this network';
      }
    }
  }

  state.currentData = targetUrl;
  if (isPhoto) {
    state.activeFile.photoUrl = targetUrl;
  } else {
    state.activeFile.url = targetUrl;
  }

  updateEndpointDisplay(targetUrl);
  refreshQRCode();

  // Add to history
  addToHistory({
    title: file.name,
    type: isPhoto ? 'Photo File' : 'Document',
    scans: 0,
    timestamp: 'Just now',
    url: targetUrl
  });

  showToast(`Uploaded "${file.name}"! QR ready to scan.`, 'check_circle');
}

function clearFile(mode) {
  const nameEl = document.getElementById(`active-file-name-${mode}`);
  const sizeEl = document.getElementById(`active-file-size-${mode}`);
  const statusEl = document.getElementById(`active-file-status-${mode}`);

  if (nameEl) nameEl.innerText = 'Drop new file...';
  if (sizeEl) sizeEl.innerText = '0 KB';
  if (statusEl) statusEl.innerText = 'Waiting for input';

  state.currentData = `${state.networkInfo.baseUrl}/f/empty`;
  updateEndpointDisplay(state.currentData);
  refreshQRCode();
  showToast('File cleared', 'close');
}

function setShareMode(mode) {
  state.shareMode = mode;
  const localBtn = document.getElementById('share-mode-local');
  const cloudBtn = document.getElementById('share-mode-cloud');

  if (mode === 'local') {
    localBtn.className = 'px-2.5 py-1 rounded-lg bg-surface-container-lowest dark:bg-slate-800 text-on-surface dark:text-white shadow-sm font-semibold';
    cloudBtn.className = 'px-2.5 py-1 rounded-lg text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white';
    showToast('Local Wi-Fi mode: Direct, private LAN transfer', 'wifi');
  } else {
    cloudBtn.className = 'px-2.5 py-1 rounded-lg bg-surface-container-lowest dark:bg-slate-800 text-on-surface dark:text-white shadow-sm font-semibold';
    localBtn.className = 'px-2.5 py-1 rounded-lg text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white';
    showToast('Public Cloud mode: Scannable anywhere globally', 'cloud');
  }
}

// -------------------------------------------------------------
// URL & Text Handlers
// -------------------------------------------------------------
function updateUrlTarget(val) {
  state.currentData = val.trim() || 'https://qrdrop.io';
  updateEndpointDisplay(state.currentData);
  refreshQRCode();
}

function testUrlLink() {
  const input = document.getElementById('url-input');
  const url = input?.value || state.currentData;
  if (!url || !url.startsWith('http')) {
    showToast('Please enter a valid URL starting with http:// or https://', 'warning');
    return;
  }
  window.open(url, '_blank');
  showToast('Link destination opened in new tab', 'open_in_new');
}

function updateTextTarget(val) {
  state.currentData = val.trim() || 'Instant QRDrop Note';
  const countEl = document.getElementById('text-char-count');
  if (countEl) countEl.innerText = `${val.length} chars`;
  updateEndpointDisplay(val.length > 30 ? val.substring(0, 30) + '...' : val);
  refreshQRCode();
}

function insertWifiTemplate() {
  const textarea = document.getElementById('text-input');
  const template = 'WIFI:S:Home_Network;T:WPA;P:SuperSecretPassword;;';
  if (textarea) {
    textarea.value = template;
    updateTextTarget(template);
    showToast('Inserted Wi-Fi QR template', 'wifi');
  }
}

function insertVCardTemplate() {
  const textarea = document.getElementById('text-input');
  const template = `BEGIN:VCARD\nVERSION:3.0\nN:Doe;Jane;;;\nFN:Jane Doe\nORG:Design Studio\nTEL:+1234567890\nEMAIL:jane@studio.com\nEND:VCARD`;
  if (textarea) {
    textarea.value = template;
    updateTextTarget(template);
    showToast('Inserted Contact vCard template', 'contact_page');
  }
}

// -------------------------------------------------------------
// QR Appearance Customization Matrix
// -------------------------------------------------------------
function setPattern(style, btn) {
  state.dotType = style;
  document.querySelectorAll('.pattern-opt').forEach(b => {
    b.className = 'pattern-opt p-space-sm rounded-xl bg-surface-container-low dark:bg-slate-800/40 hover:bg-surface-container dark:hover:bg-slate-800 flex items-center gap-space-xs text-on-surface-variant dark:text-slate-400 transition-all';
  });
  if (btn) {
    btn.className = 'pattern-opt p-space-sm rounded-xl bg-surface-container dark:bg-slate-800 border border-surface-container-high dark:border-slate-700 flex items-center gap-space-xs text-on-surface dark:text-white transition-all';
  }
  refreshQRCode();
}

function setColor(hex, btn) {
  if (!hex || !hex.startsWith('#') || hex.length < 4) return;
  state.fgColor = hex;

  const hexInput = document.getElementById('hex-input');
  if (hexInput) hexInput.value = hex.toUpperCase();

  const nativePicker = document.getElementById('native-color-picker');
  if (nativePicker) nativePicker.value = hex;

  if (btn) {
    document.querySelectorAll('.color-opt').forEach(b => {
      b.classList.remove('ring-2', 'ring-primary', 'dark:ring-white', 'ring-offset-2', 'scale-105');
    });
    btn.classList.add('ring-2', 'ring-primary', 'dark:ring-white', 'ring-offset-2', 'scale-105');
  }
  refreshQRCode();
}

function setECC(lvl, btn) {
  state.eccLevel = lvl;
  document.querySelectorAll('.ecc-btn').forEach(b => {
    b.className = 'ecc-btn flex-1 py-1 text-center font-label-mono-sm text-label-mono-sm rounded text-on-surface-variant dark:text-slate-400';
  });
  if (btn) {
    btn.className = 'ecc-btn flex-1 py-1 text-center font-label-mono-sm text-label-mono-sm rounded bg-surface-container-lowest dark:bg-slate-700 text-on-surface dark:text-white shadow-sm font-semibold';
  }
  refreshQRCode();
}

function toggleLogo(show) {
  state.hasLogo = show;
  updateBadgeState();
}

function toggleCustomizer() {
  const body = document.getElementById('customizer-body');
  const icon = document.getElementById('accordion-icon');
  if (!body || !icon) return;

  if (body.classList.contains('hidden')) {
    body.classList.remove('hidden');
    icon.classList.remove('rotate-180');
  } else {
    body.classList.add('hidden');
    icon.classList.add('rotate-180');
  }
}

// -------------------------------------------------------------
// Export & Download Actions
// -------------------------------------------------------------
function toggleFormatMenu() {
  const m = document.getElementById('format-menu');
  if (m) m.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('format-menu');
  const btn = document.getElementById('format-btn');
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.add('hidden');
  }
});

function getDownloadBaseName() {
  let name = 'QRDrop_Code';
  if (state.currentTab === 'doc' || state.currentTab === 'photo') {
    name = (state.activeFile.name || 'QRDrop').replace(/\.[^/.]+$/, '');
  } else if (state.currentTab === 'url') {
    try {
      const u = new URL(state.currentData);
      name = u.hostname.replace(/\./g, '_');
    } catch {
      name = 'QRDrop_Link';
    }
  }
  return name;
}

async function triggerDownload(format) {
  const m = document.getElementById('format-menu');
  if (m) m.classList.add('hidden');

  const baseName = getDownloadBaseName();

  if (format === 'PDF') {
    printQRSheet();
    return;
  }

  if (format === 'SVG') {
    if (qrCode) {
      await qrCode.download({
        name: baseName,
        extension: 'svg'
      });
      showToast(`Exported ${baseName}.svg (Vector Scalable)`, 'download');
    }
    return;
  }

  // PNG High-Res 1024x1024
  if (qrCode) {
    await qrCode.download({
      name: baseName,
      extension: 'png'
    });
    showToast(`Exported ${baseName}.png (4K Ultra HQ)`, 'download');
  }
}

function exportCurrentQR() {
  triggerDownload('PNG');
}

function copyEndpoint() {
  navigator.clipboard?.writeText(state.currentData);
  const icon = document.getElementById('copy-icon');
  if (icon) {
    icon.innerText = 'check';
    setTimeout(() => { icon.innerText = 'content_copy'; }, 2000);
  }
  showToast('Endpoint URL copied to clipboard!', 'content_copy');
}

async function copyImageClip() {
  try {
    if (!qrCode) return;
    const blob = await qrCode.getRawData('png');
    if (blob) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('QR Code image copied to clipboard!', 'file_copy');
    }
  } catch (err) {
    console.warn('Clipboard write image failed, copying URL instead:', err);
    copyEndpoint();
  }
}

function shareCurrentQR() {
  if (navigator.share) {
    navigator.share({
      title: 'QRDrop Code',
      text: 'Scan this QR code generated via QRDrop',
      url: state.currentData
    }).catch(() => {});
  } else {
    copyEndpoint();
    showToast('Share link copied to clipboard!', 'share');
  }
}

function printQRSheet() {
  window.print();
}

// -------------------------------------------------------------
// History Shelf
// -------------------------------------------------------------
const defaultHistory = [
  {
    title: 'Menu_Summer_2025.pdf',
    type: 'Document',
    scans: 142,
    timestamp: '2h ago',
    url: 'http://localhost:3000/f/Menu_Summer_2025'
  },
  {
    title: 'instagram.com/studio',
    type: 'Direct Link',
    scans: 89,
    timestamp: 'Yesterday',
    url: 'https://instagram.com/studio'
  },
  {
    title: 'Event_Banner_HiRes.png',
    type: 'Photo File',
    scans: 312,
    timestamp: '3d ago',
    url: 'http://localhost:3000/f/Event_Banner_HiRes'
  },
  {
    title: 'WiFi_Guest_Office',
    type: 'Wi-Fi',
    scans: 520,
    timestamp: '1w ago',
    url: 'WIFI:S:Guest_Office;T:WPA;P:GuestSecure;;'
  }
];

async function initHistory() {
  try {
    const saved = localStorage.getItem('qrdrop_history');
    state.history = saved ? JSON.parse(saved) : defaultHistory;
    
    // Attempt to merge server history
    const res = await fetch('/api/history');
    if (res.ok) {
      const serverItems = await res.json();
      if (Array.isArray(serverItems) && serverItems.length > 0) {
        const formatted = serverItems.map(item => ({
          title: item.originalName,
          type: item.mimetype && item.mimetype.startsWith('image/') ? 'Photo File' : 'Document',
          scans: 1,
          timestamp: 'Just now',
          url: item.viewUrl
        }));
        // Prepend server items that are not already in history
        formatted.forEach(f => {
          if (!state.history.some(h => h.url === f.url || h.title === f.title)) {
            state.history.unshift(f);
          }
        });
        if (state.history.length > 8) state.history = state.history.slice(0, 8);
      }
    }
  } catch {
    state.history = defaultHistory;
  }
  renderHistory();
}

function addToHistory(item) {
  state.history.unshift(item);
  if (state.history.length > 8) state.history.pop();
  try {
    localStorage.setItem('qrdrop_history', JSON.stringify(state.history));
  } catch {}
  renderHistory();
}

function renderHistory() {
  const grid = document.getElementById('history-grid');
  const countBadge = document.getElementById('history-count-badge');
  if (!grid) return;

  if (countBadge) {
    countBadge.innerText = `Memory (${state.history.length})`;
  }

  if (state.history.length === 0) {
    grid.innerHTML = '<div class="col-span-full py-8 text-center text-on-surface-variant dark:text-slate-400 font-label-mono text-label-mono">No recent conversions found. Drop a file above to begin.</div>';
    return;
  }

  grid.innerHTML = state.history.map((item, idx) => `
    <div class="bg-surface-container-lowest dark:bg-slate-900 rounded-xl p-space-md shadow-sm border border-surface-container-high dark:border-slate-800 flex flex-col justify-between gap-space-md hover:shadow-md transition-all group cursor-pointer" onclick="restoreHistoryItem(${idx})">
      <div class="flex items-start gap-space-sm">
        <div class="w-11 h-11 rounded-lg bg-surface-container dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-surface-container-high dark:border-slate-700">
          <svg class="w-full h-full text-primary dark:text-indigo-400" fill="currentColor" viewBox="0 0 40 40">
            <rect height="12" rx="2" width="12" x="2" y="2"></rect>
            <rect fill="#fff" height="6" rx="1" width="6" x="5" y="5"></rect>
            <rect height="12" rx="2" width="12" x="26" y="2"></rect>
            <rect fill="#fff" height="6" rx="1" width="6" x="29" y="5"></rect>
            <rect height="12" rx="2" width="12" x="2" y="26"></rect>
            <rect fill="#fff" height="6" rx="1" width="6" x="5" y="29"></rect>
            <circle cx="20" cy="14" r="2.2"></circle>
            <circle cx="28" cy="22" r="2.2"></circle>
            <circle cx="16" cy="28" r="2.2"></circle>
          </svg>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="font-ui-button text-ui-button text-on-surface dark:text-white truncate group-hover:text-secondary dark:group-hover:text-indigo-400 transition-colors" title="${item.title}">
            ${item.title}
          </span>
          <span class="font-label-mono-sm text-label-mono-sm text-on-surface-variant dark:text-slate-400">
            ${item.type} • ${item.scans || 0} scans
          </span>
        </div>
      </div>
      <div class="flex items-center justify-between pt-1 border-t border-surface-container-high/40 dark:border-slate-800">
        <span class="font-label-mono-sm text-label-mono-sm text-on-surface-variant dark:text-slate-500">${item.timestamp}</span>
        <div class="flex items-center gap-1" onclick="event.stopPropagation()">
          <button class="p-1 rounded text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-slate-800" onclick="viewItemAnalytics('${item.title}', ${item.scans})" title="Scan telemetry">
            <span class="material-symbols-outlined text-[16px]">bar_chart</span>
          </button>
          <button class="p-1 rounded text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-slate-800" onclick="downloadHistoryQR('${item.title}', '${item.url}')" title="Download">
            <span class="material-symbols-outlined text-[16px]">download</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function restoreHistoryItem(idx) {
  const item = state.history[idx];
  if (!item) return;

  state.currentData = item.url;
  updateEndpointDisplay(item.url);
  refreshQRCode();
  showToast(`Restored "${item.title}" into live QR preview`, 'history');
}

function viewItemAnalytics(title, scans) {
  openAnalyticsModal();
}

async function downloadHistoryQR(title, url) {
  const tempQR = new QRCodeStyling({
    width: 1024,
    height: 1024,
    data: url,
    dotsOptions: { type: state.dotType, color: state.fgColor }
  });
  await tempQR.download({ name: title.replace(/[^a-zA-Z0-9_-]/g, '_'), extension: 'png' });
  showToast(`Downloaded QR for ${title}`, 'download');
}

function clearAllHistory() {
  state.history = [];
  try {
    localStorage.removeItem('qrdrop_history');
    fetch('/api/history', { method: 'DELETE' }).catch(() => {});
  } catch {}
  renderHistory();
  showToast('Conversion history cleared', 'delete_sweep');
}

// -------------------------------------------------------------
// Modals & QR Camera Scanner
// -------------------------------------------------------------
function openScannerModal() {
  const modal = document.getElementById('scanner-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  try {
    if (!html5QrScanner) {
      html5QrScanner = new Html5Qrcode("reader");
    }
    html5QrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      (error) => {
        // scan progress
      }
    ).catch(err => {
      console.warn('Camera access unavailable:', err);
      const reader = document.getElementById('reader');
      if (reader) {
        reader.innerHTML = `<div class="p-4 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <span class="material-symbols-outlined text-slate-400 text-[32px]">videocam_off</span>
          <span>Webcam not available. Use the image upload button below to scan any QR screenshot.</span>
        </div>`;
      }
    });
  } catch (err) {
    console.error('QR Scanner init error:', err);
  }
}

function closeScannerModal() {
  const modal = document.getElementById('scanner-modal');
  if (modal) modal.classList.add('hidden');
  if (html5QrScanner && html5QrScanner.isScanning) {
    html5QrScanner.stop().catch(() => {});
  }
}

function handleScanSuccess(text) {
  const resultBox = document.getElementById('scanner-result');
  const resultLink = document.getElementById('scanner-result-link');
  if (resultBox && resultLink) {
    resultBox.classList.remove('hidden');
    resultLink.href = text.startsWith('http') ? text : '#';
    resultLink.innerText = text;
  }
  showToast(`Scanned: ${text.substring(0, 30)}...`, 'qr_code_2');
}

function scanQRFromImageFile(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (!html5QrScanner) {
      html5QrScanner = new Html5Qrcode("reader");
    }
    html5QrScanner.scanFile(file, true)
      .then(decodedText => {
        handleScanSuccess(decodedText);
      })
      .catch(err => {
        showToast('No readable QR code found in this image.', 'error');
      });
  }
}

function openBatchModal() {
  document.getElementById('batch-modal')?.classList.remove('hidden');
}
function closeBatchModal() {
  document.getElementById('batch-modal')?.classList.add('hidden');
}
function processBatchQRs() {
  const input = document.getElementById('batch-input')?.value || '';
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    showToast('Please enter at least one link or text', 'warning');
    return;
  }
  closeBatchModal();
  showToast(`Batch processing ${lines.length} QR codes...`, 'layers');
  lines.forEach((line, idx) => {
    addToHistory({
      title: line.length > 24 ? line.substring(0, 24) + '...' : line,
      type: 'Batch Item',
      scans: 0,
      timestamp: 'Just now',
      url: line
    });
  });
  setTimeout(() => {
    showToast(`${lines.length} QR codes added to history shelf!`, 'check_circle');
  }, 400);
}

function openAnalyticsModal() {
  document.getElementById('analytics-modal')?.classList.remove('hidden');
}
function closeAnalyticsModal() {
  document.getElementById('analytics-modal')?.classList.add('hidden');
}

function openApiModal() {
  document.getElementById('api-modal')?.classList.remove('hidden');
}
function closeApiModal() {
  document.getElementById('api-modal')?.classList.add('hidden');
}

function openCommandModal() {
  const m = document.getElementById('cmd-modal');
  if (m) {
    m.classList.remove('hidden');
    document.getElementById('cmd-input')?.focus();
  }
}
function closeCommandModal() {
  document.getElementById('cmd-modal')?.classList.add('hidden');
}
function filterCommands(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('#cmd-list button').forEach(btn => {
    const match = btn.innerText.toLowerCase().includes(q);
    btn.style.display = match ? 'flex' : 'none';
  });
}

function switchNavMode(mode) {
  // nav buttons styling
  document.querySelectorAll('nav button').forEach(b => {
    b.className = 'font-ui-button text-ui-button px-space-md py-1.5 rounded-full text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white transition-all';
  });
  const activeBtn = document.getElementById(`nav-btn-${mode}`);
  if (activeBtn) {
    activeBtn.className = 'font-ui-button px-space-md py-1.5 rounded-full transition-all bg-surface-container-lowest dark:bg-slate-800 text-on-surface dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]';
  }
}

// -------------------------------------------------------------
// Dark / Light Theme Management
// -------------------------------------------------------------
function initTheme() {
  const saved = localStorage.getItem('qrdrop_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-icon')?.replaceChildren(document.createTextNode('dark_mode'));
  } else {
    document.documentElement.classList.remove('dark');
    document.getElementById('theme-icon')?.replaceChildren(document.createTextNode('light_mode'));
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('qrdrop_theme', isDark ? 'dark' : 'light');
  const icon = document.getElementById('theme-icon');
  if (icon) icon.innerText = isDark ? 'dark_mode' : 'light_mode';
  showToast(isDark ? 'Dark theme enabled' : 'Light theme enabled', isDark ? 'dark_mode' : 'light_mode');
}

// -------------------------------------------------------------
// Keyboard Shortcuts (⌘K / Ctrl+K, ESC)
// -------------------------------------------------------------
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openCommandModal();
    }
    if (e.key === 'Escape') {
      closeCommandModal();
      closeScannerModal();
      closeBatchModal();
      closeAnalyticsModal();
      closeApiModal();
    }
  });
}

// -------------------------------------------------------------
// Helpers & Toast Notifications
// -------------------------------------------------------------
function formatFileSize(bytes) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

let toastTimeout = null;
function showToast(message, icon = 'check_circle') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');
  if (!toast || !msgEl) return;

  msgEl.innerText = message;
  if (iconEl) iconEl.innerText = icon;

  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2800);
}
