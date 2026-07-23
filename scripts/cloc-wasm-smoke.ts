import { MemoryFileSystem, ZeroPerl } from "@6over3/zeroperl-ts";

const clocResponse = await fetch(
  "https://raw.githubusercontent.com/AlDanial/cloc/v2.08/cloc",
);
if (!clocResponse.ok) {
  throw new Error(`Could not fetch cloc: ${clocResponse.status}`);
}

const clocSource = (await clocResponse.text())
  .replace("use Encode qw( encode );", "sub encode { return $_[1]; }")
  .replace(
    "use POSIX qw { strftime ceil};",
    "sub ceil { my $x = shift; my $i = int($x); return $x == $i ? $i : $i + ($x > 0 ? 1 : 0); }\nsub strftime { return ''; }",
  )
  .replaceAll(
    "use Encode;",
    "# Encode unavailable under ZeroPerl; PAR::Packer workaround disabled.",
  );
const fileSystem = new MemoryFileSystem({ "/": "" });
fileSystem.addFile("/cloc", clocSource);
fileSystem.addFile(
  "/repo/src/main.rs",
  'fn main() {\n    println!("hello");\n}\n',
);
fileSystem.addFile(
  "/repo/src/lib.rs",
  "// smoke test\npub fn answer() -> u8 {\n    42\n}\n",
);

let stdout = "";
let stderr = "";
const decoder = new TextDecoder();
const decode = (value: string | Uint8Array) =>
  typeof value === "string" ? value : decoder.decode(value);

const perl = await ZeroPerl.create({
  fileSystem,
  stdout: (value) => {
    stdout += decode(value);
  },
  stderr: (value) => {
    stderr += decode(value);
  },
});

try {
  const result = await perl.runFile("/cloc", ["/repo"]);
  perl.flush();

  if (!result.success) {
    throw new Error(result.error || `cloc exited with ${result.exitCode}`);
  }
  if (!/^SUM:\s+/m.test(stdout)) {
    throw new Error(`cloc produced no SUM row.\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  }

  process.stdout.write(stdout);
} finally {
  perl.dispose();
}
