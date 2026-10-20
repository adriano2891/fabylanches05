import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { dbInstance } from './src/server/db.ts';
import { computeStoreStatus } from './src/server/statusHelper.ts';
import type { CartItem, Product, Additional } from './src/types.ts';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(compression({
  filter: (req, res) => {
    if (req.headers.accept === 'text/event-stream' || (req.path && req.path.startsWith('/api/sync/events'))) {
      return false; // NEVER compress SSE streams
    }
    return compression.filter(req, res);
  }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Enable CORS for Netlify and preview environments
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Auth middleware for admin endpoints
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Faça login como administrador.' });
  }

  const token = authHeader.substring(7);
  const admin = dbInstance.validateSession(token);
  if (!admin) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }

  (req as any).admin = admin;
  next();
}

// PUBLIC API ROUTES

// 1. Get full menu and store status
app.get('/api/menu', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const config = dbInstance.getConfig();
  const products = dbInstance.getProducts();
  const additionals = dbInstance.getAdditionals();
  const storeStatus = computeStoreStatus(config);

  res.json({
    config,
    products,
    additionals,
    storeStatus
  });
});

// 2. Validate cart items before checkout
app.post('/api/validate-cart', (req: Request, res: Response) => {
  const { items } = req.body as { items: CartItem[] };
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Formato de carrinho inválido' });
  }

  const currentProducts = dbInstance.getProducts();
  const currentAdditionals = dbInstance.getAdditionals();
  const config = dbInstance.getConfig();
  const storeStatus = computeStoreStatus(config);

  const changes: string[] = [];
  const updatedItems: CartItem[] = [];

  for (const item of items) {
    const product = currentProducts.find(p => p.id === item.productId);
    if (!product) {
      changes.push(`O item "${item.productName}" foi removido do cardápio.`);
      continue;
    }

    if (!product.available) {
      changes.push(`O item "${product.name}" está temporariamente esgotado.`);
      continue;
    }

    // Determine current base price
    let currentBasePrice = product.price;
    if (product.isDrink && item.drinkOption?.sizeId) {
      const size = product.drinkDetails?.sizes?.find(s => s.id === item.drinkOption?.sizeId);
      if (size) {
        if (!size.available) {
          changes.push(`O tamanho selecionado de "${product.name}" está esgotado.`);
          continue;
        }
        currentBasePrice = size.price;
      }
    }

    // Calculate additionals
    let additionalsTotal = 0;
    const validatedAdditionals = [];

    for (const add of item.additionals || []) {
      const dbAdd = currentAdditionals.find(a => a.id === add.id);
      if (dbAdd && dbAdd.active) {
        if (dbAdd.price !== add.price) {
          changes.push(`O adicional "${dbAdd.name}" teve o preço atualizado de R$ ${(add.price / 100).toFixed(2)} para R$ ${(dbAdd.price / 100).toFixed(2)}.`);
        }
        validatedAdditionals.push({
          id: dbAdd.id,
          name: dbAdd.name,
          price: dbAdd.price,
          quantity: Math.min(add.quantity, dbAdd.maxQuantity)
        });
        additionalsTotal += dbAdd.price * Math.min(add.quantity, dbAdd.maxQuantity);
      } else if (dbAdd && !dbAdd.active) {
        changes.push(`O adicional "${add.name}" não está mais disponível.`);
      }
    }

    if (currentBasePrice !== item.basePrice) {
      changes.push(`O preço de "${product.name}" foi atualizado de R$ ${(item.basePrice / 100).toFixed(2)} para R$ ${(currentBasePrice / 100).toFixed(2)}.`);
    }

    const unitPriceWithAdditionals = currentBasePrice + additionalsTotal;
    const totalPrice = unitPriceWithAdditionals * item.quantity;

    updatedItems.push({
      ...item,
      basePrice: currentBasePrice,
      additionals: validatedAdditionals,
      unitPriceWithAdditionals,
      totalPrice
    });
  }

  res.json({
    valid: changes.length === 0,
    changes,
    items: updatedItems,
    storeStatus
  });
});

