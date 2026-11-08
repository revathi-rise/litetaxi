import { Controller, Post, Get, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RazorpayService } from './razorpay.service';
import { CreateRazorpayOrderDto, VerifyRazorpayPaymentDto } from '../common/dto';
import { AuthUser, CurrentUser, Public } from '../auth/auth.guard';

@ApiTags('payments')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private razorpay: RazorpayService) {}

  @Public()
  @Get('razorpay/config')
  getConfig() {
    return this.razorpay.getPublicConfig();
  }

  @ApiBearerAuth()
  @Post('razorpay/order')
  @HttpCode(200)
  createOrder(@Body() dto: CreateRazorpayOrderDto, @CurrentUser() u: AuthUser) {
    return this.razorpay.createOrder(u.id, dto.amount, dto.purpose, {
      bookingId: dto.bookingId,
      subscriptionTier: dto.subscriptionTier,
    });
  }

  @ApiBearerAuth()
  @Post('razorpay/verify')
  @HttpCode(200)
  verifyPayment(@Body() dto: VerifyRazorpayPaymentDto, @CurrentUser() u: AuthUser) {
    return this.razorpay.verifyPayment(
      u.id,
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature
    );
  }

  @ApiBearerAuth()
  @Get('transactions')
  getTransactions(@CurrentUser() u: AuthUser) {
    return this.razorpay.getTransactions(u.id);
  }
}
