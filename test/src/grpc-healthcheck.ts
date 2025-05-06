import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

type CheckResult = {
  service: string;
  method: string;
  status: '✅ OK' | '❌ Erro';
  message?: string;
};

const services = [
  {
    name: 'InventoryService',
    protoPath: '../../proto/inventory.proto',
    address: 'localhost:50051',
    methods: ['CheckStock', 'UpdateStock', 'ListLowStockProducts']
  },
  {
    name: 'OrderService',
    protoPath: '../../proto/order.proto',
    address: 'localhost:50052',
    methods: ['PlaceOrder']
  },
  {
    name: 'NotificationService',
    protoPath: '../../proto/notification.proto',
    address: 'localhost:50053',
    methods: ['StreamLowStock']
  }
];

async function loadService(protoPath: string) {
  const fullPath = path.resolve(__dirname, protoPath);
  const packageDef = protoLoader.loadSync(fullPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
  return grpc.loadPackageDefinition(packageDef) as any;
}

async function checkService(service: typeof services[0]): Promise<CheckResult[]> {
  const { name, protoPath, address, methods } = service;

  try {
    const grpcObject = await loadService(protoPath);
    const pkgName = name.replace('Service', '').toLowerCase();
    const pkg = grpcObject[pkgName];
    const client = new pkg[name](address, grpc.credentials.createInsecure());

    const results = await Promise.all<CheckResult>(
      methods.map(method =>
        new Promise<CheckResult>(resolve => {
          const dummyData = {};
          const call = client[method];

          if (!call) {
            return resolve({
              service: name,
              method,
              status: '❌ Erro',
              message: 'Método não encontrado'
            });
          }

          try {
            client[method](dummyData, (err: any, _res: any) => {
              if (err && err.code !== grpc.status.INVALID_ARGUMENT && err.code !== grpc.status.INTERNAL) {
                resolve({
                  service: name,
                  method,
                  status: '❌ Erro',
                  message: err.message
                });
              } else {
                resolve({
                  service: name,
                  method,
                  status: '✅ OK'
                });
              }
            });
          } catch (e: any) {
            resolve({
              service: name,
              method,
              status: '❌ Erro',
              message: e.message
            });
          }
        })
      )
    );

    return results;
  } catch (err: any) {
    return service.methods.map(method => ({
      service: name,
      method,
      status: '❌ Erro',
      message: `Erro ao carregar proto ou conectar: ${err.message}`
    }));
  }
}

async function runChecks() {
  console.log('\n🔍 gRPC Health Check\n');

  for (const service of services) {
    const results = await checkService(service);
    for (const res of results) {
      const emoji = res.status === '✅ OK' ? '✅' : '❌';
      const msg = res.message ? ` - ${res.message}` : '';
      console.log(`${emoji} ${res.service}.${res.method}${msg}`);
    }
  }

  console.log('\n✅ Verificação finalizada.\n');
}

runChecks();
