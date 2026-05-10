import React, { useMemo, useState } from 'react';
import './index.css';

const STORAGE_KEY = 'east-april-inventory-items-v1';

const starterItems = [
  {
    id: 'water',
    category: 'Beverage / Breakroom',
    name: 'Water',
    quantity: 2,
    unit: 'cases',
    source: 'Sams/Costco',
    notes: '',
    min: 3,
    checked: false
  },
  {
    id: 'copy-paper-letter',
    category: 'Office Supplies',
    name: 'Copy Paper - Letter',
    quantity: 1,
    unit: 'pack/case',
    source: 'Sams/Costco',
    notes: '',
    min: 2,
    checked: false
  },
  {
    id: 'sticky-notes',
    category: 'Office Supplies',
    name: 'Sticky Notes',
    quantity: 1,
    unit: 'pack',
    source: 'Sams/Costco',
    notes: 'No accordion',
    min: 2,
    checked: false
  },
  {
    id: 'rubber-bands',
    category: 'Office Supplies',
    name: 'Rubber Bands',
    quantity: 100,
    unit: 'count/box',
    source: 'Other Items',
    notes: 'Handwriting looks like “100 rubber bands”',
    min: 100,
    checked: false
  },
  {
    id: 'tape-dispensers',
    category: 'Office Supplies',
    name: 'Tape Dispensers',
    quantity: 3,
    unit: 'each',
    source: 'Other Items',
    notes: '',
    min: 2,
    checked: false
  },
  {
    id: 'vacuum-bags',
    category: 'Cleaning / Equipment',
    name: 'Vacuum Bags',
    quantity: 1,
    unit: 'pack',
    source: 'Other Items',
    notes: '',
    min: 2,
    checked: false
  },
  {
    id: 'black-2-pocket-folders',
    category: 'Office Supplies',
    name: 'Black 2-Pocket Folders',
    quantity: 2,
    unit: 'boxes',
    source: 'Other/Order',
    notes: '',
    min: 2,
    checked: false
  },
  {
    id: 'blue-2-pocket-folders',
    category: 'Office Supplies',
    name: 'Blue 2-Pocket Folders',
    quantity: 1,
    unit: 'box',
    source: 'Other/Order',
    notes: '',
    min: 2,
    checked: false
  },
  {
    id: 'rack-cards-webpage',
    category: 'Printed Materials',
    name: 'Rack Cards - Webpage',
    quantity: 2,
    unit: 'quantity unknown',
    source: 'Other/Order',
    notes: 'Updated with current phone number',
    min: 2,
    checked: false
  },
  {
    id: 'rack-cards-mpm',
    category: 'Printed Materials',
    name: 'Rack Cards - MPM',
    quantity: 2,
    unit: 'quantity unknown',
    source: 'Other/Order',
    notes: '',
    min: 2,
    checked: false
  },
  {
    id: 'facts-about-funerals-english',
    category: 'Printed Materials',
    name: 'Facts About Funerals - English',
    quantity: 2,
    unit: 'quantity unknown',
    source: 'Other/Order',
    notes: '',
    min: 2,
    checked: false
  },
  {
    id: 'rack-cards-printed',
    category: 'Printed Materials',
    name: 'Rack Cards - Printed',
    quantity: 2,
    unit: 'quantity unknown',
    source: 'Other/Order',
    notes: 'Handwriting unclear but appears to say “Rack Cards - Printed”',
    min: 2,
    checked: false
  },
  {
    id: 'face-tissues',
    category: 'Cleaning / Restroom',
    name: 'Face Tissues',
    quantity: 2,
    unit: 'boxes',
    source: 'Other/Order',
    notes: 'Stored South',
    min: 3,
    checked: false
  },
  {
    id: 'candles',
    category: 'Miscellaneous',
    name: 'Candles',
    quantity: 1,
    unit: 'box',
    source: 'Other Items / Not Sure',
    notes: '',
    min: 1,
    checked: false
  }
];

const blankItem = {
  category: 'Office Supplies',
  name: '',
  quantity: 1,
  unit: 'each',
  source: 'Other/Order',
  notes: '',
  min: 1
};

function loadStoredItems() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : starterItems;
  } catch (error) {
    console.error('Unable to load inventory from localStorage', error);
    return starterItems;
  }
}

function makeId(name) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
}

