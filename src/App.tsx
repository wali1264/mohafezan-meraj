/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { defaultFoods } from './data';
import { saveOrder, getOrders, updateOrderStatus, Order, OrderItem, saveFood, getFoods, initFoods, FoodItem } from './db';
import { ShoppingCart, ChefHat, Receipt, Plus, Minus, Trash2, Printer, Settings, ImagePlus } from 'lucide-react';
import { cn } from './lib/utils';
import { format } from 'date-fns';

type Tab = 'pos' | 'kitchen';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodPrice, setNewFoodPrice] = useState('');
  const [newFoodEmoji, setNewFoodEmoji] = useState('🍲');
  const [newFoodImage, setNewFoodImage] = useState<string | undefined>(undefined);
  
  // Ref for print section
  const receiptRef = useRef<HTMLDivElement>(null);

  // Load orders when kitchen tab is active or initially
  useEffect(() => {
    loadData();
    
    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('SW registration failed: ', err);
      });
    }
  }, []);

  const loadData = async () => {
    await initFoods(defaultFoods);
    const loadedFoods = await getFoods();
    setFoodItems(loadedFoods);
    
    loadOrders();
  };

  const loadOrders = async () => {
    const loadedOrders = await getOrders();
    // Sort descending by date
    loadedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setOrders(loadedOrders);
  };
  
  const handleAddFood = async () => {
    if (!newFoodName || !newFoodPrice) return;
    
    await saveFood({
      name: newFoodName,
      price: parseInt(newFoodPrice),
      emoji: newFoodEmoji || '🍲',
      image: newFoodImage
    });
    
    await loadData();
    setShowAddForm(false);
    setNewFoodName('');
    setNewFoodPrice('');
    setNewFoodEmoji('🍲');
    setNewFoodImage(undefined);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewFoodImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addToCart = (food: FoodItem) => {
    if (!food.id) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === food.id);
      if (existing) {
        return prev.map((item) =>
          item.id === food.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id: food.id!, name: food.name, price: food.price, qty: 1, image: food.image, emoji: food.emoji }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    
    try {
      const newOrder = {
        items: cart,
        total,
        date: new Date().toISOString(),
        status: 'pending' as const
      };
      
      await saveOrder(newOrder);
      
      // Print before clearing
      setTimeout(() => {
        window.print();
        setCart([]);
        loadOrders();
      }, 100);
      
    } catch (error) {
      console.error("Failed to save order", error);
      alert("خطا در ثبت سفارش");
    }
  };

  const markCompleted = async (id: number) => {
    await updateOrderStatus(id, 'completed');
    loadOrders();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col dir-rtl" dir="rtl">
      {/* Header (Hidden in Print) */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <Receipt size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">سیستم فروش آفلاین</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('pos')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors cursor-pointer",
              activeTab === 'pos' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ShoppingCart size={18} />
            ثبت سفارش
          </button>
          <button
            onClick={() => {
                setActiveTab('kitchen');
                loadOrders();
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors cursor-pointer",
              activeTab === 'kitchen' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ChefHat size={18} />
            آشپزخانه
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {activeTab === 'pos' && (
          <>
            {/* Menu Grid (Hidden in Print) */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto no-print">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-slate-800">منوی غذا</h2>
                 <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer">
                    <Plus size={18} />
                    افزودن غذا
                 </button>
              </div>
              
              {showAddForm && (
                <div className="mb-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center transition-all">
                  <label className="flex items-center justify-center w-12 h-12 md:w-auto md:px-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors shrink-0 overflow-hidden">
                    {newFoodImage ? (
                      <img src={newFoodImage} alt="Preview" className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <ImagePlus size={24} className="text-slate-400" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <input type="text" placeholder="ایموجی" value={newFoodEmoji} onChange={e=>setNewFoodEmoji(e.target.value)} className="w-full md:w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                  <input type="text" placeholder="نام غذا" value={newFoodName} onChange={e=>setNewFoodName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                  <input type="number" placeholder="قیمت به تومان" value={newFoodPrice} onChange={e=>setNewFoodPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                  <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={handleAddFood} className="bg-indigo-600 text-white px-6 py-3 rounded-xl whitespace-nowrap hover:bg-indigo-700 w-full md:w-auto font-medium shadow-sm cursor-pointer">ذخیره</button>
                      <button onClick={()=>setShowAddForm(false)} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl hover:bg-slate-200 w-full md:w-auto font-medium cursor-pointer">انصراف</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {foodItems.map((food) => {
                  const cartItem = cart.find(item => item.id === food.id);
                  const qty = cartItem?.qty || 0;
                  
                  return (
                    <div
                      key={food.id}
                      className="bg-white border border-slate-200 rounded-2xl padding-0 flex flex-col items-center justify-center hover:border-indigo-300 hover:shadow-md transition-all group overflow-hidden"
                    >
                      <div className="p-5 flex flex-col items-center justify-center gap-3 w-full cursor-pointer" onClick={() => qty === 0 && addToCart(food)}>
                        {food.image ? (
                          <img src={food.image} alt={food.name} className="w-16 h-16 object-cover rounded-full shadow-sm group-hover:scale-110 transition-transform" />
                        ) : (
                          <span className="text-4xl group-hover:scale-110 transition-transform">{food.emoji}</span>
                        )}
                        <div className="text-center">
                          <h3 className="font-semibold text-slate-800">{food.name}</h3>
                          <p className="text-slate-500 font-bold mt-1 text-sm">{food.price.toLocaleString()} تومان</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-50 border-t border-slate-100 flex items-center justify-center p-3 h-[60px]">
                        {qty > 0 ? (
                           <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl w-full select-none">
                             <button onClick={(e) => { e.stopPropagation(); updateQty(food.id!, -1); }} className="px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-r-xl transition-colors text-slate-500 cursor-pointer">
                               {qty === 1 ? <Trash2 size={18} className="text-red-400" /> : <Minus size={18} /> }
                             </button>
                             <span className="font-bold text-indigo-700 w-8 text-center">{qty}</span>
                             <button onClick={(e) => { e.stopPropagation(); updateQty(food.id!, 1); }} className="px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-l-xl transition-colors text-slate-500 cursor-pointer">
                               <Plus size={18} />
                             </button>
                           </div>
                        ) : (
                           <button onClick={(e) => { e.stopPropagation(); addToCart(food); }} className="w-full py-2 flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-semibold transition-colors cursor-pointer">
                              <Plus size={18} />
                              افزودن
                           </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cart Sidebar (Hidden in Print) */}
            <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col no-print shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
              <div className="p-6 border-b border-slate-100 flex-1 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                  سبد خرید
                  {cart.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-sm py-0.5 px-2 rounded-full font-medium">
                      {cart.reduce((a, b) => a + b.qty, 0)}
                    </span>
                  )}
                </h2>
                
                {cart.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-3">
                     <ShoppingCart size={48} className="text-slate-200" />
                     <p>سبد خرید خالی است</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {cart.map((item) => (
                      <li key={item.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          <span className="text-slate-600 font-medium">{(item.price * item.qty).toLocaleString()} ت</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1">
                            <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors cursor-pointer">
                              {item.qty === 1 ? <Trash2 size={16} className="text-red-500"/> : <Minus size={16} />}
                            </button>
                            <span className="w-4 text-center font-semibold">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors cursor-pointer">
                              <Plus size={16} />
                            </button>
                          </div>
                          <span className="text-xs text-slate-400">{item.price.toLocaleString()} تومان/عدد</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="flex justify-between items-center mb-6 text-lg">
                  <span className="font-medium text-slate-600">جمع کل:</span>
                  <span className="font-bold text-2xl text-indigo-600">{total.toLocaleString()} تومان</span>
                </div>
                <button
                  onClick={submitOrder}
                  disabled={cart.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <Printer size={20} />
                  تایید و چاپ سفارش
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'kitchen' && (
          <div className="flex-1 p-6 md:p-8 bg-slate-50 overflow-y-auto no-print">
             <div className="max-w-4xl mx-auto">
               <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center justify-between">
                 <span>سفارشات آشپزخانه</span>
                 <button onClick={loadOrders} className="text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                    بروزرسانی
                 </button>
               </h2>
               
               {orders.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                    رکوردی یافت نشد.
                  </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {orders.map(order => (
                     <div key={order.id} className={cn(
                       "bg-white border rounded-2xl p-5 shadow-sm transition-all",
                       order.status === 'completed' ? "border-green-200 opacity-75" : "border-slate-200"
                     )}>
                       <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                         <div>
                            <div className="text-2xl font-black text-slate-800">#{order.id}</div>
                            <div className="text-sm text-slate-500 mt-1">{format(new Date(order.date), "HH:mm - yyyy/MM/dd")}</div>
                         </div>
                         <div className={cn(
                           "px-3 py-1 rounded-full text-sm font-semibold",
                           order.status === 'completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                         )}>
                           {order.status === 'completed' ? 'آماده شد' : 'در حال آماده سازی'}
                         </div>
                       </div>
                       
                       <ul className="mb-6 space-y-3">
                         {order.items.map(item => {
                           const originalFood = foodItems.find(f => f.id === item.id);
                           const image = item.image || originalFood?.image;
                           const emoji = item.emoji || originalFood?.emoji || '🍲';
                           
                           return (
                             <li key={item.id} className="flex justify-between items-center text-slate-700 font-medium border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                               <div className="flex items-center gap-3">
                                 {image ? (
                                   <img src={image} alt={item.name} className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-50" />
                                 ) : (
                                   <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-sm">
                                     {emoji}
                                   </div>
                                 )}
                                 <span className="flex items-center gap-2">
                                   <span className="bg-slate-100 text-slate-600 rounded-md px-2 py-1 flex items-center justify-center text-xs font-bold">x{item.qty}</span>
                                   {item.name}
                                 </span>
                               </div>
                               <div className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
                                 {(item.price * item.qty).toLocaleString()} تومان
                               </div>
                             </li>
                           );
                         })}
                       </ul>
                       
                       <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-100">
                         <span className="font-semibold text-slate-600">جمع کل سفارش:</span>
                         <span className="text-lg font-bold text-indigo-700">{order.total.toLocaleString()} تومان</span>
                       </div>
                       
                       {order.status === 'pending' && (
                         <button
                           onClick={() => markCompleted(order.id!)}
                           className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
                         >
                           علامت گذاری به عنوان آماده
                         </button>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        )}
      </main>

      {/* Print Only Section */}
      <div className="hidden print:block print:p-8 bg-white" dir="rtl" ref={receiptRef}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">سیستم فروش رستوران</h1>
          <p className="text-gray-500 text-sm">{format(new Date(), "yyyy/MM/dd HH:mm:ss")}</p>
        </div>
        <div className="border-t border-b border-dashed border-gray-300 py-4 mb-4">
          <table className="w-full text-right align-top">
            <thead>
              <tr className="text-gray-500 text-sm border-b border-black">
                <th className="pb-2 text-right">آیتم</th>
                <th className="pb-2 text-center">فی</th>
                <th className="pb-2 w-12 text-center">تعداد</th>
                <th className="pb-2 w-24 text-left">مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id} className="font-medium text-sm border-b border-gray-100 last:border-0">
                  <td className="py-2 text-right">{item.name}</td>
                  <td className="py-2 text-center text-gray-500 text-xs">{item.price.toLocaleString()}</td>
                  <td className="py-2 text-center">{item.qty}</td>
                  <td className="py-2 text-left">{(item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center text-xl font-bold mt-2">
          <span>جمع کل:</span>
          <span>{total.toLocaleString()} تومان</span>
        </div>
        <div className="text-center mt-12 text-sm text-gray-500 font-medium">
          متشکریم از خرید شما!
        </div>
      </div>
    </div>
  );
}

