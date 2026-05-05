export const categories = [
  { id: '1', name: 'Recommended' },
  { id: '2', name: 'Starters' },
  { id: '3', name: 'Mains' },
  { id: '4', name: 'Desserts' },
  { id: '5', name: 'Beverages' },
];

export const menuItems = [
  {
    id: 'm1',
    categoryId: '1',
    name: 'Truffle Mushroom Risotto',
    description: 'Creamy carnaroli rice with wild mushrooms and truffle oil.',
    price: 450,
    type: 'veg',
    image: 'https://images.unsplash.com/photo-1476124369491-e73f5052960ce?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'm2',
    categoryId: '1',
    name: 'Pan Seared Salmon',
    description: 'Fresh Atlantic salmon with asparagus and hollandaise sauce.',
    price: 680,
    type: 'non-veg',
    image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'm3',
    categoryId: '2',
    name: 'Crispy Calamari',
    description: 'Lightly battered calamari rings served with lemon aioli.',
    price: 350,
    type: 'non-veg',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'm4',
    categoryId: '2',
    name: 'Bruschetta',
    description: 'Toasted sourdough topped with fresh tomatoes, garlic, and basil.',
    price: 250,
    type: 'veg',
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'm5',
    categoryId: '3',
    name: 'Butter Chicken',
    description: 'Classic Indian dish with tender chicken in a rich tomato gravy.',
    price: 480,
    type: 'non-veg',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'm6',
    categoryId: '3',
    name: 'Paneer Tikka Masala',
    description: 'Grilled cottage cheese cubes in a spiced onion-tomato curry.',
    price: 380,
    type: 'veg',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=200&h=200'
  }
];