function downloadCsv(items) {
  const headings = ['Category', 'Item', 'Quantity', 'Unit', 'Source / Area', 'Minimum', 'Checked', 'Notes'];
  const rows = items.map(item => [
    item.category,
    item.name,
    item.quantity,
    item.unit,
    item.source,
    item.min,
    item.checked ? 'Yes' : 'No',
    item.notes
  ]);
  const csv = [headings, ...rows]
    .map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'east-april-inventory.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [items, setItems] = useState(loadStoredItems);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [newItem, setNewItem] = useState(blankItem);

  function saveItems(nextItems) {
    setItems(nextItems);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  }

  function updateItem(id, patch) {
    saveItems(items.map(item => (item.id === id ? { ...item, ...patch } : item)));
  }

  function adjustQuantity(id, amount) {
    saveItems(items.map(item => (
      item.id === id ? { ...item, quantity: Math.max(0, Number(item.quantity) + amount) } : item
    )));
  }

  function addItem(event) {
    event.preventDefault();
    if (!newItem.name.trim()) return;

    saveItems([
      {
        ...newItem,
        id: makeId(newItem.name),
        name: newItem.name.trim(),
        quantity: Number(newItem.quantity) || 0,
        min: Number(newItem.min) || 0,
        checked: false
      },
      ...items
    ]);
    setNewItem(blankItem);
  }

  function resetInventory() {
    saveItems(starterItems);
    setQuery('');
    setCategory('All');
    setShowLowOnly(false);
  }

  const categories = useMemo(() => ['All', ...new Set(items.map(item => item.category))], [items]);

  const filteredItems = useMemo(() => items.filter(item => {
    const matchesQuery = [item.name, item.category, item.source, item.notes, item.unit]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = category === 'All' || item.category === category;
    const matchesStock = !showLowOnly || Number(item.quantity) <= Number(item.min);
    return matchesQuery && matchesCategory && matchesStock;
  }), [category, items, query, showLowOnly]);

  const lowStockItems = items.filter(item => Number(item.quantity) <= Number(item.min));
  const checkedCount = items.filter(item => item.checked).length;
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">East Location • April • Supply Request / Inventory Intake</p>
          <h1>Inventory checklist & stock tracker</h1>
          <p className="hero-copy">
            Count supplies, check off reviewed items, add or subtract stock, and quickly find reorder needs from one clean dashboard.
          </p>
        </div>
        <div className="hero-actions">
          <button className="secondary-button" onClick={() => downloadCsv(items)}>Export CSV</button>
          <button className="ghost-button" onClick={resetInventory}>Reset April List</button>
        </div>
      </section>

      <section className="stats-grid" aria-label="Inventory summary">
        <article className="stat-card">
          <span>Total items</span>
          <strong>{items.length}</strong>
        </article>
        <article className="stat-card warning">
          <span>Reorder alerts</span>
          <strong>{lowStockItems.length}</strong>
        </article>
        <article className="stat-card">
          <span>Checked off</span>
          <strong>{checkedCount}/{items.length}</strong>
        </article>
        <article className="stat-card">
          <span>Total units counted</span>
          <strong>{totalQuantity.toLocaleString()}</strong>
        </article>
      </section>

      <section className="control-panel">
        <label>
          Search inventory
          <input
            type="search"
            placeholder="Try folders, tissues, Costco, South..."
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <label>
          Category
          <select value={category} onChange={event => setCategory(event.target.value)}>
            {categories.map(itemCategory => <option key={itemCategory}>{itemCategory}</option>)}
          </select>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={showLowOnly}
            onChange={event => setShowLowOnly(event.target.checked)}
          />
          Show low stock only
        </label>
      </section>

      <section className="content-grid">
        <div className="inventory-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Checklist</p>
              <h2>Current request items</h2>
            </div>
            <span>{filteredItems.length} shown</span>
          </div>

          <div className="inventory-list">
            {filteredItems.map(item => {
              const isLow = Number(item.quantity) <= Number(item.min);
              return (
                <article className={`inventory-row ${item.checked ? 'is-checked' : ''}`} key={item.id}>
                  <label className="check-wrap" aria-label={`Mark ${item.name} reviewed`}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={event => updateItem(item.id, { checked: event.target.checked })}
                    />
                    <span />
                  </label>

                  <div className="item-main">
                    <div className="item-title-row">
                      <h3>{item.name}</h3>
                      {isLow && <span className="low-badge">Low stock</span>}
                    </div>
                    <p>{item.category} • {item.source}</p>
                    {item.notes && <small>{item.notes}</small>}
                  </div>

                  <div className="quantity-controls">
                    <button onClick={() => adjustQuantity(item.id, -1)} aria-label={`Subtract one ${item.name}`}>−</button>
                    <div>
                      <strong>{item.quantity}</strong>
                      <span>{item.unit}</span>
                    </div>
                    <button onClick={() => adjustQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button>
                  </div>

                  <label className="min-control">
                    Min
                    <input
                      type="number"
                      min="0"
                      value={item.min}
                      onChange={event => updateItem(item.id, { min: Number(event.target.value) })}
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="side-panel">
          <form className="add-card" onSubmit={addItem}>
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">New item</p>
                <h2>Add inventory</h2>
              </div>
            </div>
            <label>
              Item name
              <input
                value={newItem.name}
                onChange={event => setNewItem({ ...newItem, name: event.target.value })}
                placeholder="Example: Pens"
              />
            </label>
            <div className="two-col">
              <label>
                Qty
                <input
                  type="number"
                  min="0"
                  value={newItem.quantity}
                  onChange={event => setNewItem({ ...newItem, quantity: event.target.value })}
                />
              </label>
              <label>
                Unit
                <input
                  value={newItem.unit}
                  onChange={event => setNewItem({ ...newItem, unit: event.target.value })}
                />
              </label>
            </div>
            <label>
              Category
              <input
                value={newItem.category}
                onChange={event => setNewItem({ ...newItem, category: event.target.value })}
              />
            </label>
            <label>
              Source / area
              <input
                value={newItem.source}
                onChange={event => setNewItem({ ...newItem, source: event.target.value })}
              />
            </label>
            <div className="two-col">
              <label>
                Minimum
                <input
                  type="number"
                  min="0"
                  value={newItem.min}
                  onChange={event => setNewItem({ ...newItem, min: event.target.value })}
                />
              </label>
              <button className="primary-button" type="submit">Add item</button>
            </div>
            <label>
              Notes
              <textarea
                value={newItem.notes}
                onChange={event => setNewItem({ ...newItem, notes: event.target.value })}
                placeholder="Storage details, handwriting questions, phone number updates..."
              />
            </label>
          </form>

          <div className="reorder-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Reorder report</p>
                <h2>Needs attention</h2>
              </div>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="empty-state">Everything is above the minimum level.</p>
            ) : (
              <ul>
                {lowStockItems.map(item => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <strong>{item.quantity} {item.unit}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
