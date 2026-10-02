const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage directory setup
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(UPLOADS_DIR, 'metadata.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to load and save metadata
function getMetadata() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading metadata file:', err);
  }
  return [];
}

function saveMetadata(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing metadata file:', err);
  }
}

// Local network IPv4 address detector
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Look for non-internal IPv4 (e.g. 192.168.x.x or 10.x.x.x)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const safeExt = path.extname(file.originalname).toLowerCase() || '';
    cb(null, `${uniqueSuffix}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// Format bytes
function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Network info API
app.get('/api/network-info', (req, res) => {
  const localIp = getLocalNetworkIp();
  const host = req.headers.host || `${localIp}:${PORT}`;
  const protocol = req.protocol || 'http';
  res.json({
    localIp,
    port: PORT,
    baseUrl: `${protocol}://${host}`,
    directLanUrl: `http://${localIp}:${PORT}`
  });
});

// Upload API
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileId = path.parse(req.file.filename).name;
  const localIp = getLocalNetworkIp();
  const host = req.headers.host || `${localIp}:${PORT}`;
  const protocol = req.protocol || 'http';
  const baseUrl = host.includes('localhost') ? `http://${localIp}:${PORT}` : `${protocol}://${host}`;

  const record = {
    id: fileId,
    storedFilename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    sizeFormatted: formatBytes(req.file.size),
    mimetype: req.file.mimetype,
    createdAt: new Date().toISOString(),
    viewUrl: `${baseUrl}/f/${fileId}`,
    downloadUrl: `${baseUrl}/download/${fileId}`,
    rawUrl: `${baseUrl}/raw/${fileId}`,
    shortCode: fileId.substring(0, 7)
  };

  const metadata = getMetadata();
  metadata.unshift(record);
  // Keep last 50 files
  if (metadata.length > 50) {
    metadata.length = 50;
  }
  saveMetadata(metadata);

  res.json({
    success: true,
    file: record
  });
});

// File details API
app.get('/api/file/:id', (req, res) => {
  const metadata = getMetadata();
  const record = metadata.find(m => m.id === req.params.id || m.storedFilename.startsWith(req.params.id));
  if (!record) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.json(record);
});

// Mobile Preview Landing Page for scanned QR codes
app.get('/f/:id', (req, res) => {
  const previewPath = path.join(__dirname, 'public', 'mobile_preview.html');
  if (fs.existsSync(previewPath)) {
    res.sendFile(previewPath);
  } else {
    res.redirect(`/download/${req.params.id}`);
  }
});

// Raw file streaming (for inline images, PDFs, etc.)
app.get('/raw/:id', (req, res) => {
  const metadata = getMetadata();
  const record = metadata.find(m => m.id === req.params.id || m.storedFilename.startsWith(req.params.id));
  if (!record) {
    return res.status(404).send('File not found');
  }

  const filePath = path.join(UPLOADS_DIR, record.storedFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File missing from disk');
  }

  res.setHeader('Content-Type', record.mimetype || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(record.originalName)}"`);
  fs.createReadStream(filePath).pipe(res);
});

// Direct Download endpoint
app.get('/download/:id', (req, res) => {
  const metadata = getMetadata();
  const record = metadata.find(m => m.id === req.params.id || m.storedFilename.startsWith(req.params.id));
  if (!record) {
    return res.status(404).send('File not found');
  }

  const filePath = path.join(UPLOADS_DIR, record.storedFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File missing from disk');
  }

  res.download(filePath, record.originalName);
});

// Recent History API
app.get('/api/history', (req, res) => {
  const metadata = getMetadata();
  res.json(metadata.slice(0, 12));
});

// Clear History API
app.delete('/api/history', (req, res) => {
  const metadata = getMetadata();
  for (const item of metadata) {
    try {
      const p = path.join(UPLOADS_DIR, item.storedFilename);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {
      // ignore unlink errors
    }
  }
  saveMetadata([]);
  res.json({ success: true, message: 'History and cache cleared' });
});

// Fallback for SPA routing if needed
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalNetworkIp();
  console.log(`\n=================================================`);
  console.log(`🚀 QRDrop Server Running!`);
  console.log(`💻 Local:            http://localhost:${PORT}`);
  console.log(`📱 Wi-Fi / Network:  http://${localIp}:${PORT}`);
  console.log(`=================================================\n`);
});
