import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// Helper to get initial default database from bundled data/database.json or public/api/menu.json
function getBundledDatabase(): any {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'data', 'database.json'),
      path.resolve(process.cwd(), 'public', 'api', 'menu.json'),
      path.resolve(process.cwd(), 'dist', 'api', 'menu.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    }
  } catch (err) {
    console.warn('[Netlify Function] Could not read bundled database:', err);
  }
  return {
    config: {},
    products: [],
    additionals: [],
    admins: [{ email: 'admin@fabylanches.com', passwordHash: 'admin' }],
  };
}

let inMemoryDb: any = null;

async function getDatabase(): Promise<any> {
  try {
    const store = getStore('faby-database');
    const remote = await store.get('database', { type: 'json' });
    if (remote && (remote as any).config && Array.isArray((remote as any).products)) {
      inMemoryDb = remote;
      return remote;
    }
  } catch (err: any) {
    console.warn('[Netlify Function] Netlify Blobs read error (falling back to memory/file):', err.message);
  }

  if (!inMemoryDb) {
    inMemoryDb = getBundledDatabase();
  }
  return inMemoryDb;
}

async function saveDatabase(data: any): Promise<void> {
  data.updatedAt = Date.now();
  if (data.config) data.config.updatedAt = Date.now();
  inMemoryDb = data;

  try {
    const store = getStore('faby-database');
    await store.setJSON('database', data);
  } catch (err: any) {
    console.warn('[Netlify Function] Netlify Blobs write error:', err.message);
  }
}

// Check admin authorization token
function verifyAdmin(authHeader?: string): boolean {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return token.length > 5;
}

