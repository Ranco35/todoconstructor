# Server Actions del módulo de proveedores
from .create import createSupplier
from .list import getSuppliers, getSupplierStats, getSupplierById, searchSuppliersByName
from .update import updateSupplier, updateSupplierStatus, updateSupplierRanking, updateSupplierCreditLimit
from .delete import (
    deleteSupplier, 
    deleteSupplierAction, 
    softDeleteSupplier, 
    restoreSupplier,
    bulkDeleteSuppliers,
    bulkSoftDeleteSuppliers,
    bulkRestoreSuppliers
)

__all__ = [
    # Crear
    'createSupplier',
    
    # Listar y buscar
    'getSuppliers',
    'getSupplierStats', 
    'getSupplierById',
    'searchSuppliersByName',
    
    # Actualizar
    'updateSupplier',
    'updateSupplierStatus',
    'updateSupplierRanking',
    'updateSupplierCreditLimit',
    
    # Eliminar
    'deleteSupplier',
    'deleteSupplierAction',
    'softDeleteSupplier',
    'restoreSupplier',
    'bulkDeleteSuppliers',
    'bulkSoftDeleteSuppliers',
    'bulkRestoreSuppliers',
] 