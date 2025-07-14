// src/lib/airtable/inventory.ts
import { base, TABLES, FIELDS, airtableUtils } from './config';

// Tipos para inventario
export interface InventoryItem {
  id: string;
  productId: string;
  quantityAvailable: number;
  quantityReserved: number;
  reorderLevel: number;
  supplier?: string;
  costPrice?: number;
  lastRestocked?: string;
  location?: string;
}

export interface StockMovement {
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';
  quantity: number;
  reason: string;
  orderId?: string;
  notes?: string;
}

// Convertir registro de Airtable a objeto InventoryItem
const airtableToInventoryItem = (record: any): InventoryItem => {
  const fields = record.fields;
  
  return {
    id: record.id,
    productId: fields[FIELDS.INVENTORY.PRODUCT_ID] || '',
    quantityAvailable: parseInt(fields[FIELDS.INVENTORY.QUANTITY_AVAILABLE] || '0'),
    quantityReserved: parseInt(fields[FIELDS.INVENTORY.QUANTITY_RESERVED] || '0'),
    reorderLevel: parseInt(fields[FIELDS.INVENTORY.REORDER_LEVEL] || '0'),
    supplier: fields[FIELDS.INVENTORY.SUPPLIER],
    costPrice: fields[FIELDS.INVENTORY.COST_PRICE] ? parseFloat(fields[FIELDS.INVENTORY.COST_PRICE]) : undefined,
    lastRestocked: fields[FIELDS.INVENTORY.LAST_RESTOCKED],
    location: fields[FIELDS.INVENTORY.LOCATION]
  };
};

// Obtener inventario por producto
export const getInventoryByProduct = async (productId: string): Promise<InventoryItem | null> => {
  try {
    const records = await base(TABLES.INVENTORY)
      .select({
        filterByFormula: `{${FIELDS.INVENTORY.PRODUCT_ID}} = '${productId}'`,
        maxRecords: 1
      })
      .all();

    if (records.length === 0) return null;
    
    return airtableToInventoryItem(records[0]);

  } catch (error) {
    airtableUtils.handleError(error);
    return null;
  }
};

// Verificar disponibilidad de stock
export const checkStockAvailability = async (productId: string, requestedQuantity: number): Promise<{
  available: boolean;
  availableQuantity: number;
  needsReorder: boolean;
}> => {
  try {
    const inventory = await getInventoryByProduct(productId);
    
    if (!inventory) {
      return {
        available: false,
        availableQuantity: 0,
        needsReorder: true
      };
    }

    const availableQuantity = inventory.quantityAvailable - inventory.quantityReserved;
    const available = availableQuantity >= requestedQuantity;
    const needsReorder = inventory.quantityAvailable <= inventory.reorderLevel;

    return {
      available,
      availableQuantity,
      needsReorder
    };

  } catch (error) {
    airtableUtils.handleError(error);
    return {
      available: false,
      availableQuantity: 0,
      needsReorder: true
    };
  }
};

// Reservar stock para una orden
export const reserveStock = async (productId: string, quantity: number, orderId: string): Promise<boolean> => {
  try {
    const inventory = await getInventoryByProduct(productId);
    if (!inventory) return false;

    const availableQuantity = inventory.quantityAvailable - inventory.quantityReserved;
    if (availableQuantity < quantity) return false;

    // Actualizar cantidad reservada
    await base(TABLES.INVENTORY).update(inventory.id, {
      [FIELDS.INVENTORY.QUANTITY_RESERVED]: inventory.quantityReserved + quantity
    });

    // Registrar movimiento de stock
    await logStockMovement({
      productId,
      type: 'RESERVED',
      quantity,
      reason: `Stock reservado para orden ${orderId}`,
      orderId
    });

    return true;

  } catch (error) {
    airtableUtils.handleError(error);
    return false;
  }
};

// Liberar stock reservado (orden cancelada)
export const releaseReservedStock = async (productId: string, quantity: number, orderId: string): Promise<boolean> => {
  try {
    const inventory = await getInventoryByProduct(productId);
    if (!inventory) return false;

    // Actualizar cantidad reservada
    await base(TABLES.INVENTORY).update(inventory.id, {
      [FIELDS.INVENTORY.QUANTITY_RESERVED]: Math.max(0, inventory.quantityReserved - quantity)
    });

    // Registrar movimiento de stock
    await logStockMovement({
      productId,
      type: 'RELEASED',
      quantity,
      reason: `Stock liberado de orden cancelada ${orderId}`,
      orderId
    });

    return true;

  } catch (error) {
    airtableUtils.handleError(error);
    return false;
  }
};

