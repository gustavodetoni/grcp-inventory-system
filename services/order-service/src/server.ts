import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(__dirname, '../../proto/notification.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
const notificationPackage = grpcObject.notification;

const notificationService = {
  StreamLowStock: (call: grpc.ServerWritableStream<any, any>) => {
    call.on('data', (alert: any) => {
      console.log(`Alerta de estoque baixo: [${alert.productId}] ${alert.name} - Qtd: ${alert.quantity}`);
    });

    call.on('end', () => {
      call.write({ status: 'Alerta recebido com sucesso' });
      call.end();
    });
  }
};

const server = new grpc.Server();
server.addService(notificationPackage.NotificationService.service, notificationService);

const PORT = 50053;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`Notification service is running: http://localhost:${PORT}`);
});
