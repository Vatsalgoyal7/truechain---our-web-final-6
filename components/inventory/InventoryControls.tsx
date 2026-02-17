
import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { UserRole } from '../../types';

interface InventoryControlsProps {
  quantity: number;
  onUpdate: (delta: number) => void;
  onDelete: () => void;
  role: UserRole;
  isExpired?: boolean;
}

const InventoryControls: React.FC<InventoryControlsProps> = ({ quantity, onUpdate, onDelete, role, isExpired }) => {
  const isRetailer = role === UserRole.RETAILER;
  const canDelete = quantity === 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
        <button 
          onClick={() => onUpdate(-1)}
          disabled={quantity === 0 || (isRetailer && isExpired)}
          className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent transition"
          title={isRetailer ? "Sell 1 unit" : "Decrease quantity"}
        >
          <Minus className="w-4 h-4 text-slate-600" />
        </button>
        <span className="px-3 font-bold text-sm min-w-[2rem] text-center">
          {quantity}
        </span>
        <button 
          onClick={() => onUpdate(1)}
          disabled={isRetailer && isExpired}
          className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Increase quantity"
        >
          <Plus className="w-4 h-4 text-slate-600" />
        </button>
      </div>
      
      {canDelete && (
        <button 
          onClick={onDelete}
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Delete record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default InventoryControls;
