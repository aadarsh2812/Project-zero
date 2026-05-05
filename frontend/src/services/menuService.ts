import api from './api';

export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  type: 'veg' | 'non-veg';
  image: string;
  available: boolean;
}

export async function getCategories(hotelId?: string): Promise<Category[]> {
  try {
    const response = await api.get('/menu/categories', { params: { hotelId } });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function getMenuItems(hotelId?: string): Promise<MenuItem[]> {
  try {
    const response = await api.get('/menu/items', { params: { hotelId } });
    return response.data.map((item: any) => ({
      ...item,
      categoryId: item.category?.id || item.categoryId,
    }));
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return [];
  }
}

export async function saveMenuItem(item: MenuItem): Promise<void> {
  try {
    const payload = {
      ...item,
      category: { id: item.categoryId }
    };
    await api.post('/menu/items', payload);
  } catch (error) {
    console.error('Failed to save menu item:', error);
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    await api.delete(`/menu/items/${id}`);
  } catch (error) {
    console.error('Failed to delete menu item:', error);
  }
}
