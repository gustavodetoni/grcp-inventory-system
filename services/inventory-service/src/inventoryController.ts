import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const NOTIFICATION_PROTO_PATH = path.join(__dirname, '../../proto/notification.proto');
const notificationDef = protoLoader.loadSync(NOTIFICATION_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const notificationProto = grpc.loadPackageDefinition(notificationDef) as any;

const notificationClient = new notificationProto.notification.NotificationService(
  'notification-service:50053', 
  grpc.credentials.createInsecure()
);

const alertStream = notificationClient.StreamLowStock();

export const inventoryController = {
  CheckStock: async (
    call: ServerUnaryCall<{ productId: string }, { inStock: boolean, quantityAvailable: number }>,
    callback: sendUnaryData<{ inStock: boolean, quantityAvailable: number }>
  ) => {
    const product = await prisma.product.findUnique({
      where: { id: call.request.productId }
    });

    callback(null, {
      inStock: !!product && product.quantity > 0,
      quantityAvailable: product?.quantity || 0
    });
  },

  UpdateStock: async (
    call: ServerUnaryCall<{ productId: string, quantity: number }, { success: boolean }>,
    callback: sendUnaryData<{ success: boolean }>
  ) => {
    const { productId, quantity } = call.request;
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (product && product.quantity >= quantity) {
      const updated = await prisma.product.update({
        where: { id: productId },
        data: { quantity: product.quantity - quantity }
      });

      if (updated.quantity < 10) {
        alertStream.write({
          productId: updated.id,
          name: updated.name,
          quantity: updated.quantity
        });
      }
      
      callback(null, { success: true });
    } else {
      callback(null, { success: false });
    }
  },

  ListLowStockProducts: async (
    _call: ServerUnaryCall<{}, { products: { productId: string, name: string, quantity: number }[] }>,
    callback: sendUnaryData<{ products: { productId: string, name: string, quantity: number }[] }>
  ) => {
    const lowStockProducts = await prisma.product.findMany({
      where: { quantity: { lt: 10 } }
    });

    const formatted = lowStockProducts.map(p => ({
      productId: p.id,
      name: p.name,
      quantity: p.quantity
    }));

    callback(null, { products: formatted });
  }
};
