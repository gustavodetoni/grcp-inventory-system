import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import readline from 'readline';

const PROTO_PATH = path.resolve(__dirname, '../../proto/order.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;
const orderProto = grpcObject.order;

const client = new orderProto.OrderService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n📦 Teste de Pedido via gRPC\n');

rl.question('🆔 Digite o ID do produto: ', (productId) => {
  rl.question('🔢 Digite a quantidade desejada: ', (qtyStr) => {
    const quantity = parseInt(qtyStr);

    client.PlaceOrder({ productId, quantity }, (err: grpc.ServiceError | null, response: any) => {
      if (err) {
        console.error('❌ Erro ao fazer pedido:', err.message);
      } else {
        console.log('✅ Resposta:', response);
      }

      rl.close();
    });
  });
});