// ADMIN AUTH ROUTES

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const result = dbInstance.authenticateAdmin(email, password);
  if (!result) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  res.json(result);
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  const token = req.headers.authorization?.substring(7);
  if (token) {
    dbInstance.logoutSession(token);
  }
  res.json({ success: true });
});

app.get('/api/admin/me', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const info = dbInstance.getAdminInfo(admin.id);
  res.json({ user: info });
});

app.post('/api/admin/reset-password', (req: Request, res: Response) => {
  const { recoveryKey, newPassword } = req.body;
  if (!recoveryKey || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Chave de recuperação e nova senha com no mínimo 6 caracteres são obrigatórios.' });
  }

  const success = dbInstance.resetPasswordWithRecovery(recoveryKey, newPassword);
  if (!success) {
    return res.status(400).json({ error: 'Chave de recuperação inválida.' });
  }

  res.json({ success: true, message: 'Senha redefinida com sucesso. Faça login com sua nova senha.' });
});

app.post('/api/admin/change-password', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Senha atual e nova senha de no mínimo 6 dígitos são obrigatórias.' });
  }

  const success = dbInstance.changePassword(admin.id, oldPassword, newPassword);
  if (!success) {
    return res.status(400).json({ error: 'Senha atual incorreta.' });
  }

  res.json({ success: true, message: 'Senha alterada com sucesso.' });
});

// Multi-device real-time sync broadcaster
const sseClients = new Set<Response>();

