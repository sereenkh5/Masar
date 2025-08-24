// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// قاعدة بيانات مؤقتة في الذاكرة
let products = [
    {
        id: 1,
        name: "هاتف ذكي",
        description: "هاتف ذكي بمواصفات عالية وكاميرا متطورة",
        price: 1500,
        emoji: "📱",
        stock: 25,
        category: "إلكترونيات"
    },
    {
        id: 2,
        name: "لابتوب",
        description: "لابتوب قوي للألعاب والعمل",
        price: 3500,
        emoji: "💻",
        stock: 10,
        category: "إلكترونيات"
    },
    {
        id: 3,
        name: "سماعات لاسلكية",
        description: "سماعات بلوتوث عالية الجودة",
        price: 250,
        emoji: "🎧",
        stock: 50,
        category: "إكسسوارات"
    },
    {
        id: 4,
        name: "ساعة ذكية",
        description: "ساعة ذكية لتتبع اللياقة والصحة",
        price: 800,
        emoji: "⌚",
        stock: 15,
        category: "إلكترونيات"
    },
    {
        id: 5,
        name: "كاميرا رقمية",
        description: "كاميرا احترافية للتصوير",
        price: 2200,
        emoji: "📷",
        stock: 8,
        category: "إلكترونيات"
    },
    {
        id: 6,
        name: "تلفزيون ذكي",
        description: "تلفزيون 55 بوصة بدقة 4K",
        price: 2800,
        emoji: "📺",
        stock: 5,
        category: "إلكترونيات"
    }
];

let orders = [];
let orderIdCounter = 1;

// Routes

// صفحة البداية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// الحصول على جميع المنتجات
app.get('/api/products', (req, res) => {
    const { search, category, minPrice, maxPrice } = req.query;
    let filteredProducts = [...products];

    // البحث النصي
    if (search) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.description.toLowerCase().includes(search.toLowerCase())
        );
    }

    // تصفية بالفئة
    if (category) {
        filteredProducts = filteredProducts.filter(product => 
            product.category === category
        );
    }

    // تصفية بالسعر
    if (minPrice) {
        filteredProducts = filteredProducts.filter(product => 
            product.price >= parseInt(minPrice)
        );
    }

    if (maxPrice) {
        filteredProducts = filteredProducts.filter(product => 
            product.price <= parseInt(maxPrice)
        );
    }

    res.json({
        success: true,
        data: filteredProducts,
        total: filteredProducts.length
    });
});

// الحصول على منتج معين
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'المنتج غير موجود'
        });
    }

    res.json({
        success: true,
        data: product
    });
});

// إضافة منتج جديد (للإدارة)
app.post('/api/products', (req, res) => {
    const { name, description, price, emoji, stock, category } = req.body;

    if (!name || !description || !price) {
        return res.status(400).json({
            success: false,
            message: 'يرجى ملء جميع الحقول المطلوبة'
        });
    }

    const newProduct = {
        id: products.length + 1,
        name,
        description,
        price: parseFloat(price),
        emoji: emoji || '🛍️',
        stock: parseInt(stock) || 0,
        category: category || 'عام'
    };

    products.push(newProduct);

    res.status(201).json({
        success: true,
        data: newProduct,
        message: 'تم إضافة المنتج بنجاح'
    });
});

// تحديث منتج (للإدارة)
app.put('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'المنتج غير موجود'
        });
    }

    const { name, description, price, emoji, stock, category } = req.body;

    products[productIndex] = {
        ...products[productIndex],
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(emoji && { emoji }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(category && { category })
    };

    res.json({
        success: true,
        data: products[productIndex],
        message: 'تم تحديث المنتج بنجاح'
    });
});

// حذف منتج (للإدارة)
app.delete('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'المنتج غير موجود'
        });
    }

    products.splice(productIndex, 1);

    res.json({
        success: true,
        message: 'تم حذف المنتج بنجاح'
    });
});

