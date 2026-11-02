import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';

@Module({ imports:[DatabaseModule], controllers:[AuthController], providers:[AuthRepository,AuthService,{provide:APP_GUARD,useClass:AuthGuard}], exports:[AuthService] })
export class AuthModule {}
