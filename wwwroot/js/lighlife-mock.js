// Fake data module for Lighlife
const MockData = {
  getNewArrivals: () => {
    return [
      { id: 1, name: "Áo Sơ Mi Lụa Dáng Rộng", price: 850000, img: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=500&q=80&auto=format&fit=crop" },
      { id: 2, name: "Quần Tây Nam Ống Đứng", price: 920000, img: "https://images.unsplash.com/photo-1594938298598-70f90e94b6d4?w=500&q=80&auto=format&fit=crop" },
      { id: 3, name: "Váy Liền Thân Cổ V", price: 1250000, img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80&auto=format&fit=crop" },
      { id: 4, name: "Áo Thun Cổ Lọ Basic", price: 450000, img: "https://images.unsplash.com/photo-1550439062-609e1531270e?w=500&q=80&auto=format&fit=crop" }
    ];
  },
  
  getCollections: () => {
    return [
      { id: 1, name: "Minimalist Fall", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80&auto=format&fit=crop" },
      { id: 2, name: "Urban Winter", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80&auto=format&fit=crop" }
    ];
  }
};

window.MockData = MockData;