function notifyClientsMenuUpdated(reason: string, details?: any) {
  const payload = JSON.stringify({
    type: 'menu_updated',
    reason,
    details,
    updatedAt: Date.now(),
  });
  for (const client of Array.from(sseClients)) {
    try {
      client.write(`data: ${payload}\n\n`);
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep-alive heartbeat every 15s to maintain open mobile/desktop connections
setInterval(() => {
  for (const client of Array.from(sseClients)) {
    try {
      client.write(': keepalive\n\n');
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

// Real-time synchronization events (SSE) for all open mobile and desktop pages
app.get('/api/sync/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Content-Encoding': 'identity',
    'Access-Control-Allow-Origin': '*',
  });
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }
  res.write(`data: ${JSON.stringify({ type: 'connected', updatedAt: Date.now() })}\n\n`);
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Lightweight version check endpoint for polling or quick client validation
app.get('/api/sync/version', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const cfg = dbInstance.getConfig();
  res.json({
    updatedAt: cfg.updatedAt || Date.now(),
    version: cfg.version || 2,
    productCount: dbInstance.getProducts().length,
  });
});

// Public categories list
app.get('/api/categories', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({
    categories: dbInstance.getCategories(),
    customCategories: dbInstance.getConfig().customCategories || [],
  });
});

// PROTECTED ADMIN DATA MANAGEMENT ROUTES

app.put('/api/admin/config', requireAdmin, (req: Request, res: Response) => {
  const updates = req.body;
  const updatedConfig = dbInstance.updateConfig(updates);
  notifyClientsMenuUpdated('config_updated');
  res.json(updatedConfig);
});

// Category Management Routes
app.post('/api/admin/categories', requireAdmin, (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }
    const created = dbInstance.addCategory(name.trim());
    notifyClientsMenuUpdated('category_added', created);
    res.status(201).json({
      success: true,
      category: created,
      categories: dbInstance.getCategories(),
      config: dbInstance.getConfig(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao adicionar categoria.' });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const success = dbInstance.removeCategory(id);
    if (!success) {
      return res.status(404).json({ error: 'Categoria não encontrada ou já removida.' });
    }
    notifyClientsMenuUpdated('category_deleted', { id });
    res.json({
      success: true,
      categories: dbInstance.getCategories(),
      config: dbInstance.getConfig(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao remover categoria.' });
  }
});

app.put('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }
    const updated = dbInstance.updateCategory(id, name.trim());
    notifyClientsMenuUpdated('category_updated', updated);
    res.json({
      success: true,
      category: updated,
      categories: dbInstance.getCategories(),
      config: dbInstance.getConfig(),
      products: dbInstance.getProducts(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar categoria.' });
  }
});
app.post('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }
    const updated = dbInstance.updateCategory(id, name.trim());
    notifyClientsMenuUpdated('category_updated', updated);
    res.json({
      success: true,
      category: updated,
      categories: dbInstance.getCategories(),
      config: dbInstance.getConfig(),
      products: dbInstance.getProducts(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao atualizar categoria.' });
  }
});

// Reusable helper to write base64 image data to public/uploads (and dist/uploads)
function saveBase64Image(imageData: string, filename?: string): string {
  if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image')) {
    return imageData;
  }
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Determine extension reliably from MIME
  const mimeMatch = imageData.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
  let ext = 'jpg';
  if (mimeMatch && mimeMatch[1]) {
    const sub = mimeMatch[1].toLowerCase();
    if (sub.includes('png')) ext = 'png';
    else if (sub.includes('webp')) ext = 'webp';
    else if (sub.includes('svg')) ext = 'svg';
    else if (sub.includes('gif')) ext = 'gif';
    else ext = 'jpg';
  } else if (filename && typeof filename === 'string' && filename.includes('.')) {
    const fileExt = filename.split('.').pop()?.toLowerCase();
    if (fileExt && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(fileExt)) {
      ext = fileExt === 'jpeg' ? 'jpg' : fileExt;
    }
  }

  const cleanFilename = `faby_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
  const base64Data = imageData.includes(';base64,')
    ? imageData.split(';base64,')[1]
    : imageData.replace(/^data:image\/[^;]+;base64,/, '');

  const filePath = path.join(uploadsDir, cleanFilename);
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

  // If dist directory exists (production), write there too
  const distUploadsDir = path.resolve(process.cwd(), 'dist', 'uploads');
  if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    if (!fs.existsSync(distUploadsDir)) {
      fs.mkdirSync(distUploadsDir, { recursive: true });
    }
    try {
      fs.writeFileSync(path.join(distUploadsDir, cleanFilename), Buffer.from(base64Data, 'base64'));
    } catch {}
  }

  return `/uploads/${cleanFilename}`;
}

// PRODUCT ENDPOINTS (Supports PUT, POST, PATCH, singular/plural, and auto-upsert)
const handleUpdateProduct = (req: Request, res: Response) => {
  const rawId = req.params.id || req.body?.id || '';
  const id = decodeURIComponent(rawId).trim();
  if (!id) {
    return res.status(400).json({ error: 'ID do produto não informado.' });
  }

  const updates = { ...(req.body || {}) };
  if (updates.photoUrl && typeof updates.photoUrl === 'string' && updates.photoUrl.startsWith('data:image')) {
    updates.photoUrl = saveBase64Image(updates.photoUrl);
  }
  updates.updatedAt = Date.now();

  let updated = dbInstance.updateProduct(id, updates);
  if (!updated) {
    // If not found in memory, upsert it to ensure changes are never lost
    const created = dbInstance.addProduct({ ...updates, id });
    notifyClientsMenuUpdated('product_added', created);
    return res.status(200).json(created);
  }

  notifyClientsMenuUpdated('product_updated', updated);
  return res.json(updated);
};

// Route aliases for maximum client compatibility
app.put('/api/admin/products/:id', requireAdmin, handleUpdateProduct);
app.post('/api/admin/products/:id', requireAdmin, handleUpdateProduct);
app.patch('/api/admin/products/:id', requireAdmin, handleUpdateProduct);
app.put('/api/admin/product/:id', requireAdmin, handleUpdateProduct);
app.post('/api/admin/product/:id', requireAdmin, handleUpdateProduct);
app.patch('/api/admin/product/:id', requireAdmin, handleUpdateProduct);
app.put('/api/admin/products', requireAdmin, handleUpdateProduct);
app.patch('/api/admin/products', requireAdmin, handleUpdateProduct);

app.post('/api/admin/products', requireAdmin, (req: Request, res: Response) => {
  const productData = req.body || {};
  if (!productData.name || !productData.categoryId) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios.' });
  }
  if (productData.photoUrl && typeof productData.photoUrl === 'string' && productData.photoUrl.startsWith('data:image')) {
    productData.photoUrl = saveBase64Image(productData.photoUrl);
  }
  productData.updatedAt = Date.now();

  // If product already exists with this ID, update rather than failing
  if (productData.id && dbInstance.getProductById(productData.id)) {
    const updated = dbInstance.updateProduct(productData.id, productData);
    notifyClientsMenuUpdated('product_updated', updated);
    return res.status(200).json(updated);
  }

  const created = dbInstance.addProduct(productData);
  notifyClientsMenuUpdated('product_added', created);
  res.status(201).json(created);
});

const handleDeleteProduct = (req: Request, res: Response) => {
  const rawId = req.params.id || req.body?.id || '';
  const id = decodeURIComponent(rawId).trim();
  const success = dbInstance.deleteProduct(id);
  notifyClientsMenuUpdated('product_deleted', { id });
  res.json({ success: true });
};

app.delete('/api/admin/products/:id', requireAdmin, handleDeleteProduct);
app.delete('/api/admin/product/:id', requireAdmin, handleDeleteProduct);
app.delete('/api/admin/products', requireAdmin, handleDeleteProduct);
app.post('/api/admin/products/:id/delete', requireAdmin, handleDeleteProduct);
app.post('/api/admin/products/delete', requireAdmin, handleDeleteProduct);

app.post('/api/admin/products/reorder', requireAdmin, (req: Request, res: Response) => {
  const { orderMap } = req.body as { orderMap: { [id: string]: number } };
  if (!orderMap) {
    return res.status(400).json({ error: 'Mapa de ordem ausente.' });
  }
  for (const [id, order] of Object.entries(orderMap)) {
    dbInstance.updateProduct(id, { order });
  }
  const products = dbInstance.getProducts();
  notifyClientsMenuUpdated('products_reordered');
  res.json({ success: true, products });
});

app.post('/api/admin/additionals', requireAdmin, (req: Request, res: Response) => {
  const addData = req.body;
  if (!addData.name || addData.price === undefined) {
    return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
  }
  const created = dbInstance.addAdditional(addData);
  notifyClientsMenuUpdated('additional_added', created);
  res.status(201).json(created);
});

app.put('/api/admin/additionals/:id', requireAdmin, (req: Request, res: Response) => {
  const id = req.params.id;
  const updates = req.body;
  const updated = dbInstance.updateAdditional(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Adicional não encontrado.' });
  }
  notifyClientsMenuUpdated('additional_updated', updated);
  res.json(updated);
});

app.delete('/api/admin/additionals/:id', requireAdmin, (req: Request, res: Response) => {
  const id = req.params.id;
  const success = dbInstance.deleteAdditional(id);
  if (!success) {
    return res.status(404).json({ error: 'Adicional não encontrado.' });
  }
  notifyClientsMenuUpdated('additional_deleted', { id });
  res.json({ success: true });
});

// Photo upload (stores image into public/uploads and dist/uploads)
app.post('/api/admin/upload-photo', requireAdmin, (req: Request, res: Response) => {
  try {
    const { imageData, filename } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: 'Dados da imagem ausentes.' });
    }

    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image')) {
        const savedUrl = saveBase64Image(imageData, filename);
        return res.json({ url: savedUrl });
      }
      return res.json({ url: imageData });
    }

    return res.status(400).json({ error: 'Formato não suportado' });
  } catch (err: any) {
    console.error('Error saving uploaded photo:', err);
    return res.status(500).json({ error: 'Erro ao salvar foto no servidor: ' + err.message });
  }
});

// Serve dynamic menu on /api/menu.json and /api/menu so fetches are always fresh
app.get(['/api/menu.json', '/api/menu', '/api/menu/'], (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const config = dbInstance.getConfig();
  const products = dbInstance.getProducts();
  const additionals = dbInstance.getAdditionals();
  const storeStatus = computeStoreStatus(config);

  res.json({
    config,
    products,
    additionals,
    storeStatus,
  });
});

// SERVE VITE IN DEV OR STATIC BUILD IN PRODUCTION
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  // Ensure public uploads directory exists and is explicitly served with fast caching and revalidation
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir, {
    maxAge: '1m',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
    },
  }));

  // Ensure public directory is served statically for other assets
  app.use(express.static('public'));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist', {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js') || filePath.endsWith('index.html') || filePath.endsWith('manifest.webmanifest')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Faby Lanches server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
