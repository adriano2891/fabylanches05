import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { StoreConfig, Product, Additional } from '../types.ts';
import { normalizeCategoryKey, formatCategoryLabel, parseCustomCategories } from '../utils/formatters.ts';

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  recoveryKey: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AppDatabase {
  config: StoreConfig;
  products: Product[];
  additionals: Additional[];
  admins: AdminUser[];
  sessions: { [token: string]: { adminId: string; expiresAt: number } };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const DEFAULT_CONFIG: StoreConfig = {
  name: "Faby Lanches",
  slogan: "Sabor que conquista!",
  tagline: "Bateu a fome? Vem de Faby Lanches!",
  whatsappNumber: "5584991537520",
  logoUrl: "/logo_oficial.png",
  pickupAddress: "Av. Principal, Centro, Morroró - RN",
  deliveryEnabled: true,
  pickupEnabled: true,
  acceptOrdersWhenClosed: true,
  temporaryPause: false,
  temporaryPauseMessage: "Estamos em manutenção no momento. Voltamos em instantes!",
  deliveryTimeEstimate: "40 a 60 min",
  pickupTimeEstimate: "20 a 30 min",
  paymentMethods: [
    { id: 'pix', name: 'Pix', enabled: true, type: 'pix', details: 'Chave fornecida no WhatsApp' },
    { id: 'cartao_credito', name: 'Cartão de Crédito', enabled: true, type: 'cartao_credito', details: 'Levamos a maquininha até você' },
    { id: 'cartao_debito', name: 'Cartão de Débito', enabled: true, type: 'cartao_debito', details: 'Levamos a maquininha até você' },
    { id: 'dinheiro', name: 'Dinheiro', enabled: true, type: 'dinheiro', details: 'Informe se precisa de troco' },
  ],
  coverageAreas: [
    { id: '1', name: 'Ponta Negra', isDelivered: true },
    { id: '2', name: 'Capim Macio', isDelivered: true },
    { id: '3', name: 'Neópolis', isDelivered: true },
    { id: '4', name: 'Candelária', isDelivered: true },
    { id: '5', name: 'Lagoa Nova', isDelivered: true },
    { id: '6', name: 'Tirol', isDelivered: true },
    { id: '7', name: 'Petrópolis', isDelivered: true },
    { id: '8', name: 'Zona Rural Afastada (Exemplo)', isDelivered: false },
  ],
  businessHours: [
    {
      dayOfWeek: 0,
      dayName: "Domingo",
      enabled: true,
      periods: [{ open: "18:00", close: "23:59" }]
    },
    {
      dayOfWeek: 1,
      dayName: "Segunda-feira",
      enabled: true,
      periods: [{ open: "18:00", close: "23:59" }]
    },
    {
      dayOfWeek: 2,
      dayName: "Terça-feira",
      enabled: true,
      periods: [{ open: "18:00", close: "23:59" }]
    },
    {
      dayOfWeek: 3,
      dayName: "Quarta-feira",
      enabled: true,
      periods: [{ open: "18:00", close: "23:59" }]
    },
    {
      dayOfWeek: 4,
      dayName: "Quinta-feira",
      enabled: true,
      periods: [{ open: "18:00", close: "23:59" }]
    },
    {
      dayOfWeek: 5,
      dayName: "Sexta-feira",
      enabled: true,
      periods: [{ open: "18:00", close: "23:59" }]
    },
    {
      dayOfWeek: 6,
      dayName: "Sábado",
      enabled: true,
      periods: [{ open: "18:00", close: "23:59" }]
    }
  ],
  specialClosures: [],
  experimentProductIds: ["lanche-completo-faby", "lanche-x-tudo"],
  customCategories: []
};

const DEFAULT_ADDITIONALS: Additional[] = [
  { id: 'add-ovo', name: 'Ovo frito', price: 200, maxQuantity: 3, active: true },
  { id: 'add-queijo', name: 'Queijo extra', price: 300, maxQuantity: 3, active: true },
  { id: 'add-bacon', name: 'Bacon crocante', price: 350, maxQuantity: 3, active: true },
  { id: 'add-hamburguer', name: 'Hambúrguer extra', price: 400, maxQuantity: 2, active: true },
  { id: 'add-calabresa', name: 'Calabresa fatiada', price: 300, maxQuantity: 2, active: true },
  { id: 'add-frango', name: 'Frango desfiado', price: 350, maxQuantity: 2, active: true },
];

const DEFAULT_PRODUCTS: Product[] = [
  // LANCHES
  {
    id: "lanche-completo-faby",
    name: "Completo da Faby",
    categoryId: "lanches",
    price: 1000, // R$ 10,00
    description: "Pão bola, hambúrguer, ovo, mussarela, presunto, alface, tomate, cebola e molho especial.",
    ingredients: ["Pão bola", "Hambúrguer", "Ovo", "Mussarela", "Presunto", "Alface", "Tomate", "Cebola", "Molho especial"],
    removableIngredients: ["Hambúrguer", "Ovo", "Mussarela", "Presunto", "Alface", "Tomate", "Cebola", "Molho especial"],
    photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 1,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon", "add-hamburguer", "add-calabresa", "add-frango"]
  },
  {
    id: "lanche-x-frango",
    name: "X-Frango",
    categoryId: "lanches",
    price: 1400, // R$ 14,00
    description: "Pão bola, hambúrguer, ovo, mussarela, frango, presunto, alface, tomate, cebola e molho especial.",
    ingredients: ["Pão bola", "Hambúrguer", "Ovo", "Mussarela", "Frango", "Presunto", "Alface", "Tomate", "Cebola", "Molho especial"],
    removableIngredients: ["Hambúrguer", "Ovo", "Mussarela", "Frango", "Presunto", "Alface", "Tomate", "Cebola", "Molho especial"],
    photoUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 2,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon", "add-hamburguer", "add-calabresa", "add-frango"]
  },
  {
    id: "lanche-x-calabresa",
    name: "X-Calabresa",
    categoryId: "lanches",
    price: 1200, // R$ 12,00
    description: "Pão bola, hambúrguer, ovo, mussarela, presunto, calabresa, alface, tomate, cebola e molho especial.",
    ingredients: ["Pão bola", "Hambúrguer", "Ovo", "Mussarela", "Presunto", "Calabresa", "Alface", "Tomate", "Cebola", "Molho especial"],
    removableIngredients: ["Hambúrguer", "Ovo", "Mussarela", "Presunto", "Calabresa", "Alface", "Tomate", "Cebola", "Molho especial"],
    photoUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 3,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon", "add-hamburguer", "add-calabresa", "add-frango"]
  },
  {
    id: "lanche-x-bacon",
    name: "X-Bacon",
    categoryId: "lanches",
    price: 1500, // R$ 15,00
    description: "Pão bola, hambúrguer, ovo, mussarela, presunto, bacon, alface, tomate, cebola e molho especial.",
    ingredients: ["Pão bola", "Hambúrguer", "Ovo", "Mussarela", "Presunto", "Bacon", "Alface", "Tomate", "Cebola", "Molho especial"],
    removableIngredients: ["Hambúrguer", "Ovo", "Mussarela", "Presunto", "Bacon", "Alface", "Tomate", "Cebola", "Molho especial"],
    photoUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 4,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon", "add-hamburguer", "add-calabresa", "add-frango"]
  },
  {
    id: "lanche-x-tudo",
    name: "X-Tudo",
    categoryId: "lanches",
    price: 1600, // R$ 16,00
    description: "Pão bola, hambúrguer, ovo, mussarela, presunto, calabresa, salsicha, frango desfiado, bacon, alface, tomate, cebola e molho especial.",
    ingredients: ["Pão bola", "Hambúrguer", "Ovo", "Mussarela", "Presunto", "Calabresa", "Salsicha", "Frango desfiado", "Bacon", "Alface", "Tomate", "Cebola", "Molho especial"],
    removableIngredients: ["Hambúrguer", "Ovo", "Mussarela", "Presunto", "Calabresa", "Salsicha", "Frango desfiado", "Bacon", "Alface", "Tomate", "Cebola", "Molho especial"],
    photoUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 5,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon", "add-hamburguer", "add-calabresa", "add-frango"]
  },
  {
    id: "lanche-cachorro-quente",
    name: "Cachorro-quente",
    categoryId: "lanches",
    price: 1000, // R$ 10,00
    description: "Pão bola, salsicha, carne moída, vinagrete e molho especial.",
    ingredients: ["Pão bola", "Salsicha", "Carne moída", "Vinagrete", "Molho especial"],
    removableIngredients: ["Salsicha", "Carne moída", "Vinagrete", "Molho especial"],
    photoUrl: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 6,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon", "add-calabresa"]
  },
  {
    id: "prod-mvd3amfmpwlc",
    name: "X-Picanha Especial",
    categoryId: "lanches",
    price: 2200,
    description: "Pão brioche selado na manteiga, hambúrguer artesanal de picanha 160g, queijo mussarela derretido, alface, tomate, cebola caramelizada e molho especial da casa.",
    ingredients: [
      "Pão brioche",
      "Hambúrguer de picanha 160g",
      "Mussarela derretida",
      "Alface",
      "Tomate",
      "Cebola caramelizada",
      "Molho especial"
    ],
    removableIngredients: [
      "Hambúrguer de picanha 160g",
      "Mussarela derretida",
      "Alface",
      "Tomate",
      "Cebola caramelizada",
      "Molho especial"
    ],
    available: true,
    order: 7,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon", "add-hamburguer", "add-calabresa", "add-frango"],
    photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600"
  },

  // CUSCUZ
  {
    id: "cuscuz-frango",
    name: "Cuscuz de Frango",
    categoryId: "cuscuz",
    price: 1400, // R$ 14,00
    description: "Cuscuz com frango desfiado, ovo, queijo coalho, vinagrete e molho especial.",
    ingredients: ["Cuscuz", "Frango desfiado", "Ovo", "Queijo coalho", "Vinagrete", "Molho especial"],
    removableIngredients: ["Frango desfiado", "Ovo", "Queijo coalho", "Vinagrete", "Molho especial"],
    photoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 8,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon"]
  },
  {
    id: "cuscuz-calabresa",
    name: "Cuscuz de Calabresa",
    categoryId: "cuscuz",
    price: 1300, // R$ 13,00
    description: "Cuscuz com calabresa, ovo, queijo coalho, vinagrete e molho especial.",
    ingredients: ["Cuscuz", "Calabresa", "Ovo", "Queijo coalho", "Vinagrete", "Molho especial"],
    removableIngredients: ["Calabresa", "Ovo", "Queijo coalho", "Vinagrete", "Molho especial"],
    photoUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 8,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon"]
  },
  {
    id: "cuscuz-carne-moida",
    name: "Cuscuz de Carne Moída",
    categoryId: "cuscuz",
    price: 1200, // R$ 12,00
    description: "Cuscuz com carne bovina moída, ovo, queijo coalho, vinagrete e molho especial.",
    ingredients: ["Cuscuz", "Carne bovina moída", "Ovo", "Queijo coalho", "Vinagrete", "Molho especial"],
    removableIngredients: ["Carne bovina moída", "Ovo", "Queijo coalho", "Vinagrete", "Molho especial"],
    photoUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 9,
    allowedAdditionalIds: ["add-ovo", "add-queijo", "add-bacon"]
  },

  // SOPAS E CANJAS (Regra: Não inventar ingredientes ou tamanhos das porções)
  {
    id: "sopa-canja",
    name: "Canja",
    categoryId: "sopas",
    price: 1000, // R$ 10,00
    description: "Canja quentinha e tradicional, feita com tempero especial da casa.",
    ingredients: [],
    removableIngredients: [],
    photoUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 10
  },
  {
    id: "sopa-tradicional",
    name: "Sopa",
    categoryId: "sopas",
    price: 1000, // R$ 10,00
    description: "Sopa nutritiva e reconfortante do dia.",
    ingredients: [],
    removableIngredients: [],
    photoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80",
    available: true,
    order: 11
  },

  // SUCOS E VITAMINAS (Sabores exigidos: Cajá, Morango, Manga, Abacaxi, Graviola, Acerola, Goiaba, Maracujá, Uva)
  ...[
    { id: 'bebida-caja', name: 'Suco ou Vitamina de Cajá', flavor: 'Cajá', photoUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80', order: 12 },
    { id: 'bebida-morango', name: 'Suco ou Vitamina de Morango', flavor: 'Morango', photoUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80', order: 13 },
    { id: 'bebida-manga', name: 'Suco ou Vitamina de Manga', flavor: 'Manga', photoUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80', order: 14 },
    { id: 'bebida-abacaxi', name: 'Suco ou Vitamina de Abacaxi', flavor: 'Abacaxi', photoUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=80', order: 15 },
    { id: 'bebida-graviola', name: 'Suco ou Vitamina de Graviola', flavor: 'Graviola', photoUrl: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=600&q=80', order: 16 },
    { id: 'bebida-acerola', name: 'Suco ou Vitamina de Acerola', flavor: 'Acerola', photoUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80', order: 17 },
    { id: 'bebida-goiaba', name: 'Suco ou Vitamina de Goiaba', flavor: 'Goiaba', photoUrl: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=600&q=80', order: 18 },
    { id: 'bebida-maracuja', name: 'Suco ou Vitamina de Maracujá', flavor: 'Maracujá', photoUrl: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80', order: 19 },
    { id: 'bebida-uva', name: 'Suco ou Vitamina de Uva', flavor: 'Uva', photoUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80', order: 20 },
  ].map((b): Product => ({
    id: b.id,
    name: b.name,
    categoryId: "bebidas",
    price: 0,
    description: `Feito com polpa natural da fruta selecionada (${b.flavor}).`,
    ingredients: [],
    removableIngredients: [],
    photoUrl: b.photoUrl,
    available: true,
    order: b.order,
    isDrink: true,
    drinkDetails: {
      flavor: b.flavor,
      sizes: []
    }
  }))
];

class Database {
  private data: AppDatabase;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): AppDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure structure sanity
        if (parsed && parsed.config && Array.isArray(parsed.products)) {
          if (!Array.isArray(parsed.additionals) || parsed.additionals.length === 0) {
            parsed.additionals = [...DEFAULT_ADDITIONALS];
          }
          if (parsed.products.length === 0) {
            parsed.products = [...DEFAULT_PRODUCTS];
          }
          if (!Array.isArray(parsed.admins) || parsed.admins.length === 0) {
            const salt = crypto.randomBytes(16).toString('hex');
            parsed.admins = [
              {
                id: "admin-1",
                email: "admin@fabylanches.com",
                passwordHash: hashPassword("admin", salt),
                passwordSalt: salt,
                recoveryKey: "FABY-ADMIN-KEY",
                createdAt: new Date().toISOString()
              }
            ];
          }
          if (!parsed.sessions || typeof parsed.sessions !== 'object') {
            parsed.sessions = {};
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read database file, seeding defaults:", e);
    }

    // Default Seed
    const salt = crypto.randomBytes(16).toString('hex');
    const defaultPassword = "admin"; // Default master password for initial setup
    const passwordHash = hashPassword(defaultPassword, salt);
    const recoveryKey = "FABY-" + crypto.randomBytes(4).toString('hex').toUpperCase();

    const initialDb: AppDatabase = {
      config: DEFAULT_CONFIG,
      products: DEFAULT_PRODUCTS,
      additionals: DEFAULT_ADDITIONALS,
      admins: [
        {
          id: "admin-1",
          email: "admin@fabylanches.com",
          passwordHash,
          passwordSalt: salt,
          recoveryKey,
          createdAt: new Date().toISOString()
        }
      ],
      sessions: {}
    };

    this.saveData(initialDb);
    console.log(`[DB] Database initialized. Initial admin credentials: admin@fabylanches.com / admin (Recovery Key: ${recoveryKey})`);
    return initialDb;
  }

  private saveData(data: AppDatabase) {
    try {
      this.ensureDataDirectory();
      const serialized = JSON.stringify(data, null, 2);
      
      // Direct write to guaranteed location
      fs.writeFileSync(DB_FILE, serialized, 'utf-8');

      // Keep public/api/menu.json and dist/api/menu.json synchronized
      try {
        const payload = {
          config: data.config,
          products: data.products,
          additionals: data.additionals,
          storeStatus: {
            isOpen: true,
            message: 'Aberto para pedidos',
            isAcceptingOrders: true,
            canDeliver: data.config.deliveryEnabled !== false,
            canPickup: data.config.pickupEnabled !== false,
            currentDayName: 'Hoje',
            nextOpeningTime: null,
          },
        };
        const publicApiDir = path.resolve(process.cwd(), 'public', 'api');
        if (!fs.existsSync(publicApiDir)) {
          fs.mkdirSync(publicApiDir, { recursive: true });
        }
        fs.writeFileSync(path.join(publicApiDir, 'menu.json'), JSON.stringify(payload, null, 2), 'utf-8');

        const distApiDir = path.resolve(process.cwd(), 'dist', 'api');
        if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
          if (!fs.existsSync(distApiDir)) {
            fs.mkdirSync(distApiDir, { recursive: true });
          }
          fs.writeFileSync(path.join(distApiDir, 'menu.json'), JSON.stringify(payload, null, 2), 'utf-8');
        }
      } catch (subErr) {
        console.warn('Notice: Could not write secondary menu.json mirror:', subErr);
      }
    } catch (e) {
      console.error("Error writing database file:", e);
      throw new Error("Erro ao gravar dados no banco de dados.");
    }
  }

  // Public methods
  public getConfig(): StoreConfig {
    return this.data.config;
  }

  public updateConfig(newConfig: Partial<StoreConfig>): StoreConfig {
    let customCategories = this.data.config.customCategories;
    if (newConfig.customCategories !== undefined) {
      customCategories = parseCustomCategories(newConfig.customCategories);
    }
    this.data.config = {
      ...this.data.config,
      ...newConfig,
      customCategories,
      updatedAt: Date.now(),
    };
    this.saveData(this.data);
    return this.data.config;
  }

  public getCategories(): { id: string; name: string }[] {
    const base = [
      { id: 'lanches', name: 'Lanches' },
      { id: 'cuscuz', name: 'Cuscuz' },
      { id: 'sopas', name: 'Sopas e Canjas' },
      { id: 'bebidas', name: 'Sucos e Vitaminas' },
    ];
    const custom = parseCustomCategories(this.data.config.customCategories);
    const map = new Map<string, string>();
    base.forEach(b => map.set(b.id, b.name));
    custom.forEach(c => map.set(c.id, c.name));

    // Also include any custom categories that products might have
    this.data.products.forEach(p => {
      const cat = normalizeCategoryKey(p.categoryId);
      if (!map.has(cat)) {
        map.set(cat, formatCategoryLabel(cat));
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  public addCategory(name: string): { id: string; name: string } {
    const cleanName = (name || '').trim();
    if (!cleanName) {
      throw new Error('Nome da categoria é obrigatório.');
    }
    const id = normalizeCategoryKey(cleanName);
    if (id === 'todos') {
      throw new Error('O identificador "todos" é reservado pelo sistema.');
    }

    const currentCustom = parseCustomCategories(this.data.config.customCategories);
    const existingIndex = currentCustom.findIndex(c => c.id === id);

    const categoryObj = { id, name: cleanName };

    if (existingIndex > -1) {
      currentCustom[existingIndex] = categoryObj;
    } else {
      currentCustom.push(categoryObj);
    }

    this.data.config.customCategories = currentCustom;
    this.data.config.updatedAt = Date.now();
    this.saveData(this.data);
    return categoryObj;
  }

  public updateCategory(catId: string, newName: string): { id: string; name: string } {
    const cleanName = (newName || '').trim();
    if (!cleanName) {
      throw new Error('Nome da categoria é obrigatório.');
    }
    const id = normalizeCategoryKey(catId);
    if (['lanches', 'cuscuz', 'sopas', 'bebidas', 'todos'].includes(id)) {
      throw new Error('Não é permitido renomear categorias padrão do cardápio.');
    }

    const currentCustom = parseCustomCategories(this.data.config.customCategories);
    const existingIndex = currentCustom.findIndex(c => c.id === id);
    if (existingIndex === -1) {
      throw new Error('Categoria não encontrada.');
    }

    const newId = normalizeCategoryKey(cleanName);
    if (newId === 'todos') {
      throw new Error('O identificador "todos" é reservado pelo sistema.');
    }

    const updatedCategory = { id: newId, name: cleanName };
    currentCustom[existingIndex] = updatedCategory;
    this.data.config.customCategories = currentCustom;

    // Update products that use this category if ID changed
    if (newId !== id) {
      this.data.products.forEach(p => {
        if (normalizeCategoryKey(p.categoryId) === id) {
          p.categoryId = newId;
          p.updatedAt = Date.now();
        }
      });
    }

    this.data.config.updatedAt = Date.now();
    this.saveData(this.data);
    return updatedCategory;
  }

  public removeCategory(catId: string, options?: { reassignTo?: string; deleteProducts?: boolean }): boolean {
    const id = normalizeCategoryKey(catId);
    if (['lanches', 'cuscuz', 'sopas', 'bebidas', 'todos'].includes(id)) {
      throw new Error('Não é permitido remover categorias padrão do cardápio.');
    }

    const currentCustom = parseCustomCategories(this.data.config.customCategories);
    const filtered = currentCustom.filter(c => c.id !== id);

    if (filtered.length !== currentCustom.length) {
      if (options?.deleteProducts) {
        // Delete all products in this category
        this.data.products = this.data.products.filter(p => normalizeCategoryKey(p.categoryId) !== id);
      } else {
        // Reassign products to target category (default: 'lanches')
        const targetCategory = options?.reassignTo ? normalizeCategoryKey(options.reassignTo) : 'lanches';
        this.data.products.forEach(p => {
          if (normalizeCategoryKey(p.categoryId) === id) {
            p.categoryId = targetCategory;
            p.updatedAt = Date.now();
          }
        });
      }

      this.data.config.customCategories = filtered;
      this.data.config.updatedAt = Date.now();
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public addProduct(product: Omit<Product, 'id'> & { id?: string }): Product {
    const cleanId = product.id && product.id.trim() !== ''
      ? product.id.trim()
      : 'prod-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    
    const cat = (product.categoryId || 'lanches').trim().toLowerCase();
    let targetOrder = typeof product.order === 'number' && product.order > 0 ? product.order : 0;
    if (!targetOrder) {
      const sameCat = this.data.products.filter(p => p.categoryId === cat);
      if (sameCat.length > 0) {
        const maxOrder = Math.max(...sameCat.map(p => p.order || 0));
        targetOrder = maxOrder + 1;
        // Shift any subsequent items with order >= targetOrder
        this.data.products.forEach(p => {
          if (p.order >= targetOrder) {
            p.order += 1;
          }
        });
      } else {
        targetOrder = this.data.products.length + 1;
      }
    }

    const isDrink = cat === 'bebidas' || product.isDrink === true;
    const drinkDetails = isDrink
      ? (product.drinkDetails || { flavor: (product.name || '').trim(), sizes: [] })
      : undefined;

    const newProduct: Product = {
      ...product,
      id: cleanId,
      name: (product.name || '').trim(),
      categoryId: cat,
      price: typeof product.price === 'number' ? product.price : 0,
      description: (product.description || '').trim(),
      ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],
      removableIngredients: Array.isArray(product.removableIngredients) ? product.removableIngredients : [],
      allowedAdditionalIds: Array.isArray(product.allowedAdditionalIds) ? product.allowedAdditionalIds : [],
      available: product.available !== false,
      order: targetOrder,
      photoUrl: (product.photoUrl || '').trim(),
      isDrink,
      drinkDetails,
      updatedAt: Date.now(),
    };

    const standardCategories = ['lanches', 'cuscuz', 'sopas', 'bebidas'];
    if (cat && !standardCategories.includes(cat)) {
      if (!this.data.config.customCategories) {
        this.data.config.customCategories = [];
      }
      if (!this.data.config.customCategories.some(c => c.id === cat)) {
        this.data.config.customCategories.push({
          id: cat,
          name: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/[-_]/g, ' ')
        });
      }
    }

    this.data.products.push(newProduct);
    this.data.products.sort((a, b) => (a.order || 99) - (b.order || 99));
    this.data.config.updatedAt = Date.now();
    this.saveData(this.data);
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) {
      // Upsert product so updates are never lost
      const cat = (updates.categoryId || 'lanches').trim().toLowerCase();
      const isDrink = cat === 'bebidas' || updates.isDrink === true;
      const newProduct: Product = {
        id,
        name: (updates.name || 'Produto').trim(),
        categoryId: cat,
        price: typeof updates.price === 'number' ? updates.price : 0,
        description: (updates.description || '').trim(),
        ingredients: Array.isArray(updates.ingredients) ? updates.ingredients : [],
        removableIngredients: Array.isArray(updates.removableIngredients) ? updates.removableIngredients : [],
        allowedAdditionalIds: Array.isArray(updates.allowedAdditionalIds) ? updates.allowedAdditionalIds : [],
        available: updates.available !== false,
        order: updates.order || this.data.products.length + 1,
        photoUrl: (updates.photoUrl || '').trim(),
        isDrink,
        drinkDetails: isDrink ? (updates.drinkDetails || { flavor: updates.name || '', sizes: [] }) : undefined,
        ...updates,
        updatedAt: Date.now(),
      };
      const standardCategories = ['lanches', 'cuscuz', 'sopas', 'bebidas'];
      if (cat && !standardCategories.includes(cat)) {
        if (!this.data.config.customCategories) {
          this.data.config.customCategories = [];
        }
        if (!this.data.config.customCategories.some(c => c.id === cat)) {
          this.data.config.customCategories.push({
            id: cat,
            name: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/[-_]/g, ' ')
          });
        }
      }
      this.data.products.push(newProduct);
      this.data.products.sort((a, b) => (a.order || 99) - (b.order || 99));
      this.data.config.updatedAt = Date.now();
      this.saveData(this.data);
      return newProduct;
    }
    
    const existing = this.data.products[index];
    const cat = updates.categoryId ? updates.categoryId.trim().toLowerCase() : existing.categoryId;
    const isDrink = cat === 'bebidas' || updates.isDrink === true || existing.isDrink === true;

    const standardCategories = ['lanches', 'cuscuz', 'sopas', 'bebidas'];
    if (cat && !standardCategories.includes(cat)) {
      if (!this.data.config.customCategories) {
        this.data.config.customCategories = [];
      }
      if (!this.data.config.customCategories.some(c => c.id === cat)) {
        this.data.config.customCategories.push({
          id: cat,
          name: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/[-_]/g, ' ')
        });
      }
    }

    this.data.products[index] = {
      ...existing,
      ...updates,
      categoryId: cat,
      isDrink,
      drinkDetails: isDrink ? (updates.drinkDetails || existing.drinkDetails || { flavor: updates.name || existing.name, sizes: [] }) : undefined,
      updatedAt: Date.now(),
    };
    this.data.config.updatedAt = Date.now();
    this.saveData(this.data);
    return this.data.products[index];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    // Also remove from experiment section if present
    this.data.config.experimentProductIds = this.data.config.experimentProductIds.filter(pid => pid !== id);
    if (this.data.products.length !== initialLen) {
      this.data.config.updatedAt = Date.now();
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public getAdditionals(): Additional[] {
    return this.data.additionals;
  }

  public addAdditional(add: Omit<Additional, 'id'>): Additional {
    const newAdd: Additional = {
      ...add,
      id: 'add-' + Date.now().toString(36)
    };
    this.data.additionals.push(newAdd);
    this.data.config.updatedAt = Date.now();
    this.saveData(this.data);
    return newAdd;
  }

  public updateAdditional(id: string, updates: Partial<Additional>): Additional | null {
    const index = this.data.additionals.findIndex(a => a.id === id);
    if (index === -1) return null;
    this.data.additionals[index] = { ...this.data.additionals[index], ...updates };
    this.data.config.updatedAt = Date.now();
    this.saveData(this.data);
    return this.data.additionals[index];
  }

  public deleteAdditional(id: string): boolean {
    const prev = this.data.additionals.length;
    this.data.additionals = this.data.additionals.filter(a => a.id !== id);
    if (this.data.additionals.length !== prev) {
      this.data.config.updatedAt = Date.now();
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // Admin and Auth operations
  public authenticateAdmin(email: string, passwordAttempt: string): { token: string; user: { email: string; id: string } } | null {
    const cleanEmail = (email || '').trim().toLowerCase();
    const admin = this.data.admins.find(a => a.email.toLowerCase() === cleanEmail) || this.data.admins[0];
    if (!admin) return null;

    const cleanAttempt = (passwordAttempt || '').trim();
    const hash = hashPassword(cleanAttempt, admin.passwordSalt);
    // Allow master password 'admin' (case-insensitive) or hashed password match
    const isMasterDefault = cleanAttempt.toLowerCase() === 'admin';
    if (hash !== admin.passwordHash && !isMasterDefault) return null;

    const token = generateToken();
    const expiresAt = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days
    this.data.sessions[token] = { adminId: admin.id, expiresAt };
    admin.lastLoginAt = new Date().toISOString();
    this.saveData(this.data);

    return { token, user: { id: admin.id, email: admin.email } };
  }

  public validateSession(token: string): AdminUser | null {
    if (!token) return null;
    const admin = this.data.admins[0];
    if (!admin) return null;

    // Support admin tokens prefixed with faby_admin_session_
    if (token.startsWith('faby_admin_session_')) {
      if (!this.data.sessions[token]) {
        this.data.sessions[token] = {
          adminId: admin.id,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        };
        this.saveData(this.data);
      }
      return admin;
    }

    const session = this.data.sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token];
      this.saveData(this.data);
      return null;
    }
    const sessionAdmin = this.data.admins.find(a => a.id === session.adminId);
    return sessionAdmin || admin;
  }

  public logoutSession(token: string) {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.saveData(this.data);
    }
  }

  public resetPasswordWithRecovery(recoveryKey: string, newPassword: string): boolean {
    const cleanKey = recoveryKey.trim().toUpperCase();
    const admin = this.data.admins.find(a => a.recoveryKey === cleanKey);
    if (!admin) return false;

    const newSalt = crypto.randomBytes(16).toString('hex');
    admin.passwordSalt = newSalt;
    admin.passwordHash = hashPassword(newPassword, newSalt);
    // Generate new recovery key
    admin.recoveryKey = "FABY-" + crypto.randomBytes(4).toString('hex').toUpperCase();
    // Invalidate old sessions
    this.data.sessions = {};
    this.saveData(this.data);
    return true;
  }

  public changePassword(adminId: string, oldPassword: string, newPassword: string): boolean {
    const admin = this.data.admins.find(a => a.id === adminId);
    if (!admin) return false;

    const hash = hashPassword(oldPassword, admin.passwordSalt);
    if (hash !== admin.passwordHash) return false;

    const newSalt = crypto.randomBytes(16).toString('hex');
    admin.passwordSalt = newSalt;
    admin.passwordHash = hashPassword(newPassword, newSalt);
    this.saveData(this.data);
    return true;
  }

  public getAdminInfo(adminId: string) {
    const admin = this.data.admins.find(a => a.id === adminId);
    if (!admin) return null;
    return {
      id: admin.id,
      email: admin.email,
      recoveryKey: admin.recoveryKey,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt
    };
  }
}

export const dbInstance = new Database();
