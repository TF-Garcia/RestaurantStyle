import { useState, type FormEvent } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Label, Select, Textarea } from '../../components/ui/Form';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import type { MenuItem } from '../../types';
import { formatCurrency } from '../../utils/format';

const emptyItem: MenuItem = {
  id: '',
  name: '',
  description: '',
  price: 0,
  image: '',
  categoryId: 'carnes',
  featured: false,
  available: true,
};

export function MenuAdminPage() {
  const { menuItems, categories, saveMenuItem, removeMenuItem } = useRestaurantData();
  const [editing, setEditing] = useState<MenuItem>(emptyItem);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveMenuItem({ ...editing, id: editing.id || crypto.randomUUID(), price: Number(editing.price) });
    setEditing({ ...emptyItem, categoryId: categories[0]?.id || '' });
  };

  return (
    <div className="grid gap-7 xl:grid-cols-[0.9fr_1.2fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Cardapio</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Pratos</h1>
        <Card className="mt-7 p-5">
          <form onSubmit={submit} className="grid gap-4">
            <Label label="Nome"><Input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Label>
            <Label label="Descricao"><Textarea required value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Label label="Preco"><Input required type="number" min="0" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></Label>
              <Label label="Categoria">
                <Select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
              </Label>
            </div>
            <Label label="Imagem URL"><Input required value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></Label>
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-ink/70">
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Destaque</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.available} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} /> Disponivel</label>
            </div>
            <Button type="submit"><Plus size={18} /> {editing.id ? 'Salvar alteracoes' : 'Adicionar prato'}</Button>
          </form>
        </Card>
      </div>
      <Card className="overflow-hidden self-start">
        <div className="border-b border-black/10 p-5">
          <h2 className="font-display text-3xl font-bold">Itens cadastrados</h2>
        </div>
        <div className="divide-y divide-black/5">
          {menuItems.map((item) => (
            <div key={item.id} className="grid gap-4 p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center">
              <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-ink/55">{formatCurrency(item.price)} · {categories.find((category) => category.id === item.categoryId)?.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(item)} className="rounded-md border border-black/10 p-2 hover:bg-linen" aria-label="Editar"><Edit size={18} /></button>
                <button onClick={() => removeMenuItem(item.id)} className="rounded-md border border-black/10 p-2 text-wine hover:bg-wine/10" aria-label="Remover"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