// إنشاء طلب جديد
app.post('/api/orders', (req, res) => {
    const { items, customerInfo } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'يرجى إضافة منتجات إلى الطلب'
        });
    }

    let totalAmount = 0;
    const orderItems = [];

    // التحقق من المنتجات والكمية المتاحة
    for (const item of items) {
        const product = products.find(p => p.id === item.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: `المنتج ${item.id} غير موجود`
            });
        }

        if (product.stock < item.quantity) {
            return res.status(400).json({
                success: false,
                message: `الكمية المطلوبة من ${product.name} غير متوفرة. الكمية المتاحة: ${product.stock}`
            });
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            total: itemTotal
        });
    }

    // خصم الكمية من المخزون
    for (const item of items) {
        const productIndex = products.findIndex(p => p.id === item.id);
        products[productIndex].stock -= item.quantity;
    }

    // إنشاء الطلب
    const newOrder = {
        id: orderIdCounter++,
        items: orderItems,
        totalAmount,
        customerInfo: customerInfo || {},
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    orders.push(newOrder);

    res.status(201).json({
        success: true,
        data: newOrder,
        message: 'تم إنشاء الطلب بنجاح'
    });
});

// الحصول على جميع الطلبات
app.get('/api/orders', (req, res) => {
    const { status, limit } = req.query;
    let filteredOrders = [...orders];

    if (status) {
        filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    if (limit) {
        filteredOrders = filteredOrders.slice(0, parseInt(limit));
    }

    res.json({
        success: true,
        data: filteredOrders.reverse(), // أحدث الطلبات أولاً
        total: filteredOrders.length
    });
});

// الحصول على طلب معين
app.get('/api/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'الطلب غير موجود'
        });
    }

    res.json({
        success: true,
        data: order
    });
});

// تحديث حالة الطلب
app.put('/api/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'الطلب غير موجود'
        });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'حالة الطلب غير صحيحة'
        });
    }

    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();

    res.json({
        success: true,
        data: orders[orderIndex],
        message: 'تم تحديث حالة الطلب بنجاح'
    });
});

// الحصول على إحصائيات المتجر
app.get('/api/stats', (req, res) => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCounts = orders.reduce((counts, order) => {
        counts[order.status] = (counts[order.status] || 0) + 1;
        return counts;
    }, {});

    const categoryProducts = products.reduce((counts, product) => {
        counts[product.category] = (counts[product.category] || 0) + 1;
        return counts;
    }, {});

    res.json({
        success: true,
        data: {
            totalProducts,
            totalOrders,
            totalRevenue,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            ordersByStatus: statusCounts,
            productsByCategory: categoryProducts,
            lowStockProducts: products.filter(p => p.stock < 5)
        }
    });
});

// البحث المتقدم
app.get('/api/search', (req, res) => {
    const { q, sort, order } = req.query;
    
    if (!q) {
        return res.status(400).json({
            success: false,
            message: 'يرجى إدخال كلمة البحث'
        });
    }

    let results = products.filter(product => 
        product.name.toLowerCase().includes(q.toLowerCase()) ||
        product.description.toLowerCase().includes(q.toLowerCase()) ||
        product.category.toLowerCase().includes(q.toLowerCase())
    );

    // ترتيب النتائج
    if (sort) {
        results.sort((a, b) => {
            let aValue = a[sort];
            let bValue = b[sort];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (order === 'desc') {
                return bValue > aValue ? 1 : -1;
            }
            return aValue > bValue ? 1 : -1;
        });
    }

    res.json({
        success: true,
        data: results,
        total: results.length,
        query: q
    });
});

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم'
    });
});

// معالجة المسارات غير الموجودة
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'المسار غير موجود'
    });
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`🌐 رابط الموقع: http://localhost:${PORT}`);
    console.log('📊 API متاح على:');
    console.log(`   GET    /api/products - جميع المنتجات`);
    console.log(`   GET    /api/products/:id - منتج محدد`);
    console.log(`   POST   /api/products - إضافة منتج جديد`);
    console.log(`   PUT    /api/products/:id - تحديث منتج`);
    console.log(`   DELETE /api/products/:id - حذف منتج`);
    console.log(`   POST   /api/orders - إنشاء طلب جديد`);
    console.log(`   GET    /api/orders - جميع الطلبات`);
    console.log(`   GET    /api/orders/:id - طلب محدد`);
    console.log(`   PUT    /api/orders/:id - تحديث حالة الطلب`);
    console.log(`   GET    /api/stats - إحصائيات المتجر`);
    console.log(`   GET    /api/search - البحث المتقدم`);
});

module.exports = app;