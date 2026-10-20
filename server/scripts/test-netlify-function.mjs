import { handler } from '../../netlify/functions/api.mjs';

async function runTests() {
  console.log('--- Testing Netlify Serverless Function Locally ---\n');

  // Test 1: GET /api/health
  console.log('Test 1: Invoking GET /api/health');
  const res1 = await handler({
    httpMethod: 'GET',
    path: '/api/health',
    headers: { host: 'juw-marketplace.netlify.app' },
  }, {});
  console.log('Status:', res1.statusCode);
  console.log('Headers:', res1.headers);
  console.log('Body:', res1.body);
  if (res1.statusCode !== 200) throw new Error('Test 1 failed');
  console.log('✅ Test 1 Passed\n');

  // Test 2: GET /.netlify/functions/api/health (Rewritten path normalization)
  console.log('Test 2: Invoking GET /.netlify/functions/api/health');
  const res2 = await handler({
    httpMethod: 'GET',
    path: '/.netlify/functions/api/health',
    headers: { host: 'juw-marketplace.netlify.app' },
  }, {});
  console.log('Status:', res2.statusCode);
  console.log('Body:', res2.body);
  if (res2.statusCode !== 200) throw new Error('Test 2 failed');
  console.log('✅ Test 2 Passed\n');

  // Test 3: GET /api/categories
  console.log('Test 3: Invoking GET /api/categories');
  const res3 = await handler({
    httpMethod: 'GET',
    path: '/api/categories',
    headers: {
      host: 'juw-marketplace.netlify.app',
      origin: 'https://juw-marketplace.netlify.app',
    },
  }, {});
  console.log('Status:', res3.statusCode);
  const data3 = JSON.parse(res3.body);
  console.log('Categories count:', data3.categories?.length);
  if (res3.statusCode !== 200 || !Array.isArray(data3.categories)) throw new Error('Test 3 failed');
  console.log('✅ Test 3 Passed\n');

  // Test 4: OPTIONS /api/categories (CORS preflight from Netlify domain)
  console.log('Test 4: Invoking OPTIONS /api/categories');
  const res4 = await handler({
    httpMethod: 'OPTIONS',
    path: '/api/categories',
    headers: {
      host: 'juw-marketplace.netlify.app',
      origin: 'https://juw-marketplace.netlify.app',
    },
  }, {});
  console.log('Status:', res4.statusCode);
  console.log('Allow-Origin:', res4.headers['Access-Control-Allow-Origin']);
  if (res4.statusCode !== 204 || res4.headers['Access-Control-Allow-Origin'] !== 'https://juw-marketplace.netlify.app') {
    throw new Error('Test 4 failed');
  }
  console.log('✅ Test 4 Passed\n');

  // Test 5: GET /api/catalog (Public products)
  console.log('Test 5: Invoking GET /api/catalog');
  const resCatalog = await handler({
    httpMethod: 'GET',
    path: '/api/catalog',
    headers: { host: 'juw-marketplace.netlify.app' },
  }, {});
  console.log('Status:', resCatalog.statusCode);
  const dataCatalog = JSON.parse(resCatalog.body);
  console.log('Catalog products count:', dataCatalog.products?.length);
  if (resCatalog.statusCode !== 200 || !Array.isArray(dataCatalog.products)) throw new Error('Catalog test failed');
  console.log('✅ Test 5 Passed\n');

  // Test 6: GET /api/categories/:slug
  const testCategory = data3.categories[0];
  console.log(`Test 6: Invoking GET /api/categories/${testCategory.slug}`);
  const resCatDetail = await handler({
    httpMethod: 'GET',
    path: `/api/categories/${testCategory.slug}`,
    headers: { host: 'juw-marketplace.netlify.app' },
  }, {});
  console.log('Status:', resCatDetail.statusCode);
  const catDetail = JSON.parse(resCatDetail.body);
  console.log('Category name:', catDetail.name);
  if (resCatDetail.statusCode !== 200 || catDetail.slug !== testCategory.slug) throw new Error('Category detail test failed');
  console.log('✅ Test 6 Passed\n');

  // Test 7: GET /api/orders/me without token -> 401
  console.log('Test 7: Invoking GET /api/orders/me without token');
  const resAuth = await handler({
    httpMethod: 'GET',
    path: '/api/orders/me',
    headers: { host: 'juw-marketplace.netlify.app' },
  }, {});
  console.log('Status:', resAuth.statusCode);
  console.log('Body:', resAuth.body);
  if (resAuth.statusCode !== 401) throw new Error('Auth guard test failed');
  console.log('✅ Test 7 Passed\n');

  // Test 8: Route not found 404
  console.log('Test 8: Invoking GET /api/nonexistent-route');
  const res8 = await handler({
    httpMethod: 'GET',
    path: '/api/nonexistent-route',
    headers: { host: 'juw-marketplace.netlify.app' },
  }, {});
  console.log('Status:', res8.statusCode);
  console.log('Body:', res8.body);
  if (res8.statusCode !== 404) throw new Error('Test 8 failed');
  console.log('✅ Test 8 Passed\n');

  console.log('🎉 ALL 8 LOCAL NETLIFY FUNCTION TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
