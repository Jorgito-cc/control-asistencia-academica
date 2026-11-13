import { Body, Controller, Get, Header, Headers, HttpCode, Post } from '@nestjs/common';
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';
import { Public } from '../../../../shared/infrastructure/security/decorators';
import { AdminInvitationsService } from '../persistence/admin-invitations.service';

class BootstrapInvitationDto {
  @IsString()
  @MaxLength(63)
  slug: string;

  @IsEmail({}, { message: 'Ingresa un correo válido' })
  @MaxLength(150)
  email: string;

  @IsString()
  @MaxLength(150)
  name: string;
}

class ActivateInvitationDto {
  @Matches(/^[A-Za-z0-9_-]{43}$/, { message: 'La invitación no es válida' })
  token: string;

  @IsString()
  @MaxLength(72)
  password: string;
}

@Controller('auth/invitations')
@Public()
export class AdminInvitationsController {
  constructor(private readonly invitations: AdminInvitationsService) {}

  @Get('status')
  @Header('Cache-Control', 'no-store')
  status() {
    return this.invitations.status();
  }

  @Post('bootstrap')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  bootstrap(@Headers('authorization') authorization: string | undefined, @Body() body: BootstrapInvitationDto) {
    return this.invitations.bootstrap(authorization, body);
  }

  @Post('activate')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  activate(@Body() body: ActivateInvitationDto) {
    return this.invitations.activate(body.token, body.password);
  }
}
