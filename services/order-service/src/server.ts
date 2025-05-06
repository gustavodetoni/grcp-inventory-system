import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { orderController } from './orderController';

const PROTO_PATH = path.resolve('proto/order.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
const orderPackage = grpcObject.order;

const server = new grpc.Server();
server.addService(orderPackage.OrderService.service, orderController);

const PORT = 50052;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`Order service is running: order-service:${PORT}`);
});
