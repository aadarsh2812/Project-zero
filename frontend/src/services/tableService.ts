import api from './api';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  floor: string;
}

export async function getTables(hotelId?: string): Promise<Table[]> {
  try {
    const response = await api.get('/tables', { params: { hotelId } });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    return [];
  }
}

export async function saveTable(table: Table, hotelId?: string): Promise<void> {
  try {
    await api.post('/tables', table, { params: { hotelId } });
  } catch (error) {
    console.error('Failed to save table:', error);
  }
}

export async function deleteTable(id: string): Promise<void> {
  try {
    await api.delete(`/tables/${id}`);
  } catch (error) {
    console.error('Failed to delete table:', error);
  }
}
