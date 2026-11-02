import { Injectable } from '@nestjs/common';
import { SessionUser } from '../auth/auth.types';
import { InicioRepository } from './inicio.repository';
@Injectable()
export class InicioService {
  constructor(private readonly repository: InicioRepository) {}
  summary(user: SessionUser) { return this.repository.summary(user.id, user.rol); }
}
