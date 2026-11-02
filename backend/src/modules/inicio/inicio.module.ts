import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { InicioController } from './inicio.controller';
import { InicioRepository } from './inicio.repository';
import { InicioService } from './inicio.service';
@Module({imports:[DatabaseModule],controllers:[InicioController],providers:[InicioRepository,InicioService]})
export class InicioModule {}
