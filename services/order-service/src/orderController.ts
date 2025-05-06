import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const INVENTORY_PROTO_PATH = path.resolve('proto/inventory.proto')
const packageDef = protoLoader.loadSync(INVENTORY_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const inventoryProto = grpc.loadPackageDefinition(packageDef) as any;
const inventoryClient = new inventoryProto.inventory.InventoryService(
  'inventory-service:50051', grpc.credentials.createInsecure()
);

export const orderController = {
  PlaceOrder: (
    call: ServerUnaryCall<{ productId: string, quantity: number }, { success: boolean, message: string }>,
    callback: sendUnaryData<{ success: boolean, message: string }>
  ) => {
    const { productId, quantity } = call.request;

    inventoryClient.CheckStock({ productId }, (err: any, res: any) => {
      if (err) {
        return callback(err, { success: false, message: 'Erro ao verificar estoque' });
      }

      if (!res.inStock || res.quantityAvailable < quantity) {
        return callback(null, {
          success: false,
          message: `Estoque insuficiente. Disponível: ${res.quantityAvailable}`
        });
      }

      inventoryClient.UpdateStock({ productId, quantity }, (err2: any, res2: any) => {
        if (err2 || !res2.success) {
          return callback(null, { success: false, message: 'Erro ao atualizar estoque' });
        }

        return callback(null, { success: true, message: 'Pedido confirmado com sucesso!' });
      });
    });
  }
};