// Confirmar venta (reducir stock disponible y reservado)
export const confirmSale = async (productId: string, quantity: number, orderId: string): Promise<boolean> => {
  try {
    const inventory = await getInventoryByProduct(productId);
    if (!inventory) return false;

    // Reducir tanto el stock disponible como el reservado
    await base(TABLES.INVENTORY).update(inventory.id, {
      [FIELDS.INVENTORY.QUANTITY_AVAILABLE]: Math.max(0, inventory.quantityAvailable - quantity),
      [FIELDS.INVENTORY.QUANTITY_RESERVED]: Math.max(0, inventory.quantityReserved - quantity)
    });

    // Actualizar estado del producto si se agota
    const newQuantity = inventory.quantityAvailable - quantity;
    if (newQuantity <= 0) {
      await base(TABLES.PRODUCTS).update(productId, {
        [FIELDS.PRODUCTS.IN_STOCK]: false,
        [FIELDS.PRODUCTS.STOCK_QUANTITY]: 0
      });
    } else {
      await base(TABLES.PRODUCTS).update(productId, {
        [FIELDS.PRODUCTS.STOCK_QUANTITY]: newQuantity
      });
    }

    // Registrar movimiento de stock
    await logStockMovement({
      productId,
      type: 'OUT',
      quantity,
      reason: `Venta confirmada - Orden ${orderId}`,
      orderId
    });

    return true;

  } catch (error) {
    airtableUtils.handleError(error);
    return false;
  }
};

// Reabastecer inventario
export const restockInventory = async (
  productId: string, 
  quantity: number, 
  costPrice?: number,
  supplier?: string,
  notes?: string
): Promise<boolean> => {
  try {
    const inventory = await getInventoryByProduct(productId);
    
    if (!inventory) {
      // Crear nuevo registro de inventario
      await base(TABLES.INVENTORY).create({
        [FIELDS.INVENTORY.PRODUCT_ID]: productId,
        [FIELDS.INVENTORY.QUANTITY_AVAILABLE]: quantity,
        [FIELDS.INVENTORY.QUANTITY_RESERVED]: 0,
        [FIELDS.INVENTORY.REORDER_LEVEL]: 5, // Default
        [FIELDS.INVENTORY.SUPPLIER]: supplier || '',
        [FIELDS.INVENTORY.COST_PRICE]: costPrice || 0,
        [FIELDS.INVENTORY.LAST_RESTOCKED]: new Date().toISOString(),
        [FIELDS.INVENTORY.LOCATION]: 'Almacén Principal'
      });
    } else {
      // Actualizar inventario existente
      const updateData: any = {
        [FIELDS.INVENTORY.QUANTITY_AVAILABLE]: inventory.quantityAvailable + quantity,
        [FIELDS.INVENTORY.LAST_RESTOCKED]: new Date().toISOString()
      };

      if (costPrice) updateData[FIELDS.INVENTORY.COST_PRICE] = costPrice;
      if (supplier) updateData[FIELDS.INVENTORY.SUPPLIER] = supplier;

      await base(TABLES.INVENTORY).update(inventory.id, updateData);
    }

    // Actualizar producto como disponible
    await base(TABLES.PRODUCTS).update(productId, {
      [FIELDS.PRODUCTS.IN_STOCK]: true,
      [FIELDS.PRODUCTS.STOCK_QUANTITY]: (inventory?.quantityAvailable || 0) + quantity
    });

    // Registrar movimiento de stock
    await logStockMovement({
      productId,
      type: 'IN',
      quantity,
      reason: `Reabastecimiento de inventario${supplier ? ` - ${supplier}` : ''}`,
      notes
    });

    return true;

  } catch (error) {
    airtableUtils.handleError(error);
    return false;
  }
};

// Ajuste manual de inventario
export const adjustInventory = async (
  productId: string, 
  newQuantity: number, 
  reason: string,
  notes?: string
): Promise<boolean> => {
  try {
    const inventory = await getInventoryByProduct(productId);
    if (!inventory) return false;

    const currentQuantity = inventory.quantityAvailable;
    const difference = newQuantity - currentQuantity;

    // Actualizar inventario
    await base(TABLES.INVENTORY).update(inventory.id, {
      [FIELDS.INVENTORY.QUANTITY_AVAILABLE]: newQuantity
    });

    // Actualizar producto
    await base(TABLES.PRODUCTS).update(productId, {
      [FIELDS.PRODUCTS.IN_STOCK]: newQuantity > 0,
      [FIELDS.PRODUCTS.STOCK_QUANTITY]: newQuantity
    });

    // Registrar movimiento de stock
    await logStockMovement({
      productId,
      type: 'ADJUSTMENT',
      quantity: Math.abs(difference),
      reason: `Ajuste de inventario: ${reason}`,
      notes: `Cantidad anterior: ${currentQuantity}, Nueva cantidad: ${newQuantity}${notes ? ` - ${notes}` : ''}`
    });

    return true;

  } catch (error) {
    airtableUtils.handleError(error);
    return false;
  }
};