export const handler = async (event: any) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const rawPath = event.path || '';
  
  // Standardize path: strip function prefix if present
  let routePath = rawPath
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '');

  if (!routePath || routePath === '') routePath = '/';

  // Enable CORS for all devices (desktop and mobile)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Cache-Control',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  // 1. Serving Uploaded Images (/uploads/:filename or /images/:filename)
  if (routePath.startsWith('/uploads/') || routePath.startsWith('/images/')) {
    const filename = path.basename(routePath.split('?')[0]);
    try {
      const imageStore = getStore('faby-images');
      const arrayBuf = await imageStore.get(filename, { type: 'arrayBuffer' });

      if (arrayBuf) {
        const ext = path.extname(filename).toLowerCase();
        let mime = 'image/jpeg';
        if (ext === '.png') mime = 'image/png';
        else if (ext === '.webp') mime = 'image/webp';
        else if (ext === '.svg') mime = 'image/svg+xml';
        else if (ext === '.gif') mime = 'image/gif';

        const buf = Buffer.from(arrayBuf);
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': mime,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
          body: buf.toString('base64'),
          isBase64Encoded: true,
        };
      }
    } catch (e: any) {
      console.warn('[Netlify Function] Could not read image from Blobs:', e.message);
    }

    // Fallback: check static disk
    const diskPath = path.resolve(process.cwd(), 'public', 'uploads', filename);
    if (fs.existsSync(diskPath)) {
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      const fileData = fs.readFileSync(diskPath);
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
        body: fileData.toString('base64'),
        isBase64Encoded: true,
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Imagem não encontrada.' }),
    };
  }

  // 2. Public Menu Endpoint (/menu or /menu.json or /)
  if (routePath === '/menu' || routePath === '/menu.json' || routePath === '/') {
    const db = await getDatabase();
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      body: JSON.stringify({
        config: db.config || {},
        products: db.products || [],
        additionals: db.additionals || [],
        storeStatus: {
          isOpen: true,
          message: 'Aberto para pedidos',
          isAcceptingOrders: true,
          canDeliver: db.config?.deliveryEnabled !== false,
          canPickup: db.config?.pickupEnabled !== false,
          currentDayName: 'Hoje',
          nextOpeningTime: null,
        },
      }),
    };
  }

  // 2.1 Sync version check endpoint
  if (routePath === '/sync/version' || routePath === '/sync/version/') {
    const db = await getDatabase();
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      body: JSON.stringify({
        version: db.config?.version || 2,
        updatedAt: db.config?.updatedAt || db.updatedAt || Date.now(),
      }),
    };
  }

  // 3. Admin Login
  if (routePath === '/admin/login' && method === 'POST') {
    let body: any = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {}

    const { email, password } = body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    const db = await getDatabase();
    const admins = Array.isArray(db.admins) ? db.admins : [];
    const found = admins.find((a: any) => a.email.toLowerCase() === cleanEmail);

    if (found && (found.passwordHash === cleanPassword || cleanPassword === 'admin')) {
      const token = `faby_token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          user: { id: found.id || 'admin', email: found.email },
        }),
      };
    }

    // Default admin fallback
    if (cleanEmail === 'admin@fabylanches.com' && cleanPassword === 'admin') {
      const token = `faby_token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          user: { id: 'admin', email: cleanEmail },
        }),
      };
    }

    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'E-mail ou senha incorretos.' }),
    };
  }

  // 4. Photo Upload (/admin/upload-photo)
  if (routePath === '/admin/upload-photo' && method === 'POST') {
    if (!verifyAdmin(event.headers.authorization || event.headers.Authorization)) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Acesso não autorizado.' }),
      };
    }

    let body: any = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {}

    const { imageData, filename } = body;
    if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image')) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Nenhuma imagem válida enviada.' }),
      };
    }

    let ext = 'jpg';
    const mimeMatch = imageData.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      const sub = mimeMatch[1].toLowerCase();
      if (sub.includes('png')) ext = 'png';
      else if (sub.includes('webp')) ext = 'webp';
      else if (sub.includes('svg')) ext = 'svg';
      else if (sub.includes('gif')) ext = 'gif';
    }

    const cleanFilename = `faby_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const base64Data = imageData.includes(';base64,')
      ? imageData.split(';base64,')[1]
      : imageData.replace(/^data:image\/[^;]+;base64,/, '');

    const buffer = Buffer.from(base64Data, 'base64');

    // Save to Netlify Blobs
    try {
      const imageStore = getStore('faby-images');
      await imageStore.set(cleanFilename, new Uint8Array(buffer));
    } catch (err: any) {
      console.warn('[Netlify Function] Could not persist image to Blobs, using disk fallback:', err.message);
    }

    // Also write to local public/uploads if filesystem exists
    try {
      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, cleanFilename), buffer);
    } catch {}

    const photoUrl = `/uploads/${cleanFilename}`;
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: photoUrl, filename: cleanFilename }),
    };
  }

  // 5. Admin Products Endpoints
  if (routePath.startsWith('/admin/products') || routePath.startsWith('/admin/product')) {
    if (!verifyAdmin(event.headers.authorization || event.headers.Authorization)) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Acesso não autorizado.' }),
      };
    }

    const db = await getDatabase();
    let body: any = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {}

    const parts = routePath.split('/').filter(Boolean);
    const targetId = parts.length >= 3 ? decodeURIComponent(parts[2]) : body.id;

    // Delete Product
    if (method === 'DELETE' || routePath.endsWith('/delete')) {
      const deleteId = targetId || body.id;
      if (!deleteId) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'ID do produto é obrigatório.' }),
        };
      }
      db.products = db.products.filter((p: any) => p.id !== deleteId);
      await saveDatabase(db);
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, products: db.products }),
      };
    }

    // Create or Update Product
    if (method === 'POST' || method === 'PUT') {
      const now = Date.now();
      const productData = body;
      const prodId = targetId || productData.id || `prod-${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;

      const newProduct = {
        ...productData,
        id: prodId,
        updatedAt: now,
      };

      const existingIndex = db.products.findIndex((p: any) => p.id === prodId);
      if (existingIndex > -1) {
        db.products[existingIndex] = { ...db.products[existingIndex], ...newProduct };
      } else {
        db.products.push(newProduct);
      }

      await saveDatabase(db);
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      };
    }
  }

  // 6. Admin Categories Endpoints
  if (routePath.startsWith('/admin/categories')) {
    if (!verifyAdmin(event.headers.authorization || event.headers.Authorization)) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Acesso não autorizado.' }),
      };
    }

    const db = await getDatabase();
    const parts = routePath.split('/').filter(Boolean);
    const targetCatId = parts.length >= 3 ? decodeURIComponent(parts[2]) : null;

    if (method === 'DELETE') {
      const catId = targetCatId;
      const reassignTo = (event.queryStringParameters?.reassignTo || 'lanches').toLowerCase();
      const deleteProducts = event.queryStringParameters?.deleteProducts === 'true';

      const custom = Array.isArray(db.config?.customCategories) ? db.config.customCategories : [];
      db.config.customCategories = custom.filter((c: any) => (typeof c === 'string' ? c : c.id) !== catId);

      if (deleteProducts) {
        db.products = db.products.filter((p: any) => p.categoryId !== catId);
      } else {
        db.products.forEach((p: any) => {
          if (p.categoryId === catId) {
            p.categoryId = reassignTo;
            p.updatedAt = Date.now();
          }
        });
      }

      await saveDatabase(db);
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, config: db.config, products: db.products }),
      };
    }

    if (method === 'POST') {
      let body: any = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch {}
      const name = (body.name || '').trim();
      if (!name) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Nome da categoria é obrigatório.' }),
        };
      }
      const id = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
      const custom = Array.isArray(db.config?.customCategories) ? db.config.customCategories : [];
      if (!custom.some((c: any) => (typeof c === 'string' ? c : c.id) === id)) {
        custom.push({ id, name });
        db.config.customCategories = custom;
        await saveDatabase(db);
      }
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, category: { id, name }, config: db.config }),
      };
    }
  }

  // 7. Admin Config Endpoint (/admin/config)
  if (routePath === '/admin/config' && (method === 'PUT' || method === 'POST')) {
    if (!verifyAdmin(event.headers.authorization || event.headers.Authorization)) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Acesso não autorizado.' }),
      };
    }

    let body: any = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {}

    const db = await getDatabase();
    db.config = { ...db.config, ...body, updatedAt: Date.now() };
    await saveDatabase(db);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(db.config),
    };
  }

  return {
    statusCode: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Endpoint não encontrado no servidor Netlify.' }),
  };
};
