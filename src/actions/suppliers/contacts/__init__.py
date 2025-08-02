# Server Actions para gestión de contactos de proveedores

from .create import createSupplierContact
from .update import updateSupplierContact, updateContactStatus, setPrimaryContact
from .delete import (
    deleteSupplierContact, 
    deleteSupplierContactAction,
    bulkDeleteContacts,
    bulkActivateContacts,
    bulkDeactivateContacts
)
from .list import (
    getSupplierContacts,
    getSupplierContact,
    getPrimaryContact,
    getActiveContacts,
    searchContacts,
    ContactFilters,
    ContactListParams
)

__all__ = [
    # Crear
    'createSupplierContact',
    
    # Actualizar
    'updateSupplierContact',
    'updateContactStatus',
    'setPrimaryContact',
    
    # Eliminar
    'deleteSupplierContact',
    'deleteSupplierContactAction',
    'bulkDeleteContacts',
    'bulkActivateContacts',
    'bulkDeactivateContacts',
    
    # Listar
    'getSupplierContacts',
    'getSupplierContact',
    'getPrimaryContact',
    'getActiveContacts',
    'searchContacts',
    
    # Tipos
    'ContactFilters',
    'ContactListParams'
] 