// Obtener productos con bajo stock
export const getLowStockProducts = async (): Promise<InventoryItem[]> => {
  try {
    const records = await base(TABLES.INVENTORY)
      .select({
        filterByFormula: `{${FIELDS.INVENTORY.QUANTITY_AVAILABLE}} <= {${FIELDS.INVENTORY.REORDER_LEVEL}}`
      })
      .all();

    return records.map(airtableToInventoryItem);

  } catch (error) {
    airtableUtils.handleError(error);
    return [];
  }
};

// Obtener productos sin stock
export const getOutOfStockProducts = async (): Promise<InventoryItem[]> => {
  try {
    const records = await base(TABLES.INVENTORY)
      .select({
        filterByFormula: `{${FIELDS.INVENTORY.QUANTITY_AVAILABLE}} = 0`
      })
      .all();

    return records.map(airtableToInventoryItem);

  } catch (error) {
    airtableUtils.handleError(error);
    return [];
  }
};

// Registrar movimiento de stock (función interna)
const logStockMovement = async (movement: StockMovement): Promise<void> => {
  try {
    // Aquí podrías crear una tabla separada para movimientos de stock
    // Por ahora solo lo logueamos
    console.log('Stock Movement:', {
      ...movement,
      timestamp: new Date().toISOString()
    });

    // Si quieres crear una tabla de movimientos:
    /*
    await base('Stock_Movements').create({
      'Product_ID': movement.productId,
      'Type': movement.type,
      'Quantity': movement.quantity,
      'Reason': movement.reason,
      'Order_ID': movement.orderId || '',
      'Notes': movement.notes || '',
      'Timestamp': new Date().toISOString()
    });
    */

  } catch (error) {
    console.error('Error logging stock movement:', error);
  }
};

// Obtener estadísticas de inventario
export const getInventoryStats = async () => {
  try {
    const records = await base(TABLES.INVENTORY)
      .select({
        fields: [
          FIELDS.INVENTORY.QUANTITY_AVAILABLE,
          FIELDS.INVENTORY.QUANTITY_RESERVED,
          FIELDS.INVENTORY.REORDER_LEVEL,
          FIELDS.INVENTORY.COST_PRICE
        ]
      })
      .all();

    const totalProducts = records.length;
    const totalValue = records.reduce((sum, record) => {
      const quantity = parseInt(record.fields[FIELDS.INVENTORY.QUANTITY_AVAILABLE] || '0');
      const cost = parseFloat(record.fields[FIELDS.INVENTORY.COST_PRICE] || '0');
      return sum + (quantity * cost);
    }, 0);

    const lowStockCount = records.filter(record => {
      const available = parseInt(record.fields[FIELDS.INVENTORY.QUANTITY_AVAILABLE] || '0');
      const reorderLevel = parseInt(record.fields[FIELDS.INVENTORY.REORDER_LEVEL] || '0');
      return available <= reorderLevel;
    }).length;

    const outOfStockCount = records.filter(record => {
      const available = parseInt(record.fields[FIELDS.INVENTORY.QUANTITY_AVAILABLE] || '0');
      return available === 0;
    }).length;

    const totalReserved = records.reduce((sum, record) => {
      return sum + parseInt(record.fields[FIELDS.INVENTORY.QUANTITY_RESERVED] || '0');
    }, 0);

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      totalReserved,
      inventoryTurnover: 0 // Calcularías esto con datos de ventas
    };

  } catch (error) {
    airtableUtils.handleError(error);
    return null;
  }
};

// Exportar múltiples productos para reabastecimiento
export const bulkRestockProducts = async (
  restockItems: Array<{
    productId: string;
    quantity: number;
    costPrice?: number;
    supplier?: string;
  }>
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const item of restockItems) {
    const result = await restockInventory(
      item.productId,
      item.quantity,
      item.costPrice,
      item.supplier,
      'Reabastecimiento en lote'
    );

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
};

// Verificar inventario para múltiples productos (útil para carrito)
export const checkMultipleProductsStock = async (
  items: Array<{ productId: string; quantity: number }>
): Promise<Array<{
  productId: string;
  available: boolean;
  availableQuantity: number;
  requestedQuantity: number;
}>> => {
  const results = [];

  for (const item of items) {
    const stockCheck = await checkStockAvailability(item.productId, item.quantity);
    results.push({
      productId: item.productId,
      available: stockCheck.available,
      availableQuantity: stockCheck.availableQuantity,
      requestedQuantity: item.quantity
    });
  }

  return results;
};