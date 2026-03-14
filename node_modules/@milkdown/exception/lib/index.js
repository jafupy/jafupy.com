var ErrorCode = /* @__PURE__ */ ((ErrorCode2) => {
  ErrorCode2["docTypeError"] = "docTypeError";
  ErrorCode2["contextNotFound"] = "contextNotFound";
  ErrorCode2["timerNotFound"] = "timerNotFound";
  ErrorCode2["ctxCallOutOfScope"] = "ctxCallOutOfScope";
  ErrorCode2["createNodeInParserFail"] = "createNodeInParserFail";
  ErrorCode2["stackOverFlow"] = "stackOverFlow";
  ErrorCode2["parserMatchError"] = "parserMatchError";
  ErrorCode2["serializerMatchError"] = "serializerMatchError";
  ErrorCode2["getAtomFromSchemaFail"] = "getAtomFromSchemaFail";
  ErrorCode2["expectDomTypeError"] = "expectDomTypeError";
  ErrorCode2["callCommandBeforeEditorView"] = "callCommandBeforeEditorView";
  ErrorCode2["missingRootElement"] = "missingRootElement";
  ErrorCode2["missingNodeInSchema"] = "missingNodeInSchema";
  ErrorCode2["missingMarkInSchema"] = "missingMarkInSchema";
  ErrorCode2["ctxNotBind"] = "ctxNotBind";
  ErrorCode2["missingYjsDoc"] = "missingYjsDoc";
  return ErrorCode2;
})(ErrorCode || {});
class MilkdownError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MilkdownError";
    this.code = code;
  }
}
const functionReplacer = (_, value) => typeof value === "function" ? "[Function]" : value;
const stringify = (x) => JSON.stringify(x, functionReplacer);
function docTypeError(type) {
  return new MilkdownError(
    ErrorCode.docTypeError,
    `Doc type error, unsupported type: ${stringify(type)}`
  );
}
function contextNotFound(name) {
  return new MilkdownError(
    ErrorCode.contextNotFound,
    `Context "${name}" not found, do you forget to inject it?`
  );
}
function timerNotFound(name) {
  return new MilkdownError(
    ErrorCode.timerNotFound,
    `Timer "${name}" not found, do you forget to record it?`
  );
}
function ctxCallOutOfScope() {
  return new MilkdownError(
    ErrorCode.ctxCallOutOfScope,
    "Should not call a context out of the plugin."
  );
}
function createNodeInParserFail(nodeType, attrs, content) {
  const nodeTypeName = "name" in nodeType ? nodeType.name : nodeType;
  const heading = `Cannot create node for ${nodeTypeName}`;
  const serialize = (x) => {
    if (x == null) return "null";
    if (Array.isArray(x)) {
      return `[${x.map(serialize).join(", ")}]`;
    }
    if (typeof x === "object") {
      if ("toJSON" in x && typeof x.toJSON === "function") {
        return JSON.stringify(x.toJSON());
      }
      if ("spec" in x) {
        return JSON.stringify(x.spec);
      }
      return JSON.stringify(x);
    }
    if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") {
      return JSON.stringify(x);
    }
    if (typeof x === "function") {
      return `[Function: ${x.name || "anonymous"}]`;
    }
    try {
      return String(x);
    } catch {
      return "[Unserializable]";
    }
  };
  const headingMessage = ["[Description]", heading];
  const attrsMessage = ["[Attributes]", attrs];
  const contentMessage = [
    "[Content]",
    (content ?? []).map((node) => {
      if (!node) return "null";
      if (typeof node === "object" && "type" in node) {
        return `${node}`;
      }
      return serialize(node);
    })
  ];
  const messages = [headingMessage, attrsMessage, contentMessage].reduce(
    (acc, [title, value]) => {
      const message = `${title}: ${serialize(value)}.`;
      return acc.concat(message);
    },
    []
  );
  return new MilkdownError(
    ErrorCode.createNodeInParserFail,
    messages.join("\n")
  );
}
function stackOverFlow() {
  return new MilkdownError(
    ErrorCode.stackOverFlow,
    "Stack over flow, cannot pop on an empty stack."
  );
}
function parserMatchError(node) {
  return new MilkdownError(
    ErrorCode.parserMatchError,
    `Cannot match target parser for node: ${stringify(node)}.`
  );
}
function serializerMatchError(node) {
  return new MilkdownError(
    ErrorCode.serializerMatchError,
    `Cannot match target serializer for node: ${stringify(node)}.`
  );
}
function getAtomFromSchemaFail(type, name) {
  return new MilkdownError(
    ErrorCode.getAtomFromSchemaFail,
    `Cannot get ${type}: ${name} from schema.`
  );
}
function expectDomTypeError(node) {
  return new MilkdownError(
    ErrorCode.expectDomTypeError,
    `Expect to be a dom, but get: ${stringify(node)}.`
  );
}
function callCommandBeforeEditorView() {
  return new MilkdownError(
    ErrorCode.callCommandBeforeEditorView,
    "You're trying to call a command before editor view initialized, make sure to get commandManager from ctx after editor view has been initialized"
  );
}
function missingRootElement() {
  return new MilkdownError(
    ErrorCode.missingRootElement,
    "Missing root element, milkdown cannot find root element of the editor."
  );
}
function missingNodeInSchema(name) {
  return new MilkdownError(
    ErrorCode.missingNodeInSchema,
    `Missing node in schema, milkdown cannot find "${name}" in schema.`
  );
}
function missingMarkInSchema(name) {
  return new MilkdownError(
    ErrorCode.missingMarkInSchema,
    `Missing mark in schema, milkdown cannot find "${name}" in schema.`
  );
}
function ctxNotBind() {
  return new MilkdownError(
    ErrorCode.ctxNotBind,
    "Context not bind, please make sure the plugin has been initialized."
  );
}
function missingYjsDoc() {
  return new MilkdownError(
    ErrorCode.missingYjsDoc,
    "Missing yjs doc, please make sure you have bind one."
  );
}
export {
  callCommandBeforeEditorView,
  contextNotFound,
  createNodeInParserFail,
  ctxCallOutOfScope,
  ctxNotBind,
  docTypeError,
  expectDomTypeError,
  getAtomFromSchemaFail,
  missingMarkInSchema,
  missingNodeInSchema,
  missingRootElement,
  missingYjsDoc,
  parserMatchError,
  serializerMatchError,
  stackOverFlow,
  timerNotFound
};
//# sourceMappingURL=index.js.map
