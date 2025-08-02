const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // PRIMERO: Verificar si existe una cuenta
    let account = await prisma.account.findFirst();
    
    if (!account) {
      // Crear cuenta si no existe
      account = await prisma.account.create({
        data: {
          name: 'Cuenta Principal'
        }
      });
      console.log('Cuenta creada:', account);
    }

    // SEGUNDO: Verificar si existe una caja registradora con ID 1
    let cashRegister = await prisma.cashRegister.findUnique({
      where: { id: 1 }
    });
    
    if (!cashRegister) {
      // Crear caja registradora con ID específico
      cashRegister = await prisma.cashRegister.create({
        data: {
          name: 'Caja Principal',
          location: 'Oficina Principal',
          baseAmount: 0,
          cashAmount: 0
        }
      });
      console.log('Caja registradora creada:', cashRegister);
    } else {
      console.log('Caja registradora existente:', cashRegister);
    }

    // TERCERO: Verificar si ya existe el usuario
    const existingUser = await prisma.user.findFirst({
      where: { id: 1 }
    });

    if (existingUser) {
      console.log('Usuario existente encontrado:', existingUser);
      
      // Actualizar usuario para asegurar que tenga permisos de cajero
      const updatedUser = await prisma.user.update({
        where: { id: 1 },
        data: {
          isCashier: true,
          role: 'ADMINISTRADOR',
          isActive: true
        }
      });
      
      console.log('Usuario actualizado con permisos de cajero:', updatedUser);
      return updatedUser;
    }

    // Crear usuario de prueba con permisos de cajero
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@test.com',
        password: 'password123', // En producción esto debería estar hasheado
        firstName: 'Usuario',
        lastName: 'Administrador',
        role: 'ADMINISTRADOR',
        department: 'ADMINISTRACION',
        isCashier: true, // IMPORTANTE: Con permisos de cajero
        accountId: account.id
      }
    });

    console.log('Usuario creado exitosamente con permisos de cajero:', user);
    return user;

  } catch (error) {
    console.error('Error creando/actualizando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 