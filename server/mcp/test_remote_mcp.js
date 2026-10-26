import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function main() {
  console.log('--- Conectando al servidor MCP Remoto en la Nube (Vercel) ---');
  const transport = new SSEClientTransport(new URL('https://goglite-agency.vercel.app/mcp'));
  const client = new Client(
    { name: 'test-remote-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('✅ Conexión SSE establecida con https://goglite-agency.vercel.app/mcp');

  console.log('\n--- Probando get_agency_branding ---');
  const brandingRes = await client.callTool({
    name: 'get_agency_branding',
    arguments: {}
  });
  console.log('Resultado get_agency_branding:\n', JSON.stringify(brandingRes, null, 2));

  console.log('\n--- Probando get_service_catalog ---');
  const catalogRes = await client.callTool({
    name: 'get_service_catalog',
    arguments: {}
  });
  console.log('Resultado get_service_catalog:\n', JSON.stringify(catalogRes, null, 2));

  await client.close();
  console.log('\n✅ Prueba completada con éxito.');
}

main().catch(err => {
  console.error('❌ Error en prueba MCP:', err);
  process.exit(1);
});
