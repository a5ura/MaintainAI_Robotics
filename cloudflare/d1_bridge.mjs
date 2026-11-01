// LOCAL CONTRACT HARNESS ONLY. Never publish this arbitrary-SQL transport.
export default {
  async fetch(request, env) {
    if (env.LOCAL_CONTRACT_ONLY !== '1') return new Response('Local harness disabled', {status:503});
    if (request.method !== 'POST' || request.headers.get('X-Local-Contract') !== 'phase-a') return new Response('Not found',{status:404});
    try {
      const {statements} = await request.json();
      if (!Array.isArray(statements) || statements.length > 100) return Response.json({error:'Invalid local batch'},{status:400});
      const prepared = statements.map(s=>env.DB.prepare(s.sql).bind(...s.params));
      const results = await env.DB.batch(prepared);
      return Response.json({results});
    } catch(error) { return Response.json({error:String(error.message)},{status:400}); }
  }
};
