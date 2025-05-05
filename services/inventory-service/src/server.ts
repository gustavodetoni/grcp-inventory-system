import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { inventoryController } from './inventoryController';

const PROTO_PATH = path.resolve('proto/inventory.proto')

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
const inventoryPackage = grpcObject.inventory;

const server = new grpc.Server();
server.addService(inventoryPackage.InventoryService.service, inventoryController);

const PORT = 50051;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`Inventory service is runnig: inventory-service:${PORT}`);
});
