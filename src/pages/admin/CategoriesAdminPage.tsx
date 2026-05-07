import { useState, type FormEvent } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Label, Textarea } from '../../components/ui/Form';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import type { Category } from '../../types';

const emptyCategory: Category = {
  id: '',
  name: '',
  description: '',
  active: true,
  order: 1,
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function CategoriesAdminPage() {
  const { categories, saveCategory, removeCategory } = useRestaurantData();
  const [editing, setEditing] = useState<Category>(emptyCategory);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveCategory({ ...editing, id: editing.id || slug(editing.name), order: Number(editing.order) });
    setEditing(emptyCategory);
  };

  return (
    <div className="grid gap-7 xl:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-wine">Categorias</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Organizacao do cardapio</h1>
        <Card className="mt-7 p-5">
          <form onSubmit={submit} className="grid gap-4">
            <Label label="Nome"><Input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Label>
            <Label label="Descricao"><Textarea required value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Label>
            <Label label="Ordem"><Input type="number" min="1" value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} /></Label>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Categoria ativa
            </label>
            <Button type="submit"><Plus size={18} /> {editing.id ? 'Salvar categoria' : 'Adicionar categoria'}</Button>
          </form>
        </Card>
      </div>
      <Card className="overflow-hidden self-start">
        <div className="divide-y divide-black/5">
          {categories.map((category) => (
            <div key={category.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-semibold">{category.order}. {category.name}</p>
                <p className="mt-1 text-sm leading-6 text-ink/55">{category.description}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-olive">{category.active ? 'Ativa' : 'Inativa'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(category)} className="rounded-md border border-black/10 p-2 hover:bg-linen" aria-label="Editar"><Edit size={18} /></button>
                <button onClick={() => removeCategory(category.id)} className="rounded-md border border-black/10 p-2 text-wine hover:bg-wine/10" aria-label="Remover"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
