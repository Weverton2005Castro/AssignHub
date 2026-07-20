import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

@ApiTags('payment-methods')
@ApiBearerAuth()
@Controller({ path: 'payment-methods', version: '1' })
export class PaymentMethodsController {
  constructor(private readonly paymentMethods: PaymentMethodsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.paymentMethods.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethods.create(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.paymentMethods.remove(user.id, id);
  }
}
