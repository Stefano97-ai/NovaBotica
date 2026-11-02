import { Controller, Get, Req } from '@nestjs/common';
import { Roles } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth.types';
import { InicioService } from './inicio.service';
@Controller('inicio')
@Roles('ADMINISTRADOR','VENDEDOR','ALMACENERO')
export class InicioController {
  constructor(private readonly service: InicioService) {}
  @Get() summary(@Req() request: AuthRequest) { return this.service.summary(request.user!); }
}
