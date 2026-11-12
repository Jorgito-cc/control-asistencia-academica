import { IsEmail, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class AdminLoginDto {
  @IsEmail({}, { message: 'Ingresa un correo válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Ingresa tu contraseña' })
  password: string;
}

export class StudentLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Ingresa tu correo o número de registro' })
  @MaxLength(150)
  identifier: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  moduleId?: number;
}
