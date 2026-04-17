export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-black/[0.06] bg-white px-6 py-8 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          Inloggen
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Magic link en formulier volgen in een volgende stap (taak 2.0).
          Placeholder zodat{" "}
          <code className="rounded bg-black/[0.04] px-1 py-0.5 text-xs">/</code>{" "}
          naar deze pagina doorverwijst.
        </p>
      </div>
    </div>
  );
}
