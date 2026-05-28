const GET = ({ params, redirect }) => {
  const query = params.game ? `?${encodeURIComponent(params.game)}` : "";
  return redirect(`/emulator${query}`, 301);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
