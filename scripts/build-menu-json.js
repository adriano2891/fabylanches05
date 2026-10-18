import fs from 'fs';
import path from 'path';

try {
  const dbPath = path.resolve(process.cwd(), 'data', 'database.json');
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    const payload = {
      config: db.config,
      products: db.products,
      additionals: db.additionals,
      storeStatus: {
        isOpen: true,
        message: 'Aberto para pedidos',
        isAcceptingOrders: true,
        canDeliver: db.config?.deliveryEnabled !== false,
        canPickup: db.config?.pickupEnabled !== false,
        currentDayName: 'Hoje',
        nextOpeningTime: null,
      },
    };

    const publicApiDir = path.resolve(process.cwd(), 'public', 'api');
    if (!fs.existsSync(publicApiDir)) {
      fs.mkdirSync(publicApiDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicApiDir, 'menu.json'), JSON.stringify(payload, null, 2));

    const distApiDir = path.resolve(process.cwd(), 'dist', 'api');
    if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
      if (!fs.existsSync(distApiDir)) {
        fs.mkdirSync(distApiDir, { recursive: true });
      }
      fs.writeFileSync(path.join(distApiDir, 'menu.json'), JSON.stringify(payload, null, 2));
    }

    console.log('[build-menu-json] Successfully generated public/api/menu.json and dist/api/menu.json');
  }
} catch (err) {
  console.warn('[build-menu-json] Notice:', err.message);
}
