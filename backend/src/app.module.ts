import { InicioModule } from './modules/inicio/inicio.module';
import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database/database.module';
import { HealthController } from './modules/health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ComprasModule } from './modules/compras/compras.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ComprobantesModule } from './modules/comprobantes/comprobantes.module';
import { ReportesModule } from './modules/reportes/reportes.module';

@Module({ imports: [InicioModule, DatabaseModule, AuthModule, UsuariosModule, CatalogoModule, InventarioModule, ComprasModule, ProveedoresModule, VentasModule, ClientesModule, ComprobantesModule, ReportesModule], controllers: [HealthController] })
export class AppModule {}
