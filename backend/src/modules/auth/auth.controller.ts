import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { IsString, Length, Matches } from 'class-validator';
import type { Response } from 'express';
import { AuthService, cookieToken, SESSION_COOKIE } from './auth.service';
import { AuthRequest } from './auth.types';
import { Public } from './auth.guard';

class LoginDto {
  @IsString() @Length(1,80) @Matches(/\S/) username!: string;
  @IsString() @Length(1,256) password!: string;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Post('login') @HttpCode(200)
  async login(@Body() body: LoginDto, @Req() request: AuthRequest, @Res({passthrough:true}) response: Response) {
    const result = await this.auth.login(body.username,body.password,request.ip ?? 'unknown',cookieToken(request.headers.cookie));
    response.cookie(SESSION_COOKIE,result.token,{ httpOnly:true, sameSite:'strict', secure:process.env.NODE_ENV==='production', path:'/', maxAge:8*60*60*1000 });
    return { user:result.user };
  }
  @Get('me')
  me(@Req() request: AuthRequest) { return { user:request.user }; }
  @Public() @Post('logout') @HttpCode(204)
  async logout(@Req() request: AuthRequest, @Res({passthrough:true}) response: Response) {
    await this.auth.logout(cookieToken(request.headers.cookie));
    response.clearCookie(SESSION_COOKIE,{ httpOnly:true, sameSite:'strict', secure:process.env.NODE_ENV==='production', path:'/' });
  }
}
