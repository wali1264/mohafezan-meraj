import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id?: number;
  items: OrderItem[];
  total: number;
  date: string;
  status: 'pending' | 'completed';
}

export interface FoodItem {
  id?: number;
  name: string;
  price: number;
  emoji: string;
}

interface RestaurantDB extends DBSchema {
  orders: {
    key: number;
    value: Order;
    indexes: { 'by-date': string };
  };
  foods: {
    key: number;
    value: FoodItem;
  };
}

let dbPromise: Promise<IDBPDatabase<RestaurantDB>> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RestaurantDB>('restaurantDB', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('orders', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-date', 'date');
        }
        if (oldVersion < 2) {
          db.createObjectStore('foods', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveOrder(order: Omit<Order, 'id'>) {
  const db = await getDB();
  return db.add('orders', order as Order);
}

export async function getOrders() {
  const db = await getDB();
  return db.getAllFromIndex('orders', 'by-date');
}

export async function clearOrders() {
  const db = await getDB();
  return db.clear('orders');
}

export async function updateOrderStatus(id: number, status: 'pending' | 'completed') {
    const db = await getDB();
    const order = await db.get('orders', id);
    if (order) {
        order.status = status;
        await db.put('orders', order);
    }
}

export async function saveFood(food: FoodItem) {
  const db = await getDB();
  return db.put('foods', food);
}

export async function getFoods() {
  const db = await getDB();
  return db.getAll('foods');
}

export async function initFoods(defaultFoods: Omit<FoodItem, 'id'>[]) {
  const db = await getDB();
  const count = await db.count('foods');
  if (count === 0) {
    const tx = db.transaction('foods', 'readwrite');
    for (const f of defaultFoods) {
      await tx.store.add(f as FoodItem);
    }
    await tx.done;
  }
}
