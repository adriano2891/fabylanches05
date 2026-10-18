import type { StoreConfig, Product, Additional } from "../types.ts";

export const DEFAULT_CONFIG: StoreConfig = {
  "name": "Faby Lanches",
  "slogan": "Sabor que conquista!",
  "tagline": "Bateu a fome? Vem de Faby Lanches!",
  "whatsappNumber": "5584991537520",
  "logoUrl": "/logo_oficial.png",
  "pickupAddress": "Av. Principal, Centro, Morroró - RN",
  "deliveryEnabled": true,
  "pickupEnabled": true,
  "acceptOrdersWhenClosed": true,
  "temporaryPause": false,
  "temporaryPauseMessage": "Estamos em manutenção no momento. Voltamos em instantes!",
  "deliveryTimeEstimate": "40 a 60 min",
  "pickupTimeEstimate": "20 a 30 min",
  "paymentMethods": [
    {
      "id": "pix",
      "name": "Pix",
      "enabled": true,
      "type": "pix",
      "details": "Chave fornecida no WhatsApp"
    },
    {
      "id": "cartao_credito",
      "name": "Cartão de Crédito",
      "enabled": true,
      "type": "cartao_credito",
      "details": "Levamos a maquininha até você"
    },
    {
      "id": "cartao_debito",
      "name": "Cartão de Débito",
      "enabled": true,
      "type": "cartao_debito",
      "details": "Levamos a maquininha até você"
    },
    {
      "id": "dinheiro",
      "name": "Dinheiro",
      "enabled": true,
      "type": "dinheiro",
      "details": "Informe se precisa de troco"
    }
  ],
  "coverageAreas": [
    {
      "id": "1",
      "name": "Ponta Negra",
      "isDelivered": true
    },
    {
      "id": "2",
      "name": "Capim Macio",
      "isDelivered": true
    },
    {
      "id": "3",
      "name": "Neópolis",
      "isDelivered": true
    },
    {
      "id": "4",
      "name": "Candelária",
      "isDelivered": true
    },
    {
      "id": "5",
      "name": "Lagoa Nova",
      "isDelivered": true
    },
    {
      "id": "6",
      "name": "Tirol",
      "isDelivered": true
    },
    {
      "id": "7",
      "name": "Petrópolis",
      "isDelivered": true
    },
    {
      "id": "8",
      "name": "Zona Rural Afastada (Exemplo)",
      "isDelivered": false
    }
  ],
  "businessHours": [
    {
      "dayOfWeek": 0,
      "dayName": "Domingo",
      "enabled": true,
      "periods": [
        {
          "open": "18:00",
          "close": "23:59"
        }
      ]
    },
    {
      "dayOfWeek": 1,
      "dayName": "Segunda-feira",
      "enabled": true,
      "periods": [
        {
          "open": "18:00",
          "close": "23:59"
        }
      ]
    },
    {
      "dayOfWeek": 2,
      "dayName": "Terça-feira",
      "enabled": true,
      "periods": [
        {
          "open": "18:00",
          "close": "23:59"
        }
      ]
    },
    {
      "dayOfWeek": 3,
      "dayName": "Quarta-feira",
      "enabled": true,
      "periods": [
        {
          "open": "18:00",
          "close": "23:59"
        }
      ]
    },
    {
      "dayOfWeek": 4,
      "dayName": "Quinta-feira",
      "enabled": true,
      "periods": [
        {
          "open": "18:00",
          "close": "23:59"
        }
      ]
    },
    {
      "dayOfWeek": 5,
      "dayName": "Sexta-feira",
      "enabled": true,
      "periods": [
        {
          "open": "18:00",
          "close": "23:59"
        }
      ]
    },
    {
      "dayOfWeek": 6,
      "dayName": "Sábado",
      "enabled": true,
      "periods": [
        {
          "open": "18:00",
          "close": "23:59"
        }
      ]
    }
  ],
  "specialClosures": [],
  "experimentProductIds": [
    "lanche-completo-faby",
    "lanche-x-tudo"
  ],
  "customCategories": [],
  "version": 2,
  "updatedAt": 1792292020016
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    "id": "lanche-completo-faby",
    "name": "Completo da Faby",
    "categoryId": "lanches",
    "price": 1000,
    "description": "Pão bola, hambúrguer, ovo, mussarela, presunto, alface, tomate, cebola e molho especial.",
    "ingredients": [
      "Pão bola",
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Presunto",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "removableIngredients": [
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Presunto",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "available": true,
    "order": 1,
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon",
      "add-hamburguer",
      "add-calabresa",
      "add-frango"
    ],
    "photoUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "lanche-x-frango",
    "name": "X-Frango",
    "categoryId": "lanches",
    "price": 1400,
    "description": "Pão bola, hambúrguer, ovo, mussarela, frango, presunto, alface, tomate, cebola e molho especial.",
    "ingredients": [
      "Pão bola",
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Frango",
      "Presunto",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "removableIngredients": [
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Frango",
      "Presunto",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "available": true,
    "order": 2,
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon",
      "add-hamburguer",
      "add-calabresa",
      "add-frango"
    ],
    "photoUrl": "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "lanche-x-calabresa",
    "name": "X-Calabresa",
    "categoryId": "lanches",
    "price": 1200,
    "description": "Pão bola, hambúrguer, ovo, mussarela, presunto, calabresa, alface, tomate, cebola e molho especial.",
    "ingredients": [
      "Pão bola",
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Presunto",
      "Calabresa",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "removableIngredients": [
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Presunto",
      "Calabresa",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "available": true,
    "order": 3,
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon",
      "add-hamburguer",
      "add-calabresa",
      "add-frango"
    ],
    "photoUrl": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "lanche-x-bacon",
    "name": "X-Bacon",
    "categoryId": "lanches",
    "price": 1500,
    "description": "Pão bola, hambúrguer, ovo, mussarela, presunto, bacon, alface, tomate, cebola e molho especial.",
    "ingredients": [
      "Pão bola",
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Presunto",
      "Bacon",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "removableIngredients": [
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Presunto",
      "Bacon",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "available": true,
    "order": 4,
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon",
      "add-hamburguer",
      "add-calabresa",
      "add-frango"
    ],
    "photoUrl": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "lanche-x-tudo",
    "name": "X-Tudo",
    "categoryId": "lanches",
    "price": 1600,
    "description": "Pão bola, hambúrguer, ovo, mussarela, presunto, calabresa, salsicha, frango desfiado, bacon, alface, tomate, cebola e molho especial.",
    "ingredients": [
      "Pão bola",
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Presunto",
      "Calabresa",
      "Salsicha",
      "Frango desfiado",
      "Bacon",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "removableIngredients": [
      "Hambúrguer",
      "Ovo",
      "Mussarela",
      "Presunto",
      "Calabresa",
      "Salsicha",
      "Frango desfiado",
      "Bacon",
      "Alface",
      "Tomate",
      "Cebola",
      "Molho especial"
    ],
    "available": true,
    "order": 5,
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon",
      "add-hamburguer",
      "add-calabresa",
      "add-frango"
    ],
    "photoUrl": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "lanche-cachorro-quente",
    "name": "Cachorro-quente",
    "categoryId": "lanches",
    "price": 1000,
    "description": "Pão bola, salsicha, carne moída, vinagrete e molho especial.",
    "ingredients": [
      "Pão bola",
      "Salsicha",
      "Carne moída",
      "Vinagrete",
      "Molho especial"
    ],
    "removableIngredients": [
      "Salsicha",
      "Carne moída",
      "Vinagrete",
      "Molho especial"
    ],
    "available": true,
    "order": 6,
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon",
      "add-calabresa"
    ],
    "photoUrl": "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "prod-mvd3amfmpwlc",
    "name": "X-Picanha Especial",
    "categoryId": "lanches",
    "price": 2200,
    "description": "Pão brioche selado na manteiga, hambúrguer artesanal de picanha 160g, queijo mussarela derretido, alface, tomate, cebola caramelizada e molho especial da casa.",
    "photoUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600",
    "ingredients": [
      "Pão brioche",
      "Hambúrguer de picanha 160g",
      "Mussarela derretida",
      "Alface",
      "Tomate",
      "Cebola caramelizada",
      "Molho especial"
    ],
    "removableIngredients": [
      "Hambúrguer de picanha 160g",
      "Mussarela derretida",
      "Alface",
      "Tomate",
      "Cebola caramelizada",
      "Molho especial"
    ],
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon",
      "add-hamburguer",
      "add-calabresa",
      "add-frango"
    ],
    "available": true,
    "order": 7,
    "updatedAt": 1792292020016
  },
  {
    "id": "cuscuz-frango",
    "name": "Cuscuz de Frango",
    "categoryId": "cuscuz",
    "price": 1400,
    "description": "Cuscuz com frango desfiado, ovo, queijo coalho, vinagrete e molho especial.",
    "ingredients": [
      "Cuscuz",
      "Frango desfiado",
      "Ovo",
      "Queijo coalho",
      "Vinagrete",
      "Molho especial"
    ],
    "removableIngredients": [
      "Frango desfiado",
      "Ovo",
      "Queijo coalho",
      "Vinagrete",
      "Molho especial"
    ],
    "available": true,
    "order": 9,
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon"
    ],
    "photoUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "cuscuz-calabresa",
    "name": "Cuscuz de Calabresa",
    "categoryId": "cuscuz",
    "price": 1300,
    "description": "Cuscuz com calabresa, ovo, queijo coalho, vinagrete e molho especial.",
    "ingredients": [
      "Cuscuz",
      "Calabresa",
      "Ovo",
      "Queijo coalho",
      "Vinagrete",
      "Molho especial"
    ],
    "removableIngredients": [
      "Calabresa",
      "Ovo",
      "Queijo coalho",
      "Vinagrete",
      "Molho especial"
    ],
    "available": true,
    "order": 10,
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon"
    ],
    "photoUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "cuscuz-carne-moida",
    "name": "Cuscuz de Carne Moída",
    "categoryId": "cuscuz",
    "price": 1200,
    "description": "Cuscuz com carne bovina moída, ovo, queijo coalho, vinagrete e molho especial.",
    "ingredients": [
      "Cuscuz",
      "Carne bovina moída",
      "Ovo",
      "Queijo coalho",
      "Vinagrete",
      "Molho especial"
    ],
    "removableIngredients": [
      "Carne bovina moída",
      "Ovo",
      "Queijo coalho",
      "Vinagrete",
      "Molho especial"
    ],
    "available": true,
    "order": 11,
    "allowedAdditionalIds": [
      "add-ovo",
      "add-queijo",
      "add-bacon"
    ],
    "photoUrl": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "sopa-canja",
    "name": "Canja",
    "categoryId": "sopas",
    "price": 1000,
    "description": "Canja quentinha e tradicional, feita com tempero especial da casa.",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 12,
    "photoUrl": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "sopa-tradicional",
    "name": "Sopa",
    "categoryId": "sopas",
    "price": 1000,
    "description": "Sopa nutritiva e reconfortante do dia.",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 13,
    "photoUrl": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "bebida-caja",
    "name": "Suco ou Vitamina de Cajá",
    "categoryId": "bebidas",
    "price": 0,
    "description": "Feito com polpa natural da fruta selecionada (Cajá).",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 14,
    "isDrink": true,
    "drinkDetails": {
      "flavor": "Cajá",
      "sizes": []
    },
    "photoUrl": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "bebida-morango",
    "name": "Suco ou Vitamina de Morango",
    "categoryId": "bebidas",
    "price": 0,
    "description": "Feito com polpa natural da fruta selecionada (Morango).",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 15,
    "isDrink": true,
    "drinkDetails": {
      "flavor": "Morango",
      "sizes": []
    },
    "photoUrl": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "bebida-manga",
    "name": "Suco ou Vitamina de Manga",
    "categoryId": "bebidas",
    "price": 0,
    "description": "Feito com polpa natural da fruta selecionada (Manga).",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 16,
    "isDrink": true,
    "drinkDetails": {
      "flavor": "Manga",
      "sizes": []
    },
    "photoUrl": "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "bebida-abacaxi",
    "name": "Suco ou Vitamina de Abacaxi",
    "categoryId": "bebidas",
    "price": 0,
    "description": "Feito com polpa natural da fruta selecionada (Abacaxi).",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 17,
    "isDrink": true,
    "drinkDetails": {
      "flavor": "Abacaxi",
      "sizes": []
    },
    "photoUrl": "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "bebida-graviola",
    "name": "Suco ou Vitamina de Graviola",
    "categoryId": "bebidas",
    "price": 0,
    "description": "Feito com polpa natural da fruta selecionada (Graviola).",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 18,
    "isDrink": true,
    "drinkDetails": {
      "flavor": "Graviola",
      "sizes": []
    },
    "photoUrl": "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "bebida-acerola",
    "name": "Suco ou Vitamina de Acerola",
    "categoryId": "bebidas",
    "price": 0,
    "description": "Feito com polpa natural da fruta selecionada (Acerola).",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 19,
    "isDrink": true,
    "drinkDetails": {
      "flavor": "Acerola",
      "sizes": []
    },
    "photoUrl": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "bebida-goiaba",
    "name": "Suco ou Vitamina de Goiaba",
    "categoryId": "bebidas",
    "price": 0,
    "description": "Feito com polpa natural da fruta selecionada (Goiaba).",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 20,
    "isDrink": true,
    "drinkDetails": {
      "flavor": "Goiaba",
      "sizes": []
    },
    "photoUrl": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "bebida-maracuja",
    "name": "Suco ou Vitamina de Maracujá",
    "categoryId": "bebidas",
    "price": 0,
    "description": "Feito com polpa natural da fruta selecionada (Maracujá).",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 21,
    "isDrink": true,
    "drinkDetails": {
      "flavor": "Maracujá",
      "sizes": []
    },
    "photoUrl": "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  },
  {
    "id": "bebida-uva",
    "name": "Suco ou Vitamina de Uva",
    "categoryId": "bebidas",
    "price": 0,
    "description": "Feito com polpa natural da fruta selecionada (Uva).",
    "ingredients": [],
    "removableIngredients": [],
    "available": true,
    "order": 22,
    "isDrink": true,
    "drinkDetails": {
      "flavor": "Uva",
      "sizes": []
    },
    "photoUrl": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80",
    "updatedAt": 1792292020016
  }
];

export const DEFAULT_ADDITIONALS: Additional[] = [
  {
    "id": "add-ovo",
    "name": "Ovo frito",
    "price": 200,
    "maxQuantity": 3,
    "active": true
  },
  {
    "id": "add-queijo",
    "name": "Queijo extra",
    "price": 300,
    "maxQuantity": 3,
    "active": true
  },
  {
    "id": "add-bacon",
    "name": "Bacon crocante",
    "price": 350,
    "maxQuantity": 3,
    "active": true
  },
  {
    "id": "add-hamburguer",
    "name": "Hambúrguer extra",
    "price": 400,
    "maxQuantity": 2,
    "active": true
  },
  {
    "id": "add-calabresa",
    "name": "Calabresa fatiada",
    "price": 300,
    "maxQuantity": 2,
    "active": true
  },
  {
    "id": "add-frango",
    "name": "Frango desfiado",
    "price": 350,
    "maxQuantity": 2,
    "active": true
  }
];
