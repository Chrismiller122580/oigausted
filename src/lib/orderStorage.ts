import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'tmp-order-files.json');

// Initialize storage
if (!fs.existsSync(storagePath)) {
  fs.writeFileSync(storagePath, JSON.stringify({}));
}

export function getFiles(orderId: string) {
  try {
    const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    return data[orderId] || [];
  } catch {
    return [];
  }
}

export function addFile(orderId: string, file: any) {
  try {
    const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    if (!data[orderId]) data[orderId] = [];
    data[orderId].push({
      ...file,
      uploadedAt: new Date().toISOString()
    });
    fs.writeFileSync(storagePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
